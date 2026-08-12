# Page-speed lab report

Generated: 2026-08-12T12:26:56.882Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 84 | 4366 ms | 0.000 | 68 ms | 127 KB | 480 KB | 0 KB | ✅ |
| mobile | /available-units | 97 | 2334 ms | 0.000 | 77 ms | 164 KB | 1530 KB | 1480 KB | ✅ |
| mobile | /available-units/0208 | 99 | 2105 ms | 0.005 | 47 ms | 181 KB | 1809 KB | 1802 KB | ✅ |
| mobile | /available-units/3108 | 95 | 2408 ms | 0.005 | 138 ms | 181 KB | 1804 KB | 1800 KB | ✅ |
| mobile | /amenities | 95 | 2789 ms | 0.000 | 41 ms | 125 KB | 144 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 96 | 2636 ms | 0.000 | 34 ms | 131 KB | 109 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 96 | 2581 ms | 0.000 | 9 ms | 123 KB | 147 KB | 0 KB | ✅ |
| mobile | /knowledge | 98 | 2257 ms | 0.001 | 15 ms | 150 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 98 | 2000 ms | 0.000 | 4 ms | 147 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 97 | 2311 ms | 0.000 | 23 ms | 147 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 91 | 1934 ms | 0.000 | 0 ms | 127 KB | 1452 KB | 0 KB | ✅ |
| desktop | /available-units | 100 | 604 ms | 0.000 | 0 ms | 164 KB | 2649 KB | 2510 KB | ✅ |
| desktop | /available-units/0208 | 100 | 505 ms | 0.002 | 0 ms | 181 KB | 1809 KB | 1802 KB | ✅ |
| desktop | /available-units/3108 | 100 | 486 ms | 0.003 | 0 ms | 181 KB | 1808 KB | 1800 KB | ✅ |
| desktop | /amenities | 99 | 845 ms | 0.000 | 0 ms | 125 KB | 372 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 686 ms | 0.000 | 0 ms | 131 KB | 385 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 686 ms | 0.000 | 0 ms | 123 KB | 293 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 462 ms | 0.001 | 0 ms | 150 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 498 ms | 0.000 | 0 ms | 147 KB | 8 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 685 ms | 0.000 | 0 ms | 147 KB | 108 KB | 0 KB | ✅ |
