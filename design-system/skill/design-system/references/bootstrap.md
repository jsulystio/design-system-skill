# Bootstrap: first system from a working file

Goal: turn a messy WIP Figma file into a first token set and component inventory
without forcing a design-system-first workflow.

1. Read the file's variables through the Desktop Bridge (any plan). Write them
   into `tokens/figma.raw.json` in the shape the sample file uses (collections,
   modes, aliases with `{collection.dot.path}` references).
2. Read the components and repeated styles. Cluster near-identical elements
   (buttons, inputs, cards) and propose a component list. This is judgment: name
   each component, its props, states, and the tokens it uses.
3. Write the proposed inventory to `inventory/components.json`. Mark components
   with no code equivalent yet as `"codeConnected": false`.
4. Run `node design-system/scripts/build.mjs`. Open
   `design-system/site/index.html` and confirm the foundations and component
   pages look right.
5. Present the proposed names and groupings to the person for approval before
   committing. Extraction is noisy, so expect to merge or rename.

Do not invent tokens that are not in the file. If a screen uses raw values,
surface them as candidates rather than silently creating variables.
