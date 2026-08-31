# PR #227 pre-merge cross-model audit — reconciled response

**PR:** 8ball #227 — cities.test.js contention flake retired: plain-JS
validation replaces the ~900k-assertion shape
**Base → head:** `2aeaedd` → `c328bd7` at audit start; every finding lands
in the reconciliation commit carrying this artifact — no mid-audit push.
**Process:** §10 two-lane adversarial review. The brief's charter: does
the restructure WEAKEN the data contract it carries, in any way, however
subtle — with contract equivalence, independent mutation-kill, and the
timing claim each to be established rather than trusted.

## Lane verdicts

| Lane | Verdict | Findings |
|---|---|---|
| Lane A | MERGE WITH FIXES | 2 LOW, 2 NIT, 2 INFO, 1 procedure |
| Lane B | MERGE WITH FIXES | 2 LOW |

**Reconciled outcome: MERGE WITH FIXES — every fix-class finding was
prose accuracy or a message nit; none touched the test's logic; all
landed. Final call remains with the controller per L48.**

## The contract question, cleared from both directions

Neither lane found a weakening. One lane ran a 43-corruption matrix of
raw-JSON splices against the OLD and NEW test shapes in isolated
worktrees: verdicts identical on all 43, including six
survive-by-design boundary cases (±90/±180 exactly, tzIdx 0 and max,
pop 0). The other lane devised 17 corruptions of its own — all killed
with indexed messages, and all documented boundary values pass with no
false positives. The subtleties the brief aimed at resolved cleanly:
NaN is unreachable through `JSON.parse`; ±Infinity (JSON's `1e999`) is
reachable and behaves identically in both shapes; the
`violations.length <= 5` early exit cannot produce a false pass (it
fires only once `violations` is non-empty, and any non-empty array
fails the terminal expect); and structural-failure handling is strictly
BETTER than before — the old `expect()` chain threw and aborted the
entire scan at the first bad entry, while the new shape continues and
reports six.

**The flake claim is real and was understated.** Measured on this
machine: old shape ~11.8–13.0s against its 15s budget (~1.2× margin);
new shape 17–19ms against the 5s default (~275× margin). The full
suite dropped ~16.6s → ~11.2s.

## Findings and dispositions

**LOW (Lane A F1) — "the suite's one recorded flake" was false.** The
journal records a second flake (l48_gate_composition), root-caused and
fixed at the time. **Landed:** "one OUTSTANDING recorded flake".

**LOW (Lane A F2) — "CPU contention on four occasions"
over-generalized.** The pr222 sighting is on record as a cold-cache
timeout. **Landed:** "CPU contention or a cold cache", in the journal
entry and the test's comment.

**LOW (Lane B F1; Lane A F3) — the "~280ms isolated" figure was
unreproducible as stated.** It was the whole file's first-draft timing,
not the test's; the truth is better (test body ~17–22ms). **Landed:**
the journal states the measured figures with the file/test distinction.

**LOW (Lane B F2) — "capped at six" overstated the early exit.** The
stop condition is checked once per ENTRY, so a single maximally-corrupt
entry can push the total past six (verified: 11 reported). Harmless —
it never under-reports. **Landed:** the journal states the mechanism
honestly instead of the cap.

**NIT (Lane A F4) — bare interpolation could mislead:** a string
`"240"` printed as `tzIdx 240`. **Landed in code:** a `show()` helper
renders strings quoted while keeping Infinity readable
(`JSON.stringify` would print it as "null"); kill-verified with string
tzIdx and string lat mutants post-fix.

**INFO (Lane A F5), queued not fixed:** with cities retired, the
suite's next-tightest margin is a `tests/public.test.js` register sweep
at ~2.7–3.0s against the 5s default. Named in the journal as the next
queue candidate.

**INFO (Lane A F6), pre-existing:** a hypothetical `null` city entry
would crash at collection time (the sanity-lookup `byName` build)
before this test runs — identical in both shapes, not this PR's.

**Procedure (Lane A P1), for the next cycle:** the shared audit scratch
directory produced one real, harmless collision between lanes; each
lane gets its own subdirectory next round. No result was affected.

## Reconciled verification (post-fix head)

- Both lanes verified the main checkout byte-clean after their mutation
  work (git status empty; the asset's hash unchanged).
- Suite 57 files / 2011 tests green both sides of the change (count
  unchanged — one test restructured into one test); product audit PASS,
  0 blocking; assurance suite 104 OK; journal structural guard green
  (heading flip verified eating nothing, #226 confirmed on main); all
  four cited flake incidents verified against the named artifacts.
- `l48-gate` was red by design until this artifact; this file
  satisfies it.

qualifier: recorded, not certified. Merge authority remains the controller's.
