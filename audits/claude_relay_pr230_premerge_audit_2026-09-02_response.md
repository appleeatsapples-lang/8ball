# PR #230 pre-merge cross-model audit — reconciled response

**PR:** 8ball #230 — DOCTRINE v0.72: the sheet organized by system —
TAROT · WESTERN · CHINESE · NUMEROLOGY
**Base → head:** `97da304` → `29fc560` at audit start; every finding lands
in the reconciliation commit carrying this artifact — no mid-audit push.
**Process:** DOCTRINE §10 two-lane adversarial review — the mandatory
cross-model read for a DOCTRINE-touching PR; per-lane subdirectories
and port bands, collision-free.

## Lane verdicts

| Lane | Verdict | Findings |
|---|---|---|
| Lane A | MERGE WITH FIXES | 2 MED, 3 LOW, observations |
| Lane B | MERGE WITH FIXES | 1 procedural, 1 significant, 3 minor, 1 info |

**Reconciled outcome: MERGE WITH FIXES — the row reorder and the single
registry cleared by driving; the fixes were pin quality, two omitted
records, one dead rule and prose precision. All landed. Final call
remains with the controller per L48 (no advance authorization covered
this pass).**

## The load-bearing change, cleared by driving

Both lanes: DOM order equals the derived `CELL_KEYS` on the host sheet
and both dyad sheets; no other file restates row order (share,
meanings, labels, concordance, readings, the cards manifest, the og
tags checked); a base-build saved reading reopens on head with all
fourteen values, catalog, entry and density byte-identical; the share
PNG rendered and inspected — eight rows, new order, correct titles,
zero group titles; all four group titles and both block titles visible
on host and dyad sheets, labels on and off, at 320/390/1280 (one lane
also 1280×720/900), no horizontal overflow, flip-stage and dyad-strip
contracts intact, all fourteen compartments still tap open; the
four-group taxonomy corroborated against `core/pillars.js` and the
existing atlas vocabulary; DOCTRINE word-diff L17-clean. One lane ran
17 mutants against a hash-manifested copy. Suite 57/1940, assurance
109, product audit PASS reproduced by both.

## Findings and dispositions

**MED (both lanes, the shared finding) — the always-visible pins had a
positional blind spot.** `[data-system] > div:first-child { display:
none }` (Lane B) and `.card:not(.labels-revealed) [data-system] >
div:first-child { visibility: hidden }` plus `opacity: 0` variants
(Lane A) hid every group title in a real render while the full suite
stayed green: the first draft inspected only selectors that NAME the
class. **Landed:** the pin inverts — every rule carrying a hiding
declaration (visibility hidden, display none, opacity 0, zero
font-size/height, clip) is inspected, and its selector may not reach a
title by class, by the group's data attribute, or by structural
position under the card (`first-child`, `nth-*`, `> div`, bare `div`);
the labels-toggle scan stays. Both lanes' mutants and an opacity
variant now die (mutation-verified below). §12 forbids jsdom, so this
remains a source pin with a narrowed gap; live-fire stays the ultimate
guard and every lane drives it.

**MED (Lane A F2) — blast radius omitted two published artifact
families.** The 611 hosted `/cards` specimen JPEGs and
`assets/og-image.png` also encode row order and still show the
pre-v0.72 order; the og image additionally still shows sealed hatches
and paid-era copy retired by v0.71, contradicting the page's own alt
text. **Landed as record:** stated in the amendment, the footer and the
journal as QUEUED for regeneration — the PNG sources live off-repo
(`scripts/build_card_jpegs.py`), so this PR names the gap rather than
closing it.

**LOW (Lane A F3) — dead CSS.** `.card .coord-group:first-of-type`
matched nothing (`.card-name` is the card's first div; measured margin
10px, not 2px). **Landed:** `.card .card-type + .coord-group`, the
adjacency the markup actually has.

**LOW (Lane B F5) — stale share wiring.** `index.html` destructured
`shareRowRefs()` into pre-reorder per-row names (order-inert, verified
against the PNG, but misleading). **Landed:** the row array is passed
whole; `ui/share.js` walks it positionally.
That retirement broke the auditor's own `product.share_wiring` consumer
parse (it counted the array literal), which had NO assurance coverage —
the pr229 class again. **Landed:** the check recognizes the whole-array
form by its binding (`const <ident> = shareRowRefs()` bound once,
shareRowRefs() called once) and reports the form in evidence, and six
`ShareWiringFormTests` now exercise both forms plus three failure
shapes against stub product roots.

**LOW (Lane B F3) — the entry-title pin was a string slice** that could
not see a title moved to a sibling of the block. **Landed:** the pin
bounds each block by its own element (class attribute to seal span),
requires exactly one of each title on the card, and forbids
cross-placement.

**LOW (Lane A F5) — truth precision.** "The day and hour pillars
complete one four-pillar set" overstated: the month stem is nowhere on
the sheet. **Landed:** shared-not-complete, in the amendment, the
registry comment and the journal.

**LOW (both lanes) — journal accuracy:** 11 tests, not 12; the
754→909px figure is environment-dependent (Lane B measured 863→1031
in its sandbox) — restated as the ~155px delta.

**Observations, recorded not fixed:** `tests/atlas.test.js` restates a
cell list (order-inert, verified); the artifact was absent at audit
start by design and is this file.

## Reconciled verification (post-fix head)

- Mutation: the two lanes' positional gates and an opacity variant
  killed by the rebuilt pin; the entry-title sibling move killed; the
  five earlier guard classes still killed.
- Suite 57 files / 1940 tests green; product audit PASS, 0 blocking;
  repo_shape + PII guards green; live-fire re-run on the host and dyad
  sheets with the adjacency rule (first-group margin now 2px as
  intended).
- Gates: the `test` job's DOCTRINE-artifact leg and `l48-gate` were red
  by design until this artifact; this file satisfies both; journal-touch
  already passed.

qualifier: recorded, not certified. Merge authority remains the controller's.
