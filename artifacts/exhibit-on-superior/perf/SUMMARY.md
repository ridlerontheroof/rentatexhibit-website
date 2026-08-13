# Page-speed lab report

Generated: 2026-08-13T19:47:03.008Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 91 | 3384 ms | 0.000 | 32 ms | 127 KB | 480 KB | 0 KB | ✅ |
| mobile | /available-units | 97 | 2333 ms | 0.000 | 76 ms | 169 KB | 1533 KB | 1480 KB | ✅ |
| mobile | /available-units/0208 | 98 | 2256 ms | 0.001 | 62 ms | 182 KB | 1809 KB | 1802 KB | ✅ |
| mobile | /available-units/3108 | 97 | 2404 ms | 0.001 | 67 ms | 182 KB | 1804 KB | 1800 KB | ✅ |
| mobile | /amenities | 95 | 2782 ms | 0.000 | 35 ms | 126 KB | 144 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 97 | 2559 ms | 0.000 | 52 ms | 131 KB | 109 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 97 | 2491 ms | 0.000 | 31 ms | 124 KB | 147 KB | 0 KB | ✅ |
| mobile | /knowledge | 98 | 2116 ms | 0.000 | 82 ms | 150 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 98 | 2253 ms | 0.000 | 24 ms | 148 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 98 | 2264 ms | 0.000 | 78 ms | 147 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 95 | 1579 ms | 0.000 | 0 ms | 127 KB | 1452 KB | 0 KB | ✅ |
| desktop | /available-units | 100 | 757 ms | 0.000 | 0 ms | 169 KB | 2654 KB | 2510 KB | ✅ |
| desktop | /available-units/0208 | 98 | 1132 ms | 0.000 | 0 ms | 182 KB | 1809 KB | 1802 KB | ✅ |
| desktop | /available-units/3108 | 94 | 1656 ms | 0.000 | 0 ms | 182 KB | 1808 KB | 1800 KB | ✅ |
| desktop | /amenities | 99 | 828 ms | 0.000 | 0 ms | 126 KB | 372 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 709 ms | 0.000 | 0 ms | 131 KB | 385 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 667 ms | 0.000 | 0 ms | 124 KB | 293 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 439 ms | 0.000 | 0 ms | 150 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 491 ms | 0.000 | 0 ms | 148 KB | 8 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 689 ms | 0.000 | 0 ms | 147 KB | 108 KB | 0 KB | ✅ |
