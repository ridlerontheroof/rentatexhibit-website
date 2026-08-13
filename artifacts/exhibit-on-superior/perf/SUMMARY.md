# Page-speed lab report

Generated: 2026-08-13T01:00:24.175Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 82 | 4676 ms | 0.000 | 90 ms | 127 KB | 480 KB | 0 KB | ✅ |
| mobile | /available-units | 95 | 2346 ms | 0.000 | 166 ms | 165 KB | 1530 KB | 1480 KB | ✅ |
| mobile | /available-units/0208 | 97 | 2259 ms | 0.001 | 112 ms | 182 KB | 1809 KB | 1802 KB | ✅ |
| mobile | /available-units/3108 | 96 | 2406 ms | 0.001 | 120 ms | 182 KB | 1804 KB | 1800 KB | ✅ |
| mobile | /amenities | 93 | 3087 ms | 0.000 | 34 ms | 126 KB | 144 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 97 | 2561 ms | 0.000 | 44 ms | 131 KB | 109 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 97 | 2484 ms | 0.000 | 35 ms | 123 KB | 147 KB | 0 KB | ✅ |
| mobile | /knowledge | 98 | 2257 ms | 0.000 | 59 ms | 150 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 99 | 2114 ms | 0.000 | 37 ms | 148 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 95 | 2299 ms | 0.000 | 188 ms | 147 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 93 | 1782 ms | 0.000 | 0 ms | 127 KB | 1452 KB | 0 KB | ✅ |
| desktop | /available-units | 100 | 572 ms | 0.000 | 0 ms | 165 KB | 2649 KB | 2510 KB | ✅ |
| desktop | /available-units/0208 | 95 | 1485 ms | 0.000 | 0 ms | 182 KB | 1809 KB | 1802 KB | ✅ |
| desktop | /available-units/3108 | 100 | 506 ms | 0.000 | 0 ms | 182 KB | 1808 KB | 1800 KB | ✅ |
| desktop | /amenities | 99 | 828 ms | 0.000 | 0 ms | 126 KB | 372 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 706 ms | 0.000 | 0 ms | 131 KB | 385 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 687 ms | 0.000 | 11 ms | 123 KB | 293 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 627 ms | 0.000 | 0 ms | 150 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 622 ms | 0.000 | 0 ms | 148 KB | 8 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 685 ms | 0.000 | 0 ms | 147 KB | 108 KB | 0 KB | ✅ |
