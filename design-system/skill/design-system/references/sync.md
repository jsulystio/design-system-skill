# Sync: reconcile Figma and the local system in either direction

Trigger: "push my token edits to Figma", "sync the spec changes back to Figma",
"the code and Figma have drifted, reconcile them", "sync the design system both
ways".

Figma is the *default* source of truth, but the local system (tokens + inventory)
can also be the thing that changed. This flow moves an approved change in whichever
direction it needs to go. It never writes silently: you always see a diff first,
and a per-area owner decides the default direction so only real conflicts stop you.

This is a WRITE flow when it pushes to Figma. Load the `figma-use` skill first;
Figma writes go through the official MCP's `use_figma` (Plugin API). See
`references/read-figma.md` §0 for the read/write back ends and fallback.

## The three directions

- **from figma** (the everyday read): `pull` + `read-figma` + `build`. Figma wins,
  code and docs re-derive. This is the normal loop; nothing new here.
- **to figma** (push): the local tokens/inventory changed and Figma has not.
  Diff local against the live file, show what would change *in Figma*, and on
  approval write it with `use_figma`. `propagate-change` (a token value) and the
  variable/component writes in `refresh from approved` are specific cases of this.
- **reconcile** (both moved): read both sides, show a two-column diff, decide a
  winner per change, then apply each change to whichever side is stale.

## Ownership (who wins when both moved)

Read `sync.ownership` from `figma.config.json`. It maps an area to the side that
wins by default:

```json
"sync": {
  "ownership": {
    "variables": "figma",         // token values: designers own them
    "componentSpecs": "code",     // the redline in components.json
    "componentVisuals": "figma"   // component fills/variants on the canvas
  }
}
```

The owner is only the **default** for an area. Any change where both sides moved
the *same* value to *different* results is a genuine conflict: list it and ask,
do not auto-resolve it by ownership alone.

## Steps

1. **Read both sides.** Follow `references/read-figma.md` for the live Figma
   (variables, component definitions on the Foundations and Components pages).
   The local side is `tokens/figma.raw.json` and `inventory/components.json`.

2. **Diff.** Compare per area:
   - **variables**: local `figma.raw.json` values vs the live variable values.
   - **componentSpecs**: each component's `spec` in `components.json` vs the same
     component's resolved styling in Figma (radius token, fills, bound text style,
     spacing).
   Mark each difference with which side changed (compare against the last synced
   state in git if you need to tell "changed" from "was always different").

3. **Classify each difference** using `sync.ownership`:
   - only one side moved → push it to the other side (direction = the side that moved).
   - both moved to the same value → already in sync, skip.
   - both moved to different values → **conflict**: collect for step 4.

4. **Present the plan for approval** (SKILL.md keep-it-reviewable rule): a short
   list of what will change on each side, and every conflict with both values and
   your recommended winner. Get a yes. Do not write anything yet.

5. **Apply.**
   - **to Figma**: write variables with `use_figma`
     (`variable.setValueForMode`) and component styling with
     `figma_set_fills` / `figma_set_strokes` / `setBoundVariableForPaint`. Stay in
     scope: color, style, variants only. New props or new layout logic go to an
     engineer. When binding a paint to a variable, bake the variable's **resolved**
     color into the paint too, or some render paths show a black placeholder (see
     `propagate-change.md` and the `figma-use` skill).
   - **to the local side**: edit `figma.raw.json` (variables) or the component's
     `spec` in `components.json`, then run `build.mjs` + `lint.mjs`.

6. **Re-derive and verify.** After any local change, `node design-system/scripts/build.mjs`
   then `node design-system/scripts/lint.mjs`. After a Figma write, re-pull so the
   local side matches what you just wrote, and confirm the diff is now empty.

## Rules

- Diff first, approve, then write. Never push a side silently, in either direction.
- Ownership sets the default direction, not a license to overwrite. Real conflicts
  (both sides moved the same value differently) always stop for a human.
- One area at a time is fine. You do not have to reconcile everything at once; sync
  just variables, or just one component's spec, if that is all that moved.
- After a push to Figma, Figma holds the change and the local side re-derives from
  it on the next `from figma`. Do not keep hand-editing both.
