// lint.mjs
// The design-system drift linter (CLI + CI gate). Detection lives in drift.mjs,
// shared with build.mjs so the docs' live drift dashboard and this command
// always agree on what counts as drift. Four lanes on two axes — alignment
// (matches the system) and consistency (internally coherent):
//
//   Design alignment  Design -> System   raw values / uninventoried components in Figma screens
//   Design consistency  Design <-> Design   the same ad-hoc value repeated across screens
//   Code alignment    Code -> System     hardcoded values in source that bypass the tokens
//   Code consistency    Code <-> Code       one role built two ways  (agent-adjudicated)
//
// Usage:
//   node lint.mjs                 Design lanes (reads inventory/screens.json)
//   node lint.mjs --code <dir…>   Code lanes (scans source files)
//   node lint.mjs --report        Every computable lane as one JSON report
//
// The judgment-heavy parts of each lane (off-spec overrides, reimplementations,
// code<->code consistency) are surfaced by the skill's "audit drift" flow, which
// reads --report and then inspects Figma/code (references/drift.md). Every fix
// flows one direction: toward the system (a Figma variable or a catalog entry),
// never a hardcode in code. Exit code is non-zero when any error-severity
// finding exists, so CI can gate on it.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { read, exists, resolveTokens } from './lib.mjs';
import { buildContext, analyzeDesign, analyzeCode } from './drift.mjs';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..');
const p = (...a) => path.join(ROOT, ...a);
const args = process.argv.slice(2);

const snapshotPath = exists(p('inventory/screens.json'))
  ? p('inventory/screens.json')
  : p('inventory/screens.sample.json');

const raw = read(p('tokens/figma.raw.json'));
const inventory = exists(p('inventory/components.json')) ? read(p('inventory/components.json')) : { components: [] };
const cfg = exists(p('figma.config.json')) ? (read(p('figma.config.json')).lint || {}) : {};
const { flat } = resolveTokens(raw);
const ctx = buildContext(flat, inventory, cfg);

// Code dirs come from CLI args (non-flag) or fall back to lint.codePaths.
function resolveCodeDirs() {
  let dirs = args.filter((a) => !a.startsWith('--'));
  if (!dirs.length) dirs = cfg.codePaths || [];
  return dirs
    .map((d) => path.resolve(process.cwd(), d))
    .filter((abs) => fs.existsSync(abs));
}

// ---------- CLI ----------
const wantReport = args.includes('--report');
const wantCode = args.includes('--code');
const snapshot = read(snapshotPath);

// Grouped human output for one lane.
function printLane(label, findings) {
  if (!findings.length) return;
  console.log(`\n${label} — ${findings.length}:`);
  for (const f of findings) console.log(`  ${f.severity === 'warn' ? '~' : '-'} ${f.where}: ${f.message}`);
}

if (wantReport) {
  const design = analyzeDesign(snapshot, ctx);
  const dirs = resolveCodeDirs();
  const code = dirs.length ? analyzeCode(dirs, ctx) : { alignment: [], consistency: [], filesScanned: 0 };
  const lanes = {
    designAlignment: design.alignment,
    designConsistency: design.consistency,
    codeAlignment: code.alignment,
    codeConsistency: code.consistency,
  };
  const all = Object.values(lanes).flat();
  const errors = all.filter((f) => f.severity === 'error').length;
  const report = {
    source: {
      screens: path.relative(process.cwd(), snapshotPath),
      codePaths: dirs.map((d) => path.relative(process.cwd(), d)),
      filesScanned: code.filesScanned,
    },
    counts: { total: all.length, errors, warnings: all.filter((f) => f.severity === 'warn').length },
    note: 'Off-spec overrides, hand-rolled reimplementations, and code↔code consistency are agent-adjudicated. Feed this report to the skill "audit drift" flow (references/drift.md), which then inspects Figma/code.',
    lanes,
  };
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  process.exit(errors ? 1 : 0);
}

if (wantCode) {
  const dirs = resolveCodeDirs();
  if (!dirs.length) {
    console.error('Usage: node design-system/scripts/lint.mjs --code <dir> [more dirs…]');
    console.error('(or set lint.codePaths in design-system/figma.config.json)');
    process.exit(2);
  }
  const { alignment, filesScanned } = analyzeCode(dirs, ctx);
  if (!alignment.length) {
    console.log(`Code lint clean: no hardcoded colors, radii, or spacing outside the token set (${filesScanned} files scanned).`);
    process.exit(0);
  }
  console.log(`Code drift: ${alignment.length} hardcoded value(s) in ${filesScanned} scanned files.`);
  printLane('Code alignment (code → system)', alignment);
  console.log('\nReplace each with the matching token from design-system/DESIGN-SYSTEM.md, add it to');
  console.log('lint.allowPx in figma.config.json, or append a `design-system-ignore` comment if intentional.');
  console.log('For code↔code consistency (one role built two ways), run the skill "audit drift" flow.');
  process.exit(1);
}

// Default: design lanes.
const { alignment, consistency } = analyzeDesign(snapshot, ctx);
const errors = alignment.length;
if (!errors && !consistency.length) {
  console.log('Design lint clean: every value is a token and every component is inventoried.');
  process.exit(0);
}
console.log(`Design drift: ${errors} alignment error(s)${consistency.length ? `, ${consistency.length} consistency warning(s)` : ''}.`);
printLane('Design alignment (design → system)', alignment);
printLane('Design consistency (design ↔ design)', consistency);
console.log('\nFix in Figma (bind the value to a variable, or add the component), then re-run ds:sync.');
console.log('Run `node design-system/scripts/lint.mjs --code <dir>` for code drift, or `--report` for the full JSON.');
process.exit(errors ? 1 : 0);
