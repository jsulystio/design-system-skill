# Design system (drop-in)

A self-contained `design-system/` folder you add to **any existing repository**.
It never touches your repo root, has zero npm dependencies, and treats
**Figma variables as the source of truth**. From that one source it generates:

- `tokens/tokens.json` normalized design tokens (light and dark)
- `tokens/variables.css` CSS custom properties for your app
- `tokens/tailwind.theme.js` a Tailwind theme wired to those variables
- `site/` a static guideline site, themed by the very tokens it documents
- `code-connect/` maps Figma components to your real code components
- `skill/design-system/` a Claude skill for the parts that need judgment

Everything lives under `design-system/`. Generated output goes in
`design-system/site/`, so it cannot collide with a `docs/` your app already has.

---

## Requirements

- Node.js 18 or newer (`node --version`). Nothing else is needed to build.
- A Figma file with variables and components (yours, any plan).

---

## Add it to an existing project

You only do this once per repo, and it is a developer task of a few minutes.

### Option A: from this download

1. Move the `design-system/` folder into the root of your existing repo.
2. From the repo root, wire it in:

   ```bash
   node design-system/install.mjs            # installs the Claude skill, prints npm scripts
   # or do everything automatically:
   node design-system/install.mjs --scripts  # also adds ds:* scripts to package.json
   ```

3. Confirm it builds against the bundled samples:

   ```bash
   node design-system/scripts/build.mjs
   npx serve design-system/site
   ```

### Option B: one-liner for every future repo

Once you have pushed this `design-system/` folder to any normal GitHub repo (no
template needed), pull just the subtree into any project with degit:

```bash
npx degit your-org/your-repo/design-system design-system
node design-system/install.mjs --scripts
```

### What install.mjs does

Non-destructive by default. It copies `skill/design-system` to your repo-root
`.claude/skills/design-system` so Claude discovers it, and prints the four `ds:*`
npm scripts. Flags: `--scripts` adds those scripts to your `package.json`,
`--force` updates an already-installed skill, `--with-pages` adds an optional
Pages workflow. Prefer to do it by hand? Copy `skill/design-system` into
`.claude/skills/` yourself; that is the only step needed for the skill.

---

## Bootstrap from your Figma file

This replaces the bundled samples with your real system. Pick one path:

- With Claude (recommended, any Figma plan). Open the repo in Claude Code or
  Cowork, connect the Figma MCP server or start the Desktop Bridge on your file,
  and ask Claude to "bootstrap the design system". The skill reads variables,
  scans screens for component usage, and writes `design-system/tokens/figma.raw.json`,
  `inventory/screens.json`, and the component inventory. No Enterprise needed.
- Manual import (any plan, no Claude). Run a free export-variables plugin in
  Figma, save its JSON to `design-system/import/variables.export.json`, then
  `node design-system/scripts/pull.mjs && node design-system/scripts/build.mjs`.
- REST (Enterprise only). The Figma Variables REST API needs a Full seat in an
  Enterprise org. If you have it, set `pull.mode` to `rest` in
  `design-system/figma.config.json`, export `FIGMA_TOKEN`, and run the pull.

Set your project name and Figma file key in `design-system/figma.config.json`.

---

## Daily loop

Designers edit variables and components in Figma. Regenerate with the skill or
scripts:

```bash
node design-system/scripts/build.mjs     # or: npm run ds:build  (if you added scripts)
node design-system/scripts/lint.mjs      # flags raw values + uninventoried components
```

Re-read screens into `inventory/screens.json` via the skill (see
`skill/design-system/references/read-figma.md`) before linting when designs have
changed. The pull script only refreshes variables; screen scans need MCP or the
bridge.

Or, if you added the npm scripts, `npm run ds:sync` does pull, build, and lint in
one. Wire it to a git pre-commit hook or a Figma publish webhook and even the
command disappears. You only invoke the Claude skill for judgment: first-time
bootstrap, resolving drift, and translating a change ("primary warmer, buttons
less round") into token edits. Each is one short request.

Consume the output in your app: import `design-system/tokens/variables.css`
globally, and in `tailwind.config.js`:

```js
theme: { extend: require('./design-system/tokens/tailwind.theme.js') }
```

---

## Hosting the docs

The docs are static files in `design-system/site/`. Host them wherever. If this
repo does not already use GitHub Pages, `node design-system/install.mjs
--with-pages` adds a workflow that builds and publishes them on every push. If
the repo already uses Pages for your app, host the docs on a subpath or a
separate site instead of adding the workflow.

### Or publish to Storybook

If the project uses a component framework and wants a live, interactive
playground alongside the static docs, generate a Storybook from the same single
source:

```bash
node design-system/scripts/build.mjs         # generates tokens first
node design-system/scripts/storybook.mjs     # or: npm run ds:storybook
```

It writes `design-system/stories/` (foundations + token gallery + a doc page per
component, plus live stories for code-connected React/Vue components), and if the
repo has no Storybook yet it scaffolds one with `storybook init`. The framework
is auto-detected from your `package.json`; override it in `figma.config.json`:

```json
"storybook": { "framework": "react" }
```

Storybook is free and open source. Publish a static build (`npx storybook build`,
outputs `storybook-static/`) to GitHub Pages, Netlify, or Cloudflare Pages — no
paid service required. The static `site/` and Storybook share one source, so keep
whichever fits your audience, or both. See
`skill/design-system/references/storybook.md` for details.

## What is generated vs owned

Owned and committed: `figma.raw.json` (the pulled variables), `inventory/screens.json`
(the screen usage snapshot), the component inventory, the scripts, and Code Connect
mappings. Generated and gitignored (via
`design-system/.gitignore`): `tokens.json`, `variables.css`, `tailwind.theme.js`,
and `site/`. Versioning is just git history on the raw pull.

## Updating

`degit` is a one-time fetch, not a package manager, so re-running it
**overwrites** this folder. That matters once you have bootstrapped, because the
folder then holds files you own (`tokens/figma.raw.json`,
`inventory/components.json`, `figma.config.json`, and `code-connect/`).

Still on the bundled samples (not bootstrapped yet). Just force-refetch:

```bash
npx degit jsulystio/design-system-skill/design-system design-system --force
node design-system/install.mjs --force
node design-system/scripts/build.mjs
```

Already bootstrapped (you have real data). Commit first so git is your safety
net, refetch the tooling, then restore your owned files:

```bash
git add design-system && git commit -m "snapshot before DS update"
npx degit jsulystio/design-system-skill/design-system design-system --force
git checkout -- design-system/tokens/figma.raw.json \
                design-system/inventory/screens.json \
                design-system/inventory/components.json \
                design-system/figma.config.json \
                design-system/code-connect
git diff --stat        # review exactly which tooling files changed
node design-system/install.mjs --force && node design-system/scripts/build.mjs
```

Generated files (`tokens.json`, `variables.css`, `tailwind.theme.js`, `site/`)
are gitignored and rebuilt by `build.mjs`, so they never need restoring. If you
installed the skill globally, you skip the skill part entirely — a `git pull` in
your global clone updates it everywhere.

## Uninstall

Delete the `design-system/` folder, remove `.claude/skills/design-system`, and
drop any `ds:*` scripts you added. Nothing else in your repo was modified.

## Customizing

Nothing here is locked to a product or framework. The sample palette, spacing,
and components are neutral defaults meant to be replaced. Fork the component set
(for example shadcn/ui if you are on Tailwind), point the pull step at your Figma
file, and the docs and tokens follow.
