# Page-speed lab report

Generated: 2026-07-31T16:00:42.084Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 85 | 4155 ms | 0.000 | 31 ms | 118 KB | 477 KB | 0 KB | ✅ |
| mobile | /available-units | 96 | 2108 ms | 0.085 | 121 ms | 154 KB | 272 KB | 246 KB | ✅ |
| mobile | /available-units/0208 | 97 | 2424 ms | 0.011 | 43 ms | 175 KB | 2067 KB | 2060 KB | ✅ |
| mobile | /available-units/3108 | 96 | 2413 ms | 0.058 | 44 ms | 175 KB | 2067 KB | 2060 KB | ✅ |
| mobile | /amenities | 95 | 2559 ms | 0.000 | 15 ms | 119 KB | 143 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 98 | 2331 ms | 0.000 | 24 ms | 124 KB | 108 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 98 | 2258 ms | 0.000 | 11 ms | 117 KB | 146 KB | 0 KB | ✅ |
| mobile | /knowledge | 98 | 2105 ms | 0.001 | 11 ms | 144 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 98 | 2105 ms | 0.000 | 6 ms | 142 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 94 | 2918 ms | 0.000 | 51 ms | 140 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 95 | 1527 ms | 0.000 | 0 ms | 118 KB | 1450 KB | 0 KB | ✅ |
| desktop | /available-units | 100 | 608 ms | 0.039 | 0 ms | 154 KB | 470 KB | 387 KB | ✅ |
| desktop | /available-units/0208 | 100 | 486 ms | 0.003 | 0 ms | 175 KB | 2067 KB | 2060 KB | ✅ |
| desktop | /available-units/3108 | 100 | 534 ms | 0.003 | 0 ms | 175 KB | 2067 KB | 2060 KB | ✅ |
| desktop | /amenities | 99 | 847 ms | 0.000 | 0 ms | 119 KB | 371 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 705 ms | 0.000 | 0 ms | 124 KB | 382 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 685 ms | 0.000 | 0 ms | 117 KB | 292 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 461 ms | 0.001 | 0 ms | 144 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 479 ms | 0.000 | 0 ms | 142 KB | 7 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 687 ms | 0.000 | 0 ms | 140 KB | 108 KB | 0 KB | ✅ |
