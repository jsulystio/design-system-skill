# Code Connect mappings

Each `*.figma.ts` file maps one Figma component to its real code component.
Once mapped, Figma Dev Mode and the Figma MCP server hand engineers the actual
component and import path instead of guessing markup.

Inventory items with `"codeConnected": false` (currently: Tag) do not yet have a
mapping. The docs site flags them, and engineers should not hand-build those
until a mapping exists.

To add one: copy `button.figma.ts`, point it at the component's node id, and map
the Figma properties to the code props.
