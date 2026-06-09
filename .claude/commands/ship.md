---
description: Quality gate → sync docs with current code → commit
---

Run the full pre-commit workflow in order. Stop and ask if a step needs a judgment call you shouldn't make alone (e.g. ambiguous lint failure, non-obvious doc drift, risky commit scope).

1. **Quality gate.** Run `npm run check` (format:check + lint + typecheck across all workspaces). If anything fails, try the obvious auto-fixes first — `npm run format` for formatting, `eslint . --fix` per workspace for lint — then re-run. Don't proceed to commit while the gate is red; surface what's left and ask.

2. **Doc sync.** Audit the docs against the current code state. Files to skim: `CLAUDE.md`, `docs/ARCHITECTURE.md`, `docs/SPEC.md`, `docs/implementation-plan.md`, `README.md`. Look for drift:
   - API endpoints in SPEC vs controllers actually present in `apps/api/src/**/*.controller.ts`
   - Module list in `docs/ARCHITECTURE.md` tree vs folders in `apps/api/src/`
   - Status checklist in `docs/implementation-plan.md §7` vs what's actually built
   - File paths referenced in CLAUDE.md / README.md vs what exists on disk
   - Commands documented vs scripts in `package.json`
   - Stale present-tense claims that contradict reality (e.g. "X is implemented" when the file doesn't exist, or vice versa)

   Update what's drifted; **leave the rest alone**. Do not invent new spec content. If you edit any TS file, re-run step 1.

3. **Commit.** Per the git protocol in the system prompt:
   - `git status` (without `-uall`) to see scope
   - `git diff --stat HEAD` for change summary
   - `git log --oneline -5` for commit-message style
   - If there's nothing to commit, stop and say so.
   - Otherwise: `git add -A` (the repo's `.gitignore` excludes `.env*` while keeping `.env.example` templates — verify with `git check-ignore` first if you've touched secrets-adjacent files).
   - Commit with a conventional-commits message via HEREDOC. Title under 70 chars, focused on the _why_. Body lists what landed concretely. Include the standard `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` line.
   - Run `git status` afterward to verify the tree is clean.

Never use `--no-verify`, never amend, never force-push. Don't commit `.env`, `.env.local`, or anything with secrets — if `git status` shows one staged, abort and warn.
