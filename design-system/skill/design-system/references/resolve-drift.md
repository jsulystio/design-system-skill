# Resolve drift: act on the report

Trigger: `node design-system/scripts/lint.mjs` reported issues, or the person
says "resolve the drift". To *survey* drift first (including the lanes the
script can't detect), run the audit flow in `references/drift.md`; that flow
defines the four lanes and the one rule that governs every fix:

**Fixes flow one direction — toward the source of truth.** Never resolve a raw
value by hardcoding it into code, and never edit a generated file. The fix lands
as a Figma variable or a catalog entry, and the build re-derives code and docs.

Before running anything, confirm you have the linter's inputs and ask for what
is missing: the **Figma file link** (for design lanes — needed unless
`figma.config.json` already has a real `fileKey`) and the **code folder path or
repository** (for code lanes — needed unless `lint.codePaths` or a `--code` dir
resolves). Ask for both together when both are missing; lint only the scopes you
have.

0. Refresh the screen snapshot first. Follow `references/read-figma.md` step 2
   (read screens, scan component instances and raw values) and rewrite
   `inventory/screens.json` from the current file so the report reflects today's
   designs, not a stale export.

1. Run `node design-system/scripts/lint.mjs` (add `--code src` for code lanes,
   or `--report` for the full JSON) and read each finding with its lane.

2. Resolve by lane:
   - **Design / Code alignment — raw value:** decide whether it should snap to
     an existing token (close match) or become a new token. Snapping is
     preferred; only add a token when the value is a genuine new design decision.
     Propose which, with the token name.
   - **Design / Code alignment — component:** if a component is used but not in
     the catalog, propose an inventory entry (name, props, states, tokens) and,
     if code exists, a Code Connect mapping (else `codeConnected: false`). If code
     hand-rolls a catalog component, replace it with the catalog import rather
     than reconciling the copy.
   - **Design / Code consistency:** pick the one value or implementation the
     system should standardize on, then snap every outlier to it — one token
     bound everywhere, or one shared component. Do not fix each site to a
     different value; that just relabels the drift.

3. Present the proposed fixes as a short list. On approval, apply variable edits
   in Figma (MCP or bridge) and update `inventory/components.json`. Re-scan
   screens into `inventory/screens.json` if bindings changed. For code-lane
   fixes, edit the source to use the token / catalog component (then the code
   linter passes) — the Figma file is unchanged because code alignment is the
   code catching up to the system, not a new design decision.

4. Run `node design-system/scripts/build.mjs` then
   `node design-system/scripts/lint.mjs` to confirm clean.

5. If you resolved any agent-found findings recorded in
   `design-system/inventory/audit.json` (overrides, reimplementations,
   code↔code consistency), remove those entries from it (or re-run the audit)
   and rebuild, so the "Staying in sync" page stops counting fixed drift.
