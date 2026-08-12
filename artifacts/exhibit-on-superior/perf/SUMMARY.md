# Page-speed lab report

Generated: 2026-08-12T11:56:10.235Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 94 | 3087 ms | 0.000 | 30 ms | 127 KB | 480 KB | 0 KB | ✅ |
| mobile | /available-units | 98 | 2184 ms | 0.000 | 74 ms | 164 KB | 1530 KB | 1481 KB | ✅ |
| mobile | /available-units/0208 | 98 | 2254 ms | 0.005 | 59 ms | 181 KB | 1809 KB | 1802 KB | ✅ |
| mobile | /available-units/3108 | 97 | 2405 ms | 0.005 | 64 ms | 181 KB | 1804 KB | 1800 KB | ✅ |
| mobile | /amenities | 95 | 2785 ms | 0.000 | 14 ms | 125 KB | 144 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 95 | 2869 ms | 0.000 | 30 ms | 131 KB | 109 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 97 | 2481 ms | 0.000 | 13 ms | 123 KB | 147 KB | 0 KB | ✅ |
| mobile | /knowledge | 98 | 2254 ms | 0.001 | 54 ms | 150 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 98 | 2256 ms | 0.000 | 4 ms | 147 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 98 | 2259 ms | 0.000 | 43 ms | 147 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 92 | 1813 ms | 0.000 | 0 ms | 127 KB | 1452 KB | 0 KB | ✅ |
| desktop | /available-units | 100 | 720 ms | 0.000 | 0 ms | 164 KB | 2649 KB | 2510 KB | ✅ |
| desktop | /available-units/0208 | 100 | 776 ms | 0.002 | 0 ms | 181 KB | 1809 KB | 1802 KB | ✅ |
| desktop | /available-units/3108 | 100 | 502 ms | 0.003 | 0 ms | 181 KB | 1808 KB | 1800 KB | ✅ |
| desktop | /amenities | 99 | 848 ms | 0.000 | 0 ms | 125 KB | 372 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 707 ms | 0.000 | 0 ms | 131 KB | 385 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 706 ms | 0.000 | 0 ms | 123 KB | 293 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 502 ms | 0.001 | 0 ms | 150 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 619 ms | 0.000 | 0 ms | 147 KB | 8 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 689 ms | 0.000 | 0 ms | 147 KB | 108 KB | 0 KB | ✅ |
