# Existing Repository Integration Notes

## Confirmed Existing Files

- `.agents/`
- `replit.md`
- `seo_strategy.md`
- `skills-lock.json`
- `package.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `.replit`

## Integration Decision

The new Codex governance layer supplements the existing Replit agent framework. It does not replace it.

| Existing item | Treatment |
|---|---|
| `.agents/` | Preserve |
| `replit.md` | Required reading |
| `seo_strategy.md` | Existing SEO baseline and required reading |
| `skills-lock.json` | Preserve installed skills |
| Existing site tests | Preserve and run where applicable |
| Replit deployment | No setup-phase changes |

## First Task

`tasks/active/01_baseline_audit.md` is active and read-only.

The audit may create reports and update `docs/REPOSITORY_COMMANDS.md`, but it may not modify public website code or content.
