# PR #231 pre-merge cross-model audit — reconciled response

**PR:** 8ball #231 — The registry desk: the reading pane and the filed
rail (≥1100px)
**Base → head:** `3f35e9f` → `ab42f82` at audit start; every finding
lands in the reconciliation commit carrying this artifact — no
mid-audit push.
**Process:** DOCTRINE §10 / L48 two-lane adversarial review; per-lane
subdirectories and port bands, the repo working tree untouched by
either lane (both mutated `git archive` copies).

## Lane verdicts

| Lane | Verdict | Findings |
|---|---|---|
| Lane A | MERGE WITH FIXES | 3 MED, 6 LOW, observations; 37 mutants, 33 killed |
| Lane B | MERGE | none; 11 mutants, 11 killed |

**Reconciled outcome: MERGE WITH FIXES — the change does what it
claims on both lanes' drives; the fixes were one arithmetic error in
the pane cap, a height budget the rail outgrew, and pin quality. All
landed. Final call remains with the controller per L48 (no advance
authorization covered this pass).**

## The load-bearing claims, cleared by driving

Both lanes: three columns at ≥1100 measuring exactly the journal's
numbers (1100 → 360·320·300, 1200 → 360·420·300, 1440/1920 →
360·520·300) and nothing moved below 1100 (pane `display:none`, panel
homed in `#card-face`, card render pixel-identical to base at 390/720/
1024); ONE `#meaning-panel` node at every step of 1440↔1000 crossings
with a panel open, after flip-again, save, share, labels and forget;
the §5.D share PNG byte-identical — the real `canvas.toBlob` output
sha256-equal on base and head, at 1024 and at 1440 with the panel
docked and open; a base-saved reading reopens on head with all
fourteen values identical; the dyad opens from `#rail-read` at 1100
and 1440 and renders both sheets; the §5.D button order holds
(shake-again → share → try-another); the ≥720 sticky-rail contract
untouched (position sticky / top 24px measured at every desk width);
keyboard open/close, focus return, `aria-controls` across subtrees,
inert/aria-hidden tracking and reduced motion all hold on the moved
node; zero console errors or warnings across every state and thirteen
viewports; suite 58/1960, assurance 115, product audit PASS reproduced
by both; `index.html` 641 lines; no new storage key, no fetch.

## Findings and dispositions

**MED-1 (Lane A) — the pane's cap was 64px too tall.** `max-height:
calc(100vh − 48px)` against a stuck top that resolves at 88px (body
is the scroller, its padding clears the 64px topbar — the rail's own
≥720 comment records it) put the pane's bottom 40px under the fold at
every short desk viewport, so a long entry's last band and its close
button were reachable only by scrolling the page to its end. Measured
at 1100×700 with the longest entry (655px): pane bottom 740.
**Landed:** `calc(100vh − 112px)` — 88 + a 24px bottom inset; measured
676 at 1100×700, 496 at 1100×520, close button at 657 after a pane
scroll. The pin is the exact constant (MED-3).

**MED-2 (Lane A) — the rail outgrew its own commented budget.** The
three group titles grew the rail 382→450px at rest and 418→493 with a
status line, past the ≥720 comment's "~485 at its tallest" and 5px
under the 853×533 fold that comment cites as its worked example.
**Landed:** title metrics trimmed (line-height 1.2, margins 10/4):
430 at rest, 466 with a status line — fits the 853×533 band at rest
(tail 518), 21px under it only with a status line shown and reachable
by scrolling the page out (the rail un-sticks). The comment now
carries the re-measured numbers and the honest reachability claim in
place of the false one; the journal records both figures.

**MED-3 (Lane A) — pins a wrong value walked through.** A `+400px`
cap survived `toMatch(/100vh/)`; the docked panel's `aria-live` had no
pin, and docked it sits OUTSIDE the card's own live region, so its own
politeness is the only announcement left. **Landed:** exact-constant
cap pin; `aria-live="polite"` pinned on the moved node.

**LOW-1 (Lane A) — double-init guard blind at the desk.** The
card-scoped `querySelector('#meaning-panel')` cannot see a docked
panel; a second init produced two panels and two hints (reproduced,
1440). **Landed:** the document is asked as well; a docked second-init
test pins it.

**LOW-2 (Lane A) — the file's only unguarded `:has()`.** **Landed:**
replaced by `.has-entry`, set by `ui/meanings.js` on open and cleared
on close (the module owns that state and already sets `.docked`);
pinned both in CSS text and by the mock run (open → has-entry, close →
cleared); the desk block may not contain `:has(`.

**LOW-3 (Lane A) — no programmatic grouping.** **Landed:** each title
carries an id and each group is `role="group" aria-labelledby` its
title; the markup pin requires the pairing by key; live-fired.

**LOW-4 (Lane A) — undeclared cascade coupling.** The desk's lift of
the module's 720px clamp wins on specificity alone with the module's
injected rules LATER in the cascade. **Landed:** declared in both
files; the module pinned to class-level `.meaning-panel.open`, no
`#id` form, no `!important` (comment-blind).

**LOW-5 (Lane A) — journal self-contradiction.** "byte-for-byte the
same markup" at 390/720 vs the rail pass "at every width" one sentence
later. **Landed:** restated — the card and pane markup are unchanged,
the rail's changes everywhere and the page grows ~60px at 390.

**LOW-6 (Lane A) — `:first-of-type` fragility.** **Landed:**
`.density-strip + .rail-group-title`, the adjacency the markup has.

**Observations, recorded not fixed:** the pane is a complementary
landmark even when empty; `#meaning-close` now follows the whole card
in tab order (forward-reachable, Escape and focus-return unaffected);
cosmetic desk values (pane padding, main gap) are unpinned by choice;
an 880-CSS-px viewport (the 125%-zoom proxy) correctly falls below the
breakpoint; the artifact was absent at audit start by design and is
this file.

## Reconciled verification (post-fix head)

- Suite 58 files / 1962 tests green (two tests added: docked
  second-init, has-entry round trip); product audit PASS, 0 blocking;
  repo_shape + PII guards green.
- Live-fire re-run on the fixed head: pane bottom 676/496/598/567 at
  1100×700 / 1100×520 / 1200×700 / 1440×720 with the longest entry,
  close button reachable in each; rail 430/466 at 853×533 and 1024×700;
  the three groups resolve `role=group` → their titles; first title
  margin 0, the others 10px; no console output.
- Gates: `test` green from the first push; `l48-gate` red by design
  until this artifact; journal-touch satisfied (no DOCTRINE or content
  touch).

qualifier: recorded, not certified. Merge authority remains the controller's.
