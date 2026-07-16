---
name: React 19 SSR auto-emits image preloads
description: Why a heavy PNG preload appeared in prerendered pages with no source writing it
---
React 19's `renderToString` automatically hoists a `<link rel="preload" as="image">` into `<head>` for any eager (non-lazy) plain `<img>` rendered outside a `<picture>`. No source file contains the link — grep for it and you'll find nothing.

**Why:** The site's prerenderer bakes that head into every static page, so a plain `<img src="big.png">` (e.g. a header logo) makes every visitor download the original file at high priority even when smaller WebP/AVIF variants exist.

**How to apply:** Render all site images through `SmartImg` (its `<picture>` suppresses the auto-preload and serves variants). If an unexplained image preload shows up in `dist/public/*.html`, look for a plain eager `<img>` in a shared component, not for an injected link.
