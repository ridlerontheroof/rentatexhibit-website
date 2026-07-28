# Page-speed lab report

Generated: 2026-07-28T09:42:11.426Z

Target: local production build (dist/public via `vite preview`)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 79 | 5584 ms | 0.000 | 37 ms | 272 KB | 461 KB | 112 KB | ❌ lcpMs 5584 > limit 5300 |
| mobile | /available-units | 86 | 4097 ms | 0.000 | 62 ms | 322 KB | 680 KB | 260 KB | ❌ lcpMs 4097 > limit 3600 |
| mobile | /available-units/0208 | 89 | 3633 ms | 0.044 | 40 ms | 277 KB | 910 KB | 561 KB | ✅ |
| mobile | /available-units/2705 | 83 | 4529 ms | 0.034 | 92 ms | 277 KB | 1209 KB | 860 KB | ✅ |
| mobile | /amenities | 80 | 5117 ms | 0.000 | 32 ms | 273 KB | 544 KB | 112 KB | ❌ lcpMs 5117 > limit 4200 |
| mobile | /photo-gallery | 93 | 3026 ms | 0.000 | 75 ms | 277 KB | 559 KB | 112 KB | ✅ |
| mobile | /virtual-tour | 91 | 3313 ms | 0.000 | 12 ms | 271 KB | 597 KB | 112 KB | ✅ |
| mobile | /knowledge | 85 | 4020 ms | 0.000 | 35 ms | 267 KB | 461 KB | 112 KB | ✅ |
| mobile | /knowledge/application-fee | 91 | 3313 ms | 0.000 | 14 ms | 266 KB | 461 KB | 112 KB | ✅ |
| mobile | /contact-us | 86 | 4066 ms | 0.000 | 40 ms | 296 KB | 480 KB | 112 KB | ✅ |
| desktop | / | 91 | 1933 ms | 0.000 | 0 ms | 272 KB | 1433 KB | 112 KB | ✅ |
| desktop | /available-units | 96 | 1402 ms | 0.000 | 0 ms | 322 KB | 1733 KB | 283 KB | ✅ |
| desktop | /available-units/0208 | 92 | 1875 ms | 0.001 | 8 ms | 277 KB | 1882 KB | 561 KB | ✅ |
| desktop | /available-units/2705 | 90 | 2036 ms | 0.001 | 0 ms | 277 KB | 2191 KB | 870 KB | ✅ |
| desktop | /amenities | 96 | 1419 ms | 0.000 | 0 ms | 273 KB | 1741 KB | 112 KB | ✅ |
| desktop | /photo-gallery | 91 | 1935 ms | 0.000 | 0 ms | 277 KB | 1792 KB | 112 KB | ✅ |
| desktop | /virtual-tour | 95 | 1518 ms | 0.000 | 0 ms | 271 KB | 1717 KB | 112 KB | ✅ |
| desktop | /knowledge | 91 | 1934 ms | 0.000 | 0 ms | 267 KB | 1433 KB | 112 KB | ✅ |
| desktop | /knowledge/application-fee | 99 | 984 ms | 0.000 | 0 ms | 266 KB | 1435 KB | 112 KB | ✅ |
| desktop | /contact-us | 97 | 1297 ms | 0.000 | 0 ms | 295 KB | 1536 KB | 112 KB | ✅ |
