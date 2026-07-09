# Bootstrap: first system from a working file

Goal: turn a messy WIP Figma file into a first token set, screen usage snapshot,
and component inventory without forcing a design-system-first workflow.

0. Scaffold the toolkit if this project does not have it yet. If there is no
   `design-system/` folder at the repo root, create one before anything else:

   ```bash
   npx degit jsulystio/design-system-skill/design-system design-system
   node design-system/install.mjs --scripts   # adds the ds:* npm scripts
   ```

   This is what lets the skill live globally (`~/.claude/skills/design-system`)
   while each project still gets its own scripts, tokens, and inventory. If the
   folder already exists, skip this step.

1. Follow `references/read-figma.md` to read the live file:
   - **Variables** → `tokens/figma.raw.json`
   - **Screens** → walk top-level frames, scan instances and raw values →
     `inventory/screens.json`
   - **Component definitions** → `inventory/components.json` (plus judgment to
     cluster repeated non-component layers into proposed components)

2. For component inventory entries, name each component, its props, states, and
   the tokens it uses. Mark components with no code equivalent yet as
   `"codeConnected": false`.

3. Run `node design-system/scripts/build.mjs` then
   `node design-system/scripts/lint.mjs`. Open `design-system/site/index.html`
   and confirm the foundations and component pages look right. The lint run
   should use your real `screens.json`, not the sample.

4. Present the proposed names, screen coverage, and any drift the linter found
   to the person for approval before committing. Extraction is noisy, so expect
   to merge or rename.

Do not invent tokens that are not in the file. If a screen uses raw values,
surface them as candidates rather than silently creating variables.
