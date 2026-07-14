# Bootstrap: first system from a working file

Goal: turn a messy WIP Figma file into a first token set, screen usage snapshot,
and component inventory without forcing a design-system-first workflow.

0. Scaffold the toolkit if this project does not have it yet. If there is no
   `design-system/` folder at the repo root, create one before anything else:

   ```bash
   npx degit jsulystio/design-system-skill/design-system design-system
   node design-system/install.mjs --scripts   # adds the ds:* npm scripts
   ```

   This is what lets the skill live globally (`~/.claude/skills/design-system`)
   while each project still gets its own scripts, tokens, and inventory. If the
   folder already exists, skip this step.

1. Follow `references/read-figma.md` to read the live file:
   - **Variables** → `tokens/figma.raw.json`
   - **Screens** → walk top-level frames, scan instances and raw values →
     `inventory/screens.json`
   - **Component definitions** → `inventory/components.json` (plus judgment to
     cluster repeated non-component layers into proposed components)

2. For component inventory entries, name each component, its props, states, and
   the tokens it uses. Mark components with no code equivalent yet as
   `"codeConnected": false`. See "Inventory fields" below for the full shape.

3. Run `node design-system/scripts/build.mjs` then
   `node design-system/scripts/lint.mjs`. Open `design-system/site/index.html`
   and confirm the foundations and component pages look right. The lint run
   should use your real `screens.json`, not the sample. The build also
   regenerates `DESIGN-SYSTEM.md` — the agent-readable handoff spec — so
   commit it with the rest.

4. Present the proposed names, screen coverage, and any drift the linter found
   to the person for approval before committing. Extraction is noisy, so expect
   to merge or rename.

Do not invent tokens that are not in the file. If a screen uses raw values,
surface them as candidates rather than silently creating variables.

## Inventory fields

Each entry in `inventory/components.json` drives one generated page and its
card on the foundations index. Fields the build reads:

- `name` — display name; also the slug for the page URL.
- `category` — groups the component in the sidebar and index. Known order:
  Actions, Forms, Layout, Navigation, Feedback, Data display, Overlays.
  Unknown categories are kept and sorted after these. Omit → "Components".
- `status` — maturity badge and nav dot: `stable | beta | deprecated | planned`.
  Omit → `stable`. This is doc metadata, separate from `codeConnected`.
- `description` — one line, shown under the title and on the card.
- `preview` — a small HTML snippet rendered live in a themed stage as the card
  thumbnail on the index. Use the built-in demo classes so it stays themed by the
  tokens (no per-component CSS needed): `ds-btn` (`--primary|--secondary|--ghost`,
  `--sm|--lg`, plus `disabled`), `ds-field` + `ds-input` (`--focus`, `disabled`),
  `ds-card` (`--flat`, with `ds-card-title`/`ds-card-body`), `ds-badge`
  (`--neutral`), `ds-tag` (`ds-tag-x`). Escape any `<`, `>`, `&`.
- `image` — path to an exported Figma visual (`assets/components/<slug>.png`,
  relative to `design-system/`). Shown as the card thumbnail, in the page's
  Anatomy section, and embedded in DESIGN-SYSTEM.md. When present it replaces
  the `preview` fallback, so components without demo HTML still get a real
  visual. Export via the Figma MCP `download_assets` tool (scale big variant
  grids to 0.25–0.5).
- `examples` — the variant gallery on the component page. Each entry renders a
  labeled card: a live stage plus a tabbed **Usage / CSS** panel (a tab appears
  only when it has content). Fields: `title`, `description` (optional), `code`,
  `usage` (optional), and `specs` — rows of `{ label, token }` or
  `{ label, value }`. With no `examples`, the page falls back to a single stage
  built from `preview`.
- The three code fields each have a distinct job — author them so an engineer can
  both *call* and *build* the component without leaving the page:
  - `code` — demo HTML using the `ds-*` classes. It **only powers the live
    preview** and is never shown as-is to the reader. A rendering artifact.
  - `usage` — the real component call a developer writes
    (`<Button variant="primary">Save changes</Button>`). Shown in the **Usage**
    tab. Author it for every code-connected example. When absent (e.g. a
    not-yet-built component) the tab falls back to `code`, honestly labeled
    **HTML** instead of **Usage**.
  - `specs` — the styling contract. Rendered in the **CSS** tab as generated,
    token-referencing CSS (`property: var(--token); /* resolved value */`), not a
    lookup table — so the tokens live in liftable code. `token` rows resolve to
    the token's current value in a trailing comment; `value` rows use a literal
    like `45%` or `transparent`. A label maps to a CSS property via `CSS_PROP` in
    `build.mjs`; unmapped labels are emitted as comments so the block stays valid
    CSS. Add a label to `CSS_PROP` when you introduce a new spec dimension.
- `anatomy`, `props`, `states`, `tokensUsed` — the reference tables.
- `usage.do` / `usage.dont` — the guidance columns.
- `usage.import` — optional one-line import statement, shown as a code block.
- `codeConnected` / `codePath` — whether an engineer-owned component exists yet.

Add a demo class to `SITE_CSS` in `build.mjs` only when a new component type has
no existing `ds-*` class that fits — reuse before inventing.

## The template catalog and the roadmap file

`inventory/components.json` ships pre-filled with the **AlignUI 2.0 template
catalog**: every Base and Product component from the team's template Figma file
(Buttons, Selects, Modals, Sidebar, Tables, …) with the props, states, anatomy,
and an exported visual (`assets/components/*.png`) of the real component sets.
Entries with `codeConnected: false` are design-stable but not built — coding
agents scaffold them from their spec (see `references/build-ui.md`) instead of
inventing an API. Delete entries the project will never use so the docs stay
honest.

`inventory/component-templates.json` is the project's **roadmap file**: add
components you have agreed to build that are not in Figma or code yet. The
build renders each (whose name is not already in `components.json`) as a
`planned` placeholder page. When one ships, move it into `components.json`.

When bootstrapping a client file that was duplicated from the template, match
extracted components against the catalog by name first — the goal is to keep
the template's naming and props, not to re-derive them. Refresh the component
visuals from the client's file (export the component-set nodes to
`assets/components/<slug>.png`) so the docs show the client's actual UI.
