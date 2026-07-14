// lint.mjs
// The "design system linter", two modes sharing one token source of truth:
//
//   node lint.mjs               Figma mode: reads the screen snapshot
//                               (inventory/screens.json) and flags raw values
//                               and uninventoried components in the designs.
//   node lint.mjs --code <dir…> Code mode: scans source files for hardcoded
//                               hex colors that are not tokens — the check to
//                               run after you (or a coding agent) write UI.
//
// The screen snapshot (inventory/screens.json) is produced by the Claude skill
// via Figma MCP or the Desktop Bridge — see skill references/read-figma.md.
// A small sample (screens.sample.json) ships so you can see the linter work offline.
// Exit code is non-zero when issues are found, so CI can gate on either mode.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { read, exists } from './lib.mjs';
import { resolveTokens } from './lib.mjs';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..');
const p = (...a) => path.join(ROOT, ...a);
const args = process.argv.slice(2);

const snapshotPath = exists(p('inventory/screens.json'))
  ? p('inventory/screens.json')
  : p('inventory/screens.sample.json');

const raw = read(p('tokens/figma.raw.json'));
const inventory = exists(p('inventory/components.json')) ? read(p('inventory/components.json')) : { components: [] };
const snapshot = read(snapshotPath);
const { flat } = resolveTokens(raw);

// Build sets of known resolved values.
const knownColors = new Set();
const knownNumbers = new Set();
for (const rec of Object.values(flat)) {
  for (const m of ['light', 'dark']) {
    if (rec.type === 'COLOR' && rec[m]) knownColors.add(String(rec[m]).toLowerCase());
    if (rec.type === 'FLOAT' && rec[m] != null) knownNumbers.add(Number(rec[m]));
  }
}
const knownComponents = new Set(inventory.components.map((c) => c.name));

// ---- Code mode: scan source files for hardcoded colors ----
if (args.includes('--code')) {
  let dirs = args.filter((a) => a !== '--code');
  if (!dirs.length && exists(p('figma.config.json'))) {
    dirs = (read(p('figma.config.json')).lint?.codePaths || []).filter((d) => fs.existsSync(path.resolve(process.cwd(), d)));
  }
  if (!dirs.length) {
    console.error('Usage: node design-system/scripts/lint.mjs --code <dir> [more dirs…]');
    console.error('(or set lint.codePaths in design-system/figma.config.json)');
    process.exit(2);
  }
  const EXT = new Set(['.css', '.scss', '.sass', '.less', '.tsx', '.jsx', '.ts', '.js', '.mjs', '.cjs', '.vue', '.svelte', '.html', '.astro']);
  const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', 'out', '.next', '.git', 'coverage', 'design-system', 'storybook-static']);
  const files = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(path.join(dir, e.name)); continue; }
      if (EXT.has(path.extname(e.name))) files.push(path.join(dir, e.name));
    }
  };
  for (const d of dirs) {
    const abs = path.resolve(process.cwd(), d);
    if (!fs.existsSync(abs)) { console.error(`No such directory: ${d}`); process.exit(2); }
    walk(abs);
  }

  // Normalize #abc / #aabbcc / #aabbccdd for comparison with token values.
  const expand = (hex) => {
    let h = hex.toLowerCase();
    if (h.length === 4 || h.length === 5) h = '#' + [...h.slice(1)].map((c) => c + c).join('');
    return h;
  };
  const known = new Set([...knownColors].map(expand));
  const HEX = /#[0-9a-fA-F]{3,8}\b/g;
  const codeIssues = [];
  for (const file of files) {
    const rel = path.relative(process.cwd(), file);
    const text = fs.readFileSync(file, 'utf8');
    text.split('\n').forEach((line, i) => {
      if (/design-?system-?ignore/i.test(line)) return; // opt-out escape hatch
      for (const m of line.match(HEX) || []) {
        const hex = expand(m);
        if (![4, 5, 7, 9].includes(m.length)) continue; // not a color-length hex
        if (!known.has(hex)) codeIssues.push(`${rel}:${i + 1}: raw color ${m} is not a token (use a var(--color-…) / Tailwind theme key)`);
      }
    });
  }
  if (!codeIssues.length) {
    console.log(`Code lint clean: no hardcoded colors outside the token set (${files.length} files scanned).`);
    process.exit(0);
  }
  console.log(`Code lint found ${codeIssues.length} hardcoded value(s) in ${files.length} scanned files:\n`);
  codeIssues.forEach((i) => console.log('  - ' + i));
  console.log('\nReplace each with the matching token from design-system/DESIGN-SYSTEM.md,');
  console.log('or append a `design-system-ignore` comment on the line if it is intentional.');
  process.exit(1);
}

const issues = [];
for (const node of snapshot.nodes || []) {
  for (const fill of node.fills || []) {
    if (fill.bound) continue; // bound to a variable -> fine
    if (!knownColors.has(String(fill.hex).toLowerCase())) {
      issues.push(`${node.screen} · ${node.name}: raw color ${fill.hex} is not a token`);
    }
  }
  for (const sp of node.spacing || []) {
    if (sp.bound) continue;
    if (!knownNumbers.has(Number(sp.value))) {
      issues.push(`${node.screen} · ${node.name}: raw spacing ${sp.value} is not a token`);
    }
  }
  if (node.component && !knownComponents.has(node.component)) {
    issues.push(`${node.screen} · ${node.name}: component "${node.component}" is not in the inventory (engineer would have to guess it)`);
  }
}

if (issues.length === 0) {
  console.log('Lint clean: every value is a token and every component is inventoried.');
  process.exit(0);
}
console.log(`Lint found ${issues.length} drift issue(s):\n`);
issues.forEach((i) => console.log('  - ' + i));
console.log('\nFix in Figma (bind the value to a variable, or add the component), then re-run ds:sync.');
process.exit(1);
