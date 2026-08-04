# Page-speed lab report

Generated: 2026-08-04T14:45:01.698Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 95 | 2724 ms | 0.000 | 34 ms | 121 KB | 478 KB | 0 KB | ✅ |
| mobile | /available-units | 94 | 2427 ms | 0.085 | 95 ms | 156 KB | 2043 KB | 2017 KB | ✅ |
| mobile | /amenities | 96 | 2645 ms | 0.000 | 62 ms | 123 KB | 144 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 97 | 2483 ms | 0.000 | 55 ms | 128 KB | 109 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 95 | 2653 ms | 0.000 | 79 ms | 121 KB | 146 KB | 0 KB | ✅ |
| mobile | /knowledge | 98 | 1854 ms | 0.001 | 110 ms | 147 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 98 | 2112 ms | 0.000 | 42 ms | 145 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 97 | 2277 ms | 0.000 | 63 ms | 144 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 93 | 1777 ms | 0.000 | 0 ms | 121 KB | 1450 KB | 0 KB | ✅ |
| desktop | /available-units | 93 | 1746 ms | 0.029 | 0 ms | 156 KB | 3087 KB | 3003 KB | ✅ |
| desktop | /amenities | 99 | 847 ms | 0.000 | 0 ms | 123 KB | 371 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 706 ms | 0.000 | 0 ms | 128 KB | 383 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 76 | 1145 ms | 0.000 | 409 ms | 121 KB | 292 KB | 0 KB | ❌ tbtMs 409 > limit 200 |
| desktop | /knowledge | 100 | 490 ms | 0.001 | 0 ms | 147 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 95 | 1275 ms | 0.000 | 0 ms | 609 KB | 12 KB | 0 KB | ✅ |
| desktop | /contact-us | 97 | 1155 ms | 0.000 | 0 ms | 538 KB | 108 KB | 0 KB | ✅ |
