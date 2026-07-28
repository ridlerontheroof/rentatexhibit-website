# Page-speed lab report

Generated: 2026-07-28T16:29:10.899Z

Target: local production build (dist/public via `vite preview`)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 64 | 4650 ms | 0.000 | 778 ms | 272 KB | 461 KB | 112 KB | ❌ tbtMs 778 > limit 200 |
| mobile | /available-units | 93 | 3094 ms | 0.000 | 105 ms | 321 KB | 681 KB | 260 KB | ✅ |
| mobile | /available-units/0208 | 88 | 3705 ms | 0.043 | 40 ms | 277 KB | 910 KB | 561 KB | ✅ |
| mobile | /available-units/2705 | 91 | 3311 ms | 0.034 | 45 ms | 277 KB | 1209 KB | 860 KB | ✅ |
| mobile | /amenities | 91 | 3390 ms | 0.000 | 19 ms | 272 KB | 544 KB | 112 KB | ✅ |
| mobile | /photo-gallery | 82 | 4742 ms | 0.000 | 76 ms | 276 KB | 559 KB | 112 KB | ✅ |
| mobile | /virtual-tour | 87 | 3837 ms | 0.000 | 55 ms | 270 KB | 597 KB | 112 KB | ✅ |
| mobile | /knowledge | 81 | 4966 ms | 0.000 | 44 ms | 266 KB | 461 KB | 112 KB | ✅ |
| mobile | /knowledge/application-fee | 87 | 3912 ms | 0.000 | 20 ms | 266 KB | 461 KB | 112 KB | ✅ |
| mobile | /contact-us | 91 | 3309 ms | 0.000 | 33 ms | 295 KB | 480 KB | 112 KB | ✅ |
| desktop | / | 100 | 647 ms | 0.000 | 0 ms | 272 KB | 1433 KB | 112 KB | ✅ |
| desktop | /available-units | 96 | 1346 ms | 0.000 | 0 ms | 321 KB | 1733 KB | 283 KB | ✅ |
| desktop | /available-units/0208 | 91 | 1981 ms | 0.001 | 0 ms | 277 KB | 1882 KB | 561 KB | ✅ |
| desktop | /available-units/2705 | 91 | 1979 ms | 0.001 | 0 ms | 277 KB | 2191 KB | 870 KB | ✅ |
| desktop | /amenities | 94 | 1620 ms | 0.000 | 0 ms | 272 KB | 1741 KB | 112 KB | ✅ |
| desktop | /photo-gallery | 98 | 1115 ms | 0.000 | 0 ms | 276 KB | 1792 KB | 112 KB | ✅ |
| desktop | /virtual-tour | 97 | 1259 ms | 0.000 | 0 ms | 270 KB | 1717 KB | 112 KB | ✅ |
| desktop | /knowledge | 93 | 1796 ms | 0.000 | 0 ms | 266 KB | 1433 KB | 112 KB | ✅ |
| desktop | /knowledge/application-fee | 98 | 1049 ms | 0.000 | 0 ms | 266 KB | 1435 KB | 112 KB | ✅ |
| desktop | /contact-us | 94 | 1672 ms | 0.000 | 0 ms | 295 KB | 1536 KB | 112 KB | ✅ |
