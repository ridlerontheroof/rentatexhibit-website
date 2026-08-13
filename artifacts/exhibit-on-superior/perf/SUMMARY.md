# Page-speed lab report

Generated: 2026-08-13T01:01:35.861Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 65 | 7375 ms | 0.000 | 41 ms | 475 KB | 480 KB | 0 KB | ❌ lcpMs 7375 > limit 5300 |
| mobile | /available-units | 68 | 5644 ms | 0.000 | 103 ms | 551 KB | 1530 KB | 1480 KB | ❌ lcpMs 5644 > limit 3600 |
| mobile | /available-units/0208 | 60 | 15614 ms | 0.001 | 151 ms | 621 KB | 1814 KB | 1802 KB | ❌ lcpMs 15614 > limit 6100 |
| mobile | /available-units/3108 | 72 | 4855 ms | 0.001 | 52 ms | 621 KB | 1804 KB | 1800 KB | ✅ |
| mobile | /amenities | 69 | 5558 ms | 0.000 | 43 ms | 475 KB | 144 KB | 0 KB | ❌ lcpMs 5558 > limit 4200 |
| mobile | /photo-gallery | 70 | 5409 ms | 0.000 | 55 ms | 483 KB | 109 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 96 | 2641 ms | 0.000 | 62 ms | 123 KB | 147 KB | 0 KB | ✅ |
| mobile | /knowledge | 98 | 2127 ms | 0.000 | 110 ms | 150 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 98 | 2114 ms | 0.000 | 29 ms | 147 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 94 | 2270 ms | 0.000 | 226 ms | 147 KB | 25 KB | 0 KB | ❌ tbtMs 226 > limit 200 |
| desktop | / | 93 | 1742 ms | 0.000 | 37 ms | 127 KB | 1452 KB | 0 KB | ✅ |
| desktop | /available-units | 96 | 1249 ms | 0.000 | 0 ms | 551 KB | 2653 KB | 2510 KB | ✅ |
| desktop | /available-units/0208 | 99 | 886 ms | 0.000 | 0 ms | 621 KB | 1814 KB | 1802 KB | ✅ |
| desktop | /available-units/3108 | 100 | 777 ms | 0.000 | 0 ms | 182 KB | 1804 KB | 1800 KB | ✅ |
| desktop | /amenities | 99 | 825 ms | 0.000 | 0 ms | 125 KB | 372 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 711 ms | 0.000 | 0 ms | 131 KB | 385 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 688 ms | 0.000 | 0 ms | 123 KB | 293 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 506 ms | 0.000 | 0 ms | 150 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 486 ms | 0.000 | 0 ms | 147 KB | 8 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 688 ms | 0.000 | 0 ms | 147 KB | 108 KB | 0 KB | ✅ |
