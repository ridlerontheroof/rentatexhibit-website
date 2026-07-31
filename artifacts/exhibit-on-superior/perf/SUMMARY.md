# Page-speed lab report

Generated: 2026-07-31T08:24:16.148Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 81 | 4963 ms | 0.000 | 39 ms | 118 KB | 477 KB | 0 KB | ✅ |
| mobile | /available-units | 96 | 2260 ms | 0.085 | 63 ms | 154 KB | 69 KB | 43 KB | ✅ |
| mobile | /available-units/0208 | 97 | 2434 ms | 0.012 | 64 ms | 176 KB | 2203 KB | 2196 KB | ✅ |
| mobile | /available-units/3108 | 96 | 2415 ms | 0.058 | 37 ms | 176 KB | 2202 KB | 2195 KB | ✅ |
| mobile | /amenities | 98 | 2331 ms | 0.000 | 37 ms | 120 KB | 143 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 97 | 2482 ms | 0.000 | 39 ms | 125 KB | 108 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 97 | 2405 ms | 0.000 | 34 ms | 117 KB | 146 KB | 0 KB | ✅ |
| mobile | /knowledge | 98 | 2104 ms | 0.001 | 11 ms | 144 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 98 | 2103 ms | 0.000 | 2 ms | 142 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 98 | 2257 ms | 0.000 | 21 ms | 141 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 94 | 1689 ms | 0.000 | 0 ms | 118 KB | 1450 KB | 0 KB | ✅ |
| desktop | /available-units | 100 | 661 ms | 0.039 | 0 ms | 154 KB | 126 KB | 43 KB | ✅ |
| desktop | /available-units/0208 | 100 | 495 ms | 0.005 | 0 ms | 176 KB | 2202 KB | 2195 KB | ✅ |
| desktop | /available-units/3108 | 99 | 853 ms | 0.006 | 0 ms | 176 KB | 2202 KB | 2195 KB | ✅ |
| desktop | /amenities | 99 | 845 ms | 0.000 | 0 ms | 120 KB | 371 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 707 ms | 0.000 | 0 ms | 125 KB | 382 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 685 ms | 0.000 | 0 ms | 117 KB | 292 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 476 ms | 0.001 | 0 ms | 144 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 481 ms | 0.000 | 0 ms | 142 KB | 7 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 688 ms | 0.000 | 0 ms | 141 KB | 108 KB | 0 KB | ✅ |
