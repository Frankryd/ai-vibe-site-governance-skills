---
name: ai-vibe-governance
description: >-
  Use when a site or project was built by AI multi-round iteration (vibe-coded) and
  needs a systematic audit plus remediation, when the user reports things "feel off /
  weird" but cannot describe technical details, or wants to harden an AI-generated
  codebase against its characteristic failure modes, including fragmented code,
  duplicated logic, schema drift, dead code, silent errors, state loss, and security
  vectors. Provides the full governance workflow, covering scan (code, interaction,
  automation), triage (red-line vs. polish), batched fixes with human confirmation,
  and regression. Pair with the visual-verify skill for the visual acceptance step.
  Not for greenfield feature work or non-AI-generated codebases.
version: 1.0.0
user-invocable: true
argument-hint: "[project path] [scope: full|code|interaction|automation]"
license: MIT
allowed-tools:
  - Bash(node skills/ai-vibe-governance/scripts/smoke-template.js *)
---

# AI-Vibe Site Governance

Runs a **systematic audit and remediation** on a site produced by multi-round AI iteration. Core belief: problems in these sites are not scattered bugs but systemic, cross-file ones — so build the criteria first, then touch code. Otherwise you end up whacking at random.

> English version. The canonical (Chinese) file is `SKILL.md` — do not edit this one when updating the skill.

## When to use

- An AI-generated / multi-round stitched site where the user says "something feels off / this is weird" but cannot describe the technical detail
- AI-generated code that needs a systematic hardening pass (correctness / data flow / security / state / cleanup)
- Producing a problem list a non-specialist user can review

**Do not use for**: greenfield feature work, or conventional non-AI-generated codebases.

## Core principles

1. **Standards-first** — build the criteria (red-line / polish grading) before scanning; no code changes until the standard exists
2. **Two-track verification** — functional (Playwright assertions) and visual (visual-verify skill) are separate, complementary, and never replace each other
3. **Batched confirmation** — each fix batch is: propose → human confirms or rejects → fix → independent regression → only then move to the next batch
4. **Responsibility boundary** — the human only describes the feeling and confirms priority/plan; the agent owns decomposition, localization, analysis, fixing, and regression
5. **No unilateral action** — every write/modify/delete is confirmed by the human first; never initiate one directly

## Four-phase main flow

### Phase 1 — Audit (scan)

Three perspectives in parallel, each producing output independently:
- **Code layer** (static): dead code, duplicate implementations, schema drift, security vectors, empty catch blocks, stale comments → see `reference/scan-checklist.md`
- **Interaction layer** (6 dimensions): navigation / back / state / edge cases / consistency / refresh → see `reference/sop-6dimensions.md`
- **Automation layer** (runtime): Playwright anomaly probing (clicks that error, unsynced state, dynamic content) → start from `scripts/smoke-template.js`

Produce a **problem list**: follow `reference/report-template.md`; every item includes **symptom (in plain words) / severity / location (file:line) / reproduction steps**.

### Phase 2 — Triage (the human only sets priority)

- **Red-line must-check** (P0): affects correctness / usability / security — all of them must pass
- **Polish** (P1/P2): tidiness — each item gets a **fix / delete / keep** decision

Hand the list to the human to confirm priority. The human does not decompose the technology.

### Phase 3 — Batched fixes (each batch regresses independently)

Batch by theme (4–7 items per batch), flow:
1. Propose the batch plan (which files, why, risk)
2. Human confirms or rejects (confirmation only, no technical detail)
3. Fix
4. Playwright regression for that batch + site-wide smoke test
5. Move to the next batch only after it passes

### Phase 4 — Regression

- Site-wide smoke test (`scripts/smoke-template.js`), 0 pageerror / 0 console.error
- Visual wrap-up: call the `visual-verify` skill for screenshots + visual inspection, confirming rendering matches expectations
- Confirm red-lines are cleared and nothing new was introduced

## Technical fix patterns, quick reference

Generic remedies for the 8 most common AI-vibe traps → details in `reference/fix-patterns.md`:

| Pitfall | Fix |
|---|---|
| Same algorithm implemented several ways, with divergent behavior | Extract a single entry point (shared function), delete the hand-rolled copies |
| localStorage schema drift | Normalize before writing + tolerate on read, single entry point |
| Leftover function landmines (ReferenceError) | A shared script provides a global safe shim that never throws |
| Rendered results lost the moment they leave memory | Persist to localStorage, restore on refresh/back |
| toast / feedback silently no-ops | The feedback function creates its own DOM node if missing |
| User input concatenated into innerHTML | Always escapeHtml |
| Validation written after the business logic | Hoist validation to the top of the function |
| State hardcoded per page | Data-driven, computed automatically from the route |

## References

- Scan checklist: `reference/scan-checklist.md`
- 6-dimension SOP: `reference/sop-6dimensions.md`
- Fix patterns: `reference/fix-patterns.md`
- Report template: `reference/report-template.md`
- Smoke script template: `scripts/smoke-template.js`
- Visual verification: `skills/visual-verify/SKILL.md`

## A note on paths

The `allowed-tools` field in frontmatter and the examples use paths **relative to the repository root**. If your host tool does not resolve relative paths, replace the prefix with the actual absolute path of your repository — this only affects this file's tool allowlist declaration; the scripts do not depend on it.
