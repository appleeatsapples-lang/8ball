# Test coverage analysis — 8ball — 2026-07-27

Analysis only. No source, test, or doctrine file was modified. Measured in a
fresh container against `main` at `a4ce65c` with a green suite.

## Method

    npm ci
    npx vitest run --coverage --coverage.provider=v8 \
      --coverage.include='core/**' --coverage.include='ui/**'

Coverage tooling (`@vitest/coverage-v8`) was installed with `--no-save` and
removed afterwards; `package.json` and `package-lock.json` are unchanged and
`tests/dependency_discipline.test.js` still passes. Every claim below that
states a runtime behaviour was executed, not inferred from reading source.

## Headline

The suite is healthy where it looks: **41 files, 1444 tests, green in ~10s**,
95.48% statements and 98.23% lines across `core/` + `ui/`. Nothing here is a
crisis, and the calculation core is in good shape.

Three structural problems sit underneath the numbers:

1. The **integration layer is never executed** — `index.html`'s 448-line inline
   module has 0% coverage, including `boot()`.
2. **Test mass is inversely correlated with risk.** 42% of the suite validates a
   static data table; the module with the lowest branch coverage and the widest
   blast radius gets ~8 tests.
3. Several **specific, user-visible defects are unguarded** — three of them
   money- or correctness-critical, verified by execution below.

| Surface | Statements | Branches |
|---|---|---|
| `core/` (10 modules) | 96.91% | 90.29% |
| `ui/` (10 modules) | 94.97% | 83.33% |
| `content/` (23 stmts) | 100% | n/a |
| **`index.html` inline module (448 lines)** | **0% — never executed** | **0%** |

---

## Finding 1 — fractional-offset timezones never reach the rising math

`core/rising.js:128-132` parses `GMT±HH:MM` and takes the minutes from `m[3]`.
No test drives a non-whole-hour zone through `computeRising`. Every timezone
literal in `tests/rising.test.js:117-155` is whole-hour: London, New York,
Riyadh, Chicago, Indianapolis, Moscow, Berlin. `Australia/Adelaide` (+9:30) and
`America/St_Johns` (−3:30) appear only as **string-equality assertions** in
`tests/countries.test.js:106,112` — never fed to the rising calculation.

Executed check — Delhi, 1990-06-15, sweeping all 96 quarter-hour birth times,
comparing the correct +330 offset against +300 (the value if the `:30` were
dropped):

    sign differs in 24 of 96 cases = 25.0%
    example 00:30 → pisces (correct) vs aries (minutes dropped)

`offsetMinutesForWallTime(1990,6,15,12,0,'Asia/Kolkata')` returns `330`, so the
code is right today. Nothing pins it. A regex regression that ate the minutes
would flip the rising sign for a quarter of users in every fractional-offset
zone — India, Iran, Nepal, Afghanistan, Myanmar, and parts of Australia, Canada
and New Zealand.

**Highest-severity gap in the repo**, purely on affected-user count.

## Finding 2 — `getPendingProfile` has zero test references, and its failure arms lose paid renders

`ui/payments.js:145-153`. Grep across all 41 test files: **0 references**. It is
reached only indirectly through `handlePaidReturn` (`:229`), and only ever with
a well-formed `JSON.stringify` payload.

Two uncovered arms, both of which end with a paying customer getting nothing:

- **`:151`** — a pending profile with a `name` but no `dob` returns `null`, so
  `applyPaidReturn` takes the no-pending branch and `handlePaidReturn` returns
  `false` — **but `clearPendingProfile()` still runs at `:234`**, destroying the
  payload. The user pays, sees the confirmation banner, and gets no unlocked
  card, with nothing left to retry from.
- **`:152`** — corrupt or truncated JSON in the pending key: identical outcome.

There is also a layer contradiction the tests actively enshrine.
`tests/payments_state.test.js:229-235` asserts the pure `applyPaidReturn` *does*
consume a `{something:'else'}` pending object, with the comment "Validation
happens at the UI layer; the state machine stays pure." The UI-layer validation
that comment points at has no test at all.

## Finding 3 — the paid-return path is untested against a failing localStorage

`ui/payments.js` has 11 `catch (_)` arms. The module header at `:75-79` states
the contract explicitly: "Every read defends against a localStorage exception
(private mode, quota, etc.)… Writes silently no-op on exception."

That contract **is** verified for the facet functions —
`tests/facet_rotation.test.js:169-179` installs a throwing storage and asserts
`getFacetIndex`/`setFacetIndex`/`clearFacetIndex` fail closed. Credit where due.

It is **not** verified for the money path. No test exercises `getCredits`
(`:83`), `getTier` (`:92`), `setTier` (`:96`), `getPendingProfile` (`:152`),
`setPendingProfile` (`:156`), or `clearPendingProfile` (`:159`) against a
throwing storage — and critically, **no test runs `handlePaidReturn` end to end
against one**. If `setTier` threw uncaught at `:233`, the paid return would
abort *before* `clearPendingProfile`, `replaceState`, and `showPaidBanner`: a
paying user gets a JS exception and a `?paid=t3` URL stuck in the address bar.
Safari private browsing historically threw `QuotaExceededError` on `setItem`.

## Finding 4 — the integration layer is never executed

`index.html` carries one `<script type="module">` block, 448 lines starting at
line 1015, defining `boot()`, `showResult()`, `renderCard()`, `shakeAgain()`,
`openPurchase()`, `setFaceUp()` and wiring all twenty modules through a
`const $ = id => document.getElementById(id)` helper.

The suite never loads it. There is no jsdom or happy-dom in this repo — a
deliberate convention documented in the header comments of nine test files. DOM
tests hand-inject mock objects instead. The 27 test files that mention
`index.html` read it as **text** and regex-scan the markup; none execute it.

So every module is well covered in isolation, and the code composing them is not
covered at all. That matters most in `boot()`, whose own comments record
load-bearing ordering:

- `handlePaidReturn()` must run **before** `loadSavedProfile()` so the monotonic
  tier persists before the rehydrate reads it (§6.6).
- `primeUnsealBaseline()` must capture the tier **before** the paid return.
- The `catch` branch must call **both** `clearProfile()` and `resetFormDisplay()`.
  The comment records the bug that taught this: without the reset, "the next
  submission would silently inherit the discarded city's tz/lat/lng — a wrong
  rising sign baked into a new person's profile."

Each of those three functions has unit tests. Their **ordering** — the thing that
actually broke — has none.

### 4a. 63 unguarded id couplings

The inline module fetches 63 element ids through `$()`. All 63 exist in the
markup; the contract holds today, and nothing enforces it. Rename an id and
`$()` returns `null`, the app fails at boot, and the suite stays green, because
every DOM test supplies its own hand-built refs object rather than the real
markup.

## Finding 5 — test mass sits on the lowest-risk surface

`tests/countries.test.js` produces **558 of 1444 tests — 38.6% of the suite** —
from 10 `it()` blocks. Two `for` loops over 276 countries generate 277 centroid
tests and 277 timezone tests; **4 tests in the file assert actual behaviour**.
Those 554 generated cases are two schema properties repeated 277 times each,
against `core/countries.js` — a 594-line lookup table with **zero branches** and
100% coverage.

Approximate composition of the suite:

| Category | ≈Tests | Share |
|---|---|---|
| Generated data-table shape scans | ~605 | 42% |
| Static source-text / markup regex pins | ~185 | 13% |
| Genuine behaviour tests (module executed, output asserted) | ~655 | 45% |

Against that, coverage of the weakest module:

| Module | Branch | ≈Behaviour tests |
|---|---|---|
| **`ui/modals.js`** | **66.66%** (34/51) | **~8** |
| `ui/citysearch.js` | 69.64% (39/56) | ~12 |
| `core/rising.js` | 80.95% (34/42) | ~50 |
| `ui/payments.js` | 82.22% (37/45) | ~30 |
| `core/profile.js` | 88.98% | ~135 |

`ui/modals.js` owns the shared focus-save/restore stack used by four dialogs
including the paywall, and the irreversible forget-device path
(`clearProfile` + `clearSavedReadings` + `resetFormDisplay`). It gets roughly
0.5% of the suite.

Its specific uncovered arms: both backdrop-click handlers (`:90`, `:106` — the
two uncovered *functions*), three of four Escape branches (`:113-118`, including
Escape-closes-forget, the destructive dialog), the `_openers` stack underflow at
`:46-47`, and `openModal`/`closeModal` called directly (0 test references).

The backdrop-click gap repeats in `ui/payments.js:179`, where the arm that must
**not** dismiss on an inside-dialog click is money-adjacent. The repo already
tests exactly this shape at `tests/readings_ui.test.js:619`, so the idiom exists
in-house and simply was not applied to the modals.

## Finding 6 — edge-case tests assert validity, not correctness

`tests/rising.test.js:295-319` covers equator, ±66.5°, both sides of the IDL,
pre-1970 (1924 Beijing) and 2099 — but every assertion is of the form:

    expect(Number.isNaN(asc)).toBe(false);
    expect(VALID_SIGNS.has(sign)).toBe(true);

`VALID_SIGNS.has(sign)` passes for all twelve signs. The 1924 Beijing case is
the **only** test in the repo exercising the negative day-rollover in
`utcDateParts` (`core/rising.js:24-34`), and a rollover sign-flip bug would
still yield a valid sign and still pass.

Related, all verified by execution and all unpinned:

- **Two-pass DST correction** (`core/rising.js:139-143`): for
  `America/New_York` 2020-03-08 03:00, pass 1 returns −300 (EST) and the correct
  answer is −240 (EDT). Every DST test in the suite uses a mid-July date where
  both passes agree, so deleting pass 2 leaves the suite green.
- **Dead branch**: `core/rising.js:86` `if (diff < 1 || diff > 179)`. Sweeping
  112,320 parameter combinations across 1900–2100 and |lat| ≤ 66, `diff` ranges
  192.96–347.05 — the `diff < 1` arm and the entire else path are **unreachable**
  in the supported band. Worth deleting or pinning as an invariant.
- **Out-of-range DOB** leaks `core/calendar.js`'s internal message
  (`year out of range [1900, 2100]: 1899`) instead of `core/profile.js`'s own
  `DOB out of range`, and no test calls `buildProfile` with an out-of-range year.
- **`index.html:1323-1324`** silently returns for `y < 1900` immediately after
  hiding `dobError` — no user feedback at all, unlike the future-DOB path above
  it that does surface an error. `dobInput.max` is set at `:1116`; `min` never
  is. Reachable today: `<input type="date">` accepts keyboard-typed years like
  `1889` in Chrome and Firefox.
- **`core/profile.js:275-296`** rising-input guards: 12 distinct malformed
  inputs (`'1200'`, `'25:30'`, `'12:00:00'`, `lat: 95`, unknown country, …) all
  return `undefined` with no test. `tests/pillars.test.js:325-326` looks like it
  covers this but passes no lat/lng, so it bails before reaching the time regex.
  The `'12:00:00'` row matters: `<input type="time">` emits `HH:MM:SS` when
  `step` is not a multiple of 60, and `index.html:831` has no `step` today.

## Finding 7 — smaller gaps worth listing

- **`ui/citysearch.js` style injection** (`:82-87`) is dead in tests: the mock
  document at `tests/citysearch.test.js:113` has no `getElementById`, so `:81`
  short-circuits every run. The once-only dedupe is unverified, so a regression
  appending a `<style>` per init would be invisible. Both sibling modules pin
  this (`tests/readings_ui.test.js:285`, `tests/meanings_behavior.test.js:141`);
  citysearch is the only one that does not.
- **Debounce coalescing** (`:166`) is never exercised — the one two-input test
  types `'o'` then `'os'`, and `'o'` returns before scheduling a timer, so
  `_debounce` is always null on the second input. The module's named purpose is
  unverified.
- **Empty search results**: zero `mockResolvedValue([])` anywhere. A successful
  search returning `[]` is indistinguishable from a rejected one — the user gets
  silence either way.
- **Leap-suì branch** (`core/calendar.js:272-283`) was written for exactly one
  case in the supported range, suì 2033/2034 (LNY 2034 = Feb 19, not Jan 20).
  The `lnyLocks` fixture table covers ten years; 2034 is not among them.
- **`tests/fixtures.json` diversity**: `cases` spans DOB 1985–2024 only, with no
  leap-day entry at all; `rising_cases` has 3 entries, all northern hemisphere,
  all whole-hour, all 1985–2000; `name_number` has 4 entries, all ASCII, no
  diacritics or hyphens. `getNameNumberSum` (`core/profile.js:169-178`) skips
  anything outside `a-z`, so `José` scores as `Jos` and a non-Latin name scores
  0 → `null`. No fixture can see that.

## Finding 8 — no coverage signal in CI

`.github/workflows/ci.yml` runs `npm test`, the ≤1500-line rule, the
journal-touch gate, and `l48-gate`. Nothing reports or floors coverage, so a
change that drops branch coverage lands silently.

---

## Proposals, in priority order

**P1 — Pin fractional-offset timezones through `computeRising`.** Add
`rising_cases` fixtures for `Asia/Kolkata` (+5:30), `Asia/Kathmandu` (+5:45) and
`America/St_Johns` (−3:30), signs verified against an external ephemeris, plus a
direct `offsetMinutesForWallTime(...) === 330` assertion. Highest user impact
per line of test in the repo (Finding 1).

**P2 — Cover the three money-path gaps in `ui/payments.js`.** A malformed
pending profile (name without dob) and a corrupt-JSON pending profile, asserting
what *should* happen — I suspect the payload should survive a parse failure so a
reload can retry, which would be a behaviour change worth deciding explicitly.
Then run `handlePaidReturn('?paid=t3')` against a throwing storage and assert it
still calls `replaceState` and shows the banner. Then `isPaywallOpen` before
init, whose `paywallModal != null` guard is the reason the function exists and
never runs (Findings 2 and 3).

**P3 — Extract `boot()` into `ui/boot.js` and test the sequence.** Moving the
bootstrap into a `ui/` module makes it importable under the existing hand-mock
convention — no jsdom, no new dependency, no §5/§12 question. Then assert the
orderings the comments already declare. This also relieves the single-file rule,
at 1465 of 1500 with ~35 lines of headroom. Requires a `ui/` module-count update
in `CLAUDE.md` per `tests/repo_shape.test.js` (Finding 4).

**P4 — Pin the markup contract.** A ~20-line test that parses `index.html`,
extracts every `$('id')` argument and every `id="..."`, and asserts the first set
is a subset of the second. Extend it to assert each `init*UI()` call site
supplies every ref key the module destructures. Closes Finding 4a permanently.

**P5 — Cover the destructive and a11y paths in `ui/modals.js`.** Backdrop-click
closes when `e.target` is the modal and does **not** when it is a child (copy
the idiom from `tests/readings_ui.test.js:619`); table-drive the Escape handler
over `{about, forget, paywall} ∈ {0,1}³`; `initModalsUI(refs)` with no hooks
object; `closeModal` on an empty `_openers` stack. Largest branch-coverage gain
per line of test written (Finding 5).

**P6 — Convert the rising edge-case tests from validity to correctness.** Freeze
exact expected signs for the seven cases in `tests/rising.test.js:295-319`,
especially the two day-rollover cases; pin the 2020-03-08 03:00 DST case that
differentiates the two-pass correction; add the 12 malformed rising-input rows;
add `[2033,1,31]` and `[2034,2,19]` to `lnyLocks` (Findings 6 and 7).

**P7 — Fix the pre-1900 dead-end.** Set `dobInput.min = '1900-01-01'` and make
the `y < 1900` branch surface `dobError` rather than returning bare, with the
test in `tests/dob_validation.test.js`. This is the one item here that is a
product fix rather than a test addition.

**P8 — Collapse the generated country loops.** Fold both `for` loops inside
single `it()`s that collect a `failures[]` array and
`expect(failures).toEqual([])` — the idiom already used at
`tests/privacy_scan.test.js:110-125`. Drops the suite to ~893 tests, changes
coverage by zero lines, and makes the headline count honest. Hygiene, not
urgency.

**P9 — Add an advisory coverage report to CI.** Print the summary on every run;
once stable, floor branch coverage near the current 84%. Adds a devDependency,
which is a §12 question for the operator, not a decision this analysis makes.

## What is deliberately not proposed

- **Adding jsdom.** P3 gets the same coverage without it and keeps the repo's
  no-DOM-library convention intact.
- **Deleting `countries.test.js` coverage.** The properties it checks are worth
  checking; only the per-country test explosion is the issue.
- **Any change to shipped `content/` batches**, which is a §4 matter.
