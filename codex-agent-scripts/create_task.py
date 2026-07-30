from pathlib import Path
import argparse
import shutil
import sys

parser = argparse.ArgumentParser(description="Create one active Codex task from a template.")
parser.add_argument("template", help="Template filename under tasks/templates")
parser.add_argument("--name", help="Output filename under tasks/active")
args = parser.parse_args()

templates = Path("tasks/templates")
active = Path("tasks/active")
source = templates / args.template

if not source.exists():
    sys.exit(f"Template not found: {source}")

active.mkdir(parents=True, exist_ok=True)
existing = [p for p in active.iterdir() if p.is_file() and p.name != ".gitkeep"]
if existing:
    sys.exit("An active task already exists. Complete or move it before creating another.")

target = active / (args.name or args.template)
shutil.copy2(source, target)
print(f"Created {target}")
