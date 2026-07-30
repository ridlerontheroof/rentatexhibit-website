# Page-speed lab report

Generated: 2026-07-30T23:43:31.471Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | /schedule-a-tour | 97 | 2272 ms | 0.000 | 74 ms | 155 KB | 23 KB | 0 KB | ✅ |
| desktop | /schedule-a-tour | 100 | 639 ms | 0.000 | 0 ms | 155 KB | 77 KB | 0 KB | ✅ |
