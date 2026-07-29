# Claude pre-merge audit — PR #162 (rising-sign follow-ups: comment-only `core/` + 3 math guards)

- **Date:** 2026-07-29
- **PR:** #162 — `claude/rising-sign-mutation-fixtures-rvaocg` → `main`
- **Audited head:** `db85b4c` (single commit); PR base `ae9dcc7`, commit parent `37cd465`
- **Auditor:** independent Claude lane, dedicated detached worktree, no sight of the authoring conversation
- **Method:** own diff analysis, own numeric re-derivations, own mutation runs, own suite runs. Every claim below was re-computed from source, not read off the commit message.

## VERDICT

**MERGE WITH FIXES** — two comment corrections, no code or test change.

The change is provably calc-inert and its four headline arithmetic claims reproduce to the digit. But this PR's entire deliverable *is* prose committed into `core/`, and two of those sentences are wrong. F1 is an actionable falsehood a maintainer would act on; F2 is an overclaim on the very sentence that justifies the change. Both are one-line edits.

Notably, F1 and F4 are the **same error class the PR exists to correct in #152**: a result measured over a narrow set, then stated as a general truth.

## What reproduced exactly

| Claim | Independent result | Verdict |
|---|---|---|
| `core/` diff is comment-only, zero non-comment lines | Comment-stripped (string/regex-aware) + whitespace-collapsed hash of `math.js`, `rising.js`, `profile.js`, `calendar.js`, `pillars.js` identical at both revs. `--numstat`: 42 added lines in `core/`, **0 deleted**, all 42 are `//` lines | **TRUE** |
| `ui/`, `content/`, `index.html`, `DOCTRINE.md`, `package.json`, lockfile untouched | Blob-hash comparison at both revs: identical. Also `CLAUDE.md`, `8BALL.md`, `netlify.toml`, `vitest.config.js` | **TRUE** |
| Short form breaks for **276 of 320** magnitudes | 276, exponents 45..320, contiguous. Real form: 0 breaks | **EXACT** |
| Boundary "~2.8e-14 at k=360" | Bisected to `2.842170943040401e-14` = 2⁻⁴⁵ = half-ulp(360). e=45 is the ties-to-even case and rounds to 360 | **EXACT** |
| Min diff **184.35°** at year 2000 | 184.3468 (grid), 184.3468 (boundary-only 360k sweep). Minimum sits at \|lat\| = 66.5 | **EXACT** |
| Tautology holds ≥1533, breaks ≤1532, "bisected" | Full-grid bisection: **1532 breaks / 1533 holds**. Mechanism independently confirmed — critical latitude is 90−ε, and ε crosses 23.5° at T = −4.6751 centuries ≈ **year 1532.5** | **TRUE** (see F3) |
| "rising with epoch" | 1533: 180.15 · 1600: 181.65 · 1800: 183.29 · 2000: 184.35 · 2100: 184.79 · 2400: 185.92 | **TRUE** |
| #152 swept obliquity pinned at J2000, so its "entire domain" claim was unearned | My year-2000 sweep finds 0 violations — #152's claim was true *for J2000 ε only*. #152's PR body confirms the quoted wording | **TRUE** |
| tzdata: LMT 5:53:28→1854, HMT 5:53:20→1870, MMT 5:21:10→1906 | `zdump -v` (tzdata 2025b): gmtoff 21208 → 21200 (1854-06-27) → 19270 (1869-12-31) → 19800 (1905-12-31). python `zoneinfo` at 1905-12-31: `tzname='MMT'`, offset `5:21:10` | **EXACT** |
| Fixture edit is label-only | Only the `label` string changed. `risingSign: "virgo"` / `offsetMinutes: 330` byte-identical. Mechanism re-verified live in Node: pass-2 yields `"GMT+05:21:10"`, fails the parser regex, falls back to o1 = 330 | **TRUE** |
| `asc±180`: **85312/360000**, max **5.7e-14°**, ~2e-10 arcsec | Reproduced to the unit on a 0.001° uniform sweep of [0,360): **85312/360000 (23.70%)**, max = `5.684341886080802e-14` = 2⁻⁴⁴, = 2.05e-10 arcsec | **EXACT** (see F5) |
| Ephemeris good to ~0.003° | Right order: this file computes *mean* sidereal time, and the omitted equation of the equinoxes alone is up to 17.2″·cos ε = **0.0044°** | **SOUND** |
| 3 new tests fail against the short form, pass against the real one | Applied the mutation myself: `Tests 3 failed \| 1577 passed`. Exactly the 3 new tests, nothing else. File restored, tree clean | **TRUE** |
| Suite 45 files / 1580; baseline 1577; +3 | Branch: **45 / 1580 green**. Base `37cd465`: **45 / 1577 green**. Δ = +3 | **EXACT** |
| No files added/removed → repo_shape pins intact | All 4 changed files are `M`. On disk: 11 core, 11 ui, 45 tests — matches CLAUDE.md. `index.html` untouched at 1495/1500 | **TRUE** |
| Blast radius: 0 changed LNY dates, 0 solar terms 1900–2100, 0 rising signs, 0 day/hour pillars | Re-ran it myself under both `mod` forms: **0 changed across 82,673 probes** — 201 LNY, 2412 solar terms, 2412 day pillars, 9648 hour pillars, 68000 rising signs (incl. 8000 at \|lat\| = 66.5 / 66.499) | **REPRODUCED** |

Merges cleanly onto current `main` (`ae9dcc7`). No new dependency, no `fetch`, no storage key, no content string (§5 / §12 / §4 clean). Suite-internal PII and boundary scans green. The local PII script exits 1 for the missing gitignored data file — expected in a fresh container per CLAUDE.md, not a finding.

## Findings

| # | Sev | Finding |
|---|-----|---------|
| **F1** | **P1** | **`core/rising.js`: "mutating this condition (or either arm) survives the suite" is false.** I ran 12 standard mutation operators against `diff < 1 \|\| diff > 179`. **Four are killed, 22 tests each** — including two default Stryker operators. Killed: `\|\|`→`&&`; condition→`false`; drop the second arm (`if (diff < 1)`); second-arm relational flip (`diff < 179`). Survived: `true`; drop the first arm (`if (diff > 179)`); `>180`, `>184`, `>185`; `<=1`; `>=179`; first-arm flip (`diff > 1`). A tautology only implies survival for mutations that *preserve* the tautology — the sentence generalizes from #152's five surviving Stryker variants to all mutations, and half the guard is in fact strongly pinned. A maintainer who trusts this line and deletes `\|\| diff > 179` gets 22 red tests and no idea why the comment said otherwise. |
| **F2** | **P2** | **`core/math.js`: "reachable hazard, not a theoretical one" is unsubstantiated at the site it names.** The comment says `normalizeDeg(asc - LST)` produces a tiny negative "when the ascendant converges on the local sidereal time". Swept 2,881,440 points over \|lat\| ≤ 66.5 × LST [0,360): the closest `asc − LST` ever gets to zero is **−4.3468°** (lat −66.5, LST 94) — fourteen orders of magnitude outside the (−2⁻⁴⁵, 0) window. **Zero samples land in it.** Two further problems: (a) the reachable site is the *other* one — line 83, `normalizeDeg(atan2(…)/DEG)`, where a targeted 2.5M sweep near LST = 90 found **489** raw values inside the window (e.g. −2.777e-14 at lat −63.308); (b) at the named site it would not matter anyway — `guard(0)` and `guard(360)` are **both true**, so `ascendantDeg` takes the identical arm either way. My own blast-radius reproduction (0/82,673) confirms no output moves. The defensible justification is the **range contract**, which is sufficient on its own; the reachability sentence overstates it and cites the wrong line. |
| F3 | P3 | **The 1532/1533 threshold is JD-convention-dependent and the convention is not stated.** The true ε = 23.5° crossing is ≈ mid-1532. Bisecting with a Jan-1 JD gives 1532/1533 (matching the comment); with Jul-1, Oct-1 or Dec-31 it gives **1531 breaks / 1532 holds**. A reader re-deriving with a mid-year JD will conclude the comment is wrong. Worth one clause ("evaluated at Jan 1"). |
| F4 | P3 | **"the failure needs the boundary value itself" is too narrow.** The failure needs \|lat\| ≥ 90 − ε(epoch), and at earlier epochs that band reaches below 66.5. Rovaniemi at **66.499** — the highest non-polar latitude in the shipped `assets/cities.json` (53,308 cities; none sits at exactly 66.5) — breaks the guard for birth years ≲1520. The disposition is unchanged (a 16th-century birth is not a product input), but the stated mechanism is over-tight in exactly the way F1 and #152 were. |
| F5 | P3 | **"~24% of inputs" measures a synthetic sweep, not the reachable domain.** 23.70% is the rate over a uniform sweep of `asc` values in [0,360). Over *geometry-derived* ascendants the rate is **16.64%**. Max delta is identical (2⁻⁴⁴), so the conclusion is untouched; the qualifier is just missing. |
| F6 | P3 | **`tests/math.test.js` comment mis-enumerates the repo's moduli.** It says "every modulus the repo uses (10 and 12 for the pillar/animal cycles)" and tests `[10, 12, 360]`. `core/profile.js:88` uses **`mod(…, 5)`** (five-element cycle). Add 5 to the array, or drop the "every modulus" phrasing. |
| F7 | P3 | **§3 / CLAUDE.md literal-rule trip, recommend an explicit disposition.** §3's closing clause says "if both [a fixture and a test] change in the same commit without a doctrine note, the reviewer rejects", and CLAUDE.md's don't-do list says "don't edit `tests/fixtures.json` without updating `core/profile.js` in lockstep per §3". Both fire literally here. Both are provably inert: the fixture edit is confined to a `label` (consumed only as the vitest `it()` name), no expectation moved, `profile.js` is byte-identical, and 82,673 output probes are unchanged. **My disposition: the gate is satisfied — "code review catches it" is precisely what this artifact is.** But neither rule carries a label carve-out, so this will be re-litigated on the next label fix; recommend writing the carve-out down. |
| F8 | P3 | **The correction has no back-pointer from what it corrects.** #152's commit message is permanent history on `main` and now contains two claims this PR disproves ("equal for every input", "the entire valid non-polar domain"). The correction lives only in a comment in a different file. No `journal.md` entry ships here — correctly, since CI's journal gate fires only on `DOCTRINE.md` / `content/*.js`, and the PR body discloses it — but §8 gate 8 wants "what was rejected" recorded. Recommend the closeout entry name #152 explicitly. |

No P0. No finding touches shipped calculation, the storage surface, the payment path, or content.

## On the two judgment calls the PR asks to be trusted on

**Declining to kill the `asc + 180` mutant — correct, not a rationalized gap.** I confirmed it survives the full suite, and the numbers justifying that. The difference (2⁻⁴⁴ deg ≈ 2e-10 arcsec) is ~5.3 × 10¹⁰ times smaller than the formula's own systematic error from omitted nutation. Any test that killed it would assert an exact float64 bit pattern for `ascendantDeg`, pinning *this arrangement of trig operations* rather than the behavior, and would break on a legitimate algebraic refactor. That is a worse test than no test. What makes this a sound disposition rather than a dodge is that the PR **downgrades** #152's "strict equivalent mutant" to "technically distinguishable, deliberately not killed" and records it in-code — recording a known survivor with a reason is the right handling; silently calling it equivalent is what #152 did wrong. One nuance the record could add: it *is* killable in principle — I constructed ascendants 1 ulp below an exact 30° multiple where the two forms return **different signs** (e.g. `asc = 29.999999999999975` → scorpio vs libra). Zero of 360,000 geometry-derived ascendants land there, and hunting a real `(date, time, lat, lng)` that does would itself be pinning float noise. The call stands; naming the one theoretical route would make it airtight.

**Does a comment-only `core/` change warrant the §3 calc gate?** §3 is scoped to `core/profile.js` and defines only "breaking" and "additive" changes — a documentation change in `core/` fits neither. My view: the gate should not be *waived*, but it is *discharged by verification rather than by fixture work*. I verified the strongest available form of the §3 guarantee — that no existing output moved — at two independent levels: byte-level (comment-stripped code hashes identical) and behavioral (82,673 probes, zero deltas). That is a stronger assurance than a fixture update would have provided. What §3 does *not* anticipate is this PR's real risk surface: prose in `core/` is not covered by any test, so an inaccurate comment ships unchallenged. F1 and F2 exist because nothing in CI can catch them.

## Fix list

1. **F1** — rewrite the survival sentence to say what is actually true: mutations that *preserve* the always-true condition survive (`true`, dropping `diff < 1`, widening either threshold); mutations that break it (`&&`, `false`, dropping `|| diff > 179`) are killed by 22 tests.
2. **F2** — drop "reachable hazard, not a theoretical one" and the `normalizeDeg(asc - LST)` attribution, or re-point it at line 83 and state plainly that no current caller distinguishes 0 from 360. The range-contract argument carries the change by itself.
3. *(optional)* F3 name the Jan-1 convention · F4 soften to "|lat| ≥ 90 − ε" · F5 qualify the 24% · F6 add modulus 5.
4. PR #162's body repeats the F1 and F2 wording — correct it there too, since it is the artifact a future reader finds first.

Nothing in `core/` executable code, `tests/math.test.js` assertions, or `tests/fixtures.json` values needs to change. All fixes are prose.

## Verification log

```
scope        comment-stripped hashes, 5 core modules, both revs      identical
             blob compare core/ ui/ content/ index.html DOCTRINE     only math.js, rising.js differ
mod claim    276/320 breaks; boundary bisected to 2^-45              exact match
callsite     2,881,440-pt sweep of asc-LST                           0 in window, min |gap| 4.35 deg
             2.5M-pt sweep of atan2 output near LST=90               489 in window (line 83, not 114)
threshold    full-grid bisection, Jan-1 JD                           1532 breaks / 1533 holds
             eps = 23.5 root                                         T = -4.6751 -> year 1532.5
tzdata       zdump -v (2025b) + python zoneinfo                      MMT +05:21:10 confirmed at 1905-12-31
mutation     12 operators on the quadrant guard                      4 KILLED (22 tests each), 8 survived
             shortened mod, full suite                               3 failed / 1577 passed
blast        both mod forms, 82,673 probes                           0 deltas
suite        branch db85b4c                                          45 files / 1580 tests green
             base   37cd465                                          45 files / 1577 tests green
tree         after every mutation                                    git status clean, restored
```

**L48 sighting:** verdict recorded above as the in-PR artifact for PR #162. Merge remains gated on the controller's explicit word per §10 / L48 — this artifact is the audit-cleared signal for the two fixes named, not a merge instruction.

---

## Author disposition (implementer lane, 2026-07-29)

Verdict accepted in full. **All eight findings absorbed** — including every optional one — in the follow-on commit on this branch. No finding was disputed. The auditor's framing that F1 and F4 repeat the exact error class this PR exists to correct in #152 is accurate and is the reason the optional items were taken rather than deferred.

- **F1 (P1) — ABSORBED.** The false sentence is replaced with the measured result: tautology-*preserving* mutations survive (`true`, dropping `diff < 1`, widening a threshold, `<=1`, `>=179`, first-arm flip) while tautology-*breaking* ones are killed by 22 tests each (`||`→`&&`, condition→`false`, dropping `|| diff > 179`, second-arm flip), with an explicit warning not to read the survivors as licence to delete an arm. This was the finding most likely to cause real harm — a maintainer acting on the old sentence would have deleted a strongly-pinned arm.
- **F2 (P2) — ABSORBED.** The "reachable hazard, not a theoretical one" claim and its `normalizeDeg(asc - LST)` attribution are both removed. The comment now rests on the range contract alone, names line 83 as the site where in-window values actually occur (489 of 2.5M), and states plainly that no current caller distinguishes 0 from 360 because the quadrant guard is true for both.
- **F3 — ABSORBED.** The Jan-1 JD convention is now named, along with the mid-1532 true crossing and the note that a mid-year JD shifts the bisection one year earlier.
- **F4 — ABSORBED.** Restated as `|lat| >= 90 - eps(epoch)`, naming Rovaniemi at 66.499 (the highest non-polar latitude actually shipped in `assets/cities.json`) and ~1520 rather than implying the failure needs exactly 66.5.
- **F5 — ABSORBED.** Now gives the geometry-derived rate (16.6%) first and marks 23.7% as the synthetic uniform-sweep rate. The auditor's ulp-below-a-30°-multiple route (scorpio vs libra) is recorded as the one theoretical kill path, per the "would make it airtight" note.
- **F6 — ABSORBED.** `mod(…, 5)` at `core/profile.js:88` confirmed present; the test array is now `[5, 10, 12, 360]` and the comment enumerates all four with their call sites. Re-mutation-verified after the change: the shortened form now fails first on `mod(-1e-20, 5)`, and all 3 guards still fail against it and pass against the real form.
- **F7 — NOTED, disposition adopted.** The auditor's reading is taken: the §3 / CLAUDE.md literal trip is discharged by this artifact rather than waived. The recommended doctrine carve-out for label-only fixture edits is **not** written here — that is a `DOCTRINE.md` change, which would itself trigger the journal-touch and audit-artifact gates, and it is the controller's call, not the implementer's. Flagged for the queue.
- **F8 — NOTED, deferred to close-out by design.** The back-pointer belongs in the `journal.md` entry, which per repo convention lands at merge time rather than in the PR; recorded here so the closeout names #152 explicitly as the corrected record.

Re-verified after absorbing: `core/` diff still comment-only (zero non-comment lines changed), suite **45 files / 1580 tests green**. PR #162's body was corrected for the F1/F2 wording per fix-list item 4.
