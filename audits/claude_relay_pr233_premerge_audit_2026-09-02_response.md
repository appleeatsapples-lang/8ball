# PR #233 pre-merge cross-model audit — reconciled response

**PR:** 8ball #233 — DOCTRINE v0.74: the labeled view simplified — the
placard and the atlas leave the card for the panel
**Base → head:** `f46200b` → `b89e2b3` at audit start; every finding
lands in the reconciliation commit carrying this artifact — no
mid-audit push.
**Process:** DOCTRINE §10 / L48 two-lane adversarial review — the
mandatory cross-model read for a DOCTRINE-touching PR; per-lane
subdirectories and port bands; both lanes worked from archives/clones
and left the working tree untouched (verified `git status` clean).

## Lane verdicts

| Lane | Verdict | Findings |
|---|---|---|
| Lane A | MERGE WITH FIXES | 3 MED, 6 LOW, 4 observations; 17 mutants, 14 killed |
| Lane B | MERGE | 1 MED (stale checklist), 2 LOW; 11 mutants, 10 killed |

**Reconciled outcome: MERGE WITH FIXES — the product change held on
both drives in full; the fixes were one false sentence in the new
doctrine text, one stale checklist instruction, two coverage gaps the
PR's own retirement pins had opened, and record precision. All
landed. Final call remains with the controller per L48 (no advance
authorization covered this pass).**

## The product claims, cleared by driving

Both lanes: zero `.coord-atlas` / `.coord-prov` nodes document-wide
(host sheet and both dyad sheets, before and after the dyad renders;
base showed 18 and 27); exactly nine visible `.coord-title` when
labeled; the labeled height delta +351 → +117 at 390 wide and +363 →
+117 at 1440 reproduced exactly; all fifteen panel lines equal
`ATLAS_NOTE · PROV_NOTE` (ten) or the note alone (the five
self-naming coordinates), between the head and the title, never
empty, no digit, no value, no name, and byte-identical whether the
cell is resolved or unresolved (rising, moon and hour pillar without a
birth time still name their derivation — the live proxy for
tier-invariance); the `:empty` rule verified against a mutated copy;
`PROV_NOTE` / `ATLAS_NOTE` sha-identical to base; `derivationText`
pure (one argument, no profile, DOM or storage); the real share PNG
sha256-identical on base and head, labels on or off; the labels key
round-trips; a base-saved reading reopens on head; `aria-labelledby`
resolves, the line sits inside the `aria-live` region, one node
survives the ≥1100 dock crossing both ways; zero console errors across
every state at 320/390/720/1100/1440; suite 60/1999 and product audit
PASS reproduced by both; `index.html` 645 lines.

## Findings and dispositions

**F1 (Lane A, MED) — the amendment claimed a dyad behaviour that does
not happen.** "The labels toggle now reveals the row titles only … on
the host sheet and on both dyad sheets": the labels class is
host-scoped (`ui/labels.js` toggles `#card-face` and the flip stage
only), so the dyad sheets' eighteen title nodes were never revealed
and still are not; and the dyad's compartments open no panel (§1.J's
recorded limit), so for those thirty compartments the derivation
surface is retired, not relocated — before this PR the two lines
existed there as permanently hidden markup, so no visible pixel is
lost. **Landed:** the amendment, the footer entry and the journal
state the dyad exactly; the open question (should the dyad sheets
reveal titles or carry a derivation surface) is named for the
controller rather than implied.

**F2 (Lane A, MED) — the artifact.** Absent at audit start by design;
this file.

**F3 (both, MED) — `audits/RELEASE_CHECKLIST.md` told the smoke test
to look for placards and the atlas.** **Landed:** the line now says
row titles reveal/hide and the panel shows `system name · derivation`.

**F4 (Lane A, MED) — the retirement pins were file-scoped.** A
`.coord-prov` writer injected into `ui/labels.js` rode the suite green
and rendered nine always-visible placards (worse than base, since the
default `display:none` is gone). **Landed:** `tests/provenance.test.js`
walks every shipped `ui/*.js`, `core/*.js`, `content/*.js`, `ui/*.css`
and `*.html` with no allow-list (the walk is pinned non-vacuous:
`ui/labels.js`, `ui/experience.css` and `index.html` must be in it);
F6's `experience.css` gap closes with it. Re-run: the labels.js writer
fails 1 test; an `experience.css` rule fails 1.

**F5 (both) — nothing pinned that the toggle reveals the titles.** The
PR had retired the last two positive `.labels-revealed` pins with the
placard/atlas rules, so inverting the shell rule left a labeled view
showing nothing while 1999 tests passed (pre-existing gap, made
load-bearing here). **Landed:** `tests/labels_reveal.test.js` pins the
default-hidden and revealed-visible `.coord-title` rules and forbids
any `.labels-revealed` title rule in either stylesheet from hiding.
Re-run: the inverted rule fails 2 tests.

**F7 (Lane A, LOW) — `ui/labels.js`'s header** still described the
deleted rules and named `index.html` as their home. **Landed:**
rewritten; it now states the repo-wide guard.

**F8 (Lane A, LOW) — absolute pixel figures did not reproduce.** Both
lanes measured every absolute 17px above the author's (955 → 1306 /
1072 at 390), on both branches, at every width; the deltas matched
exactly. **Landed:** the amendment and the journal state deltas as the
claim and record the method spread.

**F9 (Lane A, LOW) — the two superseded clause sentences** ("rendered
per row…", "rendered in `.coord-atlas`…", "Visibility reuses the
toggle…") carried no inline marker. **Landed:** dated markers appended
per the §1.F(b) / v0.69 precedent; no prior word edited.

**F10/F11 (Lane A, observations) + Lane B LOW.** `provText` /
`atlasText` are retained tested joins with no shipped caller — noted
in `ui/tiers.js`; the `8BALL.md` module cell carries the marker
README got; the dead `PROV_NOTE` / `ATLAS_NOTE` re-export in
`ui/sheet.js` (no importer) removed.

**Recorded, not fixed:** the docked panel keeps the derivation line at
9px beside the 10px head (legible, single line, deliberate — F12); the
sealed-compartment claim is structural, since v0.71 renders no sealed
cell (F13); `RELEASE_CHECKLIST.md`'s surrounding paid-era bullets and
`8BALL.md` §3's dated table are pre-existing debt named by both lanes.

## Reconciled verification (post-fix head)

- Suite 60 files / 2049 tests green (the repo-wide walk adds one test
  per shipped source); product audit PASS, 0 blocking.
- Mutation re-run: the `ui/labels.js` placard writer, the inverted
  `.coord-title` rule and an `experience.css` placard rule — all
  killed.
- Gates: the `test` job's DOCTRINE-artifact leg and `l48-gate` were red
  by design until this artifact; this file satisfies both; journal-touch
  already passed.

qualifier: recorded, not certified. Merge authority remains the controller's.
