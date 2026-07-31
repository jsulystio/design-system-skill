---
name: design-system
description: >
  Maintain and use the design system where Figma variables are the source of
  truth. Use for: starting a new project from the starter template,
  bootstrapping a first token set and component inventory from a messy Figma
  file, reading Figma screens and scanning component usage, resolving drift
  flagged by the linter, propagating a design change (color, spacing, radius,
  variant) into token edits, and building UI code that follows the system
  (tokens + component catalog via the generated DESIGN-SYSTEM.md). Runs the
  repo scripts for mechanical work and reserves the model for judgment.
---

# Design system skill

Figma is the **default** source of truth, but sync runs in **either direction**,
always through a diff you approve. Reading derives tokens, code, and docs from
Figma. Writing pushes an approved local change (a token value, a component's
spec) back to Figma. No side silently overwrites the other: every write shows the
exact edits first, and when both sides moved a per-area **owner** in
`figma.config.json` (`sync.ownership`) picks the default direction while genuine
conflicts stop for you. The `propagate change`, `refresh from approved`, and
`sync` flows are the write paths (see `references/sync.md`); after a write, Figma
holds the change and everything else re-derives from it.

The system has two audiences and one contract:

- **Designers** work in Figma; the scripts turn their variables into tokens,
  a docs site, and code themes.
- **Developers (and coding agents)** consume `design-system/DESIGN-SYSTEM.md`
  — a generated, self-contained spec of every token and component. Any flow
  that changes tokens or inventory must end with a rebuild so that file stays
  true.

## Operating rules

- This skill may be installed globally, so a project might not have the toolkit
  yet. If there is no `design-system/` folder at the repo root, scaffold it first
  (see the new-project flow) before running any script.
- Confirm you are in a **client project**, not this skill's own template. The
  bundled `design-system/` ships with a placeholder `fileKey`
  (`REPLACE_WITH_FIGMA_FILE_KEY`) and the AlignUI starter tokens. If the
  `fileKey` is still the placeholder, or you are inside the design-system-skill
  repo itself, stop and confirm where the client's `design-system/` lives before
  editing tokens, demos, or committing. Editing the template in place produces
  work that has to be thrown away.
- When bootstrapping or starting a new project, ask the person for the two
  inputs before scaffolding: the **Figma file link** and the **GitHub repo or
  local path** (where `design-system/` lives and where the app source is). Never
  guess a file key or a path. Record the `fileKey`/`meta.name` in
  `figma.config.json` and the source folder(s) in `lint.codePaths`.
- Mechanical work goes through scripts, not the model: run `node design-system/scripts/pull.mjs`,
  `node design-system/scripts/build.mjs`, `node design-system/scripts/lint.mjs`. Do not read or rewrite whole
  files token by token when a script can do it.
- Read Figma through the official MCP server (preferred) or the desktop / console
  bridge. Both may be connected and either can drop mid-conversation: when one
  errors, is missing, times out, or returns an empty/incomplete result, switch to
  the other **automatically** using the equivalent tool — do not ask which to use,
  and only surface an error once **both** have failed. The capability→tool mapping
  and the fallback procedure (including `figma_reconnect`/`figma_diagnose` for the
  bridge) are in `references/read-figma.md` §0. Every flow that touches the file
  must read **variables**, **screens**, and **component usage**. Variables go to
  `tokens/figma.raw.json`; screen scans go to `inventory/screens.json`;
  component definitions go to `inventory/components.json`.
- MCP tools: `get_variable_defs` (variables), `get_metadata` (page/screen tree,
  instance scan), `search_design_system` and `get_context_for_code_connect`
  (component definitions); bridge equivalents `figma_get_variables`,
  `figma_get_file_data`, `figma_search_components`. If the Variables REST API
  returns 403, that is the Enterprise limit — use MCP or the bridge instead.
- Keep changes reviewable. Show the person a diff or a short list before
  applying anything that writes to Figma or commits files.
- Structural component changes (new prop, new layout logic) on an existing
  code-connected component are out of scope — flag them for an engineer.
  *Building* a component that the inventory already specifies is in scope: the
  build-ui flow scaffolds it from its spec. Writing components to Figma is in
  scope only for color, style, and variants (the `refresh from approved` flow
  binds fills/strokes to variables and builds variant sets); new props or new
  layout logic still go to an engineer.
- Never hardcode a visual value in code you write; everything goes through the
  tokens (`variables.css` / `tailwind.theme.js`). Check your own output with
  `node design-system/scripts/lint.mjs --code <dir>`.

## Flows

Pick the flow that matches the request, then follow its reference file. All
flows that read the Figma file start with `references/read-figma.md`.

- New client project, or "set up the design system from the template": see
  `references/new-project.md`.
- First run on an existing messy file, or "extract the system from this file":
  see `references/bootstrap.md`.
- Client approved one explored direction, "refresh the system from the approved
  screens": see `references/refresh-from-approved.md` — detects the palette and
  components from the approved frames, reconciles them into the bootstrapped
  system, and writes the result back to Figma (variables + components), code, and
  docs.
- Build or change UI code using the system — "build the settings page",
  "implement this screen": see `references/build-ui.md`.
- Survey divergence, "show me the drift", "audit the system": see
  `references/drift.md` — defines the four drift lanes (design/code ×
  alignment/consistency) and audits them without fixing.
- Lint reported issues, or "resolve the drift": see `references/resolve-drift.md`.
- Components inherited from a template/library look off-brand or point at the
  wrong values (old palette, a magenta/other accent theme, the wrong font or
  radius), and you need them on the **local** tokens — "update the components to
  match the design", "fix the buttons/inputs", "the components don't use our
  colors/font": see `references/reconcile-library.md`. Detects fills, strokes,
  and text bound to **remote** (published-library) variables or deprecated text
  styles and rebinds them to the local same-named token/style.
- A design change request, e.g. "primary warmer, radius 8 to 4": see
  `references/propagate-change.md`.
- Push local edits to Figma, or reconcile the two when both moved — "sync my
  token/spec edits to Figma", "sync the design system both ways": see
  `references/sync.md`. It diffs the two sides, you approve, then it writes to
  Figma with `use_figma`. `propagate-change` and `refresh from approved` are
  specific write paths; `sync` is the general one and covers the reverse
  (code/docs → Figma) direction.
- Publish the system as a Storybook, or "generate the design guidelines on
  Storybook": see `references/storybook.md`.

After any flow that changes tokens or inventory, run
`node design-system/scripts/build.mjs` then
`node design-system/scripts/lint.mjs` and report the result. The build also
refreshes `DESIGN-SYSTEM.md`, which is committed — include it in the diff you
show.

The rebuild re-derives the docs from **tokens + inventory**. Token *values*
(colors, the type ramp, the radius/spacing steps) flow from Figma through
`pull` then `build`. Per-component specs (which radius, padding, and font each
component uses) live in `inventory/components.json` as each component's `spec`,
so they flow through `build` too: the spec tables, the `DESIGN-SYSTEM.md` rows,
and the preview's corner radius all track the inventory. The read flows
(`refresh from approved`, `reconcile-library`) write those specs from Figma, so a
component change reaches the docs on the next sync.

What still does **not** auto-derive: the rendered preview's non-radius visuals in
`demos/demos.css` (a variant's fill color, its layout) are hand-built mocks, not a
render of the Figma component. If those drift, update `demos/demos.css` by hand
and say so in your report, rather than implying every pixel of the preview comes
from Figma.
