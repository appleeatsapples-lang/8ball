# PR #228 pre-merge cross-model audit — reconciled response

**PR:** 8ball #228 — DOCTRINE v0.70: the kua block is retired from the
render
**Base → head:** `24bb0f6` → `e5c429d` at audit start; every finding lands
in the reconciliation commit carrying this artifact — no mid-audit push.
**Process:** DOCTRINE §10 two-lane adversarial review — the mandatory
cross-model read for a DOCTRINE-touching PR. The brief's charter for a
REMOVAL: residue (dead wiring, orphaned styles, stale pins, copy still
promising the feature) and over-cut (taking what the removal was not
licensed to take). Per the pr227 process note, each lane worked in its
own scratch subdirectory; the round ran collision-free.

## Lane verdicts

| Lane | Verdict | Findings |
|---|---|---|
| Lane A | MERGE WITH FIXES | 1 MAJOR, 3 minor, 3 nits + 1 pre-existing note |
| Lane B | SAFE TO MERGE | 1 low/informational |

**Reconciled outcome: MERGE WITH FIXES — every fix-class finding is in
the RECORD, none in the removal itself; all landed. Final call remains
with the controller per L48.**

## The removal, verified clean from both directions

**Residue:** both lanes grepped the whole tree and found zero kua
remnants in shipped product code, markup or either host stylesheet;
`ui/kua.js` 404s from a served checkout; `registerKuaRoot` and every
other deleted export has zero remaining importers; `ui/sheet.js`'s
`valueNodes()`/`clear()` reduced correctly with no dangling
references; no copy anywhere still promises the kua line.

**Over-cut:** `core/kua.js` and `content/kua.v1.js` byte-identical to
base (git-verified by both lanes); their suites still bite — one lane
spot-mutated the formula (7 failures), the other ran four mutations,
all caught, all restorations proven. All three v0.64 gender-token boot
scrubs survive with their mutation-pinned surgical contracts. Shared
infrastructure that lost kua legs (the dyad class-parity differential,
the unseal beat, the `.public-title` labels-reveal rule, the sheet
DOM-purity pin) was re-proven non-vacuous post-excision.

**Live-fire, independent on both lanes' own byte-verified servers:**
free / t3 / t3-revealed / t5 dyad all render zero kua nodes and zero
kua text; the unseal beat still fires on a t2→t3 paid return (landing
on `card-entry` AND `public-read`); the density strip carries no kua
tail; the vacated block left no layout hole (24px trailing gap at free
and t3 alike); zero console errors.

## Findings and dispositions

**F1 MAJOR (Lane A) — the record certified a marker that was not
there.** DOCTRINE's footer, changelog and the journal all said markers
were appended to the v0.63 AND v0.64 §1.D clauses; only v0.63 had one.
The authoring replace for v0.64 targeted a quote shape the paragraph
does not end with and silently no-opped, and nothing checked the
result — so "The kua block STAYS at t3" stood unmarked while three
records said otherwise. **Landed:** the marker is truly appended
(grep-verified this time), and the journal records the lesson: a
certifying sentence is written only after grepping the text it
certifies.

**F2 minor (Lane A) — test accounting wrong twice:** the retired
render suite had 24 tests, not 25, and the dyad differential lost ONE
test, not 25 — the real delta is 24 + 1 = 25. **Landed** in the
journal.

**F3 minor (Lane A) — "six lines plus a title":** the renderer built
exactly six text nodes including the title; DOCTRINE had it right and
the journal didn't. **Landed:** aligned, with the six enumerated.

**F4 minor (Lane A) — owner impact unnamed.** "Entitlements untouched"
is true of the grant mechanics but a device that bought t3/t5 while
the copy promised the kua line now renders one block fewer, and the
v0.58/v0.60 precedent names owner impact rather than leaving it to be
discovered. **Landed:** an owner-impact sentence in the v0.70
amendment — every entitlement kept, the block itself removed for every
tier alike, stated as reaching existing owners.

**F5–F7 nits (Lane A; Lane B's one LOW = F5):** two stale
present-tense "the kua block reads" comments in `ui/profile.js` /
`ui/readings.js` retired to past tense with the v0.70 pointer; the
out-of-scope `.kua-gender-field` comment edit in `ui/experience.css`
reverted (`tests/mobile_submit_reveal.test.js` still guards that
literal token); two loose journal phrases ("cell routing", "both
about-copy mentions") tightened to what the diff actually did.

**Pre-existing, recorded not fixed (Lane A):** the `.public-title`
labels-reveal rule this PR's diff touched is unpinned — renaming its
selector rides the full suite green. Verified identical at base, so
not this PR's regression; queued as a hardening candidate.

## Reconciled verification (post-fix head)

- Suite 56 files / 1986 tests green; product audit PASS, 0 blocking;
  assurance suite 104 OK; repo_shape + PII guards green; CLAUDE.md
  counts (13 core / 14 ui / 56 tests) parse and are true.
- DOCTRINE word-diff: the only in-place edit in the whole file is the
  licensed footer label rotation; every marker appended with originals
  intact per L17.
- CI read against the workflow itself: journal-touch gate passes on
  the base head; the `test` job's DOCTRINE-artifact leg and `l48-gate`
  were red by design until this artifact; this file satisfies both.

qualifier: recorded, not certified. Merge authority remains the controller's.
