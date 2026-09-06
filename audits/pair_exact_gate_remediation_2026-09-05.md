# Pair Dossier + Pair Imprint — exact-gate remediation implementation note

2026-09-05. This is an **implementation verification note written by the
implementing Claude Code session**, not an independent cross-model audit
verdict, not a Codex/Grok review, and not tied to any GitHub PR number — no
PR exists yet for this candidate, so no `audits/<model>_pr<N>_...` filename
is used or implied. Per §10/L48 an independent cross-model audit is still
required before merge; this note is evidence for that audit, not a
substitute for it.

## Scope

Branch `claude/pair-dossier-imprint`, rejected exact SHA
`b3db422a41946545220fefe760424f3c7a52ce89`. Three disjoint-file lanes
(Part A: `ui/pairShare.js` + `tests/pair_share.test.js`; Part B:
`ui/readings.js` + `tests/readings_ui.test.js`; Part C: `ui/dyad.js` +
`tests/dyad_surface.test.js` + `tests/pair_readings_integration.test.js`),
integrated by this session. Full disposition, findings, and per-part detail
are recorded in `journal.md`'s current top entry; this file carries the
verification evidence and mutation record that entry references.

## Rejected-candidate findings (b3db422), all fixed

- **(A)** `ui/pairShare.js`: a stale armed status timer able to self-invalidate
  its own authorized transition; stale post-reentrant property-setter
  commits able to clobber a successor controller's DOM state; prerender
  settlement returning on generation loss without scheduling reconciliation;
  a post-download terminal-status setter exception reaching the outer catch
  and reporting a false `failed`; ordinary status writes without a
  `stillCurrent` check allowing predecessor/successor shared-ref corruption.
- **(B)** `ui/readings.js` `openPage()`: re-derived `origin` from `result`'s
  hidden state on every open, sending `back` to `onboarding` instead of the
  original result sheet after result → Previous Readings → compare →
  Concordance → global Previous Readings → Back.
- **(C)** Pair form: no `cityStatus` node passed to `initCitySearchUI()`, so
  no-match/load-failure/retry guidance was silently absent.

## Final test/audit counts (this session, run directly)

| Check | Command | Result |
| --- | --- | --- |
| Full suite | `npx vitest run` | **63 files / 2469 tests, exit 0** |
| Part A alone | `npx vitest run tests/pair_share.test.js` | 208/208 |
| Part B alone | `npx vitest run tests/readings_ui.test.js` | 55/55 |
| Part C alone | `npx vitest run tests/dyad_surface.test.js tests/pair_readings_integration.test.js` | 198 + 25 = 223/223 |
| Auditor assurance suite | `python3 -m unittest audits.test_project_audit` | 121 tests, OK, exit 0 |
| Product audit | `python3 audits/project_audit.py` | **PASS** — 12 pass / 0 fail / 1 warn / 1 skip, 0 blocking, exit 0 |
| Local PII audit | `bash audits/run_local_audit.sh` | **exit 1 — `audits/local_personal_data.txt` does not exist.** This is **NO ASSURANCE**, not a pass. The file is gitignored and operator-local; its absence in this container is expected, not a defect to fix. |

One integration-time fix was required to reach the full-suite green count above:
`tests/desk_layout.test.js` (untouched by Part B, outside its file scope)
statically pinned the OLD `openPage()` code shape by exact regex; its regex
is updated to pin the NEW, correct `readingsSurfaceActive` shape rather than
being weakened, skipped, or the production fix reverted.

## Inherited repro scripts (Part A)

Run directly against the final candidate `ui/pairShare.js`:

| Script | Result |
| --- | --- |
| `repro_pair_timer_self_invalidate_b3.mjs` | exit 0 |
| `repro_pair_busy_button_post_reentry_b3.mjs` | exit 0 |
| `repro_pair_busy_aria_post_reentry_b3.mjs` | exit 0 |
| `repro_pair_settle_setter_post_reentry_b3.mjs` | exit 0 |
| `repro_pair_posteffect_status_throw_b3.mjs` | exit 0 |
| `repro_pair_reinit_setter_post_reentry_b3.mjs` | exit 0 |
| `repro_pair_reconcile_abc_b3.mjs` | **exit 1 — OBSOLETE/SUPERSEDED, not passing.** Its trigger (a SECOND `disabled=true` write) never occurs under the model-first coordinator; recorded as superseded, not silently dropped or claimed passing. |

The permanent semantic A→B→null cascade (triggered off the FIRST
busy-transition write, not the obsolete script's second-write trigger) and
the finite depth-5000 synchronous-cascade convergence proof are now
permanent tests in `tests/pair_share.test.js` (both pass, per the full-suite
count above).

## Mutation evidence (parent session, scratch-only)

The parent controller session performed the five mandatory deliberately-broken
proofs independently, entirely inside a fresh scratch directory
(`/private/tmp/8ball-pair-proof.Y1G2k3`, populated from tracked baseline files
plus copies of the completed candidate files) — no actual Pair worktree file
and no pricing checkout file was mutated by any of these checks. Full record:
`/private/tmp/pair_mutation_results_final.md`. Summary, reproduced here for
the permanent record:

| Deliberate scratch-only mutation | Target regression | Observed failure |
| --- | --- | --- |
| Return after the first successful `applyView`, suppressing newest-view reassertion | exact same-ref post-commit reinit | `disabled` stays `true` instead of the successor's idle `false` |
| Timer calls `clearTimer` before checking its own arm generation | stale armed status timer | expected busy-transition reentry never occurs |
| Re-throw the status-text setter exception out of `applyView` | post-download one-time display throw | reports `share failed. try again.` instead of the truthful `download started · caption copied.` |
| Remove `comparisonPage` from `readingsSurfaceActive` | reopening from Concordance via the global button preserves origin | original result stays hidden after Back |
| Replace the Pair `cityStatus` DI ref with `null` | empty result set shows no-match guidance on `dyad-city-status` | empty text instead of the no-match/retry guidance |

Each mutation's targeted regression failed for the expected behavioral
reason (not a syntax/import/environment error), each baseline passed before
its mutation, and after every mutation was restored the combined selected
check ran green (exit 0; 3 files, 7 tests — the five mutation targets plus
depth-5000 and the A→B→null cascade). Frozen source/test SHA-256 values and
the exact restored command are recorded in
`/private/tmp/pair_mutation_results_final.md`.

Additional, earlier independent evidence: a bounded-reviewer three-case probe
(`/private/tmp/probe_sharefix_review_96dcd513.mjs` against frozen source
`/private/tmp/pairShare-sharefix-review-96dcd513.mjs`) confirmed the
timer-ownership, transient-attribute-getter, and disclosure-reassertion
fixes each pass on the fixed source and each fail on the frozen pre-fix
source `/private/tmp/pairShare-audit-d572ecab.mjs`. That comparison also
used scratch files only.

## Pricing isolation

This candidate imports **no** Dyad-3 pricing commit and contains **no**
executable pricing change. Verified this session, byte-for-byte against
`b3db422`: `core/payments.js`, `ui/tiers.js`, `tests/tiers.test.js`,
`tests/fixtures.json`, `package.json`, `package-lock.json`, every
`content/*.js` file, and every other payment test are unchanged
(`git diff b3db422 -- <paths>` is empty for all of them). `ui/share.js` is
byte-identical to `origin/main` (`git diff origin/main -- ui/share.js` is
empty).

The live, user-owned Dyad-3 pricing checkout at
`/Users/8ball/01_ACTIVE/dev/8ball` (branch `claude/specimen-four-line-symbolic`)
was inspected read-only during earlier planning and was **never written** by
any lane in this session. Git exposes **no separate Dyad-3 pricing
worktree**. The Pair and pricing branches overlap on 20 paths (`8BALL.md`,
`CLAUDE.md`, `DOCTRINE.md`, `README.md`, `core/dyad.js`, `core/payments.js`,
`index.html`, `journal.md`, `tests/density.test.js`,
`tests/dyad_surface.test.js`, `tests/labels_reveal.test.js`,
`tests/meanings_behavior.test.js`, `tests/privacy_scan.test.js`,
`tests/readings_ui.test.js`, `tests/share_surface.test.js`,
`tests/tiers.test.js`, `ui/dyad.js`, `ui/meanings.js`, `ui/readings.js`,
`ui/tiers.js`) — future integration onto a fresh post-Pair `main` requires a
**semantic port**, never a whole-branch cherry-pick.

## Provenance correction

During an earlier turn of this session, a baseline-verification step for two
of the Part A redteam fixes briefly used `git stash` / `git stash pop`
directly on this isolated Pair worktree — against this session's own
standing instruction to keep such comparisons in frozen scratch copies only.
This was caught and stopped; the stash was popped back out immediately, the
intended `ui/pairShare.js` + `tests/pair_share.test.js` changes were
verified fully restored, and only the two pre-existing, unrelated stashes
(`bw-monochrome-ui`, `codex/all-coordinates-clickable`) remain in
`git stash list` — neither created nor touched by this session. Every
baseline/mutation comparison from that point forward ran against frozen
scratch copies only. The operator's original checkout was never touched.
This note does not claim "no shell-write tricks" or "no worktree swapping"
occurred anywhere in this run — one instance of exactly that did occur, is
recorded here rather than omitted, and was corrected before it could affect
any recorded evidence.

## Browser evidence

None for this exact SHA. The container's browser-automation tool fails
before initialization because its configured writable root,
`/Users/8ball/Desktop/agent_lab`, is a symlink. No alternate
browser-automation path was attempted and no environment configuration was
changed to work around it. This is an open limitation on the record, not a
silently-worked-around gap and not a silently-dropped requirement.

## What this note does not claim

- Not a cross-model (§10/L48) audit verdict — none has run against this
  exact SHA.
- Not exact-SHA browser/live-fire evidence — none exists (see above).
- Not merge clearance — this remains an unmerged, unreleased candidate.
- Not a pass on the local PII audit — that audit could not run at all in
  this container (missing gitignored input file), which is a NO-ASSURANCE
  state, not a pass.

## Addendum, 2026-09-05 — post-commit doc/evidence correction over `89db9a8`

Two documentation findings, both fixed in a follow-up documentation-only
commit; runtime candidate `89db9a84823a917df937d50f2208fbbc0625039f` itself
is unchanged and unamended by either. Full explanatory text: `journal.md`'s
current top entry.

1. `DOCTRINE.md`'s single active `**doctrine version:**` pointer still read
   `v0.87` after the prior integration pass had added v0.88 only to §5.D and
   the version-history footer LIST — fixed with a new current `v0.88`
   pointer paragraph, the old paragraph relabeled `**doctrine version,
   prior:** ... v0.87` with its wording preserved verbatim. No version bump
   to v0.89 for this display correction.
2. The v0.88 evidence paragraph's own test-group labeling was imprecise
   (internally contradictory "identity-change... identity still confirmed
   current" phrasing) — corrected to name three distinct groups precisely:
   unchanged-identity tests prove successful fallback, confirmed-change
   tests prove `stale`/no download, unreadable-identity tests prove
   `failed`/no download. v0.87's own substantive ruling is unchanged.

**Late-arriving supplementary PII evidence**, from the controller, after
this note's original precommit text above was already written:

- The original pricing checkout (`/Users/8ball/01_ACTIVE/dev/8ball`) DOES
  have its own gitignored `audits/local_personal_data.txt`; this Pair
  worktree does not. Presence was checked, not pattern contents.
- The controller ran the SAME tracked `audits/run_local_audit.sh` scan logic
  entirely in memory against this worktree, overriding only `REPO_ROOT` (to
  this worktree) and `PATTERN_FILE` (to the pricing checkout's existing
  pattern file) via `sed` piped to `bash`. No script or pattern file was
  written or copied; the original pricing checkout stayed read-only;
  patterns and matched content were withheld from this session's own
  output.
- At exact committed `89db9a8`: **12 non-comment configured patterns, 907
  files, clean, exit 0.** This is **supplementary, configured-pattern
  assurance only** — it does not supersede, and must not be conflated with,
  the DEFAULT unmodified `run_local_audit.sh` invocation against this
  worktree, which still exits 1 / "does not exist" / **NO ASSURANCE** exactly
  as stated in the "Final test/audit counts" table above, nor with the
  product audit's own local-PII check, which still SKIPs by default. No
  universal PII absence and no browser clearance is claimed by either the
  precommit record or this supplementary result.
- The controller's own **clean-tree** product audit at exact `89db9a8` reads
  **13 pass / 0 fail / 0 warn / 1 skip** — this supersedes ONLY the
  precommit **dirty-tree** count of 12/0/1/1 recorded in the table above (the
  one warn cleared once the tree was clean at commit time). The 121-test
  auditor assurance suite, already reported passing above, was not rerun for
  this correction and is unchanged.
- Browser evidence is still unavailable for this candidate — the
  browser-automation tool still fails before initialization on the
  `/Users/8ball/Desktop/agent_lab` symlinked writable root; no alternate
  path attempted, no environment configuration changed.
