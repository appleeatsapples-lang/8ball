# Cross-model pre-merge audit — PR #202

**PR:** #202 — feat(kua): cut the no-gender both-values fallback — DOCTRINE §1.D v0.65 (operator word)
**Branch:** `claude/kua-no-gender-absent` (forked from `origin/main` @ `69235ee`)
**Date:** 2026-08-06
**Auditor:** `relay --base origin/main` (grok review; claude reconciliation — every finding verified directly against the branch diff; "no hallucinations to discard"). Run of record: the 2026-08-06 kua-cut run under `~/ai-relay/runs/` (`runs/latest` at cut time).

## Verdict

**MERGE WITH FIXES (low-risk) → all five absorbs landed in `4777ee3`, now SAFE TO MERGE** (pending the operator's own read of this artifact and the explicit merge word — this response is not a substitute for either).

## What was reviewed

The full branch diff vs `origin/main`: the three-state contract (open · sealed · absent) in `ui/kua.js` and the dyad sheets (`ui/sheet.js`), the F4 sealed ≠ unresolvable distinction including aria, residual both-values copy/comments/tests anywhere in the repo, DOCTRINE v0.65's L17 supersession of the v0.63 rule (3) and the parallel-branch v0.64 numbering note, and whether `core/kua.js` `getKuaBoth` remaining alive as engine-only surface creates risk.

## Findings — all five real, none functional, all landed

1. **Sealed-state test never pinned `!kua-absent` (host block).** The
   sealed-below-entitlement test asserted the seal and empty nodes but not
   the absence of the absent class — sealed/absent mutual exclusion was
   unpinned. **FIXED:** explicit `kua-absent === false` assert added.
2. **Same gap on the sheet's sealed-at-t2 path.** **FIXED:** same assert
   added on the dyad-sheet parity test's sealed branch.
3. **The `.kua-read.kua-absent { display: none; }` rule had no style pin** —
   unlike the block's other CSS rules; a vanished rule would leave an
   invisible-class no-op with every class assert still green. **FIXED:**
   verbatim style-pin test added.
4. **Test-file header still said "single-gender and both-values modes."**
   **FIXED:** rewritten to the three-state contract.
5. **`core/kua.js` comment still called `getKuaBoth` "the
   no-gender-on-file read."** **FIXED:** reframed as "symmetric
   both-gender helper — engine surface only, not a product path since
   §1.D v0.65." The function itself is correctly untouched — pure engine
   surface under `tests/kua.test.js` / `tests/kua_content.test.js`, and
   the single-consumer pin plus the new source pin
   (`ui/kua.js` must not reference `getKuaBoth`/`formatKuaBoth`) keep it
   product-unreachable.

## Reconciler's structural confirmation

The three-state model is implemented consistently across the host block
and both dyad sheets; the sheet gate is correctly `!kuaOpen` (coordinate
presence) rather than `!kuaRead`; F4 is respected (absent is hidden, never
a seal at full entitlement); the retired dual-value fallback is actually
gone and source-pinned against return; and the DOCTRINE v0.65 amendment
properly supersedes rather than deletes rule (3) per L17.

## Verification pre-conditions (implementer's recorded runs — the reviewing lane cannot execute node/npm)

Recorded after the absorb commit `4777ee3`:

- vitest suite: **56 files / 1931 tests green** (`npm test`)
- `audits/project_audit.py`: **PASS 13 / 0 fail / 1 warn / 0 skip**
- local PII audit (`audits/run_local_audit.sh`): **clean, 856 files**
- Live browser fire through the real boot rehydrate path: a no-gender t3
  profile renders the kua block with `.kua-absent`, computed
  `display: none`, no value text and no seal class; setting
  `gender: 'female'` on the same stored payload and reloading renders
  `female · kua 7 · dui ☱ · west · west group` with no note, no seal, no
  absent class — the gendered path byte-identical to v0.63.

## Process note

The cut is a direct controller word given 2026-08-06 (the pasted
no-gender output + "cut this out"). Per the no-self-certification law this artifact
records an independent cross-model read of the implementer's diff; the
merge itself remains the operator's word, and this PR does not
self-merge. v0.64 (§1.K moon sign) rides PR #201 on an independent
branch — disjoint clauses; whichever merges second absorbs the expected
journal/footer top-insert conflict.

---

## Addendum — codex second read (triple-force upgrade, same day)

On the controller's extension of the standing audit word ("add codex to
become a triple force audit"), a codex relay round ran against the same
branch after the grok absorbs. **Verdict: MERGE WITH FIXES — five
findings, all independently verified by the reconciler, all landed in
the follow-up absorb commit.**

1. **MEDIUM (the catch of the round) — the paywall promised a coordinate
   a no-gender buyer no longer receives.** `index.html`'s about copy
   ("…and the kua line — permanently, for every reading…") and
   `#paywall-value` ("adds … and the kua line —") were untouched by this
   branch — but the v0.65 cut changed their truth value: under v0.63 a
   no-gender profile still rendered a (dual-value) kua; under the cut it
   renders nothing. **FIXED:** both offer strings now carry the gender
   qualifier ("rendered when a gender is supplied" / "with a gender
   supplied"), with both `payments_markup` pins updated in lockstep and
   the rendered copy live-fire verified.
2. **LOW — stale unseal beat could replay.** `renderTierSections` adds
   `.unsealing` to the kua root on an upgrade render even while the
   block is absent (hidden); `display:none`→visible restarts CSS
   animations, so a later same-tier gendered render would replay the
   flash. **FIXED:** the absent render strips the beat + `--unseal-delay`
   (a gendered render keeps its legit beat), with a dedicated regression
   test.
3. **LOW — quote-blind import scans.** The single-importer regexes
   matched single-quoted imports only; a double-quoted
   `import … from "../core/kua.js"` would have slipped both the per-file
   and index.html scans. **FIXED:** both regexes accept either quote
   style. (The reconciler noted codex conflated this with the ui/kua.js
   substring pin, which was already quote-proof — the narrow gap was
   real, the cited mechanism partly imprecise.)
4. **LOW — DOCTRINE self-contradiction.** The v0.65 clause said
   "`core/kua.js` is untouched" while recording the `getKuaBoth` comment
   reframe in the same paragraph. **FIXED:** reworded to "unchanged in
   behavior and API," in the clause, the footer entry and the short-list
   line.
5. **NIT — stale journal header.** The entry's header still read
   "cross-model audit pending" after the audit completed. **FIXED** per
   the repo's mechanical-correction precedent.

Post-absorb verification: vitest **56 files / 1932 tests green** ·
`audits/project_audit.py` **PASS 13/0/1/0** · local PII audit **clean,
857 files** · qualified paywall/about copy live-fire verified in the
rendered DOM. The grok verdict above stands; with the codex absorbs
landed the artifact's SAFE TO MERGE remains, still pending the
controller's own read and the explicit merge word.
