# Page-speed lab report

Generated: 2026-07-30T13:00:42.411Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 91 | 3312 ms | 0.000 | 84 ms | 120 KB | 477 KB | 0 KB | ✅ |
| mobile | /available-units | 96 | 2409 ms | 0.000 | 71 ms | 183 KB | 223 KB | 138 KB | ✅ |
| mobile | /available-units/0208 | 96 | 2562 ms | 0.050 | 48 ms | 176 KB | 75 KB | 71 KB | ✅ |
| mobile | /available-units/3108 | 84 | 4064 ms | 0.058 | 127 ms | 176 KB | 2202 KB | 2195 KB | ✅ |
| mobile | /amenities | 95 | 2794 ms | 0.000 | 51 ms | 122 KB | 143 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 96 | 2565 ms | 0.000 | 51 ms | 126 KB | 108 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 97 | 2416 ms | 0.000 | 19 ms | 119 KB | 146 KB | 0 KB | ✅ |
| mobile | /knowledge | 98 | 1999 ms | 0.001 | 24 ms | 146 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 98 | 2105 ms | 0.000 | 19 ms | 144 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 99 | 2109 ms | 0.000 | 36 ms | 143 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 92 | 1812 ms | 0.000 | 0 ms | 120 KB | 1450 KB | 0 KB | ✅ |
| desktop | /available-units | 97 | 855 ms | 0.091 | 0 ms | 183 KB | 332 KB | 191 KB | ✅ |
| desktop | /available-units/0208 | 100 | 664 ms | 0.002 | 0 ms | 176 KB | 78 KB | 71 KB | ✅ |
| desktop | /available-units/3108 | 100 | 507 ms | 0.005 | 0 ms | 176 KB | 2202 KB | 2195 KB | ✅ |
| desktop | /amenities | 99 | 845 ms | 0.000 | 0 ms | 122 KB | 371 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 706 ms | 0.000 | 0 ms | 126 KB | 382 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 666 ms | 0.000 | 0 ms | 119 KB | 292 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 505 ms | 0.000 | 0 ms | 146 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 620 ms | 0.000 | 0 ms | 144 KB | 7 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 687 ms | 0.000 | 0 ms | 143 KB | 108 KB | 0 KB | ✅ |
