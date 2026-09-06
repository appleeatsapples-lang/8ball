# PR #249 pre-merge audit — two-lane relay, reconciled

**PR:** 8ball #249 — `tests/public.test.js`: the coprime-stride walk — the
re-derivation block on a second lattice.
**Heads audited:** `85d565b` (both lanes; Lane A also re-ran every finding at
`7090e09`, the merge of main #247/#248 into the branch — the test file is
byte-identical between the two). **Base:** `86def6b` at audit time; `e00a3d3`
(main after #248) at reconciliation.
**Reconciliation commit:** the one carrying this file.
**Lanes:** A (numeric verification, behavioural and test-body mutants,
diagnostics equivalence, cost) and B (design critique across every coprime
prime stride, correlation of the two walks, content-table mutants, calendar
edge cases, journal accuracy). Each in its own clone; neither touched the
working tree.

## Reconciliation — what was found, what was done, what was measured

| # | lane | severity | finding | action | verified on the reconciled file |
|---|---|---|---|---|---|
| 1 | A | HIGH-1 | The lattice test re-typed 37/1985/41/1791 as literals; the second walk could duplicate the first, or move to any stride, with all 53 tests green | Strides live in one table `REDERIVATION_WALKS`, read by both walks and the lattice test | T2 (duplicate) → gcd 37 ≠ 1; T1 (41→43) → 47 shared ≠ 49; T9 (37→43) → 42 ≠ 49 |
| 2 | A | MED-1 | Three headings flipped to SHIPPED (#246, #247, #248) sit over Status blocks still reading "STAGED … Not merged, not deployed"; #248's names controller actions gating the paid path | A dated superseding line above each block (L17); the block beneath kept verbatim as the entry's record as staged | the checker Lane A wrote reports 0 contradictions when it reads the superseding line first; the blocks are unchanged |
| 3 | A+B | MED-2 / HIGH-1 | "+8%" and "gap smaller than the walk's own time" did not reproduce: A +17% (five interleaved pairs), B +17–19% (ten each way); the warm-cache mechanism is not visible | Re-measured at ten runs each: base 0.98–1.08s, head 1.12–1.34s, median near +20%; the causal claim withdrawn; the delta is the second walk at full price | journal paragraph rewritten with all three measurements |
| 4 | A+B | MED-2 / NOTE-2 | "Third in the suite, unchanged" false: the file overtakes `render_cards` on some runs | "Second or third, within noise of render_cards" | — |
| 5 | A | MED-3 | Design: a single stride-19 walk (3,864 readings) beats the pair (3,776 readings, 3,727 dates) on every count, with no lattice arithmetic to keep honest; coprimality does no measurable work beyond a 49-date overlap | Recorded in the journal as the alternative not taken: the controller ordered the coprime walk; the stride-37 walk's pins and probe dates are referenced across three audits; the controller's call | Lane B's stride sweep (ratio flat 0.972–0.973) recorded beside it |
| 6 | A | MED-4 | Audited head ≠ PR head after the merge of main; Contract said 62 files / 2,216 | Contract now states the pre-merge delta AND the merged head (66 files / 2,612) | measured below |
| 7 | B | MED-1 | The second lattice adds zero content-table-corruption detection | One paragraph, "What two lattices do not buy", names the mechanism that owns each class | Lane B's `DOMAIN_FAMILIES` mutant: caught by the fixture snapshot and the register total only, before and after |
| 8 | B | MED-2 | Both walks are correlated on the predicate block itself; the positive control owns that class | Same paragraph | Lane B's tautologised check: caught by the positive control only, before and after |
| 9 | B (item 4) + A NOTE-3 | leap boundaries / range tail | No stride lands on 1900-02-28/03-01, 2000-02-29, 2100-02-28/03-01; none reaches past 2100-12-26 (37) / 2100-12-08 (41); a mutant on 2100-12-29 survived the whole suite | New test walks nine named dates through the same block with the same pins, each asserted OFF both lattices first | M4 (1937-03-14) and M6 (2100-12-29): survived every sweep, now fail 1 test; M8 (2000-02-29 element): fails 3; an on-lattice date slipped into the list → fails the off-lattice assertion; list gutted → checks pin `expected 58 to be 522` |
| 10 | A | LOW-1 | "passed all 53 tests" — the file had 51 before the pass | Corrected: 51 in the file, 2,214 in the suite | — |
| 11 | A | LOW-2 | Shared-multiples loop had no work pin; emptied with nothing red | Loop counts its iterations; `seen` pinned at 49 | T5 fails |
| 12 | A | LOW-3 | gcd over two literals was a tautology | Operands come from the table; a duplicate walk now fails there first | T2 |
| 13 | A | LOW-4 | Duplicate union pin; range endpoints re-typed | One union pin from the table plus the literal 3,727; range total from `sweepList(1, 73414)`; last step of each lattice pinned | — |
| 14 | A | NOTE-7 | 5.1% / 5.08% mixed | 5.08% / 2.70% throughout | — |
| 15 | A | NOTE-2 | `rederivationWalk` is semantically identical to the inline stride-37 test; the `expectNone` message now names the stride (a diagnostics improvement) | recorded | — |

**Undefendable by construction** (Lane A NOTE-1): deleting an assertion
(readings pin, checks pin, gcd line) leaves the file green; no suite
defends assertion deletion. Recorded, not fixed.

**Not taken, on record:** the single denser stride (row 5); Lane B's
same-stride 18-day offset lattice (+6.5% coverage for +5% cost, weaker
independence story — Lane B's own recommendation was not to switch).

## Reconciled head — measurements

```
mutants (behavioural, single date):
  1937-03-14 rank99  (neither lattice)  → 1 failed  (survived every sweep before)
  2100-12-29 rank99  (range tail)       → 1 failed  (survived the whole suite before)
  2000-02-29 element (leap boundary)    → 3 failed
  1900-02-11 rank99  (stride 41 only)   → 1 failed
test-body:
  T2 REDERIVATION_WALKS = [[37,1985],[37,1985]] → expected 37 to be 1
  T1 second walk → [43,1708]                     → expected 47 to be 49
  T9 first walk  → [43,1708]                     → expected 42 to be 49
  T5 shared loop emptied                         → 1 failed (seen pin)
  T10 off-lattice list gutted to one date        → expected 58 to be 522
  T11 1900-02-11 placed in the off-lattice list  → "is on a stride lattice already"
cost, ten runs each (vitest "tests" phase, this machine):
  base (main e00a3d3): 1.02 1.03 0.99 1.00 0.99 1.02 1.02 1.08 1.04 0.98 s
  head:                1.19 1.12 1.18 1.17 1.14 1.26 1.34 1.25 1.28 1.28 s
  walks (verbose, 3 runs): stride 37 194–203ms · stride 41 162–185ms
```

## Suite on the reconciled head

`npm test` 66 files / 2,612 tests green · `python3 -m unittest audits.test_project_audit` OK · `python3 audits/project_audit.py` PASS · PII scan and repo_shape green · `git diff --check` clean (the artifact staged before the audit ran, per the pr241 lesson).

---

# Lane A report (verbatim, against `85d565b` and `7090e09`)

# Lane A — adversarial pre-merge audit, PR #249 (8ball)

**Scope as assigned:** branch `claude/eight-ball-app-testing-rqphfo`, head `85d565b`, base `86def6b`.
**Scope as it actually is:** the PR head is `7090e09` (a second commit merging `origin/main` `e00a3d3`
into the branch) and the PR base is `main` `e00a3d3`. See MED-4. `tests/public.test.js` is
**byte-identical between `85d565b` and `7090e09`** (`git diff 85d565b..7090e09 -- tests/public.test.js`
shows only an unrelated hunk that came from main), so every test finding below was reproduced at
**both** commits. Line numbers are from `7090e09`.

Clone used: `/tmp/claude-0/-home-user-8ball/6dd108da-f379-5e0d-86bd-795781941de3/scratchpad/laneA249`
(plus a base-only clone `…/laneA249base` at `86def6b`). Nothing in `/home/user/8ball` was touched.

---

## Verdict

**MERGEABLE AFTER FIXES.**

Required before merge:

1. **HIGH-1** — make the lattice test read the strides the walks actually run (one shared constant).
   As shipped, the test that exists to keep the coverage claim honest passes when the second walk is
   turned into a duplicate of the first.
2. **MED-1** — repair the three journal entries whose heading now says SHIPPED while their body still
   says "Not merged, not deployed" (one of them lists controller pre-launch actions).
3. **MED-2 / LOW-1** — correct the cost and baseline sentences: "+8%", "Third in the suite, unchanged"
   and "passed all 53 tests" are all wrong as written.
4. **MED-4** — refresh the journal Contract paragraph and the PR test plan to the real head
   (66 files / 2,611 tests, not 62 / 2,216).

Recommended: MED-3 (the coprime construction is dominated by a single denser stride — either justify
it or replace it), LOW-2, LOW-3.

The change is otherwise sound: it is test-only, it is green, the arithmetic it pins is correct to the
last digit, and its headline detection claim reproduces exactly.

---

## Findings

### HIGH-1 — the lattice test does not constrain the walks it claims to describe
`tests/public.test.js:581`, `:593`, `:596-622`

The third test is titled *"the two re-derivation strides are coprime and meet on exactly 49 of the
73,414 dates"*, and both the journal and the PR body sell it as *"the arithmetic, pinned rather than
stated"* / *"a third test computes what the design claims"*. It does not compute what the design
claims. Lines 598–600 re-type the literals `37`, `1985`, `41`, `1791` inside the test; nothing ties
them to `rederivationWalk(37, 1985)` at :581 or `rederivationWalk(41, 1791)` at :593.

Reproduction (in the clone, restoring after each):

    # T2 — the second walk becomes an exact duplicate of the first
    sed -i 's/rederivationWalk(41, 1791);/rederivationWalk(37, 1985);/' tests/public.test.js
    npx vitest run tests/public.test.js      # Tests 53 passed (53)
    git checkout -- tests/public.test.js

    # T1 — the second walk moves to a different lattice
    sed -i 's/rederivationWalk(41, 1791);/rederivationWalk(43, 1708);/' tests/public.test.js
    npx vitest run tests/public.test.js      # Tests 53 passed (53)
    git checkout -- tests/public.test.js

    # T9 — the FIRST walk moves too
    sed -i 's/rederivationWalk(37, 1985);/rederivationWalk(43, 1708);/' tests/public.test.js
    npx vitest run tests/public.test.js      # Tests 53 passed (53)

What happened: all three green, at `85d565b` and at `7090e09`. Under T2 the PR's entire delivered
value — 1,742 dates the first walk never sees — is zero, the file still runs two walks over the same
1,985 dates for double the time, and the test named after the 49-date meeting still passes while the
two lattices are in fact identical.

What should happen: T2 and T1 must fail. `sweepList`'s count pin only catches a stride change whose
count was *not* updated (T3, count 1791→1790, correctly fails at :593) — it is not a stride pin.

Demonstrated fix (verified in the clone: green as-is, T2 and T1 both fail):

    const REDERIVATION_WALKS = [[37, 1985], [41, 1791]];
    …
    it('every leaf …', () => { rederivationWalk(...REDERIVATION_WALKS[0]); });
    it('the same block holds on a second lattice …', () => { rederivationWalk(...REDERIVATION_WALKS[1]); });
    it('the two re-derivation strides are coprime …', () => {
      const [[s1, n1], [s2, n2]] = REDERIVATION_WALKS;
      expect(gcd(s1, s2)).toBe(1);
      const first = new Set(sweepList(s1, n1));
      const second = sweepList(s2, n2);
      …
      expect(union.size).toBe(n1 + n2 - 49);
      // and `% (s1 * s2)` in the shared-multiples loop
    });

With that change T2 fails on `shared.length` / `union.size` and T1 fails on `shared.length` (37/43
meet on 47 dates, not 49). No extra assertion is needed.

### MED-1 — the PR introduces three SHIPPED/"not merged" contradictions in the authoritative state record
`journal.md` (at `7090e09`) lines 74, 154, 215

The change flips four earlier headings to SHIPPED (#241, #246 at `85d565b`; #247, #248 added in the
merge commit). Three of those entries carry a bolded `**Status: …**` block in their body that still
reads "STAGED on `<branch>` … **Not merged, not deployed.**":

- L215 heading `— SHIPPED (#246)`; L217 body `**Status: STAGED … Not merged, not deployed.**`
- L154 heading `— SHIPPED (#247)`; body `**Status: STAGED … Not merged, not deployed.**`
- L74  heading `— SHIPPED (#248)`; body `**Status: STAGED … Not merged, not deployed.** … Three
  things are the controller's hand before the path is live: per-sale license keys …, the two Netlify
  environment variables, and one line in the post-purchase content`

Reproduction: the checker below reports 0 contradictions at `86def6b`, 0 at `e00a3d3` (main), 1 at
`85d565b`, **3 at `7090e09`** — i.e. every one of them is created by this PR.

    python3 - <<'PY'
    import re, subprocess
    for rev in ['86def6b','e00a3d3','85d565b','7090e09']:
        j = subprocess.run(['git','show',f'{rev}:journal.md'],capture_output=True,text=True).stdout.split('\n')
        idx=[i for i,l in enumerate(j) if l.startswith('## ')]
        bad=[j[i][:70] for k,i in enumerate(idx)
             if 'SHIPPED' in j[i] and re.search(r'\*\*Status: STAGED','\n'.join(j[i+1:i+8]))]
        print(rev, len(bad))
    PY

CLAUDE.md makes `journal.md` authoritative for CURRENT STATE. The #248 case is the material one: a
reader now sees SHIPPED over a body that names three unfinished controller actions gating a paid
path. What should happen: when a heading flips to SHIPPED, its `**Status:**` block is updated (or
struck) in the same edit. The precedent commit (#241) flipped five headings but none of those entries
had a `**Status:**` block, so this is new, not inherited.

### MED-2 — the cost figures do not reproduce, and the rank claim is false
`journal.md` "Cost, said plainly" (and PR test plan, "rank in the suite unchanged")

Claimed: base 1.03–1.09s, head 1.11–1.17s, "**+8%**", explained by the two walks sharing warm caches;
"Third in the suite, unchanged".

Measured here, five interleaved base/head pairs of `npx vitest run tests/public.test.js` (the `tests`
component of the Duration line):

| | run1 | run2 | run3 | run4 | run5 | mean |
|---|---|---|---|---|---|---|
| base `86def6b` | 986 | 1020 | 1070 | 1110 | 996 | **1036 ms** |
| head | 1180 | 1150 | 1260 | 1280 | 1190 | **1212 ms** |

Delta **+17%**, not +8% (three further non-interleaved runs each way agree: base 972–984, head
1110–1230). The "warm caches" mechanism is not visible: the first walk costs 207–208 ms on head
versus 209–259 ms on base — unchanged — and the file delta (~176 ms) is essentially the second walk's
own cost (172–213 ms) plus the lattice test (5–6 ms). The walk is paid at full price.

Rank: summing per-test durations from a full `--reporter=verbose` run,

- base: `l48_gate_composition` 2789 ms, `render_cards` 1283 ms, **`public` 1084 ms (3rd)**
- head: `l48_gate_composition` 2547 ms, **`public` 1305 ms (2nd)**, `render_cards` 1258 ms

so `public.test.js` overtakes `render_cards.test.js`. "Third in the suite, unchanged" is false on this
machine, as is the "Queued" paragraph that repeats it. The journal hedges with "on this machine
today", which covers the absolute milliseconds but not the ratio or the rank.

### MED-3 — the coprime construction is dominated by simply halving the stride
`tests/public.test.js:583-593` (design), `journal.md` "The walk."

The stated benefit of coprimality is minimal overlap: the two lattices meet on only 49 dates, so the
union is 3,727 rather than 1,985. But a *single* walk on a denser prime stride has no overlap at all
and costs the same. Measured in the clone:

| construction | readings executed | distinct dates pinned | distinct reading-signatures |
|---|---|---|---|
| stride 37 (base) | 1,985 | 1,985 (2.70%) | 1,985 (3.74%) |
| stride 37 + stride 41 (this PR) | 3,776 | 3,727 (5.08%) | 3,691 (6.95%) |
| **stride 19 alone** | **3,864** | **3,864 (5.26%)** | **3,786 (7.13%)** |

(signature = the tuple `stem·branchAnimal·monthAnimal·seasonState·birthday·postureNumber·strength·
primaryFavorable`; 53,074 distinct such tuples exist across all 73,414 dates.)

One stride-19 walk executes 2.3% more readings than the two walks and pins 3.7% more dates and 2.6%
more distinct reading states — with one test instead of three, one count pin instead of five, and no
lattice arithmetic that has to be kept honest (HIGH-1 exists only because of the two-stride design).
Coprimality between the two walk strides does no measurable work; what buys coverage is total
distinct dates per unit time. This is a design objection, not a defect — but the journal presents the
coprime lattice as the reason the pass is worth its cost, and that reasoning does not hold.

### MED-4 — the audited commit is not the PR head, and the shipped numbers are stale
PR #249 head `7090e09`, base `main` `e00a3d3`

The PR carries a second commit merging `origin/main` (#247, #248). Consequences:

- The journal delta is larger than at `85d565b`: four heading flips, not two (hence MED-1's three
  contradictions rather than one).
- `journal.md` "Contract" (L45–46 of the entry) still says "the suite 2,214 → 2,216", and the PR test
  plan says "`npm test`: 62 files / 2,216 tests green". At the real head `npm test` is **66 files /
  2,611 tests**. The file-level claim (51 → 53) is still correct.
- CI on the real head: `test` success, `product-audit` success, `l48-gate` **failure** (no
  `audits/*_pr249_premerge_audit_*_response.md` yet — expected; this audit is that artifact).
  `mergeable_state` is `unstable`.

### LOW-1 — "passed all 53 tests before this pass" — before this pass the file had 51
`journal.md` "Detection, measured."; PR test plan bullet 1; commit message of `85d565b`

Verified directly: the 1900-02-11 mutant on `core/public.js` (`families[0].rank = 99` plus a shifted
day-master element) is green on `86def6b` at **51 tests in the file / 2,214 in the suite**. The
sentence should say 51 (or, better, "the whole 2,214-test suite"). Small, but it is a claim about a
measurement in an entry whose entire point is that measurements are stated exactly.

### LOW-2 — the new lattice test's own loop has no work pin, against the file's stated standard
`tests/public.test.js:607-611`

The file's own comment at :561-564 sets the standard: "gutting the loop to one date must fail the
readings pin". `rederivationWalk` honours it (verified — see Survivor table, T8 fails with
`expected 1 to be 1791`). The shared-multiples loop does not:

    sed -i 's/for (const d of shared) {/for (const d of shared.slice(0, 0)) {/' tests/public.test.js
    npx vitest run tests/public.test.js      # Tests 53 passed (53)

`shared.length` is pinned separately at :602, so the loop can be emptied with nothing red. Fix: count
iterations inside the loop and `expect(seen).toBe(49)` after it.

### LOW-3 — the gcd assertion is a tautology over literals
`tests/public.test.js:597-598`

`expect(gcd(37, 41)).toBe(1)` computes a constant from two literals typed on the same line. It cannot
fail for any state of the code under test, and deleting it changes nothing (verified). It becomes a
real assertion only under the HIGH-1 fix, where the operands come from the walk table.

### LOW-4 — duplicated range literals and a redundant pin
`tests/public.test.js:613-616`

`expect(union.size).toBe(1985 + 1791 - 49)` immediately followed by `expect(union.size).toBe(3727)`
is the same assertion twice. `const total = (Date.UTC(2100, 11, 31) - start) / day + 1` re-types the
sweep's range endpoints rather than deriving them from `sweepDates`, so the supported range is now
written out in two places (mitigated: a range change would break the `sweepList` count pins first).

---

## Notes (not findings)

- **NOTE-1 — undefendable by construction.** Deleting `expect(readings).toBe(expectedDates)` (:576),
  deleting `expect(checks).toBe(expectedDates * READING_CHECKS)` (:577), or deleting the gcd line all
  leave the file green. These are assertion deletions; no test suite defends against them. Worth
  recording only that the two pins are partly redundant: the checks pin alone catches a gutted loop,
  the readings pin alone catches a gutted loop but not check-count drift.
- **NOTE-2 — `rederivationWalk` is semantically identical to the previous inline stride-37 test.**
  Same loop, same `readingOffenders` call, same accumulation order, same three pins in the same
  order. The only behavioural difference is the `expectNone` message: `'swept readings disagree with
  the registries or the pillar'` → `` `stride-${strideDays} readings disagree …` ``. That is a
  diagnostics *improvement* (a failure now names which lattice broke); no file in the repository
  referenced the old string (`grep -r "swept readings disagree"` → nothing). One asymmetry: the first
  walk's `it` title still does not name its stride while the second's does, so the test list reads
  oddly — the assertion message covers it.
- **NOTE-3 — range-tail blind spot, pre-existing.** No stride in the file reaches the last days of the
  supported range: the furthest any sweep gets is 2100-12-26 (stride 37); stride 41 stops at
  2100-12-08. A mutant conditioned on 2100-12-29 survives the whole 2,611-test suite (M6). The
  endpoint 2100-12-31 itself *is* defended, by the fixture snapshot (M7 fails
  `every fixture case still computes byte-identically`). Not introduced here, but the new test's
  "3,727 of the 73,414 dates in the range" framing invites whole-range reasoning, so it belongs on
  the record next to the 1937-03-14 note the test already makes.
- **NOTE-4 — banned-token scan clean.** The added lines in `journal.md` and `tests/public.test.js`
  (both at `85d565b` and at `7090e09`) contain no operator name/handle, no repository-owner login, no
  model name, and no "operator/owner/founder" within 40 characters of an ISO date — the entry uses
  "the controller" throughout. Pre-existing model names do appear in untouched comments in
  `tests/public.test.js` (lines 106, 123, 385, 1126–1127, 1179–1180) and in historical journal
  entries; the PII allow-list evidently tolerates them and this PR neither adds to nor removes them.
- **NOTE-5 — "append-only" vs in-place heading edits.** `journal.md` line 3 declares the file
  append-only; this PR edits four earlier headings in place. Precedent exists (the #241 commit
  `86def6b` flipped five headings the same way), so this is established practice rather than a new
  deviation — but MED-1 is what that practice costs when the body is not updated with the heading.
- **NOTE-6 — the ruled-out full walk is credible.** The journal cites 1.84 s to build all 73,414
  readings. Measured here: 2.20–2.32 s build-only (three runs), i.e. same order, machine variance.
  With the check block the full walk would be ~7–8 s. Ruling it out is reasonable.
- **NOTE-7 — percentages.** The entry writes both "5.1%" and "5.08%" for the same quantity (exact:
  5.0767%), and the test comment writes "2.7% to 5.1%". Both roundings are correct; the mixture is
  only a style wobble.

---

## Verified claims

All figures recomputed independently with a standalone reimplementation of `sweepDates` (no import
from the test file).

| Claim (journal / test / PR body) | Verified | Measured |
|---|---|---|
| stride 41 yields 1,791 dates over 1900-01-01…2100-12-31 | ✅ | 1,791 (first 1900-01-01, last 2100-12-08) |
| stride 37 yields 1,985 dates | ✅ | 1,985 (last 2100-12-26) |
| gcd(37, 41) = 1 | ✅ | 1 |
| the lattices share exactly 49 dates | ✅ | 49; = floor(73413/1517)+1 |
| the first shared date is 1900-01-01 | ✅ | yes (last is 2099-05-13) |
| every shared date is a multiple of 1,517 days from 1900-01-01 | ✅ | 49/49, zero exceptions |
| union = 1,985 + 1,791 − 49 = 3,727 | ✅ | 3,727 |
| the range holds 73,414 dates | ✅ | 73,414 |
| union share 5.08% (entry) / 5.1% (test comment), up from 2.7% | ✅ | 5.0767% and 2.7038% |
| the second walk adds 1,742 dates the first never sees | ✅ | 1,742 |
| 1937-03-14 is on neither lattice | ✅ | on neither |
| 1900-02-11 is on the second lattice only, and is day 41 | ✅ | second only; 1900-01-01 + 41 d |
| 1900-03-16 is on the first lattice only | ✅ | first only |
| both strides prime, coprime with 23/53/59/89/101 (every other stride in the file) | ✅ | file uses 23, 37, 41, 53, 59, 89, 101; all prime |
| the mutant on 1900-02-11 survives the pre-PR suite | ✅ | green on `86def6b`: 62 files / 2,214 tests |
| …and fails only the stride-41 walk now | ✅ | 1 failure, at head and at `7090e09` |
| the mutant on 1900-03-16 fails the first walk and the positive control | ✅ | exactly those two |
| the mutant on 1937-03-14 still survives | ✅ | 2,611/2,611 green at the real head |
| the second walk gutted to one date fails its readings pin | ✅ | `expected 1 to be 1791` |
| file 51 → 53 tests | ✅ | 51 on base, 53 on head |
| the second walk is ~180 ms on its own | ✅ | 172–213 ms (3 runs) |
| "before this pass it passed all **53** tests" | ❌ | 51 in the file before the pass (LOW-1) |
| suite 2,214 → 2,216 / "62 files, 2,216 tests" | ⚠️ stale | true at `85d565b`; real head is 66 files / 2,611 |
| file test time +8% | ❌ | +17% (5 interleaved pairs) (MED-2) |
| "Third in the suite, unchanged" | ❌ | 3rd on base, **2nd** on head (MED-2) |
| "the arithmetic, pinned rather than stated" | ❌ | pinned about decoupled literals (HIGH-1) |
| 2100-12-31 reachable by either stride | — (not claimed) | no: 37 stops 12-26, 41 stops 12-08 |

Endpoint handling of `sweepDates`: `for (let t = start; t <= end; t += stride*day)` — start inclusive,
end inclusive-if-hit. No off-by-one at either end; every stride's count equals
`floor(73413/stride) + 1` exactly (checked for 19, 23, 37, 41, 43, 53, 59, 89, 101).

---

## Survivor mutants

Behavioural mutants patch `core/public.js` by wrapping `buildPublicReading` so that, for the named
date only, `families[0].rank = 99` and `dayMaster.element` is rotated one place. "Caught by" is from
a full-suite `npx vitest run --reporter=verbose`; results identical at `85d565b` and `7090e09`.

| # | Mutant | Lattice class | Result | Caught by |
|---|---|---|---|---|
| M1 | date 1900-02-11 | stride 41 only | **caught (new)** | `the same block holds on a second lattice, stride 41…` only — and nothing at all on base |
| M2 | date 1900-03-16 | stride 37 only | caught | first walk + `flags every leaf … when that leaf alone is corrupted` |
| M3 | date 1974-10-06 (shared, not a fixture or literal anywhere) | both | caught | both walks |
| M4 | date 1937-03-14 | neither | **SURVIVOR** | nothing (2,611/2,611 green) — as the branch states |
| M6 | date 2100-12-29 | neither, past every stride's reach | **SURVIVOR** | nothing (NOTE-3) |
| M7 | date 2100-12-31 (range endpoint) | neither | caught | `every fixture case still computes byte-identically` |
| M5 | unconditioned (every date) | — | caught | 9 tests across `public.test.js` + `public_surface.test.js` |

Test-body mutants (patch `tests/public.test.js`, restore after each):

| # | Mutant | Result | Notes |
|---|---|---|---|
| T1 | second walk `41, 1791` → `43, 1708` | **SURVIVOR** (53/53) | HIGH-1 |
| T2 | second walk `41, 1791` → `37, 1985` (duplicate of the first) | **SURVIVOR** (53/53) | HIGH-1 — the worst case |
| T9 | first walk `37, 1985` → `43, 1708` | **SURVIVOR** (53/53) | HIGH-1 |
| T3 | second walk count `1791` → `1790` | caught | `sweepList` pin, at the second-walk test |
| T8 | second walk's loop gutted to one date | caught | readings pin, `expected 1 to be 1791` |
| T5 | shared-multiples loop made vacuous (`shared.slice(0, 0)`) | **SURVIVOR** (53/53) | LOW-2 |
| T4 | delete `expect(gcd(37, 41)).toBe(1)` | SURVIVOR | NOTE-1 (assertion deletion) |
| T6 | delete `expect(readings).toBe(expectedDates)` | SURVIVOR | NOTE-1 |
| T7 | delete `expect(checks).toBe(expectedDates * READING_CHECKS)` | SURVIVOR | NOTE-1 |
| — | HIGH-1 fix applied, then T2 re-run | **caught** | fix verified: fails `shared.length` / `union.size` |
| — | HIGH-1 fix applied, then T1 re-run | **caught** | fix verified |

---

## Gate runs (in the clone, at the real PR head `7090e09` unless noted)

| Command | Result |
|---|---|
| `npm test` | 66 files / **2,611 tests passed** (at `85d565b`: 62 / 2,216; at `86def6b`: 62 / 2,214) |
| `npx vitest run tests/pii_scan.test.js tests/repo_shape.test.js` | 3 files* / 87 tests passed (*run together with `public.test.js`); pii + repo_shape alone: 34 passed |
| `python3 -m unittest audits.test_project_audit` | **OK**, 142 tests, 125 s (at `85d565b`: OK, 126 tests) |
| `python3 audits/project_audit.py` | **PASS** — 14 pass / 0 fail / 0 warn / 1 skip (`product.local_pii`, expected in a container) |
| `bash audits/run_local_audit.sh` | not run — needs the gitignored operator-local data file; documented as expected-absent |
| CI on the PR head | `test` ✅, `product-audit` ✅, `l48-gate` ❌ (artifact not yet filed), Netlify checks ✅ |


---

# Lane B report (verbatim, against `85d565b`)

# Lane B adversarial review — PR #249 (8ball, `tests/public.test.js` coprime-stride walk)

Base `86def6b` → head `85d565b`. Diff touches only `journal.md` and `tests/public.test.js` (confirmed via `git diff --stat`). All experiments below were run in a disposable clone (`laneB249`), reverted after each mutant; the working tree was clean (`git status --short` empty) at the end of the session.

## Verdict

**MERGEABLE AFTER FIXES (documentation only — no code change needed):**

1. Correct the cost claim in the journal entry. The measured file-level overhead in this environment is **not** "+8%" and the "gap is smaller than the walk's own time" framing is not supported by direct measurement here (see HIGH-1). Either re-measure and requote, or soften the claim to state the direction only, without a specific percentage.
2. Add one sentence to the journal (or a code comment) stating plainly what MED-1 below establishes: the second lattice adds zero detection against corruption *inside* the frozen content tables (`content/public.v1.js` and friends) — it is engine-to-table fidelity only, identical in kind to the first walk. This is implicit in the existing code (both walks import the same content module) but the PR's framing ("shrinks the unwalked gap") could be read as implying broader assurance than it delivers.

Nothing here blocks merge on correctness grounds — the added tests are accurate, deterministic, and pass. The two issues above are about the PR's own claims, not about the test code being wrong.

---

## Findings

### HIGH-1 — The "+8%" cost figure is not reproducible here; the "shared warm caches" explanation is directionally plausible but the headline number is off by roughly 2x

**File:line:** `journal.md`, the "Cost, said plainly" paragraph of the 2026-09-06 entry.

**Claim:** "File test time on this machine today: 1.03–1.09s on the merged base… 1.11–1.17s with the walk… the honest figure is the file total, +8%."

**Reproduction:**
```
cd laneB249
cp tests/public.test.js /tmp/pr_public.test.js
git show 86def6b:tests/public.test.js > /tmp/base_public.test.js

# base, 10 runs, "tests" phase only (excludes transform/import)
cp /tmp/base_public.test.js tests/public.test.js
for i in $(seq 10); do npx vitest run tests/public.test.js 2>&1 | grep -oE "tests [0-9.]+m?s"; done

# PR, 10 runs
cp /tmp/pr_public.test.js tests/public.test.js
for i in $(seq 10); do npx vitest run tests/public.test.js 2>&1 | grep -oE "tests [0-9.]+m?s"; done
```

**What happened:** Base "tests" phase: 969–1080ms across 10 runs (mean 1016ms, median 1005ms). PR "tests" phase: 1100–1270ms across 10 runs (mean 1192ms, median 1200ms). That is a **+17–19%** increase (mean: +17.3%, median: +19.4%), roughly double the journal's "+8%". The PR's own cited upper bound for the walk-included case (1.17s) was below my *median* (1.20s) and well below my max (1.27s) on the same machine class (a fresh clone, same repo).

Isolating the new test with `-t "second lattice"` (cold — nothing warms it first) gives 204–210ms; the same test's *in-file* reported duration (right after the stride-37 walk) is 158–170ms. That direction — colder-alone is slower than warm-in-file — is consistent with the "shared warm caches" story, and the magnitude (≈40ms, ≈20% of the test's own time) is real. But it does not make the *file-level* delta smaller than the walk's own reported time: the walk alone reports ≈165–170ms (plus ≈5ms for the arithmetic test, ≈170–175ms total), while the measured file-level delta is ≈175–195ms depending on which run pair is used — i.e., about the same or larger, not smaller as the entry states.

**Why it matters:** the entry explicitly frames this as "said plainly" / "the honest figure," i.e., a corrective to imprecision — but the number itself doesn't hold up under a second, controlled measurement pass, even on a comparable environment (a fresh clone, immediately after `npm ci`, no other load). The journal already flags base-time noise ("itself slower than yesterday's 0.82s — the machine, not the file"), which is honest, but that same noise band means a same-day, same-machine "+8%" is not a number future readers should treat as stable; my run lands at roughly double that on the same machine class.

**What should happen:** either re-run the measurement several times and report a range (as done for the base/PR absolute times) rather than a single derived percentage, or drop the "gap is smaller than the walk's own time" causal claim and keep only the qualitative point (a second ~55-check walk over ~1,800 dates costs on the order of 150–200ms, a real but small fraction of the file's ~1–1.2s). The underlying facts (test-only change, deterministic, cheap relative to `l48_gate_composition.test.js`'s ~3.2–4.6s) are not in dispute.

---

### MED-1 — The second lattice adds zero detection for corruption inside the content tables; it is exactly as blind to that class as the first walk

**File:line:** `tests/public.test.js:242–299` (`readingOffenders`, the families/anti-fit/mode/posture blocks), reading from `content/public.v3.js` → `content/public.v1.js`.

**Mechanism:** `readingOffenders` derives its *expected* values for `DOMAIN_FAMILIES`, `WORK_MODES`, `ROLE_POSTURES`, `ELEMENT_FAVORABILITY` by indexing the same frozen registry (`content/public.v3.js`, re-exporting `v1`/`v2` unedited) that `core/public.js` (`buildPublicReading`) also reads from. A corruption planted *in the table itself* propagates identically into both the reading under test and the test's own expected value — the comparison is self-referential for that axis. This is true for stride 37 and stays true for stride 41: doubling the date lattice does not change which *source* the check reads from.

**Reproduction:**
```
cd laneB249
python3 - <<'EOF'
p = "content/public.v1.js"
s = open(p).read()
old = "body: 'cultivation and yield — work that develops a living stock across seasons.',"
new = "body: 'CORRUPTED TABLE VALUE THAT SHOULD BE CAUGHT',"
open(p, "w").write(s.replace(old, new, 1))
EOF
npx vitest run tests/public.test.js
git checkout -- content/public.v1.js
```

**What happened:** 2 of 53 tests failed — but neither was a re-derivation walk. The failures were `public tier — snapshot fixtures > every fixture case still computes byte-identically` and `public tier — voice register (§2/§4) > assembled output carries the same register across the sweep` (a character-count pin, `1414086` vs `1404186`). Both stride-37 and stride-41 re-derivation walks (51 of the 53 tests, including the 3 tests this PR touches) stayed green throughout.

**What should happen:** this is not a defect introduced by the PR — the fixture-snapshot and character-count sweeps already existed pre-PR and already cover this exact corruption class, so overall file coverage is not weakened. But the PR's stated goal ("shrinks the unwalked gap") is specifically about *date* coverage, and the journal doesn't say — and should — that this improvement is orthogonal to content-table integrity, which is carried entirely by other tests in the file. A reader skimming "5.1%, up from 2.7%" could reasonably infer broader protection than exists. One added sentence in the journal closes this.

---

### MED-2 — A defect in the shared predicate logic (`readingOffenders` itself, not the swept data) is invisible to *both* walks by construction; the PR's own framing ("running twice on two lattices") does not add assurance on this axis

**File:line:** `tests/public.test.js:187–299` (`readingOffenders`, called identically by both `rederivationWalk` invocations at lines 566–578).

**Reproduction:** neutered one specific, non-redundant assertion inside `readingOffenders` (the `season.stateHan` check, which nothing else in the function cross-validates) to a tautology:
```
cd laneB249
python3 - <<'EOF'
p = "tests/public.test.js"
s = open(p).read()
old = "check(!differs(season.stateHan, state.han), `state han ${season.stateHan} is not the registry's ${state.han}`);"
new = "check(true, `state han ${season.stateHan} is not the registry's ${state.han}`);"
open(p,"w").write(s.replace(old, new, 1))
EOF
npx vitest run tests/public.test.js
git checkout -- tests/public.test.js
```

**What happened:** exactly 1 of 53 tests failed — `the re-derivation block flags every leaf of a reading when that leaf alone is corrupted` (the existing, pre-PR positive-control test that injects `corruptLeaf` mutations into a real reading object and asserts each is flagged). **Both** re-derivation walks (stride 37 and stride 41) stayed green, because on real, uncorrupted data a tautologized `check` never differs from a working one — the walks only exercise the predicate against genuine engine output, so a logic bug in the predicate itself, as opposed to a data bug it's meant to catch, produces no observable difference between the two lattices. Doubling the date count doesn't touch this: the walks are 100% correlated on "is the checking logic itself correct."

**Why it matters for this PR specifically:** the design rationale in the journal is framed entirely in terms of *date* coverage ("a wrong value planted BETWEEN the stride-37 dates is invisible... a second walk... shrinks the unwalked gap"). That's true and the arithmetic is right. But it's worth being explicit, in the same entry, that this technique's assurance is one-dimensional: it buys date-space coverage, not logic-space coverage, and the thing that actually defends against a broken `readingOffenders` is the pre-existing, unrelated positive-control test, not the lattice count. This isn't a regression (the positive control already existed and still works), but it is a real limit on what "two coprime lattices" can prove, and the PR could say so in one line rather than leaving it implicit.

**Relative to the file's other sweeps:** the file has five other single-lattice sweeps at strides 23, 53, 59, 89, 101 (register scan, table-key integrity, mode/family checks, etc.), each checking a *different* property with *different* helper code (`registerOffenders`, not `readingOffenders`). Those sweeps are not touched by this PR and remain exactly as exposed to the "un-walked gap" problem that #241 identified for the re-derivation block specifically. That looks like a deliberate, scoped choice (the journal's "Queued" section doesn't mention widening the pattern), not an oversight — flagging as a NOTE, not a defect of this PR.

### NOTE-1 — The lattice-arithmetic test is not tautological, but shares its magic numbers with the two walk tests by construction

`the two re-derivation strides are coprime and meet on exactly 49...` calls `sweepList(37, 1985)` and `sweepList(41, 1791)` — the same literal pair (`1985`, `1791`) used in `rederivationWalk(37, 1985)` / `rederivationWalk(41, 1791)`. This looked at first like it might just restate a stored constant, but `sweepList` independently recomputes the actual date list via `sweepDates` and asserts the *computed* length against the literal — so a wrong literal anywhere fails immediately and loudly (verified: `sweepList`'s own internal `expect` throws first). The arithmetic test then does real, independent work on the actual date sets (Set intersection, mod-1517 check on every shared date, exact first-shared-date pin, total-days-in-range pin) rather than trusting the counts. This is fine as designed — no tautology.

### NOTE-2 — "Third in the suite, unchanged" is within noise of being 2nd

Measured file durations via `vitest run --reporter=json`, three separate full-suite runs:

| run | l48_gate_composition | render_cards | public.test.js |
|---|---|---|---|
| 1 | 3199ms | 1283ms | 1279ms (3rd, ~4ms behind) |
| 2 | 4599ms | 1790ms | 1751ms (3rd) |
| 3 | 4371ms | 1759ms | 1846ms (**2nd** — swapped with render_cards) |

`public.test.js` and `render_cards.test.js` are close enough (within ~5–10%) that ordering flips between runs. "Third… unchanged" is approximately true but not a stable fact; a LOW-severity wording nit, not worth blocking on.

### NOTE-3 — Journal/PR-body accuracy, the rest

- `gcd(37,41)=1`, shared dates = 49, first shared date = `1900-01-01`, union = 3,727, total range = 73,414, 1937-03-14 unwalked, 1900-02-11 stride-41-only: **all verified independently** (Python re-derivation of the same date arithmetic, see stride table below). The corrected estimate (1,791 / 5.08%, vs Lane B's pr241 estimate of ~2,016 / ~5.4%) is accurate to the reported precision (exact: 1791 dates, 5.077%).
- Banned-token / register scan: no personal names, GitHub handles, AI-model names, or labeled DOB in the added lines of `journal.md` or `tests/public.test.js` (checked via `git diff … | grep '^\+' | grep -iE` against a model/name wordlist and second-person markers). "Lane A" / "Lane B" are the file's own pre-existing role labels, not model names, and unchanged in meaning by this PR.
- Test-count claim (51 → 53 tests, suite 2,214 → 2,216): confirmed — full suite run gives `Test Files 62 passed, Tests 2216 passed`.

---

## Stride-comparison table (item 1)

Computed for every prime stride 3–101 coprime with 37 (all of them, since 37 is prime), over the fixed range 1900-01-01–2100-12-31 (73,414 dates), paired against the existing stride-37 lattice:

| stride | count (cost) | LCM w/ 37 | shared | union | new dates | union % | new-dates ÷ cost |
|---|---|---|---|---|---|---|---|
| 3 | 24,472 | 111 | 662 | 25,795 | 23,810 | 35.14% | 0.9729 |
| 5 | 14,683 | 185 | 397 | 16,271 | 14,286 | 22.16% | 0.9730 |
| 11 | 6,674 | 407 | 181 | 8,478 | 6,493 | 11.55% | 0.9729 |
| 17 | 4,319 | 629 | 117 | 6,187 | 4,202 | 8.43% | 0.9729 |
| 23 (in use) | 3,192 | 851 | 87 | 5,090 | 3,105 | 6.93% | 0.9727 |
| 31 | 2,369 | 1,147 | 65 | 4,289 | 2,304 | 5.84% | 0.9726 |
| **41 (chosen)** | **1,791** | **1,517** | **49** | **3,727** | **1,742** | **5.08%** | **0.9726** |
| 43 | 1,708 | 1,591 | 47 | 3,646 | 1,661 | 4.97% | 0.9725 |
| 53 (in use) | 1,386 | 1,961 | 38 | 3,333 | 1,348 | 4.54% | 0.9726 |
| 59 (in use) | 1,245 | 2,183 | 34 | 3,196 | 1,211 | 4.35% | 0.9727 |
| 89 (in use) | 825 | 3,293 | 23 | 2,787 | 802 | 3.80% | 0.9721 |
| 101 (in use) | 727 | 3,737 | 20 | 2,692 | 707 | 3.67% | 0.9725 |

**Finding:** the "new dates per date walked" efficiency is essentially flat (0.972–0.973) across every candidate stride, because it reduces to `1 − 1/stride` for two coprime primes over a range much larger than either stride. Count and new-dates-added both decrease monotonically as the stride grows, so **no prime stride from 3–101 pins strictly more new dates for equal-or-less cost than 41** — the curve is a smooth Pareto frontier, not one with a dominant point elsewhere. 41 is a legitimate, defensible choice; so would 43, 47, or 31 be, at slightly different cost/coverage trade points. There is no quantitative case that a *different* coprime stride is "the right" second stride instead of 41 — only that it's one reasonable point on a continuum.

**Offset-lattice alternative** (same stride 37, phase-shifted by 18 days, i.e. `sweepDates` starting at day 18 instead of day 0):

| approach | dates walked (cost) | union (unique dates) | union % | overlap wasted |
|---|---|---|---|---|
| stride 37 + stride 41 (this PR) | 3,776 | 3,727 | 5.077% | 49 (1.3% of walked) |
| stride 37 + stride 37 offset 18d | 3,969 | 3,969 | 5.406% | 0 |

The offset lattice is disjoint from the base lattice by construction (18 ≢ 0 mod 37), so it wastes nothing on overlap and reaches **6.5% more unique dates for ~5% more total dates walked** than the coprime-41 approach. That is a real, quantifiable edge — but it is **not "clearly better"**: (a) the margin is modest (242 extra dates, out of 73,414 total, ≈0.33 percentage points of range coverage) and costs a comparably modest amount more test time; (b) an offset of the *same* stride does not decorrelate from any stride-37-specific periodicity — both lattices cycle through all 60 sexagenary-cycle positions and all 7 weekday positions identically (verified: `gcd(37,60)=1` and `gcd(37,7)=1`, so either phase equidistributes over both cycles well before 1,985 steps), so there's no structural argument that an offset catches a different *class* of bug than a same-magnitude second coprime stride would; (c) it loses the clean "two independent generative processes, meet only every `lcm(a,b)` days" property that the third test in this PR verifies — an offset lattice's "independence" is just non-overlap, a weaker and less generatively meaningful property, and the arithmetic test would need reframing around it. **Recommendation: do not switch.** The offset alternative is a defensible footnote, not a clear improvement — if coverage-per-second is what matters, either choice is within a few percent of the other, and 41's framing (coprime, not merely non-overlapping) is the more legible design story.

## Content-mutant table (item 3)

| mutant | target | caught by stride-37 walk | caught by stride-41 walk | caught by anything else |
|---|---|---|---|---|
| `content/public.v1.js` `DOMAIN_FAMILIES.wood[0].body` corrupted | content table (a `DOMAIN_FAMILIES` row) | **No** | **No** | Yes — `snapshot fixtures` test and `voice register … character total` pin (both pre-existing, unrelated to this PR) |
| (for reference, pre-existing behavior, not re-tested here) `families[0].rank` on a stride-41-only date, per journal | engine/reading value on a specific date | No (wrong lattice) | **Yes** (journal's own reported result) | — |

**Plain statement:** the second walk (stride 41) adds detection *only* for engine-vs-table mismatches on the 1,742 additional dates it visits — the same class of defect the first walk already catches on its own 1,985 dates. It adds **zero** new detection for corruption of the content tables themselves; that class is caught (where it's caught at all) by the file's snapshot and character-count sweeps, unaffected by this PR.

## Leap-day / century-boundary check (item 4)

Checked whether either lattice (start `1900-01-01`, stride 37 or 41) lands on any of the five requested century-boundary dates:

| date | day offset from 1900-01-01 | on stride-37 lattice? | on stride-41 lattice? |
|---|---|---|---|
| 1900-02-28 | 58 | No (58 mod 37 = 21) | No (58 mod 41 = 17) |
| 1900-03-01 | 59 | No (mod 37 = 22) | No (mod 41 = 18) |
| 2000-02-29 | 36,583 | No (mod 37 = 27) | No (mod 41 = 11) |
| 2100-02-28 | 73,107 | No (mod 37 = 32) | No (mod 41 = 4) |
| 2100-03-01 | 73,108 | No (mod 37 = 33) | No (mod 41 = 5) |

**None of the five land on either lattice**, before or after this PR. Whether this matters: century-boundary leap-year handling (divisible by 100 but not 400) is a classic bug magnet, and neither the 2.7% single-lattice coverage nor the 5.08% two-lattice coverage this PR ships happens to reach any of them — adding a second *arithmetic* stride does nothing to target calendrically special dates, since strides are chosen for coprimality, not for hitting known-hard dates. This is not a new problem introduced by this PR (the first lattice already missed all five), and is out of this PR's stated scope (it explicitly frames itself as closing the #241 gap, not as a targeted edge-case sweep) — but it's a real, quantified gap worth recording: if century-leap-day correctness in the public-reading pipeline is a real risk, it needs an explicit fixed-date test, not reliance on either stride lattice landing on it by chance.

## Test runs (item 6)

```
npm test
→ Test Files  62 passed (62)
   Tests  2216 passed (2216)

npx vitest run tests/pii_scan.test.js tests/repo_shape.test.js
→ Test Files  2 passed (2)
   Tests  34 passed (34)
```

Both clean. `working tree` in the clone was restored to a clean state (`git status --short` empty) after every mutant experiment.

---

## Summary of severities

- **HIGH-1** — cost claim ("+8%", "gap smaller than the walk's own time") not reproducible; measured overhead here is ~2x that, and the specific numbers should be softened or re-measured with more samples before being treated as a citable fact in future planning.
- **MED-1** — second lattice adds no content-table-corruption detection; worth one clarifying sentence in the journal so the "shrinks the unwalked gap" claim isn't over-read.
- **MED-2** — both walks are 100%-correlated against defects in the shared predicate logic itself (`readingOffenders`); protection against that class comes entirely from the pre-existing positive-control test, not from adding lattices. Worth noting explicitly, not a regression.
- **NOTE-1** — lattice-arithmetic test verified non-tautological.
- **NOTE-2** — "third in the suite, unchanged" is within measurement noise of 2nd.
- **NOTE-3** — all other quantitative claims (dates, %, gcd/lcm, shared dates, suite counts) verified correct; no banned tokens found.
- Design critique (item 1): stride 41 is undominated among coprime primes 3–101 (no stride pins more new dates for equal-or-less cost); a same-stride offset lattice is a real but marginal alternative (+6.5% coverage, +5% cost, weaker independence story) — not recommended as a replacement.
- Leap-day check (item 4): none of the five century-boundary dates land on either lattice; pre-existing gap, unaffected by this PR, worth a dedicated fixed-date test if that risk matters.

**Overall: MERGEABLE AFTER FIXES** — fix the cost-claim wording (HIGH-1) and add the one-line scope clarification (MED-1) before or shortly after merge; nothing here is a correctness defect in the shipped tests.
