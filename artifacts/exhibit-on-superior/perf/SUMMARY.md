# Page-speed lab report

Generated: 2026-07-31T08:27:44.296Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 82 | 4684 ms | 0.000 | 67 ms | 118 KB | 477 KB | 0 KB | ✅ |
| mobile | /available-units | 96 | 2257 ms | 0.085 | 82 ms | 154 KB | 69 KB | 43 KB | ✅ |
| mobile | /available-units/0208 | 97 | 2301 ms | 0.011 | 75 ms | 176 KB | 2202 KB | 2195 KB | ✅ |
| mobile | /available-units/3108 | 95 | 2412 ms | 0.058 | 100 ms | 176 KB | 2202 KB | 2195 KB | ✅ |
| mobile | /amenities | 96 | 2559 ms | 0.000 | 26 ms | 120 KB | 143 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 96 | 2561 ms | 0.000 | 41 ms | 125 KB | 108 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 97 | 2405 ms | 0.000 | 26 ms | 117 KB | 146 KB | 0 KB | ✅ |
| mobile | /knowledge | 98 | 2105 ms | 0.001 | 20 ms | 144 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 98 | 2106 ms | 0.000 | 9 ms | 142 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 94 | 2926 ms | 0.000 | 82 ms | 141 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 95 | 1502 ms | 0.000 | 0 ms | 118 KB | 1450 KB | 0 KB | ✅ |
| desktop | /available-units | 100 | 650 ms | 0.039 | 0 ms | 154 KB | 126 KB | 43 KB | ✅ |
| desktop | /available-units/0208 | 100 | 519 ms | 0.005 | 0 ms | 176 KB | 2202 KB | 2195 KB | ✅ |
| desktop | /available-units/3108 | 100 | 493 ms | 0.006 | 0 ms | 176 KB | 2202 KB | 2195 KB | ✅ |
| desktop | /amenities | 99 | 846 ms | 0.000 | 0 ms | 120 KB | 371 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 707 ms | 0.000 | 0 ms | 125 KB | 382 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 684 ms | 0.000 | 0 ms | 117 KB | 292 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 459 ms | 0.001 | 0 ms | 144 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 464 ms | 0.000 | 0 ms | 142 KB | 7 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 686 ms | 0.000 | 0 ms | 141 KB | 108 KB | 0 KB | ✅ |
