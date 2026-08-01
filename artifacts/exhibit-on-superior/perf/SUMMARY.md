# Page-speed lab report

Generated: 2026-08-01T23:21:37.631Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 88 | 3847 ms | 0.000 | 28 ms | 118 KB | 477 KB | 0 KB | ✅ |
| mobile | /available-units | 96 | 2256 ms | 0.085 | 50 ms | 154 KB | 2043 KB | 2017 KB | ✅ |
| mobile | /available-units/0208 | 98 | 2258 ms | 0.005 | 27 ms | 176 KB | 1809 KB | 1802 KB | ✅ |
| mobile | /available-units/3108 | 96 | 2405 ms | 0.005 | 42 ms | 176 KB | 1804 KB | 1800 KB | ✅ |
| mobile | /amenities | 96 | 2557 ms | 0.000 | 17 ms | 120 KB | 143 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 98 | 2333 ms | 0.000 | 26 ms | 125 KB | 108 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 97 | 2404 ms | 0.000 | 6 ms | 118 KB | 146 KB | 0 KB | ✅ |
| mobile | /knowledge | 98 | 2103 ms | 0.001 | 7 ms | 144 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 98 | 2105 ms | 0.000 | 4 ms | 142 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 98 | 2257 ms | 0.000 | 18 ms | 141 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 92 | 1810 ms | 0.000 | 0 ms | 118 KB | 1450 KB | 0 KB | ✅ |
| desktop | /available-units | 100 | 607 ms | 0.034 | 0 ms | 154 KB | 3580 KB | 3497 KB | ✅ |
| desktop | /available-units/0208 | 100 | 772 ms | 0.002 | 0 ms | 176 KB | 1809 KB | 1802 KB | ✅ |
| desktop | /available-units/3108 | 100 | 500 ms | 0.003 | 0 ms | 176 KB | 1807 KB | 1800 KB | ✅ |
| desktop | /amenities | 99 | 844 ms | 0.000 | 0 ms | 120 KB | 371 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 707 ms | 0.000 | 0 ms | 125 KB | 382 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 667 ms | 0.000 | 0 ms | 118 KB | 292 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 619 ms | 0.001 | 0 ms | 144 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 465 ms | 0.000 | 0 ms | 142 KB | 7 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 686 ms | 0.000 | 0 ms | 141 KB | 108 KB | 0 KB | ✅ |
