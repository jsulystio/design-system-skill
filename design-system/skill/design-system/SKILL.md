---
name: design-system
description: >
  Maintain and use the design system where Figma variables are the source of
  truth. Use for: starting a new project from the AlignUI-based template,
  bootstrapping a first token set and component inventory from a messy Figma
  file, reading Figma screens and scanning component usage, resolving drift
  flagged by the linter, propagating a design change (color, spacing, radius,
  variant) into token edits, and building UI code that follows the system
  (tokens + component catalog via the generated DESIGN-SYSTEM.md). Runs the
  repo scripts for mechanical work and reserves the model for judgment.
---

# Design system skill

Figma variables are the source of truth. Sync flows one direction: Figma to
tokens to code and docs. Do not write to the Figma canvas except in the
`propagate change` flow, and only after the person approves the exact edits.

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
  build-ui flow scaffolds it from its spec.
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
- Build or change UI code using the system — "build the settings page",
  "implement this screen": see `references/build-ui.md`.
- Lint reported issues, or "resolve the drift": see `references/resolve-drift.md`.
- A design change request, e.g. "primary warmer, radius 8 to 4": see
  `references/propagate-change.md`.
- Publish the system as a Storybook, or "generate the design guidelines on
  Storybook": see `references/storybook.md`.

After any flow that changes tokens or inventory, run
`node design-system/scripts/build.mjs` then
`node design-system/scripts/lint.mjs` and report the result. The build also
refreshes `DESIGN-SYSTEM.md`, which is committed — include it in the diff you
show.
