// lint.mjs
// The "design system linter". Reads a snapshot of what the working Figma file
// actually uses (inventory/screens.json) and flags drift against the source of
// truth: raw color/number values that are not bound to any token, and
// components used on screens that are not in the component inventory.
//
// The screen snapshot (inventory/screens.json) is produced by the Claude skill
// via Figma MCP or the Desktop Bridge — see skill references/read-figma.md.
// A small sample (screens.sample.json) ships so you can see the linter work offline.
// Exit code is non-zero when issues are found, so CI can gate on it.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { read, exists } from './lib.mjs';
import { resolveTokens } from './lib.mjs';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..');
const p = (...a) => path.join(ROOT, ...a);

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
