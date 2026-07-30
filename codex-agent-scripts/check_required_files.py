from pathlib import Path
import sys

REQUIRED = [
    "AGENTS.md",
    "config/source_governance.yaml",
    "config/property_context.yaml",
    "config/keyword_strategy.yaml",
    "config/acceptance_criteria.yaml",
    ".codex/skills/highland-seo-aeo/SKILL.md",
    "docs/MASTER_EXECUTION_PLAN.md",
    "docs/SETUP_INSTRUCTIONS.md",
]

missing = [p for p in REQUIRED if not Path(p).exists()]
if missing:
    print("Missing required files:")
    for item in missing:
        print(f"- {item}")
    sys.exit(1)

print("Agent scaffold check passed.")
