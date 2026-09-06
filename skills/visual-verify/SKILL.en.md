---
name: visual-verify
description: >-
  Use when a UI or visual change needs to be verified against expected rendering, after
  editing pages, components, PDFs, charts, cards, or responsive layouts, or when the
  user reports something "looks off / weird / the effect is wrong" but cannot describe
  the technical detail. Provides the visual-verification workflow, which captures
  screenshots (desktop, mobile, full-page) with Playwright and inspects them with a
  vision-capable model against a written "expected effect" baseline. Pair with
  functional verification via DOM assertions, since visual checks confirm how it
  renders rather than only that it runs. Not for backend-only or pure-logic changes
  that have no visible surface.
version: 1.0.0
user-invocable: true
argument-hint: "[target url|file] [expected effect]"
license: MIT
allowed-tools:
  - Bash(node skills/visual-verify/scripts/analyze-image.js *)
---

# Visual Verify

Verifies **what a page or component actually looks like when rendered**. Functional correctness (does it run) belongs to Playwright DOM assertions; **visual correctness (does it look right) belongs to this skill**.

> English version. The canonical (Chinese) file is `SKILL.md` — do not edit this one when updating the skill.

## When to use

- You changed anything with a visible surface (page, card, chart, PDF, responsive layout, hover/animation)
- The user says "something looks off here / it looks weird / the effect is wrong" but cannot describe the technical detail → this skill breaks the visual dimensions apart for you
- Functional verification (DOM assertions) passes, but you still have not confirmed that the rendering is correct

**Do not use for**: pure logic or backend changes with no visible output.

## Core principles

1. **State the expectation first** — write down clearly what it *should* look like (1–2 sentences of comparison baseline) before verifying. Otherwise you are deciding "what was I aiming for?" only after the fact
2. **Two tracks, kept separate** — functional verification (Playwright assertions) and visual verification (screenshot + vision model) complement each other and never replace each other
3. **Check items must be specific to the feature** — not a vague "see if there's anything wrong", but "does the five-row bar have 5 bars, is the current month highlighted, does mobile overflow"
4. **The vision model is pluggable** — the script only hands the image to "any LLM API that accepts image input"; it is not bound to any vendor. You supply your own key and your own endpoint

## Workflow

### Step 1 — State the expected effect (mandatory)

Confirm with the user, or read the expected rendering from the change record. If you cannot write it down, fall back to one sentence: "This card should show X, laid out as Y, colored Z."

### Step 2 — Functional verification (Playwright DOM, optional but recommended)

Drive real interactions and assert that key elements exist and that there are no JS errors. Only after "it works" is established do you move to the visual layer.

### Step 3 — Screenshot (Playwright)

Screenshot the target page; three kinds as needed:
- First screen `*-desktop.png` (1440×900)
- Full page `*-full.png` (fullPage:true)
- Mobile `*-mobile.png` (390×844, required when mobile adaptation is in scope)

Save them to the project's `audit/screenshots/` (create it if missing).

### Step 4 — Visual inspection (vision model)

```
node skills/visual-verify/scripts/analyze-image.js <screenshot path> "<specific check items>"
```

Check-item template (combine as needed, always be specific):
- **Layout**: are elements overlapping, misaligned, overflowing, horizontally scrolling, are gaps and alignment right, is whitespace sensible
- **Graphics**: are canvas/SVG elements drawn, are colors distinguishable, are labels legible, is the legend readable
- **Text**: legible, not clipped, no mojibake, sufficient contrast
- **Mobile**: tap targets large enough, correct stacking, no horizontal overflow
- **State**: do hover / active / disabled states give visual feedback

### Step 5 — Verdict and fix

- Check each item against the expected effect (Pass/Fail)
- Problem found → locate the specific element → fix → re-screenshot → re-verify (at most two rounds; do not polish endlessly)
- Record the result

### Step 6 — Record

- Update the corresponding change checklist status
- Note briefly in `audit/vision-notes.md` (or the acceptance checklist): item + conclusion + screenshot path

## About the vision inspection script

- Location: `skills/visual-verify/scripts/analyze-image.js` (relative to the repository root)
- Engine: **any OpenAI-compatible vision API** — configured through environment variables, not bound to a vendor
  - `VISION_API_KEY` (required): your API key
  - `VISION_BASE_URL` (optional, defaults to `https://api.openai.com/v1`): any gateway compatible with `/chat/completions`
  - `VISION_MODEL` (optional, defaults to `gpt-4o`): name of a model that accepts image input
  - The three can also be written in a `.env` next to the script (the script has a built-in lightweight parser; environment variables take precedence)
- Dependencies: zero third-party modules; run directly with `node` (Node 18+ ships with fetch)
- Usage variants:
  - `node skills/visual-verify/scripts/analyze-image.js <local image> "<question>"`
  - `node skills/visual-verify/scripts/analyze-image.js --url <image URL> "<question>"`
- When no key is configured it prints a friendly hint and exits with a non-zero code — no crash, no leakage

## Visual check checklist (quick reference)

| Category | Checkpoints |
|---|---|
| Layout | overlap / misalignment / overflow / horizontal scroll / gaps / alignment / whitespace |
| Graphics | canvas/SVG drawn / color distinction / labels / legend |
| Text | legibility / clipping / mojibake / contrast |
| Responsive | 390px stacking / tap targets / no overflow |
| State | hover / active / disabled / loading / empty |

## References

- Existing acceptance workflow template: `skills/ai-vibe-governance/reference/workflow.md`
- The two-track separation of governance and visuals is a core convention of this suite: first prove "it runs", then prove "it looks right"

## A note on paths

The `allowed-tools` field in frontmatter and the script examples use paths **relative to the repository root**. If your host tool does not resolve relative paths, replace the prefix with the actual absolute path of your repository — this only affects this file's tool allowlist declaration; the script itself does not depend on it.
