# Page-speed lab report

Generated: 2026-08-11T17:57:13.304Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 86 | 3990 ms | 0.000 | 51 ms | 126 KB | 479 KB | 0 KB | ✅ |
| mobile | /available-units | 89 | 2275 ms | 0.085 | 298 ms | 159 KB | 2043 KB | 2017 KB | ❌ tbtMs 298 > limit 200 |
| mobile | /available-units/0208 | 98 | 2178 ms | 0.005 | 76 ms | 181 KB | 1810 KB | 1802 KB | ✅ |
| mobile | /available-units/3108 | 97 | 2296 ms | 0.005 | 66 ms | 181 KB | 1804 KB | 1800 KB | ✅ |
| mobile | /amenities | 94 | 2860 ms | 0.000 | 25 ms | 125 KB | 144 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 97 | 2408 ms | 0.000 | 72 ms | 131 KB | 109 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 96 | 2635 ms | 0.000 | 46 ms | 123 KB | 147 KB | 0 KB | ✅ |
| mobile | /knowledge | 98 | 2258 ms | 0.001 | 53 ms | 149 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 98 | 2003 ms | 0.000 | 37 ms | 147 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 97 | 2255 ms | 0.000 | 79 ms | 146 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 95 | 1552 ms | 0.000 | 0 ms | 126 KB | 1451 KB | 0 KB | ✅ |
| desktop | /available-units | 100 | 608 ms | 0.034 | 5 ms | 159 KB | 3580 KB | 3497 KB | ✅ |
| desktop | /available-units/0208 | 91 | 1937 ms | 0.002 | 0 ms | 181 KB | 1809 KB | 1802 KB | ✅ |
| desktop | /available-units/3108 | 100 | 479 ms | 0.003 | 0 ms | 181 KB | 1808 KB | 1800 KB | ✅ |
| desktop | /amenities | 99 | 851 ms | 0.000 | 0 ms | 125 KB | 372 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 711 ms | 0.000 | 0 ms | 131 KB | 385 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 706 ms | 0.000 | 43 ms | 123 KB | 293 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 484 ms | 0.001 | 0 ms | 149 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 470 ms | 0.000 | 0 ms | 147 KB | 7 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 685 ms | 0.000 | 0 ms | 146 KB | 108 KB | 0 KB | ✅ |
