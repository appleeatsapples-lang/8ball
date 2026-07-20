# AUDIT ARTIFACT — PR #113 pre-merge re-audit (calc v3 / nine-number supersession)

Auditor: fresh Claude lane via relay (run `20260721-023436-relay-pr113-detached`,
dedicated detached worktree at audited head `535fe68`); reconciler: claude.
Author-of-record of the WIP: Codex (conflicted off audit). Primary red-team:
Grok (spent) — archived verdict DO NOT MERGE with F1–F6
(`~/8ball/audits/audit_calc_v3_redteam_grok_2026-07-20.md`). This artifact is
the in-PR L48 / §10 record for PR #113.

## VERDICT

- Reviewer: **SAFE TO MERGE** — one caveat (below).
- Reconciliation: **MERGE WITH ONE PRE-CONDITION** — a live green run must be
  observed before the merge word, because `node`/`npm` were permission-gated in
  the relay sandbox and no relay lane executed the suite.

Reviewer confirmed on inspection: rebase fidelity (#105 document-level Escape
with modal-bg deferral survives and cardFace non-interception is pinned;
#104/#109 shared voice-register helper canonical; #103/#112 content_shape and
#106 readings pins intact; journal append-only, newest-at-top, nothing above
rewritten); F3 facet `v1→v2` one-shot clear is idempotent, lives in the read
path, both keys scrubbed on forget, storage exceptions independently caught,
and no code path reads the v1 key expecting a value; F4 supersession entry
names both prior authorities (#110 PARKED record + unmerged `f44255e`); F5
active doctrine prose states calc v3 with pre-amendment wording only under
lineage labels; hard constraints hold (only the versioned `_v2` key added to
the allow-list, no deps/network, v1 content files byte-untouched, out-of-1..9
rejected defensively).

## PRE-CONDITION: SATISFIED (implementer lane, live runs on this branch)

- Audited head `535fe68`: `npm test` **1364/1364 (37 files)** — observed twice
  (live implementation worktree + the relay's detached worktree), vitest 4.1.9.
- Post-absorb head `faa93c2`: `npm test` **1366/1366 (37 files)**; local PII
  audit **clean (125 files)**; `node --check` + `git diff --check` clean.
- Live-browser pass (static serve of this tree): former-master DOB renders the
  reduced life path; the F3 stale-position repro re-anchors `low` with the v1
  key cleared and v2 written; the numerology panel opens `with the other
  numbers` with numerology-only partners; zero console errors.

## FINDINGS + ABSORBS (both closed in-branch at `faa93c2`)

1. **low · `ui/meanings.js`** — `harmonyFor`'s connective template and
   `pillarEntry` bodies are runtime-assembled content no voice scan covered
   (the concordance convention scans assembled `buildConcordance` output; the
   meanings layer only scanned its static tables). ABSORBED: `entryFor` /
   `harmonyFor` exported pure per §6; `tests/meanings_content.test.js` now
   scans every (coordinate × value) assembled body + harmony sentence, full
   and sparse sheets, through `voiceRegisterHits` / `BANNED_PATTERNS` /
   second-person / diagnostic-framing, plus a numerology-only-partners pin
   (+2 tests).
2. **nit · `ui/meanings.js`** — `UNRESOLVED_COPY` lacked a `dayPillar` entry
   (unreachable today: `core/profile.js` sets the day pillar unconditionally
   from DOB). ABSORBED: symmetric copy added, mirroring `hourPillar`.

Delta vs the audited head is these two absorbs only (test + copy); no calc,
storage, doctrine, or content-table change landed post-audit.

## DISPOSITION

Merge remains gated on the controller's word, per the implementer brief
(merge only after this verdict is filed — it now is). Full relay transcript:
`~/ai-relay/runs/20260721-023436-relay-pr113-detached/` (`context.md`,
`responses/claude.md`, `RECONCILIATION.md`).
