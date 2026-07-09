# Design System Skill

A drop-in toolkit plus a Claude skill that lets you stand up and maintain a
living design system on **any project**, with **Figma variables as the single
source of truth**. From that one source it generates design tokens, a Tailwind
theme, CSS custom properties, and a self-updating docs site — and it ships a
linter that flags drift before it reaches engineering handoff.

Everything lives in a single self-contained `design-system/` folder. It never
touches your repo root, has zero npm dependencies, and has a clean uninstall.

---

## Requirements

- **Node.js 18 or newer** (`node --version`). Nothing else is needed to build.
- A Figma file with variables and components — *any plan* — for the real
  bootstrap. (You can try everything below against bundled samples first, with
  no Figma at all.)

---

## Quick start

Run these three steps **from the root of your own project repo**.

```bash
# 1. Pull the toolkit into your repo:
npx degit jsulystio/design-system-skill/design-system design-system

# 2. Wire it in (copies the skill to .claude/skills/, adds ds:* npm scripts):
node design-system/install.mjs --scripts

# 3. Confirm it builds against the bundled samples (no Figma needed yet):
node design-system/scripts/build.mjs
npx serve design-system/site        # preview the docs
```

If step 3 prints `Built: 46 tokens, 5 component pages -> site/` and the preview
opens a themed docs site, you're set up correctly.

### What each step does

1. **`degit`** copies just the `design-system/` folder (no git history) into your
   project.
2. **`install.mjs --scripts`** is non-destructive: it copies the Claude skill to
   `.claude/skills/design-system` so Claude can discover it, and adds four
   `ds:*` scripts to your `package.json`:
   | Script | Does |
   |---|---|
   | `npm run ds:pull` | Pull latest variables from Figma |
   | `npm run ds:build` | Regenerate tokens, Tailwind theme, and docs |
   | `npm run ds:lint` | Flag raw values + uninventoried components |
   | `npm run ds:sync` | pull + build + lint in one command |
3. **`build.mjs`** generates the tokens and the docs site so you can see the
   whole pipeline work before connecting any Figma file.

> Prefer not to add npm scripts? Drop `--scripts` — the installer will just print
> them for you to paste manually. Other flags: `--force` updates an already
> installed skill, `--with-pages` adds an optional GitHub Pages workflow.

---

## Troubleshooting

**`tar snapshot download or extraction failed; falling back to git clone`, and
then a nested `design-system/design-system/` folder.**

This happens when the source repo is **private**: degit can't use its fast
tarball path (which honors subdirectories), so it falls back to a full git clone
that copies the *entire* repo one level too deep. Two ways to avoid it:

- **Preferred:** use this toolkit from a **public** repo, so the clean `degit`
  one-liner works with no auth and no nesting.
- **If it already nested**, flatten it once:
  ```bash
  mv design-system __ds_wrap && mv __ds_wrap/design-system design-system && rm -rf __ds_wrap
  ```

---

## Updating when this repo has new commits

`degit` is a one-time fetch, not a package manager — re-running it **overwrites**
the folder. That matters once you've bootstrapped, because the folder then holds
files **you own** (`tokens/figma.raw.json`, `inventory/components.json`,
`figma.config.json`, and `code-connect/`). Pick the path that fits your state:

**Still on the bundled samples (not bootstrapped yet):** just force-refetch.

```bash
npx degit jsulystio/design-system-skill/design-system design-system --force
node design-system/install.mjs --force   # refresh the installed skill copy
npm run ds:build
```

**Already bootstrapped (you have real data):** commit first so git is your safety
net, refetch the tooling, then restore your owned files.

```bash
git add design-system && git commit -m "snapshot before DS update"
npx degit jsulystio/design-system-skill/design-system design-system --force
git checkout -- design-system/tokens/figma.raw.json \
                design-system/inventory/components.json \
                design-system/figma.config.json \
                design-system/code-connect
git diff --stat        # review exactly which tooling files changed
node design-system/install.mjs --force && npm run ds:build
```

Generated files (`tokens.json`, `variables.css`, `tailwind.theme.js`, `site/`)
are gitignored and rebuilt by `ds:build`, so they never need manual restoring.

---

## Next: bootstrap from your Figma file

The steps above prove the pipeline against samples. To replace them with your
real system, open your repo in **Claude Code** or **Cowork** (the skill is now
installed) and invoke a flow in plain language:

- **Bootstrap** — start the Figma Desktop Bridge on your file, then ask Claude to
  *"bootstrap the design system"*. It reads your variables and components through
  the bridge (any plan) and proposes a first token set and component inventory.
- **Resolve drift** — after `ds:lint` reports issues, ask *"resolve the drift"*
  and Claude proposes token snaps or new tokens for approval.
- **Propagate change** — ask e.g. *"make primary warmer and radius/md go from 8
  to 4"* and Claude restates it as exact variable edits, notes the blast radius,
  and (on approval) applies them at the source so tokens, docs, and code all
  follow.

Set your project name and Figma file key in `design-system/figma.config.json`.

---

## Learn more

- **[design-system/README.md](design-system/README.md)** — full documentation:
  bootstrap paths, the daily loop, consuming tokens in your app, hosting the
  docs, what's generated vs. owned, and uninstall.
- **[design-system/skill/design-system/SKILL.md](design-system/skill/design-system/SKILL.md)**
  — the Claude skill and its three flows.
