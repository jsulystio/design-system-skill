// Shared helpers: read/write JSON, and resolve a raw Figma variable export
// (with aliases + light/dark modes) into a flat, resolved token set.
// Pure Node stdlib, no dependencies.

import fs from 'node:fs';
import path from 'node:path';

export const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

export const write = (p, o) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, typeof o === 'string' ? o : JSON.stringify(o, null, 2) + '\n');
};

export const exists = (p) => fs.existsSync(p);

export const slug = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Figma mode name -> our output mode. "value" means "same in every mode".
const MODE_MAP = { Light: 'light', Dark: 'dark', value: '*' };
const OUTPUT_MODES = ['light', 'dark'];

const isRef = (x) =>
  typeof x === 'string' && x.trim().startsWith('{') && x.trim().endsWith('}');
const refKey = (x) => x.trim().slice(1, -1);

// Decide a CSS unit for numeric (FLOAT) tokens from their name.
export function unitFor(name) {
  const n = name.toLowerCase();
  if (/(weight|opacity|line-?height|leading|z-?index|ratio)/.test(n)) return '';
  return 'px';
}

export function isColor(rec) { return rec.type === 'COLOR'; }

// Turn a variable name path into a CSS custom-property name.
export const cssVar = (name) => '--' + name.replace(/\//g, '-');

// Core resolver. Returns { flat, warnings } where flat is keyed by the
// variable name path (e.g. "color/bg/canvas") with { type, light, dark }.
export function resolveTokens(raw) {
  const warnings = [];

  // Index every variable by a dotted key "collection.dot.path" for alias lookup.
  const index = {};
  for (const [cname, coll] of Object.entries(raw.collections)) {
    for (const [vname, v] of Object.entries(coll.variables)) {
      const dot = `${cname}.${vname.replace(/\//g, '.')}`;
      index[dot] = { type: v.type, values: v.values, name: vname, collection: cname };
    }
  }

  function resolve(dotKey, mode, seen = new Set()) {
    const entry = index[dotKey];
    if (!entry) { warnings.push(`unresolved reference: {${dotKey}}`); return undefined; }
    if (seen.has(dotKey)) { warnings.push(`circular reference: {${dotKey}}`); return undefined; }
    seen.add(dotKey);
    const vals = entry.values;
    let val = mode in vals ? vals[mode] : ('value' in vals ? vals.value : Object.values(vals)[0]);
    if (isRef(val)) return resolve(refKey(val), mode, seen);
    return val;
  }

  const flat = {};
  for (const [dot, entry] of Object.entries(index)) {
    const key = entry.name; // clean, collection prefix dropped
    if (flat[key]) warnings.push(`duplicate token name across collections: ${key}`);
    const rec = { type: entry.type, collection: entry.collection };
    const collModes = raw.collections[entry.collection].modes;
    for (const m of OUTPUT_MODES) {
      const srcMode =
        collModes.find((cm) => MODE_MAP[cm] === m) ||
        (collModes.includes('value') ? 'value' : collModes[0]);
      rec[m] = resolve(dot, srcMode);
    }
    flat[key] = rec;
  }

  return { flat, warnings, modes: OUTPUT_MODES };
}

// Group flat tokens by their first path segment for documentation.
export function groupByCategory(flat) {
  const groups = {};
  for (const [name, rec] of Object.entries(flat)) {
    const cat = name.split('/')[0];
    (groups[cat] ||= []).push({ name, ...rec });
  }
  return groups;
}
