# Resolve drift: act on the lint report

Trigger: `node design-system/scripts/lint.mjs` reported issues, or the person says "resolve
the drift".

0. Refresh the screen snapshot first. Follow `references/read-figma.md` step 2
   (read screens, scan component instances and raw values) and rewrite
   `inventory/screens.json` from the current file so the lint report reflects
   today's designs, not a stale export.

1. Run `node design-system/scripts/lint.mjs` and read each issue.
2. For a raw value not bound to a token: decide whether it should snap to an
   existing token (close match) or become a new token. Propose which, with the
   token name. Snapping is preferred; only add a token when the value is a
   genuine new design decision.
3. For a component used on screens but missing from the inventory: propose an
   inventory entry (name, props, states, tokens) and, if code exists, a Code
   Connect mapping. If no code exists, mark `codeConnected: false`.
4. Present the proposed fixes as a short list. On approval, apply variable edits
   in Figma (MCP or bridge) and update `inventory/components.json`. Re-scan
   screens into `inventory/screens.json` if bindings changed.
5. Run `node design-system/scripts/build.mjs` then `node design-system/scripts/lint.mjs` to confirm clean.

Never resolve a raw value by hardcoding it into code. The fix always lands as a
Figma variable so the loop stays one-directional.
