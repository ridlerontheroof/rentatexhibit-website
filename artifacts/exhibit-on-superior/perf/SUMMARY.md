# Page-speed lab report

Generated: 2026-08-14T16:41:02.204Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 91 | 3387 ms | 0.000 | 60 ms | 127 KB | 480 KB | 0 KB | ✅ |
| mobile | /available-units | 97 | 2334 ms | 0.000 | 132 ms | 169 KB | 1533 KB | 1480 KB | ✅ |
| mobile | /available-units/0208 | 98 | 2257 ms | 0.001 | 43 ms | 182 KB | 1809 KB | 1802 KB | ✅ |
| mobile | /available-units/3108 | 97 | 2406 ms | 0.001 | 90 ms | 182 KB | 1804 KB | 1800 KB | ✅ |
| mobile | /amenities | 95 | 2784 ms | 0.000 | 25 ms | 126 KB | 144 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 99 | 1962 ms | 0.000 | 43 ms | 131 KB | 109 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 96 | 2632 ms | 0.000 | 29 ms | 124 KB | 147 KB | 0 KB | ✅ |
| mobile | /knowledge | 98 | 2106 ms | 0.000 | 68 ms | 150 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 99 | 2107 ms | 0.000 | 50 ms | 148 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 98 | 2261 ms | 0.000 | 44 ms | 147 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 91 | 1938 ms | 0.000 | 0 ms | 127 KB | 1452 KB | 0 KB | ✅ |
| desktop | /available-units | 100 | 673 ms | 0.000 | 0 ms | 169 KB | 2654 KB | 2510 KB | ✅ |
| desktop | /available-units/0208 | 98 | 1093 ms | 0.000 | 0 ms | 182 KB | 1809 KB | 1802 KB | ✅ |
| desktop | /available-units/3108 | 100 | 508 ms | 0.000 | 0 ms | 182 KB | 1808 KB | 1800 KB | ✅ |
| desktop | /amenities | 99 | 825 ms | 0.000 | 0 ms | 126 KB | 372 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 690 ms | 0.000 | 0 ms | 131 KB | 385 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 667 ms | 0.000 | 0 ms | 124 KB | 293 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 507 ms | 0.000 | 0 ms | 150 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 621 ms | 0.000 | 0 ms | 148 KB | 8 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 687 ms | 0.000 | 0 ms | 147 KB | 108 KB | 0 KB | ✅ |
