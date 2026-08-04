# Page-speed lab report

Generated: 2026-08-04T14:21:25.381Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 92 | 3313 ms | 0.000 | 43 ms | 121 KB | 478 KB | 0 KB | ✅ |
| mobile | /available-units | 95 | 2261 ms | 0.085 | 105 ms | 156 KB | 2043 KB | 2017 KB | ✅ |
| mobile | /available-units/0208 | 97 | 2404 ms | 0.004 | 33 ms | 178 KB | 1809 KB | 1802 KB | ✅ |
| mobile | /available-units/3108 | 96 | 2405 ms | 0.005 | 85 ms | 178 KB | 1804 KB | 1800 KB | ✅ |
| mobile | /amenities | 96 | 2561 ms | 0.000 | 19 ms | 123 KB | 144 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 97 | 2483 ms | 0.000 | 29 ms | 128 KB | 109 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 96 | 2609 ms | 0.000 | 13 ms | 120 KB | 146 KB | 0 KB | ✅ |
| mobile | /knowledge | 98 | 2106 ms | 0.001 | 12 ms | 147 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 98 | 2105 ms | 0.000 | 6 ms | 145 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 98 | 2262 ms | 0.000 | 35 ms | 144 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 93 | 1771 ms | 0.000 | 0 ms | 121 KB | 1450 KB | 0 KB | ✅ |
| desktop | /available-units | 100 | 588 ms | 0.029 | 0 ms | 156 KB | 3087 KB | 3003 KB | ✅ |
| desktop | /available-units/0208 | 100 | 774 ms | 0.003 | 0 ms | 178 KB | 1809 KB | 1802 KB | ✅ |
| desktop | /available-units/3108 | 100 | 474 ms | 0.003 | 0 ms | 178 KB | 1808 KB | 1800 KB | ✅ |
| desktop | /amenities | 99 | 847 ms | 0.000 | 0 ms | 123 KB | 371 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 710 ms | 0.000 | 0 ms | 128 KB | 383 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 686 ms | 0.000 | 0 ms | 120 KB | 292 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 469 ms | 0.001 | 0 ms | 147 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 464 ms | 0.000 | 0 ms | 145 KB | 7 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 689 ms | 0.000 | 0 ms | 144 KB | 108 KB | 0 KB | ✅ |
