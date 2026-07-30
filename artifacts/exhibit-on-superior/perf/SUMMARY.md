# Page-speed lab report

Generated: 2026-07-30T11:14:40.397Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 83 | 4516 ms | 0.000 | 63 ms | 120 KB | 477 KB | 0 KB | ✅ |
| mobile | /available-units | 96 | 2409 ms | 0.000 | 78 ms | 183 KB | 223 KB | 138 KB | ✅ |
| mobile | /available-units/0208 | 98 | 2331 ms | 0.005 | 45 ms | 175 KB | 75 KB | 71 KB | ✅ |
| mobile | /available-units/3108 | 96 | 2424 ms | 0.033 | 44 ms | 175 KB | 2202 KB | 2195 KB | ✅ |
| mobile | /amenities | 94 | 2791 ms | 0.000 | 57 ms | 122 KB | 143 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 97 | 2480 ms | 0.000 | 46 ms | 126 KB | 108 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 96 | 2633 ms | 0.000 | 20 ms | 119 KB | 146 KB | 0 KB | ✅ |
| mobile | /knowledge | 98 | 2105 ms | 0.001 | 24 ms | 146 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 98 | 2104 ms | 0.000 | 12 ms | 144 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 98 | 2106 ms | 0.000 | 52 ms | 143 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 93 | 1779 ms | 0.000 | 0 ms | 120 KB | 1450 KB | 0 KB | ✅ |
| desktop | /available-units | 98 | 653 ms | 0.091 | 0 ms | 183 KB | 332 KB | 191 KB | ✅ |
| desktop | /available-units/0208 | 100 | 643 ms | 0.002 | 0 ms | 175 KB | 78 KB | 71 KB | ✅ |
| desktop | /available-units/3108 | 100 | 517 ms | 0.005 | 0 ms | 175 KB | 2202 KB | 2195 KB | ✅ |
| desktop | /amenities | 99 | 847 ms | 0.000 | 0 ms | 122 KB | 371 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 705 ms | 0.000 | 0 ms | 126 KB | 382 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 665 ms | 0.000 | 0 ms | 119 KB | 292 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 505 ms | 0.000 | 0 ms | 146 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 601 ms | 0.000 | 0 ms | 144 KB | 7 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 701 ms | 0.000 | 0 ms | 143 KB | 108 KB | 0 KB | ✅ |
