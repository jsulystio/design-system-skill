# New project from the template

Trigger: a new client project needs a design system — "set up the design
system for this project", "start from our template". The toolkit ships with
template tokens and a component catalog that mirror the **AlignUI 2.0** design
system file the team copies for every client, so a project starts complete and
then diverges deliberately.

1. **Scaffold** if `design-system/` is missing:

   ```bash
   npx degit jsulystio/design-system-skill/design-system design-system
   node design-system/install.mjs --scripts --agents
   ```

   The bundled `tokens/figma.raw.json` and `inventory/components.json` *are*
   the template (AlignUI structure: gray+slate neutrals, 9 accent hues,
   semantic bg/text/icon/stroke/state/primary tokens, ~50 fully documented
   components with visuals). Nothing needs pulling to get a working system —
   build immediately:

   ```bash
   node design-system/scripts/build.mjs
   ```

2. **Point at the client's Figma file.** The designer duplicates the AlignUI
   template file for the client. Put its file key in
   `design-system/figma.config.json` and set `meta.name` in
   `tokens/figma.raw.json` to the project name (or let the first pull do it).

3. **Rebrand.** Most client projects only change the primary color (and
   sometimes the neutral: gray ↔ slate, radius taste, font). Treat this as a
   `propagate change` (see `references/propagate-change.md`):
   - Primary: repoint `color/primary/base|dark|darker` to the chosen hue scale
     (or add a new scale under primitives if the brand color isn't close to
     one), and update the three `color/alpha/primary-*` primitives to match.
   - Neutral: repoint the `bg/text/icon/stroke` semantics from `gray` to
     `slate` (or vice versa).
   - Apply the same edits to the client's Figma variables so Figma stays the
     source of truth — code-side edits alone will be overwritten by the next
     pull.

4. **Trim the catalog.** Delete entries from
   `inventory/component-templates.json` the project will never need (they read
   as roadmap in the docs). Keep it honest.

5. **Build + verify:** `node design-system/scripts/build.mjs && node
   design-system/scripts/lint.mjs`. Hand the team two things: the docs site
   and `design-system/DESIGN-SYSTEM.md` — the file any developer can feed to a
   coding agent to build consistent UI (see `references/build-ui.md`).

Once the designer starts changing variables in the client file, routine syncs
are the normal loop: pull → build → lint. The template only matters on day
one.
