# Page-speed lab report

Generated: 2026-08-16T16:17:26.149Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 85 | 3844 ms | 0.000 | 175 ms | 127 KB | 480 KB | 0 KB | ✅ |
| mobile | /available-units | 97 | 2336 ms | 0.000 | 129 ms | 168 KB | 1040 KB | 987 KB | ✅ |
| mobile | /available-units/0208 | 98 | 2256 ms | 0.001 | 76 ms | 182 KB | 1809 KB | 1802 KB | ✅ |
| mobile | /available-units/2801 | 97 | 2408 ms | 0.001 | 88 ms | 182 KB | 1806 KB | 1802 KB | ✅ |
| mobile | /amenities | 95 | 2783 ms | 0.000 | 25 ms | 125 KB | 144 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 97 | 2484 ms | 0.000 | 43 ms | 131 KB | 109 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 96 | 2636 ms | 0.000 | 33 ms | 123 KB | 147 KB | 0 KB | ✅ |
| mobile | /knowledge | 98 | 2255 ms | 0.000 | 55 ms | 150 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 98 | 2254 ms | 0.000 | 15 ms | 148 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 98 | 2259 ms | 0.000 | 77 ms | 147 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 91 | 1936 ms | 0.000 | 0 ms | 127 KB | 1452 KB | 0 KB | ✅ |
| desktop | /available-units | 100 | 709 ms | 0.000 | 0 ms | 168 KB | 2654 KB | 2510 KB | ✅ |
| desktop | /available-units/0208 | 100 | 487 ms | 0.000 | 0 ms | 182 KB | 1809 KB | 1802 KB | ✅ |
| desktop | /available-units/2801 | 98 | 1098 ms | 0.000 | 0 ms | 182 KB | 1816 KB | 1809 KB | ✅ |
| desktop | /amenities | 99 | 826 ms | 0.000 | 0 ms | 125 KB | 372 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 667 ms | 0.000 | 0 ms | 131 KB | 385 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 685 ms | 0.000 | 0 ms | 123 KB | 293 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 504 ms | 0.000 | 0 ms | 150 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 494 ms | 0.000 | 0 ms | 148 KB | 8 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 685 ms | 0.000 | 0 ms | 147 KB | 108 KB | 0 KB | ✅ |
