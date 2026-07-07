// pull.mjs
// Populates tokens/figma.raw.json (and optionally inventory/components.json)
// from Figma. Two supported sources, selected in figma.config.json -> pull.mode:
//
//   "import"  (default, works on ANY Figma plan)
//       A designer runs a free "export variables to JSON" plugin in Figma and
//       drops the file at pull.importPath. No code, one click. This script
//       normalizes that export into tokens/figma.raw.json.
//
//   "rest"   (Enterprise only)
//       Reads variables via the Figma REST Variables API using FIGMA_TOKEN.
//       Note: the Variables REST API requires a Full seat in an Enterprise org.
//       On non-Enterprise plans this returns 403, so use "import" or the Claude
//       skill (which reads variables through the Desktop Bridge on any plan).
//
// The heavy component extraction (clustering messy layers into a component
// inventory) is a JUDGMENT step and lives in the Claude skill's bootstrap flow,
// not here. This script only refreshes what already has structure.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { read, write, exists } from './lib.mjs';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..');
const p = (...a) => path.join(ROOT, ...a);
const cfg = read(p('figma.config.json'));
const mode = cfg.pull?.mode || 'import';

if (mode === 'import') {
  const src = p(cfg.pull.importPath || 'import/variables.export.json');
  if (!exists(src)) {
    console.error(`No export found at ${path.relative(ROOT, src)}.`);
    console.error('Run the variables-export plugin in Figma and save the JSON there, then re-run pull.');
    process.exit(1);
  }
  // The example export shape already matches figma.raw.json. Adapt here if your
  // plugin emits a different shape (Tokens Studio, etc.).
  const raw = read(src);
  write(p('tokens/figma.raw.json'), raw);
  console.log('Imported variables ->', path.relative(ROOT, p('tokens/figma.raw.json')));
} else if (mode === 'rest') {
  const token = process.env.FIGMA_TOKEN;
  const fileKey = cfg.fileKey;
  if (!token || !fileKey) { console.error('Set FIGMA_TOKEN and figma.config.json -> fileKey.'); process.exit(1); }
  const res = await fetch(`https://api.figma.com/v1/files/${fileKey}/variables/local`, {
    headers: { 'X-Figma-Token': token },
  });
  if (res.status === 403) {
    console.error('403 from Variables API. This endpoint is Enterprise-only.');
    console.error('Switch pull.mode to "import" or use the Claude skill bootstrap (Desktop Bridge).');
    process.exit(1);
  }
  if (!res.ok) { console.error('Figma API error', res.status, await res.text()); process.exit(1); }
  const data = await res.json();
  // Minimal transform: REST payload -> our raw shape. Extend as your naming needs.
  console.error('REST pull fetched. Map data.meta.variables into figma.raw.json shape here.');
  fs.writeFileSync(p('tokens/figma.rest-response.json'), JSON.stringify(data, null, 2));
  console.log('Saved raw REST response to tokens/figma.rest-response.json for mapping.');
} else {
  console.error(`Unknown pull.mode "${mode}". Use "import" or "rest".`);
  process.exit(1);
}
