# Highland property-site factory contract

## Purpose and inputs

The factory creates an independently owned property site from two standard, read-only inputs:

1. a Claude-generated website ZIP; and
2. the property's offering memorandum (OM).

The ZIP supplies candidate design, content, assets, and legacy-parity evidence. It is untrusted
intake—not production architecture. Placeholder integrations and unsupported claims must be reported,
not carried forward. The OM supplies candidate facts with page-level provenance; it is not leasing
truth until owner confirmation (G1). Legacy sites, owner assets, exports, and a Replit custom template
are optional supplements.

## Three layers and authority

| Layer | Owns | Must not own |
|---|---|---|
| Production code kit | Reusable web/API implementation, guard suites, generators, migrations; immutable semantic releases | Property facts, credentials, launch approval |
| Workspace onboarding skill | Process, schemas, report templates, gates, released standards manifest | Deployable production implementation or secret values |
| Optional Replit custom template | Project creation and launch convenience; selecting/fetching a reviewed kit release | Reusable source of truth, facts, standards, or a mutable kit fork |

The custom template may carry a mirrored copy of the workspace onboarding skill under
`.agents/skills/` solely to guarantee Agent discoverability in newly created projects. That copy
does not make the launcher the authority for standards or deployable implementation; it must be
refreshed from the governed workspace skill and validated before repinning.

Precedence is explicit: released standards define required outcomes; the pinned production kit is the
implementation source; reviewed property config/content/assets/environment settings define the
property. A live property repository has no factory authority. Conflicts stop the workflow and open a
change proposal; they are never silently resolved by copying live code.

## Release ownership

- Standards owner approves semantic standards releases.
- Kit maintainer publishes immutable `kit-vMAJOR.MINOR.PATCH` releases with digest, standards
  compatibility, migration notes, and passing guard evidence.
- Property owner approves facts, brand, parity, integrations, and publish decisions.
- Operator records environment placement and performs explicit secret links/configuration.
- Technical reviewer approves scaffold and upgrade evidence; security/privacy review is required when
  data handling, credentials, tracking, forms, CSP, or vendors change.

## Required generated outputs

Before scaffold: source inventory with hashes/provenance, candidate-fact register, uncertainty
register, placeholder/integration gap report, property config, design/parity decisions, and next-step
checklist. Before launch: pinned kit/digest record, environment manifest by artifact/environment,
validation evidence, approved parity map, and prelaunch evidence package. Outputs live under
`onboarding/`; source inputs remain unchanged.

## Isolation and acceptance

Property-specific material belongs only in validated config, content data, approved assets, or
environment configuration. Secret values belong only in the secure platform store. A project is
accepted only when its pinned kit is verifiable, required outputs exist, applicable G1–G8 approvals
are recorded, required checks pass, and no unresolved fact or secret value entered production or the
audit trail. Publishing, DNS changes, credential reuse, and upgrades are never implied by completion
of intake.