# Page-speed lab report

Generated: 2026-07-30T12:30:32.612Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 94 | 2864 ms | 0.000 | 68 ms | 120 KB | 477 KB | 0 KB | ✅ |
| mobile | /available-units | 97 | 2413 ms | 0.000 | 63 ms | 183 KB | 223 KB | 138 KB | ✅ |
| mobile | /available-units/0208 | 98 | 2228 ms | 0.005 | 55 ms | 176 KB | 75 KB | 71 KB | ✅ |
| mobile | /available-units/3108 | 96 | 2411 ms | 0.058 | 48 ms | 176 KB | 2202 KB | 2195 KB | ✅ |
| mobile | /amenities | 94 | 2790 ms | 0.000 | 37 ms | 122 KB | 143 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 97 | 2484 ms | 0.000 | 35 ms | 126 KB | 108 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 97 | 2481 ms | 0.000 | 33 ms | 119 KB | 146 KB | 0 KB | ✅ |
| mobile | /knowledge | 98 | 1996 ms | 0.001 | 22 ms | 146 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 98 | 2104 ms | 0.000 | 9 ms | 144 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 98 | 2255 ms | 0.000 | 70 ms | 143 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 92 | 1886 ms | 0.000 | 0 ms | 120 KB | 1450 KB | 0 KB | ✅ |
| desktop | /available-units | 98 | 655 ms | 0.091 | 0 ms | 183 KB | 332 KB | 191 KB | ✅ |
| desktop | /available-units/0208 | 100 | 487 ms | 0.002 | 0 ms | 176 KB | 78 KB | 71 KB | ✅ |
| desktop | /available-units/3108 | 100 | 511 ms | 0.005 | 0 ms | 176 KB | 2202 KB | 2195 KB | ✅ |
| desktop | /amenities | 99 | 846 ms | 0.000 | 0 ms | 122 KB | 371 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 706 ms | 0.000 | 0 ms | 126 KB | 382 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 686 ms | 0.000 | 0 ms | 119 KB | 292 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 622 ms | 0.000 | 0 ms | 146 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 622 ms | 0.000 | 0 ms | 144 KB | 7 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 685 ms | 0.000 | 0 ms | 143 KB | 108 KB | 0 KB | ✅ |
