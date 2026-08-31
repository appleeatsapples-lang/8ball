# PR #225 pre-merge cross-model audit — reconciled response

**PR:** 8ball #225 — DOCTRINE v0.68: the §1.G body/context boundary is
drawn — three authored layers
**Base → head:** `8ed995d` → `674cbc5` at audit start; every finding lands
in the reconciliation commit carrying this artifact — no mid-audit push.
**Process:** DOCTRINE §10 two-lane adversarial review of CONSTITUTION
text — the mandatory cross-model read for a DOCTRINE-touching PR. The
lanes' charter: is the amendment TRUE against the code it certifies,
CONSISTENT with standing clauses, and PROCEDURALLY clean; and is the
resolution DIRECTION itself contestable (flagged, not decided, if so).

## Lane verdicts

| Lane | Verdict | Findings |
|---|---|---|
| Lane A | MERGE WITH FIXES | 2 MAJOR, 2 MED, minors + 1 controller flag |
| Lane B | MERGE WITH FIXES | 2 minors + 1 controller flag + env note |

**Reconciled outcome: MERGE WITH FIXES — every fix-class finding landed
in the amendment text itself; verified below. Neither lane reversed the
three-layer direction. Final call remains with the controller per L48.**

## The resolution, upheld

Both lanes verified every mechanical claim against the shipped tables,
renderer and pins: appended-after assembly, the byte-exact base-body pin
over every family × value, sun/public-animal base-only (pinned),
completeness + whole-line uniqueness, the §2 canonical scans covering
both line families, per-layer §4 versioning, and the "no product
behavior, table, pin, or scan changes" claim. One lane checked the
footer rotation programmatically against base (v0.67 head→prior and
v0.66 prior→superseded bodies byte-identical; exactly one head, one
prior; changelog correct). Neither lane found the third-layer direction
wrong; the strongest counter-argument found is filed as the controller
flag below rather than as a reversal.

## Findings and dispositions

**MAJOR (Lane A F1) — the layer-3 sentence stated the §1.I
adverse-record rule backwards.** The draft said v0.65's suppression
"governs" `THEME_TENSIONS`; shipped and pinned BY NAME, an adverse
record suppresses the HARMONY algebra while a filed tension SURVIVES it
— the tension is itself a registered opposition, not harmony prose.
**Landed:** the sentence now states the rule the way the pin does, with
the reasoning (suppressing a filed tension would assert less than the
registries hold).

**MAJOR (Lane A F2) — layer 2 self-contradicted in one sentence.**
"Keyed by … × value" and "never a second reading of the symbol" cannot
both hold: the suite REQUIRES twelve distinct value-specific lines per
family. **Landed:** the charter is rewritten as what the layer is — the
VALUE read in the position's registered office — with the real boundary
stated: the body remains the sole value-alone citation and a line may
never restate, paraphrase, or rewrite it (the no-echo discipline).

**MED (Lane A F4, L17; Lane B independently) — the v5 routing-note
marker deleted words in place.** "and remains a controller call" was
removed rather than superseded, breaking L17, the footer's both-notes
claim, and the journal's "exact shape" claim. **Landed:** the original
sentence restored verbatim, the resolution marker appended after it per
the v0.64 RENDER precedent — the same shape the v4 note already had.

**MED (Lane A F5) — "exactly three layers" omitted the panel's fourth
rendered prose section.** The §1.I `filed relation` block (v0.65) is a
separately-labeled emission on the same panel. **Landed:** the count is
scoped to §1.G's own authored layers, and the relation block is named as
a §1.I emission so the classification is exhaustive without annexation.

**MED (Lane A F3) — "citation-shaped like the body" was uncertified.**
None of the 96 lines carries the per-sentence attribution the bodies
use. **Landed:** replaced with the honest defense — the offices are
genuinely filed by the traditions, and attribution rides the base
sentence each line is appended to (the assembled string opens with the
named tradition's citation) — plus the register lean named rather than
smoothed (see the controller flag).

**MINOR (Lane A F7/F8/F9) — three precision fixes, landed:** keying is
position × value (`PLACEMENT_LINES` is keyed by sign/branch, not
terminal value — the footer already had it right); "the recurring
skill" → "the native knack" (the shipped birthday frame); base-only
stated as the DEFAULT with the two line families as the enumerated
exceptions and sun/public-animal as the pinned representatives.

**MINOR (Lane B) — the journal's "last open controller call"
overstated:** the §1.J price-column reconciliation is separately open
and controller-reserved. **Landed:** corrected with the overstatement
named.

**FLAGGED FOR THE CONTROLLER, not decided here (both lanes):** (1)
layers 1 and 2 render FUSED — one prose block, one DOM node, no label —
unlike the labeled context and relation sections; the amendment now
states plainly that the boundary is one of authorship, keying and §4
versioning, not presentation, and that its DOM invisibility is why the
constitution must draw it. Whether that fusion should ever become a
labeled seam in the product is a product call the merge word does not
decide. (2) A few slot lines run closer to psychological
characterization than tradition citation — bound by the §2 scans,
defensible under the extended-attribution reading, named for the
controller's own read of the authored content.

**Environment (Lane A F12; Lane B independently), recorded not
rerun-past:** each lane's first full-suite run hit the pre-existing
`tests/cities.test.js` 15-second-budget contention flake (the test
passes in isolation at ~12s). Unrelated to a docs-only diff; merge-time
CI is the clean check, and the flake is now on the record rather than
behind a silent re-run.

## Reconciled verification (post-fix head)

- Suite 57 files / 2011 tests green; product audit PASS, 0 blocking;
  assurance suite 104 OK.
- The corrected amendment re-read against the shipped code: the
  adverse-record sentence now matches the named pin; the layer-2
  charter matches the uniqueness pins; the v5 note's original words are
  intact with the marker appended; footer and changelog updated to the
  corrected phrasing.
- Gates: both `test`'s DOCTRINE-artifact leg and `l48-gate` were red by
  design until this artifact (the CI script carves DOCTRINE.md out of
  its docs-only exemption — verified by a lane against the workflow
  itself, not the CLAUDE.md summary); this file satisfies both.

qualifier: recorded, not certified. Merge authority remains the controller's.
