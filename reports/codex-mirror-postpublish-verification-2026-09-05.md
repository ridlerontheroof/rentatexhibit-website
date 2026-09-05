# Codex mirror post-publish verification — 2026-09-05

## Result

PASS. The running `postpublish` workflow detected the first publish after its
baseline, completed the live-site checks, received `GITHUB_PAT`, and successfully
force-pushed the workspace `main` branch to the Codex GitHub mirror.

## Observed publish transition

- Watcher baseline: `mtocwjgv-3c3a91ca`
- Newly detected live build: `mtod5uq5-dab0e016`
- Detection logged at `12:36:59 UTC`
- Settled checks started at `12:37:29 UTC`
- Post-publish checks passed at `12:39:15 UTC`

The workflow log explicitly reported:

```text
[12:36:59] New live build id detected: mtod5uq5-dab0e016 (was mtocwjgv-3c3a91ca). Confirming it settled…
[12:39:15] POST-PUBLISH CHECKS PASSED — live site looks healthy.
```

## Automatic mirror sync

The watcher invoked `scripts/sync-github-mirror.sh` after the checks. GitHub
accepted the forced update:

```text
[12:39:16] Syncing local main to the Codex GitHub mirror…
To https://github.com/ridlerontheroof/rentatexhibit-website.git
 + 979f403f...f348b2bd main -> main (forced update)
Mirror synced: f348b2bd Confirm Google transferred floor-plan search traffic to the hub
[12:39:22] CODEX MIRROR SYNC PASSED — GitHub mirror is current.
```

At the moment of the automatic sync:

- Workspace `main`: `f348b2bd8b007de6f7939b7dea3f0c15c0622dc3`
- GitHub mirror `main` after sync: `f348b2bd8b007de6f7939b7dea3f0c15c0622dc3`

An independent manual re-sync was needed after a concurrent GitHub-side rewrite
moved the remote back to `979f403f…`. The repeated one-way push was verified
immediately and after a 20-second stability window; both reads returned
`f348b2bd8b007de6f7939b7dea3f0c15c0622dc3`.

## Final branch verification procedure

Publishing subsequently added Replit's normal `Published your App` commits to
workspace `main`. The completion procedure is therefore to commit this evidence,
run the one-way mirror sync once more, and compare `git rev-parse main` with
GitHub's `refs/heads/main` immediately and after a stability delay. This keeps
the mirror aligned with the complete post-publish history rather than only the
commit that existed when the watcher fired.

## Source evidence

- Workflow: `postpublish`
- Workflow run ID: `ntE9FKIpb74j4gydfJZgv`
- Workflow log captured by Replit on 2026-09-05
- Live endpoint: `https://www.rentatexhibit.com/build-id.json`
- Mirror: `https://github.com/ridlerontheroof/rentatexhibit-website`