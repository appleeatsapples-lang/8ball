# PR #247 pre-merge cross-model audit — reconciled response

**PR:** 8ball #247 — DOCTRINE v0.90: the Pair Dossier and Pair Imprint ship inside the paid dyad — the candidate integrated on post-#246 main, renumbered v0.83–v0.89
**Base → head:** `3cfc0e5` (#246) → `e8995f8` at audit start (three merges + renumber + v0.90 + journal); both lanes' fixes land in `7330a63` and `6155fca`, and this artifact's commit.
**Process:** DOCTRINE §10 / L48 two-lane adversarial review, driven directly from the local Mac (the `relay` script's codex adapter still lacks `-o`). Corpus: the complete CODE diff vs main (core/, ui/, tests/, index.html, scripts/) plus doctrine and journal excerpts, 800,477 characters, sanitised to UTF-8 after a first launch failed on a byte-truncated multibyte character (both lanes refused the file; the failed attempt is kept beside the responses in `~/ai-relay/runs/20260906-125453-8ball-pair-port-direct/`). Lanes were told the narrative docs were trimmed and that an unseen document is absent from the corpus, not from the repository. Codex `gpt-5.5`; grok default. Neither lane wrote a fix. The controller's own independent review of the day (Codex desktop) had browser-tested the exact clarity bytes this PR merges (diff SHA-256 `850edb26…`) and is cited where it adds evidence.

## Lane verdicts

| Lane | Verdict | Findings |
|---|---|---|
| Codex | MERGE WITH FIXES | 2 P1, 3 P2, 1 P3 |
| Grok | MERGE WITH FIXES | 1 P0, 3 P1, 2 P2, 1 P3 |

**Reconciled outcome: MERGE WITH FIXES — every finding landed; the two lanes' independent agreement on the load-bearing miss is what makes it load-bearing.** Neither lane found the runtime boundary broken: both confirmed from the diff that `open()`, `render()` and `compareAnother()` refuse below `t5`, that `core/entitlement.js` and `ui/payments.js` are absent from the diff (identical to main), and that the `PAIR_IMPRINT_ALLOW` path is the only way into the PNG. What both found was that the integration had taken main's GATES and the candidate's COMMENTS: the shipped source, two test preambles, the agent procedure docs and the project map still taught "`getRenderTier()` always resolves the ceiling — every device sees the Pair Dossier — there is no paid surface left". Grok rated it P0 because a later editor believing those notes would delete a live gate, and source is a shipped surface. Both also found that no test booted at `t3`.

## Findings and dispositions

| # | Lane | Sev | Finding | Disposition |
|---|---|---|---|---|
| 1 | Grok P0 / Codex P1 | Candidate-era "current-truth notes" in `ui/dyad.js` (header + JSDocs on `dyadEntitled`/`open`/`render`), `ui/tiers.js` (six sites), `ui/public.js` (three), `ui/readings.js`, `ui/concordance.js`, `tests/dyad_surface.test.js` and `tests/density.test.js` preambles say Pair is free for every device | **Fixed** (`7330a63`): every site rewritten to the v0.81/v0.90 truth — resolver `t3` for every device, `t5` only from a verified token; the single sheet complete at t3 so no cell is ever sealed; the dyad the one t5 addition; the unseal beat cannot fire because entitlement settles before first render |
| 2 | Both P1 | `agents/verifier.md` / `agents/auditor.md` (and `core/payments.js` header) rewritten by the candidate to "commerce retired, no paid surface left" | **Fixed** (`7330a63`): the candidate's changes to all three were comments/prose only — restored to `origin/main` byte for byte, so a future CiC verifier runs the v0.81 token/offer live-fire |
| 3 | Codex P2 / Grok P1 | `initPairShareUI` wired unconditionally at module top level; no test boots at t3; every Pair test mocks `getTier: () => 't5'`, so a resolver answering t5 for everyone passes the suite | **Fixed** (`7330a63`, `6155fca`): the Pair share controller is created only inside `boot()` after `resolveDyadEntitlement` has settled, guarded on `t5` (entitlement cannot rise mid-session, so one settled check is the whole gate); `currentRelation()` answers null below t5; three new pins boot at t3 — open/render/compareAnother refuse with the root hidden and the relation null; the entry hidden and the configured offer the only rail control; the host wiring guarded and single. **Proven by breaking:** a resolver returning `'t5'` for everyone now fails 13 tests; removing the guard fails 2 |
| 4 | Codex P2 | Pair DOM injected hidden for t3 devices | **Accepted as main's own v0.81 design, stated precisely** in v0.90: markup injected hidden at init as v0.81's host already did, every entry refuses below t5, the share controller not initialised below t5, the t3 boot pinned rather than assumed. Deferring injection to t5 would re-architect the candidate's audited screen-ownership model and is not taken here |
| 5 | Codex P2 / Grok P1 | v0.90 overclaimed: "text otherwise unchanged", "copy has left the shipped copy", "boot path byte-identical" while a line was deleted | **Fixed** (`7330a63`): the clause now says the renumber changed version tokens only and that the candidate's amendments carry their own histories; states the comment sweep as done in-PR after the lanes; states the boot path identical except the deleted dangling `labelsUI` call and the moved share initialisation |
| 6 | Grok P2 | Renumber leftovers: journal heading still "DOCTRINE v0.79: the Pair Dossier" (outside the shift window); footer chain skipped v0.83–v0.86 | **Fixed** (`7330a63`): heading reads "v0.79 (as first filed; v0.81 after the candidate's own rebase; v0.83 after the integration renumber)"; four `superseded` entries added |
| 7 | Grok P2 | Dead `onLabelsChange` hook key in `tests/pair_readings_integration.test.js` harness | **Fixed** (`7330a63`): removed |
| 8 | Codex P3 / Grok P1 | `8BALL.md` / `README.md` freshness lag v0.90 | **Fixed** (`7330a63`): 8BALL refreshed to v0.90 with a "Current product model" paragraph and the `ui/payments.js` row rewritten; README item 6 reworded |
| 9 | Grok P3 | index.html size, three style injectors, a11y of the toggle removal, readings return path | Measured: `index.html` 747 lines (≤ 1500). Injector count unchanged by this PR. Grok confirmed open focuses `#dyad-heading`, back focuses `#dyad-open-btn`, live regions present, and the `readingsSurfaceActive` snapshot is the right fix. No change |
| 10 | Grok | Privacy: `PAIR_IMPRINT_ALLOW` holds; no new storage key; no fetch/beacon | Confirmed; the live-fire's per-share request delta is empty and the SVG carries no name or DOB |

## Mutants planted (both lanes' proposals) — killed, by name

| Mutant | Result |
|---|---|
| Production `getRenderTier()` returns `'t5'` for everyone (both lanes' #2 — "this PR's new tests would not kill it") | **13 tests fail** after the absorbs (entitlement suite + the new t3 pins); before the absorbs the suite was green under it, which is the finding |
| Remove the `t5` guard around `initPairShareUI` in `index.html` | 2 tests fail (the wiring pin, single-call pin) |
| Delete `if (!dyadEntitled(currentTier())) return false` in `open()` | killed by the existing F2 "never below t5" test and the new t3 pin |
| Spread `formattedRelation` into the snapshot | killed by `tests/pair_share.test.js` key-equality with `PAIR_IMPRINT_ALLOW` (pre-existing) |
| Restore `labelsUI.applyLabelsState(isLabelsRevealed())` in `boot()` | killed by `tests/labels_reveal.test.js` and the dyad_surface html scan (pre-existing) |
| Drop `hooks.closeActiveScreens` | killed by `tests/pair_readings_integration.test.js` (pre-existing) |

## Verification at the head carrying this artifact (local Mac, live runs)

- `npx vitest run` — **65 files / 2574 tests** green (main 62/2209 · candidate 63/2469 · clarity 64/2497)
- `python3 -m unittest audits.test_project_audit` — OK; `python3 audits/project_audit.py` — PASS, 0 blocking
- `bash audits/run_local_audit.sh` — clean, 917 files
- Live-fire re-run after the absorbs (headless Chrome, 390 and 1280; real tree on :5176, throwaway-keyed scratch copy on :5175): unentitled → free sheet, no toggle, `full sheet` rail, offer visible with href, no entry control, zero free-era copy, a foreign-key link refused, zero console errors; entitled → filed banner, entry visible, offer hidden, `pair reading` with the three-finding signature, share → 1080×1350 PNG on disk with no name/DOB, zero foreign requests, reload stays entitled. Evidence: `~/8ball/audits/pair_inside_paid_dyad_livefire_2026-09-06/` (`results.json` before, `results_after_absorbs.json` after)
- `index.html` 747 lines; `core/entitlement.js`, `core/payments.js`, `ui/payments.js`, `agents/*.md` identical to `origin/main`
- Controller's independent review (same day): the clarity bytes browser-tested at 390 and 1280 (64 files / 2,497 on the candidate + clarity); no new code defect

## Record of the process, including the misstep

The first absorb commit `7330a63` was pushed with its new t3 pin still red: `currentRelation()` returned a relation record leaked from earlier t5 tests in the same file. The fix (`6155fca`) made the getter itself answer null below t5 — a stronger boundary than the pin had assumed — and the journal entry says so.

## What this audit does not claim

A real purchase through Gumroad and the per-sale signed-link delivery are the controller's routine, verified separately (the storefront was confirmed live at $3 on `/l/dyad` the same afternoon). Native share on a phone, screen readers and WebKit were not driven. Deferring the dyad screen's DOM injection until t5 is recorded as a design option, not taken.

**This artifact claims no merge authority — the merge word stays with the controller per §10/L48.**
