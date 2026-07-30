#!/usr/bin/env bash
# One-way mirror sync: push local main to the GitHub mirror so Codex sees current code.
# Uses the GITHUB_PAT secret via GIT_ASKPASS (token never written to disk or remote URL).
# The mirror is one-way: NEVER pull from origin back into the workspace.
# Force push is intentional -- any commits made on the GitHub side (e.g. by Codex)
# are discarded; the workspace is the single source of truth.
set -euo pipefail

if [ -z "${GITHUB_PAT:-}" ]; then
  echo "GITHUB_PAT is not set" >&2
  exit 1
fi

ASKPASS="$(mktemp)"
trap 'rm -f "$ASKPASS"' EXIT
cat > "$ASKPASS" <<'EOF'
#!/bin/sh
case "$1" in
  Username*) echo "x-access-token" ;;
  Password*) echo "$GITHUB_PAT" ;;
esac
EOF
chmod +x "$ASKPASS"

cd "$(git rev-parse --show-toplevel 2>/dev/null || echo /home/runner/workspace)"

echo "Pushing local main -> origin/main (force, one-way mirror)..."
GIT_ASKPASS="$ASKPASS" git push --force origin main:main
echo "Mirror synced: $(git log --oneline -1 main)"
