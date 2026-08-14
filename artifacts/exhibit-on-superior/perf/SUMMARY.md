# Page-speed lab report

Generated: 2026-08-14T10:40:48.433Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 91 | 3315 ms | 0.000 | 60 ms | 127 KB | 480 KB | 0 KB | ✅ |
| mobile | /available-units | 96 | 2339 ms | 0.000 | 128 ms | 169 KB | 1533 KB | 1480 KB | ✅ |
| mobile | /available-units/0208 | 99 | 2108 ms | 0.001 | 50 ms | 182 KB | 1809 KB | 1802 KB | ✅ |
| mobile | /available-units/3108 | 97 | 2411 ms | 0.001 | 76 ms | 182 KB | 1804 KB | 1800 KB | ✅ |
| mobile | /amenities | 96 | 2707 ms | 0.000 | 33 ms | 126 KB | 144 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 96 | 2635 ms | 0.000 | 51 ms | 131 KB | 109 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 96 | 2635 ms | 0.000 | 29 ms | 123 KB | 147 KB | 0 KB | ✅ |
| mobile | /knowledge | 98 | 2255 ms | 0.000 | 51 ms | 150 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 98 | 2253 ms | 0.000 | 25 ms | 148 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 98 | 2259 ms | 0.000 | 52 ms | 147 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 91 | 1938 ms | 0.000 | 0 ms | 127 KB | 1452 KB | 0 KB | ✅ |
| desktop | /available-units | 100 | 709 ms | 0.000 | 0 ms | 169 KB | 2654 KB | 2510 KB | ✅ |
| desktop | /available-units/0208 | 100 | 734 ms | 0.000 | 0 ms | 182 KB | 1809 KB | 1802 KB | ✅ |
| desktop | /available-units/3108 | 92 | 1899 ms | 0.000 | 0 ms | 182 KB | 1808 KB | 1800 KB | ✅ |
| desktop | /amenities | 99 | 827 ms | 0.000 | 0 ms | 126 KB | 372 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 666 ms | 0.000 | 0 ms | 131 KB | 385 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 666 ms | 0.000 | 0 ms | 123 KB | 293 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 500 ms | 0.000 | 0 ms | 150 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 502 ms | 0.000 | 0 ms | 148 KB | 8 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 686 ms | 0.000 | 0 ms | 147 KB | 108 KB | 0 KB | ✅ |
