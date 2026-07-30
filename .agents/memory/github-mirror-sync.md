---
name: GitHub mirror sync
description: How to push workspace main to the GitHub mirror for Codex; one-way rules and branch quirks.
---

- GitHub mirror: https://github.com/ridlerontheroof/rentatexhibit-website (origin), one-way. NEVER pull from origin back into the workspace.
- **How to sync:** run `bash scripts/sync-github-mirror.sh` — force-pushes local main to origin/main using the GITHUB_PAT secret via GIT_ASKPASS. Run after significant work sessions. Force is intentional: remote-side (Codex) commits are discarded; the workspace is the single source of truth.
- The gitPush callback to `main` fails with the misleading `BRANCH_ALREADY_EXISTS` (it refuses non-fast-forward / existing-branch pushes); the PAT script is the working route. **Why:** the mirror's main diverges whenever Codex commits remotely, so only a force push stays clean.
- The workspace has repeatedly been found checked out on a Codex scaffold branch — always verify `git branch --show-current` is `main` before edits, and switch back after any git work.
- Merged task commits land on local `main` even if the working tree is on another branch — "missing files" after a merge usually means wrong checked-out branch, not a failed merge.
