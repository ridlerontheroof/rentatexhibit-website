#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$REPO_ROOT" ]]; then
  echo "ERROR: Run this inside the rentatexhibit-website Git repository."
  exit 1
fi

cd "$REPO_ROOT"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "ERROR: Working tree is not clean. Commit or stash current changes first."
  git status --short
  exit 1
fi

TARGET_BRANCH="agent/highland-seo-aeo-setup"

git fetch origin

if git show-ref --verify --quiet "refs/heads/$TARGET_BRANCH"; then
  git checkout "$TARGET_BRANCH"
elif git ls-remote --exit-code --heads origin "$TARGET_BRANCH" >/dev/null 2>&1; then
  git checkout -b "$TARGET_BRANCH" "origin/$TARGET_BRANCH"
else
  git checkout main
  git pull --ff-only origin main
  git checkout -b "$TARGET_BRANCH"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PAYLOAD="$SCRIPT_DIR/payload"

if [[ ! -f "$PAYLOAD/AGENTS.md" ]]; then
  echo "ERROR: Installer payload is incomplete."
  exit 1
fi

# Preserve existing Replit files and .agents directory.
cp "$PAYLOAD/AGENTS.md" ./AGENTS.md
cp "$PAYLOAD/README_CODEX_AGENT.md" ./README_CODEX_AGENT.md
cp "$PAYLOAD/requirements-agent.txt" ./requirements-agent.txt

mkdir -p .codex config docs tasks reports tests

cp -R "$PAYLOAD/.codex/." .codex/
cp -R "$PAYLOAD/config/." config/
cp -R "$PAYLOAD/docs/." docs/
cp -R "$PAYLOAD/tasks/." tasks/
cp -R "$PAYLOAD/reports/." reports/
cp -R "$PAYLOAD/tests/." tests/

# Use a distinct script directory to avoid colliding with application scripts.
mkdir -p codex-agent-scripts
cp -R "$PAYLOAD/scripts/." codex-agent-scripts/

# Confirm existing Replit agent directory remains present.
if [[ -d .agents ]]; then
  echo "Preserved existing .agents directory."
else
  echo "WARNING: Existing .agents directory was not found."
fi

required=(
  "AGENTS.md"
  ".codex/skills/highland-seo-aeo/SKILL.md"
  "config/source_governance.yaml"
  "config/property_context.yaml"
  "config/repository_context.yaml"
  "tasks/active/01_baseline_audit.md"
)

for file in "${required[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "ERROR: Missing required file after installation: $file"
    exit 1
  fi
done

git add \
  AGENTS.md \
  README_CODEX_AGENT.md \
  requirements-agent.txt \
  .codex \
  config \
  docs \
  tasks \
  reports \
  tests \
  codex-agent-scripts

if git diff --cached --quiet; then
  echo "No new changes to commit. The scaffold may already be installed."
else
  git commit -m "Add Highland SEO and AEO Codex agent scaffold"
fi

git push -u origin "$TARGET_BRANCH"

echo
echo "SUCCESS"
echo "Branch: $TARGET_BRANCH"
echo
echo "Next Codex prompt:"
cat <<'PROMPT'
Use the highland-seo-aeo skill.

Read, in order:
1. AGENTS.md
2. replit.md
3. seo_strategy.md
4. skills-lock.json
5. config/source_governance.yaml
6. config/property_context.yaml
7. config/repository_context.yaml
8. config/keyword_strategy.yaml
9. config/acceptance_criteria.yaml
10. tasks/active/01_baseline_audit.md

Execute the active task.

This phase is read-only. Do not modify public website code, routes, content, metadata, schema, dependencies, availability integrations, analytics, forms, or deployment configuration.

You may create the audit deliverables required by the task and verify repository commands. Do not proceed beyond Task 01.
PROMPT
