# Page-speed lab report

Generated: 2026-08-13T16:47:58.724Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 81 | 4020 ms | 0.000 | 234 ms | 127 KB | 480 KB | 0 KB | ❌ tbtMs 234 > limit 200 |
| mobile | /available-units | 94 | 2563 ms | 0.000 | 157 ms | 169 KB | 1533 KB | 1480 KB | ✅ |
| mobile | /available-units/0208 | 95 | 2124 ms | 0.001 | 210 ms | 182 KB | 1809 KB | 1802 KB | ❌ tbtMs 210 > limit 200 |
| mobile | /available-units/3108 | 95 | 2418 ms | 0.001 | 149 ms | 182 KB | 1804 KB | 1800 KB | ✅ |
| mobile | /amenities | 96 | 2711 ms | 0.000 | 36 ms | 126 KB | 144 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 96 | 2637 ms | 0.000 | 31 ms | 131 KB | 109 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 78 | 2731 ms | 0.000 | 654 ms | 123 KB | 147 KB | 0 KB | ❌ tbtMs 654 > limit 200 |
| mobile | /knowledge | 99 | 2112 ms | 0.000 | 29 ms | 150 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 94 | 2918 ms | 0.000 | 6 ms | 148 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 98 | 2260 ms | 0.000 | 36 ms | 147 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 81 | 722 ms | 0.413 | 0 ms | 6 KB | 465 KB | 0 KB | ❌ cls 0.413 > limit 0.1 |
| desktop | /available-units | 96 | 1265 ms | 0.000 | 0 ms | 562 KB | 2658 KB | 2510 KB | ✅ |
| desktop | /available-units/0208 | 100 | 776 ms | 0.000 | 0 ms | 182 KB | 1814 KB | 1802 KB | ✅ |
| desktop | /available-units/3108 | 100 | 821 ms | 0.000 | 0 ms | 182 KB | 1804 KB | 1800 KB | ✅ |
| desktop | /amenities | 99 | 830 ms | 0.000 | 0 ms | 126 KB | 372 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 708 ms | 0.000 | 0 ms | 131 KB | 385 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 687 ms | 0.000 | 0 ms | 123 KB | 293 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 510 ms | 0.000 | 0 ms | 150 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 509 ms | 0.000 | 0 ms | 148 KB | 8 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 692 ms | 0.000 | 0 ms | 147 KB | 108 KB | 0 KB | ✅ |
