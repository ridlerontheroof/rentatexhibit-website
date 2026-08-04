# Page-speed lab report

Generated: 2026-08-04T14:50:26.192Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 82 | 4665 ms | 0.000 | 53 ms | 124 KB | 478 KB | 0 KB | ✅ |
| mobile | /available-units | 95 | 2257 ms | 0.085 | 100 ms | 156 KB | 2043 KB | 2017 KB | ✅ |
| mobile | /available-units/0208 | 97 | 2408 ms | 0.004 | 43 ms | 178 KB | 1809 KB | 1802 KB | ✅ |
| mobile | /available-units/3108 | 92 | 3084 ms | 0.005 | 37 ms | 178 KB | 1804 KB | 1800 KB | ✅ |
| mobile | /amenities | 95 | 2560 ms | 0.000 | 31 ms | 123 KB | 144 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 97 | 2482 ms | 0.000 | 30 ms | 128 KB | 109 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 97 | 2457 ms | 0.000 | 10 ms | 120 KB | 146 KB | 0 KB | ✅ |
| mobile | /knowledge | 98 | 2107 ms | 0.001 | 15 ms | 147 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 98 | 2103 ms | 0.000 | 11 ms | 145 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 94 | 2928 ms | 0.000 | 55 ms | 144 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 93 | 1699 ms | 0.000 | 0 ms | 124 KB | 1450 KB | 0 KB | ✅ |
| desktop | /available-units | 100 | 569 ms | 0.029 | 0 ms | 156 KB | 3087 KB | 3003 KB | ✅ |
| desktop | /available-units/0208 | 95 | 1493 ms | 0.003 | 0 ms | 178 KB | 1809 KB | 1802 KB | ✅ |
| desktop | /available-units/3108 | 100 | 508 ms | 0.003 | 0 ms | 178 KB | 1808 KB | 1800 KB | ✅ |
| desktop | /amenities | 99 | 846 ms | 0.000 | 0 ms | 123 KB | 371 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 705 ms | 0.000 | 0 ms | 128 KB | 383 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 686 ms | 0.000 | 0 ms | 120 KB | 292 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 477 ms | 0.001 | 0 ms | 147 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 612 ms | 0.000 | 0 ms | 145 KB | 7 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 685 ms | 0.000 | 0 ms | 144 KB | 108 KB | 0 KB | ✅ |
