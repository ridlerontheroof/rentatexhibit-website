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

Owner action:

1. Confirm who owns the `mta-sts.rentatexhibit.com` DNS record and hosting.
2. If the MTA-STS host is still required, restore DNS/TLS and verify its policy
   and `robots.txt` directly on that host.
3. If it is intentionally retired, remove the stale DNS/hosting configuration
   according to the mail-security owner's plan.

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