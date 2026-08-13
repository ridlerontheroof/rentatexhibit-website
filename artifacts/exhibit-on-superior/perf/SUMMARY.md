# Page-speed lab report

Generated: 2026-08-13T15:31:00.589Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 80 | 5119 ms | 0.000 | 59 ms | 127 KB | 480 KB | 0 KB | ✅ |
| mobile | /available-units | 97 | 2339 ms | 0.000 | 112 ms | 165 KB | 1530 KB | 1480 KB | ✅ |
| mobile | /amenities | 95 | 2785 ms | 0.000 | 56 ms | 126 KB | 144 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 97 | 2482 ms | 0.000 | 42 ms | 131 KB | 109 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 96 | 2633 ms | 0.000 | 34 ms | 123 KB | 147 KB | 0 KB | ✅ |
| mobile | /knowledge | 99 | 2108 ms | 0.000 | 49 ms | 150 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 98 | 2254 ms | 0.000 | 14 ms | 148 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 98 | 2262 ms | 0.000 | 76 ms | 147 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 95 | 1574 ms | 0.000 | 0 ms | 127 KB | 1452 KB | 0 KB | ✅ |
| desktop | /available-units | 100 | 690 ms | 0.000 | 0 ms | 165 KB | 2649 KB | 2510 KB | ✅ |
| desktop | /amenities | 99 | 826 ms | 0.000 | 0 ms | 126 KB | 372 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 667 ms | 0.000 | 0 ms | 131 KB | 385 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 666 ms | 0.000 | 0 ms | 123 KB | 293 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 472 ms | 0.000 | 0 ms | 150 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 655 ms | 0.000 | 0 ms | 148 KB | 8 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 694 ms | 0.000 | 12 ms | 147 KB | 108 KB | 0 KB | ✅ |
