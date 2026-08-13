# Page-speed lab report

Generated: 2026-08-13T00:38:09.209Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 84 | 4370 ms | 0.000 | 67 ms | 127 KB | 480 KB | 0 KB | ✅ |
| mobile | /available-units | 97 | 2336 ms | 0.000 | 94 ms | 164 KB | 1530 KB | 1480 KB | ✅ |
| mobile | /available-units/0208 | 98 | 2255 ms | 0.001 | 101 ms | 182 KB | 1806 KB | 1802 KB | ✅ |
| mobile | /available-units/3108 | 94 | 2686 ms | 0.001 | 152 ms | 182 KB | 1804 KB | 1800 KB | ✅ |
| mobile | /amenities | 96 | 2709 ms | 0.000 | 44 ms | 125 KB | 144 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 96 | 2633 ms | 0.000 | 42 ms | 131 KB | 109 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 96 | 2634 ms | 0.000 | 27 ms | 123 KB | 147 KB | 0 KB | ✅ |
| mobile | /knowledge | 98 | 2254 ms | 0.000 | 37 ms | 150 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 98 | 2258 ms | 0.000 | 33 ms | 148 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 98 | 2267 ms | 0.000 | 90 ms | 147 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 93 | 1730 ms | 0.000 | 0 ms | 127 KB | 1452 KB | 0 KB | ✅ |
| desktop | /available-units | 100 | 740 ms | 0.000 | 0 ms | 164 KB | 2649 KB | 2510 KB | ✅ |
| desktop | /available-units/0208 | 100 | 735 ms | 0.000 | 0 ms | 182 KB | 1809 KB | 1802 KB | ✅ |
| desktop | /available-units/3108 | 98 | 1097 ms | 0.001 | 0 ms | 182 KB | 1808 KB | 1800 KB | ✅ |
| desktop | /amenities | 99 | 846 ms | 0.000 | 0 ms | 125 KB | 372 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 709 ms | 0.000 | 0 ms | 131 KB | 385 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 686 ms | 0.000 | 0 ms | 123 KB | 293 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 501 ms | 0.000 | 0 ms | 150 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 621 ms | 0.000 | 0 ms | 148 KB | 8 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 685 ms | 0.000 | 0 ms | 147 KB | 108 KB | 0 KB | ✅ |
