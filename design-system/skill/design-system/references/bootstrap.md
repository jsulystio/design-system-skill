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
- Component **visuals are live, not images.** The rendered HTML lives in
  `design-system/demos/registry.mjs` (keyed by slug), styled by the token-based
  `ds-*` classes in `demos/demos.css`. Per slug you can supply `preview` (card
  cover + hero), `variants` (`[{title, description?, html, tsx}]`), `anatomy`
  (`{html, parts}` — one instance + the numbered part list), and `states`
  (`[{label, html}]` — the interaction grid). Because it is token-based it
  restyles itself when tokens change — no Figma export, no per-change token
  cost. A component with no registry entry still renders a spec-only page.
- The **Variants** gallery comes from the demo registry's `variants`
  (`[{title, description?, html, tsx}]`): each renders a live stage plus a
  copyable **TSX** call (the component a developer writes — `<Button
  type="primary">Save changes</Button>`). There is intentionally no CSS/HTML
  excerpt: the live preview shows the look, "Tokens used" names the styling
  tokens, and TSX is what devs actually copy. If a component has no registry
  entry, the gallery falls back to TSX-only rows from any inventory `examples`
  (`{title, usage}`).
- `anatomy`, `props`, `states`, `tokensUsed` — the reference data.
  `states` renders as the interactive **States** section (the demo registry
  supplies the live per-state HTML); `props` renders the **API** table.
- The **Specs** redline table (Property → Token → resolved value, with color
  swatches) comes from `design-system/demos/specs.mjs` (rows of
  `{prop, token}` or `{prop, value}`). Token rows resolve to the current value
  at build time, so specs never drift; literal rows cover fixed sizes. This is
  what an engineer implements from and a designer cross-checks against; it also
  appears in DESIGN-SYSTEM.md. A slug with no specs entry falls back to the
  compact "Tokens used" list.
- `usage.do` / `usage.dont` — the guidance columns.
- `usage.import` — optional one-line import statement, shown as a code block.
- `codeConnected` / `codePath` — whether an engineer-owned component exists yet.

Add a `ds-*` class to `demos/demos.css` only when a new component type has no
existing class that fits — reuse before inventing.

## The template catalog and the roadmap file

`inventory/components.json` ships pre-filled with the **AlignUI 2.0 template
catalog**: every Base and Product component from the team's template Figma file
(Buttons, Selects, Modals, Sidebar, Tables, …) with the props, states, anatomy,
and a live token-based demo (in `demos/registry.mjs`) of the real component sets.
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
the template's naming and props, not to re-derive them. The live demos in
`demos/registry.mjs` carry over as-is; adjust them only where the client's
component genuinely differs from the template.
