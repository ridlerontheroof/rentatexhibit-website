# Page-speed lab report

Generated: 2026-08-11T19:18:56.626Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 93 | 3096 ms | 0.000 | 40 ms | 126 KB | 479 KB | 0 KB | ✅ |
| mobile | /available-units | 93 | 2823 ms | 0.085 | 75 ms | 159 KB | 2043 KB | 2017 KB | ✅ |
| mobile | /available-units/0208 | 97 | 2407 ms | 0.005 | 30 ms | 181 KB | 1809 KB | 1802 KB | ✅ |
| mobile | /available-units/3108 | 97 | 2406 ms | 0.005 | 50 ms | 181 KB | 1804 KB | 1800 KB | ✅ |
| mobile | /amenities | 96 | 2559 ms | 0.000 | 21 ms | 125 KB | 144 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 96 | 2484 ms | 0.000 | 95 ms | 130 KB | 109 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 97 | 2482 ms | 0.000 | 15 ms | 123 KB | 147 KB | 0 KB | ✅ |
| mobile | /knowledge | 98 | 2258 ms | 0.001 | 14 ms | 149 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 98 | 2255 ms | 0.000 | 8 ms | 147 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 98 | 2258 ms | 0.000 | 36 ms | 146 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 97 | 1222 ms | 0.000 | 0 ms | 126 KB | 1451 KB | 0 KB | ✅ |
| desktop | /available-units | 99 | 1020 ms | 0.034 | 0 ms | 159 KB | 3580 KB | 3497 KB | ✅ |
| desktop | /available-units/0208 | 98 | 1094 ms | 0.002 | 0 ms | 181 KB | 1809 KB | 1802 KB | ✅ |
| desktop | /available-units/3108 | 100 | 487 ms | 0.003 | 0 ms | 181 KB | 1808 KB | 1800 KB | ✅ |
| desktop | /amenities | 99 | 847 ms | 0.000 | 0 ms | 125 KB | 372 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 706 ms | 0.000 | 0 ms | 130 KB | 385 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 667 ms | 0.000 | 0 ms | 123 KB | 293 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 622 ms | 0.001 | 0 ms | 149 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 629 ms | 0.000 | 0 ms | 147 KB | 7 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 686 ms | 0.000 | 0 ms | 146 KB | 108 KB | 0 KB | ✅ |
