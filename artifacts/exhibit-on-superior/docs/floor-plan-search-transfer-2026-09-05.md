# Floor-plan search transfer check — 2026-09-05

## Result

Google Search Console confirms that Google has processed both legacy redirects
and transferred page-level search traffic to `/floor-plans`.

The verified `sc-domain:rentatexhibit.com` property was inspected through the
Search Console APIs on 2026-09-05 at 12:04 UTC. The service account has
`siteFullUser` permission.

## URL Inspection

| Inspected URL | Coverage | Google canonical | Last crawl | Warnings |
| --- | --- | --- | --- | --- |
| `https://www.rentatexhibit.com/apartments/il/chicago/floor-plans` | Page with redirect | `https://www.rentatexhibit.com/floor-plans` | 2026-08-25 14:41 UTC | None; crawl successful, robots allowed, indexing allowed |
| `https://www.rentatexhibit.com/floorplans.aspx` | Page with redirect | `https://www.rentatexhibit.com/floor-plans` | 2026-08-30 12:44 UTC | No selected-canonical warning; crawl successful, robots allowed, indexing allowed |

Both inspections returned the expected neutral verdict for redirecting URLs.
The `.aspx` result did not report a user-declared canonical, which is normal
for an HTTP redirect; Google selected the correct destination.

## Performance attribution

Search Console data was queried with `dataState: final`, so each range ends
three days before the inspection date.

### Page totals

| Final data range | Page | Clicks | Impressions | Average position |
| --- | --- | ---: | ---: | ---: |
| 2026-08-06–2026-09-02 | `/floor-plans` | 51 | 1,374 | 3.33 |
| 2026-08-06–2026-09-02 | `/available-units` | 1 | 257 | 3.31 |
| 2026-08-06–2026-09-02 | either legacy floor-plan URL | 0 | 0 | — |
| 2026-08-20–2026-09-02 | `/floor-plans` | 25 | 607 | 3.58 |
| 2026-08-20–2026-09-02 | `/available-units` | 0 | 47 | 2.85 |
| 2026-08-20–2026-09-02 | either legacy floor-plan URL | 0 | 0 | — |
| 2026-08-27–2026-09-02 | `/floor-plans` | 8 | 331 | 4.06 |
| 2026-08-27–2026-09-02 | `/available-units` | 0 | 28 | 3.93 |
| 2026-08-27–2026-09-02 | either legacy floor-plan URL | 0 | 0 | — |

The API omits zero-activity page rows; neither legacy URL appeared in any of
the post-redirect ranges. `/floor-plans` is the floor-plan hub receiving
clicks and impressions. `/available-units` still receives a smaller amount of
search traffic for its own live-availability intent, but it no longer receives
the legacy floor-plan URL traffic.

### Floor-plan query filter

For the full post-redirect range, a case-insensitive query filter matching
`floor plan` / `floor plans` attributed one visible impression to
`/floor-plans` and none to either legacy URL or `/available-units`. Search
Console suppresses low-volume query rows for privacy, so page-level totals are
the stronger transfer evidence.

## Live-site corroboration

Checked on 2026-09-05 UTC:

| URL | Observed response |
| --- | --- |
| `https://www.rentatexhibit.com/apartments/il/chicago/floor-plans` | `301` with `Location: /floor-plans` |
| `https://www.rentatexhibit.com/floorplans.aspx` | `301` with `Location: /floor-plans` |
| `https://www.rentatexhibit.com/floor-plans` | `200` with canonical `https://www.rentatexhibit.com/floor-plans` |

Both legacy URLs therefore have the intended single-hop server redirect, and
the destination is an indexable page with a self-referencing canonical.

## Remaining warnings

No indexing, crawl, robots, or Google-selected-canonical warnings remain for
the two inspected legacy URLs. Public search-result caches may continue to
display an old legacy URL temporarily, but authenticated URL Inspection and
post-redirect Performance data show that Google has processed the migration.