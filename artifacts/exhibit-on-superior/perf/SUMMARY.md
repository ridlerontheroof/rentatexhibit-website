# Page-speed lab report

Generated: 2026-07-30T14:24:43.273Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 80 | 4967 ms | 0.000 | 75 ms | 120 KB | 477 KB | 0 KB | ✅ |
| mobile | /available-units | 96 | 2412 ms | 0.000 | 101 ms | 183 KB | 223 KB | 138 KB | ✅ |
| mobile | /available-units/0208 | 99 | 2073 ms | 0.004 | 55 ms | 176 KB | 75 KB | 71 KB | ✅ |
| mobile | /available-units/3108 | 96 | 2420 ms | 0.058 | 63 ms | 176 KB | 2199 KB | 2195 KB | ✅ |
| mobile | /amenities | 94 | 2791 ms | 0.000 | 60 ms | 122 KB | 143 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 97 | 2481 ms | 0.000 | 49 ms | 126 KB | 108 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 94 | 2687 ms | 0.000 | 130 ms | 119 KB | 146 KB | 0 KB | ✅ |
| mobile | /knowledge | 98 | 2105 ms | 0.001 | 19 ms | 146 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 98 | 1998 ms | 0.000 | 19 ms | 144 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 93 | 2943 ms | 0.000 | 107 ms | 143 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 92 | 1812 ms | 0.000 | 0 ms | 120 KB | 1450 KB | 0 KB | ✅ |
| desktop | /available-units | 98 | 654 ms | 0.091 | 0 ms | 183 KB | 332 KB | 191 KB | ✅ |
| desktop | /available-units/0208 | 100 | 461 ms | 0.002 | 0 ms | 176 KB | 78 KB | 71 KB | ✅ |
| desktop | /available-units/3108 | 100 | 510 ms | 0.005 | 0 ms | 176 KB | 2202 KB | 2195 KB | ✅ |
| desktop | /amenities | 99 | 848 ms | 0.000 | 0 ms | 122 KB | 371 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 706 ms | 0.000 | 0 ms | 126 KB | 382 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 706 ms | 0.000 | 0 ms | 119 KB | 292 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 471 ms | 0.000 | 0 ms | 146 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 623 ms | 0.000 | 0 ms | 144 KB | 7 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 686 ms | 0.000 | 0 ms | 143 KB | 108 KB | 0 KB | ✅ |
