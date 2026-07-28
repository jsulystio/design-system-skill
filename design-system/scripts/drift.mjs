// drift.mjs
// Shared drift-detection core, used by BOTH lint.mjs (the CLI / CI gate) and
// build.mjs (which renders a live drift dashboard on the "Staying in sync"
// page). "Drift" is any divergence from the source of truth, or internal
// inconsistency within a consumer; the four lanes are documented in the skill's
// references/drift.md and on that page. This module is pure analysis only — the
// CLI and the site own their own I/O and presentation, so the two never fall
// out of step on what counts as drift.

import fs from 'node:fs';
import path from 'node:path';

// A finding is one drift observation, tagged with its lane and severity so
// callers can group and gate on it.
export const finding = (lane, severity, where, message, fix, extra = {}) =>
  ({ lane, severity, where, message, fix, ...extra });

// The four lanes, in display order: [id, label, axis].
export const LANES = [
  ['design-alignment', 'Design alignment', 'Design → System'],
  ['design-consistency', 'Design consistency', 'Design ↔ Design'],
  ['code-alignment', 'Code alignment', 'Code → System'],
  ['code-consistency', 'Code consistency', 'Code ↔ Code'],
];

// Resolve the sets of known-good values from tokens + inventory + lint config.
export function buildContext(flat, inventory = { components: [] }, cfg = {}) {
  const knownColors = new Set();
  const knownNumbers = new Set();
  for (const rec of Object.values(flat)) {
    for (const m of ['light', 'dark']) {
      if (rec.type === 'COLOR' && rec[m]) knownColors.add(String(rec[m]).toLowerCase());
      if (rec.type === 'FLOAT' && rec[m] != null) knownNumbers.add(Number(rec[m]));
    }
  }
  const knownComponents = new Set((inventory.components || []).map((c) => c.name));
  const radiusNums = new Set([0]);
  const spaceNums = new Set([0]);
  for (const [name, rec] of Object.entries(flat)) {
    if (rec.type !== 'FLOAT') continue;
    for (const m of ['light', 'dark']) {
      if (rec[m] == null) continue;
      if (name.startsWith('radius/')) radiusNums.add(Number(rec[m]));
      if (name.startsWith('space/')) spaceNums.add(Number(rec[m]));
    }
  }
  radiusNums.add(999); radiusNums.add(9999); // pill / fully-rounded
  (cfg.allowPx || []).forEach((n) => { radiusNums.add(Number(n)); spaceNums.add(Number(n)); });
  (cfg.allowRadiusPx || []).forEach((n) => radiusNums.add(Number(n)));
  (cfg.allowSpacePx || []).forEach((n) => spaceNums.add(Number(n)));
  return { knownColors, knownNumbers, knownComponents, radiusNums, spaceNums };
}

// ---------- Design lanes: analyze a screen snapshot ----------
export function analyzeDesign(snapshot, ctx) {
  const { knownColors, knownNumbers, knownComponents } = ctx;
  const alignment = [];
  const consistency = [];
  // value -> nodes that use it unbound, for the repeated-value consistency check.
  const rawSeen = new Map();
  const noteRaw = (kind, val, node) => {
    const key = `${kind}:${val}`;
    if (!rawSeen.has(key)) rawSeen.set(key, []);
    rawSeen.get(key).push(node);
  };

  for (const node of snapshot.nodes || []) {
    const at = `${node.screen} · ${node.name}`;
    for (const fill of node.fills || []) {
      if (fill.bound) continue; // bound to a variable -> fine
      if (!knownColors.has(String(fill.hex).toLowerCase())) {
        alignment.push(finding('design-alignment', 'error', at,
          `raw color ${fill.hex} is not a token`,
          'Bind it to a Figma variable: snap to an existing color token, or add one if it is a genuine new decision.',
          { value: fill.hex }));
        noteRaw('color', fill.hex, node);
      }
    }
    for (const sp of node.spacing || []) {
      if (sp.bound) continue;
      if (!knownNumbers.has(Number(sp.value))) {
        alignment.push(finding('design-alignment', 'error', at,
          `raw spacing ${sp.value} is not a token`,
          'Bind it to a spacing variable on the 4px scale.',
          { value: sp.value }));
        noteRaw('spacing', sp.value, node);
      }
    }
    if (node.component && !knownComponents.has(node.component)) {
      alignment.push(finding('design-alignment', 'error', at,
        `component "${node.component}" is not in the inventory (an engineer would have to guess it)`,
        'Add it to inventory/components.json, or promote a planned template.'));
    }
  }

  // Design consistency: the same unbound value on 2+ nodes is one systemic
  // decision wearing N disguises: it wants a single token, not N spot fixes.
  for (const [key, nodes] of rawSeen) {
    if (nodes.length < 2) continue;
    const [kind, val] = key.split(':');
    const screens = [...new Set(nodes.map((n) => n.screen))];
    consistency.push(finding('design-consistency', 'warn', screens.join(', '),
      `raw ${kind} ${val} is used on ${nodes.length} nodes (${screens.join(', ')}) without a token`,
      'Add one token and bind every instance to it, instead of fixing each screen separately.',
      { value: val, count: nodes.length }));
  }

  return { alignment, consistency };
}

// ---------- Code lanes: scan source files ----------
const EXT = new Set(['.css', '.scss', '.sass', '.less', '.tsx', '.jsx', '.ts', '.js', '.mjs', '.cjs', '.vue', '.svelte', '.html', '.astro']);
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', 'out', '.next', '.git', 'coverage', 'design-system', 'storybook-static']);

export function collectCodeFiles(dirs) {
  const files = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(path.join(dir, e.name)); continue; }
      if (EXT.has(path.extname(e.name))) files.push(path.join(dir, e.name));
    }
  };
  for (const abs of dirs) if (fs.existsSync(abs)) walk(abs);
  return files;
}

export function analyzeCode(dirs, ctx) {
  const { knownColors, radiusNums, spaceNums } = ctx;
  const files = collectCodeFiles(dirs);

  // Normalize #abc / #aabbcc / #aabbccdd for comparison with token values.
  const expand = (hex) => {
    let h = hex.toLowerCase();
    if (h.length === 4 || h.length === 5) h = '#' + [...h.slice(1)].map((c) => c + c).join('');
    return h;
  };
  const known = new Set([...knownColors].map(expand));
  const HEX = /#[0-9a-fA-F]{3,8}\b/g;
  const pxNums = (s) => [...s.matchAll(/(\d+(?:\.\d+)?)px/g)].map((m) => Number(m[1]));
  // CSS declarations that should map to tokens: radius vs spacing (padding/gap).
  const RADIUS_DECL = /border(?:-[a-z]+)?-radius\s*:\s*([^;{}]+)/gi;
  const SPACE_DECL = /(?:padding|padding-[a-z]+|gap|row-gap|column-gap)\s*:\s*([^;{}]+)/gi;
  // Tailwind arbitrary values: rounded-[9px], p-[15px], px-[15px], gap-[15px].
  const RADIUS_TW = /\brounded(?:-[a-z]+)?-\[(\d+(?:\.\d+)?)px\]/gi;
  const SPACE_TW = /\b(?:p[xytrbl]?|gap(?:-[xy])?)-\[(\d+(?:\.\d+)?)px\]/gi;

  const alignment = [];
  const push = (at, message, fix, extra) => alignment.push(finding('code-alignment', 'error', at, message, fix, extra));
  for (const file of files) {
    const rel = path.relative(process.cwd(), file);
    const text = fs.readFileSync(file, 'utf8');
    text.split('\n').forEach((line, i) => {
      if (/design-?system-?ignore/i.test(line)) return; // opt-out escape hatch
      const at = `${rel}:${i + 1}`;
      for (const m of line.match(HEX) || []) {
        if (![4, 5, 7, 9].includes(m.length)) continue; // not a color-length hex
        if (!known.has(expand(m))) push(at, `raw color ${m} is not a token`,
          'Use a var(--color-…) / Tailwind theme key from DESIGN-SYSTEM.md.', { value: m });
      }
      const rNums = [...[...line.matchAll(RADIUS_DECL)].flatMap((m) => pxNums(m[1])),
        ...[...line.matchAll(RADIUS_TW)].map((m) => Number(m[1]))];
      for (const n of rNums) if (!radiusNums.has(n)) push(at, `raw radius ${n}px is not a radius token`,
        'Use var(--radius-…) / a rounded-* class.', { value: n });
      const sNums = [...[...line.matchAll(SPACE_DECL)].flatMap((m) => pxNums(m[1])),
        ...[...line.matchAll(SPACE_TW)].map((m) => Number(m[1]))];
      for (const n of sNums) if (!spaceNums.has(n)) push(at, `raw spacing ${n}px is not on the spacing scale`,
        'Use var(--space-…) / a p-*, gap-* class.', { value: n });
    });
  }
  // De-dupe identical file:line:message findings (one report per site).
  const seen = new Set();
  const deduped = alignment.filter((f) => {
    const k = `${f.where}|${f.message}`;
    return seen.has(k) ? false : (seen.add(k), true);
  });
  return { alignment: deduped, consistency: [], filesScanned: files.length };
}
