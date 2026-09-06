---
name: site-check
description: >-
  Use as the single entry point for any website self-check or audit request, when the
  user says "self-check / health check / is this page right / something feels off /
  looks weird / check the whole site" without specifying the exact layer. This skill
  routes to the right sub-skill (visual-verify for rendering or layout issues on a
  single page, ai-vibe-governance for behavioral or systemic issues across the site,
  or both for a full-site check). It is a dispatcher only, and it does not
  re-implement the sub-skills' logic. Not for greenfield feature work.
version: 1.0.0
user-invocable: true
argument-hint: "[page url|file | full-site | what feels off]"
license: MIT
allowed-tools:
  - Read(skills/visual-verify/SKILL.md)
  - Read(skills/ai-vibe-governance/SKILL.md)
---

# Site Check — the single entry point for website self-checks

A **dispatcher**: it decides which sub-skill to call and in what order. It does not copy or replace the sub-skills' logic — it only routes.

> English version. The canonical (Chinese) file is `SKILL.md` — do not edit this one when updating the skill.

## Routing table

Decide which sub-skill to call based on what the user is asking for:

| User request | Routes to | Why |
|---|---|---|
| "This page looks weird / wrong color / overlapping / broken effect" | **visual-verify** | Rendering-layer issue, single-point visual check |
| "Something's off / clicking does nothing / result was lost / conclusions contradict / it errors out" | **ai-vibe-governance** | Behavior/logic-layer issue, decomposed with the 6-dimension SOP |
| "Give the whole site a health check / self-check / audit the entire site" | **Both** (see the combined flow below) | A complete self-check loop |
| "Is the PDF / chart / card rendering correctly" | **visual-verify** | Rendering verification for a specific visible artifact |
| "Is the code okay / any landmines / I want to harden it" | **ai-vibe-governance** | Systematic code-level investigation |
| "A button jumps to the wrong page / the label and the destination disagree" | **route-governance** | Routing-layer governance, needs a unified route constant table |

## Combined flow (for a full-site health check)

When the user asks for a whole-site check, orchestrate as follows:

```
1. ai-vibe-governance · four phases
   ├─ Phase 1 Audit: three-perspective scan → problem list
   ├─ Phase 2 Triage: red-line vs. polish, hand priority decisions to the user
   ├─ Phase 3 Batched fixes: plan → user confirms → fix → independent regression
   └─ Phase 4 Regression: site-wide smoke test, 0 errors
2. visual-verify · visual wrap-up
   ├─ Screenshot key pages (desktop / full-page / mobile)
   └─ Vision check that rendering matches expectations
```

That is: **check behavior first (does it even work) → then confirm rendering (does it look right)**. The two tracks are complementary.

## Explicitly out of scope

- **Do not re-implement** visual-verify or ai-vibe-governance checks — each of them is authoritative on its own
- **Do not skip user confirmation**: anything that writes, modifies, or deletes still follows the sub-skills' batched confirmation rule
- **Do not escalate a single-page visual issue into a full-site governance run** (wasted cost), and not the other way around either

## Decision principles

- The request is vague → ask one question first: is this "check one page's rendering" or "whole-site health check"? Don't make the user guess
- Names a specific page + visual words (color / layout / overlap) → single-point visual
- Names behavior words (no response / lost / error / contradiction) → behavior investigation
- Names "whole site / health check / overall" → combined flow

## References

- Visual verification sub-skill: `skills/visual-verify/SKILL.md`
- Governance sub-skill: `skills/ai-vibe-governance/SKILL.md`
- Routing governance sub-skill: `skills/route-governance/SKILL.md`

## A note on paths

The `allowed-tools` field in frontmatter and the reference links use paths **relative to the repository root**. If your host tool does not resolve relative paths, replace the prefix with the actual absolute path of your repository — a one-time edit that only affects this file's tool allowlist declaration.
