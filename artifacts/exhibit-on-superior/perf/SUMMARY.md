# Page-speed lab report

Generated: 2026-08-04T15:13:00.943Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 89 | 3620 ms | 0.000 | 23 ms | 124 KB | 478 KB | 0 KB | ✅ |
| mobile | /available-units | 95 | 2257 ms | 0.085 | 140 ms | 156 KB | 2043 KB | 2016 KB | ✅ |
| mobile | /available-units/0208 | 93 | 2410 ms | 0.005 | 220 ms | 178 KB | 1809 KB | 1802 KB | ❌ tbtMs 220 > limit 200 |
| mobile | /available-units/3108 | 96 | 2408 ms | 0.005 | 67 ms | 178 KB | 1804 KB | 1800 KB | ✅ |
| mobile | /amenities | 94 | 2787 ms | 0.000 | 45 ms | 123 KB | 144 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 97 | 2482 ms | 0.000 | 32 ms | 129 KB | 109 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 97 | 2481 ms | 0.000 | 16 ms | 121 KB | 146 KB | 0 KB | ✅ |
| mobile | /knowledge | 98 | 2104 ms | 0.001 | 10 ms | 148 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 99 | 1956 ms | 0.000 | 4 ms | 146 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 98 | 2258 ms | 0.000 | 24 ms | 144 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 98 | 1089 ms | 0.000 | 0 ms | 124 KB | 1450 KB | 0 KB | ✅ |
| desktop | /available-units | 100 | 605 ms | 0.029 | 0 ms | 156 KB | 3087 KB | 3003 KB | ✅ |
| desktop | /available-units/0208 | 90 | 2058 ms | 0.002 | 0 ms | 178 KB | 1809 KB | 1802 KB | ✅ |
| desktop | /available-units/3108 | 100 | 503 ms | 0.003 | 0 ms | 178 KB | 1808 KB | 1800 KB | ✅ |
| desktop | /amenities | 99 | 845 ms | 0.000 | 0 ms | 123 KB | 371 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 704 ms | 0.000 | 0 ms | 129 KB | 383 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 685 ms | 0.000 | 0 ms | 121 KB | 292 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 457 ms | 0.001 | 0 ms | 148 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 479 ms | 0.000 | 0 ms | 146 KB | 7 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 688 ms | 0.000 | 0 ms | 144 KB | 108 KB | 0 KB | ✅ |
