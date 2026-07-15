// Live demo registry: rendered HTML per component, keyed by slug.
//
// This is the SITE's rendering layer, kept separate from the semantic spec in
// inventory/components.json (which stays agent-readable). Everything here uses
// the token-based `ds-*` classes from demos.css, so previews restyle from the
// design tokens and never need a Figma export.
//
// Entry shape (all fields optional except `preview`):
//   preview  : representative HTML — the card cover and page hero.
//   variants : [{ title, description?, html, tsx }] — the gallery; tsx is the
//              copyable component call.
//   anatomy  : { html, parts: [..] } — ONE instance + the ordered part list.
//   states   : [{ label, html }] — interaction states for the "States" section.
//
// Add an entry per component. Components without an entry fall back to a
// spec-only page (no visual) so the build never breaks.

// --- tiny inline icons (stroke = currentColor) ---
const I = {
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-6h2zm0-8h-2V7h2z"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10l9-7 9 7v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>',
  upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M6 10l6-6 6 6"/><path d="M4 20h16"/></svg>',
  folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>',
  grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
};

export const demos = {
  button: {
    preview: `<span class="ds-btn ds-btn--primary">Save changes</span><span class="ds-btn ds-btn--neutral">Cancel</span><span class="ds-btn ds-btn--ghost">Learn more</span>`,
    variants: [
      { title: 'Primary', description: 'The main action on a view. Use exactly one.', html: `<span class="ds-btn ds-btn--primary">Save changes</span>`, tsx: `<Button type="primary">Save changes</Button>` },
      { title: 'Neutral', description: 'A supporting action shown next to primary.', html: `<span class="ds-btn ds-btn--neutral">Cancel</span>`, tsx: `<Button type="neutral" styling="stroke">Cancel</Button>` },
      { title: 'Error', description: 'Destructive actions only.', html: `<span class="ds-btn ds-btn--error">Delete</span>`, tsx: `<Button type="error">Delete</Button>` },
      { title: 'Lighter', description: 'Tinted low-emphasis primary.', html: `<span class="ds-btn ds-btn--lighter">Invite</span>`, tsx: `<Button type="primary" styling="lighter">Invite</Button>` },
      { title: 'Ghost', description: 'Tertiary / inline.', html: `<span class="ds-btn ds-btn--ghost">Learn more</span>`, tsx: `<Button styling="ghost">Learn more</Button>` },
      { title: 'Sizes', description: 'medium 40 · small 36 · x-small 32.', html: `<span class="ds-btn ds-btn--primary">Medium</span><span class="ds-btn ds-btn--primary ds-btn--sm">Small</span><span class="ds-btn ds-btn--primary ds-btn--xs">X-Small</span>`, tsx: `<Button size="medium" />\n<Button size="small" />\n<Button size="xsmall" />` },
    ],
    anatomy: {
      html: `<span class="ds-btn ds-btn--primary">${I.plus}Label</span>`,
      parts: ['Container', 'Leading icon (optional)', 'Label', 'Trailing icon (optional)'],
    },
    states: [
      { label: 'Default', html: `<span class="ds-btn ds-btn--primary">Button</span>` },
      { label: 'Hover', html: `<span class="ds-btn ds-btn--primary is-hover">Button</span>` },
      { label: 'Focus', html: `<span class="ds-btn ds-btn--primary is-focus">Button</span>` },
      { label: 'Active', html: `<span class="ds-btn ds-btn--primary is-active">Button</span>` },
      { label: 'Disabled', html: `<span class="ds-btn ds-btn--primary is-disabled">Button</span>` },
    ],
  },

  'compact-button': {
    preview: `<span class="ds-compact">${I.plus}</span><span class="ds-compact ds-compact--round">${I.plus}</span><span class="ds-compact">${I.x}</span>`,
    variants: [
      { title: 'Stroke', html: `<span class="ds-compact">${I.plus}</span>`, tsx: `<CompactButton styling="stroke" icon={PlusIcon} />` },
      { title: 'Full radius', html: `<span class="ds-compact ds-compact--round">${I.plus}</span>`, tsx: `<CompactButton fullRadius icon={PlusIcon} />` },
    ],
    anatomy: { html: `<span class="ds-compact">${I.plus}</span>`, parts: ['Container', 'Icon'] },
    states: [
      { label: 'Default', html: `<span class="ds-compact">${I.plus}</span>` },
      { label: 'Hover', html: `<span class="ds-compact is-hover">${I.plus}</span>` },
    ],
  },

  'link-button': {
    preview: `<span class="ds-linkbtn ds-linkbtn--primary">View details</span><span class="ds-linkbtn">Cancel</span><span class="ds-linkbtn ds-linkbtn--error">Remove</span>`,
    variants: [
      { title: 'Primary', html: `<span class="ds-linkbtn ds-linkbtn--primary">View details</span>`, tsx: `<LinkButton styling="primary">View details</LinkButton>` },
      { title: 'Gray', html: `<span class="ds-linkbtn">Cancel</span>`, tsx: `<LinkButton styling="gray">Cancel</LinkButton>` },
      { title: 'Error', html: `<span class="ds-linkbtn ds-linkbtn--error">Remove</span>`, tsx: `<LinkButton styling="error">Remove</LinkButton>` },
    ],
    anatomy: { html: `<span class="ds-linkbtn ds-linkbtn--primary">Label</span>`, parts: ['Label', 'Icon (optional)'] },
    states: [
      { label: 'Default', html: `<span class="ds-linkbtn ds-linkbtn--primary">Link</span>` },
      { label: 'Hover', html: `<span class="ds-linkbtn ds-linkbtn--primary is-hover">Link</span>` },
    ],
  },

  badge: {
    preview: `<span class="ds-badge ds-badge--filled">3</span><span class="ds-badge ds-badge--lighter">New</span><span class="ds-badge ds-badge--green"><span class="ds-dot"></span>Live</span><span class="ds-badge ds-badge--red">Overdue</span>`,
    variants: [
      { title: 'Filled', html: `<span class="ds-badge ds-badge--filled">3</span>`, tsx: `<Badge styling="filled" color="blue">3</Badge>` },
      { title: 'Light', html: `<span class="ds-badge ds-badge--light">Beta</span>`, tsx: `<Badge styling="light" color="blue">Beta</Badge>` },
      { title: 'Lighter', html: `<span class="ds-badge ds-badge--lighter">New</span>`, tsx: `<Badge styling="lighter" color="blue">New</Badge>` },
      { title: 'With dot', html: `<span class="ds-badge ds-badge--green"><span class="ds-dot"></span>Live</span>`, tsx: `<Badge styling="lighter" color="green" dot>Live</Badge>` },
      { title: 'Colors', description: 'The 10-hue palette maps to intent.', html: `<span class="ds-badge ds-badge--gray">Gray</span><span class="ds-badge ds-badge--red">Red</span><span class="ds-badge ds-badge--green">Green</span><span class="ds-badge ds-badge--orange">Orange</span>`, tsx: `<Badge color="red">Red</Badge>` },
    ],
    anatomy: { html: `<span class="ds-badge ds-badge--green"><span class="ds-dot"></span>Label</span>`, parts: ['Container', 'Dot or icon (optional)', 'Value'] },
  },

  'status-badge': {
    preview: `<span class="ds-statusbadge ds-statusbadge--completed"><span class="ds-dot"></span>Completed</span><span class="ds-statusbadge ds-statusbadge--pending"><span class="ds-dot"></span>Pending</span><span class="ds-statusbadge ds-statusbadge--failed"><span class="ds-dot"></span>Failed</span>`,
    variants: [
      { title: 'Completed', html: `<span class="ds-statusbadge ds-statusbadge--completed"><span class="ds-dot"></span>Completed</span>`, tsx: `<StatusBadge status="completed" />` },
      { title: 'Pending', html: `<span class="ds-statusbadge ds-statusbadge--pending"><span class="ds-dot"></span>Pending</span>`, tsx: `<StatusBadge status="pending" />` },
      { title: 'Failed', html: `<span class="ds-statusbadge ds-statusbadge--failed"><span class="ds-dot"></span>Failed</span>`, tsx: `<StatusBadge status="failed" />` },
    ],
    anatomy: { html: `<span class="ds-statusbadge ds-statusbadge--completed"><span class="ds-dot"></span>Completed</span>`, parts: ['Container', 'Status dot', 'Label'] },
  },

  tag: {
    preview: `<span class="ds-tag">Design<span class="ds-tag-x">${I.x}</span></span><span class="ds-tag ds-tag--gray">Engineering<span class="ds-tag-x">${I.x}</span></span><span class="ds-tag">Research</span>`,
    variants: [
      { title: 'Stroke, dismissible', html: `<span class="ds-tag">Design<span class="ds-tag-x">${I.x}</span></span>`, tsx: `<Tag styling="stroke" onDismiss={fn}>Design</Tag>` },
      { title: 'Gray', html: `<span class="ds-tag ds-tag--gray">Engineering<span class="ds-tag-x">${I.x}</span></span>`, tsx: `<Tag styling="gray" onDismiss={fn}>Engineering</Tag>` },
      { title: 'Read-only', html: `<span class="ds-tag">Research</span>`, tsx: `<Tag styling="stroke">Research</Tag>` },
    ],
    anatomy: { html: `<span class="ds-tag">Label<span class="ds-tag-x">${I.x}</span></span>`, parts: ['Container', 'Leading content (optional)', 'Label', 'Dismiss icon (optional)'] },
    states: [
      { label: 'Default', html: `<span class="ds-tag">Design</span>` },
      { label: 'Hover', html: `<span class="ds-tag is-hover">Design</span>` },
    ],
  },

  checkbox: {
    preview: `<span class="ds-check is-on"><span class="ds-check-box">${I.check}</span>Subscribe</span><span class="ds-check"><span class="ds-check-box">${I.check}</span>Remember me</span>`,
    variants: [
      { title: 'Checked', html: `<span class="ds-check is-on"><span class="ds-check-box">${I.check}</span>Subscribe</span>`, tsx: `<Checkbox checked label="Subscribe" />` },
      { title: 'Unchecked', html: `<span class="ds-check"><span class="ds-check-box">${I.check}</span>Remember me</span>`, tsx: `<Checkbox label="Remember me" />` },
    ],
    anatomy: { html: `<span class="ds-check is-on"><span class="ds-check-box">${I.check}</span>Label</span>`, parts: ['Box', 'Check / indeterminate indicator', 'Label'] },
    states: [
      { label: 'Off', html: `<span class="ds-check"><span class="ds-check-box">${I.check}</span></span>` },
      { label: 'On', html: `<span class="ds-check is-on"><span class="ds-check-box">${I.check}</span></span>` },
      { label: 'Hover', html: `<span class="ds-check is-hover"><span class="ds-check-box">${I.check}</span></span>` },
      { label: 'Focus', html: `<span class="ds-check is-on is-focus"><span class="ds-check-box">${I.check}</span></span>` },
      { label: 'Disabled', html: `<span class="ds-check is-disabled"><span class="ds-check-box">${I.check}</span></span>` },
    ],
  },

  radio: {
    preview: `<span class="ds-check ds-radio is-on"><span class="ds-check-box"></span>Monthly</span><span class="ds-check ds-radio"><span class="ds-check-box"></span>Yearly</span>`,
    variants: [
      { title: 'Selected', html: `<span class="ds-check ds-radio is-on"><span class="ds-check-box"></span>Monthly</span>`, tsx: `<Radio checked label="Monthly" />` },
      { title: 'Unselected', html: `<span class="ds-check ds-radio"><span class="ds-check-box"></span>Yearly</span>`, tsx: `<Radio label="Yearly" />` },
    ],
    anatomy: { html: `<span class="ds-check ds-radio is-on"><span class="ds-check-box"></span>Label</span>`, parts: ['Circle', 'Selected dot', 'Label'] },
    states: [
      { label: 'Off', html: `<span class="ds-check ds-radio"><span class="ds-check-box"></span></span>` },
      { label: 'On', html: `<span class="ds-check ds-radio is-on"><span class="ds-check-box"></span></span>` },
      { label: 'Hover', html: `<span class="ds-check ds-radio is-hover"><span class="ds-check-box"></span></span>` },
      { label: 'Disabled', html: `<span class="ds-check ds-radio is-disabled"><span class="ds-check-box"></span></span>` },
    ],
  },

  switch: {
    preview: `<span class="ds-switch is-on"><span class="ds-switch-track"></span>Notifications</span><span class="ds-switch"><span class="ds-switch-track"></span>Auto-sync</span>`,
    variants: [
      { title: 'On', html: `<span class="ds-switch is-on"><span class="ds-switch-track"></span>Notifications</span>`, tsx: `<Switch checked label="Notifications" />` },
      { title: 'Off', html: `<span class="ds-switch"><span class="ds-switch-track"></span>Auto-sync</span>`, tsx: `<Switch label="Auto-sync" />` },
    ],
    anatomy: { html: `<span class="ds-switch is-on"><span class="ds-switch-track"></span>Label</span>`, parts: ['Track', 'Thumb', 'Label (optional)'] },
    states: [
      { label: 'Off', html: `<span class="ds-switch"><span class="ds-switch-track"></span></span>` },
      { label: 'On', html: `<span class="ds-switch is-on"><span class="ds-switch-track"></span></span>` },
      { label: 'Disabled', html: `<span class="ds-switch is-disabled"><span class="ds-switch-track"></span></span>` },
    ],
  },

  'text-input': {
    preview: `<span class="ds-field"><span class="ds-field-label">Email</span><span class="ds-input"><span class="ph">you@example.com</span></span></span>`,
    variants: [
      { title: 'Default', html: `<span class="ds-field"><span class="ds-field-label">Email</span><span class="ds-input"><span class="ph">you@example.com</span></span></span>`, tsx: `<TextInput label="Email" placeholder="you@example.com" />` },
      { title: 'With icon', html: `<span class="ds-field"><span class="ds-field-label">Search</span><span class="ds-input">${I.search}<span class="ph">Search…</span></span></span>`, tsx: `<TextInput type="search" leadingIcon={SearchIcon} />` },
      { title: 'Error', html: `<span class="ds-field"><span class="ds-field-label">Email</span><span class="ds-input is-error">not-an-email</span><span class="ds-hint ds-hint--error">Enter a valid email</span></span>`, tsx: `<TextInput label="Email" error="Enter a valid email" />` },
    ],
    anatomy: { html: `<span class="ds-field"><span class="ds-field-label">Label</span><span class="ds-input">${I.search}<span class="ph">Placeholder</span></span><span class="ds-hint">Hint text</span></span>`, parts: ['Label', 'Field container', 'Leading icon (optional)', 'Value / placeholder', 'Hint text (optional)'] },
    states: [
      { label: 'Default', html: `<span class="ds-input" style="min-width:200px"><span class="ph">Placeholder</span></span>` },
      { label: 'Hover', html: `<span class="ds-input is-hover" style="min-width:200px"><span class="ph">Placeholder</span></span>` },
      { label: 'Focus', html: `<span class="ds-input is-focus" style="min-width:200px">Typing…</span>` },
      { label: 'Error', html: `<span class="ds-input is-error" style="min-width:200px">Invalid</span>` },
      { label: 'Disabled', html: `<span class="ds-input is-disabled" style="min-width:200px"><span class="ph">Placeholder</span></span>` },
    ],
  },

  'text-area': {
    preview: `<span class="ds-field"><span class="ds-field-label">Message</span><span class="ds-input ds-textarea"><span class="ph">Write a message…</span></span></span>`,
    variants: [
      { title: 'Default', html: `<span class="ds-field"><span class="ds-field-label">Message</span><span class="ds-input ds-textarea"><span class="ph">Write a message…</span></span></span>`, tsx: `<TextArea label="Message" placeholder="Write a message…" />` },
    ],
    anatomy: { html: `<span class="ds-field"><span class="ds-field-label">Label</span><span class="ds-input ds-textarea"><span class="ph">Placeholder</span></span></span>`, parts: ['Label (optional)', 'Field container', 'Value', 'Character counter (optional)', 'Hint text (optional)'] },
    states: [
      { label: 'Default', html: `<span class="ds-input ds-textarea" style="min-width:220px"><span class="ph">Placeholder</span></span>` },
      { label: 'Focus', html: `<span class="ds-input ds-textarea is-focus" style="min-width:220px">Typing…</span>` },
      { label: 'Disabled', html: `<span class="ds-input ds-textarea is-disabled" style="min-width:220px"><span class="ph">Placeholder</span></span>` },
    ],
  },

  'segmented-control': {
    preview: `<span class="ds-seg"><button class="is-on">Preview</button><button>Code</button><button>Split</button></span>`,
    variants: [
      { title: 'Default', html: `<span class="ds-seg"><button class="is-on">Preview</button><button>Code</button><button>Split</button></span>`, tsx: `<SegmentedControl options={['Preview','Code','Split']} value="Preview" />` },
    ],
    anatomy: { html: `<span class="ds-seg"><button class="is-on">Selected</button><button>Option</button></span>`, parts: ['Container', 'Item (label and/or icon)', 'Active pill'] },
    states: [
      { label: 'Selected', html: `<span class="ds-seg"><button class="is-on">On</button><button>Off</button></span>` },
    ],
  },

  alert: {
    preview: `<span class="ds-alert ds-alert--success">${I.check}<span class="ds-alert-body"><span class="ds-alert-title">Saved</span><span>Your changes were saved.</span></span></span>`,
    variants: [
      { title: 'Success', html: `<span class="ds-alert ds-alert--success">${I.check}<span class="ds-alert-body"><span class="ds-alert-title">Saved</span><span>Your changes were saved.</span></span></span>`, tsx: `<Alert status="success" title="Saved">Your changes were saved.</Alert>` },
      { title: 'Error', html: `<span class="ds-alert ds-alert--error">${I.info}<span class="ds-alert-body"><span class="ds-alert-title">Payment failed</span><span>Update your card and retry.</span></span></span>`, tsx: `<Alert status="error" title="Payment failed" />` },
      { title: 'Warning', html: `<span class="ds-alert ds-alert--warning">${I.info}<span class="ds-alert-body"><span class="ds-alert-title">Storage almost full</span></span></span>`, tsx: `<Alert status="warning" title="Storage almost full" />` },
      { title: 'Information', html: `<span class="ds-alert ds-alert--info">${I.info}<span class="ds-alert-body"><span class="ds-alert-title">Maintenance tonight</span></span></span>`, tsx: `<Alert status="information" title="Maintenance tonight" />` },
    ],
    anatomy: { html: `<span class="ds-alert ds-alert--info">${I.info}<span class="ds-alert-body"><span class="ds-alert-title">Title</span><span>Description</span></span></span>`, parts: ['Container', 'Status icon', 'Title', 'Description (optional)', 'Dismiss (optional)'] },
  },

  tooltip: {
    preview: `<span class="ds-tooltip">Copy to clipboard</span>`,
    variants: [
      { title: 'Default', html: `<span class="ds-tooltip">Copy to clipboard</span>`, tsx: `<Tooltip content="Copy to clipboard"><button>…</button></Tooltip>` },
    ],
    anatomy: { html: `<span class="ds-tooltip">Label</span>`, parts: ['Bubble', 'Tail', 'Label', 'Description (large only)'] },
  },

  'progress-bar': {
    preview: `<span class="ds-col"><span class="ds-progress"><span style="width:35%"></span></span><span class="ds-progress"><span style="width:70%"></span></span></span>`,
    variants: [
      { title: '35%', html: `<span class="ds-progress"><span style="width:35%"></span></span>`, tsx: `<ProgressBar value={35} />` },
      { title: '70%', html: `<span class="ds-progress"><span style="width:70%"></span></span>`, tsx: `<ProgressBar value={70} />` },
    ],
    anatomy: { html: `<span class="ds-progress"><span style="width:60%"></span></span>`, parts: ['Track', 'Filled line', 'Label (optional)'] },
  },

  avatar: {
    preview: `<span class="ds-avatar">AT</span><span class="ds-avatar">SW<span class="ds-avatar-status"></span></span><span class="ds-avatar" style="background:var(--color-state-feature-lighter);color:var(--color-state-feature-base)">JB</span>`,
    variants: [
      { title: 'Initials', html: `<span class="ds-avatar">AT</span>`, tsx: `<Avatar initials="AT" size={40} />` },
      { title: 'With status', html: `<span class="ds-avatar">SW<span class="ds-avatar-status"></span></span>`, tsx: `<Avatar initials="SW" status="online" />` },
    ],
    anatomy: { html: `<span class="ds-avatar">AT<span class="ds-avatar-status"></span></span>`, parts: ['Container', 'Image / initials / icon', 'Status indicator (optional)'] },
  },

  'social-button': {
    preview: `<span class="ds-btn ds-btn--neutral">Continue with Google</span><span class="ds-btn ds-btn--neutral">Continue with Apple</span>`,
    variants: [
      { title: 'Stroke', html: `<span class="ds-btn ds-btn--neutral">Continue with Google</span>`, tsx: `<SocialButton brand="google">Continue with Google</SocialButton>` },
      { title: 'Filled', html: `<span class="ds-btn ds-btn--fancy">Continue with Apple</span>`, tsx: `<SocialButton brand="apple" styling="filled" />` },
    ],
    anatomy: { html: `<span class="ds-btn ds-btn--neutral">${I.user}Continue with …</span>`, parts: ['Container', 'Brand icon', 'Label (optional)'] },
  },

  'fancy-button': {
    preview: `<span class="ds-btn ds-btn--fancy">Upgrade plan</span>`,
    variants: [
      { title: 'Primary', html: `<span class="ds-btn ds-btn--fancy">Upgrade plan</span>`, tsx: `<FancyButton type="primary">Upgrade plan</FancyButton>` },
    ],
    anatomy: { html: `<span class="ds-btn ds-btn--fancy">Label</span>`, parts: ['Container (elevated)', 'Label', 'Icon (optional)'] },
    states: [
      { label: 'Default', html: `<span class="ds-btn ds-btn--fancy">Upgrade</span>` },
      { label: 'Hover', html: `<span class="ds-btn ds-btn--fancy is-hover">Upgrade</span>` },
    ],
  },

  'button-group': {
    preview: `<span class="ds-btngroup"><button class="is-on">Day</button><button>Week</button><button>Month</button></span>`,
    variants: [
      { title: 'Three segments', html: `<span class="ds-btngroup"><button class="is-on">Day</button><button>Week</button><button>Month</button></span>`, tsx: `<ButtonGroup options={['Day','Week','Month']} value="Day" />` },
    ],
    anatomy: { html: `<span class="ds-btngroup"><button class="is-on">One</button><button>Two</button></span>`, parts: ['Group container', 'Segment (label and/or icon)'] },
  },

  select: {
    preview: `<span class="ds-field"><span class="ds-field-label">Country</span><span class="ds-input ds-input--between"><span class="ph">Select a country</span>${I.chevron}</span></span>`,
    variants: [
      { title: 'Default', html: `<span class="ds-field"><span class="ds-field-label">Country</span><span class="ds-input ds-input--between"><span class="ph">Select a country</span>${I.chevron}</span></span>`, tsx: `<Select label="Country" placeholder="Select a country" />` },
      { title: 'Filled', html: `<span class="ds-input ds-input--between" style="min-width:220px">United States${I.chevron}</span>`, tsx: `<Select value="United States" />` },
    ],
    anatomy: { html: `<span class="ds-input ds-input--between" style="min-width:220px"><span class="ph">Value</span>${I.chevron}</span>`, parts: ['Trigger container', 'Leading content (optional)', 'Value', 'Chevron', 'Menu (Dropdown items)'] },
    states: [
      { label: 'Default', html: `<span class="ds-input ds-input--between" style="min-width:180px"><span class="ph">Select</span>${I.chevron}</span>` },
      { label: 'Hover', html: `<span class="ds-input ds-input--between is-hover" style="min-width:180px"><span class="ph">Select</span>${I.chevron}</span>` },
      { label: 'Focus', html: `<span class="ds-input ds-input--between is-focus" style="min-width:180px">United States${I.chevron}</span>` },
      { label: 'Disabled', html: `<span class="ds-input ds-input--between is-disabled" style="min-width:180px"><span class="ph">Select</span>${I.chevron}</span>` },
    ],
  },

  'tag-input': {
    preview: `<span class="ds-input" style="min-width:280px;flex-wrap:wrap"><span class="ds-tag ds-tag--gray">Design<span class="ds-tag-x">${I.x}</span></span><span class="ds-tag ds-tag--gray">UX<span class="ds-tag-x">${I.x}</span></span><span class="ph">Add tag…</span></span>`,
    variants: [
      { title: 'With chips', html: `<span class="ds-input" style="min-width:280px;flex-wrap:wrap"><span class="ds-tag ds-tag--gray">Design<span class="ds-tag-x">${I.x}</span></span><span class="ds-tag ds-tag--gray">UX<span class="ds-tag-x">${I.x}</span></span><span class="ph">Add tag…</span></span>`, tsx: `<TagInput value={['Design','UX']} placeholder="Add tag…" />` },
    ],
    anatomy: { html: `<span class="ds-input" style="min-width:240px"><span class="ds-tag ds-tag--gray">Chip<span class="ds-tag-x">${I.x}</span></span><span class="ph">Add…</span></span>`, parts: ['Field container', 'Tag chips', 'Input', 'Hint text (optional)'] },
  },

  'counter-input': {
    preview: `<span class="ds-input" style="min-width:160px"><span class="ds-counter"><span class="ds-compact">–</span><span class="val">2</span><span class="ds-compact">${I.plus}</span></span></span>`,
    variants: [
      { title: 'Default', html: `<span class="ds-input" style="min-width:160px"><span class="ds-counter"><span class="ds-compact">–</span><span class="val">2</span><span class="ds-compact">${I.plus}</span></span></span>`, tsx: `<CounterInput value={2} min={0} max={10} />` },
    ],
    anatomy: { html: `<span class="ds-input" style="min-width:160px"><span class="ds-counter"><span class="ds-compact">–</span><span class="val">2</span><span class="ds-compact">${I.plus}</span></span></span>`, parts: ['Decrement button', 'Value', 'Increment button'] },
  },

  'digit-input': {
    preview: `<span class="ds-digits"><span class="ds-digit">4</span><span class="ds-digit">2</span><span class="ds-digit is-focus">8</span><span class="ds-digit"></span></span>`,
    variants: [
      { title: 'OTP', html: `<span class="ds-digits"><span class="ds-digit">4</span><span class="ds-digit">2</span><span class="ds-digit is-focus">8</span><span class="ds-digit"></span></span>`, tsx: `<DigitInput length={4} />` },
    ],
    anatomy: { html: `<span class="ds-digits"><span class="ds-digit">1</span><span class="ds-digit is-focus"></span><span class="ds-digit"></span></span>`, parts: ['Digit boxes', 'Active box', 'Hint text (optional)'] },
    states: [
      { label: 'Empty', html: `<span class="ds-digit"></span>` },
      { label: 'Filled', html: `<span class="ds-digit">7</span>` },
      { label: 'Focus', html: `<span class="ds-digit is-focus"></span>` },
    ],
  },

  slider: {
    preview: `<span class="ds-slider"><span class="fill" style="width:60%"></span><span class="thumb" style="left:60%"></span></span>`,
    variants: [
      { title: 'Single value', html: `<span class="ds-slider"><span class="fill" style="width:60%"></span><span class="thumb" style="left:60%"></span></span>`, tsx: `<Slider value={60} />` },
      { title: 'Range', html: `<span class="ds-slider"><span class="fill" style="left:25%;width:45%"></span><span class="thumb" style="left:25%"></span><span class="thumb" style="left:70%"></span></span>`, tsx: `<Slider range value={[25, 70]} />` },
    ],
    anatomy: { html: `<span class="ds-slider"><span class="fill" style="width:50%"></span><span class="thumb" style="left:50%"></span></span>`, parts: ['Track', 'Filled range', 'Thumb', 'Tooltip (optional)'] },
  },

  rating: {
    preview: `<span class="ds-rating">${I.star}${I.star}${I.star}${I.star}<span class="off">${I.star}</span></span>`,
    variants: [
      { title: 'Stars', html: `<span class="ds-rating">${I.star}${I.star}${I.star}${I.star}<span class="off">${I.star}</span></span>`, tsx: `<Rating value={4} max={5} />` },
    ],
    anatomy: { html: `<span class="ds-rating">${I.star}${I.star}<span class="off">${I.star}</span></span>`, parts: ['Rating items (empty / half / full)', 'Value label (optional)'] },
  },

  'date-picker': {
    preview: `<span class="ds-surface ds-cal" style="width:196px;padding:10px"><span class="ds-cal-head" style="margin-bottom:6px">June 2026${I.chevron}</span><span class="ds-cal-grid"><span class="dow">S</span><span class="dow">M</span><span class="dow">T</span><span class="dow">W</span><span class="dow">T</span><span class="dow">F</span><span class="dow">S</span><span>1</span><span>2</span><span class="on">3</span><span class="range">4</span><span class="range">5</span><span>6</span><span>7</span></span></span>`,
    variants: [
      { title: 'Calendar', html: `<span class="ds-surface ds-cal"><span class="ds-cal-head">June 2026${I.chevron}</span><span class="ds-cal-grid"><span class="dow">S</span><span class="dow">M</span><span class="dow">T</span><span class="dow">W</span><span class="dow">T</span><span class="dow">F</span><span class="dow">S</span><span>1</span><span>2</span><span class="on">3</span><span class="range">4</span><span class="range">5</span><span>6</span><span>7</span></span></span>`, tsx: `<DatePicker mode="range" />` },
    ],
    anatomy: { html: `<span class="ds-surface ds-cal"><span class="ds-cal-head">Month${I.chevron}</span><span class="ds-cal-grid"><span class="dow">S</span><span class="dow">M</span><span class="on">1</span><span>2</span></span></span>`, parts: ['Month selector', 'Day labels', 'Day cells grid', 'Footer (optional)'] },
  },

  'time-picker': {
    preview: `<span class="ds-surface ds-menu" style="min-width:120px"><span class="ds-menu-item">09:00</span><span class="ds-menu-item is-selected">09:30</span><span class="ds-menu-item">10:00</span></span>`,
    variants: [
      { title: 'Time list', html: `<span class="ds-surface ds-menu" style="min-width:120px"><span class="ds-menu-item">09:00</span><span class="ds-menu-item is-selected">09:30</span><span class="ds-menu-item">10:00</span></span>`, tsx: `<TimePicker value="09:30" />` },
    ],
    anatomy: { html: `<span class="ds-surface ds-menu" style="min-width:120px"><span class="ds-menu-item is-selected">09:30</span><span class="ds-menu-item">10:00</span></span>`, parts: ['Time items list', 'Duration selector (optional)', 'Status selector (optional)'] },
  },

  'file-upload': {
    preview: `<span class="ds-dropzone"><span class="ic">${I.upload}</span><div>Drag &amp; drop, or <b style="color:var(--color-primary-base)">browse</b></div><div style="color:var(--color-text-soft-400)">PNG, JPG up to 5MB</div></span>`,
    variants: [
      { title: 'Dropzone', html: `<span class="ds-dropzone"><span class="ic">${I.upload}</span><div>Drag &amp; drop, or <b style="color:var(--color-primary-base)">browse</b></div><div style="color:var(--color-text-soft-400)">PNG, JPG up to 5MB</div></span>`, tsx: `<FileUpload accept="image/*" maxSize="5MB" />` },
    ],
    anatomy: { html: `<span class="ds-dropzone"><span class="ic">${I.upload}</span><div>Upload area</div></span>`, parts: ['Upload area (icon, copy, browse)', 'Upload cards (progress/status)', 'Format icon'] },
  },

  'color-picker': {
    preview: `<span class="ds-swatches"><span class="ds-swatch is-on" style="background:var(--color-blue-500)"></span><span class="ds-swatch" style="background:var(--color-green-500)"></span><span class="ds-swatch" style="background:var(--color-orange-500)"></span><span class="ds-swatch" style="background:var(--color-purple-500)"></span><span class="ds-swatch" style="background:var(--color-pink-500)"></span></span>`,
    variants: [
      { title: 'Preset dots', html: `<span class="ds-swatches"><span class="ds-swatch is-on" style="background:var(--color-blue-500)"></span><span class="ds-swatch" style="background:var(--color-green-500)"></span><span class="ds-swatch" style="background:var(--color-orange-500)"></span><span class="ds-swatch" style="background:var(--color-purple-500)"></span><span class="ds-swatch" style="background:var(--color-pink-500)"></span></span>`, tsx: `<ColorPicker presets value="#335cff" />` },
    ],
    anatomy: { html: `<span class="ds-swatches"><span class="ds-swatch is-on" style="background:var(--color-blue-500)"></span><span class="ds-swatch" style="background:var(--color-green-500)"></span></span>`, parts: ['Spectrum', 'Hue / opacity sliders', 'Hex input', 'Preset dots'] },
  },

  'label-hint-text': {
    preview: `<span class="ds-col"><span class="ds-field-label">Email <span style="color:var(--color-state-error-base)">*</span></span><span class="ds-hint">We'll never share it.</span><span class="ds-hint ds-hint--error">This field is required.</span></span>`,
    variants: [
      { title: 'Label', html: `<span class="ds-field-label">Email <span style="color:var(--color-state-error-base)">*</span></span>`, tsx: `<Label required>Email</Label>` },
      { title: 'Hint', html: `<span class="ds-hint">We'll never share it.</span>`, tsx: `<HintText>We'll never share it.</HintText>` },
      { title: 'Error hint', html: `<span class="ds-hint ds-hint--error">This field is required.</span>`, tsx: `<HintText status="error">This field is required.</HintText>` },
    ],
    anatomy: { html: `<span class="ds-col"><span class="ds-field-label">Label *</span><span class="ds-hint">Hint text</span></span>`, parts: ['Label row (required mark, info)', 'Hint row (icon + text)', 'Strength bar (password fields)'] },
  },

  'rich-editor': {
    preview: `<span class="ds-toolbar"><button class="is-on">B</button><button><i>I</i></button><button style="text-decoration:underline">U</button><span class="sep"></span><button>${I.grid}</button></span>`,
    variants: [
      { title: 'Toolbar', html: `<span class="ds-toolbar"><button class="is-on">B</button><button><i>I</i></button><button style="text-decoration:underline">U</button><span class="sep"></span><button>${I.grid}</button></span>`, tsx: `<RichEditor toolbar="01" />` },
    ],
    anatomy: { html: `<span class="ds-toolbar"><button class="is-on">B</button><button><i>I</i></button></span>`, parts: ['Toolbar', 'Toolbar items', 'Color palette dropdown', 'Editing surface'] },
  },

  breadcrumbs: {
    preview: `<span class="ds-crumbs"><span class="crumb">Home</span><span class="sep">/</span><span class="crumb">Projects</span><span class="sep">/</span><span class="current">Overview</span></span>`,
    variants: [
      { title: 'Slash', html: `<span class="ds-crumbs"><span class="crumb">Home</span><span class="sep">/</span><span class="crumb">Projects</span><span class="sep">/</span><span class="current">Overview</span></span>`, tsx: `<Breadcrumbs items={['Home','Projects','Overview']} />` },
    ],
    anatomy: { html: `<span class="ds-crumbs"><span class="crumb">Item</span><span class="sep">/</span><span class="current">Current</span></span>`, parts: ['Item (icon and/or text)', 'Divider', 'Current page'] },
  },

  pagination: {
    preview: `<span class="ds-pager"><span>‹</span><span class="on">1</span><span>2</span><span>3</span><span>…</span><span>12</span><span>›</span></span>`,
    variants: [
      { title: 'Basic', html: `<span class="ds-pager"><span>‹</span><span class="on">1</span><span>2</span><span>3</span><span>…</span><span>12</span><span>›</span></span>`, tsx: `<Pagination page={1} total={12} />` },
    ],
    anatomy: { html: `<span class="ds-pager"><span>‹</span><span class="on">1</span><span>2</span><span>›</span></span>`, parts: ['Previous / first', 'Page cells', 'Ellipsis', 'Next / last'] },
    states: [
      { label: 'Default', html: `<span class="ds-pager"><span>2</span></span>` },
      { label: 'Selected', html: `<span class="ds-pager"><span class="on">2</span></span>` },
    ],
  },

  'tab-menu': {
    preview: `<span class="ds-tabs2"><span class="on">Overview</span><span>Activity</span><span>Settings</span></span>`,
    variants: [
      { title: 'Horizontal', html: `<span class="ds-tabs2"><span class="on">Overview</span><span>Activity</span><span>Settings</span></span>`, tsx: `<TabMenu tabs={['Overview','Activity','Settings']} value="Overview" />` },
    ],
    anatomy: { html: `<span class="ds-tabs2"><span class="on">Active</span><span>Tab</span></span>`, parts: ['Tab list', 'Tab item (label, icon, badge)', 'Active indicator'] },
  },

  'step-indicator': {
    preview: `<span class="ds-steps"><span class="step done">${I.check}</span><span class="line"></span><span class="step on">2</span><span class="line"></span><span class="step">3</span></span>`,
    variants: [
      { title: 'Horizontal', html: `<span class="ds-steps"><span class="step done">${I.check}</span><span class="line"></span><span class="step on">2</span><span class="line"></span><span class="step">3</span></span>`, tsx: `<StepIndicator steps={3} current={2} />` },
    ],
    anatomy: { html: `<span class="ds-steps"><span class="step done">${I.check}</span><span class="line"></span><span class="step on">2</span></span>`, parts: ['Step (number / check, label)', 'Connector', 'Active / completed markers'] },
    states: [
      { label: 'Default', html: `<span class="ds-steps"><span class="step">3</span></span>` },
      { label: 'Active', html: `<span class="ds-steps"><span class="step on">2</span></span>` },
      { label: 'Completed', html: `<span class="ds-steps"><span class="step done">${I.check}</span></span>` },
    ],
  },

  banner: {
    preview: `<span class="ds-banner">${I.info}<span class="grow">A new version is available.</span><span class="ds-linkbtn ds-linkbtn--primary" style="color:var(--color-state-information-base)">Refresh</span></span>`,
    variants: [
      { title: 'Information', html: `<span class="ds-banner">${I.info}<span class="grow">A new version is available.</span><span class="ds-linkbtn" style="color:var(--color-state-information-base)">Refresh</span></span>`, tsx: `<Banner status="information">A new version is available.</Banner>` },
    ],
    anatomy: { html: `<span class="ds-banner">${I.info}<span class="grow">Message</span></span>`, parts: ['Container', 'Status icon', 'Message', 'Link button (optional)', 'Dismiss (optional)'] },
  },

  table: {
    preview: `<span class="ds-table ds-table--compact" style="width:100%"><span class="tr head"><span>Name</span><span>Status</span></span><span class="tr"><span class="lead"><span class="ds-avatar" style="width:24px;height:24px;font-size:11px">AT</span>Arthur T.</span><span class="ds-statusbadge ds-statusbadge--completed">Active</span></span><span class="tr"><span class="lead"><span class="ds-avatar" style="width:24px;height:24px;font-size:11px">SW</span>Sophia W.</span><span class="ds-statusbadge ds-statusbadge--pending">Invited</span></span></span>`,
    variants: [
      { title: 'With embedded cells', html: `<span class="ds-table"><span class="tr head"><span>Name</span><span>Role</span><span></span></span><span class="tr"><span class="lead"><span class="ds-avatar" style="width:28px;height:28px;font-size:12px">AT</span>Arthur T.</span><span>Admin</span><span class="ds-statusbadge ds-statusbadge--completed">Active</span></span></span>`, tsx: `<Table columns={cols} data={rows} />` },
    ],
    anatomy: { html: `<span class="ds-table"><span class="tr head"><span>Header</span><span>Header</span><span></span></span><span class="tr"><span class="lead">Row cell</span><span>Cell</span><span class="ds-badge ds-badge--gray">Misc</span></span></span>`, parts: ['Header cell (label, sort icon)', 'Row cell (by priority)', 'Embedded component (optional)', 'Pagination (below)'] },
  },

  accordion: {
    preview: `<span class="ds-accordion"><span class="item">Getting started${I.chevron}</span><span class="body">A short answer that expands under the header.</span><span class="item">Billing${I.chevron}</span></span>`,
    variants: [
      { title: 'Default', html: `<span class="ds-accordion"><span class="item">Getting started${I.chevron}</span><span class="body">A short answer that expands under the header.</span><span class="item">Billing${I.chevron}</span></span>`, tsx: `<Accordion items={items} />` },
    ],
    anatomy: { html: `<span class="ds-accordion"><span class="item">Header${I.chevron}</span><span class="body">Content panel</span></span>`, parts: ['Header (title, optional icon)', 'Chevron', 'Content panel'] },
  },

  'activity-feed': {
    preview: `<span class="ds-feed"><span class="row"><span class="ds-avatar" style="width:28px;height:28px;font-size:12px">AT</span><span class="txt"><b>Arthur</b> commented on <b>Homepage</b><br><span class="time">2h ago</span></span></span><span class="row"><span class="ds-avatar" style="width:28px;height:28px;font-size:12px">SW</span><span class="txt"><b>Sophia</b> uploaded a file<br><span class="time">5h ago</span></span></span></span>`,
    variants: [
      { title: 'Timeline', html: `<span class="ds-feed"><span class="row"><span class="ds-avatar" style="width:28px;height:28px;font-size:12px">AT</span><span class="txt"><b>Arthur</b> commented on <b>Homepage</b><br><span class="time">2h ago</span></span></span></span>`, tsx: `<ActivityFeed items={events} />` },
    ],
    anatomy: { html: `<span class="ds-feed"><span class="row"><span class="ds-avatar" style="width:28px;height:28px;font-size:12px">AT</span><span class="txt"><b>Actor</b> did something<br><span class="time">time</span></span></span></span>`, parts: ['Feed item (avatar/icon, text, timestamp)', 'Attachment / comment / task row', 'Filter chips (optional)'] },
  },

  'notification-feed': {
    preview: `<span class="ds-surface" style="width:300px;padding:8px"><span class="ds-menu-item"><span class="ds-dot" style="background:var(--color-primary-base)"></span>New comment from Sophia</span><span class="ds-menu-item">Weekly report is ready</span></span>`,
    variants: [
      { title: 'Panel', html: `<span class="ds-surface" style="width:300px;padding:8px"><span class="ds-menu-item"><span class="ds-dot" style="background:var(--color-primary-base)"></span>New comment from Sophia</span><span class="ds-menu-item">Weekly report is ready</span></span>`, tsx: `<NotificationFeed items={notes} />` },
    ],
    anatomy: { html: `<span class="ds-surface" style="width:280px;padding:8px"><span class="ds-menu-item">Notification item</span></span>`, parts: ['Header (title, actions)', 'Tab menu', 'Notification items', 'Footer'] },
  },

  'content-divider': {
    preview: `<span class="ds-cdivider">or continue with</span>`,
    variants: [
      { title: 'Text', html: `<span class="ds-cdivider">or continue with</span>`, tsx: `<ContentDivider type="text">or continue with</ContentDivider>` },
      { title: 'Line', html: `<span class="ds-divider" style="width:300px"></span>`, tsx: `<ContentDivider type="line" />` },
    ],
    anatomy: { html: `<span class="ds-cdivider">label</span>`, parts: ['Line', 'Text or control (optional)'] },
  },

  scroll: {
    preview: `<span class="ds-scrollbar"></span>`,
    variants: [
      { title: 'Default', html: `<span class="ds-scrollbar"></span>`, tsx: `<Scroll>{content}</Scroll>` },
    ],
    anatomy: { html: `<span class="ds-scrollbar"></span>`, parts: ['Track', 'Thumb'] },
  },

  'widget-box': {
    preview: `<span class="ds-widget"><span class="whead"><span class="wtitle">Weekly report</span><span class="ds-badge ds-badge--green">+12%</span></span><span class="wbody">Your team shipped 12 changes this week.</span><span class="ds-btn ds-btn--neutral ds-btn--sm">View</span></span>`,
    variants: [
      { title: 'Raised', html: `<span class="ds-widget"><span class="whead"><span class="wtitle">Weekly report</span><span class="ds-badge ds-badge--green">+12%</span></span><span class="wbody">Your team shipped 12 changes this week.</span><span class="ds-btn ds-btn--neutral ds-btn--sm">View</span></span>`, tsx: `<WidgetBox>\n  <WidgetBox.Header title="Weekly report" />\n  <WidgetBox.Body>…</WidgetBox.Body>\n</WidgetBox>` },
      { title: 'Flat', html: `<span class="ds-widget ds-widget--flat"><span class="wtitle">Weekly report</span><span class="wbody">Sits inside another surface.</span></span>`, tsx: `<WidgetBox elevation="flat">…</WidgetBox>` },
    ],
    anatomy: { html: `<span class="ds-widget"><span class="whead"><span class="wtitle">Title</span></span><span class="wbody">Body</span></span>`, parts: ['Surface', 'Header (title + action)', 'Body', 'Footer (optional)'] },
  },

  modal: {
    preview: `<span class="ds-surface ds-modal"><h4>Delete project?</h4><p>This can't be undone. All data will be removed.</p><span class="foot"><span class="ds-btn ds-btn--neutral ds-btn--sm">Cancel</span><span class="ds-btn ds-btn--error ds-btn--sm">Delete</span></span></span>`,
    variants: [
      { title: 'Confirmation', html: `<span class="ds-surface ds-modal"><h4>Delete project?</h4><p>This can't be undone. All data will be removed.</p><span class="foot"><span class="ds-btn ds-btn--neutral ds-btn--sm">Cancel</span><span class="ds-btn ds-btn--error ds-btn--sm">Delete</span></span></span>`, tsx: `<Modal open>\n  <Modal.Header title="Delete project?" />\n  <Modal.Body>…</Modal.Body>\n  <Modal.Footer>…</Modal.Footer>\n</Modal>` },
    ],
    anatomy: { html: `<span class="ds-surface ds-modal"><h4>Title</h4><p>Body</p><span class="foot"><span class="ds-btn ds-btn--neutral ds-btn--sm">Cancel</span><span class="ds-btn ds-btn--primary ds-btn--sm">Confirm</span></span></span>`, parts: ['Overlay', 'Header (title, close)', 'Body', 'Footer (actions)'] },
  },

  drawer: {
    preview: `<span class="ds-surface ds-modal" style="width:280px"><h4>Filters</h4><p>Panel content slides in from the side.</p><span class="foot"><span class="ds-btn ds-btn--neutral ds-btn--sm">Reset</span><span class="ds-btn ds-btn--primary ds-btn--sm">Apply</span></span></span>`,
    variants: [
      { title: 'Side panel', html: `<span class="ds-surface ds-modal" style="width:280px"><h4>Filters</h4><p>Panel content slides in from the side.</p><span class="foot"><span class="ds-btn ds-btn--neutral ds-btn--sm">Reset</span><span class="ds-btn ds-btn--primary ds-btn--sm">Apply</span></span></span>`, tsx: `<Drawer open side="right">…</Drawer>` },
    ],
    anatomy: { html: `<span class="ds-surface ds-modal" style="width:260px"><h4>Header</h4><p>Body</p></span>`, parts: ['Overlay', 'Panel', 'Header', 'Body', 'Footer'] },
  },

  popover: {
    preview: `<span class="ds-surface ds-popover"><span class="pt">Invite teammates</span><span class="pb">Share this board with your team.</span></span>`,
    variants: [
      { title: 'With tail', html: `<span class="ds-surface ds-popover"><span class="pt">Invite teammates</span><span class="pb">Share this board with your team.</span></span>`, tsx: `<Popover placement="bottom-left">…</Popover>` },
    ],
    anatomy: { html: `<span class="ds-surface ds-popover"><span class="pt">Title</span><span class="pb">Body</span></span>`, parts: ['Panel', 'Tail', 'Title', 'Body', 'Footer (optional)'] },
  },

  dropdown: {
    preview: `<span class="ds-surface ds-menu" style="min-width:0;width:186px;padding:6px"><span class="ds-menu-item">${I.user}Profile</span><span class="ds-menu-item is-selected">${I.home}Dashboard</span></span>`,
    variants: [
      { title: 'Menu', html: `<span class="ds-surface ds-menu"><span class="ds-menu-item">${I.user}Profile</span><span class="ds-menu-item is-selected">${I.home}Dashboard</span><span class="ds-divider"></span><span class="ds-menu-item">Settings</span></span>`, tsx: `<Dropdown items={items} />` },
    ],
    anatomy: { html: `<span class="ds-surface ds-menu"><span class="ds-menu-item is-selected">Selected item</span><span class="ds-menu-item">Item</span></span>`, parts: ['Container (assembled)', 'Item (leading, label, trailing)', 'Misc item (search/button/caption)', 'Content divider'] },
    states: [
      { label: 'Default', html: `<span class="ds-surface" style="padding:6px"><span class="ds-menu-item">Item</span></span>` },
      { label: 'Hover', html: `<span class="ds-surface" style="padding:6px"><span class="ds-menu-item is-hover">Item</span></span>` },
      { label: 'Selected', html: `<span class="ds-surface" style="padding:6px"><span class="ds-menu-item is-selected">Item</span></span>` },
    ],
  },

  'command-menu': {
    preview: `<span class="ds-surface" style="width:320px"><span class="ds-input" style="border:0;border-bottom:1px solid var(--color-stroke-soft-200);border-radius:0">${I.search}<span class="ph">Type a command…</span></span><span class="ds-menu"><span class="ds-menu-item is-selected">${I.home}Go to Dashboard</span><span class="ds-menu-item">${I.plus}New project</span></span></span>`,
    variants: [
      { title: 'Palette', html: `<span class="ds-surface" style="width:320px"><span class="ds-input" style="border:0;border-bottom:1px solid var(--color-stroke-soft-200);border-radius:0">${I.search}<span class="ph">Type a command…</span></span><span class="ds-menu"><span class="ds-menu-item is-selected">${I.home}Go to Dashboard</span><span class="ds-menu-item">${I.plus}New project</span></span></span>`, tsx: `<CommandMenu open />` },
    ],
    anatomy: { html: `<span class="ds-surface" style="width:280px"><span class="ds-input" style="border:0;border-bottom:1px solid var(--color-stroke-soft-200);border-radius:0">${I.search}<span class="ph">Search…</span></span><span class="ds-menu"><span class="ds-menu-item is-selected">Result</span></span></span>`, parts: ['Search input', 'Result items', 'Footer (shortcut hints)'] },
  },

  sidebar: {
    preview: `<span class="ds-surface ds-sidebar"><span class="ds-navitem on">${I.home}Dashboard</span><span class="ds-navitem">${I.grid}Projects</span><span class="ds-navitem">${I.bell}Notifications</span><span class="ds-navitem">${I.user}Team</span></span>`,
    variants: [
      { title: 'Navigation', html: `<span class="ds-surface ds-sidebar"><span class="ds-navitem on">${I.home}Dashboard</span><span class="ds-navitem">${I.grid}Projects</span><span class="ds-navitem">${I.bell}Notifications</span><span class="ds-navitem">${I.user}Team</span></span>`, tsx: `<Sidebar items={nav} />` },
    ],
    anatomy: { html: `<span class="ds-surface ds-sidebar"><span class="ds-navitem on">${I.home}Active</span><span class="ds-navitem">${I.grid}Item</span></span>`, parts: ['Header (logo / workspace)', 'Nav items (icon, label, badge)', 'Feature card (optional)', 'User profile card', 'Footer'] },
  },

  topbar: {
    preview: `<span class="ds-surface ds-topbar"><span class="title">Dashboard</span><span class="acts"><span class="ds-compact">${I.search}</span><span class="ds-compact">${I.bell}</span><span class="ds-avatar" style="width:32px;height:32px;font-size:12px">AT</span></span></span>`,
    variants: [
      { title: 'Default', html: `<span class="ds-surface ds-topbar"><span class="title">Dashboard</span><span class="acts"><span class="ds-compact">${I.search}</span><span class="ds-compact">${I.bell}</span><span class="ds-avatar" style="width:32px;height:32px;font-size:12px">AT</span></span></span>`, tsx: `<Topbar title="Dashboard" />` },
    ],
    anatomy: { html: `<span class="ds-surface ds-topbar"><span class="title">Title</span><span class="acts"><span class="ds-compact">${I.bell}</span><span class="ds-avatar" style="width:32px;height:32px;font-size:12px">AT</span></span></span>`, parts: ['Page title / context', 'Search (optional)', 'Action buttons', 'User profile'] },
  },

  'page-header': {
    preview: `<span class="ds-surface ds-pagehdr"><span><div class="h">Projects</div><div class="sub">Manage and track everything your team ships.</div></span><span class="ds-btn ds-btn--primary ds-btn--sm">${I.plus}New</span></span>`,
    variants: [
      { title: 'With action', html: `<span class="ds-surface ds-pagehdr"><span><div class="h">Projects</div><div class="sub">Manage and track everything your team ships.</div></span><span class="ds-btn ds-btn--primary ds-btn--sm">${I.plus}New</span></span>`, tsx: `<PageHeader title="Projects" description="…" action={<Button/>} />` },
    ],
    anatomy: { html: `<span class="ds-surface ds-pagehdr"><span><div class="h">Title</div><div class="sub">Description</div></span><span class="ds-btn ds-btn--primary ds-btn--sm">Action</span></span>`, parts: ['Leading content (optional)', 'Title', 'Description (optional)', 'Actions'] },
  },

  'empty-state': {
    preview: `<span class="ds-surface ds-empty"><span class="ill">${I.folder}</span><span class="et">No projects yet</span><span class="eb">Create your first project to get started.</span><span class="ds-btn ds-btn--primary ds-btn--sm">${I.plus}New project</span></span>`,
    variants: [
      { title: 'With action', html: `<span class="ds-surface ds-empty"><span class="ill">${I.folder}</span><span class="et">No projects yet</span><span class="eb">Create your first project to get started.</span><span class="ds-btn ds-btn--primary ds-btn--sm">${I.plus}New project</span></span>`, tsx: `<EmptyState title="No projects yet" action={<Button/>} />` },
    ],
    anatomy: { html: `<span class="ds-surface ds-empty"><span class="ill">${I.folder}</span><span class="et">Message</span><span class="eb">Description</span></span>`, parts: ['Illustration', 'Message', 'Action (optional)'] },
  },
};
