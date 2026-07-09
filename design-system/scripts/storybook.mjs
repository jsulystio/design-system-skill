// storybook.mjs
// Generates Storybook documentation from the SAME single source as the static
// site (tokens/figma.raw.json + inventory/components.json). It produces:
//
//   stories/Foundations.mdx        colors, spacing, radius, type, shadow tables
//   stories/DesignTokens.mdx       a live swatch/scale gallery (framework-free)
//   stories/<Component>.mdx         one doc page per inventoried component
//   stories/<Component>.stories.*   a live CSF story for code-connected
//                                   components, when the framework is react/vue
//
// It is framework-aware: the framework is read from figma.config.json
// (storybook.framework), defaulting to auto-detection from your package.json.
// If the repo has no Storybook yet, it scaffolds one with `storybook init`
// (pass --no-init to skip). MDX docs are framework-agnostic and always emitted;
// CSF component stories are best-effort for react and vue.
//
// Pure Node stdlib. The only heavy dependency (Storybook itself) lives in the
// target repo, installed by `storybook init`, never in this folder.

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  read, write, exists, slug, cssVar,
  resolveTokens, groupByCategory,
} from './lib.mjs';

const DS = path.resolve(fileURLToPath(import.meta.url), '../..'); // design-system/
const REPO = path.resolve(DS, '..');                              // repo root
const d = (...a) => path.join(DS, ...a);
const r = (...a) => path.join(REPO, ...a);

const args = new Set(process.argv.slice(2));
const noInit = args.has('--no-init');
const TITLE_ROOT = 'Design system';

// ---------- config + source ----------
const config = exists(d('figma.config.json')) ? read(d('figma.config.json')) : {};
const sbConfig = config.storybook || {};

if (!exists(d('tokens/figma.raw.json'))) {
  console.error('Missing tokens/figma.raw.json. Bootstrap or pull first (see README).');
  process.exit(1);
}
const raw = read(d('tokens/figma.raw.json'));
const inventory = exists(d('inventory/components.json'))
  ? read(d('inventory/components.json'))
  : { components: [] };
const { flat } = resolveTokens(raw);
const groups = groupByCategory(flat);
const systemName = raw.meta?.name || config.name || 'Design system';

// ---------- framework detection ----------
function detectFramework() {
  const configured = (sbConfig.framework || 'auto').toLowerCase();
  if (configured !== 'auto') return configured;
  const pkgPath = r('package.json');
  if (!exists(pkgPath)) return 'html';
  const pkg = read(pkgPath);
  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  if (deps.react) return 'react';
  if (deps.vue) return 'vue';
  if (deps.svelte) return 'svelte';
  if (deps['@angular/core']) return 'angular';
  if (deps.lit) return 'web-components';
  return 'html';
}
const framework = detectFramework();
// Which frameworks we can emit live CSF stories for. Others get MDX docs only.
const CSF = { react: true, vue: true };

// ---------- Storybook presence / scaffold ----------
function findStorybookMain() {
  const dir = r('.storybook');
  if (!exists(dir)) return null;
  const main = fs.readdirSync(dir).find((f) => /^main\.(js|cjs|mjs|ts)$/.test(f));
  return main ? path.join(dir, main) : null;
}

function ensureStorybook() {
  const main = findStorybookMain();
  if (main) {
    console.log('- Found existing Storybook at .storybook/');
    return main;
  }
  if (noInit) {
    console.log('- No Storybook found and --no-init set. Skipping scaffold.');
    console.log('  Install it yourself with: npx storybook@latest init');
    return null;
  }
  console.log('- No Storybook found. Scaffolding with `storybook init`');
  console.log('  (this installs Storybook packages into your repo — may take a minute)');
  try {
    execSync('npx --yes storybook@latest init --yes', {
      cwd: REPO, stdio: 'inherit',
    });
  } catch (e) {
    console.error('  storybook init failed:', e.message);
    console.error('  Run `npx storybook@latest init` manually, then re-run ds:storybook.');
    return null;
  }
  return findStorybookMain();
}

// Best-effort: make sure Storybook picks up our stories folder and loads the
// token CSS so the docs are themed by the very tokens they describe. Config
// files are hand-owned, so we only inject when we can do it safely and we
// always print exact snippets as a fallback.
const STORIES_GLOB = "'../design-system/stories/**/*.@(mdx|stories.@(js|jsx|ts|tsx|vue))'";

function wireMain(mainPath) {
  if (!mainPath) return;
  let src = fs.readFileSync(mainPath, 'utf8');
  if (src.includes('design-system/stories')) {
    console.log('- Storybook main already includes the design-system stories glob.');
    return;
  }
  // Insert our glob as the first entry of the `stories: [ ... ]` array.
  const m = src.match(/stories\s*:\s*\[/);
  if (m) {
    const at = m.index + m[0].length;
    src = src.slice(0, at) + `\n    ${STORIES_GLOB},` + src.slice(at);
    fs.writeFileSync(mainPath, src);
    console.log(`- Added stories glob to ${path.relative(REPO, mainPath)}`);
  } else {
    console.log('- Could not auto-edit Storybook main. Add this to its `stories` array:');
    console.log(`    ${STORIES_GLOB}`);
  }
}

function wirePreview(mainPath) {
  if (!mainPath) return;
  const dir = path.dirname(mainPath);
  const previewFile = fs.readdirSync(dir).find((f) => /^preview\.(js|cjs|mjs|ts|jsx|tsx)$/.test(f));
  // variables.css is generated into design-system/tokens by build.mjs.
  const importLine = "import '../design-system/tokens/variables.css';";
  if (previewFile) {
    const p = path.join(dir, previewFile);
    let src = fs.readFileSync(p, 'utf8');
    if (src.includes('design-system/tokens/variables.css')) {
      console.log('- Storybook preview already imports the token CSS.');
      return;
    }
    fs.writeFileSync(p, importLine + '\n' + src);
    console.log(`- Imported token CSS into ${path.relative(REPO, p)}`);
  } else {
    console.log('- No preview file found. Create .storybook/preview.js containing:');
    console.log(`    ${importLine}`);
  }
}

// ---------- MDX generation ----------
const esc = (s) => String(s).replace(/[{}<>]/g, (c) => ({ '{': '&#123;', '}': '&#125;', '<': '&lt;', '>': '&gt;' }[c]));

function metaBlock(title) {
  return `import { Meta } from '@storybook/blocks';\n\n<Meta title="${title}" />\n`;
}

function swatchGrid(items) {
  const cells = items.map((t) =>
    `  <figure style={{ margin: 0 }}>
    <div style={{ height: '56px', borderRadius: '8px', border: '1px solid var(--color-border-default, #e6e4dd)', background: 'var(${cssVar(t.name)})' }} />
    <figcaption style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '8px', fontSize: '12px' }}>
      <code>${esc(t.name)}</code>
      <span style={{ opacity: 0.6 }}>${esc(t.light ?? '')}</span>
    </figcaption>
  </figure>`
  ).join('\n');
  return `<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>\n${cells}\n</div>`;
}

function scaleTable(items) {
  const rows = items.map((t) => `| \`${esc(t.name)}\` | \`${esc(t.light ?? '')}\` |`).join('\n');
  return `| Token | Value |\n| --- | --- |\n${rows}`;
}

function foundationsMdx() {
  const order = ['color', 'space', 'radius', 'font', 'shadow'];
  const cats = [...order.filter((c) => groups[c]), ...Object.keys(groups).filter((c) => !order.includes(c))];
  const sections = cats.map((cat) => {
    const items = groups[cat];
    const heading = `## ${cat[0].toUpperCase() + cat.slice(1)}`;
    if (cat === 'color') return `${heading}\n\n${swatchGrid(items)}`;
    return `${heading}\n\n${scaleTable(items)}`;
  }).join('\n\n');
  return `${metaBlock(`${TITLE_ROOT}/Foundations`)}
# ${esc(systemName)}

Generated from Figma variables — the single source of truth. Every value below is
rendered with the token it documents, so this page stays true to the source.

${sections}
`;
}

// Nest component docs under their category (matching the static site sidebar).
function componentTitle(c) {
  return c.category
    ? `${TITLE_ROOT}/Components/${c.category}/${c.name}`
    : `${TITLE_ROOT}/Components/${c.name}`;
}

function componentMdx(c) {
  const title = componentTitle(c);
  const props = (c.props || []).map((pr) =>
    `| \`${esc(pr.name)}\` | ${(pr.values || []).map((v) => `\`${esc(v)}\``).join(', ')} |`
  ).join('\n');
  const propsTable = props ? `| Prop | Values |\n| --- | --- |\n${props}` : '_No documented props._';
  const anatomy = (c.anatomy || []).map((a) => `- ${esc(a)}`).join('\n');
  const states = (c.states || []).map((s) => `\`${esc(s)}\``).join(' · ');
  const tokensUsed = (c.tokensUsed || []).map((t) => `- \`${esc(t)}\``).join('\n');
  const dos = (c.usage?.do || []).map((x) => `- ${esc(x)}`).join('\n');
  const donts = (c.usage?.dont || []).map((x) => `- ${esc(x)}`).join('\n');
  const codeLine = c.codeConnected
    ? `> **Code-connected** → \`${esc(c.codePath || '')}\``
    : `> **Not yet code-connected.** Engineers should not hand-build this until a mapping exists.`;
  const importLine = c.usage?.import ? `\n\`\`\`ts\n${c.usage.import}\n\`\`\`\n` : '';
  const examples = (c.examples || []).map((ex) => {
    const specs = (ex.specs || []).map((s) =>
      `| ${esc(s.label)} | ${s.token ? `\`${esc(s.token)}\`` : esc(s.value ?? '')} |`
    ).join('\n');
    const specTable = specs ? `\n| Spec | Value |\n| --- | --- |\n${specs}\n` : '';
    const code = ex.code ? `\n\`\`\`html\n${ex.code}\n\`\`\`\n` : '';
    return `### ${esc(ex.title || 'Example')}\n\n${esc(ex.description || '')}\n${code}${specTable}`;
  }).join('\n');
  const examplesSection = examples ? `\n## Examples\n\n${examples}\n` : '';
  return `${metaBlock(title)}
# ${esc(c.name)}

${esc(c.description || '')}

${codeLine}
${importLine}${examplesSection}
## Anatomy

${anatomy || '_—_'}

## Properties

${propsTable}

## States

${states || '_—_'}

## Tokens used

${tokensUsed || '_—_'}

## Do

${dos || '_—_'}

## Don't

${donts || '_—_'}
`;
}

// ---------- CSF (live) stories, framework-specific ----------
function importPathFor(codePath) {
  // codePath is relative to repo root; stories live in design-system/stories/.
  const fromStories = path.relative(d('stories'), r(codePath));
  return fromStories.replace(/\\/g, '/').replace(/\.(t|j)sx?$/, '');
}

function argTypesFor(c) {
  const entries = (c.props || []).map((pr) =>
    `    ${JSON.stringify(pr.name)}: { control: 'select', options: ${JSON.stringify(pr.values || [])} }`
  ).join(',\n');
  return entries ? `{\n${entries},\n  }` : '{}';
}
function defaultArgs(c) {
  const obj = {};
  for (const pr of c.props || []) if (pr.values?.length) obj[pr.name] = pr.values[0];
  return JSON.stringify(obj);
}

function reactStory(c) {
  const imp = importPathFor(c.codePath);
  return `import type { Meta, StoryObj } from '@storybook/react';
import { ${c.name} } from '${imp}';

const meta: Meta<typeof ${c.name}> = {
  title: '${componentTitle(c)}',
  component: ${c.name},
  tags: ['autodocs'],
  argTypes: ${argTypesFor(c)},
};
export default meta;

type Story = StoryObj<typeof ${c.name}>;

export const Default: Story = {
  args: ${defaultArgs(c)},
};
`;
}

function vueStory(c) {
  const imp = importPathFor(c.codePath);
  return `import type { Meta, StoryObj } from '@storybook/vue3';
import ${c.name} from '${imp}';

const meta: Meta<typeof ${c.name}> = {
  title: '${componentTitle(c)}',
  component: ${c.name},
  tags: ['autodocs'],
  argTypes: ${argTypesFor(c)},
};
export default meta;

type Story = StoryObj<typeof ${c.name}>;

export const Default: Story = {
  args: ${defaultArgs(c)},
};
`;
}

// ---------- write everything ----------
const outDir = d('stories');
// Clean previously generated files so removed components don't linger.
if (exists(outDir)) {
  for (const f of fs.readdirSync(outDir)) {
    if (/\.(mdx|stories\.(t|j)sx?)$/.test(f)) fs.rmSync(path.join(outDir, f));
  }
}

write(path.join(outDir, 'Foundations.mdx'), foundationsMdx());
write(path.join(outDir, 'DesignTokens.mdx'), `${metaBlock(`${TITLE_ROOT}/Design tokens`)}
# Design tokens

Live gallery of every color token, rendered from CSS variables.

${swatchGrid(groups.color || [])}
`);

let liveCount = 0;
for (const c of inventory.components) {
  write(path.join(outDir, `${slug(c.name)}.mdx`), componentMdx(c));
  if (CSF[framework] && c.codeConnected) {
    const ext = framework === 'vue' ? 'ts' : 'tsx';
    const body = framework === 'vue' ? vueStory(c) : reactStory(c);
    write(path.join(outDir, `${slug(c.name)}.stories.${ext}`), body);
    liveCount++;
  }
}

// ---------- wire Storybook ----------
const mainPath = ensureStorybook();
wireMain(mainPath);
wirePreview(mainPath);

console.log(
  `\nGenerated Storybook docs -> design-system/stories/` +
  `\n  framework: ${framework}` +
  `\n  ${inventory.components.length} component doc page(s), ${liveCount} live stor${liveCount === 1 ? 'y' : 'ies'}` +
  (CSF[framework] ? '' : `\n  (MDX docs only — set storybook.framework to react/vue in figma.config.json for live stories)`)
);
console.log(`\nNext:\n  npx storybook dev     # preview\n  npx storybook build   # static build for hosting (free, self-host anywhere)`);
