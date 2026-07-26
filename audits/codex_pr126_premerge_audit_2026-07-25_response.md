# Codex pre-merge audit — PR #126 (salvaged coverage branch, 67 tests) — response

- **Date:** 2026-07-25 (verdict pasted back to orchestrator ~16:1x, filed 16:2x)
- **PR:** #126 — `claude/test-coverage-analysis-27tc7k` → `main` (head 9ee4bde,
  base origin/main 7a9de2a, merge-base 7cd0947)
- **Reviewer:** Codex, cold session. `relay` unavailable locally; the operator ran a
  fresh no-context Codex auditor against the staged packet
  (`~/8ball/audits/codex_pr126_premerge_audit_2026-07-25_PASTE.md`) and pasted the
  verdict back same-day. The auditor made no files, commits, pushes, or merges;
  checkout left clean.
- **Verdict:** **MERGE WITH FIXES** — 2 Med + 2 Low. F1's blocking half is
  discharged by this very file; the F2 fix and F4 errata are staged, pending
  operator word.

## Findings and dispositions

| # | Sev | Finding | Disposition |
|---|-----|---------|-------------|
| 1 | Med | L48 false-green: commit `9ee4bde` is a 100%-similarity rename of the implementer's own session record to a `pr126` filename — it satisfies the l48-gate's filename predicate (`.github/workflows/ci.yml`, l48 job) without any independent verdict existing. | **Blocking half DISCHARGED BY THIS FILE** — an independent verdict response now sits on-branch pre-merge. Gate tightening (accept only `*_premerge_audit_*_response.md` / explicit-override shapes) = **FOLLOW-UP QUEUED** as its own CI PR; recorded in the ops session record. |
| 2 | Med | `rowSections()` (`ui/share.js`) is not fail-closed: only exact `state === 'sealed'` strips; a missing/unknown/inconsistent state carries a value into both SVG and caption (reproduced: missing-state and `unres`+value constructions leak). Today's only producer (`ui/tiers.js` shareRowRefs) emits well-formed rows, so no live leak — but the §5.D comment claims a guarantee the code doesn't enforce. | **FIX STAGED, pending operator word:** state whitelist — exact `open` carries the value, exact `unres` renders `—`, every other or missing state coerces to `sealed` with `''`; plus adversarial tests (missing state, unknown state, unres-with-value, null cell). This row flips to FIXED in the fix commit. |
| 3 | Low | "Runs in jsdom" claim inaccurate: both new suites use hand-built Node DOM/browser doubles, not jsdom. The tests are still real — they execute the actual controllers — but HTML parsing/nesting behavior is outside their coverage. | **ERRATUM RECORDED HERE** — the claim originated in the relay packet's framing (echoing the session record's phrasing), not in code. F4's errata block restates it inside the tracked record. |
| 4 | Low | Evidence-truth defects in the tracked records: the session record names `a9103a7` as its base (actual merge-base `7cd0947`); the survivor record cites the pre-rename companion filename; two derived percentages disagree with their counts (count-derived 61.8% / 98.6%, displayed 61.9% / 98.7%). | **FIX STAGED, pending operator word:** append an errata block to each record — append-only correction, no silent rewrite of evidence documents. Flips to FIXED in the fix commit. |

## What Codex independently confirmed (its own commands, cold)

- The only app-code change is the 2-line `export` of `rowSections`; no runtime
  importer or behavior change.
- All 67 new tests import and execute real product modules; mocks replace
  browser/host boundaries, not the modules under test. Classification: ~65
  behavioral/privacy/error-path, 2 presentation, 0 regex-on-source, 0 fixture-only.
- Hygiene: isolated re-runs 45/45 and 22/22; `TZ=UTC` and `TZ=Pacific/Kiritimati`
  runs 67/67; two consecutive full-suite runs 1437/1437 (40 files).
- Adversarial `rowSections` constructions: exact-sealed / null-cell / extra-keys /
  nested-sealed → no leak; missing-state and `unres`+`SECRET` → leak (F2's basis).
- Staleness non-blocking: app dependencies at merge-base `7cd0947` are
  byte-identical to `origin/main`; later main changes are docs/CI only. No overlap
  with #123 or #125.
- Count truth: 40 test files on disk = CLAUDE.md's 40; suite 1437/1437. Local PII
  audit clean (231 files).
- After #125 also lands: expect 40 files / 1438 tests (+N from the F2 fix's tests).

## Pen notes (orchestrator lane)

- F2 is a pre-existing latent gap this salvage EXPOSED by exporting and
  adversarially testing `rowSections` — the branch made the hole visible; the
  staged fix closes it at the exact layer §5.D names as the guarantee point.
- Sequence: this PR merges only after the F2 fix commit lands and the suite
  re-verifies. One PR per operator word; squash convention.
