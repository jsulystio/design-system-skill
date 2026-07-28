// extract.mjs
// Palette + style extractor for the "refresh from approved screens" flow
// (references/refresh-from-approved.md). Once a client approves one UI
// direction, this reads the approved frames' screen snapshot and clusters the
// colors, spacing, and radii ACTUALLY used into a candidate palette, mapped
// toward the AlignUI semantic slots, with a snap-to suggestion when a value is
// already close to an existing token.
//
// It is model-free: it produces evidence and proposals. The skill flow turns
// the proposals into a propagate-change plan (repoint primary/neutral, add new
// tokens) and an inventory delta, then applies them on approval. Fixes still
// flow one direction, toward Figma variables and the inventory.
//
// Usage:
//   node extract.mjs                     read inventory/screens.json (or sample)
//   node extract.mjs path/to/snap.json   read a specific snapshot
//   node extract.mjs --write             also write import/approved.palette.json

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { read, write, exists, resolveTokens } from './lib.mjs';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..');
const p = (...a) => path.join(ROOT, ...a);
const args = process.argv.slice(2);
const wantWrite = args.includes('--write');
const explicit = args.find((a) => !a.startsWith('--'));

const snapshotPath = explicit
  ? path.resolve(process.cwd(), explicit)
  : (exists(p('inventory/screens.json')) ? p('inventory/screens.json') : p('inventory/screens.sample.json'));

// ---------- color math (zero-dep sRGB -> Lab, plus HSL for role heuristics) ----------
function parseHex(hex) {
  let h = String(hex).trim().replace('#', '').toLowerCase();
  if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('');
  if (h.length !== 6 && h.length !== 8) return null;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return null;
  return { r, g, b };
}
const srgbToLin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
function rgbToLab({ r, g, b }) {
  const R = srgbToLin(r), G = srgbToLin(g), B = srgbToLin(b);
  const x = (R * 0.4124 + G * 0.3576 + B * 0.1805) * 100;
  const y = (R * 0.2126 + G * 0.7152 + B * 0.0722) * 100;
  const z = (R * 0.0193 + G * 0.1192 + B * 0.9505) * 100;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x / 95.047), fy = f(y / 100), fz = f(z / 108.883);
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}
const deltaE = (p1, p2) => Math.hypot(p1.L - p2.L, p1.a - p2.a, p1.b - p2.b);
function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return { h: (h / 6) * 360, s, l };
}
function hslToRgb({ h, s, l }) {
  h /= 360;
  if (s === 0) { const v = Math.round(l * 255); return { r: v, g: v, b: v }; }
  const hue = (p, q, t) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return { r: Math.round(hue(p, q, h + 1 / 3) * 255), g: Math.round(hue(p, q, h) * 255), b: Math.round(hue(p, q, h - 1 / 3) * 255) };
}
const toHex = ({ r, g, b }) => '#' + [r, g, b].map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0')).join('');
const shiftL = (rgb, dl) => { const hsl = rgbToHsl(rgb); hsl.l = Math.max(0, Math.min(1, hsl.l + dl)); return toHex(hslToRgb(hsl)); };
const rgba = (rgb, a) => `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;

// A resting color only shows one state. Derive the interaction ramp the states
// of an interactive component need, so the refresh can build hover / pressed /
// focus / disabled, not just the default. Mirrors the AlignUI base/dark/darker
// + alpha structure.
function stateRamp(rgb) {
  return {
    base: toHex(rgb),        // default / resting     -> color/primary/base
    hover: shiftL(rgb, -0.06),   // hover             -> color/primary/dark
    pressed: shiftL(rgb, -0.12), // active / pressed   -> color/primary/darker
    focusRing: rgba(rgb, 0.24),  // focus ring         -> color/alpha/primary-24
    disabled: rgba(rgb, 0.4),    // disabled fill      -> faded / alpha
  };
}

// Best-guess semantic slot from hue/saturation/lightness. The agent refines.
function roleFor(hsl) {
  const { h, s, l } = hsl;
  if (s < 0.15) return l < 0.25 ? 'text/icon (near-black)' : l > 0.9 ? 'background (near-white)' : 'neutral';
  if (h < 20 || h >= 345) return 'state/error';
  if (h >= 20 && h < 50) return 'state/warning';
  if (h >= 90 && h < 160) return 'state/success';
  if (h >= 200 && h < 250) return 'state/information or primary';
  return 'accent (primary candidate)';
}

// ---------- gather values from the snapshot ----------
const snapshot = read(snapshotPath);
const nodes = snapshot.nodes || [];

const colorMap = new Map(); // hex -> { count, bound, screens:Set }
const spaceMap = new Map(); // value -> { count, bound, screens:Set }
const radiusMap = new Map();
const bump = (map, key, node, bound) => {
  if (!map.has(key)) map.set(key, { count: 0, bound: 0, screens: new Set() });
  const e = map.get(key);
  e.count += 1; if (bound) e.bound += 1; if (node.screen) e.screens.add(node.screen);
};
for (const node of nodes) {
  for (const f of node.fills || []) if (f.hex) bump(colorMap, String(f.hex).toLowerCase(), node, !!f.bound);
  for (const s of node.spacing || []) if (s.value != null) bump(spaceMap, Number(s.value), node, !!s.bound);
  for (const r of node.radii || node.radius || []) if (r?.value != null) bump(radiusMap, Number(r.value), node, !!r.bound);
}

// ---------- existing tokens, for snap-to suggestions ----------
const { flat } = resolveTokens(read(p('tokens/figma.raw.json')));
const tokenColors = [];
const spaceScale = new Set([0]);
const radiusScale = new Set([0]);
for (const [name, rec] of Object.entries(flat)) {
  if (rec.type === 'COLOR' && rec.light) {
    const rgb = parseHex(rec.light);
    if (rgb) tokenColors.push({ name, hex: String(rec.light).toLowerCase(), lab: rgbToLab(rgb) });
  }
  if (rec.type === 'FLOAT' && rec.light != null) {
    if (name.startsWith('space/')) spaceScale.add(Number(rec.light));
    if (name.startsWith('radius/')) radiusScale.add(Number(rec.light));
  }
}

// ---------- cluster colors (greedy, by perceptual distance) ----------
const CLUSTER_DE = 8;   // merge colors closer than this into one cluster
const SNAP_DE = 4;      // a cluster this close to a token is "already the token"
const colorItems = [...colorMap.entries()]
  .map(([hex, e]) => ({ hex, ...e, rgb: parseHex(hex) }))
  .filter((c) => c.rgb)
  .sort((a, b) => b.count - a.count);

const clusters = [];
for (const item of colorItems) {
  const lab = rgbToLab(item.rgb);
  const hit = clusters.find((c) => deltaE(c.lab, lab) < CLUSTER_DE);
  if (hit) {
    hit.count += item.count; hit.bound += item.bound;
    item.screens.forEach((s) => hit.screens.add(s));
    hit.members.push(item.hex);
  } else {
    clusters.push({ hex: item.hex, lab, rgb: item.rgb, count: item.count, bound: item.bound, screens: new Set(item.screens), members: [item.hex] });
  }
}

const colors = clusters.map((c) => {
  const hsl = rgbToHsl(c.rgb);
  const role = roleFor(hsl);
  const interactive = /accent|primary|state\//.test(role); // needs hover/pressed/focus/disabled
  let snap = null;
  for (const t of tokenColors) {
    const d = deltaE(c.lab, t.lab);
    if (d < SNAP_DE && (!snap || d < snap.deltaE)) snap = { token: t.name, hex: t.hex, deltaE: Number(d.toFixed(2)) };
  }
  return {
    hex: c.hex,
    role,
    uses: c.count,
    boundToVariable: c.bound,
    raw: c.count - c.bound,
    screens: [...c.screens],
    mergedFrom: c.members.length > 1 ? c.members : undefined,
    snapTo: snap,                       // already close to a token -> reuse it
    status: snap ? 'reuse' : 'new',     // "new" = a genuine new decision to add/repoint
    // A resting color implies a full interaction ramp; the refresh flow uses
    // this to build every state of the component, not just the default.
    states: interactive ? stateRamp(c.rgb) : undefined,
  };
}).sort((a, b) => b.uses - a.uses);

// pick a primary candidate: most-used vivid, mid-light, non-status color that is new
const primaryCandidate = colors.find((c) => c.status === 'new' && /accent|primary/.test(c.role))
  || colors.find((c) => /accent|primary/.test(c.role)) || null;

// ---------- numeric scales ----------
function scaleReport(map, scale) {
  return [...map.entries()].map(([value, e]) => {
    const onScale = scale.has(value);
    let nearest = null;
    for (const s of scale) if (nearest === null || Math.abs(s - value) < Math.abs(nearest - value)) nearest = s;
    return { value, uses: e.count, raw: e.count - e.bound, onScale, nearest, status: onScale ? 'reuse' : 'new' };
  }).sort((a, b) => b.uses - a.uses);
}

const report = {
  source: path.relative(process.cwd(), snapshotPath),
  note: 'Candidate palette from the approved screens. Feed to the skill "refresh from approved" flow: reuse = snap to the named token; new = repoint a semantic slot or add a token. Roles are best-guess; confirm before applying.',
  summary: {
    screens: [...new Set(nodes.map((n) => n.screen).filter(Boolean))],
    distinctColors: colorMap.size,
    colorClusters: colors.length,
    newColors: colors.filter((c) => c.status === 'new').length,
    primaryCandidate: primaryCandidate ? primaryCandidate.hex : null,
  },
  colors,
  spacing: scaleReport(spaceMap, spaceScale),
  radii: scaleReport(radiusMap, radiusScale),
};

process.stdout.write(JSON.stringify(report, null, 2) + '\n');
if (wantWrite) {
  write(p('import/approved.palette.json'), report);
  process.stderr.write(`\nWrote ${path.relative(process.cwd(), p('import/approved.palette.json'))}\n`);
}
