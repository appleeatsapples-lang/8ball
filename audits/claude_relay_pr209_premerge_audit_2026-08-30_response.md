# Cross-model pre-merge audit — PR #209

**PR:** #209 — DOCTRINE v0.64: the gender-ask retirement written into the constitution
**Branch:** `claude/eight-ball-app-testing-rqphfo` (restarted from `main` @ `4c99ab4` after PR #208 merged)
**Head reviewed:** `46b7c85` (the amendment as first pushed); the fixes below land with this artifact's own commit
**Date:** 2026-08-30
**Auditor:** in-container two-lane review (opus + sonnet), fresh context
each against the doctrine diff, reconciled by the authoring session
(fable). Scope is deliberately narrower than the PR #208 relay: the
underlying product change was already audited there
(`audits/claude_relay_pr208_premerge_audit_2026-08-30_response.md`);
this pass verifies the AMENDMENT TEXT against the shipped code — its
accuracy, completeness over every former gender mention, house-style
supersession, and honesty. Same-family lanes with an author-reconciler,
weighted accordingly by the reader; per L48 this response does not
self-clear the PR — merge stays with the controller.

## Verdicts

- sonnet: **MERGE WITH FIXES** (1 completeness gap, 1 honesty nit)
- opus: **MERGE WITH FIXES** (same gap as F1, + 2 honesty tightenings,
  + 1 unexplained style divergence, accuracy otherwise fully reproduced)
- **Reconciled: MERGE WITH FIXES — all four items fixed in this
  artifact's commit. SAFE TO MERGE per this artifact's own read, pending
  the controller's read and the explicit merge word (§10/L48).**

## What was reviewed

The two-file diff (`DOCTRINE.md` + `journal.md`, 94 diff lines) against
shipped HEAD `4c99ab4` and the pr208 artifact. Both lanes re-ran the
full suite (57 files / 1950 tests, reproduced exactly) and the product
auditor (PASS, 0 blocking); opus re-proved the scrubs'
"surgical by mutation-pinned contract" claim with three of its own
mutations in an isolated tree copy (each red on exactly one test),
confirmed `4c99ab4` is a single-parent squash of #208, confirmed
`content/kua.v1.js` untouched since #199, and confirmed the version-log
chain rotates with history byte-identical.

## Findings — fixed in this artifact's commit

1. **F1 (both lanes) — the sixth gender mention was left reading as
   current truth.** The §1.D v0.63 amendment's opening clause still said
   `kuaRead` is "computed by `core/kua.js` from the SOLAR birth year and
   the profile's optional `gender`", and the v0.64 supersession named
   only "Rules (1)–(3)" of the following paragraph — unlike its §5 twin,
   which supersedes "in full". **Fixed:** the v0.64 paragraph now
   supersedes that computation clause by name (the engine input is the
   solar birth year alone, both gender variants computed and rendered)
   while expressly keeping the Li Chun boundary and the rest of the
   clause standing.
2. **F2 (opus) — the §1.D clause cited the pr208 relay in the slot
   where a §10 clearance goes**, though that relay audited the product
   change and expressly left constitution text outside its pen.
   **Fixed:** the clause now separates the two — the pr208 relay covers
   the product change; this PR's own §10 read is the two-lane review
   this artifact records.
3. **F3 (opus + sonnet) — the inline §1.D clause compressed the relay
   to "three independent lanes"**, dropping the Claude-family /
   author-reconciler weighting the artifact itself insists on (the
   version-log entry two paragraphs down states it; the inline clause
   did not). **Fixed:** stated inline as well.
4. **F4 (opus, style) — the §5 `gender` bullet was deleted outright
   where the neighboring retired facet-key bullets keep RETIRED lineage
   entries, with the divergence unexplained.** Deliberate, and now
   explained in place: the field list is the §5 privacy inventory of
   what IS stored; gender is not stored and is actively erased, so a
   lingering bullet would overstate the stored surface — unlike the
   facet keys, which code still names for one-shot clears. **Fixed** by
   adding that one-sentence rationale to the §5 v0.64 paragraph.

## Ruled out / confirmed accurate (both lanes)

Every reproducible number reproduced exactly (suite 57/1950; product
audit PASS with 0 blocking — 13/0/0/1 on a clean tree; `index.html`
1455). The both-values render, the `getKuaBoth`-only consumption of
`core/kua.js`, the three scrubs' contracts, the dead
`KUA_TRIGRAMS[n].body`, the F4/F5 citations, gender's absence from
every runtime path and both privacy disclosures, the version-log
rotation, and the one-bullet shorthand addition all check out. The
doctrine-follows-code sequencing and the relay composition were judged
honestly stated in the version log (the inline gap was F2/F3 above).
One pre-existing, diff-unrelated failure in the auditor's own assurance
suite (a PII-redaction self-test, environment-dependent) reproduces
identically at `main` and is not this PR's.

## Verification after fixes

Suite re-run green over the amended DOCTRINE (pii_scan and the
doctrine-wording pins included). Product audit PASS, 0 blocking.
`git diff --check` clean. This artifact's filename carries the real PR
number, so its commit is also what turns the `test` job's
DOCTRINE-requires-audits-file step and the `l48-gate` green.
