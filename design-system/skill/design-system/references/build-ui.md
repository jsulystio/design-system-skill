# Build UI with the system

Trigger: someone asks to build, restyle, or extend UI in a project that has the
`design-system/` toolkit — "build the settings page", "add a pricing card",
"implement this Figma screen". This is the developer-facing flow: the design
system is the contract, and the deliverable is code that passes the code lint.

1. **Load the contract.** Read `design-system/DESIGN-SYSTEM.md`. If it is
   missing or stale (older than `tokens/figma.raw.json` or
   `inventory/components.json`), run `node design-system/scripts/build.mjs`
   first. Do not build UI from memory of what the system "probably" looks like.

2. **Map the request to the catalog.** List which needed pieces are:
   - **code-connected components** → import from the listed `codePath`; never
     re-implement them.
   - **inventoried but not built** (`codeConnected: false` or `planned`) →
     scaffold them from the spec in DESIGN-SYSTEM.md (props, states, anatomy,
     tokens used). Follow the spec's API — do not invent different prop names.
     After building one, update its entry in
     `design-system/inventory/components.json` (`codeConnected: true`,
     `codePath`, real `usage` snippets) and rebuild so the docs and
     DESIGN-SYSTEM.md advertise the new component.
   - **not in the catalog at all** → say so before building. Compose it from
     existing components and tokens if possible; otherwise treat it as a new
     component: propose an inventory entry first (see
     `references/bootstrap.md` "Inventory fields"), then build against it.

3. **If the request points at a Figma screen**, read the node via
   `references/read-figma.md` (screenshot + design context) and translate every
   value through the token table — the Figma fill `#335cff` becomes
   `var(--color-primary-base)` / `bg-primary-base`, never the hex. If the screen
   uses a value that maps to no token, flag it as drift instead of hardcoding
   (that is a `resolve-drift` case).

4. **Write the code by the rules** in DESIGN-SYSTEM.md's "How to use this
   file": semantic tokens only (primitives never appear in component code),
   spacing on the 4px grid tokens, `type/*` styles for text, state colors by
   intent. Dark mode comes free from the variables — no hand-written dark
   values.

5. **Verify.** Run `node design-system/scripts/lint.mjs --code <dir-you-touched>`
   and fix every finding (or justify an explicit `design-system-ignore`
   comment). Report the lint result with the delivered code.

Structural changes to *existing* code-connected components (new prop, layout
logic) remain engineer work — propose, don't silently change a shared API.
