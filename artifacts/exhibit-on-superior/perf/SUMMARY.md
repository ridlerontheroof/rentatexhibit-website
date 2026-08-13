# Page-speed lab report

Generated: 2026-08-13T12:18:14.150Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 91 | 3386 ms | 0.000 | 28 ms | 127 KB | 480 KB | 0 KB | ✅ |
| mobile | /available-units | 97 | 2339 ms | 0.000 | 84 ms | 165 KB | 1530 KB | 1480 KB | ✅ |
| mobile | /amenities | 95 | 2782 ms | 0.000 | 12 ms | 125 KB | 144 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 97 | 2559 ms | 0.000 | 30 ms | 131 KB | 109 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 97 | 2482 ms | 0.000 | 9 ms | 123 KB | 147 KB | 0 KB | ✅ |
| mobile | /knowledge | 98 | 2260 ms | 0.000 | 10 ms | 150 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 98 | 2255 ms | 0.000 | 4 ms | 148 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 98 | 2259 ms | 0.000 | 37 ms | 147 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 96 | 1390 ms | 0.000 | 0 ms | 127 KB | 1452 KB | 0 KB | ✅ |
| desktop | /available-units | 100 | 726 ms | 0.000 | 0 ms | 165 KB | 2649 KB | 2510 KB | ✅ |
| desktop | /amenities | 99 | 824 ms | 0.000 | 0 ms | 125 KB | 372 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 709 ms | 0.000 | 0 ms | 131 KB | 385 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 667 ms | 0.000 | 0 ms | 123 KB | 293 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 502 ms | 0.000 | 0 ms | 150 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 499 ms | 0.000 | 0 ms | 148 KB | 8 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 688 ms | 0.000 | 0 ms | 147 KB | 108 KB | 0 KB | ✅ |
