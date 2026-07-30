# Page-speed lab report

Generated: 2026-07-30T16:09:07.879Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 82 | 4739 ms | 0.000 | 29 ms | 120 KB | 477 KB | 0 KB | ✅ |
| mobile | /available-units | 87 | 3294 ms | 0.085 | 137 ms | 187 KB | 223 KB | 138 KB | ✅ |
| mobile | /available-units/0208 | 98 | 2255 ms | 0.005 | 30 ms | 180 KB | 75 KB | 71 KB | ✅ |
| mobile | /available-units/3108 | 96 | 2412 ms | 0.033 | 35 ms | 180 KB | 2202 KB | 2195 KB | ✅ |
| mobile | /amenities | 94 | 2790 ms | 0.000 | 34 ms | 122 KB | 143 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 96 | 2560 ms | 0.000 | 34 ms | 126 KB | 108 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 97 | 2481 ms | 0.000 | 31 ms | 119 KB | 146 KB | 0 KB | ✅ |
| mobile | /knowledge | 98 | 2106 ms | 0.001 | 94 ms | 146 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 98 | 2104 ms | 0.000 | 2 ms | 144 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 98 | 2256 ms | 0.000 | 31 ms | 143 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 95 | 1540 ms | 0.000 | 0 ms | 120 KB | 1450 KB | 0 KB | ✅ |
| desktop | /available-units | 100 | 694 ms | 0.039 | 0 ms | 187 KB | 332 KB | 191 KB | ✅ |
| desktop | /available-units/0208 | 100 | 506 ms | 0.002 | 0 ms | 180 KB | 78 KB | 71 KB | ✅ |
| desktop | /available-units/3108 | 100 | 548 ms | 0.005 | 0 ms | 180 KB | 2202 KB | 2195 KB | ✅ |
| desktop | /amenities | 99 | 846 ms | 0.000 | 0 ms | 122 KB | 371 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 705 ms | 0.000 | 0 ms | 126 KB | 382 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 669 ms | 0.000 | 0 ms | 119 KB | 292 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 556 ms | 0.000 | 0 ms | 146 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 502 ms | 0.000 | 0 ms | 144 KB | 7 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 687 ms | 0.000 | 0 ms | 143 KB | 108 KB | 0 KB | ✅ |
