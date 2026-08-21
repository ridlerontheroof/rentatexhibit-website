---
name: Headless Chromium is available for PDF printing on Replit
description: How the fact-sheet PDF reprints automatically, and where to find a Chromium binary in this environment.
---

# Headless Chromium PDF printing works here — no library needed

The generate-fact-sheet script reprints its PDF automatically when facts change: it locates a Chromium binary (CHROME_BIN env → PATH names → `~/.cache/ms-playwright/chromium-*` → `/nix/store/*-playwright-browsers-chromium/chromium-*/chrome-linux/chrome`) and shells out with `--headless=new --no-sandbox --disable-gpu --no-pdf-header-footer --print-to-pdf=...` — no puppeteer/playwright dependency. Falls back to the manual print + `--accept-pdf` failure message if no browser is found.

**Why:** Replit's workspace nix store ships playwright-browsers-chromium even though playwright isn't installed; the CLI print honors `@page { size: Letter; margin: 0 }` and yields a single Letter page. The deploy pipeline may be pure Node without a browser — hence the fallback must stay.

**How to apply:** Any future "render HTML to PDF/image at build time" need can use the same binary-discovery + CLI approach instead of adding a browser dependency. D-Bus errors on stderr are harmless.

**Deploy-build behavior (confirmed 2026-08-21):** deployment builds (`REPLIT_DEPLOYMENT=1` or `CI=true`) skip Chromium discovery entirely. Even PATH probes plus a `/nix/store` scan caused two silent publish failures immediately after the fact-sheet HTML was written, while an identical build passed. A docs PDF must never block the served site, so PDF freshness is enforced workspace-side: reprint + commit before publish. Deployment builds warn and exit 0 if the committed PDF is stale. `FACT_SHEET_FORCE_NO_BROWSER=1` remains a workspace-side test hook.

**Update (Jul 2026):** the `~/.cache/ms-playwright/chromium-*` copy fails with missing `libglib-2.0.so.0`; use the `/nix/store/*-playwright-browsers-chromium/chromium-*/chrome-linux/chrome` binary instead — it also works for `--screenshot=` captures of local HTML (used for email template previews).

**Screenshot gotcha (Jul 2026):** `--headless=new` CLI `--screenshot` captures a blank, unpainted frame with the nix-store Chromium (even with virtual-time-budget / compositor flags); use `--headless=old` for screenshots. PDF printing works fine in new headless.

**Playwright gotcha (Aug 2026):** the bundled browser cache has the same missing-library failure. Launch Playwright with an explicit nix-store `executablePath`. The skill runner sanitizes absolute script paths, so pipe `/tmp` scripts through stdin instead of passing the path. On prerendered React pages, wait for hydration before filling forms or hydration can reset values typed into the SSR DOM.

**Why:** These three failures look like an unavailable browser or broken form but are harness/environment issues; repeated retries without changing the browser path, runner input, and hydration timing produce misleading results.

**How to apply:** For browser verification scripts, discover a working nix-store Chromium, use headless mode when no display server exists, feed the script over stdin, and wait for the hydrated app before entering data.
