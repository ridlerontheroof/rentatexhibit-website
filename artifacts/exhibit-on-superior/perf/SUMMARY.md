# Page-speed lab report

Generated: 2026-08-06T14:36:25.964Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 93 | 3101 ms | 0.000 | 37 ms | 125 KB | 478 KB | 0 KB | ✅ |
| mobile | /available-units | 96 | 2116 ms | 0.085 | 108 ms | 156 KB | 2043 KB | 2017 KB | ✅ |
| mobile | /available-units/0208 | 97 | 2410 ms | 0.005 | 49 ms | 178 KB | 1809 KB | 1802 KB | ✅ |
| mobile | /available-units/3108 | 95 | 2406 ms | 0.005 | 126 ms | 178 KB | 1804 KB | 1800 KB | ✅ |
| mobile | /amenities | 95 | 2786 ms | 0.000 | 42 ms | 123 KB | 144 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 96 | 2567 ms | 0.000 | 77 ms | 129 KB | 109 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 75 | 2813 ms | 0.000 | 650 ms | 121 KB | 146 KB | 0 KB | ❌ tbtMs 650 > limit 200 |
| mobile | /knowledge | 98 | 2021 ms | 0.001 | 65 ms | 148 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 98 | 2006 ms | 0.000 | 22 ms | 146 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 98 | 2269 ms | 0.000 | 52 ms | 144 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 94 | 1694 ms | 0.000 | 0 ms | 125 KB | 1450 KB | 0 KB | ✅ |
| desktop | /available-units | 100 | 590 ms | 0.029 | 0 ms | 156 KB | 3087 KB | 3003 KB | ✅ |
| desktop | /available-units/0208 | 98 | 1094 ms | 0.002 | 35 ms | 178 KB | 1809 KB | 1802 KB | ✅ |
| desktop | /available-units/3108 | 100 | 422 ms | 0.003 | 0 ms | 178 KB | 1804 KB | 1800 KB | ✅ |
| desktop | /amenities | 99 | 845 ms | 0.000 | 0 ms | 123 KB | 371 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 694 ms | 0.000 | 0 ms | 129 KB | 383 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 709 ms | 0.000 | 0 ms | 121 KB | 292 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 476 ms | 0.001 | 0 ms | 148 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 470 ms | 0.000 | 0 ms | 146 KB | 7 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 689 ms | 0.000 | 0 ms | 144 KB | 108 KB | 0 KB | ✅ |
