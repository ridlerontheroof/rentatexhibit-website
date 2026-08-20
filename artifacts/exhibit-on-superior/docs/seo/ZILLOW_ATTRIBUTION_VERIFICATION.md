# Zillow lead-attribution verification

Verified on **August 20, 2026**.

## Outcome

The active Zillow property listing reaches the canonical production host, and
Zillow's referral parameter survives the redirect. The site did not previously
recognize that parameter, so an untouched Zillow visit fell back to
`Website (Exhibit)`.

The web capture now maps Zillow's live `zgRef=zillow` parameter to
`Website (Zillow)`. A browser test proved that label persists through in-site
navigation and is included in the showing-contact request. One clearly marked
production QA guest card was then accepted by AppFolio without booking a tour
or triggering the source-downgrade path.

The corrected browser capture takes effect on the public site after the next
publish.

## Link and redirect evidence

1. Active listing:
   `https://www.zillow.com/apartments/chicago-il/exhibit-on-superior/CpH5Qz/`
2. Zillow's visible **Visit Exhibit on Superior website** link points to:
   `https://www.zillow.com/renter-hub/clickRedirect?alias=27s40w0q8n04&r=zillow&mobileFriendly=true`
3. Zillow resolves that tracking URL to:
   `https://www.rentatexhibit.com/available-units?zgRef=zillow`

The final host is the canonical `www.rentatexhibit.com` host. The
`zgRef=zillow` parameter remains intact on the landing page. The apex-domain
301 was also checked separately and resolves to the canonical `www` host.

## Website capture and handoff evidence

A fresh browser context opened the exact final Zillow destination above.

- `sessionStorage["exhibit-visit-source"]` became exactly
  `Website (Zillow)`.
- After same-tab navigation to `/schedule-showing?unit=0208`, the stored value
  remained exactly `Website (Zillow)`.
- The showing-contact request was intercepted before it could reach the API.
  Its redacted JSON body carried `source: "Website (Zillow)"`.
- The intercepted request used an ordinary plausible form-fill interval and an
  empty bot-guard honeypot.

This browser check created no lead and booked no tour.

## Production API and AppFolio evidence

Exactly one production showing-contact request was sent with a clearly marked
QA identity, a reserved fictional phone number, the property's test-mailbox
alias, unit `0208`, and `source: "Website (Zillow)"`. No booking request was
sent.

At `2026-08-20T12:56:22Z` through `12:56:26Z`, the production logs recorded:

- `rawSource: "<accepted>"`
- `sourceLabel: "campaign sha256=6f4d8175c9d4 len=16"`
- `contact_ok: 1`
- `Created showing guest card in AppFolio`
- HTTP `201`

`6f4d8175c9d4` is the first 12 hexadecimal characters of the SHA-256 digest of
the exact label `Website (Zillow)`. There was no
`AppFolio rejected the campaign source label` log, so AppFolio accepted the
campaign label on the first request; the automatic retry with
`Website (Exhibit)` did not run.

No read-only AppFolio Leads API is configured for this project; the existing
Reports API integration does not expose guest-card retrieval. The AppFolio UI
row therefore could not be independently fetched back. The server-side
evidence distinguishes each boundary without retaining prospect PII: browser
source capture, request handoff, sanitizer acceptance, AppFolio creation, and
absence of the only source-downgrade path.

## Post-publish verification

Verified against the published site on **August 20, 2026 at 18:17 UTC** in a
fresh browser context.

1. The active Zillow click redirect returned HTTP `301` and landed on:
   `https://www.rentatexhibit.com/available-units?utm_medium=cpc&utm_source=zillow&zgRef=zillow`
2. The final host was the canonical `www.rentatexhibit.com` production host,
   and `zgRef=zillow` remained intact.
3. The published landing page stored
   `sessionStorage["exhibit-visit-source"]` as exactly
   `Website (Zillow)`.
4. Same-tab navigation to `/schedule-a-tour` retained exactly
   `Website (Zillow)`.
5. The browser's POST to `/api/showings/contact` was intercepted and fulfilled
   locally before it reached the production API. Its redacted JSON body
   contained `source: "Website (Zillow)"`, `unit: "TOUR"`, an empty bot-guard
   honeypot, and `smsConsent: false`.
6. No `/api/showings/book` request and no fallback `/api/leads` request
   occurred.

This post-publish verification created no AppFolio guest card, sent no lead,
and booked no tour.
