# Page-speed lab report

Generated: 2026-07-30T16:39:09.428Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 93 | 3090 ms | 0.000 | 34 ms | 119 KB | 477 KB | 0 KB | ✅ |
| mobile | /available-units | 95 | 2406 ms | 0.085 | 74 ms | 155 KB | 164 KB | 138 KB | ✅ |
| mobile | /available-units/0208 | 98 | 2330 ms | 0.005 | 29 ms | 172 KB | 75 KB | 71 KB | ✅ |
| mobile | /available-units/3108 | 96 | 2417 ms | 0.033 | 32 ms | 172 KB | 2202 KB | 2195 KB | ✅ |
| mobile | /amenities | 95 | 2556 ms | 0.000 | 15 ms | 121 KB | 143 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 97 | 2482 ms | 0.000 | 28 ms | 126 KB | 108 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 97 | 2480 ms | 0.000 | 18 ms | 118 KB | 146 KB | 0 KB | ✅ |
| mobile | /knowledge | 98 | 2106 ms | 0.001 | 10 ms | 143 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 98 | 2104 ms | 0.000 | 5 ms | 143 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 98 | 2106 ms | 0.000 | 22 ms | 142 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 92 | 1815 ms | 0.000 | 0 ms | 119 KB | 1450 KB | 0 KB | ✅ |
| desktop | /available-units | 100 | 630 ms | 0.039 | 0 ms | 155 KB | 274 KB | 191 KB | ✅ |
| desktop | /available-units/0208 | 100 | 485 ms | 0.002 | 0 ms | 172 KB | 78 KB | 71 KB | ✅ |
| desktop | /available-units/3108 | 100 | 495 ms | 0.003 | 0 ms | 172 KB | 2202 KB | 2195 KB | ✅ |
| desktop | /amenities | 99 | 847 ms | 0.000 | 0 ms | 121 KB | 371 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 706 ms | 0.000 | 0 ms | 126 KB | 382 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 665 ms | 0.000 | 0 ms | 118 KB | 292 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 580 ms | 0.001 | 0 ms | 143 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 618 ms | 0.000 | 0 ms | 143 KB | 7 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 686 ms | 0.000 | 0 ms | 142 KB | 108 KB | 0 KB | ✅ |
