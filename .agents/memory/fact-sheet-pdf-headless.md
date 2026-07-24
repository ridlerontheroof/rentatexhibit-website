---
name: Headless Chromium is available for PDF printing on Replit
description: How the fact-sheet PDF reprints automatically, and where to find a Chromium binary in this environment.
---

# Headless Chromium PDF printing works here — no library needed

The generate-fact-sheet script reprints its PDF automatically when facts change: it locates a Chromium binary (CHROME_BIN env → PATH names → `~/.cache/ms-playwright/chromium-*` → `/nix/store/*-playwright-browsers-chromium/chromium-*/chrome-linux/chrome`) and shells out with `--headless=new --no-sandbox --disable-gpu --no-pdf-header-footer --print-to-pdf=...` — no puppeteer/playwright dependency. Falls back to the manual print + `--accept-pdf` failure message if no browser is found.

**Why:** Replit's workspace nix store ships playwright-browsers-chromium even though playwright isn't installed; the CLI print honors `@page { size: Letter; margin: 0 }` and yields a single Letter page. The deploy pipeline may be pure Node without a browser — hence the fallback must stay.

**How to apply:** Any future "render HTML to PDF/image at build time" need can use the same binary-discovery + CLI approach instead of adding a browser dependency. D-Bus errors on stderr are harmless.
