---
name: One-shot validation workflows
description: How to run configured check workflows that exit instead of serving a port.
---

Rule: run one-shot validation commands directly rather than invoking them through the workflow restart control.

**Why:** restarting the configured prepublish check returned before completion, later showed a stale `RUNNING` state after its process had exited, and left `dist/public` between prerender and precompression. Built-output guards then correctly rejected the incomplete build.

**How to apply:** use the configured command for validation workflows that are expected to exit. Before trusting downstream built-output checks, confirm the build's final marker (`dist/public/index.html.br`) exists; otherwise rerun or finish the build before evaluating those checks.