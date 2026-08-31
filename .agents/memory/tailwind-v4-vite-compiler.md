---
name: Tailwind v4 Vite compiler requirement
description: Why a build can emit a sizable Tailwind CSS file while every utility class is missing.
---

# Tailwind v4 needs its Vite compiler

**Rule:** In a Vite app using Tailwind v4, `@import "tailwindcss"` is not proof that utility generation is active. Register the compatible `@tailwindcss/vite` plugin and verify representative compiled selectors in the production CSS.

**Why:** A property-kit build emitted a valid-looking 24 KB stylesheet containing Tailwind theme declarations but no `.flex`, `.hidden`, spacing, typography, or responsive utilities. Static route and accessibility checks passed because the HTML was semantic, while the real browser rendered an effectively unstyled page.

**How to apply:** After any Tailwind/Vite scaffold or toolchain change, inspect the built CSS for representative utilities and a responsive media rule. Keep that assertion in release acceptance rather than relying on CSS file existence or size.