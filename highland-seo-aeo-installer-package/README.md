# One-Command Repository Installer

## Use in Replit

1. Download and upload this ZIP into the Replit project.
2. Extract it.
3. Open the Replit Shell.
4. From the extracted installer folder, run:

```bash
bash install.sh
```

The installer:

- refuses to run with uncommitted changes;
- switches to `agent/highland-seo-aeo-setup`;
- preserves the existing `.agents/` directory;
- adds the root `AGENTS.md`;
- adds the Codex skill and governance files;
- activates the read-only baseline audit;
- commits the scaffold;
- pushes the branch;
- prints the exact first Codex prompt.

It does not modify `main`, website code, availability data, analytics, forms, or deployment configuration.
