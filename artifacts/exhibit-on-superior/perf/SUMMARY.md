# Page-speed lab report

Generated: 2026-08-12T16:52:51.621Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 96 | 2665 ms | 0.000 | 89 ms | 127 KB | 480 KB | 0 KB | ✅ |
| mobile | /available-units | 97 | 2332 ms | 0.000 | 111 ms | 164 KB | 1530 KB | 1480 KB | ✅ |
| mobile | /available-units/0208 | 98 | 2008 ms | 0.005 | 97 ms | 182 KB | 1809 KB | 1802 KB | ✅ |
| mobile | /available-units/3108 | 73 | 4702 ms | 0.005 | 48 ms | 621 KB | 1804 KB | 1800 KB | ✅ |
| mobile | /amenities | 87 | 3536 ms | 0.000 | 24 ms | 257 KB | 144 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 92 | 3083 ms | 0.000 | 41 ms | 131 KB | 109 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 95 | 2713 ms | 0.000 | 24 ms | 123 KB | 147 KB | 0 KB | ✅ |
| mobile | /knowledge | 99 | 2004 ms | 0.000 | 61 ms | 150 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 95 | 1998 ms | 0.000 | 193 ms | 147 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 98 | 2270 ms | 0.000 | 54 ms | 147 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 92 | 1852 ms | 0.000 | 0 ms | 127 KB | 1452 KB | 0 KB | ✅ |
| desktop | /available-units | 100 | 686 ms | 0.000 | 0 ms | 164 KB | 2649 KB | 2510 KB | ✅ |
| desktop | /available-units/0208 | 98 | 1138 ms | 0.002 | 0 ms | 182 KB | 1809 KB | 1802 KB | ✅ |
| desktop | /available-units/3108 | 100 | 487 ms | 0.003 | 0 ms | 182 KB | 1808 KB | 1800 KB | ✅ |
| desktop | /amenities | 99 | 826 ms | 0.000 | 0 ms | 125 KB | 372 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 707 ms | 0.000 | 0 ms | 131 KB | 385 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 687 ms | 0.000 | 0 ms | 123 KB | 293 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 632 ms | 0.001 | 0 ms | 150 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 501 ms | 0.000 | 0 ms | 147 KB | 8 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 685 ms | 0.000 | 0 ms | 147 KB | 108 KB | 0 KB | ✅ |
