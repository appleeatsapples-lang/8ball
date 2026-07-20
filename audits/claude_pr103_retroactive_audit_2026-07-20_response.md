# Claude retroactive independent audit — PR #103

**PR:** #103 — test+docs: content_shape pins · city-CSS headroom · §6 Netlify Pro
**Merge:** `4c272c3` (squash) · **Base:** `ff6efda` (#101) · **Date:** 2026-07-20
**Reviewer:** Claude (Claude Code audit lane — non-author; the implementer lane was Grok)
**Kind:** retroactive post-merge, per the #89–#91 retroactive-verdict precedent

## Why retroactive

The in-PR L48 artifact (`audits/grok_pr103_premerge_audit_2026-07-20_response.md`)
satisfied the gate's presence check but names itself a **self-audit by the
implementer lane**, and the merge word landed ~2 minutes after the PR opened.
That is the letter of the gate without its substance — logged as **L48
sighting #7** (first self-audit shape). This document is the independent
non-author closure.

## Method

Full merged-diff read (all 8 files), then verification on the merged tree in a
fresh worktree install (`NODE_ENV=development npm ci --include=dev`):

- Suite: **1299/1299 (37 files)** under vitest 4.1.9 — matches the PR claim.
- Local PII audit: **clean (112 files)** (gitignored baseline copied in per the
  standing worktree gap).
- `index.html`: **1464/1500** (`wc -l`), city-list CSS block replaced by a
  one-line pointer comment.
- Prod fetch: deployed document is 1464 lines with the inline city-CSS block
  absent; served `ui/citysearch.js` carries the `citysearch-style` inject.
  Prod = merged tree.

## Per-leg findings

| Leg | Verdict |
|-----|---------|
| `tests/content_shape.test.js` | Sound. Characterization pins only — imports the deck read-only, edits nothing (§4 immutability held). The four pins are proven true by the green suite, so they document rather than assert hope. |
| City-CSS move | Sound. Byte-equivalent rules relocated into `injectStyle()` on the `meanings`/`readings` precedent; injection happens at `initCitySearchUI` (before any suggestion can render); partial-document mock guard fails soft; shared polar/legacy/field-error rules correctly stay in the shell. |
| DOCTRINE §6 Netlify Pro | Correctly classified mechanical: restores ops truth already canonical in 8BALL.md/README since the #87 doc-truth batch, with the in-line correction note and the classification artifact. No rule, mechanic, or product text changed. |
| CLAUDE.md count 36→37 | In lockstep with the new test file; `repo_shape` pin green. |
| Journal | Entry present; #101 STAGED→SHIPPED flip included. (The entry's own STAGED header went stale on merge — flipped in the audit-sweep commit carrying this file.) |

## Notes (no action demanded)

- LOW: `opener()` strips only a trailing comma from the first token; robust for
  the current deck (suite-proven), worth revisiting only if v2 authoring changes
  punctuation habits.
- Cosmetic: the entry says "~34 free" headroom; actual is 36 by `wc -l`
  (35 against the effective 1499 cap noted in the rebase note).

## Verdict

**SAFE TO MERGE (retroactive) — zero P0/P1.** The merged state is verified
sound; the process gap, not the diff, was the defect. Sighting #7 closed.
