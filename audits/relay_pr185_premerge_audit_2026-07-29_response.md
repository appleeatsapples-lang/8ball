# Cross-model pre-merge audit — PR #185

**PR:** #185 — feat(ui): black background / white writing supersedes Phase-2E cream lock
**Branch:** `claude/bw-monochrome-ui` (forked from `main` @ `aa8d568`)
**Date:** 2026-07-29
**Auditor:** `relay --base origin/main` fan-out (codex + grok + claude + gemini, reconciled by claude), cross-checked by an independent 25-agent internal review-and-adversarial-verify workflow run in parallel over the same commit.

## Verdict

**MERGE WITH FIXES → fixes landed, now SAFE TO MERGE** (pending operator's own read of this artifact).

## What was reviewed

The full monochrome-surface token refactor (`index.html`, `ui/citysearch.js`,
`ui/meanings.js`, `ui/readings.js`, `ui/share.js`) plus its regression test
suite (`tests/monochrome_surface.test.js`), diffed against `origin/main`.
Codex declined to review, citing no filed `audits/` brief for this PR at
review time (procedurally defensible per its own lane rules — a non-vote,
not a vote against). Gemini errored on auth. Grok and Claude both returned
substantive independent reviews and converged, unprompted, on the same root
cause from different loci.

## Findings (all independently verified against the actual diff/computed
WCAG math by both the relay reconciler and the internal workflow's
adversarial-verify pass — not taken on either review's word)

1. **`.coord-cell` border** `rgba(255,255,255,0.25)` → 2.02:1, under the 3:1
   non-text UI-component floor.
2. **`.card.seal-hatch` gradient** `rgba(255,255,255,0.20)` → 1.66:1 — the
   sealed/unresolved structural cue was reading too faint.
3. **`--rule` (4.41:1) used as literal text color** at 11 sites across
   `index.html` + `ui/readings.js` — under the 4.5:1 AA normal-text floor.
4. **`.feedback-details` hover/focus/open** dimmed instead of brightening on
   interaction — a hierarchy inversion versus every other touched control.
5. **`ui/share.js` hatch-tile line** — a redundant `opacity="0.4"` on top of
   an already-toned-down stroke color made the sealed-hatch pattern near
   -invisible in the exported share PNG.
6. **`tests/monochrome_surface.test.js` false-green** — its own contrast test
   asserted `--rule`'s 3:1 floor with a comment framing it as "border/focus,
   not text" while 11 real usages contradicted that in shipped code.

The internal workflow additionally, independently found and the relay
reconciler did not: the achromatic scan missed 3-digit hex shorthand and
named CSS colors/`hsl()`; the focus-visible check only matched the
`outline:` shorthand, not longhand `outline-width:`; the scan covered only
4 of 11 `ui/*.js` modules; a hand-computed contrast figure (`--text-muted`
"~9.4:1") was off by more than a point (correct: 10.54:1); a stale
`/* paper specimen */` comment survived the sweep; the paywall CTA's
border equaled its own fill (a borderless flat slab both reviews
independently flagged as reading closer to a generic checkout button than
this project's specimen-plate register); and no version-truth disclosure
accompanied the `package.json`/`DOCTRINE.md` no-bump call.

## Disposition

All six relay-identified defects, all five internal-workflow-only
findings, and both documentation inaccuracies were fixed in commit
`70ea551` (see `journal.md`'s 2026-07-29 entry for the itemized list and
exact before/after values). Full suite re-verified green after the fixes:
**47 files / 1606 tests.** `bash audits/run_local_audit.sh` clean (559
files). `git diff --check` clean.

## Residual / non-blocking

- No screenshot artifacts accompany the commit — Visual QA was performed
  live in-session via the Browser pane, not captured to files. Real gap
  against the brief's "before/after screenshots for independent re-audit"
  ask; left for the operator to request if wanted.
- Disabled buttons remain brightness-only (no structural cue) — a
  pre-existing pattern predating this change, not a regression it
  introduced. Not fixed here.
- Static asset regeneration (favicons/OG image/apple-touch-icon) and the
  off-repo `~/8ball/reach/x_pipeline/post_x.py` alt-text wording are
  explicitly out of scope for this PR (disclosed in the journal, not
  silently skipped) — the former is done in a separate commit
  (`b4a34f1`) already on this branch; the latter is deliberately NOT done
  (see journal: the underlying JPEG catalog is still cream, unmigrated,
  so a "black card" alt-text claim would be inaccurate until a separate,
  operator-approved catalog migration happens).

## Full reconciliation output

`~/ai-relay/runs/20260729-191219-8ball-bw-monochrome-ui/RECONCILIATION.md`
(operator-local, off-repo — this file is the in-repo summary the L48 gate
requires).

## Recommendation

Merge on CI green after this artifact lands on the PR head.
