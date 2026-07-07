#!/usr/bin/env node
// Wire the design-system tooling into the surrounding repository.
// Run from your REPO ROOT (the folder that contains design-system/):
//
//   node design-system/install.mjs [--force] [--scripts] [--with-pages]
//
// It is non-destructive by default: it never edits your files unless you pass
// a flag. --force updates the skill/workflow, --scripts adds npm scripts,
// --with-pages adds an optional GitHub Pages workflow.

import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const dsDir = path.join(repoRoot, 'design-system');
const args = new Set(process.argv.slice(2));
const force = args.has('--force');

if (!fs.existsSync(dsDir)) {
  console.error('Could not find ./design-system.');
  console.error('Place the design-system folder at your repo root, then run this from the root.');
  process.exit(1);
}

// 1) Make the Claude skill discoverable at the repo root.
const skillSrc = path.join(dsDir, 'skill', 'design-system');
const skillDst = path.join(repoRoot, '.claude', 'skills', 'design-system');
if (fs.existsSync(skillDst) && !force) {
  console.log('- Skill already at .claude/skills/design-system (use --force to update).');
} else {
  fs.mkdirSync(path.dirname(skillDst), { recursive: true });
  fs.cpSync(skillSrc, skillDst, { recursive: true });
  console.log('- Installed Claude skill  ->  .claude/skills/design-system');
}

// 2) npm scripts.
const scripts = {
  'ds:pull': 'node design-system/scripts/pull.mjs',
  'ds:build': 'node design-system/scripts/build.mjs',
  'ds:lint': 'node design-system/scripts/lint.mjs',
  'ds:sync': 'npm run ds:pull && npm run ds:build && npm run ds:lint',
};
const pkgPath = path.join(repoRoot, 'package.json');
if (args.has('--scripts') && fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.scripts ||= {};
  let added = 0;
  for (const [k, v] of Object.entries(scripts)) if (!pkg.scripts[k]) { pkg.scripts[k] = v; added++; }
  if (added) {
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`- Added ${added} script(s) to package.json (formatting normalized by JSON write).`);
  } else {
    console.log('- package.json already has the ds:* scripts.');
  }
} else {
  console.log('- Optional npm scripts (paste into package.json, or re-run with --scripts):');
  for (const [k, v] of Object.entries(scripts)) console.log(`    "${k}": "${v}",`);
}

// 3) Optional GitHub Pages workflow.
if (args.has('--with-pages')) {
  const wfSrc = path.join(dsDir, 'github', 'pages.yml');
  const wfDst = path.join(repoRoot, '.github', 'workflows', 'design-system-pages.yml');
  if (fs.existsSync(wfDst) && !force) {
    console.log('- Pages workflow already installed (use --force to update).');
  } else {
    fs.mkdirSync(path.dirname(wfDst), { recursive: true });
    fs.cpSync(wfSrc, wfDst);
    console.log('- Installed Pages workflow  ->  .github/workflows/design-system-pages.yml');
    console.log('  Caution: if this repo already deploys to GitHub Pages, host the docs elsewhere instead.');
  }
}

console.log('\nNext:');
console.log('  node design-system/scripts/build.mjs   # generates design-system/site/');
console.log('  npx serve design-system/site           # preview the docs');
console.log('  Then bootstrap from your Figma file (see design-system/README.md).');
