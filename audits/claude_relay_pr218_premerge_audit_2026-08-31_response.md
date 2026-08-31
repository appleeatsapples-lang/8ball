# PR #218 pre-merge cross-model audit — reconciled response

**PR:** 8ball #218 — kua type-style unification (the pr208 F9 cosmetic)
**Base → head:** `5f6417e` → `f620656` at audit start; the first lane's fix
landed mid-audit (`60b6373`) and the second lane re-verified it rather than
trusting it. The remaining findings land in the reconciliation commit
carrying this artifact.
**Process:** DOCTRINE §10 two-lane adversarial review, relayed through the CC
lane, scaled to a small diff. Both lanes live-fire-measured computed styles
and box metrics in Chromium on both trees.

## Lane verdicts

| Lane | Verdict | Findings |
|---|---|---|
| Lane A | MERGE WITH FIXES | 1 (1 MED) + 5 checked-and-cleared |
| Lane B | MERGE WITH FIXES | 7 (2 MED, 2 LOW, 2 NIT, 1 INFO) |

**Reconciled outcome: MERGE WITH FIXES — every fix-class finding landed;
verified below. Final call remains with the controller per L48.**

## Findings and dispositions

**MED (both lanes, independently measured) — the swap stripped the secondary
line's 6px separation.** `margin-top: 6px` was `card-note`'s only box
declaration and `card-habit` carries none, so the secondary value line went
flush against the primary's citation body — the opposite of the grouping F9
asked for. One lane measured it and its fix landed mid-audit; the other
diffed the two shell rules independently (exactly two deltas: font-style and
the margin), measured 6.00→0.00px, then re-measured the fix: one
`.kua-read`-scoped rule in the injected `KUA_STYLE` restores 6px in the host
block AND both dyad sheets (the sheets share `.kua-read` and the injected
style is page-wide, appended after the shell links so it wins the tie).
**Landed and re-verified; source-pinned; the rule-deletion mutant dies.**

**MED (Lane B, F2) — the journal sentence the fix falsified.** "No rule
changed, no new style injected" was true of the first-staged diff and false
at branch head. **Landed:** corrected in place with the falsification named,
per the pr208 F7 precedent.

**LOW (Lane B, F3, mutation-proven) — the host-side negative pin was
dodgeable.** `card-habit kua-secondary card-note` rode the entire suite
green. **Landed:** order-proof class-list regex; the appended-class mutant
now dies.

**LOW (Lane B, F4) — the bounded host-vs-sheet differential never touched
the kua block.** The standalone sheet host registered no `data-sheet-kua-*`
node, so the sweep asserted nothing about kua and the PR's parity claim
rested on two source regexes. Pre-existing gap; this PR was the first to
lean on it. **Landed:** the six kua attrs join the standalone host, the
sweep passes `kua: kuaReadFor(profile)` and asserts the tier gating, the
sealed toggle, and all five field routings per profile per tier — the same
DI shape the public-read block established (gating and routing, not
recomputation).

**NIT (Lane B, F5) — a displaced assertion and an unhoisted read.**
**Landed:** the `.kua-note` selector assertion moved back under its own test
heading; `sheetJs` hoisted to file scope beside `kuaJs`.

**NIT (Lane B, F6) — no artifact on the branch.** This file is the artifact.

**INFO (Lane B, F7) — the auditor-assurance `test_guard_can_fail` failure is
the documented container-only artifact** (root's `$HOME` vs the checkout
path), not a PR regression; `project_audit.py` itself is PASS 13/0/0/1.

**Process note, owned again:** the first lane's fix was committed and pushed
mid-audit under the repo's stop-hook, while the second lane was measuring —
the same relay collision pr217's artifact recorded. The second lane
re-based, re-verified, and its findings were unaffected.

## Reconciled verification (post-fix head)

- Suite 57 files / 1995 tests green; product audit PASS, 0 blocking.
- Four mutants killed: host revert, sheet revert, appended `card-note`
  class, margin-rule deletion.
- Live-fire at t3 (host) and t5 (both dyad sheets): both value lines
  italic, secondary `margin-top: 6px`, bodies upright; zero page errors.
- Lane sweeps clean: no sibling/nth selector keys on the prose classes
  anywhere; the unsealing and reduced-motion lists name both classes; the
  `:empty` guards are keyed on untouched classes; `ui/share.js` references
  none of them; diff scope is exactly the four files claimed.

qualifier: recorded, not certified. Merge authority remains the controller's.
