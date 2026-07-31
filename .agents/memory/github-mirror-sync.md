---
name: GitHub mirror sync
description: How to push workspace main to the protected GitHub mirror; branch quirks with the Codex scaffold branch.
---

- GitHub mirror: https://github.com/ridlerontheroof/rentatexhibit-website (origin). `main` is branch-protected: direct pushes fail — gitPush returns the misleading error `BRANCH_ALREADY_EXISTS`. That is protection, not a real conflict.
- **How to apply:** to sync main → GitHub, create a branch off local main (e.g. `sync/workspace-main-...`), `gitPush({})`, then `createPullRequest` into main. Shell `git push` has no credentials (PAT not wired to git); only the gitPush callback works.
- The workspace has repeatedly been found checked out on `agent/highland-seo-aeo-setup` (the Codex scaffold branch) — external Codex runs appear to switch branches/commit there. Always verify `git branch --show-current` is `main` before edits, and switch back to main after any git work.
- Merged task commits land on local `main` even if the working tree is on another branch — "missing files" after a merge usually means wrong checked-out branch, not a failed merge.
