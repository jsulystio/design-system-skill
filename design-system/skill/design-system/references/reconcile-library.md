# Reconcile an inherited component library to the local tokens

Trigger: a project bootstrapped from a template/library (e.g. AlignUI) has
components that render off-brand — the wrong accent (a magenta or other theme),
the old palette, a foreign font, or the wrong radius — even though the local
tokens are correct. "Update the components to match the design", "the buttons
don't use our colors/font", "fix the components in the design system".

The usual root cause: the component **definitions** are still bound to the
original **published library's** variables and text styles (magenta-themed,
Inter/Zalando fonts, AlignUI radii), while the local file has the right local
tokens — and the *placed instances* on the real screens were re-pointed to the
local ones. So the live design can look right while the component library looks
wrong. Confirm this before assuming a value is wrong: a bound variable id that
contains a `/` (a library key, e.g. `VariableID:<hash>/351:26`) is **remote**; a
local id looks like `VariableID:6210:5149`.

This is a WRITE flow. It writes to Figma only after the person approves the plan.
Load the `figma-use` skill first — all writes here go through the official MCP's
`use_figma` (Plugin API); see `references/read-figma.md` §0 for the write path.

## Steps

1. **Read the target.** Follow `references/read-figma.md`. Get the local
   variable collections (`getLocalVariablesAsync`) and local text styles
   (`getLocalTextStylesAsync`) — these are your rebind targets. Get the list of
   component sets to reconcile (scan the design for the ones actually used, per
   `references/read-figma.md` step 2 — do not reconcile all 600-variant sets the
   design never touches).

2. **Diagnose, per component set.** Walk each set (manual `.children` recursion —
   `findAll` does **not** descend into instance sublayers). Count, on
   fills/strokes/text:
   - **remote color bindings** (bound var id contains `/`),
   - **remote / deprecated text styles** (`textStyleId` not in the local style
     set — resolve its name to confirm it is the old library style),
   - **value drift** where the component's bound value differs from what the
     design actually uses (e.g. component radius `10` but every instance is `4`).
   Report the counts before writing.

3. **Present the plan** (SKILL.md keep-it-reviewable rule): which sets, how many
   bindings/styles each, the remote→local name map, and any names with **no
   local equivalent** (see step 6). Get a yes.

4. **Rebind colors remote → local by name.** For each remote-bound fill/stroke,
   resolve the remote variable's name, find the local variable of the **same
   name**, and rebind. Name-match fallbacks seen in practice: strip a leading
   `neutral/`, or try a `color/` prefix. **Bake the resolved color into the
   paint** when you rebind — `setBoundVariableForPaint` leaves the base `color`
   untouched and some render paths show it, so a `{0,0,0}` placeholder renders
   black-on-black. Compute `variable.resolveForConsumer(node).value` and use that
   as the paint color.

5. **Reattach text to local type styles.** Read each text node's size + weight
   and bind the matching local text style (`body/<size> - <weight>`, or a heading
   style for large/semibold titles) via `setTextStyleIdAsync`. This replaces a
   deprecated remote style **and** switches the font to the brand font in one
   step. Text styles do not carry `textCase`, so uppercase/lowercase is
   preserved — but setting `textCase` afterwards requires the font loaded
   (`loadFontAsync` first) or it throws. Leave custom-size text (e.g. 15/17px)
   unbound rather than snapping it and shifting the layout; report how many you
   skipped.

6. **Do not invent tokens for unmapped names.** Extended-palette colors and
   states the local set does not define (e.g. `yellow`, `sky`, `purple`, `gray`
   scales; `state/away | verified | information`; a second accent theme) will not
   map. If the design does not use them, **leave them on the remote library** and
   list them — do not fabricate local tokens or force a wrong mapping. Only add a
   local token when it is a genuine, design-used decision (that is a
   `propagate-change`).

7. **Instances carry their own overrides.** Reconciling a component set does not
   fix instances that were individually overridden to a remote variable (common
   on modal/CTA buttons). Run the same rebind over the frames that host those
   instances when the person points at a screen or overlay.

8. **Rebuild caveat.** These writes change Figma **components**, not the local
   `tokens`/`inventory`, so `build.mjs` will **not** re-derive them into the docs
   (see SKILL.md). If token *values* did not move, the docs are unchanged and
   correct for tokens but stale for the component visuals — say so. Re-scan
   screens into `inventory/screens.json` and run `lint.mjs` to confirm the design
   lanes are clean.

## Out of scope

Restructuring a component's variant axes (adding a new Type/Style option, new
props, new layout) is a structural change — allowed for **color, style, and
variants** per SKILL.md, but new props/layout go to an engineer. When you do
change variant axes (e.g. replacing an unused `Error` type with a `Blue` type),
keep the set's grid arrangement: mirror the template's per-variant x/y positions
(read them from the source library file) instead of a naive grid, and re-space
columns from actual variant widths so wide labels do not overlap icon-only
variants.
