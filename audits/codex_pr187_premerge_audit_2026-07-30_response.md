DO NOT MERGE — CHANGES REQUESTED

# Codex pre-merge audit — PR #187 · L48 response

**PR:** #187 — dyad relation engine + t5 rung
**Range:** `origin/main` @ `dfc89bf` → `claude/dyad-engine-t5` @ `9c749ef`
**Auditor:** Codex, independent of the Claude implementation lane, through
`~/ai-relay/relay --models codex --base origin/main`; Claude reconciliation
recorded separately and not counted as the source of cross-model independence
**Run:** `~/ai-relay/runs/20260730-195423-8ball/` · 219,893 reviewer tokens
**Brief of record:** `audits/codex_pr187_premerge_audit_2026-07-30_brief.md`
**Date:** 2026-07-30

The audit is read-only. No product fix was made, and this response does not
authorize a merge.

## Verdict as received

> **DO NOT MERGE — CHANGES REQUESTED**

The reviewer independently reproduced six P1 blockers and two P2 findings.
The green test suite does not clear the branch: one new test explicitly blesses
the entitlement contradiction, another assertion is tautological, and the
privacy, validation, isolation, and standalone-output failures are untested.

## Reconciliation and severity disposition

The same-lineage Claude reconciler also returned **DO NOT MERGE**. It
independently confirmed the two highest-risk defects — the ungated second-person
surface and the stale hidden DOM — plus the validation drift and stale doctrine
bookkeeping. It downgraded F3 to P2, F4 to doctrine-only P2, and F5 to disclosed
scope; it did not fully re-run the F6 content-source comparison.

Those downgrades are recorded but do not replace the independent verdict:

- A branch journal cannot narrow the operator's original "same fields" and
  "standalone readings byte-for-byte" requirements after implementation, so F3
  and F5 remain contract blockers until the operator changes that contract.
- A deterministic recomputation that usually agrees is still contrary to the
  explicit "consume the already-calculated profile; recompute no coordinate"
  contract, so F4 requires code or an explicit controller-level doctrine change.
- F6 is directly established by the branch source: nine new bodies are authored
  and selected instead of the imported registry meaning. The reconciler's lack
  of a second full content sweep is an honest limit, not contrary evidence.

The reconciler's full record is `RECONCILIATION.md` in the run directory.

## Findings

### F1 · P1 — closing the dyad leaves Person B's data in hidden DOM

`ui/dyad.js:306-323` calls `reset()`, which drops `_second`, hides the output,
clears the three form inputs, and clears the relation nodes. It does **not**
clear `dyad-head-a`, `dyad-head-b`, or either side of the fourteen coordinate
rows, despite the function's own "blank every value node" contract.

Independently reproduced through the controller:

```text
before       output visible · B heading "Beta" · B life path "2"
after invalid output visible · B heading "Beta" · B life path "2"
after back    output hidden  · B heading "Beta" · B life path "2"
```

The deploy preview reproduced the same defect after the real back control:
`headB = "future"`, `arcanaB = "XIII · death"`, and
`animalB = "horse"` remained in the hidden screen. This violates
`DOCTRINE.md:153` ("gone on close") and is merge-blocking privacy-lifecycle
behavior.

Required correction: clear every heading, coordinate, written-entry, and
relation value on close/open; invalidate the previous output before attempting
a new submission; add valid → close and valid → invalid lifecycle regressions
that inspect hidden DOM, not only visibility.

### F2 · P1 — the t5 product is not what the entitlement code delivers

`ui/dyad.js:284-295` injects the dyad entry button for every rendered result,
with no tier gate. Every tier can open the form and submit Person B.
`ui/dyad.js:388-423` applies the ordinary tier density to both A and B and gates
only the relation nodes on `dyadRelation`.

The resulting matrix is:

| Tier | Open/submit B | B sheet | Relation |
|---|---:|---|---|
| free | yes | free density | sealed |
| t1 | yes | t1 density | sealed |
| t2 | yes | t2 density | sealed |
| t3 | yes | complete coordinate sheet | sealed |
| t5 | yes | complete coordinate sheet | open |

`tests/dyad_surface.test.js:386-394` explicitly asserts that t3 receives both
complete coordinate sheets and describes only the relation as the t5 product.
That contradicts `DOCTRINE.md:133-135` and `ui/tiers.js:82-90`, which say t5
buys **a second complete sheet plus the relation layer**. The test proves the
wrong contract is intentional in code; it does not reconcile the contradiction.

Required correction: choose and record one product contract. Under the current
authoritative doctrine, gate the second-person entry, complete B output, and
relation layer at t5, with a fail-closed offer below t5.

### F3 · P1 — Person B does not use the primary form's fields or validation

`ui/dyad.js:180-186` provides only name, date, and optional time. It omits the
primary form's birthplace/city selection, so B cannot resolve a rising sign even
when the information is available. The date input has no `max`.

`submitSecond()` at `ui/dyad.js:339-359`:

- does not trim or reject a whitespace-only name;
- does not reject a future ISO date;
- does not explicitly enforce the primary form's year ≥ 1900 rule;
- leaves the previous valid output visible after an invalid submission.

The primary path does all of those checks at `index.html:1131-1135` and
`index.html:1340-1356`. The preview accepted `2027-01-01`, and the independent
controller reproduction accepted a whitespace-only name and a future date.

Required correction: reuse a shared primary-form field and validation contract,
including local-today `max`, trimmed name, past-date/year checks, city selection,
and error-state clearing. Pin the equivalence with behavioral tests.

### F4 · P1 — the relation engine silently recomputes a supplied coordinate

`core/dyad.js:74-80` implements `dyadDayMaster(profile)` by reading raw
`yyyy/mm/dd` and calling `getDayPillar()` again. It ignores the already
calculated `profile.dayPillar`.

The reviewer passed a structurally valid calculated profile whose supplied
`dayPillar` was deliberately changed. The relation still emitted the day master
re-derived from the raw date, not the supplied coordinate. This directly
contradicts `core/dyad.js:8-25` and `DOCTRINE.md:149`, both of which state the
relation consumes calculated profiles and recomputes no coordinate.

Required correction: read and validate the supplied `profile.dayPillar`; add an
isolation test whose supplied coordinate deliberately differs from a date
recalculation.

### F5 · P1 — the paired output is not two preserved standalone readings

`ui/dyad.js:169-206` renders a bespoke two-column coordinate table. The module
itself admits at `ui/dyad.js:28-38` that it omits both written 144-card entries
and the city field needed to resolve B's rising sign.

Returning the original profile objects from `core/dyad.js` is not byte-for-byte
standalone-output preservation when the UI does not reuse or reproduce the
standalone renderer. The result is a narrowed table, not A's standalone reading,
B's standalone reading, and then a relation layer as requested and as
`DOCTRINE.md:145-147` specifies.

Required correction: reuse or extract the standalone rendering path for both
sides, including the written entry and resolvable rising sign, then append the
relation block.

### F6 · P1 — combined-life-path meanings were re-authored

`content/dyad.v1.js:200-236` adds nine new `COMBINED_PATH_NOTES` interpretive
bodies. `core/dyad.js:164-173` renders those bodies even though it also looks up
the existing `NUMEROLOGY_MEANINGS` registry entry.

`DOCTRINE.md:150-151` says the reduced number's meaning is read from the
existing registry rather than re-authored. The new corpus violates that
explicit content-source contract.

Required correction: emit the existing registry meaning and only a neutral
relation/reduction clause that does not restate a second number meaning.

### F7 · P2 — tests encode defects and contain false-green guards

- `tests/dyad_surface.test.js:133-136` includes
  `expect(newlyEntitledCells('free', 't1')).toEqual(newlyEntitledCells('free', 't1'))`,
  which can never fail.
- `tests/dyad_surface.test.js:386-394` pins the doctrine-opposed entitlement
  model.
- The compatibility-pattern guard allows a direct verdict such as
  "both names fit together" to pass.
- No test exercises hidden DOM after close, valid → invalid submission, primary
  and second-form validation equivalence, or supplied-coordinate isolation.

Required correction: replace self-comparisons with independent expected values
and add adversarial contract/lifecycle/voice cases.

### F8 · P2 — v0.61 doctrine bookkeeping is internally stale

The new §1.J amendment begins at `DOCTRINE.md:129`, but three current-state
surfaces still stop at v0.60:

- line 11 says there are three paid rungs and only §1.A-§1.I;
- line 613 declares the doctrine version v0.60;
- the version index begins at v0.60 on line 620.

Required correction: reconcile the summary, version footer, and index with
v0.61/t5/§1.J while preserving historical lineage.

## Verification

| Check | Result |
|---|---|
| `npm test -- --run` | **51 files / 1753 tests passed** |
| `python3 -m unittest audits.test_project_audit` | **93 tests passed** on the host seat; its two printed `FAIL` JSON records are expected synthetic fixtures and the unittest process exits 0 |
| Independent sandbox Python run | unable to create a usable temporary directory; recorded as an environment limit, superseded by the host-seat 93/93 run |
| `bash audits/run_local_audit.sh` | **clean, 827 files scanned** |
| `index.html` | **1497 / 1500 lines** |
| `git diff --check origin/main...HEAD` | clean |
| Capability inspection | no new runtime storage key, fetch, XHR, beacon, WebSocket, or analytics path |
| Deploy-preview live fire | future B date accepted; B header and derived coordinates remain in hidden DOM after back |

## L48 disposition

**Audit returned changes requested. PR #187 must not merge.** The response
artifact satisfies the evidence-file shape only; it does not clear the verdict.
At minimum F1-F3 require an implementation cycle. F4-F6 require either the
specified implementation correction or an explicit controller decision changing
the product/doctrine contract; a branch journal is not that decision. A fresh
independent re-audit is required before merge consideration.
