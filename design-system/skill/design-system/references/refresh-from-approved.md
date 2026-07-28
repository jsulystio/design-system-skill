# Refresh from approved screens

Trigger: "the client approved this direction, refresh the design system", "rebuild
the system from the approved screens", "reconcile the approved UI into the system".

The real 0-1 flow this serves:

1. The project was bootstrapped from the AlignUI template (see `references/new-project.md`),
   so a full system already exists.
2. The designer explored several UI directions as raw screens, with no components
   attached, to get client sign-off.
3. The client approved one direction.
4. Now: detect the colors, styles, and components in the approved screens and
   reconcile them into the bootstrapped system — repoint the palette, add or
   update components, and write the result back to Figma, code, and docs.

This is a deliberate, approved WRITE flow. Like `propagate-change`, it writes to
Figma only after the person approves the exact edits. Once written, Figma is
again the single source of truth and everything else re-derives from it.

## Steps

0. Confirm the project was bootstrapped from AlignUI, and ask which frames or page
   are the approved direction. Only read those frames; ignore the rejected
   explorations.

1. Read the approved frames (`references/read-figma.md`): fills, text styles,
   strokes, radii, spacing, and component instances. Write them to
   `inventory/screens.json` scoped to the approved frames.

2. Extract the palette and style, mechanically (no model):

   ```bash
   node design-system/scripts/extract.mjs --write
   ```

   It clusters the colors actually used (bound or raw) by perceptual distance,
   ranks them by usage, guesses a semantic role for each, and for every cluster
   either suggests a `snapTo` token (it is already one of your tokens) or marks it
   `new`. It does the same for spacing and radii. Output: `import/approved.palette.json`.

3. Map the palette onto the AlignUI slots, as a `propagate-change` plan (see
   `references/propagate-change.md`). Typical decisions:
   - `new` accent with the highest usage → the brand **primary**: repoint
     `color/primary/base|dark|darker` (and the `color/alpha/primary-*` primitives).
   - neutral cluster → keep or swap the `bg/text/icon/stroke` family between `gray`
     and `slate`.
   - `reuse` colors → already correct; no change.
   - off-scale radius/spacing that recurs → add a token, or snap to the nearest step.
   Only add a token when it is a genuine new decision; prefer snapping.

4. Detect the components in the approved screens (reuse the `references/bootstrap.md`
   clustering). Match each against the template catalog by name first, so you keep
   the template's props and naming. Produce an inventory delta: components to add,
   and existing components whose tokens changed under the new palette.

   4a. **Expand every component to its full state matrix — do not stop at the one
   state the designer drew.** An approved screen usually shows only the resting
   state (one pink button); the system needs all of them.
   - For a component that matches the catalog, inherit its state model from the
     catalog entry (`inventory/components.json` `states` / `props` and the variant
     axes). A Button, for example, carries default, hover, focus, active/pressed,
     and disabled; other components add role-specific states (loading, selected,
     error, checked).
   - For a genuinely new component, propose the standard states for its interaction
     role (interactive controls: default, hover, focus, pressed, disabled).
   - Give every state a token, derived from the approved base. `extract.mjs`
     already emits a `states` ramp per accent color (base, hover, pressed,
     focusRing, disabled); map those onto the semantic ramp (`color/primary/base`,
     `/dark`, `/darker`, `color/alpha/primary-*`). Because the AlignUI components
     reference those semantic tokens across all states, repointing the ramp
     re-skins hover / pressed / focus / disabled automatically — you are just
     making sure the whole ramp (not only `base`) is derived and set.
   - Present the proposed state matrix per component for approval.

5. Present the full plan for approval as a short list: the variable repoints, the
   inventory delta, and the Figma component writes from step 6. Do not apply
   anything yet.

6. On approval, apply in this order:
   a. **Variables → Figma.** Write the repoints with the bridge
      (`figma_update_variable` / `figma_batch_update_variables`), so the approved
      palette lives in the source of truth.
   b. **Components → Figma.** Build or update the approved direction's components in
      the file, bound to the new variables — this is the part that used to be
      manual:
      - New component: create the variant set with `figma_create_component_set`,
        passing the **full axes from step 4a including State**
        (e.g. `{ Type: [...], Size: [...], State: ['default','hover','focus','pressed','disabled'] }`),
        so every state is materialized, not just the default. Bind each part's
        color to the right variable with `figma_set_fills` / `figma_set_strokes`
        using `variableId` (not a raw hex) — the disabled and hover variants point
        at the derived ramp tokens — then `figma_arrange_component_set` to lay it out.
      - Existing component whose palette moved: rebind its fills/strokes to the
        repointed variables so it follows the new brand across all its states.
      - Instances on the approved screens: swap the raw frames for the real
        component with `figma_set_instance_properties` where it helps.
      - Use `figma_execute` (or the official `use_figma`, after loading the
        `/figma-use` skill) for anything the typed tools do not cover.
      - Out of scope: new props or new layout logic. Flag those for an engineer;
        this flow handles color, style, and variants only.
   c. **Inventory + code.** Update `inventory/components.json` (and add Code Connect
      stubs for anything now built in code). Re-scan the approved screens into
      `inventory/screens.json`.

7. Rebuild and verify: `node design-system/scripts/build.mjs` then
   `node design-system/scripts/lint.mjs`. The docs, `DESIGN-SYSTEM.md`, and the code
   theme now reflect the approved direction, and the linter should be clean because
   the raw values became tokens and the components are inventoried.

## Rules

- Approval gate: never write variables or components to Figma without showing the
  exact plan first and getting a yes.
- One direction still holds: this flow writes the approved state INTO Figma once,
  then normal sync (Figma → tokens → code + docs) resumes. Do not keep editing code
  or docs by hand afterwards.
- Snap before you add: reuse an existing token whenever `extract.mjs` found one
  within tolerance, so the palette does not sprawl.
