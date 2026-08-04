# Page-speed lab report

Generated: 2026-08-04T17:42:08.786Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 92 | 3160 ms | 0.000 | 43 ms | 125 KB | 478 KB | 0 KB | ✅ |
| mobile | /available-units | 97 | 2105 ms | 0.085 | 70 ms | 156 KB | 2043 KB | 2017 KB | ✅ |
| mobile | /available-units/0208 | 95 | 2404 ms | 0.005 | 145 ms | 178 KB | 1809 KB | 1802 KB | ✅ |
| mobile | /available-units/3108 | 97 | 2310 ms | 0.005 | 33 ms | 178 KB | 1804 KB | 1800 KB | ✅ |
| mobile | /amenities | 96 | 2561 ms | 0.000 | 12 ms | 123 KB | 144 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 97 | 2408 ms | 0.000 | 31 ms | 129 KB | 109 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 97 | 2481 ms | 0.000 | 17 ms | 121 KB | 146 KB | 0 KB | ✅ |
| mobile | /knowledge | 98 | 2104 ms | 0.001 | 12 ms | 148 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 98 | 2104 ms | 0.000 | 15 ms | 146 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 98 | 2256 ms | 0.000 | 59 ms | 145 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 93 | 1729 ms | 0.000 | 0 ms | 125 KB | 1450 KB | 0 KB | ✅ |
| desktop | /available-units | 92 | 1857 ms | 0.029 | 0 ms | 156 KB | 3087 KB | 3003 KB | ✅ |
| desktop | /available-units/0208 | 100 | 486 ms | 0.002 | 0 ms | 178 KB | 1809 KB | 1802 KB | ✅ |
| desktop | /available-units/3108 | 100 | 503 ms | 0.003 | 0 ms | 178 KB | 1808 KB | 1800 KB | ✅ |
| desktop | /amenities | 99 | 848 ms | 0.000 | 0 ms | 123 KB | 371 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 706 ms | 0.000 | 0 ms | 129 KB | 383 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 665 ms | 0.000 | 0 ms | 121 KB | 292 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 460 ms | 0.001 | 0 ms | 148 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 456 ms | 0.000 | 0 ms | 146 KB | 7 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 687 ms | 0.000 | 0 ms | 145 KB | 108 KB | 0 KB | ✅ |
