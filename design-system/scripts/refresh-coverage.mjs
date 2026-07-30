// refresh-coverage.mjs
// The whole-library coverage gate for the "refresh from approved screens" flow.
//
// The refresh doc (references/refresh-from-approved.md) tells the model to apply
// the learned style profile to EVERY component in the catalog, not only the ones
// drawn on the approved screens. But the drift linter only reads the approved
// screens (inventory/screens.json), so it goes green the moment those screens are
// tokenized — leaving components that never appeared on a screen (Table, Tooltip,
// Date Picker, …) still on the old template styling. Unmeasured work does not get
// done. This script measures it.
//
// It enumerates every component in inventory/components.json, derives the style
// dimensions each one actually uses (color, radius, space, font, shadow) from its
// specs, and tracks a per-dimension status the model must move off "pending" as it
// applies the profile. The refresh is not done while any cell is still "pending".
//
// Usage:
//   node refresh-coverage.mjs --init     Build/refresh the ledger from components.json.
//                                         Preserves existing statuses for components
//                                         still present; adds new ones as "pending";
//                                         drops removed ones. Add --fresh to reset all.
//   node refresh-coverage.mjs            Verify. Prints unresolved components and exits
//                                         non-zero while any dimension is still "pending".
//   node refresh-coverage.mjs --json     Verify, machine-readable summary on stdout.
//
// Per-cell status values the model sets in inventory/refresh-coverage.json:
//   pending  not yet touched this refresh            (blocks "done")
//   applied  profile applied to this dimension       (bound to the repointed tokens)
//   n/a      dimension deliberately unchanged        (record why in "note")

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { read, write, exists } from './lib.mjs';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..');
const p = (...a) => path.join(ROOT, ...a);
const args = process.argv.slice(2);

const STYLE_FAMILIES = ['color', 'radius', 'space', 'font', 'shadow'];
const LEDGER = p('inventory/refresh-coverage.json');
const COMPONENTS = p('inventory/components.json');

// Which style dimensions does this component actually use? Read the token
// families cited across its example specs; fall back to a single "review" cell
// so a component with no tokenized specs is still accounted for, never skipped.
function dimensionsFor(component) {
  const fams = new Set();
  for (const ex of component.examples || []) {
    for (const s of ex.specs || []) {
      if (!s.token) continue;
      const fam = String(s.token).split('/')[0];
      if (STYLE_FAMILIES.includes(fam)) fams.add(fam);
    }
  }
  const ordered = STYLE_FAMILIES.filter((f) => fams.has(f));
  return ordered.length ? ordered : ['review'];
}

function buildLedger({ fresh } = {}) {
  if (!exists(COMPONENTS)) {
    console.error(`No ${path.relative(process.cwd(), COMPONENTS)} — bootstrap the inventory first.`);
    process.exit(2);
  }
  const inventory = read(COMPONENTS);
  const prior = !fresh && exists(LEDGER) ? read(LEDGER) : { components: [] };
  const priorByName = new Map((prior.components || []).map((c) => [c.name, c]));

  const components = (inventory.components || []).map((c) => {
    const dims = dimensionsFor(c);
    const was = priorByName.get(c.name);
    const dimensions = {};
    for (const d of dims) {
      // Keep a prior status if this component + dimension already existed.
      dimensions[d] = was && was.dimensions && was.dimensions[d] ? was.dimensions[d] : 'pending';
    }
    return {
      name: c.name,
      figmaNodeId: c.figmaNodeId || null,
      inFigma: Boolean(c.figmaNodeId),
      onApprovedScreen: was ? Boolean(was.onApprovedScreen) : false,
      dimensions,
      note: (was && was.note) || '',
    };
  });

  const ledger = {
    _comment:
      'Whole-library coverage gate for the refresh-from-approved flow. Set each dimension to ' +
      '"applied" (bound to the repointed tokens) or "n/a" (unchanged — say why in note). ' +
      'Regenerate with `node design-system/scripts/refresh-coverage.mjs --init`; verify with the ' +
      'same script and no flags. Refresh is not done while any dimension is "pending".',
    generatedFrom: path.relative(ROOT, COMPONENTS),
    total: components.length,
    components,
  };
  write(LEDGER, ledger);
  return ledger;
}

function summarize(ledger) {
  const cells = [];
  for (const c of ledger.components) {
    for (const [dim, status] of Object.entries(c.dimensions)) {
      cells.push({ name: c.name, dim, status, inFigma: c.inFigma });
    }
  }
  const pending = cells.filter((x) => x.status === 'pending');
  const applied = cells.filter((x) => x.status === 'applied');
  const na = cells.filter((x) => x.status === 'n/a');
  const other = cells.filter((x) => !['pending', 'applied', 'n/a'].includes(x.status));
  const componentsPending = [...new Set(pending.map((x) => x.name))];
  return { cells, pending, applied, na, other, componentsPending };
}

// ---------- CLI ----------
if (args.includes('--init')) {
  const ledger = buildLedger({ fresh: args.includes('--fresh') });
  const s = summarize(ledger);
  console.log(
    `Ledger written: ${ledger.total} components, ${s.cells.length} dimension cells ` +
      `(${s.pending.length} pending, ${s.applied.length} applied, ${s.na.length} n/a).`,
  );
  console.log(`Edit ${path.relative(process.cwd(), LEDGER)} as you apply the profile, then re-run to verify.`);
  process.exit(0);
}

if (!exists(LEDGER)) {
  console.error('No inventory/refresh-coverage.json — run `node design-system/scripts/refresh-coverage.mjs --init` first.');
  process.exit(2);
}

const ledger = read(LEDGER);
const s = summarize(ledger);

if (args.includes('--json')) {
  process.stdout.write(
    JSON.stringify(
      {
        total: ledger.total,
        cells: s.cells.length,
        pending: s.pending.length,
        applied: s.applied.length,
        na: s.na.length,
        componentsPending: s.componentsPending,
      },
      null,
      2,
    ) + '\n',
  );
  process.exit(s.pending.length ? 1 : 0);
}

if (s.other.length) {
  console.log(`Unknown status on ${s.other.length} cell(s) — use pending | applied | n/a:`);
  for (const x of s.other) console.log(`  ? ${x.name} · ${x.dim}: "${x.status}"`);
}

if (!s.pending.length) {
  console.log(
    `Refresh coverage clean: all ${ledger.total} components resolved across every dimension ` +
      `(${s.applied.length} applied, ${s.na.length} n/a).`,
  );
  process.exit(s.other.length ? 1 : 0);
}

console.log(
  `Refresh incomplete: ${s.componentsPending.length}/${ledger.total} components still pending ` +
    `(${s.pending.length} dimension cells). These were NOT covered — most are components the ` +
    `approved screens never drew:`,
);
for (const name of s.componentsPending) {
  const c = ledger.components.find((x) => x.name === name);
  const dims = Object.entries(c.dimensions)
    .filter(([, v]) => v === 'pending')
    .map(([k]) => k)
    .join(', ');
  const tag = c.inFigma ? '' : ' (spec-only, not in Figma yet)';
  console.log(`  - ${name}${tag}: ${dims}`);
}
console.log(
  '\nApply the step-3 style profile to each (or mark a dimension n/a with a reason in the ledger),\n' +
    'then re-run. Refresh is not done while any component is pending.',
);
process.exit(1);
