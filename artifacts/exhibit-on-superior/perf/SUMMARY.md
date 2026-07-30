# Page-speed lab report

Generated: 2026-07-30T17:06:11.080Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 96 | 2564 ms | 0.000 | 44 ms | 119 KB | 477 KB | 0 KB | ✅ |
| mobile | /available-units | 96 | 2260 ms | 0.085 | 90 ms | 155 KB | 164 KB | 138 KB | ✅ |
| mobile | /amenities | 95 | 2783 ms | 0.000 | 24 ms | 121 KB | 143 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 97 | 2405 ms | 0.000 | 44 ms | 126 KB | 108 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 97 | 2485 ms | 0.000 | 10 ms | 118 KB | 146 KB | 0 KB | ✅ |
| mobile | /knowledge | 98 | 2105 ms | 0.001 | 13 ms | 143 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 98 | 2104 ms | 0.000 | 2 ms | 143 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 98 | 2258 ms | 0.000 | 23 ms | 142 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 96 | 1350 ms | 0.000 | 0 ms | 119 KB | 1450 KB | 0 KB | ✅ |
| desktop | /available-units | 100 | 587 ms | 0.039 | 0 ms | 155 KB | 294 KB | 211 KB | ✅ |
| desktop | /amenities | 99 | 846 ms | 0.000 | 0 ms | 121 KB | 371 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 706 ms | 0.000 | 0 ms | 126 KB | 382 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 685 ms | 0.000 | 0 ms | 118 KB | 292 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 484 ms | 0.001 | 0 ms | 143 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 491 ms | 0.000 | 0 ms | 143 KB | 7 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 685 ms | 0.000 | 0 ms | 142 KB | 108 KB | 0 KB | ✅ |
