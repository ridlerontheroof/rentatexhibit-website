# Setup Instructions

## 1. Prepare the Website Repository

Use the actual source repository for `rentatexhibit.com`. Do not create the agent in an unrelated standalone repository unless the website is first added as a subdirectory.

Create a new branch:

```bash
git checkout -b codex/highland-seo-aeo-agent
```

Copy this scaffold into the repository root.

Commit the scaffold before implementation:

```bash
git add AGENTS.md .codex config docs tasks reports scripts tests
git commit -m "Add Highland SEO and AEO Codex agent scaffold"
```

## 2. Add Verified Exhibit Knowledge

A Codex project cannot automatically read the private knowledge inside a separate Custom GPT.

Export or copy the relevant source files into:

```text
knowledge/
  property/
  floor-plans/
  units/
  accessibility/
  amenities/
  ad-copy-agent-export/
```

Do not dump conflicting files together without labels. Preserve filenames and version dates.

Update `config/source_governance.yaml` if your actual hierarchy differs.

## 3. Verify Property Context

Open `config/property_context.yaml`.

For each field:
- confirm it;
- correct it;
- add its source;
- add the verification date;
- remove historical fee examples that should not be published.

Do not begin content generation while `review_status` remains `needs_human_verification`.

Change it to:

```yaml
review_status: human_verified
last_verified_date: YYYY-MM-DD
```

## 4. Configure Codex

Open the website repository as a Codex project in the Codex app, CLI, or IDE extension.

Codex reads repository guidance from `AGENTS.md`. Keep that file at the repository root. Add narrower `AGENTS.md` files in subdirectories only when a specific code area needs additional rules.

The included repository skill is located at:

```text
.codex/skills/highland-seo-aeo/SKILL.md
```

Restart or refresh Codex after adding the skill if it does not appear immediately.

## 5. Configure Environment and Permissions

Start with the safest settings:
- workspace write access only;
- approvals for commands outside the workspace;
- no production credentials;
- no deployment tokens;
- no unrestricted network access.

For the discovery phase, approve only the domains required for the public audit, such as:
- `rentatexhibit.com`
- official search-engine validation tools when needed
- the site's actual CDN or availability-feed domains when required

Do not provide resident, applicant, or private leasing data.

## 6. Record Repository Commands

Run the discovery task first. Have Codex identify the package manager and populate `docs/REPOSITORY_COMMANDS.md` with the real commands for:
- install;
- development;
- build;
- lint;
- tests;
- link check;
- schema check;
- deployment preview.

Do not invent generic commands when the repository already defines them.

## 7. Start the First Task

Copy:

```text
tasks/templates/01_baseline_audit.md
```

to:

```text
tasks/active/01_baseline_audit.md
```

Then prompt Codex:

```text
Use the highland-seo-aeo skill. Read AGENTS.md and execute tasks/active/01_baseline_audit.md. This is read-only. Do not change production code.
```

Review the report before creating the next active task.

## 8. Use One Active Task at a Time

Only one implementation task should be authoritative unless tasks are explicitly independent.

After approval:
- move completed task files to `tasks/completed/`;
- create the next task from a template;
- commit after each accepted phase;
- use pull requests for review.

## 9. Protect Production

Recommended controls:
- branch protection;
- required pull-request review;
- preview deployment before production;
- automated build checks;
- no direct push to the default branch;
- no automatic production deployment by Codex.

## 10. Ongoing Maintenance

After launch, create recurring tasks for:
- Search Console query review;
- broken-link checks;
- schema regressions;
- availability-page indexing;
- content decay;
- new unit and floor-plan data;
- local facts and fee verification.

Do not automate content publication without human review.
