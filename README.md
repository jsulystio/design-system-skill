# Design System Skill

**Keep your product's colors, spacing, fonts, and components consistent from Figma
all the way to code, without doing it by hand.**

You design in Figma the way you always do. This tool reads your Figma variables
(your colors, spacing, type, and so on) and turns them into three things: a tidy
set of reusable values, a live documentation website, and one file called
`design-system/DESIGN-SYSTEM.md` that holds the entire system. That one file
lists every token, every component, and every rule. A developer hands it to any
coding agent ("read `design-system/DESIGN-SYSTEM.md`, then build the settings
page") and gets UI that matches the design. When you change something in Figma,
one command updates everything else to match.

It comes with our **AlignUI-based template** already loaded. This is the same
structure as the design system file we copy for every client, so a new project
starts with a full token set and a catalog of about 40 components before anyone
opens Figma.

Most of the time you just **talk to Claude in plain English** and it does the
mechanical work for you.

---

## Who this is for

- **Designers:** keep designing in Figma and let this keep your system organized
  and in sync. You do not need to write code.
- **Developers:** point your coding agent at `DESIGN-SYSTEM.md` and build
  token-true UI. A code linter checks that nothing drifted.
- **Anyone inheriting a project:** open the docs site and understand the system
  right away.

---

## What you get

- **Design tokens:** your colors, spacing, and type saved as reusable values,
  with light and dark themes, as CSS variables and a Tailwind theme.
- **`DESIGN-SYSTEM.md`:** the whole system as one file an agent can read. This is
  the handoff. Developers give it to Claude, Cursor, or any agent, and the
  generated code uses your tokens and components.
- **A live docs website:** one page per component, styled by the same tokens it
  documents, so it stays accurate.
- **A drift checker that works both ways:** it flags design values that are not
  tokens, and hardcoded colors in your app code (`lint.mjs --code src/`).
- **The Pixel8 template built in:** AlignUI-structured tokens and a component
  catalog as the starting point for every client project.

---

## How you'll use it day to day

Once it is set up (see below), you mostly just ask Claude. Open your project in
Claude Code and say things like:

| Just say... | And Claude will... |
|---|---|
| *"Set up the design system from the template"* | Scaffold the AlignUI-based template so the project starts with a complete system |
| *"Bootstrap from my Figma file"* | Pull your real Figma colors and components into the system |
| *"Refresh the system from the approved screens"* | After the client picks a direction, detect its palette and components (with all their states) and write them back into Figma, code, and docs |
| *"Build the settings page"* | Build the UI using your tokens and component catalog, then lint its own output |
| *"Resolve the drift"* | Find anything that does not match the system and propose fixes for your approval |
| *"Make the primary color warmer and buttons less round"* | Turn that into the exact changes and update your tokens, docs, and code |

That is the everyday experience. The setup below is a one-time thing.

---

## Before you start

You will need a few free things. If any of this looks unfamiliar, a developer
teammate can do the one-time setup in a couple of minutes.

- **Claude Code (or Cowork):** the app that runs this skill. You are probably
  already in it.
- **Node.js, version 18 or newer:** a free tool that runs the behind-the-scenes
  scripts. Check it by opening a terminal and running `node --version`. If it is
  missing, download it from [nodejs.org](https://nodejs.org).
- **A Figma file** with your colors and components. Any Figma plan works. You
  only need this when you are ready to connect your real designs. You can try
  everything first with the built-in sample data.

---

## Setup: pick one

### Option 1: install once, use in every project (recommended)

Do this one time on your computer. After that you never set up again. You just
open any project and talk to Claude.

```bash
# 1. Download the toolkit to your computer (keep this folder around):
git clone https://github.com/jsulystio/design-system-skill.git ~/design-system-skill

# 2. Make Claude aware of it in every project:
ln -s ~/design-system-skill/design-system/skill/design-system ~/.claude/skills/design-system
```

Now, in **any** project, open it in Claude Code and say
*"set up the design system"*. Claude adds the toolkit to that project and gets
you started. You never clone again.

> Keep the downloaded `~/design-system-skill` folder where it is. The shortcut
> in step 2 points to it. To get later improvements, run
> `cd ~/design-system-skill && git pull` and every project picks them up
> automatically.

### Option 2: add it to a single project by hand

Prefer to set up just one project, or you are a developer who likes to see the
files? From that project's main folder:

```bash
# 1. Copy the toolkit into your project:
npx degit jsulystio/design-system-skill/design-system design-system

# 2. Wire it in:
node design-system/install.mjs --scripts

# 3. Try it with the built-in samples (no Figma needed yet):
node design-system/scripts/build.mjs
npx serve design-system/site        # opens a preview of the docs site
```

If step 3 prints `Built: 261 tokens, 52 component pages` and a docs site opens,
you are good. That is the built-in AlignUI-based template, usable before you
connect any Figma file.

---

## Connect your real Figma designs

The setup above works against sample data so you can see it in action. When you
are ready to use your own designs:

1. In Figma, open your file. The Figma MCP server or the Figma Desktop Bridge
   plugin reads variables, screens, and component usage. Any Figma plan works.
2. In Claude Code, say *"bootstrap the design system"*.
3. Claude reads your variables, scans screens for component instances and raw
   values, proposes a first organized system, and shows it to you for approval
   before saving anything.

Extraction is a bit messy by nature, so expect to rename or merge a few things.
Claude asks first.

---

## Keeping it up to date

Two parts update differently: the **skill instructions** (what Claude reads) and
the **toolkit** (the `design-system/` folder copied into each project — scripts,
template, docs).

### The skill instructions — automatic (Option 1)

With the Option 1 symlink, the skill points straight at your local clone, so it
is current the moment the clone is. To make that hands-off, add a `SessionStart`
hook to `~/.claude/settings.json` that pulls the clone before each Claude session:

```json
"hooks": {
  "SessionStart": [
    { "hooks": [ { "type": "command", "command": "git -C ~/design-system-skill pull --ff-only --quiet >/dev/null 2>&1 &" } ] }
  ]
}
```

The trailing `&` backgrounds the pull so it never delays or blocks startup;
`--ff-only` means a stray local edit becomes a skipped pull, never a merge
conflict. With this in place, every project that uses the global skill stays on
the latest version automatically.

### Manual update — anytime

Prefer to pull on demand, or don't want a hook? Update the clone yourself:

```bash
git -C ~/design-system-skill pull
```

Every project using the Option 1 symlink picks it up on the next Claude session.

### The toolkit copied into a project (Option 2)

The `design-system/` folder `degit` copied into a project is a snapshot, not a
symlink, so it does **not** auto-update. Refresh it by re-running the copy with
`--force`. Full details, including how to protect your own bootstrapped data, are
in [design-system/README.md](design-system/README.md#updating).

---

## If something goes wrong

**`command not found: node`**: Node.js is not installed. Get it at
[nodejs.org](https://nodejs.org), then try again.

**You see `falling back to git clone` and a folder inside a folder
(`design-system/design-system`).** This can happen with the copy command on some
setups. Fix it by flattening the folder once:

```bash
mv design-system __tmp && mv __tmp/design-system design-system && rm -rf __tmp
```

**The shortcut from Option 1 stopped working** (you moved the downloaded folder).
Point it at the new location:

```bash
ln -sfn /new/path/to/design-system-skill/design-system/skill/design-system ~/.claude/skills/design-system
```

---

## A few words explained

- **Design tokens:** your colors, spacing, and fonts saved as named, reusable
  values instead of scattered raw numbers.
- **Figma variables:** Figma's built-in way to store those values. This tool
  treats them as the single source of truth.
- **Drift:** when a screen uses a color or spacing that is not part of the
  system. The drift checker catches it early.
- **Bootstrap:** the first-time step that pulls a starter system out of your
  existing Figma file.
- **Refresh from approved screens:** after a client approves one explored UI
  direction, the step that detects its colors and components (expanding each to
  its full set of states) and folds them into the system, then writes the result
  back to Figma, your code, and the docs.

---

## Learn more

- **[design-system/README.md](design-system/README.md):** the full technical
  guide. How the pipeline works, using tokens in your app, hosting the docs, and
  uninstalling.
- **[The skill itself](design-system/skill/design-system/SKILL.md):** what Claude
  follows for each flow.
