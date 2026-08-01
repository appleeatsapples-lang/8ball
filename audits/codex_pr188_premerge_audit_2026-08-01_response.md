# Codex PR #188 pre-merge audit response — calc v4 master preservation

**Audit target:** `3165a3c703482d744df2224d4014693e423cf3ab`
**Base:** `2cdaa3c9b8484b591340ec6d9556b130ad7c9127` (`origin/main`)
**Branch:** `claude/master-number-preservation`
**PR:** #188
**Audit date:** 2026-08-01
**Verdict:** **SAFE TO MERGE**
**Findings:** 0 P0 · 0 P1 · 0 P2 · 0 P3

This is the fresh PR-numbered independent read required by DOCTRINE §10/L48. It reads the
complete PR diff at the exact head above, including the final-worktree P2 closures in
`484db7c` and the repository-visibility truth correction in `3165a3c`. The earlier audits
remain valid lineage: `d03a768` returned DO NOT MERGE, `7fae4ea` returned MERGE WITH
FOLLOW-UP, and the final-worktree audit found three additional P2s. None of those earlier
responses is being renamed, copied, or recycled to satisfy the filename gate.

## Findings

No actionable finding survived the fresh read.

## Prior findings — verified closed

### Original calc-v4 audit

- **Master-mode disclosure reaches the reader.** The public engine returns the declared
  bridge, `ui/public.js` renders it on the host, and `ui/sheet.js` renders it on both dyad
  sheets. Sealed, non-master, clear, and dyad-close paths scrub the note.
- **Facet-key state is current.** Active persistence uses `eight_ball_facet_index_v3`.
  `_v1` and `_v2` survive only as retired names for one-shot clearing; neither is read as
  current position state.
- **The meaning registry carries rather than re-authors.** `content/meanings.v3.js`
  structurally spreads the nine v2 entries and adds only `11 / 22 / 33`; tests pin the
  carried entries byte-for-byte and pin the exact three-entry difference.
- **The stale active test count is closed.** Current doctrine records 1,826 tests, with the
  earlier 1,814/1,824 states retained only where they describe the heads that actually ran
  them.

### Final-worktree audit

- **Active-version truth is closed.** Current state names calc v4, meanings/concordance v3,
  and active dyad v2 while distinguishing the immutable v1 tables it carries.
- **Both production wiring seams have behavior coverage.** The host test omits
  `refs.bridge` and drives the real create/append/fill/clear fallback. The dyad test drives
  `initDyadUI` with the same `publicReadFor` hook shipped by `index.html`, verifies both
  bridge notes, and verifies close-time clearing.
- **Storefront truth is separated from entitlement truth.** The runtime remains fail-closed:
  only the published $3 t3 offer is wired, the comparative and public listings are recorded
  as existing but unpublished, and `T5_PRODUCT_URL` remains empty. No account, listing,
  publication, offer, or fulfillment setting changed.

## Independent invariant review

- **Calculation:** all six numerology coordinates use the master-preserving terminal domain
  `1..9, 11, 22, 33`; reduction stops immediately at `11`, `22`, or `33`, while values such
  as `44` continue to `8`. Empty contributing letter classes remain unresolved rather than
  becoming `0`.
- **Bracket and facet:** `resolveBracket` and `anchorFacetIndex` accept the same twelve-value
  domain, map masters to `high` / the third position, and reject out-of-domain integers.
- **Meanings and Concordance:** every terminal value has an active meaning; the three master
  bodies are reused from immutable v1. Concordance restores exactly the three named master
  reduction links and leaves every other distinct number pair unfiled.
- **Dyad:** input life paths are validated before summing; `reduceTerminal` preserves masters;
  `combinedPathClause` keys on `sum !== combined`, so a direct master stop never falsely says
  that a number reduced to itself. Master combined paths resolve through meanings v3.
- **Public mode bridge:** a birthday retains its displayed master value and reaches the finite
  nine-mode table through the declared bridge. The bridge is disclosed in the returned object
  and on every production render surface.
- **Persistence:** stored profiles contain reconstruction inputs, not derived outputs, so calc
  v4 needs no profile migration. Only the facet-position key is versioned; both retired keys
  are cleared fail-closed.
- **Visibility correction:** GitHub reports the repository public. `8BALL.md` now states that
  current fact directly; DOCTRINE preserves the v0.2.0 private wording as L17 lineage and adds
  dated supersessions. The separate authoring source remains private, and the tracked-content
  PII boundary is unchanged. No repository visibility setting was mutated.

## Verification

- GitHub Actions at `3165a3c`: all **51 files / 1,826 tests pass**. The product-audit job and
  deploy preview pass. The two red checks have one shared cause only: this PR-numbered L48
  response was not yet present.
- Fresh local Vitest at the audited head: **51 files / 1,826 tests pass**.
- Fresh product-auditor run with CI-equivalent transient-cache access: **PASS — 13 pass / 0
  fail / 1 advisory warning / 0 skip**. The warning is the two known protected untracked
  directories, `_to_delete/` and `audits/automated/`.
- Local PII audit: **clean, 862 files scanned**.
- `git diff --check origin/main...HEAD` and worktree `git diff --check`: pass.
- `index.html`: **1,497 lines**, unchanged by the final closure and visibility corrections.
- The shipped v1/v2 registries, deck, dependency manifests, Netlify configuration, and
  protected paths are unchanged.
- Distribution operations are outside this PR. As a separate current-state check,
  `~/8ball/reach/drift_check.py` reports CLEAN: four jobs loaded, no PENDING claims, no
  PostPeer slot collision, and 621 queued codes pairwise disjoint.

## Filing delta and authority boundary

The unavoidable filing delta after the audited head is this newly added response plus a new
top journal entry recording its result. Both are documentation-only; neither changes product
behavior, governance rules, content, calculation, persistence, network behavior, storefront
state, or deployment state.

L48 is cleared for the audited implementation. This verdict does **not** merge the PR and does
not authorize a merge, deploy, publication, account change, offer change, or spend. Those
remain operator actions. The PR remains draft until the operator separately changes that state.
