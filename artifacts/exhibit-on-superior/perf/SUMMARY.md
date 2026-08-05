# Page-speed lab report

Generated: 2026-08-05T19:04:00.863Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 90 | 3308 ms | 0.000 | 105 ms | 125 KB | 478 KB | 0 KB | ✅ |
| mobile | /available-units | 95 | 2257 ms | 0.085 | 92 ms | 156 KB | 2043 KB | 2016 KB | ✅ |
| mobile | /available-units/0208 | 97 | 2406 ms | 0.005 | 54 ms | 178 KB | 1809 KB | 1802 KB | ✅ |
| mobile | /available-units/3108 | 96 | 2406 ms | 0.005 | 89 ms | 178 KB | 1804 KB | 1800 KB | ✅ |
| mobile | /amenities | 96 | 2560 ms | 0.000 | 79 ms | 123 KB | 144 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 97 | 2480 ms | 0.000 | 71 ms | 129 KB | 109 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 97 | 2407 ms | 0.000 | 52 ms | 121 KB | 146 KB | 0 KB | ✅ |
| mobile | /knowledge | 98 | 2013 ms | 0.001 | 24 ms | 148 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 98 | 2104 ms | 0.000 | 12 ms | 146 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 98 | 2256 ms | 0.000 | 36 ms | 144 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 95 | 1536 ms | 0.000 | 0 ms | 125 KB | 1450 KB | 0 KB | ✅ |
| desktop | /available-units | 96 | 1383 ms | 0.029 | 0 ms | 156 KB | 3087 KB | 3003 KB | ✅ |
| desktop | /available-units/0208 | 91 | 1936 ms | 0.002 | 0 ms | 178 KB | 1809 KB | 1802 KB | ✅ |
| desktop | /available-units/3108 | 100 | 495 ms | 0.003 | 0 ms | 178 KB | 1808 KB | 1800 KB | ✅ |
| desktop | /amenities | 99 | 848 ms | 0.000 | 0 ms | 123 KB | 371 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 705 ms | 0.000 | 0 ms | 129 KB | 383 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 706 ms | 0.000 | 0 ms | 121 KB | 292 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 623 ms | 0.001 | 0 ms | 148 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 503 ms | 0.000 | 0 ms | 146 KB | 7 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 688 ms | 0.000 | 0 ms | 144 KB | 108 KB | 0 KB | ✅ |
