# Page-speed lab report

Generated: 2026-07-27T18:54:12.385Z

Target: local production build (dist/public via `vite preview`)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 84 | 4428 ms | 0.000 | 102 ms | 271 KB | 461 KB | 112 KB | ✅ |
| mobile | /available-units | 87 | 3419 ms | 0.000 | 172 ms | 320 KB | 704 KB | 283 KB | ✅ |
| mobile | /available-units/0208 | 84 | 4394 ms | 0.043 | 43 ms | 276 KB | 910 KB | 561 KB | ✅ |
| mobile | /available-units/2705 | 82 | 4394 ms | 0.077 | 124 ms | 276 KB | 1209 KB | 860 KB | ✅ |
| mobile | /amenities | 96 | 2563 ms | 0.000 | 30 ms | 271 KB | 544 KB | 112 KB | ✅ |
| mobile | /photo-gallery | 96 | 2570 ms | 0.000 | 29 ms | 276 KB | 559 KB | 112 KB | ✅ |
| mobile | /virtual-tour | 91 | 3315 ms | 0.000 | 16 ms | 270 KB | 597 KB | 112 KB | ✅ |
| mobile | /knowledge | 86 | 4065 ms | 0.000 | 43 ms | 265 KB | 461 KB | 112 KB | ✅ |
| mobile | /knowledge/application-fee | 96 | 2569 ms | 0.000 | 36 ms | 265 KB | 461 KB | 112 KB | ✅ |
| mobile | /contact-us | 80 | 4967 ms | 0.000 | 75 ms | 294 KB | 480 KB | 112 KB | ❌ lcpMs 4967 > limit 4700 |
| desktop | / | 91 | 1939 ms | 0.000 | 0 ms | 271 KB | 1433 KB | 112 KB | ✅ |
| desktop | /available-units | 92 | 1820 ms | 0.000 | 0 ms | 320 KB | 1733 KB | 283 KB | ✅ |
| desktop | /available-units/0208 | 98 | 1096 ms | 0.001 | 0 ms | 276 KB | 1882 KB | 561 KB | ✅ |
| desktop | /available-units/2705 | 97 | 1310 ms | 0.001 | 0 ms | 276 KB | 2191 KB | 870 KB | ✅ |
| desktop | /amenities | 93 | 1798 ms | 0.000 | 0 ms | 271 KB | 1741 KB | 112 KB | ✅ |
| desktop | /photo-gallery | 96 | 1430 ms | 0.000 | 0 ms | 276 KB | 1792 KB | 112 KB | ✅ |
| desktop | /virtual-tour | 98 | 1118 ms | 0.000 | 0 ms | 270 KB | 1717 KB | 112 KB | ✅ |
| desktop | /knowledge | 98 | 1107 ms | 0.000 | 0 ms | 265 KB | 1433 KB | 112 KB | ✅ |
| desktop | /knowledge/application-fee | 97 | 1232 ms | 0.000 | 0 ms | 265 KB | 1435 KB | 112 KB | ✅ |
| desktop | /contact-us | 98 | 1111 ms | 0.000 | 0 ms | 294 KB | 1536 KB | 112 KB | ✅ |
