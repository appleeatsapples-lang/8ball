# Cross-model pre-merge audit — PR #199

**PR:** #199 — Add kua trigram block + optional gender input (§1.D v0.63)
**Branch:** `claude/gender-reading-influence-citp5k` (forked from `origin/main` @ `9dc0eac`)
**Date:** 2026-08-04
**Auditor:** `relay --base origin/main` fan-out (codex + grok + claude, reconciled by claude). Gemini errored on auth (rc=41, same known pattern as PR #194 — not counted).

## Verdict

**MERGE WITH FIXES → fixes landed, now SAFE TO MERGE** (pending operator's own read of this artifact and the explicit merge word — this response is not a substitute for either).

## What was reviewed

The full PR diff vs `origin/main`: the §6 headroom split (`ui/payments.js`), `core/kua.js` + tests, `content/kua.v1.js` + tests, `ui/kua.js` + ladder/sheet/dyad wiring + tests, gender persistence (profile/readings/dyad person-B) + tests, `DOCTRINE.md` §1.D v0.63 + §5 v0.63, and the PR's own pre-filed audit brief (`audits/crossmodel_kua_gender_premerge_brief_2026-08-03.md`) and override sighting (`audits/L48_override_pr199_2026-08-03.md`), which reviewers were directed to follow and independently re-verify rather than trust.

## Findings

### Consensus (≥2 reviewers, independently verified against the diff)

1. **HIGH — person B's gender survives a dyad close/reopen (`ui/dyad.js:541`).**
   Codex and grok both caught this; the reconciler confirmed by reading the
   code. `clearEntryFields()` cleared `dyad-name-input` / `dyad-dob-input`
   / `dyad-time-input` on close/reopen but omitted `dyad-gender-input`
   (added this PR). Both `open()` and `close()` call `clearEntryFields()`.
   Result: the next unconsented person B silently inherits the prior
   person's gender — the exact "stale demographic residue in hidden DOM"
   class of bug PR #187's F1 fix was written to kill. `tests/dyad_surface.test.js`
   had a payload-forwarding test for gender but no clear-on-close/reopen
   assertion, so nothing caught it. Claude's solo review said "SAFE TO
   MERGE, no blocker findings" — that verdict was wrong on this point; it
   checked entitlement-leak paths but never traced `clearEntryFields`.

### Unique findings (adjudicated by the reconciler)

- **codex — the NAMED LIMITATION's post-2000-fork citation used the wrong
  S-scoping.** Verified by hand and by an exhaustive 2000–2099 sweep: the
  commonly-published "competing school" (male 9−S, female 6+S) scopes S
  to the birth year's *last two digits*, not the full year as this
  module's own S is and as the citation's worked example (2005) assumed.
  Correctly scoped, the two formulas do not diverge anywhere in
  2000–2099 — a mathematical consequence of the century's digital root
  being exactly the offset between `11 − S(full year)` and `9 − S(last
  two digits)`. Real, but a citation-accuracy defect, not a functional or
  security blocker — the shipped calculation is untouched.
- **codex, `DOCTRINE.md` footer/history stale.** Verified real: footer
  still said `v0.62` with no `v0.63` history bullet despite the `§1.D
  v0.63` amendment already existing in the body. Mechanical, matches an
  established precedent in the same file.
- **codex, `tests/kua_content.test.js` no-guidance regex misses bare
  "face northeast".** Verified real, low severity — no live content
  currently violates it, weak future guard only. Not fixed in this round
  (non-blocking, flagged as a fast-follow).
- **codex, `tests/kua_surface.test.js` DOM injection checked only by
  source-regex, not a stubbed `document`.** Verified real, low severity —
  legitimate hardening gap, not a shipped defect. Not fixed in this round.
- **grok, sheet↔host differential (`tests/dyad_surface.test.js`) has no
  kua selectors.** Verified real — the R3 differential built to catch
  `sheet.js`/host drift is silently blind to the new kua block. Moderate,
  non-blocking (`kua_surface.test.js` covers sheet parity separately).
  Not fixed in this round.
- **grok, `ui/kua.js` dual-gender mode drops the citation `body`.**
  Verified real, cosmetic — `formatKuaBoth` never surfaces `t.body` the
  way `formatKuaRead` does. Nit. Not fixed in this round.
- **grok, `ui/tiers.js` census comment omits `kuaRead`.** Plausible,
  cosmetic, not independently re-verified; low-stakes either way. Not
  fixed in this round.
- **gemini** — provider failed to authenticate (rc=41), no review
  produced. Nothing to reconcile.

## Disposition

Two of the three items rated blocking-or-should-land-together were fixed
in this response's commit:

1. **`ui/dyad.js:541`** — `'dyad-gender-input'` added to
   `clearEntryFields()`'s id list. Regression test added to
   `tests/dyad_surface.test.js` asserting the field blanks after both
   `close()` and `open()`. Verified: fails on the pre-fix code (confirmed
   by temporarily reverting the one-line fix and re-running), passes with
   it restored.
2. **`content/kua.v1.js`'s `KUA_SOURCES.limitation`, `core/kua.js`'s
   NAMED LIMITATION comment, `tests/kua.test.js`'s citation comment** —
   corrected to describe the last-two-digits S-scoping accurately and
   drop the unverified/incorrect "2005 → 2" contrast. A new exhaustive
   sweep test (`tests/kua.test.js`, "named-limitation citation check
   (20xx)") pins the equivalence across all of 2000–2099 so the citation
   claim is enforced, not just asserted in prose.
3. **`DOCTRINE.md` footer/history** — bumped to v0.63 with a full summary
   (the prior v0.62 footer paragraph preserved immediately below as
   `doctrine version, prior:`); a condensed `- v0.63:` line added at the
   top of the changelog bullet list.

Full assurance suite re-verified green after all three fixes: **54 files
/ 1889 tests** (`npm test`; 1887 before this response's two new
regression tests). Product audit: `python3 audits/project_audit.py` →
PASS 12/0/1/0. Local PII scan: `bash audits/run_local_audit.sh` → clean,
848 files. `index.html`: 1486/1500, unchanged by this response (no
`index.html` edit in this commit).

## Residual / non-blocking

The four low-severity/cosmetic unique findings above (`kua_content.test.js`
guidance-regex gap, `kua_surface.test.js` DOM-injection coverage gap,
`dyad_surface.test.js` sheet/host kua-selector gap, `ui/kua.js` dual-mode
citation body, `ui/tiers.js` census comment) are real but were judged
non-blocking by the reconciler and are left as fast-follow work, not
fixed here — consistent with the reconciler's own disposition, which
gated the merge signal on the gender-leak fix specifically and asked for
items 2–3 "in the same change" as a citation/doctrine-accuracy matter,
not as blockers of equal severity to item 1.

## Full reconciliation output

`~/ai-relay/runs/20260804-012901-8ball-pr199-review/RECONCILIATION.md`
(operator-local, off-repo — this file is the in-repo summary the L48
gate requires). Individual model responses in the same run directory's
`responses/` subdirectory.

## Recommendation

The one real pre-merge regression is fixed and covered by a new
regression test; the citation-accuracy and doctrine-footer items are
also landed; four low-severity items are named and deferred. Suite,
product audit, and PII scan all green. Ready for the operator's own read
and the explicit merge word per §10/L48 — this artifact does not itself
authorize a merge.
