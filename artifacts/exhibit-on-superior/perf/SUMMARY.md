# Page-speed lab report

Generated: 2026-08-13T09:34:37.109Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 85 | 4365 ms | 0.000 | 32 ms | 127 KB | 480 KB | 0 KB | ✅ |
| mobile | /available-units | 98 | 2338 ms | 0.000 | 58 ms | 165 KB | 1530 KB | 1480 KB | ✅ |
| mobile | /available-units/0208 | 98 | 2266 ms | 0.001 | 41 ms | 182 KB | 1809 KB | 1802 KB | ✅ |
| mobile | /available-units/3108 | 97 | 2408 ms | 0.001 | 37 ms | 182 KB | 1804 KB | 1800 KB | ✅ |
| mobile | /amenities | 96 | 2708 ms | 0.000 | 12 ms | 125 KB | 144 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 97 | 2562 ms | 0.000 | 35 ms | 131 KB | 109 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 97 | 2483 ms | 0.000 | 9 ms | 123 KB | 147 KB | 0 KB | ✅ |
| mobile | /knowledge | 99 | 2107 ms | 0.000 | 12 ms | 150 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 98 | 2255 ms | 0.000 | 9 ms | 148 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 98 | 2260 ms | 0.000 | 61 ms | 147 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 99 | 1014 ms | 0.000 | 0 ms | 127 KB | 1452 KB | 0 KB | ✅ |
| desktop | /available-units | 100 | 652 ms | 0.000 | 0 ms | 165 KB | 2649 KB | 2510 KB | ✅ |
| desktop | /available-units/0208 | 100 | 486 ms | 0.000 | 0 ms | 182 KB | 1809 KB | 1802 KB | ✅ |
| desktop | /available-units/3108 | 100 | 488 ms | 0.000 | 0 ms | 182 KB | 1808 KB | 1800 KB | ✅ |
| desktop | /amenities | 99 | 826 ms | 0.000 | 0 ms | 125 KB | 372 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 704 ms | 0.000 | 0 ms | 131 KB | 385 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 666 ms | 0.000 | 0 ms | 123 KB | 293 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 500 ms | 0.000 | 0 ms | 150 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 484 ms | 0.000 | 0 ms | 148 KB | 8 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 686 ms | 0.000 | 0 ms | 147 KB | 108 KB | 0 KB | ✅ |
