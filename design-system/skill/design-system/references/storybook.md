# Storybook docs flow

Publish the design system as a Storybook, generated from the same single source
as the static site (`tokens/figma.raw.json` + `inventory/components.json`). Use
this when the project already uses a component framework and wants a live,
interactive component playground alongside (or instead of) the static `site/`.

## When to use vs the static site

- `build.mjs` → `site/` is the **universal** output. Zero-dependency static
  HTML, works in any repo regardless of framework. This is always available.
- `storybook.mjs` → `stories/` adds a **Storybook**: live component playground
  with controls/args, rendered from the real code components. Only meaningful in
  a repo with a supported JS framework (React or Vue for live stories; any
  framework gets MDX docs).

Do not remove the static site to add Storybook — they share one source and serve
different audiences (static site = anyone with a browser; Storybook = engineers
running the app).

## Run it

```bash
node design-system/scripts/build.mjs        # first, so tokens/variables.css exists
node design-system/scripts/storybook.mjs    # or: npm run ds:storybook
```

What it does, in order:

1. Reads `storybook.framework` from `figma.config.json` (`auto` by default,
   which detects react/vue/svelte/angular/lit/html from the repo `package.json`).
2. Generates into `design-system/stories/` (gitignored, regenerated each run):
   - `Foundations.mdx` and `DesignTokens.mdx` — token tables and a live swatch
     gallery, framework-agnostic.
   - `<Component>.mdx` — one doc page per inventoried component, nested by
     category, with anatomy, props, states, tokens used, and do/don't.
   - `<Component>.stories.tsx|ts` — a live CSF story per **code-connected**
     component, but only when the framework is react or vue. Non-connected
     components get MDX docs only (they have no real component to render).
3. If the repo has no Storybook, scaffolds one with `storybook init` (pass
   `--no-init` to skip). Then best-effort wires the stories glob into
   `.storybook/main.*` and imports `variables.css` into `.storybook/preview.*`
   so the stories are themed by the tokens. If a config can't be auto-edited it
   prints the exact snippet to paste.

## Framework

Live stories are emitted only for code-connected components (`codeConnected:
true` with a valid `codePath`), because a story must import a real component.
For an uninventoried or not-yet-built component, do not invent a story — leave
it as an MDX doc so the gap is visible.

Set the framework explicitly in `figma.config.json` when auto-detection is wrong
or a repo has more than one framework:

```json
"storybook": { "framework": "react" }
```

Values: `auto`, `react`, `vue`, `svelte`, `angular`, `web-components`, `html`.
Only `react` and `vue` produce live stories today; the rest get MDX docs.

## Hosting (free)

Storybook is open source and free to run. Publish a static build anywhere:

```bash
npx storybook build          # outputs ./storybook-static
```

Host `storybook-static/` on GitHub Pages, Netlify, Cloudflare Pages, etc. The
paid Chromatic service is optional (visual review/snapshots) and not needed to
publish docs.
