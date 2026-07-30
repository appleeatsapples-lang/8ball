SAFE TO MERGE

# Codex pre-merge re-audit — PR #187 · corrected t5 dyad

**PR:** #187 — dyad relation engine + t5 rung  
**Range:** `origin/main` @ `dfc89bf` → `claude/dyad-engine-t5` @ `e34458a`  
**Auditor:** Codex, independent of the Claude Code implementation lane  
**Prior verdict:** `DO NOT MERGE — CHANGES REQUESTED` at `9c749ef`  
**Correction commits:** `98792b1`, `e34458a`  
**Date:** 2026-07-30

## Verdict

**SAFE TO MERGE.**

The corrected branch closes all six original P1 findings and both original P2
findings. A second adversarial pass found two incomplete closures at `98792b1`
(the missing native maximum on Person B's DOB input and Person B inheriting
Person A's stored written-entry facet), plus four test/doctrine/payload/offer
truth gaps. Claude Code corrected those in `e34458a`; this re-audit
independently reproduced the repaired behavior in source, tests, the product
auditor, and a real browser.

No P0-P3 finding remains open in the audited range.

## Original finding closure

| Finding | Disposition |
|---|---|
| F1 hidden Person B DOM residue | Closed. Back/close and valid→invalid blank both sheets, relation values, headings, entry values, and controller state. Browser close left zero non-empty dyad coordinate cells. |
| F2 t5 entitlement contradiction | Closed. Entry visibility, open, submit, and render all use the t5 entitlement; lower rungs receive no second sheet or relation. |
| F3 second-form contract drift | Closed. Shared hard validation rejects whitespace, future and pre-1900 dates; the real dyad DOB input receives local-today `max`; city selection carries the canonical payload and resolves rising. |
| F4 day-master recomputation | Closed. The relation consumes the supplied `profile.dayPillar`; the contradiction fixture proves the supplied coordinate wins. |
| F5 narrowed/non-standalone outputs | Closed. Both sides render complete sheets, written entries and public reads. A bounded real-renderer differential covers one profile per facet-anchor group across every tier and every coordinate. A keeps its current stored facet; B uses B's fresh standalone anchor without touching storage. |
| F6 re-authored numerology meaning | Closed. The relation carries the active registry meaning verbatim and keeps the neutral reduction clause separate. |
| F7 false-green tests | Closed. Tautologies and doctrine-opposed assertions were replaced; lifecycle, entitlement, supplied-coordinate, native-DOB, A/B facet, city-payload, share-isolation and dormant-offer regressions are behavioral. |
| F8 stale v0.61 bookkeeping | Closed. Current-state summary, footer/index and day-master wording agree with the implementation. |

## Re-audit follow-up closure

- **R1 native date boundary:** browser read
  `#dyad-dob-input.max === "2026-07-30"` (local audit date).
- **R2 standalone written-entry parity:** with A life path 4 at the stored
  `mid` position and B life path 3, A's dyad note matched the host sheet while
  B rendered the life-path-3 fresh `low` note rather than A's stored `mid`.
- **R3 test/documentation honesty:** the suite now drives a real
  `renderTierSections` host and a populated `createSheet` instance; doctrine
  states the bounded coverage rather than claiming an unenumerable
  “every profile” proof.
- **R4 doctrine drift:** the day master is correctly described as consumed,
  not as a second deliberate calculation fork.
- **R5 city payload:** behavioral capture proves `cc === city.countryCode`;
  browser city selection returned a resolved B rising sign.
- **R6 dormant offer:** a hypothetical non-empty product URL cannot expose a
  below-t5 no-op entry control; entry visibility remains entitlement-only
  until a coherent offer path exists.

## Verification

| Check | Result |
|---|---|
| Focused dyad/share/facet/DOB/content suites | **6 files / 207 tests passed** |
| `npm test -- --run` | **51 files / 1781 tests passed** |
| `python3 -m unittest audits.test_project_audit` | **93 / 93 passed** |
| `python3 audits/project_audit.py` | **PASS — 13 pass, 0 fail, 1 dirty-worktree advisory before commit** |
| `bash audits/run_local_audit.sh` | **clean — 831 files scanned** |
| `git diff --check` | **clean** |
| `index.html` | **1497 / 1500 lines** |
| Browser: entitlement and two complete sheets | **pass** |
| Browser: native local-today DOB maximum | **pass** |
| Browser: A current facet / B fresh standalone facet | **pass** |
| Browser: B birthplace → rising sign | **pass** |
| Browser: close clears hidden values | **pass** |
| GitHub Actions at `e34458a` | **test, product-audit, L48 gate passed** |
| Netlify at `e34458a` | **header, redirect and deploy-preview checks passed** |

The only remaining local status entries during the audit were the pre-existing
untracked `_to_delete/` and `audits/automated/` directories. They were not
opened, staged, changed, or included in either correction commit.

## Lessons learned

1. A green helper-level test is not a user-visible contract test. Native input
   affordances, hidden DOM and complete rendered blocks need direct assertions.
2. A single stored UI position cannot represent two independent standalone
   profiles. Shared state must be split by role or resolved from each profile's
   own contract.
3. Documentation coverage claims are executable promises. If a suite is
   bounded, name the bound; if it claims a real renderer comparison, drive the
   real renderer.
4. An isolation test must make the second writer actually write. A null host
   proves only that a no-op is harmless.
5. Browser live-fire complements hard validation: the validator caught future
   dates, while only the browser exposed the missing native `max`.
6. Handoffs must report repository state exactly. “Not pushed” is false once
   the commit is visible at the remote head.

## Honest limits

The dyad sheets deliberately do not duplicate the host sheet's element IDs and
therefore are not tappable through the host meaning-panel controller. That
limit is explicitly recorded in doctrine and is not part of this feature's
standalone-output content contract. The t5 Gumroad product remains nonexistent
and `T5_PRODUCT_URL` remains empty; this audit clears the implemented,
fail-closed entitlement behavior, not a checkout flow that does not yet exist.

