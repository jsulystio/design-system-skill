# Read Figma: variables, screens, and component usage

Use this on every flow that touches the working file (bootstrap, resolve drift,
propagate change). The goal is a complete picture: what variables exist, what
screens use, and which components appear on those screens.

Get `fileKey` from `design-system/figma.config.json` or from the person's Figma
URL (`figma.com/design/:fileKey/...`). Convert URL node ids (`1-2`) to MCP form
(`1:2`).

## 1. Read variables

Write `design-system/tokens/figma.raw.json` in the shape of the bundled sample
(collections, modes, aliases with `{collection.dot.path}` references).

Preferred order:

1. **Figma MCP** — call `get_variable_defs` on the file root (`nodeId: "0:1"`)
   or on each collection's scope node if the file is organized that way. Map the
   response into the `figma.raw.json` collection/variable structure.
2. **Desktop Bridge or console bridge** — when MCP is unavailable or returns
   incomplete collections. Same output shape.
3. **Import plugin** — person exports JSON to `design-system/import/` and runs
   `node design-system/scripts/pull.mjs`. Use only when neither MCP nor bridge
   works.
4. **REST Variables API** — Enterprise only via `pull.mode: "rest"`. A 403 means
   fall back to MCP or bridge; do not give up on variables.

## 2. Read screens and scan component usage

The linter (`lint.mjs`) compares real screen usage against tokens and the
component inventory. Produce `design-system/inventory/screens.json` from the
live file — do not rely on `screens.sample.json` after bootstrap.

### Discover screens

1. Call `get_metadata` with `fileKey` and `nodeId: "0:1"` to list pages and
   their top-level frames.
2. Treat each top-level frame on a page as a **screen** (name = frame name).
   Skip internal component-definition pages unless the person asks to include
   them. Typical product screens live on pages like "Flows", "Screens", or
   named after features.

### Walk each screen

For every screen frame:

1. Call `get_metadata` on the screen's `nodeId` to get the subtree as XML.
2. For each node in the tree, record:
   - **Component instances** — nodes typed `instance` (or whose metadata marks
     them as component instances). Set `component` to the main component name
     (strip variant suffixes like `Button/Primary` → `Button` when grouping).
   - **Fills** — solid fill hex values. Set `bound: true` when the fill uses a
     variable binding; `bound: false` for raw hex. One entry per notable fill
     (backgrounds, text, borders — skip invisible or duplicate layers).
   - **Spacing** — gap, padding, or item-spacing values that matter for drift.
     Set `bound: true` when tied to a variable; `bound: false` for raw numbers.

Use `get_design_context` on individual nodes only when metadata is ambiguous
(e.g. cannot tell if a fill is bound). Prefer metadata for bulk scanning — it
is lighter.

### Write `inventory/screens.json`

Match the schema in `inventory/screens.sample.json`:

```json
{
  "nodes": [
    {
      "screen": "Onboarding",
      "name": "Continue button",
      "component": "Button",
      "fills": [{ "hex": "#4A43C9", "bound": true }],
      "spacing": [{ "value": 12, "bound": true }]
    }
  ]
}
```

- `screen` — parent frame name.
- `name` — layer name or a short human label for the node.
- `component` — include only on component instances.
- `fills` / `spacing` — omit keys when not applicable.

Aim for coverage of every component instance and every unbound color/spacing
value the linter should catch. Perfect per-layer exhaustiveness is not required;
missing a raw value means drift slips through.

## 3. Read component definitions (for inventory)

Separate from **instances on screens** (step 2). Here you document what each
component *is*.

1. Call `search_design_system` with `fileKey` and broad queries (`button`,
   `input`, `card`, …) to list components defined in the file and libraries.
2. For each component to inventory, call `get_context_for_code_connect` to get
   props, variants, and anatomy.
3. On bootstrap only: cluster repeated non-component layers (similar buttons,
   inputs) and propose new component entries. That step is judgment — name,
   props, states, tokens used.

Write or update `design-system/inventory/components.json`. Mark entries with no
code equivalent as `"codeConnected": false`.

## 4. Confirm before writing

Show the person a short summary: variable collection count, screen count,
component instances found, and any raw values flagged. On approval, write
`figma.raw.json`, `screens.json`, and `components.json`, then run build + lint.
