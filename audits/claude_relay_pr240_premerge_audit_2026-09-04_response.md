# PR #240 pre-merge cross-model audit — reconciled response

**PR:** 8ball #240 — public.test.js sweep cost retired: the last 2-second test
**Base → head:** `8a5080e` → `321ade1` at audit start; every finding lands in
the reconciliation commit carrying this artifact — no mid-audit push.
**Process:** DOCTRINE §10 / L48 two-lane adversarial review; per-lane clones,
both against BOTH the base and the head test file, so every detection claim is
comparative rather than one-sided.

## Lane verdicts

| Lane | Verdict | Findings |
|---|---|---|
| Lane A | MERGE WITH FIXES | 2 HIGH, 4 MED, 5 LOW; 27 product-code mutants + 17 test-code mutants |
| Lane B | MERGE WITH FIXES | 0 HIGH, 2 MED, 3 LOW; 10 mutants + 15 detection trials |

**Reconciled outcome: MERGE WITH FIXES. The speed-up is real and reproduces
almost exactly in both lanes. But the PR's central claim — "detection proved
identical… same predicates" — was false, and Lane A falsified it with a
two-line experiment. All fixes landed. Final call remains with the controller
per §10/L48.**

## HIGH-1 (Lane A) — a real detection regression: `toBe` is `Object.is`, `!==` is not

Rewriting `expect(a, dob).toBe(b)` as `if (a !== b)` looks like a null
transformation. It is not: `toBe` uses `Object.is`, which distinguishes `-0`
from `0`, and `!==` does not.

`posture.number` legitimately takes the value 0 — The Fool — on **39 of the
825 stride-89 sweep dates**, so the difference is reachable. Lane A planted
`-0` on one swept non-fixture date:

| | result |
|---|---|
| base `tests/public.test.js` | **1 failed** — the posture/role sweep |
| head `tests/public.test.js` | **0 failed, 42/42 green** |

A check the PR described as unchanged was gone. Fixed: every comparison that
was a `toBe` now routes through a `differs()` helper built on `Object.is`.
Re-run of the same plant now fails on the head file.

**The mirror case, which is a strengthening — so "same predicates" was wrong in
both directions.** Vitest's `toContain` uses `indexOf`/`===`, which never finds
`NaN`; the rewrite's `.includes` uses SameValueZero, which does. Planting `NaN`
into `favorable` and `primaryUnfavorable` gives base PASSES / head FAILS. The
new behaviour is better and is kept — but it is a predicate change, and it is
now stated rather than denied. Lane A also cleared a hypothesis the brief had
raised: vitest's `toContain` does **not** do deep equality on arrays, so the
`not.toContain` → `.some(f => f.key === …)` rewrite is genuinely equivalent.

Lane B independently checked the same translation table and found every
substitution equivalent **for the values this file actually produces**,
explicitly flagging the `NaN`/`toContain` divergence as present-but-unreachable
in the domains involved. Lane B did not find the `-0` case. Two lanes, and only
one of them caught the live one.

## HIGH-2 (Lane A) — the non-vacuity guard was the weaker shape this repo rejected one PR earlier

`expect(scanned).toBeGreaterThan(50000)` against a real 66,111 is a floor with
24% slack that counts ITERATIONS, not content. Four mutations kept it green
with a planted register violation undetected:

| mutation | `scanned` | violation caught? |
|---|---|---|
| the matcher fed `''` instead of the text | 66,111 | no |
| every string blanked before the scan | 66,111 | no |
| the SAME reading built for all 1,245 dates | 66,111 | no |
| stride narrowed to `sweepDates(73)` — **239 of 1,245 dates dropped** | 53,318 | no |

Lane B reached the same conclusion independently from the opposite direction,
demonstrating that the guard is load-bearing against gross shrinkage but blind
to a broken predicate, and filing the comment as claiming more than the code
proves.

The comparator is this repo's own `tests/pii_scan.test.js`, written in the
immediately preceding PR, whose comment reads *"EXACT, not a floor"* and which
carries exact counts, per-extension coverage sentinels, and a positive-fire
wiring test. The weaker shape was applied hours after arguing for the stronger
one.

Fixed with all three: exact date count, exact distinct-date count, exact string
count, an exact character total (blanking drops it to zero), a distinct-reading
count (the same-reading mutant collapses it), and a positive control over
`registerOffenders` — the predicate path extracted from the sweep so the
matcher can be driven directly with planted input. All four mutants killed.

## MED-1 (Lane A) — one unguarded line carried six sweeps

Making `expectNone` vacuous flipped **six of the seven** rewritten tests from
red to green in a single edit, and nothing tested the helper. In the base file
no single line had that blast radius, because the checks were 20 separate
`expect()` calls. Two guard-the-guard tests added — the pattern this repo
already uses for matcher sentinels elsewhere. Lane B filed the same concern as
a LOW, noting it also raises the stakes on a pre-existing coverage gap (below).

## MED-2 (both lanes) — the determinism test still aborted on the first offending date

Its `expectNone` sat inside the date loop, so it threw at the end of the first
offending date and the remaining four were never reached. The journal, the PR
body and the in-file comment all claimed a failure now lists every offending
date. That was false of this one test. Dedented one brace; the claim is now
true of all seven.

## MED-3 (Lane A) — the PR body stated a CI fact that was false

The body said "`l48-gate` and the `test` job's DOCTRINE-artifact leg are red by
design." That leg is guarded on a `DOCTRINE.md` touch (`ci.yml`); this PR has
none, so it never evaluates. `test` and `product-audit` were both **green** on
`321ade1`; `l48-gate` was the only red check, solely for the missing in-PR
artifact. Corrected on the PR.

## MED-4 (Lane A) — "detection proved identical" claimed more than ten samples licence

All ten planted violations reproduce as identical-on-both in both lanes' hands
— that part stands. But all ten were wrong-VALUE mutations of fields the sweeps
already assert, and the set had a systematic hole: nothing probed matcher
SEMANTICS, which is exactly where both drifts lived. Ten samples licence "no
regression found in ten cases", not "detection proved identical" or "same
predicates". The journal and PR body now say the former and name the two known
asymmetries.

## LOW (Lane A) — the 25-item cap was cosmetic

It capped the custom message; vitest then printed its own full diff of the
offender array. Measured on the same planted violation: 1,515 B on the base
file, **117,842 B / 1,306 lines** on the head file for 1,245 offenders, and
**7,727,591 B / 66,169 lines** for a synthetic worst case (1.5 s, no OOM). The
assertion is now on the count, so the message carries the capped diagnosis and
the output stays bounded.

## LOW (Lane A) — the testTimeout justification transferred figures off a deleted test

The first reconciliation of these comments kept the 20 s budget and restated
its reason as "the pr238 lanes' contention evidence (5/6 and 12/12)". Those two
reproductions were specifically of **this** test — the one this PR made 20×
faster — so transferring them onto a general claim is the same one-notch
widening this chain has been caught on repeatedly.

The surviving justification is a different item in the same artifact: the
production sighting was `pii_scan` + `cards_hosting`, whose slowest individual
tests idle at **111 ms and 133 ms**, crossing 5000 ms in one run — a ~40× stall
neither lane could induce, and one independent of how fast any single test is.
Both comments now cite that, record 5/6 and 12/12 as history rather than
justification, and state plainly that 20000 and 15000 are round numbers rather
than derived ones. The test's own title no longer says "well above the slowest
test". Lane A's own recommendation was to keep 20 s and fix the sentence, which
is what happened; it noted the strongest argument for lowering (a hung test now
costs 20 s per worker) and judged the ~40× sighting not to discriminate between
10 s and 20 s.

## LOW (both lanes) — "the suite's slowest single test → 484 ms (`render_cards`)"

Not reproduced by either lane: both saw `l48_gate_composition` in that role.
Re-measured here three times — `l48_gate_composition`, `render_cards` and
`pii_scan` sit within ~50 ms of each other and swap places run to run, all
subprocess-heavy. The magnitude was the claim; the identity was noise reported
as a fact. Restated as "~0.4 s", with the noise named.

## Queued, not fixed — pre-existing and named

- **Six shared blind spots** (Lane A, mutants P4/P6/P7/P16/P17/P18): the sweeps
  never assert `dayMaster.*`, `season.state`/`stateHan`/`stateLabel`/
  `relation`, `families[].rank`, `sources`, or that `favorable`/`unfavorable`
  are non-empty. Mutations of each pass on **both** base and head, so they are
  not regressions — they are what neither shape ever covered.
- **A direct-scan gap** (Lane B): the `tables` object the non-sweep register
  scans inspect never gained `MASTER_MODE_BRIDGE_NOTE` when
  `content/public.v3.js` added it, so that string's register compliance rests
  on the assembled sweep alone.

## Verified true — no finding

- **The measurements.** 1,245 dates, 66,111 strings, 53.1 strings/reading and
  198,333 `expect()` calls reproduce **exactly** in both lanes. ~136 ms of real
  work: Lane A measured 131–183 ms with a consistent split, Lane B 71 ms —
  order-of-magnitude agreement, hardware-dependent. The 94% overhead figure
  holds against each lane's own base measurement.
- **The speed-up.** Register sweep 2,169 → 100 ms here, 2,333 → 122 ms (Lane A),
  2,213–2,313 → 100–110 ms (Lane B). File 3,847 → 696 ms here; Lane B measured
  696 ms exactly. Rank slowest → third: exact in both lanes.
- **The ten planted violations** all fail identically on base and head, in both
  lanes, including single-date violations at the first, middle and last swept
  date. Lane B ran 15+ independent trials and found no case where head passes
  and base fails.
- **No regex `lastIndex` hazard**: neither `SECOND_PERSON_RE` nor
  `DIAGNOSTIC_FRAMING_RE` carries `g`, so the new shape's increased and
  reordered `.test()` calls are stateless — checked specifically because the
  old code short-circuited where the new one does not.
- `toBeTruthy()` → `!x`, `toHaveLength(3)` → `.length !== 3`, the range checks,
  and `.not.toThrow()` → try/catch are equivalent for the values in play; the
  `undefined` case throws rather than asserting, and the test still goes red.
- **No product code touched**; 61 files and no `package.json` change; no
  `fetch(`, no new localStorage key, no jsdom; `index.html` 659 lines; CLAUDE.md
  counts match.
- **CI on `321ade1`:** `test` **success**, `product-audit` **success**,
  `l48-gate` failure — both lanes confirmed from the job log that the sole
  reason is the missing in-PR artifact, and that `mergeable_state: unstable` is
  explained entirely by it.

## Stated plainly — not reproduced

- Neither lane reproduced the exact 52/37/47 ms sub-breakdown (order of
  magnitude only, and host-dependent).
- Neither reproduced the `render_cards` attribution; see above.
- Lane A did not re-run the pr238 contention experiments and says so — its
  finding is about the transfer of those figures, not their original validity.
- Lane A's mutant P22 is inconclusive rather than a pass: the date chosen had
  `bridgeNote === null`, making the mutation a no-op. P24 covers the same
  predicate on a live field.

## Final state of the reconciled branch

- `tests/public.test.js` **42 → 44 tests** (the transformation added none; the
  reconciliation adds two guard-the-guard tests); suite **2,131 → 2,133**.
- **Seven reconciliation mutants, all killed**: the `-0` posture on one swept
  date; `expectNone` made vacuous; the matcher fed `''`; a single-term register
  hit ignored; every text blanked before the scan; the same reading for every
  date; the stride narrowed to 73.
- Suite 61 files / 2,133 tests green; assurance suite 121 OK; product audit
  PASS. `public.test.js` ~620 ms of assertion time.

**Merge remains the controller's word per §10 / L48. This artifact claims no
merge authority.**
