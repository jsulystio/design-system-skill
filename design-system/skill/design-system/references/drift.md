# Drift: the model, and how to audit it

Trigger: "show me the drift", "audit the design system", "where are code and
design out of sync", or any request to survey (not yet fix) divergence. To act
on a report and fix issues, see `references/resolve-drift.md`.

## The model

The design system is the source of truth: Figma variables → tokens + component
catalog → the generated `DESIGN-SYSTEM.md`. Two consumers hang off that hub —
**Design** (Figma screens) and **Code** (the app source). Drift is any
divergence from the hub, or internal incoherence within a consumer. It splits
into four lanes on two axes:

| Lane | Axis | What it means | Detection |
|---|---|---|---|
| **Design alignment** | Design → System | Screens use raw values not bound to a variable, instances of components not in the catalog, or off-spec overrides on a known component. | `lint.mjs` (values, uninventoried components) + agent (overrides) |
| **Design consistency** | Design ↔ Design | The same semantic thing is drawn two ways — one ad-hoc value repeated across screens, or one component overridden inconsistently. | `lint.mjs` (repeated raw values) + agent (overrides) |
| **Code alignment** | Code → System | Source hardcodes colors/radii/spacing, hand-rolls a component the catalog already defines, or drifts a code-connected component's props from its spec. | `lint.mjs --code` (values) + agent (components) |
| **Code consistency** | Code ↔ Code | One role is built two ways — the same button styled differently in two places, or two near-duplicate implementations. | agent |

Two verbs: **alignment** = matches the source of truth; **consistency** =
internally coherent. `lint.mjs` does the mechanical detection; this flow adds the
judgment the script can't: is this the *same* role? a legitimate new decision or
an accident? a reimplementation of a catalog component?

**Fixes always flow one direction — toward the hub.** A raw value resolves to a
Figma variable; a missing component resolves to a catalog entry; a code
reimplementation resolves to importing the catalog component. Never resolve
drift by hardcoding a value into code, and never by editing a generated file.

## Audit flow

**First, confirm you have the inputs the linter needs, and ask for whatever is
missing — do not run against a placeholder or an empty scope:**

- **Design lanes** need the Figma file. Check `figma.config.json` for a real
  `fileKey`; if it is still `REPLACE_WITH_FIGMA_FILE_KEY` (or absent), ask the
  person for the **Figma file link** and derive the key from
  `figma.com/design/:fileKey/…`.
- **Code lanes** need the source location. Check `lint.codePaths` in
  `figma.config.json` and any `--code` dir; if none resolve to a real path, ask
  the person for the **code folder path or repository** to scan.

Ask for both in one prompt when both are missing, run the linter only against
the scopes you have, and say in the report which lanes you skipped for lack of
an input.

0. If the request concerns design lanes, refresh the screen snapshot first:
   follow `references/read-figma.md` step 2 and rewrite `inventory/screens.json`
   so the report reflects today's file, not a stale export.

1. Run the linter's report mode for the mechanical lanes:
   `node design-system/scripts/lint.mjs --report`
   (add `--code src` — or rely on `lint.codePaths` in `figma.config.json` — to
   include the code lanes). It prints one JSON object with a `lanes` map and
   `counts`. Read it; do not re-derive what it already found.

2. Add the agent-adjudicated findings the script flags but cannot judge:
   - **Design alignment/consistency (overrides):** for components used on
     multiple screens, read the instances (Figma MCP / bridge) and compare their
     overrides against the variant spec in `inventory/components.json`. Flag
     instances that override a token the variant already fixes, or that use a
     different token than sibling instances for the same role.
   - **Code alignment (components):** for each catalog component, check whether
     the code imports it from its `codePath` or hand-rolls an equivalent. Flag
     elements that reimplement a catalog component's API, and code-connected
     components whose props have drifted from the inventory spec.
   - **Code consistency:** group elements that play the same role (all primary
     buttons, all cards) and flag ones built with different tokens or structure.
     Keep this evidence-based — cite the files; do not guess.

3. Present one report grouped by the four lanes, each finding with its location,
   what it drifts from, and the one-directional fix. Order lanes by error count.
   State coverage honestly: which lanes were mechanical, which you audited by
   reading, and anything you did not cover (e.g. code lanes when no `codePaths`).

4. Write the findings you added in step 2 (the ones the linter cannot produce)
   to `design-system/inventory/audit.json`, so the "Staying in sync" page can
   show their counts (including a number under "Code vs. itself"). Shape:

   ```json
   {
     "date": "YYYY-MM-DD",
     "findings": [
       { "lane": "code-consistency", "severity": "error", "where": "src/ui/Cta.tsx", "message": "reimplements Button with a different radius", "fix": "import { Button } from the catalog" }
     ]
   }
   ```

   Lane ids: `design-alignment | design-consistency | code-alignment |
   code-consistency`; `severity` is `error` or `warn`. Write **only** the
   agent-adjudicated findings, never the raw values/components the linter already
   reports, or the page would double-count. Then rebuild
   (`node design-system/scripts/build.mjs`). This file is a snapshot of the last
   audit and can go stale, so re-audit (or trim it) after fixes.

5. Do not fix anything in this flow — auditing and resolving are separate so the
   person can triage. If they say "resolve it", switch to
   `references/resolve-drift.md`.
