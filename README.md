# Design System Skill

**Keep your product's colors, spacing, fonts, and components consistent — from
Figma all the way to code — without doing it by hand.**

You design in Figma as you normally would. This tool reads your Figma variables
(your colors, spacing, type, and so on) and turns them into a tidy set of
reusable values, a live documentation website, and code your engineers can drop
straight in. When you change something in Figma, one command updates everything
else to match. No copy-pasting hex codes, no "which blue was that again?", no
design that quietly drifts away from the build.

Most of the time you just **talk to Claude in plain English** — it does the
mechanical work for you.

---

## Who this is for

- **Designers** — the main audience. Keep designing in Figma; let this keep your
  system organized and in sync. You don't need to write code.
- **Engineers** — get the real, up-to-date colors and components instead of
  guessing at handoff.
- **Anyone inheriting a project** — open the docs site and instantly understand
  the system.

---

## What you get

- **Design tokens** — your colors, spacing, and type saved as reusable values
  (light and dark themes included).
- **A live docs website** — one page per component, styled by the very tokens it
  documents, so it's always accurate.
- **Ready-to-use code** — a theme file engineers plug straight into the app.
- **A drift checker** — flags anything in your designs that doesn't match the
  system *before* it reaches engineering.

---

## How you'll actually use it day to day

Once it's set up (see below), you mostly just ask Claude. Open your project in
Claude Code and say things like:

| Just say… | And Claude will… |
|---|---|
| *"Set up the design system"* | Create everything and pull your Figma colors/components into a first system |
| *"Resolve the drift"* | Find anything that doesn't match the system and propose fixes for your approval |
| *"Make the primary color warmer and buttons less round"* | Turn that into the exact changes and update your tokens, docs, and code |

That's the everyday experience. The setup below is a one-time thing.

---

## Before you start

You'll need a few free things. If any of this looks unfamiliar, a developer
teammate can do the one-time setup in a couple of minutes.

- **Claude Code** (or Cowork) — the app that runs this skill. You're likely
  already in it.
- **Node.js, version 18 or newer** — a free tool that runs the behind-the-scenes
  scripts. Check by opening a terminal and running `node --version`. If it's
  missing, download it from [nodejs.org](https://nodejs.org).
- **A Figma file** with your colors and components — *any Figma plan works.* You
  only need this when you're ready to connect your real designs; you can try
  everything first with the built-in sample data.

---

## Setup — pick one

### Option 1 — Install once, use in every project *(recommended)*

Do this **one time on your computer.** After that, you never set up again — just
open any project and talk to Claude.

```bash
# 1. Download the toolkit to your computer (keep this folder around):
git clone https://github.com/jsulystio/design-system-skill.git ~/design-system-skill

# 2. Make Claude aware of it in every project:
ln -s ~/design-system-skill/design-system/skill/design-system ~/.claude/skills/design-system
```

That's it. Now, in **any** project, open it in Claude Code and say
*"set up the design system"* — Claude automatically adds the toolkit to that
project and gets you started. No cloning, ever again.

> Keep the downloaded `~/design-system-skill` folder where it is — the shortcut
> in step 2 points to it. To get later improvements, just run `cd
> ~/design-system-skill && git pull` and every project picks them up
> automatically.

### Option 2 — Add it to a single project by hand

Prefer to set up just one project (or you're a developer who likes to see the
files)? From that project's main folder:

```bash
# 1. Copy the toolkit into your project:
npx degit jsulystio/design-system-skill/design-system design-system

# 2. Wire it in:
node design-system/install.mjs --scripts

# 3. Try it with the built-in samples (no Figma needed yet):
node design-system/scripts/build.mjs
npx serve design-system/site        # opens a preview of the docs site
```

If step 3 prints `Built: 46 tokens, 5 component pages` and a docs site opens,
you're good.

---

## Connect your real Figma designs

The setup above works against sample data so you can see it in action. When
you're ready to use your *own* designs:

1. In Figma, start the **Figma Desktop Bridge** plugin on your file. (This is how
   the tool reads your variables — it works on any Figma plan.)
2. In Claude Code, say *"bootstrap the design system"*.
3. Claude reads your colors and components, proposes a first organized system,
   and shows it to you for approval before saving anything.

Extraction is a bit messy by nature, so expect to rename or merge a few things —
Claude asks first.

---

## Keeping it up to date

- **If you used Option 1:** run `cd ~/design-system-skill && git pull`. Every
  project updates automatically — nothing else to do.
- **If you used Option 2:** re-run the copy command with `--force`. Full details
  (including how to protect your own data) are in
  [design-system/README.md](design-system/README.md#updating).

---

## If something goes wrong

**`command not found: node`** — Node.js isn't installed. Get it at
[nodejs.org](https://nodejs.org), then try again.

**You see `falling back to git clone` and a folder inside a folder
(`design-system/design-system`).** This can happen with the copy command on some
setups. Fix it by flattening the folder once:

```bash
mv design-system __tmp && mv __tmp/design-system design-system && rm -rf __tmp
```

**The shortcut from Option 1 stopped working** (you moved the downloaded
folder). Point it at the new location:

```bash
ln -sfn /new/path/to/design-system-skill/design-system/skill/design-system ~/.claude/skills/design-system
```

---

## A few words explained

- **Design tokens** — your colors, spacing, and fonts saved as named, reusable
  values instead of scattered raw numbers.
- **Figma variables** — Figma's built-in way to store those values. This tool
  treats them as the single source of truth.
- **Drift** — when a screen uses a color or spacing that isn't part of the
  system. The drift checker catches it early.
- **Bootstrap** — the first-time step that pulls a starter system out of your
  existing Figma file.

---

## Learn more

- **[design-system/README.md](design-system/README.md)** — the full technical
  guide: how the pipeline works, using tokens in your app, hosting the docs, and
  uninstalling.
- **[The skill itself](design-system/skill/design-system/SKILL.md)** — what
  Claude follows for each flow.
