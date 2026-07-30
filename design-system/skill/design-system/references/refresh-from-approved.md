# Refresh from approved screens

Trigger: "the client approved this direction, refresh the design system", "rebuild
the system from the approved screens", "reconcile the approved UI into the system".

The real 0-1 flow this serves:

1. The project was bootstrapped from the starter template (see `references/new-project.md`),
   so a full system already exists.
2. The designer explored several UI directions as raw screens, with no components
   attached, to get client sign-off.
3. The client approved one direction.
4. Now: **learn the design language** the approved screens imply — their
   sharpness (radius), how color is used, spacing rhythm, typography, and other
   patterns — and apply that language to the **whole** bootstrapped system, not
   only the components that happen to appear on the screens. The screens are a
   small sample; the deliverable is a consistent library. Repoint the palette,
   snap radii and spacing to the scale, move type onto the brand font and text
   styles, add or update components, and write the result back to Figma, code,
   and docs. Color is only the first dimension; a refresh that touches only color,
   or only the drawn components, leaves the rest of the library off-brand.

This is a deliberate, approved WRITE flow. Like `propagate-change`, it writes to
Figma only after the person approves the exact edits. Once written, Figma is
again the single source of truth and everything else re-derives from it.

## Steps

0. Confirm the project was bootstrapped from the starter template, and ask which frames or page
   are the approved direction. Only read those frames; ignore the rejected
   explorations.

1. Read the approved frames (`references/read-figma.md`) on **every dimension**,
   not just color. Per node capture: fills/strokes (and whether each is bound),
   **corner radius**, **padding and gap (spacing)**, and **typography** (font
   family, size, weight, and any bound text style), plus component instances.
   These all come from `get_design_context` / `figma_get_file_data` —
   `get_metadata` carries none of them. Write fills/spacing to
   `inventory/screens.json` scoped to the approved frames, and keep the radius and
   typography observations for step 3.

2. Extract the palette and style, mechanically (no model):

   ```bash
   node design-system/scripts/extract.mjs --write
   ```

   It clusters the colors actually used (bound or raw) by perceptual distance,
   ranks them by usage, guesses a semantic role for each, and for every cluster
   either suggests a `snapTo` token (it is already one of your tokens) or marks it
   `new`. It does the same for spacing and radii. Output: `import/approved.palette.json`.

   `extract.mjs` does **not** cluster typography — read the fonts, sizes, weights,
   and bound text styles directly from the approved frames (step 1) and reconcile
   them by judgment in step 3.

3. Learn the design language, then apply it — do not just copy the sample. The
   approved screens are a small sample and will not contain every component; the
   job is to infer the *rules* they imply and propagate those rules to the whole
   library.

   3a. **Derive a style profile** — write down the rules, not a list of pixels,
   because rules are what generalize to components the screens never show:
   - **Sharpness (radius).** The dominant corner radius and how it scales by size
     — e.g. "controls are `radius/4`, pills/avatars are full, cards `radius/8`".
     State the rule, not just the one value you saw.
   - **Color usage.** Not just which colors, but *how*: which role carries the
     accent (primary actions) vs neutral (secondary/quiet), fill vs stroke vs
     tint, on which surfaces, and the contrast pairs (accent background → which
     text/icon color).
   - **Spacing rhythm / density.** The padding and gap steps that recur and how
     tight or airy the layout reads — the rule a component you did not see should
     follow.
   - **Typography.** Font, the weight per role (labels vs body vs headings), case
     (are buttons uppercase?), and the size ramp.
   - **Other patterns.** Elevation (shadow vs flat), border weight and where
     borders appear, divider use, icon style/size, control height/density.

   3b. **Apply the profile across every dimension AND every component — not only
   the ones on the screens.** For each dimension below: detect what the screens
   use → decide snap-to-existing vs new token/style → apply the rule to the
   **whole catalog**. A component the client never drew (Table, Tooltip, Date
   Picker) still gets the profile's radius, type, spacing, and color — infer its
   treatment from the closest sampled sibling and its catalog role, and flag any
   you had to guess so the person can confirm. Prefer snapping; add a token or
   style only for a genuine new decision, never to preserve a one-off.

   - **Color.** Map the clusters onto the template slots (a `propagate-change`
     plan, see `references/propagate-change.md`): the `new` accent with the
     highest usage → brand **primary** (repoint `color/primary/base|dark|darker`
     and the `color/alpha/primary-*` primitives — and update the alpha primitives
     too, they are a common miss when the primary hue changes); neutral cluster →
     keep or swap `bg/text/icon/stroke` between `gray` and `slate`; `reuse`
     colors need no change.
   - **Border radius.** For each control the design draws (button, input, card,
     tag…), read the radius it actually uses and compare it to the token and the
     component's bound radius. When the design consistently uses a different step
     than the template — e.g. inputs at `radius/4` where the template component
     is `radius/10` — repoint that component's radius to the matching `radius/*`
     token across **every variant**, not just the default. Add a `radius/*` value
     only when the design's radius is genuinely off the scale.
   - **Spacing.** Same for padding and item-gap: snap the recurring values to the
     `space/*` 4px scale and rebind them; add a step only for a real new value.
   - **Typography.** Detect the font family, sizes, and weights the approved
     screens use, and the text styles they reference. If the brand font differs
     from the template's (e.g. Rethink Sans vs the template's Inter/Zalando),
     first update the file's **text styles** to the brand font, then bind every
     component text node to the matching text/type style
     (`body/<size> - <weight>`, `heading/*`) rather than leaving raw font
     settings. Swap any foreign fonts to the brand font weight-for-weight, and
     remap deprecated or remote (imported-library) text styles to the local ones
     by size + weight. Leave genuinely custom sizes unstyled rather than snapping
     them and shifting the layout.

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
     `/dark`, `/darker`, `color/alpha/primary-*`). Because the template components
     reference those semantic tokens across all states, repointing the ramp
     re-skins hover / pressed / focus / disabled automatically — you are just
     making sure the whole ramp (not only `base`) is derived and set.
   - Present the proposed state matrix per component for approval.

5. Present the full plan for approval as a short list: the variable repoints, the
   inventory delta, and the Figma component writes from step 6. Do not apply
   anything yet.

6. On approval, apply in this order:
   a. **Variables → Figma.** Write the repoints with the official MCP's
      `use_figma` (load the `figma-use` skill first) or the bridge's
      `figma_update_variable` / `figma_batch_update_variables`, so the approved
      palette lives in the source of truth (see `references/read-figma.md` §0 —
      either back end can write).
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
      - **Every existing catalog component — not only the ones the screens
        drew.** Walk `inventory/components.json` and apply the step 3 profile to
        each, on every dimension across all its states: rebind fills/strokes to
        the repointed color variables, bind its corner radius to the new
        `radius/*` token, attach its text to the brand text styles, and snap its
        padding/gap to `space/*`. Components the approved screens never showed
        (Table, Tooltip, Date Picker, …) get the profile inferred from their
        catalog role and closest sampled sibling — do not skip them. If a
        component is bound to a remote/imported library's variables or text styles
        rather than the local tokens, use the name-matched rebind in
        `references/reconcile-library.md`.
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
- Snap before you add: reuse an existing token or text style whenever the
  approved design is within tolerance of one, so the palette and type ramp do not
  sprawl.
- Cover all four dimensions — color, border radius, spacing, and typography. Do
  not report the refresh done after repointing only the palette; confirm the
  approved screens' radii, spacing, and fonts are reflected in the components and
  tokens too, or state explicitly which dimensions you left unchanged and why.
- Generalize from the sample; the screens are not the library. Derive the style
  profile (step 3a) and apply it to **every** component in the catalog, including
  ones the approved screens never show. When the profile does not clearly dictate
  an unseen component's treatment, follow its closest sampled sibling and flag the
  assumption rather than leaving it on the old template styling.
