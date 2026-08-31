# Onboarding automation evidence (Task: turnkey property-site onboarding)

Produced by the `property-site-onboarding` skill's tooling (`.agents/skills/property-site-onboarding/`).

- `pilot-woods-crossing/` — pilot run: parity map + gap report regenerated from the Woods Crossing
  legacy inventory; `PILOT_COMPARISON.md` compares against the hand-built handoff package.
- `beta-sienna/` — beta run (first real use): archive-mode discovery of siennachicago.com
  (Cloudflare-walled), draft parity map, gap analysis, discovery report, owner intake checklist.
- `de-exhibit-audit.md` — audit of the Task #748 code kit for Exhibit literals; the definitive
  move-behind-config list for the next kit release.

Operator next steps: make the skill available at workspace level, create a clean property project,
and supply the Claude website ZIP plus OM. Obtain a reviewed, pinned release from the production code
kit; an optional Replit custom template is only a launcher and never source of truth. See
`.agents/skills/property-site-onboarding/docs/OPERATOR_GUIDE.md`.
