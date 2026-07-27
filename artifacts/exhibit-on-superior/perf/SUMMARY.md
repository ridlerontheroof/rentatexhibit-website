# Page-speed lab report

Generated: 2026-07-27T02:58:28.378Z

Target: local production build (dist/public via `vite preview`)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 87 | 3642 ms | 0.000 | 186 ms | 268 KB | 575 KB | 112 KB | ✅ |
| mobile | /available-units | 72 | 5760 ms | 0.000 | 275 ms | 320 KB | 818 KB | 283 KB | ❌ tbtMs 275 > limit 200 |
| mobile | /available-units/0208 | 78 | 5004 ms | 0.043 | 178 ms | 276 KB | 1024 KB | 561 KB | ✅ |
| mobile | /available-units/2705 | 85 | 3887 ms | 0.042 | 167 ms | 276 KB | 1323 KB | 860 KB | ✅ |
| mobile | /amenities | 79 | 4664 ms | 0.000 | 199 ms | 268 KB | 680 KB | 112 KB | ✅ |
| mobile | /photo-gallery | 84 | 4366 ms | 0.000 | 71 ms | 273 KB | 674 KB | 112 KB | ✅ |
| mobile | /virtual-tour | 82 | 4819 ms | 0.000 | 27 ms | 267 KB | 729 KB | 112 KB | ✅ |
| mobile | /knowledge | 89 | 3681 ms | 0.000 | 36 ms | 262 KB | 575 KB | 112 KB | ✅ |
| mobile | /knowledge/application-fee | 90 | 3603 ms | 0.000 | 10 ms | 262 KB | 575 KB | 112 KB | ✅ |
| mobile | /contact-us | 82 | 4591 ms | 0.000 | 69 ms | 291 KB | 594 KB | 112 KB | ✅ |
| desktop | / | 91 | 2007 ms | 0.000 | 0 ms | 268 KB | 1486 KB | 112 KB | ✅ |
| desktop | /available-units | 97 | 1198 ms | 0.000 | 8 ms | 320 KB | 475 KB | 283 KB | ✅ |
| desktop | /available-units/0208 | 98 | 1126 ms | 0.001 | 30 ms | 276 KB | 1934 KB | 561 KB | ✅ |
| desktop | /available-units/2705 | 94 | 1687 ms | 0.001 | 5 ms | 276 KB | 2243 KB | 870 KB | ✅ |
| desktop | /amenities | 91 | 1993 ms | 0.000 | 0 ms | 268 KB | 1873 KB | 112 KB | ✅ |
| desktop | /photo-gallery | 91 | 1995 ms | 0.000 | 5 ms | 273 KB | 1844 KB | 112 KB | ✅ |
| desktop | /virtual-tour | 97 | 1313 ms | 0.000 | 0 ms | 267 KB | 1769 KB | 112 KB | ✅ |
| desktop | /knowledge | 91 | 2025 ms | 0.000 | 0 ms | 262 KB | 1486 KB | 112 KB | ✅ |
| desktop | /knowledge/application-fee | 92 | 1855 ms | 0.000 | 0 ms | 262 KB | 1487 KB | 112 KB | ✅ |
| desktop | /contact-us | 91 | 2021 ms | 0.000 | 0 ms | 291 KB | 1588 KB | 112 KB | ✅ |
