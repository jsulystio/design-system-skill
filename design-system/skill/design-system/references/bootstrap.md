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
   should use your real `screens.json`, not the sample.

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
- `preview` — a small HTML snippet rendered live in a themed stage at the top of
  the page and as the card thumbnail. Use the built-in demo classes so it stays
  themed by the tokens (no per-component CSS needed):
  `ds-btn` (`--primary|--secondary|--ghost`, `--sm`), `ds-field` + `ds-input`,
  `ds-card` (`ds-card-title`, `ds-card-body`), `ds-badge` (`--neutral`),
  `ds-tag` (`ds-tag-x`). Keep it to a few representative variants; escape any
  `<`, `>`, `&` since the string is emitted verbatim into the page.
- `anatomy`, `props`, `states`, `tokensUsed` — the reference tables.
- `usage.do` / `usage.dont` — the guidance columns.
- `usage.import` — optional one-line import statement, shown as a code block.
- `codeConnected` / `codePath` — whether an engineer-owned component exists yet.

Add a demo class to `SITE_CSS` in `build.mjs` only when a new component type has
no existing `ds-*` class that fits — reuse before inventing.
