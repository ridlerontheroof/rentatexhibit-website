# Page-speed lab report

Generated: 2026-08-13T16:40:21.886Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 96 | 2716 ms | 0.000 | 40 ms | 127 KB | 480 KB | 0 KB | ✅ |
| mobile | /available-units | 97 | 2340 ms | 0.000 | 109 ms | 198 KB | 1530 KB | 1480 KB | ✅ |
| mobile | /available-units/0208 | 97 | 2408 ms | 0.001 | 59 ms | 180 KB | 1809 KB | 1802 KB | ✅ |
| mobile | /available-units/3108 | 97 | 2412 ms | 0.001 | 81 ms | 180 KB | 1804 KB | 1800 KB | ✅ |
| mobile | /amenities | 96 | 2710 ms | 0.000 | 61 ms | 126 KB | 144 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 96 | 2635 ms | 0.000 | 36 ms | 131 KB | 109 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 96 | 2632 ms | 0.000 | 17 ms | 123 KB | 147 KB | 0 KB | ✅ |
| mobile | /knowledge | 98 | 2254 ms | 0.000 | 13 ms | 150 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 98 | 2256 ms | 0.000 | 9 ms | 148 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 98 | 2261 ms | 0.000 | 71 ms | 147 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 91 | 1932 ms | 0.000 | 0 ms | 127 KB | 1452 KB | 0 KB | ✅ |
| desktop | /available-units | 100 | 654 ms | 0.000 | 0 ms | 198 KB | 2649 KB | 2510 KB | ✅ |
| desktop | /available-units/0208 | 100 | 485 ms | 0.000 | 0 ms | 180 KB | 1809 KB | 1802 KB | ✅ |
| desktop | /available-units/3108 | 100 | 487 ms | 0.000 | 0 ms | 180 KB | 1808 KB | 1800 KB | ✅ |
| desktop | /amenities | 99 | 826 ms | 0.000 | 0 ms | 126 KB | 372 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 687 ms | 0.000 | 0 ms | 131 KB | 385 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 686 ms | 0.000 | 0 ms | 123 KB | 293 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 618 ms | 0.000 | 0 ms | 150 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 619 ms | 0.000 | 0 ms | 148 KB | 8 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 687 ms | 0.000 | 0 ms | 147 KB | 108 KB | 0 KB | ✅ |
