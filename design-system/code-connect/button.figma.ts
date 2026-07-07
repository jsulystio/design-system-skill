// Sample Code Connect mapping. Links the Figma "Button" component to the real
// code component so Figma's MCP server generates code that uses YOUR button,
// not an invented one. Add one file per component as they get code-connected.
//
// Docs: https://developers.figma.com/docs/figma-mcp-server/code-connect-integration/
import figma from '@figma/code-connect';
import { Button } from '../../src/components/ui/button';

figma.connect(Button, 'https://www.figma.com/design/REPLACE_FILE_KEY?node-id=10-2', {
  props: {
    variant: figma.enum('variant', { primary: 'primary', secondary: 'secondary', ghost: 'ghost' }),
    size: figma.enum('size', { sm: 'sm', md: 'md', lg: 'lg' }),
    label: figma.string('Label'),
  },
  example: ({ variant, size, label }) => <Button variant={variant} size={size}>{label}</Button>,
});
