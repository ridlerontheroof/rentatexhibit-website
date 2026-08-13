# Page-speed lab report

Generated: 2026-08-13T17:09:25.512Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 91 | 3385 ms | 0.000 | 35 ms | 127 KB | 480 KB | 0 KB | ✅ |
| mobile | /available-units | 97 | 2337 ms | 0.000 | 70 ms | 169 KB | 1533 KB | 1480 KB | ✅ |
| mobile | /available-units/0208 | 98 | 2256 ms | 0.001 | 50 ms | 182 KB | 1809 KB | 1802 KB | ✅ |
| mobile | /available-units/3108 | 87 | 3913 ms | 0.001 | 62 ms | 182 KB | 1804 KB | 1800 KB | ✅ |
| mobile | /amenities | 96 | 2709 ms | 0.000 | 15 ms | 126 KB | 144 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 94 | 2941 ms | 0.000 | 27 ms | 131 KB | 109 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 97 | 2484 ms | 0.000 | 17 ms | 123 KB | 147 KB | 0 KB | ✅ |
| mobile | /knowledge | 94 | 2910 ms | 0.000 | 14 ms | 150 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 98 | 2256 ms | 0.000 | 3 ms | 148 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 95 | 2913 ms | 0.000 | 43 ms | 147 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 98 | 1173 ms | 0.000 | 0 ms | 127 KB | 1452 KB | 0 KB | ✅ |
| desktop | /available-units | 100 | 695 ms | 0.000 | 0 ms | 169 KB | 2654 KB | 2510 KB | ✅ |
| desktop | /available-units/0208 | 100 | 486 ms | 0.000 | 0 ms | 182 KB | 1809 KB | 1802 KB | ✅ |
| desktop | /available-units/3108 | 95 | 1475 ms | 0.000 | 0 ms | 182 KB | 1804 KB | 1800 KB | ✅ |
| desktop | /amenities | 99 | 836 ms | 0.000 | 0 ms | 126 KB | 372 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 691 ms | 0.000 | 0 ms | 131 KB | 385 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 667 ms | 0.000 | 0 ms | 123 KB | 293 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 503 ms | 0.000 | 0 ms | 150 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 620 ms | 0.000 | 0 ms | 148 KB | 8 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 647 ms | 0.000 | 0 ms | 147 KB | 108 KB | 0 KB | ✅ |
