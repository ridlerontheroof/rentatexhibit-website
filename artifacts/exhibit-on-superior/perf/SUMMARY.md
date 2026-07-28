# Page-speed lab report

Generated: 2026-07-28T00:06:26.406Z

Target: local production build (dist/public via `vite preview`)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 83 | 4628 ms | 0.000 | 35 ms | 272 KB | 461 KB | 112 KB | ✅ |
| mobile | /available-units | 88 | 3486 ms | 0.000 | 179 ms | 321 KB | 681 KB | 260 KB | ✅ |
| mobile | /available-units/0208 | 84 | 4387 ms | 0.043 | 65 ms | 276 KB | 910 KB | 561 KB | ✅ |
| mobile | /available-units/2705 | 92 | 3317 ms | 0.034 | 51 ms | 276 KB | 1209 KB | 860 KB | ✅ |
| mobile | /amenities | 91 | 3322 ms | 0.000 | 39 ms | 272 KB | 544 KB | 112 KB | ✅ |
| mobile | /photo-gallery | 89 | 3543 ms | 0.000 | 37 ms | 277 KB | 559 KB | 112 KB | ✅ |
| mobile | /virtual-tour | 90 | 3462 ms | 0.000 | 13 ms | 270 KB | 597 KB | 112 KB | ✅ |
| mobile | /knowledge | 93 | 3090 ms | 0.000 | 23 ms | 266 KB | 461 KB | 112 KB | ✅ |
| mobile | /knowledge/application-fee | 93 | 3086 ms | 0.000 | 12 ms | 266 KB | 461 KB | 112 KB | ✅ |
| mobile | /contact-us | 93 | 3084 ms | 0.000 | 29 ms | 295 KB | 480 KB | 112 KB | ✅ |
| desktop | / | 99 | 973 ms | 0.000 | 0 ms | 272 KB | 1433 KB | 112 KB | ✅ |
| desktop | /available-units | 98 | 1119 ms | 0.000 | 0 ms | 321 KB | 1733 KB | 283 KB | ✅ |
| desktop | /available-units/0208 | 89 | 2252 ms | 0.001 | 0 ms | 276 KB | 1882 KB | 561 KB | ✅ |
| desktop | /available-units/2705 | 88 | 2290 ms | 0.001 | 0 ms | 276 KB | 2191 KB | 870 KB | ✅ |
| desktop | /amenities | 90 | 2052 ms | 0.000 | 0 ms | 272 KB | 1741 KB | 112 KB | ✅ |
| desktop | /photo-gallery | 97 | 1230 ms | 0.000 | 0 ms | 277 KB | 1792 KB | 112 KB | ✅ |
| desktop | /virtual-tour | 91 | 1953 ms | 0.000 | 0 ms | 270 KB | 1717 KB | 112 KB | ✅ |
| desktop | /knowledge | 91 | 1936 ms | 0.000 | 0 ms | 266 KB | 1433 KB | 112 KB | ✅ |
| desktop | /knowledge/application-fee | 99 | 986 ms | 0.000 | 0 ms | 266 KB | 1435 KB | 112 KB | ✅ |
| desktop | /contact-us | 98 | 1113 ms | 0.000 | 0 ms | 295 KB | 1536 KB | 112 KB | ✅ |
