# Page-speed lab report

Generated: 2026-08-04T14:49:07.050Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 60 | 6792 ms | 0.000 | 318 ms | 460 KB | 478 KB | 0 KB | ❌ lcpMs 6792 > limit 5300; tbtMs 318 > limit 200 |
| mobile | /available-units | 31 | 5820 ms | 0.026 | 6628 ms | 156 KB | 2043 KB | 2017 KB | ❌ lcpMs 5820 > limit 3600; tbtMs 6628 > limit 200 |
| mobile | /available-units/0208 | 73 | 2354 ms | 0.005 | 1111 ms | 178 KB | 1809 KB | 1802 KB | ❌ tbtMs 1111 > limit 200 |
| mobile | /available-units/3108 | 98 | 2016 ms | 0.005 | 86 ms | 178 KB | 1804 KB | 1800 KB | ✅ |
| mobile | /amenities | 94 | 2901 ms | 0.000 | 58 ms | 123 KB | 144 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 96 | 2564 ms | 0.000 | 49 ms | 129 KB | 109 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 98 | 2331 ms | 0.000 | 41 ms | 121 KB | 146 KB | 0 KB | ✅ |
| mobile | /knowledge | 98 | 2010 ms | 0.001 | 42 ms | 148 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 98 | 2001 ms | 0.000 | 53 ms | 145 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 97 | 2267 ms | 0.000 | 67 ms | 144 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 96 | 1419 ms | 0.000 | 0 ms | 121 KB | 1450 KB | 0 KB | ✅ |
| desktop | /available-units | 99 | 788 ms | 0.029 | 13 ms | 156 KB | 3087 KB | 3003 KB | ✅ |
| desktop | /available-units/0208 | 98 | 1096 ms | 0.002 | 0 ms | 178 KB | 1809 KB | 1802 KB | ✅ |
| desktop | /available-units/3108 | 100 | 515 ms | 0.003 | 0 ms | 178 KB | 1808 KB | 1800 KB | ✅ |
| desktop | /amenities | 99 | 847 ms | 0.000 | 0 ms | 123 KB | 371 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 708 ms | 0.000 | 0 ms | 129 KB | 383 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 707 ms | 0.000 | 0 ms | 121 KB | 292 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 475 ms | 0.001 | 0 ms | 148 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 476 ms | 0.000 | 0 ms | 145 KB | 7 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 685 ms | 0.000 | 0 ms | 144 KB | 108 KB | 0 KB | ✅ |
