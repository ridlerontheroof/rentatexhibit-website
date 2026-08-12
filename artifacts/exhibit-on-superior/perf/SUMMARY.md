# Page-speed lab report

Generated: 2026-08-12T16:40:23.352Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 80 | 4963 ms | 0.000 | 41 ms | 127 KB | 480 KB | 0 KB | ✅ |
| mobile | /available-units | 97 | 2330 ms | 0.000 | 71 ms | 164 KB | 1530 KB | 1480 KB | ✅ |
| mobile | /available-units/0208 | 96 | 2407 ms | 0.005 | 40 ms | 181 KB | 1810 KB | 1802 KB | ✅ |
| mobile | /available-units/3108 | 98 | 2254 ms | 0.005 | 71 ms | 181 KB | 1804 KB | 1800 KB | ✅ |
| mobile | /amenities | 96 | 2561 ms | 0.000 | 20 ms | 125 KB | 144 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 97 | 2483 ms | 0.000 | 42 ms | 131 KB | 109 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 97 | 2480 ms | 0.000 | 8 ms | 123 KB | 147 KB | 0 KB | ✅ |
| mobile | /knowledge | 98 | 2009 ms | 0.001 | 55 ms | 150 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 98 | 2256 ms | 0.000 | 6 ms | 147 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 98 | 2257 ms | 0.000 | 21 ms | 147 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 99 | 1017 ms | 0.000 | 0 ms | 127 KB | 1452 KB | 0 KB | ✅ |
| desktop | /available-units | 100 | 667 ms | 0.000 | 0 ms | 164 KB | 2649 KB | 2510 KB | ✅ |
| desktop | /available-units/0208 | 100 | 780 ms | 0.002 | 0 ms | 181 KB | 1806 KB | 1802 KB | ✅ |
| desktop | /available-units/3108 | 99 | 896 ms | 0.003 | 0 ms | 181 KB | 1808 KB | 1800 KB | ✅ |
| desktop | /amenities | 99 | 847 ms | 0.000 | 0 ms | 125 KB | 372 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 706 ms | 0.000 | 0 ms | 131 KB | 385 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 665 ms | 0.000 | 0 ms | 123 KB | 293 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 502 ms | 0.001 | 0 ms | 150 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 497 ms | 0.000 | 0 ms | 147 KB | 8 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 685 ms | 0.000 | 0 ms | 147 KB | 108 KB | 0 KB | ✅ |
