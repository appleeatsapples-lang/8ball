# Cross-model pre-merge audit — PR #212

**PR:** #212 — Meanings v4: per-slot numerology lines + tension registry + panel scroll fix
**Branch:** `claude/eight-ball-app-testing-rqphfo` (restarted from `main` @ `6f8dcbc` after PR #211 merged)
**Heads:** `9a8eacb` reviewed by both lanes; the fixes below land with this artifact's commit
**Date:** 2026-08-30
**Auditor:** in-container two-lane review (opus + sonnet), fresh context
each against the full diff, reconciled by the authoring session (fable).
Same-family lanes with an author-reconciler, weighted accordingly;
every finding re-verified against source before disposition. Per L48
this response does not self-clear the PR — merge stays with the
controller, and the 89 authored sentences remain flagged for the
controller's own content read.

## Verdicts

- sonnet: **MERGE WITH FIXES** (1 MAJOR + 4 MED/LOW, all reproduced by execution)
- opus: **MERGE WITH FIXES** (1 headline rendering regression + 3 dead
  entries proven by exhaustive enumeration + 6 green mutations + 2 doc items)
- **Reconciled: MERGE WITH FIXES — everything fix-class is landed in
  this artifact's commit. SAFE TO MERGE per this artifact's own read,
  pending the controller's read (content included) and the explicit
  merge word (§10/L48). One boundary question deliberately left with
  the controller — see Open.**

## Findings — fixed in this artifact's commit

1. **Panel clipping (opus headline; suite-invisible).** The v4 prose
   outgrew `.meaning-panel.open`'s 420px `max-height` with
   `overflow: hidden` — panels measuring up to ~451px lost the bottom of
   the context block mid-sentence with no scrollbar, worst at 320px and
   text scaling. **Fixed:** cap 640px + `overflow-y: auto`, so growth
   degrades to a scroll, never silent loss; style-pinned; worst-case
   live-fire (master-value sheet, 320×568) measures 413px and fits.
2. **Cross-panel self-contradiction (sonnet MAJOR; opus concurring
   case).** The tension lookup consulted primary-vs-partner only, so a
   cancer/rabbit/life-path-1 sheet closed the sun panel with
   "protection working through caution and initiative" while the
   registry files `caution|initiative` as opposed — and on a
   taurus/life-path-5 sheet the arcana panel asserted harmony over the
   exact pair the sun panel named as a tension. **Fixed:** `harmonyFor`
   checks all three positions (primary/p0, primary/p1, p0/p1) in
   deterministic order; regression-pinned with the audit's own example.
3. **Three dead registry entries (opus, exhaustive enumeration).**
   `attachment|independence`, `change|stability` and
   `ingenuity|tradition` could never fire under the primary-only rule.
   The triple-position fix opens the partner-pair combination classes:
   re-enumeration shows **all 17 filed pairs reachable**, and that
   enumeration now runs INSIDE the suite as a pin, so a future wiring
   change that kills a pair's reachability reds CI instead of leaving
   dead content.
4. **Six green mutations (opus 5 + shared 1), each now red:**
   space-join drop (exact byte-join pin over every family × value);
   whole-family swap inside the content file (a derivation-vocabulary
   oracle pin — each family must name its own derivation and no other's,
   which a swap cannot satisfy; the previous pin used the table as its
   own oracle); scroll delay shrunk below the 280ms transition (pinned
   not-at-280 / fired-by-320); reduced-motion query string corruption
   (exact-string pin); tension search restricted to one position
   (position-coverage pins); the 420px cap revert (style pin).
5. **Double-fire scroll (sonnet LOW).** One pending scroll timer at a
   time; a reopen inside the window retargets instead of firing twice;
   behavior-pinned.
6. **Version-truth completion (sonnet MED).** `core/dyad.js` (import +
   disclosed provenance string) tracks v4; §1.G gains a mechanical
   routing note resolving the v0.62-era "active registry is v3" clauses
   through v4's unedited re-export; the content-interaction footer line
   updated. History entries untouched.

## Open — the controller's call, named not decided

**The §1.G body/context boundary (opus).** §1.G's meaning-body contract
predates prose of the slot-line kind, and the 72 slot lines are
interpretation living inside the rendered body where §1.G-era text
described citation. The routing note in DOCTRINE names the question and
this artifact records it; deciding whether the slot lines sit inside the
"registered meaning" or constitute a third authored layer (and amending
§1.G accordingly) is constitution text — the controller's pen. The §2
register laws bind the prose either way and are mechanically scanned.

## Ruled out / confirmed (the lanes' own verification)

Suite counts, audit PASS, `index.html` untouched, and the journal's
three named mutation-kills reproduced exactly by both lanes. Content
register: all 89 authored sentences clean against the shared
voice-register scanner and a manual read for ranking/oracle/second-
person/diagnostic violations (both lanes). Immutability: v1/v2/v3
byte-untouched; master bodies v1-identical as the assembled prefix;
scan-target parity genuinely forced the version switch. Live-fire:
repeated values diverge on the 1990-05-15 card; the persistence|change
tension renders; the top-row tap scrolls the panel into view.

## Verification after all fixes

Suite **57 files / 1962 tests green** (1959 + the reachability
enumeration, the oracle pin, the panel-style pin; scroll/tension pins
reworked in place). Product audit PASS, 0 blocking. All six lane
mutations re-run post-fix: each red on exactly its pin; restored,
green. Worst-case panel 413px < 640px cap at 320×568, zero console
errors. This artifact's filename carries pr212, so its commit also
greens the `test` job's DOCTRINE step and the `l48-gate`.
