# Page-speed lab report

Generated: 2026-08-04T16:00:06.049Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 92 | 3311 ms | 0.000 | 53 ms | 125 KB | 478 KB | 0 KB | ✅ |
| mobile | /available-units | 96 | 2257 ms | 0.085 | 45 ms | 156 KB | 2043 KB | 2017 KB | ✅ |
| mobile | /available-units/0208 | 98 | 2107 ms | 0.005 | 70 ms | 178 KB | 1809 KB | 1802 KB | ✅ |
| mobile | /available-units/3108 | 97 | 2407 ms | 0.005 | 64 ms | 178 KB | 1804 KB | 1800 KB | ✅ |
| mobile | /amenities | 96 | 2561 ms | 0.000 | 13 ms | 123 KB | 144 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 96 | 2590 ms | 0.000 | 34 ms | 129 KB | 109 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 98 | 2114 ms | 0.000 | 22 ms | 121 KB | 146 KB | 0 KB | ✅ |
| mobile | /knowledge | 98 | 2103 ms | 0.001 | 11 ms | 148 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 98 | 1997 ms | 0.000 | 13 ms | 146 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 97 | 2258 ms | 0.000 | 107 ms | 144 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 94 | 1666 ms | 0.000 | 0 ms | 125 KB | 1450 KB | 0 KB | ✅ |
| desktop | /available-units | 93 | 1707 ms | 0.029 | 0 ms | 156 KB | 3087 KB | 3003 KB | ✅ |
| desktop | /available-units/0208 | 98 | 1093 ms | 0.002 | 0 ms | 178 KB | 1809 KB | 1802 KB | ✅ |
| desktop | /available-units/3108 | 100 | 431 ms | 0.003 | 7 ms | 178 KB | 1808 KB | 1800 KB | ✅ |
| desktop | /amenities | 99 | 847 ms | 0.000 | 0 ms | 123 KB | 371 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 666 ms | 0.000 | 0 ms | 129 KB | 383 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 671 ms | 0.000 | 0 ms | 121 KB | 292 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 500 ms | 0.001 | 0 ms | 148 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 501 ms | 0.000 | 0 ms | 146 KB | 7 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 686 ms | 0.000 | 0 ms | 144 KB | 108 KB | 0 KB | ✅ |
