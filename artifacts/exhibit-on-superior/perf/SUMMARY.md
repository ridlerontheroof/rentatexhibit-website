# Page-speed lab report

Generated: 2026-07-30T23:59:24.268Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 95 | 2865 ms | 0.000 | 37 ms | 118 KB | 477 KB | 0 KB | ✅ |
| mobile | /available-units | 94 | 2277 ms | 0.085 | 129 ms | 154 KB | 69 KB | 43 KB | ✅ |
| mobile | /available-units/0208 | 96 | 2415 ms | 0.012 | 79 ms | 176 KB | 2202 KB | 2195 KB | ✅ |
| mobile | /available-units/3108 | 97 | 2416 ms | 0.033 | 34 ms | 176 KB | 2202 KB | 2195 KB | ✅ |
| mobile | /amenities | 95 | 2785 ms | 0.000 | 14 ms | 120 KB | 143 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 96 | 2563 ms | 0.000 | 47 ms | 124 KB | 108 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 97 | 2481 ms | 0.000 | 29 ms | 117 KB | 146 KB | 0 KB | ✅ |
| mobile | /knowledge | 99 | 1954 ms | 0.001 | 23 ms | 144 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 98 | 2106 ms | 0.000 | 7 ms | 142 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 99 | 2107 ms | 0.000 | 33 ms | 141 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 94 | 1688 ms | 0.000 | 0 ms | 118 KB | 1450 KB | 0 KB | ✅ |
| desktop | /available-units | 100 | 588 ms | 0.039 | 0 ms | 154 KB | 126 KB | 43 KB | ✅ |
| desktop | /available-units/0208 | 100 | 774 ms | 0.005 | 0 ms | 176 KB | 2202 KB | 2195 KB | ✅ |
| desktop | /available-units/3108 | 100 | 494 ms | 0.006 | 0 ms | 176 KB | 2202 KB | 2195 KB | ✅ |
| desktop | /amenities | 99 | 846 ms | 0.000 | 0 ms | 120 KB | 371 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 707 ms | 0.000 | 0 ms | 124 KB | 382 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 685 ms | 0.000 | 0 ms | 117 KB | 292 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 538 ms | 0.001 | 0 ms | 144 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 606 ms | 0.000 | 0 ms | 142 KB | 7 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 691 ms | 0.000 | 0 ms | 141 KB | 108 KB | 0 KB | ✅ |
