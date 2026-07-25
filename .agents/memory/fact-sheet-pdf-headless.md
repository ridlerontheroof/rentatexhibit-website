---
name: Headless Chromium is available for PDF printing on Replit
description: How the fact-sheet PDF reprints automatically, and where to find a Chromium binary in this environment.
---

# Headless Chromium PDF printing works here — no library needed

The generate-fact-sheet script reprints its PDF automatically when facts change: it locates a Chromium binary (CHROME_BIN env → PATH names → `~/.cache/ms-playwright/chromium-*` → `/nix/store/*-playwright-browsers-chromium/chromium-*/chrome-linux/chrome`) and shells out with `--headless=new --no-sandbox --disable-gpu --no-pdf-header-footer --print-to-pdf=...` — no puppeteer/playwright dependency. Falls back to the manual print + `--accept-pdf` failure message if no browser is found.

**Why:** Replit's workspace nix store ships playwright-browsers-chromium even though playwright isn't installed; the CLI print honors `@page { size: Letter; margin: 0 }` and yields a single Letter page. The deploy pipeline may be pure Node without a browser — hence the fallback must stay.

**How to apply:** Any future "render HTML to PDF/image at build time" need can use the same binary-discovery + CLI approach instead of adding a browser dependency. D-Bus errors on stderr are harmless.

**Deploy-build behavior (Jul 2026):** deployment builds (`REPLIT_DEPLOYMENT=1` or `CI=true`) never fail on a stale PDF — they warn loudly and exit 0, since the deploy image may ship no browser and the PDF is a docs artifact, not part of the served site. Freshness is enforced workspace-side: reprint + commit before publish. The script also logs whether a Chromium was found on every run, so the next publish's build log answers whether the deploy image ships one. `FACT_SHEET_FORCE_NO_BROWSER=1` simulates a browser-less env for testing.

**Deploy-build verification (confirmed 2026-07-24):** ✅ The deploy image (Cloud Run / autoscale) **DOES** ship a Chromium binary. Build log from `ed0bc099` (2026-07-24 23:18 UTC) confirms: `Headless Chromium available for PDF printing: /nix/store/0n9rl5l9syy808xi9bk4f6dhnfrvhkww-playwright-browsers-chromium/chromium-1080/chrome-linux/chrome`. This means the PDF can reprint itself automatically during a deploy build if facts change — the fallback warning path is only needed if the nix store derivation ever stops being included.

**Update (Jul 2026):** the `~/.cache/ms-playwright/chromium-*` copy fails with missing `libglib-2.0.so.0`; use the `/nix/store/*-playwright-browsers-chromium/chromium-*/chrome-linux/chrome` binary instead — it also works for `--screenshot=` captures of local HTML (used for email template previews).

**Screenshot gotcha (Jul 2026):** `--headless=new` CLI `--screenshot` captures a blank, unpainted frame with the nix-store Chromium (even with virtual-time-budget / compositor flags); use `--headless=old` for screenshots. PDF printing works fine in new headless.
