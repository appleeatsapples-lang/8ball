# PR #112 pre-merge cross-model audit — response (L48 artifact)

Dated 2026-07-20. Scope: `tests/content_shape.test.js` PR3 extension
(+28 grammar pins at audit head) + journal entry. Executes the operator's
explicit "implement it 100%" word on the night study's lint spec
(`~/8ball/content_study/lint_spec_proposal.md`); PR1/PR2 precedent
#103/#107.

**Method.** Fresh non-author Codex session via relay (codex CLI, house
config) on the PR head `c9db03f` in a dedicated detached worktree, run
`20260720-214256-relay-pr112`; Claude reconciliation in-run. The reviewer
independently re-derived every pinned number against the tree (opener
tables, lexical counts, repeats budget, habit bounds), reproduced the
suite (1345/1345 at audit head), and confirmed commit scope by
blob-identity: `content/`, `core/`, `ui/`, `tests/fixtures.json`,
`DOCTRINE.md`, `index.html` all untouched.

**Verdicts.** Codex: **MERGE WITH FIXES — 4 findings** (no P0/P1-class;
all four are matcher-precision weaknesses in the NEW guard tests, none a
defect in the commit or the shipped deck). Reconciler: **SAFE TO MERGE**
(downgrade on the grounds that every finding is future-proofing of the
guards, not current risk), with the four recipes recommended as fast
follow-up. Disposition taken: **all four absorbed in-branch at
`89eaaef`** rather than deferred — the guards should enforce what they
claim from day one.

## Findings and absorb state

1. **Identity/`sun` name checks split on whitespace only** (a
   hypothetical `"the aries, keeper"` would false-green). REAL —
   ABSORBED: per-token punctuation normalization
   (`.replace(/[^a-z]/g, '')`) on both checks.
2. **Five formula matchers unbounded** (`renegotiates` would satisfy
   `negotiates`; `presents` → `resents`; `redefends` → `defends`;
   `builds comforting` → `builds comfort` prefix; `reprosecutes` →
   `prosecutes`). REAL — ABSORBED: word-boundary anchoring on all five
   (tiger, horse, dog, goat, pig matchers).
3. **"Full lint-spec coverage" comment overstated** — the one-sentence
   note discipline and the velvet armed-softness license were
   unasserted (reviewer could not see the spec to confirm; rated
   plausible). CONFIRMED against the spec by the implementer lane —
   ABSORBED by strengthening the tests rather than softening the
   comment: new sentence-discipline block (every habit + note = exactly
   one terminal period, no `;?!`; the colon-list syntax licensed
   exactly once, taurus×dragon high) and the velvet census upgraded
   from count+inversion to the exact enumerated 11-name set.
4. **`scale` pin matched anywhere in the type** (a hypothetical
   `scale model` modifier would false-green a test that claims "anchor
   noun"). REAL (Low) — ABSORBED: the filter now asserts final-token
   position in the right half.

**Adjudicated non-findings:** none claimed; the reviewer's numeric
recomputation corroborated every pin (including the three
derivation-time corrections the PR body disclosed: circuit slot split
across types+name, weather total 13, dog `old` ×5).

## Verification of record

Audit head `c9db03f`: suite 1345/1345 (37 files), reviewer-executed.
Post-absorb `89eaaef`: suite **1347/1347 (37 files)** (+2 absorb
sentinels), local PII audit clean (122 files), `git diff --check`
clean. No new test module — `repo_shape` pins and CLAUDE.md counts
untouched throughout.

**Disposition:** verdict SAFE TO MERGE with all reviewer recipes
absorbed in-branch; no open findings. The merge word is the
controller's.

— filed by the implementer lane per L48 choreography (gate: #98,
branch-agnostic); raw run: `~/ai-relay/runs/20260720-214256-relay-pr112/`
