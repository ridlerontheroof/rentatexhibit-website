/**
 * Emits docs/floor-plan-map/exhibit-floor-plan-map.md — a self-contained
 * explainer + full data dump of the floor-plan schema, intended for upload to
 * an external AI assistant (ChatGPT) so it can reason about which plan goes
 * with which unit, sq ft, floors, etc.
 *
 * Everything is generated from src/data/floorPlans.ts (the site's single
 * source of truth), so the doc can never disagree with the website.
 *
 * Run: pnpm --filter @workspace/exhibit-on-superior exec tsx scripts/generate-floor-plan-map.ts
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
// @ts-ignore - importing app TS via tsx
import {
  plans,
  planGroups,
  FLOOR_BANDS,
  CATEGORIES,
  SQFT_MIN,
  SQFT_MAX,
  unitNumbersForPlan,
  unitNumbersForGroup,
  bandsForFloors,
  planSqftLabel,
  floorToken,
  floorDisplayLabel,
  MEZZANINE_FLOOR,
} from '../src/data/floorPlans';

const GENERATED = new Date().toISOString().slice(0, 10);

const catLabel = (id: string) => CATEGORIES.find((c) => c.id === id)?.label ?? id;

/* ---- per-plan table (35 sheet-level plans) ---- */
const planRows = plans
  .map((p) => {
    const units = unitNumbersForPlan(p);
    const unitsCell = units.length > 6 ? `${units[0]}–${units[units.length - 1]} (${units.length} units)` : units.join(', ');
    return `| ${p.unit} | ${p.floorLabel} | ${floorDisplayLabel(p.floors[0])}–${floorDisplayLabel(p.floors[p.floors.length - 1])} | ${p.typeLabel} | ${p.beds} | ${p.baths} | ${p.den ? 'Yes' : 'No'} | ${planSqftLabel(p)} | ${unitsCell} | ${p.id} |`;
  })
  .join('\n');

/* ---- per-group table ---- */
const groupRows = planGroups
  .map((g) => {
    const sqft = g.sqftMin === g.sqftMax ? `${g.sqftMin}` : `${g.sqftMin}–${g.sqftMax}`;
    const bands = g.bands.map((b) => `${b.name} (${b.label})`).join(', ');
    const count = unitNumbersForGroup(g).length;
    return `| ${g.unit} | ${g.typeLabel} | ${catLabel(g.category)} | ${sqft} | ${bands} | ${g.variants.map((v) => v.floorLabel).join('; ')} | ${count} | ${g.id} |`;
  })
  .join('\n');

/* ---- full unit-number roster, grouped by floor ---- */
const byFloor = new Map<number, { unitNumber: string; plan: (typeof plans)[number] }[]>();
for (const p of plans) {
  for (const f of p.floors) {
    const unitNumber = `${floorToken(f)}${String(p.unit).padStart(2, '0')}`;
    if (!byFloor.has(f)) byFloor.set(f, []);
    byFloor.get(f)!.push({ unitNumber, plan: p });
  }
}
const floorSections = [...byFloor.keys()]
  .sort((a, b) => a - b)
  .map((f) => {
    const rows = byFloor
      .get(f)!
      .sort((a, b) => a.unitNumber.localeCompare(b.unitNumber))
      .map(({ unitNumber, plan: p }) => `| ${unitNumber} | ${p.typeLabel} | ${planSqftLabel(p)} | ${p.id} |`)
      .join('\n');
    const band = bandsForFloors(f, f)[0];
    return `### Floor ${floorDisplayLabel(f)}${f === MEZZANINE_FLOOR ? ' (the "4M" mezzanine level)' : ''} — ${band?.name ?? ''} band\n\n| Unit # | Layout | Sq Ft | Plan ID |\n|---|---|---|---|\n${rows}`;
  })
  .join('\n\n');

const totalUnits = plans.reduce((n, p) => n + p.floors.length, 0);

const md = `# Exhibit On Superior — Floor Plan Logic & Unit Map

Generated ${GENERATED} directly from the website's floor-plan dataset (rentatexhibit.com).
Purpose: give an AI assistant everything needed to map any apartment unit number to its
floor plan, square footage, layout, floor, and building position band.

## 1. How unit numbers work (the core rule)

**Unit number = 2-digit floor + 2-digit unit line, always zero-padded (FFUU), except the "4M" mezzanine which uses \`04M\` + line (5 characters, AppFolio format).**

- Each floor plan is a **unit line**: a position on the floor plate (line 1–10) repeated across a range of floors.
- Example: unit line 6 on floor 6 → apartment **0606**. Unit line 2 on floors 30–34 → **3002, 3102, 3202, 3302, 3402**. Unit line 2 on the mezzanine → **04M02**.
- Single-digit floors ARE zero-padded (floor 6 → "06"), so a valid unit number is 4 digits ("203" → "0203") or the 5-character \`04M\` form.

## 2. The mezzanine rule (there is NO floor 5)

The building's podium has a mezzanine above floor 4. **It is its own level named "4M" — matching AppFolio — and is never renumbered to floor 5.**

- A plan sheet labeled \`4M\` exists only on the mezzanine level. AppFolio writes its apartments as \`04M\` + two-digit unit line (e.g. unit line 4 there is apartment **04M04**, 5 characters).
- A range ending in M includes the mezzanine: \`4-4M\` → floors 4 and 4M; \`3-4M\` → floors 3, 4, and 4M.
- The 4M level sorts between floor 4 and floor 6; unit numbers like "0502" do NOT exist.

## 3. Floor bands (building position)

| Band | Floors | Meaning |
|---|---|---|
${FLOOR_BANDS.map((b) => `| ${b.name} | ${b.label} | ${b.id} |`).join('\n')}

## 4. Layout categories

${CATEGORIES.map((c) => `- **${c.label}** (\`${c.id}\`)`).join('\n')}
- Studio and Convertible layouts count as 0 bedrooms. "Jr. Convertible" is a smaller convertible.
- Square footage across the whole building: **${SQFT_MIN}–${SQFT_MAX} sq ft**.

## 5. How plans are grouped on the website

The site shows **${planGroups.length} floor-plan cards**, grouped from **${plans.length} sheet-level plans**. Plans with the same unit line + category + bath count + den flag are one "residence line" card; each floor-band variant may differ slightly in sq ft (layouts shift between the podium, tower, and penthouse floor plates). When mapping a specific apartment, always use the variant whose floor range contains that apartment's floor.

## 6. All ${plans.length} sheet-level plans (authoritative)

Columns: unit line; floor label as printed on the sheet; expanded floor range; layout; beds; baths; den; sq ft; the real apartment numbers it produces; the plan's website ID (used in \`?plan=\` deep links and image filenames).

| Line | Sheet label | Floors | Layout | Beds | Baths | Den | Sq Ft | Apartment #s | Plan ID |
|---|---|---|---|---|---|---|---|---|---|
${planRows}

## 7. The ${planGroups.length} website floor-plan cards (grouped view)

| Line | Layout | Category | Sq Ft | Bands | Sheet variants | Total units | Card ID |
|---|---|---|---|---|---|---|---|
${groupRows}

## 8. Complete unit roster by floor (${totalUnits} apartments)

${floorSections}

---
*Regenerate after any dataset change: \`pnpm --filter @workspace/exhibit-on-superior exec tsx scripts/generate-floor-plan-map.ts\`. Source of truth: \`src/data/floorPlans.ts\`. No pricing/availability here by design — that lives in AppFolio.*
`;

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'floor-plan-map');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, 'exhibit-floor-plan-map.md');
writeFileSync(outPath, md);
console.log(`Wrote ${outPath}: ${plans.length} plans, ${planGroups.length} groups, ${totalUnits} units.`);
