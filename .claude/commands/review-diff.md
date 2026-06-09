---
description: Subagent code review of uncommitted changes
argument-hint: "[optional focus, e.g. security, types, naming]"
---

Run the **`diff-reviewer`** subagent on the current uncommitted changes. Use the `Agent` tool with `subagent_type: "diff-reviewer"` and `description: "Review uncommitted diff"`. The agent already carries the full review charter (boundary / Zod / sanitization / severity+confidence) and is scoped to read-only tools.

If the user passed a focus area (`$ARGUMENTS`), append to the agent prompt: "Focus especially on: $ARGUMENTS."

After the subagent returns, surface its report as-is. Do not layer your own review on top — that's the subagent's job. If a finding looks wrong on a quick check, flag the disagreement to the user, but don't silently override it.
