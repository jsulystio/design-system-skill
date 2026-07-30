# Propagate change: a request into token edits

Trigger: a design change, e.g. "make primary warmer and buttons less rounded",
often from stakeholder feedback or a UAT finding.

1. Restate the change as concrete token edits. Example: "primary warmer" ->
   shift `color/indigo/600` hue, or repoint `color/accent/default`. "Buttons
   less rounded" -> `radius/md` from 8 to 4. Name the exact variables and old ->
   new values.
2. Check scope. Token, color, spacing, and variant changes are in scope.
   Structural changes (a new prop, new layout) are not, so split those out and
   flag them for an engineer.
3. Present the edit list for approval. Note the blast radius, e.g. "radius/md is
   used by Button, Input, Card, so all three change".
4. On approval, apply the variable edits in Figma. Prefer the official MCP's
   `use_figma` (load the `figma-use` skill first) — it writes via the Plugin API
   (`variable.setValueForMode`, `setBoundVariableForPaint`, etc.) and works
   whenever reads do. The bridge's `figma_update_variable` /
   `figma_batch_update_variables` is an equivalent alternative; if you use it and
   it is down, recover it first (`figma_get_status` → `figma_reconnect` →
   `figma_diagnose`, per `references/read-figma.md` §0). Do not edit code theme
   files directly, they are generated.

   > When binding a paint to a variable via `use_figma`, set the paint's base
   > `color` to the variable's **resolved** value, not a `{0,0,0}` placeholder —
   > `setBoundVariableForPaint` leaves the base color as-is and some render paths
   > show it, producing black-on-black. The `figma-use` skill covers this and the
   > other Plugin-API gotchas.
5. Re-scan screens per `references/read-figma.md` step 2 into
   `inventory/screens.json`, then run `node design-system/scripts/build.mjs`
   and `node design-system/scripts/lint.mjs`. Confirm every screen, doc, and the
   code theme reflect the change from the single edit.
