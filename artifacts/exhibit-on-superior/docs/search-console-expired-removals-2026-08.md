# Search Console expired-removal dispositions — August 2026

Temporary Search Console removals are not the permanent protection for these
URLs. Repeated requests for the same URL are consolidated below. Site-owned
legacy URLs keep an intentional, single-hop response in code and in the
post-publish legacy-route smoke check.

## Site-owned URLs

| Expired-removal URL | Permanent disposition | Expected response |
| --- | --- | --- |
| `https://www.rentatexhibit.com/index.aspx` | Canonical replacement: homepage | `301` → `/` |
| `https://www.rentatexhibit.com/video` | Canonical replacement: current virtual-tour page | `301` → `/virtual-tour` |
| `https://www.rentatexhibit.com/floorplans.aspx` | Canonical replacement: floor-plan hub; floor-plan traffic monitoring remains separate | `301` → `/floor-plans` |
| `https://www.rentatexhibit.com/amenities.aspx` | Canonical replacement: current amenities page | `301` → `/amenities` |
| `https://www.rentatexhibit.com/availableunits.aspx?myOlePropertyId=538057` | Canonical replacement: current availability page; preserve the submitted property query | `301` → `/available-units?myOlePropertyId=538057` |
| `https://www.rentatexhibit.com/scheduleouter.aspx` | Canonical replacement: current tour-request page | `301` → `/schedule-a-tour` |
| `https://www.rentatexhibit.com/scheduletour.aspx` | Canonical replacement: current tour-request page | `301` → `/schedule-a-tour` |
| `https://www.rentatexhibit.com/support/faq` | Canonical replacement: current FAQ hub | `301` → `/faq` |
| `https://www.rentatexhibit.com/apartments/il/chicago/artist-in-residence` | Removed campaign page with homepage as the established replacement | `301` → `/` |

The unscoped `/artist-in-residence` alias is retained with the same `301` to
prevent the former page from resurfacing through old links.

## External host action

`https://mta-sts.rentatexhibit.com/robots.txt` belongs to the separate
`mta-sts.rentatexhibit.com` DNS/hosting service, not this web artifact. It was
submitted for temporary removal more than once and did not resolve from the
workspace during the August 2026 review.

### Final disposition — formally retired (2026-08-26 UTC)

The accountable business/mail-security owner is **Highland Management LLC**,
the legal owner named by the production site's Organization metadata. The
public operational contact for the property is the Exhibit On Superior leasing team at
`exhibit@highlandptrs.com`. The DNS/registration owner is identified as
follows:

| Responsibility | Identified owner/provider | Evidence |
| --- | --- | --- |
| Business/mail-security owner | Highland Management LLC | Production `Organization` JSON-LD (`legalName`) |
| Authoritative DNS zone | Squarespace DNS | Parent NS: `nse1.squarespacedns.com` through `nse4.squarespacedns.com` |
| Domain registrar | Squarespace Domains LLC | ICANN RDAP for `rentatexhibit.com` |
| Current host for `mta-sts.rentatexhibit.com` | None publicly active | No A, CNAME, delegated NS, or child SOA record exists |

The recorded permanent disposition is to **retire** this host. This is
supported by the mail configuration: as of the verification below,
`rentatexhibit.com` has no MX record, no `_mta-sts` TXT marker, and no
`_smtp._tls` TLS-reporting record.
There is therefore no inbound mail service on this domain for an MTA-STS
policy to protect. The `mta-sts` label is already NXDOMAIN in the authoritative
Squarespace-backed zone, so there is no current DNS record or live hosting
configuration left to remove. No app route or redirect should be added.

The certificate-transparency log contains a historical Let's Encrypt
certificate for this hostname issued on 2026-06-15 (valid through 2026-09-13).
That proves the hostname was configured recently, but does not identify a
current hosting service; the hostname now has no DNS target or TLS endpoint.
If Highland finds a separately managed orphaned hosting account outside the
public DNS zone, it should be closed as part of this retirement, but that
account is not reachable or identifiable from this codebase.

#### Retirement verification

Verified 2026-08-26 UTC from the workspace against both Cloudflare DNS and
Google Public DNS:

- `mta-sts.rentatexhibit.com` A, CNAME, NS, and SOA lookups: **NXDOMAIN**.
- `_mta-sts.rentatexhibit.com` TXT lookup: **NXDOMAIN**.
- `_smtp._tls.rentatexhibit.com` TXT lookup: **NXDOMAIN**.
- `rentatexhibit.com` MX lookup: **NOERROR with no answer** (no MX service).
- `https://mta-sts.rentatexhibit.com/robots.txt`: cannot resolve, as expected
  for a retired host; there is no direct HTTP response to verify.

Do not add an app route or redirect for this hostname: requests never reach the
`www.rentatexhibit.com` production server, and DNS/hosting changes are outside
this codebase.

## Verification

The redirect source of truth is `src/data/legacyRedirects.ts`. The production
server guard verifies the representative statuses and exact query behavior
against a complete build. `scripts/check-legacy-redirects.mjs` reads the same
map and checks every redirect on the live site after publishing with redirects
disabled, so a `200` SPA shell, redirect chain, dropped query, or accidental
`404` fails the check.