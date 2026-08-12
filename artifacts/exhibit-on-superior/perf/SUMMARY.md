# Page-speed lab report

Generated: 2026-08-12T22:40:46.271Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 96 | 2733 ms | 0.000 | 51 ms | 127 KB | 480 KB | 0 KB | ✅ |
| mobile | /available-units | 97 | 2339 ms | 0.000 | 108 ms | 164 KB | 1530 KB | 1480 KB | ✅ |
| mobile | /available-units/0208 | 98 | 2255 ms | 0.001 | 87 ms | 182 KB | 1809 KB | 1802 KB | ✅ |
| mobile | /available-units/3108 | 98 | 2258 ms | 0.001 | 55 ms | 182 KB | 1804 KB | 1800 KB | ✅ |
| mobile | /amenities | 95 | 2781 ms | 0.000 | 26 ms | 125 KB | 144 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 96 | 2636 ms | 0.000 | 47 ms | 131 KB | 109 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 96 | 2634 ms | 0.000 | 22 ms | 123 KB | 147 KB | 0 KB | ✅ |
| mobile | /knowledge | 98 | 2255 ms | 0.000 | 74 ms | 150 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 98 | 2256 ms | 0.000 | 15 ms | 147 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 98 | 2256 ms | 0.000 | 31 ms | 147 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 99 | 1009 ms | 0.000 | 0 ms | 127 KB | 1452 KB | 0 KB | ✅ |
| desktop | /available-units | 100 | 672 ms | 0.000 | 0 ms | 164 KB | 2649 KB | 2510 KB | ✅ |
| desktop | /available-units/0208 | 98 | 1096 ms | 0.000 | 0 ms | 182 KB | 1806 KB | 1802 KB | ✅ |
| desktop | /available-units/3108 | 100 | 485 ms | 0.001 | 0 ms | 182 KB | 1808 KB | 1800 KB | ✅ |
| desktop | /amenities | 99 | 846 ms | 0.000 | 0 ms | 125 KB | 372 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 706 ms | 0.000 | 0 ms | 131 KB | 385 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 687 ms | 0.000 | 0 ms | 123 KB | 293 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 626 ms | 0.000 | 0 ms | 150 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 501 ms | 0.000 | 0 ms | 147 KB | 8 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 684 ms | 0.000 | 0 ms | 147 KB | 108 KB | 0 KB | ✅ |
