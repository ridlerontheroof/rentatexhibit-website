# Page-speed lab report

Generated: 2026-07-28T01:30:34.392Z

Target: local production build (dist/public via `vite preview`)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 85 | 4096 ms | 0.000 | 29 ms | 272 KB | 461 KB | 112 KB | ✅ |
| mobile | /available-units | 80 | 4972 ms | 0.000 | 121 ms | 321 KB | 681 KB | 260 KB | ❌ lcpMs 4972 > limit 3600 |
| mobile | /available-units/0208 | 83 | 4379 ms | 0.043 | 113 ms | 277 KB | 910 KB | 561 KB | ✅ |
| mobile | /available-units/2705 | 78 | 4983 ms | 0.034 | 187 ms | 277 KB | 1209 KB | 860 KB | ✅ |
| mobile | /amenities | 85 | 4232 ms | 0.000 | 74 ms | 272 KB | 544 KB | 112 KB | ❌ lcpMs 4232 > limit 4200 |
| mobile | /photo-gallery | 84 | 4304 ms | 0.000 | 125 ms | 277 KB | 559 KB | 112 KB | ✅ |
| mobile | /virtual-tour | 91 | 3386 ms | 0.000 | 37 ms | 270 KB | 597 KB | 112 KB | ✅ |
| mobile | /knowledge | 83 | 4599 ms | 0.000 | 52 ms | 266 KB | 461 KB | 112 KB | ✅ |
| mobile | /knowledge/application-fee | 91 | 3312 ms | 0.000 | 22 ms | 266 KB | 461 KB | 112 KB | ✅ |
| mobile | /contact-us | 91 | 3315 ms | 0.000 | 49 ms | 295 KB | 480 KB | 112 KB | ✅ |
| desktop | / | 91 | 1938 ms | 0.000 | 0 ms | 272 KB | 1433 KB | 112 KB | ✅ |
| desktop | /available-units | 98 | 1192 ms | 0.000 | 0 ms | 321 KB | 1733 KB | 283 KB | ✅ |
| desktop | /available-units/0208 | 93 | 1713 ms | 0.001 | 0 ms | 277 KB | 1882 KB | 561 KB | ✅ |
| desktop | /available-units/2705 | 89 | 2194 ms | 0.001 | 0 ms | 277 KB | 2191 KB | 870 KB | ✅ |
| desktop | /amenities | 95 | 1464 ms | 0.000 | 0 ms | 272 KB | 1741 KB | 112 KB | ✅ |
| desktop | /photo-gallery | 97 | 1281 ms | 0.000 | 0 ms | 277 KB | 1792 KB | 112 KB | ✅ |
| desktop | /virtual-tour | 97 | 1241 ms | 0.000 | 0 ms | 270 KB | 1717 KB | 112 KB | ✅ |
| desktop | /knowledge | 98 | 1048 ms | 0.000 | 0 ms | 266 KB | 1433 KB | 112 KB | ✅ |
| desktop | /knowledge/application-fee | 99 | 985 ms | 0.000 | 0 ms | 266 KB | 1435 KB | 112 KB | ✅ |
| desktop | /contact-us | 91 | 1945 ms | 0.000 | 0 ms | 295 KB | 1536 KB | 112 KB | ✅ |
