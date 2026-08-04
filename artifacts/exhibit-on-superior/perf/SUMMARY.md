# Page-speed lab report

Generated: 2026-08-03T10:01:51.801Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 79 | 4970 ms | 0.000 | 146 ms | 118 KB | 477 KB | 0 KB | ✅ |
| mobile | /available-units | 96 | 2257 ms | 0.085 | 69 ms | 154 KB | 2043 KB | 2016 KB | ✅ |
| mobile | /available-units/0208 | 98 | 2165 ms | 0.005 | 62 ms | 176 KB | 1809 KB | 1802 KB | ✅ |
| mobile | /available-units/3108 | 96 | 2404 ms | 0.070 | 43 ms | 176 KB | 1807 KB | 1800 KB | ✅ |
| mobile | /amenities | 95 | 2780 ms | 0.000 | 33 ms | 120 KB | 143 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 96 | 2561 ms | 0.000 | 44 ms | 125 KB | 108 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 97 | 2408 ms | 0.000 | 25 ms | 118 KB | 146 KB | 0 KB | ✅ |
| mobile | /knowledge | 98 | 2106 ms | 0.001 | 25 ms | 144 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 98 | 2104 ms | 0.000 | 12 ms | 142 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 98 | 2257 ms | 0.000 | 40 ms | 141 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 99 | 975 ms | 0.000 | 0 ms | 118 KB | 1450 KB | 0 KB | ✅ |
| desktop | /available-units | 100 | 564 ms | 0.034 | 0 ms | 154 KB | 3580 KB | 3497 KB | ✅ |
| desktop | /available-units/0208 | 100 | 777 ms | 0.002 | 0 ms | 176 KB | 1809 KB | 1802 KB | ✅ |
| desktop | /available-units/3108 | 100 | 485 ms | 0.003 | 0 ms | 176 KB | 1807 KB | 1800 KB | ✅ |
| desktop | /amenities | 99 | 845 ms | 0.000 | 0 ms | 120 KB | 371 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 645 ms | 0.000 | 0 ms | 125 KB | 382 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 666 ms | 0.000 | 0 ms | 118 KB | 292 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 435 ms | 0.000 | 0 ms | 144 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 478 ms | 0.000 | 0 ms | 142 KB | 7 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 686 ms | 0.000 | 0 ms | 141 KB | 108 KB | 0 KB | ✅ |
