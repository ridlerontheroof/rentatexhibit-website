# Page-speed lab report

Generated: 2026-07-27T15:21:48.320Z

Target: local production build (dist/public via `vite preview`)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 72 | 5192 ms | 0.000 | 333 ms | 271 KB | 461 KB | 112 KB | ❌ tbtMs 333 > limit 200 |
| mobile | /available-units | 73 | 3463 ms | 0.000 | 691 ms | 320 KB | 704 KB | 283 KB | ❌ tbtMs 691 > limit 200 |
| mobile | /available-units/0208 | 66 | 4514 ms | 0.043 | 709 ms | 276 KB | 910 KB | 561 KB | ❌ tbtMs 709 > limit 200 |
| mobile | /available-units/2705 | 79 | 2732 ms | 0.034 | 665 ms | 276 KB | 1209 KB | 860 KB | ❌ tbtMs 665 > limit 200 |
| mobile | /amenities | 91 | 3401 ms | 0.000 | 20 ms | 271 KB | 544 KB | 112 KB | ✅ |
| mobile | /photo-gallery | 91 | 3472 ms | 0.000 | 58 ms | 276 KB | 559 KB | 112 KB | ✅ |
| mobile | /virtual-tour | 90 | 3469 ms | 0.000 | 69 ms | 270 KB | 597 KB | 112 KB | ✅ |
| mobile | /knowledge | 81 | 4968 ms | 0.000 | 25 ms | 265 KB | 461 KB | 112 KB | ✅ |
| mobile | /knowledge/application-fee | 93 | 3085 ms | 0.000 | 10 ms | 265 KB | 461 KB | 112 KB | ✅ |
| mobile | /contact-us | 94 | 3012 ms | 0.000 | 33 ms | 294 KB | 480 KB | 112 KB | ✅ |
| desktop | / | 91 | 1943 ms | 0.000 | 0 ms | 271 KB | 1433 KB | 112 KB | ✅ |
| desktop | /available-units | 93 | 1670 ms | 0.000 | 6 ms | 320 KB | 1733 KB | 283 KB | ✅ |
| desktop | /available-units/0208 | 92 | 1857 ms | 0.001 | 0 ms | 276 KB | 1882 KB | 561 KB | ✅ |
| desktop | /available-units/2705 | 94 | 1625 ms | 0.001 | 0 ms | 276 KB | 2191 KB | 870 KB | ✅ |
| desktop | /amenities | 93 | 1721 ms | 0.000 | 0 ms | 271 KB | 1741 KB | 112 KB | ✅ |
| desktop | /photo-gallery | 91 | 1939 ms | 0.000 | 0 ms | 276 KB | 1792 KB | 112 KB | ✅ |
| desktop | /virtual-tour | 90 | 2103 ms | 0.000 | 0 ms | 270 KB | 1717 KB | 112 KB | ✅ |
| desktop | /knowledge | 91 | 1939 ms | 0.000 | 0 ms | 265 KB | 1433 KB | 112 KB | ✅ |
| desktop | /knowledge/application-fee | 98 | 1092 ms | 0.000 | 0 ms | 265 KB | 1435 KB | 112 KB | ✅ |
| desktop | /contact-us | 94 | 1590 ms | 0.000 | 0 ms | 294 KB | 1536 KB | 112 KB | ✅ |
