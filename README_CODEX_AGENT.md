# Highland SEO/AEO Codex Agent

This scaffold turns the website repository into a governed Codex project.

Start here:
1. Read `docs/SETUP_INSTRUCTIONS.md`.
2. Export verified Exhibit knowledge into `knowledge/`.
3. Verify `config/property_context.yaml`.
4. Run:
   ```bash
   python scripts/check_required_files.py
   ```
5. Create the first active task:
   ```bash
   python scripts/create_task.py 01_baseline_audit.md
   ```
6. In Codex:
   ```text
   Use the highland-seo-aeo skill. Read AGENTS.md and execute tasks/active/01_baseline_audit.md. This is read-only.
   ```

Do not start with mass content generation. Complete discovery, page mapping, and technical foundations first.
