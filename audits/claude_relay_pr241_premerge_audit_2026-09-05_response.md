# PR #241 pre-merge audit — two-lane relay, reconciled

**PR:** 8ball #241 — `tests/public.test.js`: the six
shared blind spots pinned on every swept date.
**Head audited:** `116fef7` (both lanes). **Base:** `464c400` (merged #240).
**Reconciliation commit:** the one carrying this file.
**Lanes:** A (behavioural mutants of `core/public.js`, baseline
verification, matcher-semantics, vacuity, cost) and B (test-body mutants,
content-table mutants, independence audit, lattice and full-walk cost).
Each worked in its own clone; neither touched the working tree.

## Reconciliation — what was found, what was done, what was measured

| # | lane | severity | finding | action | verified on the reconciled file |
|---|---|---|---|---|---|
| 1 | A | HIGH-1 | "All eleven survived" not reproducible; four impossible under the register sweep's exact `scanned`/`chars` pins | Baseline re-measured in three forms and restated in the journal: unconditioned 0/9 survive base; single-date @1937-03-14 (off-lattice) 11/11; single-date @1900-03-16 (on-lattice) 9/9 — the last is the real gap and the first draft had measured the second while describing the first | base worktree runs recorded below |
| 2 | A | HIGH-2 | "every field" nine fields short; nine BEHAVIOURAL mutants survive the full suite (families label/body, anti-fit label/body, posture stance/register, mode method, dob swapped, dob year +1) | Every leaf now re-derived: dob, all of mode (8), all of posture (5), families' label/character/body per registry row, anti-fit restated from the priority's last character, role line restated as the two-field join | all nine FX-gated survivors fail (2 tests each) |
| 3 | A | HIGH-2 | "No mutant survives on a swept date" — universal claim refuted | Sentence removed; replaced by the measured lists | — |
| 4 | A | MED-1 | No work counter, no positive control; loop gutted to one date stays green | Block returns `checks`; sweep pins readings = 1,985 and checks = 1,985 × 58 exactly; positive control corrupts all 65 leaves one at a time plus emptied/reversed lists and a sources copy | gutted loop → `expected 1 to be 1985`; one check deleted → `expected 57 to be 58` |
| 5 | A | MED-2 | `sameList` `.every` skips holes | Index loop, hole on either side is a difference; sentinel pins four sparse cases | sentinel green; sparse cases false |
| 6 | A+B | MED-3 / MED-1 | Registry checks are self-referential against table corruption; keys-after-identity check compares an object with itself | Limit stated in the block's comment and the journal, with the mechanism that owns table correctness named; keys check dropped (pinned once in table-integrity) | Lane B's three table mutants still caught by the named mechanisms |
| 7 | A | MED-4 | Two registry tests partly overlap base (frozenness, strong/weak membership) | Overlap and the genuinely new content recorded in the journal; tests kept for the new content | — |
| 8 | B | MED-2 | Season rule took the reading's own element, so the element check had zero redundancy | Independently derived element/strength/birthday feed every downstream check | element line deleted + date-scoped element mutant @1900-03-16 → 4 checks fail |
| 9 | A | LOW-1 | Block threw a TypeError on a non-list, aborting collection | Guarded (`list()`/`obj()`), never throws; collects 2 offenders per date | `favorable: undefined` → 3,970 offenders listed; the remaining TypeError is the pre-existing anti-fit sweep's |
| 10 | B | LOW-1 | `\|\| {}` guards degrade diagnostics only | Superseded by the never-throw guards above | — |
| 11 | A | LOW-2 | Cost understated | Journal states +28% on the file #240 made cheaper (640–654ms → 815–840ms, 3 runs each), rank and suite wall clock unchanged | measured |
| 12 | A | NOTE-1 | Lanes saw different trees (Lane B's fix was in the working tree while Lane A ran) | Reconciled here at Lane B's severity; Lane A is right that it was a hardening, not a survivor fix — recorded as such | — |
| 13 | A | NOTE-2 | l48-gate red until the artifact lands | This file | CI on the reconciliation commit |
| 14 | CI | blocking | `product.diff_check` red on `ba89bb4`: `git diff --check origin/main...HEAD` flagged a trailing blank line at the end of THIS file, added when the two reports were concatenated | Blank line removed in the follow-up commit. The local audit had reported PASS because the artifact was still untracked when it ran, so the diff range did not include it — a sequencing gap, recorded here | `git diff --check` clean before the push |

**Test-body mutants** (Lane B) that fail on every date unconditionally
(`[1,2,3]` → `[1,2]`, `differs` → `!differs`) and the `Object.is` → `==`
no-op are undefendable by construction and are notes, not findings.
The one test-body class that now IS defended is a dropped check — the
exact count pin fails.

**Not taken, on record.** A second coprime-stride walk (Lane B, ~140ms,
lattice 2.7% → 5.4%) — cheap, shrinks without closing, controller's call.
A full 1900–2100 walk — 1.84s of building alone (Lane B), not cheap, not
proposed.

## Baseline re-measurement on `464c400` (46 tests)

```
unconditioned: element(sheng) 3 failed · polarity 3 · state wang→xiang 2 · relation←label 2
               han xiu→囚 1 · sources {} 2 · favorable [] 3 · unfavorable [] 3 · primary wrong end 3
@1937-03-14:   element, polarity, state, relation, han, rank99, reversed, sources {},
               favorable [], unfavorable [], primary — ALL 46 passed (off-lattice)
@1900-03-16:   element, polarity, state, han, rank99, sources {}, favorable [], primary — ALL 46 passed (on-lattice, the real gap)
```

## Reconciled head — mutant runs (51 tests in the file)

```
Lane A survivors, FX-gated:  S1 S2 S3 S6 S9 S10 S11 H1 P10 → 2 failed each
Branch's 23 + xiu↔qiu swap:  all fail (2–6 tests each)
@1900-03-16 single-date:     element polarity relation han sources favorable unfavorable primary → 2 failed each;
                             state→死 was a no-op (死 is that date's state); replanted as a change → 2 failed
Vacuity:                     loop gutted to one date → readings pin fails; one check deleted → count pin fails
Lane B MED-2 repro:          element line deleted + element mutant @1900-03-16 → 1 failed (4 downstream checks)
```

## Suite on the reconciled head

`npm test` 61 files / 2,140 tests green · `python3 -m unittest audits.test_project_audit` 121 OK · `python3 audits/project_audit.py` PASS · PII scan and repo_shape green.

---

# Lane A report (verbatim, against `116fef7`)

# Lane A — adversarial pre-merge audit, PR #241 (8ball)

- Repo under review: `/home/user/8ball`, branch `claude/eight-ball-app-testing-rqphfo`, head `116fef7`, base `464c400`.
- All work done in a private clone at `.../scratchpad/laneA` plus a detached worktree of the base at `.../scratchpad/base`. **Nothing in `/home/user/8ball` was modified, staged, committed or pushed by this lane.**
- Verified environment: `npm ci` clean, vitest 4.1.9, node in-container.
- Baseline sanity: base `464c400` = 61 files / 2,135 tests / `tests/public.test.js` 46 tests; head `116fef7` = 61 files / 2,139 tests / `tests/public.test.js` 50 tests. Both green.

Method note: a mutant is called **BEHAVIOURAL** when `buildPublicReading` returns different data for at least one date in 1900-01-01..2100-12-31, and **SOURCE-SHAPE** when the output is byte-identical. Off-fixture mutants are gated on a literal list of the 21 snapshot-fixture dates so the fixture block cannot do the killing; that gate is a deliberate steelman of the branch's own baseline method, not a strawman.

---

## HIGH-1 — The stated baseline ("all eleven survived the 46 tests") is not reproducible, and at least four of the eleven are provably impossible

**Where:** `journal.md` 2026-09-05 entry, "Baseline, re-measured on the merged head before touching anything… All eleven survived"; PR #241 body, "On the merged head `464c400`, eleven single-line mutations of `core/public.js` survived all 46 tests".

**Reproduction (base worktree, 464c400):**

```
cd .../scratchpad/base
# natural, unconditioned forms of the eleven described mutations
python3 ../runmut.py . ../base_mutants.json
```

Result on `464c400`, 46 tests:

| described mutation | my unconditioned form | my fixture-avoiding form |
|---|---|---|
| `dayMaster.element` wrong | KILLED | **SURVIVED** |
| `dayMaster.polarity` flipped | KILLED | KILLED |
| `season.state` wrong | KILLED | KILLED |
| `season.relation` wrong | KILLED | KILLED |
| `season.stateHan` wrong | KILLED | **SURVIVED** |
| `families[0].rank` = 99 @1937-03-14 | SURVIVED | — |
| ranks reversed @1937-03-14 | SURVIVED | — |
| `sources` replaced by `{}` | KILLED | KILLED |
| `favorable` emptied | KILLED | KILLED |
| `unfavorable` emptied | KILLED | KILLED |
| `primaryFavorable` ≠ `favorable[0]` | KILLED | KILLED |

So the reproducible baseline is **2 of 11 surviving**, plus the two off-lattice single-date probes — not eleven.

**Why the difference, and why four of them cannot ever have survived.** The killer on base is almost never a value check; it is the exact counters in `tests/public.test.js:846` (`assembled output carries the same register across the sweep`), which pin `scanned` = 66,111 strings and `chars` = 1,414,086 characters over the stride-59 sweep. Measured contributions of the mutated fields to those two pins:

```
sources     contributes 7,470 strings / 339,885 chars
favorable   contributes 2,989 strings /  13,684 chars
unfavorable contributes 3,236 strings /  14,951 chars
polarity    contributes 4,358 chars (623 'yang' + 622 'yin' over 1,245 dates)
```

- `sources: {}` deletes 7,470 strings from `scanned`. There is no encoding of that mutation that fires on the stride-59 lattice and leaves `scanned` at 66,111.
- `favorable: []` / `unfavorable: []` likewise delete strings from `scanned`.
- A yang↔yin flip moves `chars` by exactly `622 − 623 = −1`. `4,358 → 4,357`. Killed by one character.
- `primaryFavorable` from the wrong end re-ranks `families`, which moves `chars` by thousands.

The only mutations that can survive base are those that are **length-preserving and string-count-preserving** (`wood`→`fire`, `旺`→`相`). The journal and the PR body describe none of that, so as written the baseline claim overstates the pre-existing gap by roughly 5x. This is the same class of defect the branch itself calls out about #240 ("detection proved identical").

**What should happen.** Either (a) publish the eleven exact mutant diffs in the L48 artifact so the claim is checkable, or (b) restate it honestly, e.g.: *"On `464c400` the sweeps checked shape, not value; value errors were caught only incidentally, by the fixture snapshot and by the register sweep's exact string/character counters, which fire on any length-changing edit. Two length-preserving mutants (`dayMaster.element` wood→fire, `season.stateHan` 旺→相) survived all 46 tests, and two single-date rank probes survived because they were planted off the stride-37 lattice."*

---

## HIGH-2 — The new test's own name overclaims: "every field" is nine fields short, and nine BEHAVIOURAL mutants survive the whole 2,139-test suite

**Where:** `tests/public.test.js:334`, `it('every field of every swept reading re-derives from the calibrated pillar and the frozen registries')`. Echoed in `journal.md` ("re-derives every field from the level BELOW the helper that produced it") and the PR body ("re-derives every field").

The sweep re-derives `dayMaster.*`, `season.*`, `strength`, `favorable/unfavorable`, `primaryFavorable/Unfavorable`, `favorabilityNote`, `families[].{rank,character,element,key}`, `sources`. It does **not** touch `dob.*`, `posture.{stance,register}`, `mode.method`, `antiFit.*`, or `families[].{label,body}` — and for those there is no other test either.

**Reproduction (head clone, all mutants gated to skip the 21 fixture dates):**

```
cd .../scratchpad/laneA
python3 ../runmut.py . ../s_mutants.json     # length-preserving string corruptions
python3 ../runmut.py . ../h_mutants.json     # dob / numeric fields
npx vitest run                               # with each mutant applied: 2139 passed
```

Nine BEHAVIOURAL survivors of the **full suite** (`61 files / 2,139 tests, 0 failures` with each applied one at a time). Every one corrupts the reading on 1,964 of the 1,985 swept dates, and on ~73,393 of the 73,414 real dates:

1. `families[].label` reversed — a family is displayed as `htworg` instead of `growth`.
2. `families[].body` reversed.
3. `antiFit.label` reversed.
4. `antiFit.body` reversed.
5. `posture.stance` reversed — and note this makes `r.posture.stance` disagree with `r.roleLine`, which is built from the true stance. Nothing pins `roleLine === posture.stance + ', ' + mode.method + '.'` across the sweep.
6. `posture.register` reversed.
7. `mode.method` reversed — same self-inconsistency with `roleLine`.
8. `dob.month` / `dob.day` swapped.
9. `dob.year` off by one.

Exact edit for #1 (the others are the same shape; `FX` is the literal 21-date fixture string):

```js
// core/public.js, buildPublicReading return
families: rankDomainFamilies(primaryFavorable, birthday)
  .map((family, index) => ({ rank: index + 1, ...family,
      label: FX.includes(dobIso) ? family.label
           : family.label.split('').reverse().join('') })),
```

These are **pre-existing** gaps, not regressions — I confirmed 1, 5 and 8 also survive `464c400`'s 46 tests. The branch does not make anything worse. But it publishes a test whose name asserts completeness it does not have, in a repo whose doctrine is that a placard recording the wrong derivation is worse than none.

Note the mechanism: the only thing guarding those seven text fields across the sweep is the register sweep's character total, which is a **length checksum**. Any same-length corruption walks straight through. The branch's own framing ("the six shared blind spots… pinned") reads as if the sweep is now complete; it isn't.

**What should happen.** Rename the test to what it does — e.g. *"the day master, season, favourability, families and sources of every swept reading re-derive from the calibrated pillar and the frozen registries"* — and either add the missing fields or record them in the journal as knowingly-unpinned, with the survivor list above.

---

## MED-1 — The new sweep is vacuity-detectable only by the date count; it has no work counter and no positive control

**Where:** `tests/public.test.js:334–406`.

**Reproduction:**

```
cd .../scratchpad/laneA
# insert one line after the destructure at tests/public.test.js:346
#     if (dob !== '1900-01-01') continue;
npx vitest run tests/public.test.js
→ Test Files 1 passed (1) / Tests 50 passed (50)
```

Gutting the sweep from 1,985 dates to 1 leaves the file fully green. `sweepList(37, 1985)` pins that the *list* has 1,985 entries, but nothing pins that the body ran 1,985 times or made N checks.

This directly contradicts the standard the same file writes down 500 lines lower, at `tests/public.test.js:855-862`: *"EXACT counts, coverage, and a positive control — not a floor… Every pin is exact now and every count comes from the same loop that ran the predicates."* That comment exists because a #240 audit finding was exactly this. The new sweep is the one sweep in the file that does not follow it.

**What should happen.** Count the checks inside the loop and pin the total exactly (`expect(checks).toBe(<n>)`), the way `registerOffenders` returns `scanned`/`chars`; and add a positive control that feeds a deliberately-wrong reading through the same predicate block and asserts it is flagged.

---

## MED-2 — `sameList` silently passes on sparse arrays, and the new sentinel does not pin it

**Where:** `tests/public.test.js:186` (definition), `tests/public.test.js:934` (sentinel).

```js
const sameList = (a, b) =>
  Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
```

`Array.prototype.every` **skips holes**. Reproduction:

```
node -e "const sameList=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
console.log(sameList(new Array(3),[1,2,3]));  // true
console.log(sameList([,1],[9,1]));            // true"
```

So an all-holes array of the right length compares equal to *anything*. The sentinel at :934 covers `[]`, order, `-0`, `NaN`, `'1'` vs `1`, and five non-array inputs — it does not cover a single sparse array, which is the one asymmetry between `sameList` and the deep-equal matcher it replaces (`expect([,1]).toEqual([9,1])` fails).

Not reachable from today's product code (`favorable` is a spread of a frozen dense array; `ranks` and the key lists come from `.map`). But the whole stated purpose of that describe block is that a helper rewrite must not be able to change matcher semantics with every test green — and this is a semantics gap the sentinel currently licenses.

**What should happen.** Add `expect(sameList(new Array(3), [1, 2, 3])).toBe(false)` (and fix `sameList` to compare by index rather than `.every`, e.g. `a.every((_, i) => Object.is(a[i], b[i]))` — which still skips holes — or an explicit `for` loop, which does not).

---

## MED-3 — The sweep's registry checks are self-referential, so they cannot detect a content-table change; the journal calls them "the frozen registries" as if they could

**Where:** `tests/public.test.js:369, 376, 391, 401` — `SEASONAL_STATES[r.season.state]`, `ELEMENT_FAVORABILITY[…]`, `getWorkMode(r.mode.birthday).priority`, `PUBLIC_SOURCES` are all read from `content/public.v3.js`, the same objects `core/public.js` read.

By construction the sweep asserts *"the reading agrees with the table it was built from"*, which is a strictly weaker property than *"the reading is right"*. Any edit to `content/public.v3.js` (or v1/v2 through it) leaves the whole sweep green; only the fixture snapshot, the register char pins, and the pre-existing `independent anchors` block can see it. Confirmed on head: a `wood_strong.favorable` reorder in `content/public.v1.js` is caught by the fixture snapshot and the sheng/ke re-derivation at `tests/public.test.js:580`, not by the new sweep.

Two smaller instances of the same tautology inside the new test:

- `tests/public.test.js:402` — `sameList(Object.keys(r.sources), sourceKeys)` runs *after* `Object.is(r.sources, PUBLIC_SOURCES)` at :401. If the identity check passes, the key check is a comparison of an object's keys with its own keys: it can never fail independently. The journal sells it as an extra pin ("with its keys in the frozen order — a copy fails"); the copy case is already fully covered by :401.
- `tests/public.test.js:351` — `differs(r.dayMaster.stem, STEMS[pillar.stemIndex])` is byte-identical to production's `stem: STEMS[pillar.stemIndex]`, and `:353`'s `pillar.stemIndex % 2 === 0 ? 'yang' : 'yin'` is byte-identical to `getDayMaster`'s polarity expression. They pin the pass-through, not the rule. The hand-written `seasonRule` at :338–344 is the one genuinely independent restatement in the test, and it is the right model for the rest.

**What should happen.** State the limit in the journal — the sweep pins *reading↔table consistency*, and table correctness rests on the fixture snapshot plus the `independent anchors` block. Drop or justify :402.

---

## MED-4 — Two of the four new tests are partly redundant with tests already on `464c400`

**Where:** `tests/public.test.js:716` and `:732`.

- `:737` `expect(Object.isFrozen(PUBLIC_SOURCES)).toBe(true)` is already asserted on base at `tests/public.test.js:801` (`every table is frozen`), which iterates a list containing `PUBLIC_SOURCES`.
- `:716`'s `expect(['strong','weak']).toContain(state.strength)` is already asserted on base at `:296-301` (`every seasonal state resolves…`), for every state reached by the total five-relation walk.

The genuinely new content of those two tests is: the exact key order `['wang','xiang','xiu','qiu','si']`, `state.key === key`, non-empty `han`/`label`/`relation`, the 旺相-strong / 休囚死-weak split, five distinct han, and `PUBLIC_SOURCES`' exact six keys with non-empty citations. That is real (mutant P8, `xiang.strength` strong→weak in `content/public.v1.js`, is killed by `:716`), but the PR body's framing of them as new "registry-shape" coverage is broader than the delta.

Also worth stating plainly: neither registry test pins the *content* of `han`, `label` or `relation` beyond non-emptiness, so a one-character typo in a relation string is still visible only to the fixture snapshot.

---

## LOW-1 — The new sweep aborts on a TypeError instead of collecting, in the one case the collecting pattern exists for

**Where:** `tests/public.test.js:381` (`r.favorable.every(...)`) and `:383` (`r.favorable.some(...)`), guarded at :378 by a push rather than a `continue`.

**Reproduction:** set `favorable: undefined` in `core/public.js`'s return →

```
FAIL tests/public.test.js > … > every field of every swept reading re-derives …
TypeError: Cannot read properties of undefined (reading 'every')
```

The file's own rationale for collecting (`tests/public.test.js:150`) is *"a failure lists every offending date instead of aborting on the first."* Here it aborts on the first, with no date list. Fix: `continue` after the non-array push, or use `(r.favorable || [])`.

---

## LOW-2 — Cost is understated in the journal

Measured, 3 runs each, `npx vitest run tests/public.test.js` (vitest's `tests` figure):

| | run 1 | run 2 | run 3 | mean |
|---|---|---|---|---|
| base `464c400` | 658 ms | 652 ms | 627 ms | **646 ms** |
| head `116fef7` | 779 ms | 744 ms | 791 ms | **771 ms** |

In-suite file duration: **678 ms → 870 ms (+28%)**; rank in the suite unchanged (3rd, behind the l48-composition file at ~2.4 s and the card renderer at ~0.95 s). Full-suite wall clock: base 7.70 s / 7.95 s, head 7.99 s / 7.68 s — genuinely unmoved.

The journal says *"the file runs 50 tests in ~800ms of test time, unchanged in rank, and the suite's wall clock did not move."* Both halves are true, but the sentence omits that this is a **+19% to +28% increase on the file the immediately preceding PR (#240) existed to make cheaper**. Say so.

---

## NOTE-1 — The head under review differs from the operator's working tree

`git status` in `/home/user/8ball` shows `tests/public.test.js` modified with uncommitted changes attributed in-comment to the other audit lane ("pr241 audit, MED-2"), decoupling `dayMaster.element` from the downstream derivations. My clone was taken from committed state, so **this report is against `116fef7` as committed** and none of my findings account for that in-flight edit. Adversarially: that particular coupling is *not* independently exploitable, because `:352` pins `r.dayMaster.element` against `STEM_ELEMENTS[pillar.stemIndex]` before anything downstream uses it — a wrong element is caught by that check regardless. It is a hardening, not a survivor fix. Worth reconciling so the two lanes do not record it at different severities.

## NOTE-2 — `l48-gate` is red on the PR

Check runs on `116fef7`: `test` success, `product-audit` success, `l48-gate` **failure**, Netlify checks success/neutral. That is the expected state (the artifact is filed with the PR number after the audit), and the PR body's test plan carries it unchecked. It must go green before merge per CLAUDE.md.

## NOTE-3 — The engineering that *is* right

Verified and worth recording so the reconciliation does not over-correct:

- The five-relation `seasonRule` restatement at `:338-344` is genuinely independent of `getSeasonalState`; a xiu↔qiu swap inside `core/public.js`'s `getSeasonalState` is killed by it (4 failures).
- `Object.is(r.sources, PUBLIC_SOURCES)` at `:401` kills the shallow-copy mutant that nothing else catches.
- The `sameList` sentinel correctly pins `-0`, `NaN`, string-vs-number, length mismatch and five non-array inputs; `differs`/`Object.is`/`.includes`/`indexOf` all behave as the comments claim.
- `SEASONAL_STATES[…] || {}` and `ELEMENT_FAVORABILITY[…] || {}` are not vacuity holes: a bad `season.state` is caught by the `stateKeys.includes` check at `:367` before the `|| {}` fallback can absorb anything, and a bad favourability key is caught by `Array.isArray` + `sameList(x, undefined) === false`. I could not construct a reading whose field goes `undefined` and passes the block.

---

## Verified claims

| claim (journal / PR body) | verdict |
|---|---|
| base 46 tests → head 50 tests | **TRUE** (measured) |
| suite 2,135 → 2,139 tests, 61 files, green | **TRUE** (measured) |
| `sweepList(37, 1985)` is the right pin | **TRUE** — the stride-37 walk over 1900-01-01..2100-12-31 yields exactly 1,985 dates, first `1900-01-01`, last `2100-12-26` |
| 1937-03-14 is off the stride-37 lattice; nearest swept date 1937-03-07 | **TRUE** — 1937's swept dates are 01-29, 03-07, 04-13, … |
| the two single-date rank probes survive at 1937-03-14 and fail at 1900-03-16 | **TRUE** — reproduced both, on base and head |
| 1900-03-16 is on the lattice | **TRUE** (third swept date) |
| "the full range is 73,414 readings this file deliberately does not walk" | **TRUE**; the sweep covers 2.70% of them |
| a copy of `sources` fails | **TRUE** (`Object.freeze({...PUBLIC_SOURCES})` killed) |
| the `sameList` sentinel sits with the `differs`/`inRange` sentinels | **TRUE** (`:915` and `:934`, same describe block) |
| `python3 -m unittest audits.test_project_audit` → 121 OK | **TRUE** (121 tests, OK, 94.6 s) |
| `python3 audits/project_audit.py` → PASS | **TRUE** (PASS, 13 pass / 0 fail / 0 warn / 1 skip on a clean tree; the entry's "12 pass, 1 warn" reflects the dirty tree at the time) |
| PII scan + `repo_shape` green on head | **TRUE**; `core/` 14, `ui/` 14, `tests/` 61 all match CLAUDE.md |
| suite wall clock did not move | **TRUE** (7.7–8.0 s both sides) |
| "unchanged in rank" for `public.test.js` | **TRUE** (3rd both sides) |
| **"All eleven survived" the 46 tests** | **NOT REPRODUCIBLE** — see HIGH-1; ≥4 of the 11 are provably impossible under base's exact `scanned`/`chars` pins |
| **"No mutant survives on a swept date."** | **FALSE as written** — nine BEHAVIOURAL mutants survive the full 2,139-test suite on swept dates (HIGH-2). True only of the branch's own 21. |
| **"re-derives every field"** / test name "every field of every swept reading" | **FALSE** — `dob.*`, `posture.{stance,register}`, `mode.method`, `antiFit.*`, `families[].{label,body}` are re-derived nowhere |

## Survivor mutants

All gated with `FX = '1900-01-01 1911-05-06 1912-01-07 1916-02-03 1927-09-09 1927-09-08 1919-01-01 1930-09-29 1966-01-21 1970-05-05 1984-02-02 2000-01-01 2000-02-29 2000-05-04 2020-08-08 2024-02-10 2050-06-15 2077-11-07 2100-12-31 1980-06-11 1995-09-22'` so the snapshot fixture cannot do the killing. All in `core/public.js`. All verified against the **full suite** at head: `61 files / 2,139 tests, 0 failed`.

| # | class | exact edit (in `buildPublicReading`'s return) | head `public.test.js` | full suite |
|---|---|---|---|---|
| S1 | BEHAVIOURAL | `families: …map((family, index) => ({ rank: index+1, ...family, label: FX.includes(dobIso) ? family.label : family.label.split('').reverse().join('') }))` | 50/50 pass | 2139 pass |
| S2 | BEHAVIOURAL | same, `body:` instead of `label:` | 50/50 pass | 2139 pass |
| S3 | BEHAVIOURAL | `stance: FX.includes(dobIso) ? posture.stance : posture.stance.split('').reverse().join('')` | 50/50 pass | 2139 pass |
| S6 | BEHAVIOURAL | `antiFit: FX.includes(dobIso) ? {...getAntiFitFamily(primaryUnfavorable, birthday)} : {...getAntiFitFamily(primaryUnfavorable, birthday), label: …reverse()}` | 50/50 pass | 2139 pass |
| S9 | BEHAVIOURAL | `register: FX.includes(dobIso) ? posture.register : posture.register.split('').reverse().join('')` | 50/50 pass | 2139 pass |
| S10 | BEHAVIOURAL | `method: FX.includes(dobIso) ? mode.method : mode.method.split('').reverse().join('')` | 50/50 pass | 2139 pass |
| S11 | BEHAVIOURAL | `antiFit: … body: …reverse()` | 50/50 pass | 2139 pass |
| H1 | BEHAVIOURAL | `dob: FX.includes(dobIso) ? { year, month, day } : { year, month: day, day: month }` | 50/50 pass | 2139 pass |
| P10 | BEHAVIOURAL | `dob: FX.includes(dobIso) ? { year, month, day } : { year: year + 1, month, day }` | 50/50 pass | 2139 pass |
| P2 | SOURCE-SHAPE | `favorable: favorability.favorable` (drops the defensive copy; array is frozen, output deep-equal) | 50/50 pass | not run |
| B6/B7 | BEHAVIOURAL, off-lattice | rank probes planted at 1937-03-14 | 50/50 pass | not run — off-lattice by construction, exactly as the branch states |

Killed on head (for contrast, all verified): the branch's eleven baseline forms in both unconditioned and fixture-avoiding encodings; `families[0].rank=99` and reversed ranks at 1900-03-16; `getSeasonalState` xiu↔qiu swap; `sources` shallow copy; `sources` unfrozen; `SEASONAL_STATES.xiang.strength` flipped; `wood_strong.favorable` reordered; `MASTER_MODE_BRIDGE` 33→5; `posture.number` +1 and −0; `mode.modeKey` shifted; `mode.dayOfMonth` +1; `mode.birthday` misreported; `posture.arcana`/`posture.roman` corrupted; `mode.theme` corrupted; `favorabilityNote` corrupted; `roleLine` corrupted; `antiFit` drawn from the favourable element; `dayMaster.stem` shifted two.

---

## Verdict

**MERGEABLE AFTER FIXES.** The change is test-only, adds real detection (it kills both mutants that genuinely survived the base file, plus the replanted single-date rank probes), regresses nothing, costs ~125 ms of test time, and leaves the suite, the PII scan, `repo_shape`, the CLAUDE.md counts and the product audit green. Nothing here touches product behaviour, so none of the findings is a correctness risk to the deployed site.

What must change before merge — all of it text, none of it product code:

1. **HIGH-1** — Correct the baseline claim in `journal.md` and the PR body. Either publish the eleven exact mutant diffs, or restate to what is reproducible: two length-preserving mutants survived, plus two off-lattice probes; the rest were caught incidentally by the fixture snapshot and the register sweep's exact `scanned`/`chars` pins. Four of the eleven as described are impossible to have survived, and the L48 artifact should say so.
2. **HIGH-2** — Rename the new test so it names the fields it actually re-derives, and remove "every field" from the journal and PR body. Record the nine full-suite survivors above as knowingly-unpinned (or pin them).
3. **HIGH-2** — Delete or qualify the journal sentence "No mutant survives on a swept date." It is a universal claim refuted by nine mutants.
4. **MED-1** — Add an exact in-loop check counter and a positive control to the new sweep, per the standard the same file sets at `:855`.
5. **MED-2** — Pin the sparse-array case in the `sameList` sentinel, and make `sameList` hole-safe.
6. **MED-3** — State the sweep's self-referential limit w.r.t. `content/public.v3.js`; drop or justify the tautological key check at `:402`.
7. **LOW-1** — `continue` after the non-array push at `:378` so the sweep collects instead of throwing.
8. **LOW-2** — Say in the journal that the file got 19–28% slower, one PR after the PR that made it faster.
9. **NOTE-2** — `l48-gate` must be green (artifact filed under the real PR number) before merge; per CLAUDE.md/§10 the controller is the sole merge authority and no merge happens before an explicit audit-cleared signal.



---

# Lane B report (verbatim, against `116fef7`)

# Lane B report — PR #241 (test-body mutants, content mutants, independence audit, lattice cost)

Scope: `tests/public.test.js` only (test-only PR). All experiments run in an
isolated clone of the branch under review (HEAD 116fef7, base 464c400); every
mutant was reverted with `git checkout --` and the tree is confirmed clean
(`git status --short` empty) at the end of this session.

## Findings

### MED-1 — The sweep's re-derivation is tautological against content-table corruption for six of its checks

**File:line:** `tests/public.test.js:367-401` (season state/han/label/relation/
strength, favorable/unfavorable lists, sources content).

**Reproduction:**
```
# flip a table value in content/public.v1.js (which content/public.v3.js
# re-exports unedited), then run the new sweep alone:
sed -i "57s/strong/weak/" content/public.v1.js   # SEASONAL_STATES.wang.strength
npx vitest run tests/public.test.js --reporter=verbose | grep -E "×|swept"
git checkout -- content/public.v1.js
```

**What happened.** The new sweep's checks for `season.stateHan`,
`season.stateLabel`, `season.relation`, `strength`, `favorable`,
`unfavorable`, `favorabilityNote`, and the sources block's *content* all
compare `buildPublicReading()`'s output against
`SEASONAL_STATES[r.season.state]` / `ELEMENT_FAVORABILITY[...]` / the
`PUBLIC_SOURCES` object itself — the exact same (frozen) table object
`core/public.js` reads at runtime. A corruption planted directly in the
table is read by both sides of the comparison and they agree by
construction. Confirmed three times:

- `SEASONAL_STATES.wang.strength` flipped `strong`→`weak`: the new sweep
  test passes untouched; the mutation is caught only by the **new**
  table-integrity test (`the five seasonal states each carry...`, which
  pins 旺相=strong/休囚死=weak) and, coincidentally, by the register
  character-count pin (`'weak'` vs `'strong'` have different lengths).
- `ELEMENT_FAVORABILITY.wood_strong.favorable` reordered
  (`['fire','earth','metal']`→`['metal','earth','fire']`, changing
  `primaryFavorable`): the new sweep test passes untouched. Caught only by
  the **pre-existing** (not part of this PR) `re-derives every favorability
  entry from the sheng and ke cycles` test and the fixture snapshot.
- `SEASONAL_STATES.xiang.han` duplicated to `'旺'`: the new sweep test
  passes untouched. Caught only by the new table-integrity test's "five
  distinct han" pin and the fixture snapshot.

**What should happen / why it matters.** The journal's framing —
"re-derives every field ... from the calibrated pillar and the frozen
registries" — is accurate for engine bugs (a wrong value assembled inside
`buildPublicReading`) but not for **table-content** bugs in
`SEASONAL_STATES` / `ELEMENT_FAVORABILITY`, where the sweep can never
disagree with itself. This is not a hidden gap today — every content
mutant tried above was still caught, just by mechanisms outside this PR's
diff (fixture snapshot, the pre-existing sheng/ke re-derivation test, or
the two new table-shape tests) — but the PR's own commit message overstates
what the *new* sweep specifically buys for these fields. Worth a one-line
correction in the next journal entry rather than a code change: name which
fields the sweep defends (engine-to-table fidelity) versus which are
defended by other, already-existing tests (table correctness).

### MED-2 — `season.state`'s "independent" rule takes its element input from the reading, not the pillar — no defense if the day-master element check is ever weakened

**File:line:** `tests/public.test.js:352` (day-master element check) and
`:363` (`seasonRule(r.dayMaster.element, seasonElement)`).

**Reproduction:**
```
sed -i "352d" tests/public.test.js   # delete only the day-master element line
# plant a date-scoped element mutant in core/public.js (non-anchor date):
#   element: (year===1900 && month===3 && day===16) ? 'wood' : pillar.stemElement,
npx vitest run tests/public.test.js   # 50/50 pass — mutant is invisible
git checkout -- tests/public.test.js core/public.js
```

**What happened.** With only the element-membership/element-equality line
removed, a `getDayMaster` element bug on a single swept, non-anchor,
non-fixture date (1900-03-16) is caught by **nothing** — not the season
check, not the family checks, not any pre-existing test. This is because
`seasonRule(r.dayMaster.element, seasonElement)` takes the reading's own
(possibly wrong) `r.dayMaster.element` as input rather than
`STEM_ELEMENTS[pillar.stemIndex]` recomputed independently; and because in
the real implementation the same `dayMaster.element` value feeds both the
reported field and `getSeason`'s internal computation, so the two can never
disagree by construction. In the shipped PR this is not exploitable (the
element check line itself catches the bug), but it means that check has
**zero redundancy** anywhere else in the file for this exact defect class —
delete or subtly break it and the entire day-master-element/season
machinery goes blind on every date not covered by an anchor or fixture.

**What should happen.** Not a blocking issue, but worth naming as a fragility:
if a future edit touches the day-master block of the sweep, the season
checks give a false sense of backup. A one-line comment noting "season's
element input is NOT independently re-derived; it trusts the day-master
check above it" would prevent a future editor from believing there's
double coverage where there is single coverage.

### LOW-1 — Removing the `|| {}` guards degrades diagnostics but does not lose detection

**File:line:** `tests/public.test.js:369`, `:376`.

**Reproduction:**
```
sed -i "369s/ || {}//" tests/public.test.js
# plant: state: (year===1900&&month===3&&day===16) ? 'bogus' : state.key  in getSeason
npx vitest run tests/public.test.js   # still fails — TypeError, loop aborts after 1 date
git checkout -- tests/public.test.js core/public.js
```

**What happened.** Without the guard, an invalid `season.state` throws a
`TypeError` reading `.han` off `undefined`, which still fails the test
(caught), but aborts the `for` loop after the first offending date instead
of collecting every offender the way `expectNone`'s design intends
(the file's own stated rationale for collect-then-assert). The specific
bug tried here is also independently caught one line earlier by
`stateKeys.includes(r.season.state)`, so no coverage is actually lost —
this is a robustness/diagnostics note, not a detection gap.

### NOTE — Several suggested test-body mutants are undefendable by construction (not findings)

- `[1, 2, 3]` → `[1, 2]` in the ranks check, and `differs`→`!differs` on any
  line: both make the test fail on **every** swept date immediately, on
  correct code. These are self-evidently broken the moment CI runs; nothing
  "catches" them because nothing needs to — they can't ship unnoticed.
- `Object.is(r.sources, PUBLIC_SOURCES)` → `r.sources == PUBLIC_SOURCES`:
  no behavior change at all. `==` and `Object.is` agree on object-reference
  comparison (they only differ on `NaN`/`±0`, neither of which applies to
  object identity), so this "weakening" changes nothing and is not a
  finding.

## Test-body mutants table

| Mutant | Result | Category |
|---|---|---|
| Delete `differs(r.dayMaster.element, ...)` push line | Global element mutant still caught (fixture, hand-walked case, char-count pin); **date-scoped mutant on 1900-03-16 fully undetected** | Undefended for single-date defects (MED-2) |
| Delete same line, then flip polarity globally instead of element | Caught by fixture snapshot, hand-walked case, char-count pin | Defended (redundant with pre-existing anchors) |
| `[1, 2, 3]` → `[1, 2]` in ranks check | Fails immediately on every date, unconditionally | Undefendable by construction — NOTE |
| `differs` → `!differs` (day-master polarity line) | Fails immediately on every date, unconditionally | Undefendable by construction — NOTE |
| `Object.is(r.sources, PUBLIC_SOURCES)` → `==` | No behavioral change; still fails on a shallow-copy mutant | Undefendable by construction (no-op change) — NOTE |
| Remove `\|\| {}` guard on `SEASONAL_STATES[r.season.state]` | Still fails (TypeError) but loop aborts after first offender; the bug tried was already caught one line earlier by the registry-key-membership check | Defended (diagnostics degrade, detection does not) — LOW-1 |

## Content mutants table

| Mutant | File | Caught by | New-sweep catches it? |
|---|---|---|---|
| `SEASONAL_STATES.wang.strength` `strong`→`weak` | `content/public.v1.js:57` | New table-integrity test (旺相/休囚死 pin); register char-count pin (coincidental) | No — tautological (MED-1) |
| `SEASONAL_STATES.xiang.han` duplicated to `'旺'` | `content/public.v1.js:60` | New table-integrity distinct-han pin; fixture snapshot | No — tautological (MED-1) |
| `PUBLIC_SOURCES.families` blanked to `''` | `content/public.v1.js:32` | Pre-existing "no throw/null/empty field" full-range test, fixture snapshot, independent-anchors bridge test, **and** new sources table-integrity test (redundant here) | New sweep's own sources check: no (it only checks identity/key-order, not content) |
| `ELEMENT_FAVORABILITY.wood_strong.favorable` reordered | `content/public.v1.js:95` | Pre-existing (not in this PR) "re-derives every favorability entry from the sheng and ke cycles" test; fixture snapshot | No — tautological (MED-1) |
| `DOMAIN_FAMILIES.wood[1].character` duplicated (`transmission`→`origination`) | `content/public.v1.js:171` | New sweep test itself, plus 9 other tests including the pre-existing table-integrity "one family per character" pin | **Yes** — the priority-order re-derivation catches this one |

## Lattice claim verification

- `sweepDates(37)` yields exactly 1,985 dates (confirmed by direct
  computation of the generator, matching `sweepList(37, 1985)`'s pin).
- `1937-03-14` is **not** in that set; nearest swept dates are
  `1937-03-07` and `1937-04-13` — confirmed.
- `1900-03-16` **is** in the swept set — confirmed.
- Planting the single-date rank mutant (`rank: 99` on `families[0]`) at
  `1900-03-16` (swept): the new sweep test fails, reporting exactly
  `1900-03-16: family ranks [99,2,3] are not [1, 2, 3]` — one offender,
  correctly localized.
- Same mutant planted at `1937-03-14` instead: 50/50 tests pass — the
  defect is fully invisible, exactly as the journal states.
- The `464c400` (pre-PR) baseline was independently re-verified: 46 tests
  pass on a clean checkout; a global `families[].rank += 6` mutation on
  that baseline **is** caught (3 failures: fixture snapshot, hand-walked
  2000-01-01 case, and the master-birthday independent-anchor test) — this
  confirms the journal's "already killed by the fixture snapshot and the
  hand-walked case" claim for the *global* off-by-six is correct and not
  an overclaim.

## Cost of a full 1900–2100 walk

Measured directly (not estimated): building `buildPublicReading()` for
every one of the 73,414 calendar dates from 1900-01-01 to 2100-12-31,
with no assertions at all, took **1,841.6 ms**. The new sweep test itself
(1,985 dates, full field-by-field comparison, collect-then-assert-once
pattern) measured **~137–146 ms** across repeated runs — i.e. ~0.07 ms per
date including all comparisons. Scaling that per-date cost to the full
73,414-date range gives an estimated **~5.1 s** for a full-range version of
just this one test — which would put a single test near or over vitest's
default 5 s per-test timeout, the same problem the 2026-09-04 (#240) entry
retired for a different sweep. **A full-range walk of this sweep is not a
cheap addition and should not be proposed as one.**

A **second sweep at a coprime stride** (e.g. 41, ~2,016 dates) covering the
same fields would cost roughly the same as the existing sweep (~140 ms) —
this is genuinely cheap by the file's own established pattern (it already
runs six sweeps at five different strides for other properties). It would
shrink, not close, the single-date blind spot: two coprime-stride lattices
of ~2,000 dates each over a 73,414-date range overlap on only
~73,414/(37·41) ≈ 48 dates, so the union covers roughly 3,950 of 73,414
dates (~5.4%, up from ~2.7% today) for these six fields. This is a
reasonable, low-cost hardening to suggest for a follow-up, not a blocking
requirement — the existing single-lattice design is an accepted,
explicitly-documented trade-off (journal: "the full range is 73,414
readings this file deliberately does not walk"), and doubling the lattice
density does not eliminate the fundamental unwalked-gap argument, it only
shrinks it.

## Journal / sentence-level accuracy audit

- Test counts: file 46→50 confirmed exactly (measured 46 on `464c400`, 50
  on `116fef7`). Suite 2,135→2,139 confirmed exactly (measured 2,139 on
  `116fef7`; did not re-measure 2,135 on `464c400` directly since Lane A
  owns baseline verification, but the delta of +4 matches "one sweep, two
  registry pins, one sentinel").
- "~800ms of test time" for the file: measured 848–955 ms across repeated
  runs — plausibly "~800ms" but consistently measured slightly higher;
  not material, no action needed.
- "the suite's wall clock did not move (61 files / 2,139 tests, ~8s)":
  measured 61 files / 2,139 tests confirmed exactly; wall-clock duration
  measured 7.66–10.07 s across repeated runs (vitest's own reported
  "Duration" line ranged 8.3–9.3 s) — "~8s" is a reasonable rounding, not
  an overclaim, though on the higher end of what "~8s" implies.
- `product-audit (PASS, 12/1 warn for the dirty tree/1 skip for the absent
  local PII file)`: reproduced exactly — a clean checkout gives 13
  pass/0 warn/1 skip; deliberately dirtying the tree (editing a tracked
  file without committing) reproduces 12 pass/1 warn/1 skip, matching the
  claim precisely.
- The diff itself: confirmed test-only — `git diff 464c400..116fef7
  --stat` shows only `journal.md` and `tests/public.test.js` changed; no
  touch to `core/public.js`, `content/public.v3.js`, or any doctrine file.
  This supports "Same data, same dates, same product code. No doctrine
  claim changes, no version bump."
- Register/banned-token scan of the 2026-09-05 journal entry: no operator
  name/handle, no sibling-project name, no AI model name found in the
  entry text (grepped directly). No "operator" word appears near an ISO
  date in this entry (none found at all — the entry uses "controller"
  nowhere either, since it has no occasion to name either party).
- No PR-body text was available to audit separately from the journal entry
  in this clone (no PR metadata/description file is checked into the
  repository and this session did not fetch the live GitHub PR); the
  journal entry is the only prose artifact reviewed for this item.

## Suite / audit runs

- `npm test` (`npx vitest run`) in the clone: **61 files / 2,139 tests, all
  passed.**
- `npx vitest run tests/pii_scan.test.js tests/repo_shape.test.js`:
  **34 tests, all passed.**
- `python3 audits/project_audit.py` on a clean checkout: **PASS, 13
  pass / 0 fail / 0 warn / 1 skip.**

## Overall verdict

**MERGEABLE AS-IS.**

Every mutant attempted under this lane's angle was caught somewhere in the
suite — no exploitable, ship-blocking gap was found. The two MED items are
precision/documentation concerns about what the *new* sweep specifically
buys (several of its checks are tautological against content-table
corruption and are riding on other, already-existing tests for real
defense; one check has no redundancy anywhere else in the file for its
exact defect class) rather than defects that let a bad reading through
undetected today. The journal's factual claims (test counts, lattice
membership, the two single-date mutant outcomes, the product-audit
pass/warn/skip pattern, and the test-only diff scope) all reproduced
exactly under independent measurement in a clean clone.
