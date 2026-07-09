---
name: design-system
description: >
  Maintain the design system where Figma variables are the source of
  truth. Use for: bootstrapping a first token set and component inventory from a
  messy Figma file, reading Figma screens and scanning component usage,
  resolving drift flagged by the linter, and propagating a design change
  (color, spacing, radius, variant) into token edits. Runs the repo scripts for
  mechanical work and reserves the model for judgment. Not for structural
  component code changes, which need an engineer.
---

# Design system skill

Figma variables are the source of truth. Sync flows one direction: Figma to
tokens to code and docs. Do not write to the Figma canvas except in the
`propagate change` flow, and only after the person approves the exact edits.

## Operating rules

- This skill may be installed globally, so a project might not have the toolkit
  yet. If there is no `design-system/` folder at the repo root, scaffold it first
  (see the bootstrap flow) before running any script.
- Mechanical work goes through scripts, not the model: run `node design-system/scripts/pull.mjs`,
  `node design-system/scripts/build.mjs`, `node design-system/scripts/lint.mjs`. Do not read or rewrite whole
  files token by token when a script can do it.
- Read Figma through the MCP server (preferred) or the Desktop Bridge. Every flow
  that touches the file must read **variables**, **screens**, and **component
  usage** — see `references/read-figma.md`. Variables go to
  `tokens/figma.raw.json`; screen scans go to `inventory/screens.json`;
  component definitions go to `inventory/components.json`.
- MCP tools: `get_variable_defs` (variables), `get_metadata` (page/screen tree,
  instance scan), `search_design_system` and `get_context_for_code_connect`
  (component definitions). If the Variables REST API returns 403, that is the
  Enterprise limit — use MCP or the bridge instead.
- Keep changes reviewable. Show the person a diff or a short list before
  applying anything that writes to Figma or commits files.
- Structural component changes (new prop, new layout logic) are out of scope.
  Flag them for an engineer instead of inventing behavior.

## Flows

Pick the flow that matches the request, then follow its reference file. All
flows that read the file start with `references/read-figma.md`.

- First run on a file, or "set up the system": see `references/bootstrap.md`.
- Lint reported issues, or "resolve the drift": see `references/resolve-drift.md`.
- A design change request, e.g. "primary warmer, radius 8 to 4": see
  `references/propagate-change.md`.

After any flow that changes tokens, run `node design-system/scripts/build.mjs` then
`node design-system/scripts/lint.mjs` and report the result.
