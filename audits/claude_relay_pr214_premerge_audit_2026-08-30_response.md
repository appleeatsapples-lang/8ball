# PR #214 pre-merge cross-model audit — reconciled response

**PR:** 8ball #214 — placement lines close the last meaning duplication + city
prefetch on focus
**Base → head:** `19b5b7f` → `b49909e` (findings below reconciled into the follow-up
commit on the same branch)
**Process:** DOCTRINE §10 two-lane adversarial review, relayed through the CC lane.
Both lanes received the same brief (attack, not summarize), the full diff, and repo
access; each ran the suite, the product auditor, and independent mutation testing in
scratch copies.

## Lane verdicts

| Lane | Verdict | Findings |
|---|---|---|
| Lane A | SAFE TO MERGE | 0 (one for-the-record note) |
| Lane B | MERGE WITH FIXES | 12 (3 MED code/doctrine, 1 MED procedural, 4 LOW, 4 NIT) |

**Reconciled outcome: MERGE WITH FIXES — all fix-class findings landed; verified
below. Final call remains with the controller per L48.**

## Findings and dispositions

**F1 — MED, real bug (Lane B, execution-proven). Two city fields could spend two of
three bounded import attempts on silent warms.** `ui/dyad.js` boots a second
`initCitySearchUI` instance on its own input, so `{ once: true }` per listener did not
make warming once-per-session; two sequential failed warms would leave the user's
first typed search terminating in `CITY_LOAD_EXHAUSTED` with no prior visible error.
**Landed:** module-level `_warmed` latch in `core/cities.js` `warmCities()`; the
misleading "even across two instances" comment corrected in `ui/citysearch.js`; the
recovery pin extended to the sequential-warm scenario (a later warm after a failed
one consumes no further attempt, and the next real search proceeds to the first
recovery specifier). Mutation-verified: removing the latch fails the new pin.

**F2 — MED, doctrine accuracy (Lane B). §5's lazy-load clause described a retired
trigger.** The clause still said `assets/cities.json` loads on the rising-sign
`<details>` open. **Landed:** L17-style trigger supersession appended to the §5
bullet — first birthplace-field focus, once per session, shared cache and bounded
specifiers, and the accepted cost named (a focus-without-typing visitor now fetches
the asset).

**F3 — MED, test gap (Lane B, mutation-proven). `core/dyad.js` was outside the
scan-target parity pin.** A dyad reverted to importing `meanings.v3.js`, with its
`meaningSource` provenance string still claiming v5, rode a fully green suite.
**Landed:** the parity pin now scans both runtime importers (`ui/meanings.js` and
`core/dyad.js`) and asserts the dyad's `meaningSource` literal names the file it
imports. Mutation-verified: the lane's exact mutant now fails.

**F4 — LOW, content quality (Lane B). Ten placement lines restated a word the
entry's own register or body already carried.** **Landed:** the ten lines reworded
pre-merge (the file is unshipped until this PR merges, so §4 immutability is not in
play) so each appended trait is not already in the sentence above it; family
prefixes and the vocabulary oracle unchanged.

**F5 — LOW, claim scoping (Lane B). "Stops rendering as a copy of itself" overstated
the metric.** The measurement is body-string equality; a shared sign still shares
its first sentence and register title by §4 design. **Landed:** claim scoped in both
the DOCTRINE v5 routing note and the journal entry, residual named.

**F6 — LOW, test gap (Lane B, mutation-proven). A copy-pasted line within a family
rode green.** **Landed:** whole-line uniqueness pins per family, applied to
`PLACEMENT_LINES` and (closing the same pre-existing gap from the pr212 work) to
`NUMEROLOGY_SLOT_LINES`. Mutation-verified: duplicating one value line fails.

**F7 — LOW, cost disclosure (Lane B). The prefetch downloads 2.4MB for a visitor who
focuses the optional field and never types.** Judgment call, resolved by the brief's
second option: the focus trigger is kept (entering the field is strong intent, and
the focus-to-first-suggestion window is where the multi-second win lives), and the
cost is now stated explicitly in the §5 supersession and the journal. Recorded here
as the controller-visible tradeoff.

**F8 — NIT, declined (Lane B). Exact source-regex pin on the focus listener.** The
listener's shipped form is unchanged by the F1 fix, exact-shape pins are this repo's
deliberate style, and the load-bearing guard is the behavior pin (the mocked
double-fire test), which stays meaningful independent of the latch. No change.

**F9 — NIT, declined (Lane B). Prototype-chain lookup on the value key.** The shape
is pre-existing and shared with every table lookup in `ui/meanings.js`; values reach
it only from engine-rendered cell text, so `toString`-class keys are unreachable
today. Changing only the new lookup would leave the module inconsistent. Filed as a
known shape; revisit if cell values ever take user-typed input.

**F10 — NIT (Lane B). Journal audit numbers were a pre-commit snapshot.** **Landed:**
journal restated — PASS 13/0/0/1 on the committed tree; the 12/0/1/1 run's warn was
`product.git_status` on the then-untracked v5 file.

**F11 — NIT (Lane B). README/8BALL still named `meanings.v3.js` active** (stale
since the pr212 work). **Landed:** both updated to v5-active with the re-export
lineage; CLAUDE.md count lines untouched and `repo_shape` green.

**F12 — MED procedural (Lane B). No in-PR audit artifact.** This file is that
artifact; it lands with the reconciliation commit, satisfying both the `test` job's
DOCTRINE-artifact leg and the `l48-gate` job.

**Lane A note (for the record).** Nothing mechanically pins the disjointness of
`NUMEROLOGY_SLOT_LINES` and `PLACEMENT_LINES` key sets, which is what makes
`entryFor`'s `slotLine || placementLine` safe. Reconciliation review: the two
exact-key completeness pins (six numerology slots; exactly `rising`/`innerAnimal`)
already enforce disjointness transitively — a v6 that added an overlapping key fails
the exact-key pin before the masking could ship. No additional pin required.

## Reconciled verification (post-fix head)

- Full suite green, including the extended parity, uniqueness, and sequential-warm
  pins; product audit PASS, 0 blocking, on the committed tree.
- Mutants re-run post-fix: latch removal, dyad v3 revert, duplicated family line —
  all red; the five original pr214 mutants remain red.
- Register scan over the ten reworded lines: clinical voice preserved, family
  vocabulary oracle and byte-join pins green.

qualifier: recorded, not certified. Merge authority remains the controller's.
