# Page-speed lab report

Generated: 2026-08-04T12:28:00.529Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 93 | 3100 ms | 0.000 | 20 ms | 118 KB | 477 KB | 0 KB | ✅ |
| mobile | /available-units | 96 | 2260 ms | 0.085 | 79 ms | 154 KB | 2043 KB | 2017 KB | ✅ |
| mobile | /available-units/0208 | 98 | 2259 ms | 0.005 | 43 ms | 176 KB | 1809 KB | 1802 KB | ✅ |
| mobile | /available-units/3108 | 97 | 2409 ms | 0.005 | 50 ms | 176 KB | 1804 KB | 1800 KB | ✅ |
| mobile | /amenities | 95 | 2782 ms | 0.000 | 35 ms | 120 KB | 143 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 97 | 2483 ms | 0.000 | 29 ms | 124 KB | 108 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 96 | 2633 ms | 0.000 | 16 ms | 117 KB | 146 KB | 0 KB | ✅ |
| mobile | /knowledge | 94 | 2103 ms | 0.001 | 246 ms | 144 KB | 4 KB | 0 KB | ❌ tbtMs 246 > limit 200 |
| mobile | /knowledge/application-fee | 98 | 2107 ms | 0.000 | 6 ms | 142 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 93 | 2928 ms | 0.000 | 32 ms | 141 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 96 | 1461 ms | 0.000 | 0 ms | 118 KB | 1450 KB | 0 KB | ✅ |
| desktop | /available-units | 100 | 590 ms | 0.029 | 0 ms | 154 KB | 3086 KB | 3003 KB | ✅ |
| desktop | /available-units/0208 | 98 | 1138 ms | 0.002 | 0 ms | 176 KB | 1809 KB | 1802 KB | ✅ |
| desktop | /available-units/3108 | 100 | 483 ms | 0.003 | 0 ms | 176 KB | 1807 KB | 1800 KB | ✅ |
| desktop | /amenities | 99 | 848 ms | 0.000 | 0 ms | 120 KB | 371 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 688 ms | 0.000 | 0 ms | 124 KB | 382 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 571 ms | 0.000 | 13 ms | 117 KB | 292 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 459 ms | 0.054 | 0 ms | 144 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 456 ms | 0.000 | 47 ms | 142 KB | 7 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 691 ms | 0.000 | 0 ms | 141 KB | 108 KB | 0 KB | ✅ |
