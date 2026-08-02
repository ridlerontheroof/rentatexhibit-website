# Page-speed lab report

Generated: 2026-08-02T07:59:36.530Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 91 | 3388 ms | 0.000 | 43 ms | 118 KB | 477 KB | 0 KB | ✅ |
| mobile | /available-units | 95 | 2256 ms | 0.085 | 100 ms | 154 KB | 2043 KB | 2017 KB | ✅ |
| mobile | /available-units/0208 | 98 | 2258 ms | 0.005 | 32 ms | 176 KB | 1809 KB | 1802 KB | ✅ |
| mobile | /available-units/3108 | 97 | 2406 ms | 0.005 | 28 ms | 176 KB | 1804 KB | 1800 KB | ✅ |
| mobile | /amenities | 96 | 2559 ms | 0.000 | 20 ms | 120 KB | 143 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 96 | 2515 ms | 0.000 | 25 ms | 125 KB | 108 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 97 | 2479 ms | 0.000 | 10 ms | 118 KB | 146 KB | 0 KB | ✅ |
| mobile | /knowledge | 98 | 2104 ms | 0.001 | 14 ms | 144 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 91 | 2124 ms | 0.000 | 311 ms | 142 KB | 4 KB | 0 KB | ❌ tbtMs 311 > limit 200 |
| mobile | /contact-us | 98 | 2260 ms | 0.000 | 52 ms | 141 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 91 | 1923 ms | 0.000 | 0 ms | 118 KB | 1450 KB | 0 KB | ✅ |
| desktop | /available-units | 100 | 609 ms | 0.034 | 0 ms | 154 KB | 3580 KB | 3497 KB | ✅ |
| desktop | /available-units/0208 | 98 | 1099 ms | 0.002 | 0 ms | 176 KB | 1806 KB | 1802 KB | ✅ |
| desktop | /available-units/3108 | 100 | 488 ms | 0.003 | 0 ms | 176 KB | 1807 KB | 1800 KB | ✅ |
| desktop | /amenities | 99 | 845 ms | 0.000 | 0 ms | 120 KB | 371 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 705 ms | 0.000 | 0 ms | 125 KB | 382 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 646 ms | 0.000 | 0 ms | 118 KB | 292 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 459 ms | 0.001 | 0 ms | 144 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 478 ms | 0.000 | 0 ms | 142 KB | 7 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 686 ms | 0.000 | 0 ms | 141 KB | 108 KB | 0 KB | ✅ |
