# PR #238 pre-merge cross-model audit — reconciled response

**PR:** 8ball #238 — DOCTRINE v0.79: the readings list closes the host panel too
**Base → head:** `0f0dc86` → `8d7ffc3` at audit start; every finding lands in
the reconciliation commit carrying this artifact — no mid-audit push.
**Process:** DOCTRINE §10 / L48 two-lane adversarial review; per-lane
subdirectories and port bands; both lanes worked from their own clones and left
the working tree untouched. Both live-fired in Chromium against head AND base
(390 / 1100 / 1440), so every "pre-existing" claim below is a measurement, not
an inference.

## Lane verdicts

| Lane | Verdict | Findings |
|---|---|---|
| Lane A | MERGE WITH FIXES | 1 HIGH, 5 MED, 3 LOW; 16 mutants, 15 killed, 1 survivor |
| Lane B | MERGE WITH FIXES | 1 HIGH, 1 MED, 0 LOW; 10 mutants, 9 killed, 1 survivor |

**Reconciled outcome: MERGE WITH FIXES. The shipped behaviour is correct and
neither lane could break it through the readings surface. Every fix is either a
truth defect in the record, a hazard the new wiring opened, or coverage. All
landed. Final call remains with the controller per L48 (no advance
authorization covered this pass).**

The brief made two things the lanes' first priority: the boot-order argument,
and the "every screen that hides `#result`" claim — the latter named explicitly
as *"the exact class of over-claim #237 caught me on; enumerate every path
rather than take my word."* Both lanes found a real defect in each. That the
brief predicted the class and the text shipped it anyway is the finding this
pass is actually about, and it is recorded in the journal rather than smoothed
over.

## HIGH-1 (both lanes, independently) — the headline claim was false, in the same shape as v0.78's

The amendment closed with *"every screen that hides `#result` retires the panel
first, and the v0.78 claim is true without qualification."* Lane A enumerated
every site in the repo that adds `hidden` to `#result` — `#result` is named by
id only in `index.html` and reaches modules as an injected ref — and found
three, not two:

| # | site | retires the panel first? |
|---|---|---|
| 1 | `ui/readings.js` `openPage` | YES — new in this PR |
| 2 | `index.html` dyad `onOpen` | YES — v0.78 |
| 3 | **`ui/profile.js:245` `resetFormDisplay`** | **NO** |

Path 3 is reached from **try another**, from **forget this device**, and from
the corrupted-stored-payload branch of boot recovery. Both lanes live-fired it
on head and on base: open a compartment, click try another, and the panel is
still `open:true`, non-inert, carrying its text, with the cell still `.active`
and the pane still `has-entry` — sampled past the 300ms deferred blank, so it
is a resting state, not a transition. It is retired later and indirectly, by
the card-face MutationObserver, when the next reading renders under it.

Blast radius is small — the panel sits inside a `display:none` `#result` and
focus is on the name field — which is precisely why this is a **truth** defect
rather than a correctness one. Fixed as docs: the clause now says *both screens
that REPLACE the sheet* and names `resetFormDisplay` as the third path with
what actually retires it, and the same correction lands at the v0.78 marker,
the footer's v0.79 and v0.78 entries, and the changelog bullet. Whether
`resetFormDisplay` should close the panel eagerly goes to the controller as
open work rather than being widened into this pass. Lane A's proposed sentence
is used almost verbatim.

The merged v0.78 sentences that carry the same rounding stay unedited per L17;
the correction rides in this PR's own closure markers, which are the editable
text.

## MED-1 (Lane A) — the new wiring opened a temporal dead zone, reproduced in a browser

`index.html`'s readings hook closes over `meaningsUI`, and its listener is live
from the moment `initReadingsUI` returns — about seventy lines above
`const meaningsUI = initMeaningsUI(...)`. The PR's argument ("resolves at click
time, not boot") is correct against input-driven entry, and Lane A confirmed it
properly: the module has no top-level `await`, no `async`, no dynamic `import()`
anywhere between the two, so the browser can dispatch no click into that
window. Lane B reached the same conclusion independently and filed no finding.

What the argument misses is **abort**. Lane A route-intercepted `ui/meanings.js`
to throw at the top of `initMeaningsUI` — standing in for any boot fault in that
window — and got, on head only:

| | head | base |
|---|---|---|
| click `#readings-btn` | **`ReferenceError: Cannot access 'meaningsUI' before initialization`**, list stays hidden, button dead | no error, list opens, focus on the heading |

So the change converts a clean degradation into a dead control. The same file
already codifies the rule it broke, and `readingsUI` itself is hoisted as
`let readingsUI = null` for exactly this reason.

Fixed with the null-object the convention calls for:
`let meaningsUI = { close() {} };` above the readings init, and
`meaningsUI = initMeaningsUI(...) || meaningsUI;` at the original site — so the
fallback covers both a throw and a hypothetical `undefined` return. Lane A's
alternative (reordering the two inits) was tried and rejected in the lane: a
throw in meanings would then stop the readings listener attaching at all, so
the button is dead either way. `tests/desk_layout.test.js` pins the new shape,
including the declaration-before-`initReadingsUI` ordering the fix depends on.

## MED-2 / MED-3 (Lane A; MED-3 also Lane B M1) — `origin`, and a bug that predates this hook

Two separate problems in one line. `openPage()` derived its return `origin`
from whether `#result` was hidden — **after** the hook ran, and on every call.

- **The coupling.** A host hook that hides `#result` itself makes every open
  capture `onboarding`. That is not hypothetical: the paired screen's hook, ten
  lines below the readings one in the same file, has exactly that body. Lane A
  swapped it in by route interception and `back` landed on the entry form with
  the reader's sheet gone.
- **The re-entrancy.** `#readings-btn` sits in the fixed topbar, outside every
  screen, and stays hit-testable while the list is open (Lane A measured it at
  124.6×44 with `elementFromPoint`). A second activation re-derives `origin`
  with the sheet already hidden, and one `back` lands on the form. **Both lanes
  reproduced this on the BASE** — it predates the hook.

Fixed together: `origin` is derived BEFORE the hook and only while the page is
hidden, with the reasoning kept in the source. `tests/readings_ui.test.js`
gains two tests — a second activation cannot repoint `origin`; a hook that
hides `#result` cannot either — and `tests/desk_layout.test.js`'s ordering pin
is INVERTED, since its first draft actively forbade the safe order.

## MED-4 (Lane A) / H2 (Lane B) — the flake, root-caused; the journal's reasoning was wrong

The journal had narrowed the parallel-run flake to "heavy parallel file reading
in this container." Both lanes falsified that independently, by experiment.

- Vitest's default per-test budget is 5000ms; `vitest.config.js` set none.
- The suite's slowest test — `tests/public.test.js`'s voice-register sweep —
  idles at ~2048ms (Lane A) / ~2025ms (Lane B). The next slowest is ~430–465ms.
- Under CPU contention that test times out **5 of 6** runs at 3 concurrent
  suites and **6 of 6** at six (Lane A); **12 of 12** across 4- and 8-way
  parallel runs under added load (Lane B). Same error every time:
  `Test timed out in 5000ms`.
- Under **disk** contention alone it does not reproduce at all: Lane A ran the
  full suite against six concurrent disk hammers (~49MB × 48 passes) — 61 files
  / 2105 tests green, zero failures. Lane B inflated `audits/automated/` to 184
  files / 1.5MB, matching the recorded sighting's shape, and `pii_scan` and
  `cards_hosting` stayed green through all of it.

That kills the file-reading story and, with it, the first sighting's framing.
Both lanes are candid that neither reproduced the recorded `pii_scan` +
`cards_hosting` PAIR specifically; those two crossing 5000ms from 111ms and
133ms slowest-test idles implies a ~40× stall, larger than either lane could
induce. The mechanism is named as what it is — wall-clock proximity to an
unconfigured 5s budget under contention — and the specific pair is left
unpinned rather than declared solved.

Fixed as configuration, both lanes' recommendation: `vitest.config.js` sets
`testTimeout: 20000`, ten times the slowest test and free when the suite is
green. `tests/dependency_discipline.test.js` pins it by importing the real
config, so deleting it or lowering it below 15000 fails there. The journal's
causal sentence is rewritten. `tests/public.test.js`'s 2s baseline is queued
for reduction on its own merits, and the PII scanner's walk scope stays queued
as the correctness argument it always was — it was never going to fix this.

## MED-5 (Lane A) — the L48 artifact was not in the branch

Correct and expected: the diff is not docs-only and touches `DOCTRINE.md`, so
both the `test` job's artifact leg and the standalone `l48-gate` job stay red
until this file lands. Flagged so it is not discovered at merge time. This
commit closes it.

## LOW-1 (Lane A) — two imprecisions in the record

*"a no-op"* — `close()` from onboarding still re-asserts hidden/inert, clears
the pane entry and schedules a blank. It is idempotent and observably inert,
not literally nothing. And the companion rationale (*"`heading.focus()` takes
focus from the cell the panel's own return parked it on"*) describes a
precondition one real path does not meet: after **try another** leaves a stale
open panel (HIGH-1), the cell `close()` focuses is inside a `display:none`
subtree. Lane A verified the outcome is benign — Chromium no-ops that focus and
`heading.focus()` still lands — but the sentence claimed more than it should.
Both corrected in the clause and the journal.

## LOW-2 (Lane A) — a comment claiming what nothing checked

The v0.79 wiring test carried the boot-order rationale in a comment above two
regexes that checked only text presence and a proximity window. Lane A moved
`initMeaningsUI` above `initReadingsUI` (M16) and the full suite stayed green.
Since the record states that order as fact, it is now asserted directly —
`indexOf('initReadingsUI(') < indexOf('initMeaningsUI(')` — and the inversion
fails. That mutant is re-run here and killed.

## LOW-3 (Lane A) — the mutant disclosure did not distinguish kinds of kill

The journal's "four mutants, all killed" mixed three behavioural kills with one
that only a regex over `index.html` can catch, since §12 forbids jsdom and no
test boots the host file. Split in the entry, with the limitation named: a
source-shape pin holds wiring in place; it does not prove the wired thing
works.

## Survivors, and what they say

- **Lane A M13** (of 16; 15 killed) — a mutant that is *a real user-visible
  regression no behavioural test can see*, because the `index.html` glue has
  zero behavioural coverage by construction. Named, not papered over: it is the
  structural reason MED-2's hazard was only text-guarded.
- **Lane B M10** — swapping the order of the two independent `hidden` class
  additions in `openPage`. Harmless; nothing observes it. Filed for
  completeness by the lane and left alone here.

Of Lane A's 15 kills, 8 are source-shape only and 7 behavioural; of Lane B's 9,
5 behavioural and 4 source-shape. Both lanes volunteered that split without
being asked to soften it, which is the disclosure LOW-3 asks the journal for.

## Verified true — no finding

- The DI claim: `ui/readings.js` names no panel id and imports only
  `./modals.js`; the hook is called conditionally and the module opens fine
  with no hooks at all (both lanes, grep + live-fire).
- Focus and scroll: `document.activeElement` is `#readings-title` on open and
  `#readings-btn` on back, at 390 / 1100 / 1440, identical to base; `scrollY`
  and `scrollTop` unchanged across the transition; no console errors; no
  collapse-snap on a fast bounce.
- `closePage()` untouched and does not reopen the panel; the pane's empty line
  returns at ≥1100.
- Shape: `index.html` ≤ 1500; CLAUDE.md counts match; no runtime dependency, no
  `fetch(`, no new localStorage key, no jsdom; `project_audit.py` PASS with its
  own assurance suite green.

## Final state of the reconciled branch

- Suite **61 files / 2108 tests** green (+3 over the audited head: two
  `readings_ui` tests for the `origin` fixes, one `dependency_discipline` test
  pinning `testTimeout`).
- `python3 audits/project_audit.py` — PASS; `python3 -m unittest
  audits.test_project_audit` — OK.
- Seven reconciliation mutants run, all killed — behavioural: `origin` derived
  after the hook, `origin` re-derived on re-entry, `testTimeout` deleted,
  `testTimeout` lowered to 6000; source-shape: the binding back to `const`, the
  assignment without its `|| meaningsUI` fallback, and the two init calls
  swapped in boot order.
- `index.html` 649 → 656 lines (two comment blocks recording why the binding is
  hoisted and why `origin` is derived where it is).

**Merge remains the controller's word per §10 / L48. This artifact claims no
merge authority.**
