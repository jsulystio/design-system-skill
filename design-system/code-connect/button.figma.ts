// Sample Code Connect mapping. Links the Figma "Buttons" component set (AlignUI
// template naming) to the real code component so Figma's MCP server generates
// code that uses YOUR button, not an invented one. Add one file per component
// as they get code-connected.
//
// Docs: https://developers.figma.com/docs/figma-mcp-server/code-connect-integration/
import figma from '@figma/code-connect';
import { Button } from '../../src/components/ui/button';

figma.connect(Button, 'https://www.figma.com/design/REPLACE_FILE_KEY?node-id=129-1422', {
  props: {
    // AlignUI variant properties (emoji prefixes like "🧩 Type" stripped by Figma).
    type: figma.enum('Type', { Primary: 'primary', Neutral: 'neutral', Error: 'error' }),
    style: figma.enum('Style', { Filled: 'filled', Stroke: 'stroke', Lighter: 'lighter', Ghost: 'ghost' }),
    size: figma.enum('Size', {
      'Medium (40)': 'medium',
      'Small (36)': 'small',
      'X-Small (32)': 'xsmall',
      '2X-Small (28)': '2xsmall',
    }),
    label: figma.string('Label'),
  },
  example: ({ type, style, size, label }) => (
    <Button type={type} style={style} size={size}>{label}</Button>
  ),
});
