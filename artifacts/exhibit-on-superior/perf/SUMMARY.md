# Page-speed lab report

Generated: 2026-08-13T18:45:04.283Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 86 | 3989 ms | 0.000 | 65 ms | 127 KB | 480 KB | 0 KB | ✅ |
| mobile | /available-units | 98 | 2337 ms | 0.000 | 92 ms | 169 KB | 1533 KB | 1480 KB | ✅ |
| mobile | /available-units/0208 | 97 | 2408 ms | 0.001 | 42 ms | 182 KB | 1810 KB | 1802 KB | ✅ |
| mobile | /available-units/3108 | 97 | 2407 ms | 0.001 | 84 ms | 182 KB | 1804 KB | 1800 KB | ✅ |
| mobile | /amenities | 93 | 3010 ms | 0.000 | 58 ms | 126 KB | 144 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 96 | 2633 ms | 0.000 | 46 ms | 131 KB | 109 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 96 | 2631 ms | 0.000 | 34 ms | 124 KB | 147 KB | 0 KB | ✅ |
| mobile | /knowledge | 98 | 2258 ms | 0.000 | 54 ms | 150 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 98 | 2253 ms | 0.000 | 12 ms | 148 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 98 | 2261 ms | 0.000 | 103 ms | 147 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 95 | 1495 ms | 0.000 | 0 ms | 127 KB | 1452 KB | 0 KB | ✅ |
| desktop | /available-units | 100 | 668 ms | 0.000 | 0 ms | 169 KB | 2654 KB | 2510 KB | ✅ |
| desktop | /available-units/0208 | 100 | 485 ms | 0.000 | 0 ms | 182 KB | 1809 KB | 1802 KB | ✅ |
| desktop | /available-units/3108 | 100 | 500 ms | 0.000 | 0 ms | 182 KB | 1808 KB | 1800 KB | ✅ |
| desktop | /amenities | 99 | 854 ms | 0.000 | 0 ms | 126 KB | 372 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 738 ms | 0.000 | 0 ms | 131 KB | 385 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 689 ms | 0.000 | 0 ms | 124 KB | 293 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 510 ms | 0.000 | 0 ms | 150 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 629 ms | 0.000 | 0 ms | 148 KB | 8 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 690 ms | 0.000 | 0 ms | 147 KB | 108 KB | 0 KB | ✅ |
