# Page-speed lab report

Generated: 2026-08-04T20:45:22.935Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 89 | 3610 ms | 0.000 | 42 ms | 125 KB | 478 KB | 0 KB | ✅ |
| mobile | /available-units | 96 | 2258 ms | 0.085 | 70 ms | 156 KB | 2043 KB | 2017 KB | ✅ |
| mobile | /available-units/0208 | 98 | 2258 ms | 0.005 | 34 ms | 178 KB | 1809 KB | 1802 KB | ✅ |
| mobile | /available-units/3108 | 96 | 2405 ms | 0.005 | 91 ms | 178 KB | 1804 KB | 1800 KB | ✅ |
| mobile | /amenities | 96 | 2556 ms | 0.000 | 12 ms | 123 KB | 144 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 97 | 2482 ms | 0.000 | 35 ms | 129 KB | 109 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 96 | 2635 ms | 0.000 | 45 ms | 121 KB | 146 KB | 0 KB | ✅ |
| mobile | /knowledge | 98 | 1994 ms | 0.001 | 69 ms | 148 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 98 | 1995 ms | 0.000 | 8 ms | 146 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 98 | 2259 ms | 0.000 | 42 ms | 144 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 95 | 1516 ms | 0.000 | 0 ms | 125 KB | 1450 KB | 0 KB | ✅ |
| desktop | /available-units | 96 | 1380 ms | 0.029 | 0 ms | 156 KB | 3087 KB | 3003 KB | ✅ |
| desktop | /available-units/0208 | 100 | 486 ms | 0.002 | 0 ms | 178 KB | 1809 KB | 1802 KB | ✅ |
| desktop | /available-units/3108 | 100 | 489 ms | 0.003 | 0 ms | 178 KB | 1808 KB | 1800 KB | ✅ |
| desktop | /amenities | 99 | 826 ms | 0.000 | 0 ms | 123 KB | 371 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 706 ms | 0.000 | 0 ms | 129 KB | 383 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 687 ms | 0.000 | 0 ms | 121 KB | 292 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 499 ms | 0.001 | 0 ms | 148 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 617 ms | 0.000 | 0 ms | 146 KB | 7 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 686 ms | 0.000 | 0 ms | 144 KB | 108 KB | 0 KB | ✅ |
