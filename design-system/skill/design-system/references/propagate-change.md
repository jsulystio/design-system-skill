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
4. On approval, apply the variable edits in Figma through the bridge (this is
   the one write-to-canvas case). Do not edit code theme files directly, they
   are generated.
5. Run `node scripts/build.mjs` then `node scripts/lint.mjs`. Confirm every
   screen, doc, and the code theme reflect the change from the single edit.
