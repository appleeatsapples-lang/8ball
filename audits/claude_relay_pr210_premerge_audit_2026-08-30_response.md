# Cross-model pre-merge audit — PR #210

**PR:** #210 — Kua citation bodies rendered — the F4 call resolved as render
**Branch:** `claude/eight-ball-app-testing-rqphfo` (restarted from `main` @ `96fac8f` after PR #209 merged)
**Heads reviewed:** `d157b39` (the feature as opened); the sonnet BLOCKER
fix landed as `005a97c` mid-review and was re-verified by the opus lane;
the remaining fixes land with this artifact's commit.
**Date:** 2026-08-30
**Auditor:** in-container two-lane review (opus + sonnet), fresh context
each, reconciled by the authoring session (fable) — same composition and
weighting note as the pr208/pr209 artifacts: same-family lanes with an
author-reconciler; every finding re-verified against source before
disposition. Per L48 this response does not self-clear the PR.

## Verdicts

- sonnet: **MERGE WITH FIXES** (1 BLOCKER, reproduced against the real module)
- opus: **MERGE WITH FIXES** (BLOCKER independently reproduced; 1 coverage
  hole proven by mutation; 3 smaller items)
- **Reconciled: MERGE WITH FIXES — everything fix-class is landed
  (`005a97c` + this artifact's commit). SAFE TO MERGE per this
  artifact's own read, pending the controller's read and the explicit
  merge word (§10/L48).**

## Findings — fixed

1. **BLOCKER (sonnet; independently reproduced by opus)** — the first
   body render wrote two new sheet nodes without extending
   `ui/sheet.js`'s `valueNodes()`, whose own comment promises "every
   node this instance can write" and from which `clear()` derives. So
   `ui/dyad.js`'s `clearOutput()`/`submitSecond()` left a stale
   citation sentence in live hidden DOM after an invalidated
   resubmission — verbatim the PR #187 F1 defect class the module
   documents as closed. Both lanes reproduced it against the real
   module before any fix existed. **Fixed** (`005a97c`): the two body
   slots join `valueNodes()`; regression test added in the sheet-parity
   block, adapted from the existing public-bridge `clear()` pattern;
   mutation-verified (reverting only the list extension reds exactly
   that pin). The opus lane re-verified the fix's scope independently.
2. **MED (opus, mutation-proven coverage hole)** — deleting both body
   `<div>`s from `resolveKuaRoot`'s injected markup, or typo-ing the
   `qq('.kua-body-primary')` selector, left the full suite green: the
   DI-refs tests exercise the handed-in-nodes path, and nothing pinned
   the production markup/selector path — this PR's entire deliverable
   was silently deletable from the host card under clean CI (the #208
   "pin the failure mode" lesson, one more time). **Fixed:** source
   pins on the injected markup classes and every production selector,
   the pre-existing slots included since the same mutant class takes
   them too. Both opus mutants re-run: each red on the new pin.
3. **LOW (opus)** — `read.primaryBody` was written bare where the three
   sibling writes guard with `|| ''`. **Fixed** for symmetry.
4. **LOW (opus)** — the journal entry's verification block was stale
   (1952; no fix commit). **Fixed:** a same-session update paragraph
   records the review, the BLOCKER, and the final count.

## Flagged, queued — not this PR's

- **DOCTRINE §1.D v0.64 still calls the F4 item "an open product
  call"** — now answered (render). The journal is current-state
  authority (CLAUDE.md) and records the resolution; the mechanical
  clause update is queued for the next doctrine PR rather than dragging
  a DOCTRINE gate cycle into a ui change.

## Ruled out / confirmed (lanes' own verification, not the author's)

Opus swept 1900–2100 through the real engine: exactly nine
`(male, female, remap)` combinations exist, the unique equal case is
3/3 at solar digit-sum 8 (the PR's 1979 claim exactly), no year
produces two remaps, and the once-only invariant held on every sample.
Sonnet hand-swept the arithmetic over the full 9-value domain to the
same conclusion. Both confirmed: `content/kua.v1.js` byte-untouched
with bodies rendered byte-equal and `register` unrendered by design;
sealed-DOM purity on both surfaces (free-tier live-fire shows no
citation substring anywhere in the document); host and dyad sheets
share the one producer (`kuaReadFor`) and render identically at t3/t5;
block growth 52→335px with no overflow at 320×568; `ui/share.js` never
touches the block; repo-shape counts and budgets hold.

## Verification after all fixes

Suite **57 files / 1954 tests green** (1952 at open, +1
clear-inventory pin, +1 markup/selector pin). Product audit PASS, 0
blocking. Mutation matrix: the sonnet BLOCKER revert, the two opus
markup/selector mutants, and the six feature-revert pins — each red on
exactly its pin; restored, green. `git diff --check` clean. This
artifact's filename carries pr210, so its commit also greens the
l48-gate.
