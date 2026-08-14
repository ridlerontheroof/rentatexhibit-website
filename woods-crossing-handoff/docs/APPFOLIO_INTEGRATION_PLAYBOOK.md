# AppFolio Integration Playbook — Woods Crossing

Everything the Exhibit On Superior site learned replicating AppFolio's lead, tour, and
availability flows directly on the website (no highlandptrs.com hop). Transfer these
patterns wholesale; only the property-specific values change.

> **Scope note:** most of this uses AppFolio's *unofficial* public listings API (the same
> endpoints AppFolio's own hosted pages call). It works, but it can change without notice —
> every integration below is built to **fail loudly** and fall back to AppFolio's hosted
> pages so prospects are never blocked.

---

## 1. Credentials & database

| Item | Value / secret |
|---|---|
| AppFolio database host | `highlandrealestatepartners.appfolio.com` — **NOT** `highlandptrs`. (Wrong host returns 302/503 and looks like an egress block. Same company database should cover Woods Crossing; confirm the property name filter.) |
| Reports API auth | HTTP Basic with `APPFOLIO_CLIENT_ID` / `APPFOLIO_CLIENT_SECRET` (re-enter as secrets in the new project; same credentials work — they're database-level). |
| Public listings API | No auth, no CSRF, no session. Server-side POSTs work bare. |

Make the database and property filter env-overridable (`APPFOLIO_DATABASE`, property-name
constant) — Woods Crossing needs `filters[property_list]=Woods Crossing` (verify exact
property name via the unit_directory report first).

## 2. Availability feed (Reports API)

- Source of truth: `POST /api/v2/reports/unit_vacancy.json` (Basic auth), proxied through
  your own API server with a ~5-minute cache. **Never call AppFolio from the browser.**
- Real column quirks: `bed_and_bath` is combined ("2/2.00"), `advertised_rent` is a string
  ("1199.00"), `available_on` is often null (fall back to `unit_turn_target_date`), and
  the report includes already-rented rows — drop `Notice-Rented` / rented statuses (~2/3
  of rows on Exhibit).
- Amenity/sqft feed values are hand-entered and sometimes wrong. Exhibit's rule: a local
  floor-plan database is the display authority for sqft via a single resolver; known-bad
  AppFolio records are whitelisted and a test fails on any NEW unexplained mismatch.
  Normalize feed typos (e.g. "Diswasher") server-side.
- Show **posted-to-website units only** (unit_directory `PostedToWebsite=Yes` OR presence
  on the public listings page); fail closed to the last good snapshot if signals are
  unavailable.
- Bake a snapshot of the feed into the build for SEO/prerendering, but refresh its
  timestamp even when data is unchanged, or a staleness guard will fail quiet-week builds.

## 3. Listing photos & detail data (public listings page scrape)

No photo fields exist anywhere in the Data API. Photos come from the public page
`https://<db>.appfolio.com/listings?filters[property_list]=<Property>`:

- Cards carry a cover photo (images.cdn.appfolio.com) + `/listings/detail/<uuid>` links.
  **Parsing trap:** each detail link appears BEFORE its card's address and twice per card —
  a greedy regex pairs one card's link with the NEXT card's data. Segment at each distinct
  link's first occurrence and read within the segment only.
- Detail pages have two CDN photo groups: `images/<uuid>/(medium|large).jpg` is the unit's
  own gallery (use this, normalized to large.jpg); `leads_marketing_photos/.../original.jpg`
  is a property-wide set identical across listings (fallback only, or every unit shows the
  same photos). Detail pages also carry `<h3>` sections (Rental Terms, Pet Policy,
  Amenities, Utilities, Appliances) worth parsing.
- Useful deep links: Apply Now = `/listings/rental_applications/new?listable_uid=<uid>&source=Website`;
  hosted scheduler = `/listings/showings/new?listable_uid=<uid>&source=Website`;
  Contact = `<listingUrl>/contact_us_form`.

## 4. Lead push (guest cards)

`POST https://<db>.appfolio.com/listings/api/guest_cards` — JSON, **snake_case only**
(`first_name`, `last_name`, `email_address`, `phone_number`, `listable_uid`, `source`).
camelCase gets a bare 400 since ~2026-07. Verified live: returns `{"guest_card_id": …}`.

Hard-won gotchas:
- **Resolve unit → listable_uid server-side** from your cached availability data. Never
  trust a client-supplied UID.
- Fire-and-forget AFTER the lead is persisted/emailed — AppFolio failure must not lose a lead.
- 422 with an empty body = creation-time validation. Multi-word FIRST names 422
  ("Mary Jane" fails); normalize by moving extra first-name words onto the last name.
  Last names with digits or parentheses 422. Synthetic email domains 422.
- **Dedupe:** repeat posts for the same email/phone return 201 with the SAME
  guest_card_id — 201 ≠ new card.
- **Spam throttle:** a burst of new-card creations makes AppFolio 422 ALL new-prospect
  creations account-wide for 35+ minutes (merges to existing cards still 201). Never read
  a 422-empty streak as contract drift, and never diagnose it by firing more probes.

## 5. Lead-source attribution

Owner-mandated label convention: source is exactly `Website (Token)`, Token =
alphanumerics/hyphens only (e.g. `Website (GoogleAds-SpringPromo)`); default
`Website (WoodsCrossing)`. Server-side `sanitizeLeadSource()` is the trust boundary
(strict regex + hard fallback). Captured once per visit from the landing URL
(`?source=` token first, then UTMs, then gclid/gbraid/wbraid → generic GoogleAds label)
into sessionStorage, injected into every lead/showing request and Apply/tour deep link.
Registrar apex→www 301s can strip query strings — ad final URLs must use `https://www.`.

## 6. Showing scheduler (real tour bookings)

Replicates AppFolio's hosted scheduler server-side:
- `GET /listings/api/listings/<uid>/availabilities` — snake_case query params (camelCase → 422).
- `POST /listings/api/showings` — snake_case body; authorized by `guest_card_id` alone
  (the old X-JWT header is gone); `end_at = start_at + prospect_scheduled_showing_duration`.
- **Slot-format drift is the #1 silent failure.** The feed switched from wall-time
  (`2026/07/30 10:30`) to ISO-with-offset + dash dates in 2026-07 and a regex-only parser
  dropped EVERY slot for weeks ("no showing times" while dozens existed). Accept both
  formats, normalize to one canonical shape, and make "raw slots > 0 but accepted == 0"
  a loud alarm (error log + daily email), never "no openings".
- **Jump-ahead guard:** don't blindly trust `first_available_date` — re-check the current
  window without the hint, jump from one day BEFORE the hint (hosted-page parity with
  `new Date("YYYY-MM-DD")` timezone behavior), and alarm if near-term days were recovered.
- Identity-verification gate: poll `/listings/api/showings_identity_verifications/status`;
  if ever `enabled:true`, return 409 + the hosted scheduler URL (Persona can't be proxied).
- **Mandatory fallback:** every server error path returns the hosted scheduler URL. But
  client 4xx rejections (bot guard) are terminal — the fallback fires only on 5xx/409.

## 7. General "just a tour" bookings

Exhibit uses a hidden real AppFolio unit named **"Tour"** — its rentable_uid works for
availabilities/booking even though it's never posted. Ask the leasing team to create the
same at Woods Crossing. Rules: the web client sends a reserved token (never a unit number);
the server resolves it via unit_directory (env-configurable names) and filters it out of
the public availability feed at one choke point; general-path fallbacks send a plain lead
with no hosted URL (the hosted page would expose "Tour" as a unit).

unit_directory parsing trap: rows list `unit_address` before `unit_name`, so fuzzy
substring field-pickers match the address — use exact field-name matching.

## 8. Emails around the flows

- AppFolio's automatic prospect emails are company-branded (Highland "Online Portal"
  template) and no API field changes that — branding is an AppFolio dashboard setting.
  Exhibit sends its own branded confirmation for general-tour bookings only; unit
  bookings stay AppFolio-owned.
- Site email goes out via Gmail SMTP app password (`GMAIL_APP_PASSWORD`,
  smtp.gmail.com:465) — reusable, but consider a Woods Crossing sender mailbox. Route
  technical/watchdog alerts to an owner alert address, real lead traffic to the leasing
  inbox — never mix.
- highlandptrs.com DNS lives in AppFolio's zone (ns*.apmdns.com) — SPF/DKIM/DMARC changes
  go there, not the registrar.

## 9. Bot guard (before any AppFolio side effect)

Every public form carries a honeypot + optional `elapsedMs`, checked server-side BEFORE
any email/lead/AppFolio call. Fake-201 detected bots on the lead route. Traps:
- Honeypot must have a **nonsense name and no label** — one named "company" got autofilled
  by Safari from real visitors' contact cards, rejecting genuine tour requests.
- `elapsedMs` measured from first keystroke and OMITTED for pure autofill; server tolerates
  its absence.
- The showing fallback must NOT re-enter rejected bots via the plain lead route.

## 10. Monitoring that proved necessary

- Daily heartbeat on the showings path; hourly watchdog probe that fails on the
  all-dropped condition AND "future availability exists but zero slots after jump-ahead".
- Once-a-day throttled alert emails per failure reason.
- "N failures in M minutes" alarms need exact per-event rows with expiry, not
  time-bucket sums (bucket approximations double-count at window edges).
- Verify guest-card `source` labels land correctly via the guest_cards Reports API
  (`POST /api/v2/reports/guest_cards.json`).
