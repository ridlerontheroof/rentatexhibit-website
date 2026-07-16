---
name: Plan mode blocks all workspace writes
description: Why file/asset generation fails in Plan mode and how to unblock it
---

# Plan mode blocks all workspace writes

In **Plan mode**, both `ShellExec` writes to the workspace and the `executeJs`
(CodeExecution) sandbox are disabled — ShellExec reports the workspace filesystem
as read-only, and `executeJs` errors with "executeJs is disabled in Plan mode
because it changes the environment."

**Why:** Plan mode is intentionally read-only except for task plan files; it is not
a filesystem quirk. This is easy to misdiagnose as a permissions/`/tmp`-durability
problem and waste attempts on workarounds.

**How to apply:** If asset generation (e.g. ImageMagick derivatives) or any file
write fails and you are in Plan mode, stop trying workarounds — the fix is to be
switched to **Build mode**. Once in Build mode, ShellExec can write to the
workspace normally (verified: `magick` writing WebP into an artifact's `public/`
works fine).

**Bonus (ImageMagick throughput):** to make N sized derivatives from one large
source in a single decode, use clone+write in one invocation instead of N calls:
`magick src.png \( +clone -resize 600x -write a.webp +delete \) \( +clone -resize 1500x -write b.webp +delete \) -resize 2600x c.webp`
(~6.5s per ~19MP source vs 3× that with separate calls).
