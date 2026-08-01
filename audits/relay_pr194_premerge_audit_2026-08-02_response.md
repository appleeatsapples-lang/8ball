# Cross-model pre-merge audit — PR #194

**PR:** #194 — fix(audits): redact absolute filesystem paths from product-audit reports
**Branch:** `claude/audit-report-path-redaction` (forked from `origin/main`)
**Date:** 2026-08-02
**Auditor:** `relay --base origin/main` fan-out (codex + grok + claude, reconciled by claude). Gemini errored on auth (rc=41, not counted).

## Verdict

**MERGE WITH FIXES → fix landed, now SAFE TO MERGE** (pending operator's own read of this artifact).

## What was reviewed

`audits/project_audit.py` (`redaction_map`, `redact_paths`, the serialization
call site) and `audits/test_project_audit.py` (the `PathRedaction*` test
classes and the launcher-position fix), diffed against `origin/main`. This
covers both commits on the branch at review time: `e81dcac` (original
redaction) and `072f0b4` (P1 key-redaction + P2 launcher-position fixes from
this repo's own automated CC audit).

## Findings

### Consensus (≥2 reviewers, independently verified against the diff / a live repro)

1. **HIGH — the new key-collision test never exercised the collision
   branch.** `test_key_redaction_collision_keeps_both_entries` appended two
   full-path needles to `redaction_map()`'s own output, but that output
   already contains the bare `home` needle *ahead* of them in the list.
   Since `redact_paths` applies needles in list order via sequential
   `.replace()`, the bare needle disambiguated the two keys
   (`<home>/a/secret1` vs `<home>/b/secret2`) before either appended needle
   could ever fire, so `len(out) == 2` passed whether or not the
   disambiguation branch existed. Caught by codex and grok; confirmed by a
   live repro (see Disposition).
2. **MEDIUM — non-`str` leaves bypass redaction, and `json.dumps(...,
   default=str)` re-leaks after the fact.** `redact_paths` only handles
   `str`/`list`/`tuple`/`dict`; a `pathlib.Path` value falls through
   unchanged, and `default=str` stringifies it *after* redaction already
   ran. Latent only — no current check stores a bare `Path` — but it
   contradicts the module's own "a check author cannot leak a path even by
   accident" framing. Flagged by claude and grok.

### Unique findings (adjudicated by the reconciler, not all blocking)

- **codex — temp-dir paths (`/var/folders/.../vitest.json`) unredacted in
  real reports.** Confirmed via gitignored `audits/automated/*.json`.
  `redaction_map()` only covers `product_root` and `home`, not
  `tempfile.gettempdir()`. Real gap vs. the stated "no absolute path"
  guarantee, but outside this PR's stated threat model (operator's home
  directory / account name specifically). Rated Medium, non-blocking —
  tracked as a fast-follow.
- **codex — substring corruption of prefix-neighbors**
  (`/Users/8ball2/file` → `<home>2/file`). Reproduced live. Real but
  cosmetic (corrupts unrelated evidence text, doesn't leak anything new).
  Low, non-blocking.
- **grok — `test_guard_can_fail` is environment-fragile if `REPO_ROOT` isn't
  under `$HOME`.** Speculative for this repo's actual CI (GitHub Actions
  checkout puts the repo under the runner's home). Noise, not actioned.
- **grok — dropped `returncode`/stderr in the new e2e subprocess call.**
  Matches a pre-existing pattern elsewhere in the same file. Not a new risk
  this diff introduces. Noise, not actioned.
- **claude — `check_local_pii` can embed real PII (not just paths) into
  `output` on failure.** Real but pre-existing behavior, untouched by this
  diff. Valid follow-up ticket, not a blocker here.

## Disposition

The one true blocker (vacuous collision test) was fixed in commit
`fd79231`: the test now uses only the two forcing pairs (both mapping to
`HOME_PLACEHOLDER`), with no broader `home` needle ahead of them in the
list. Verified by confirming the test **fails** when the disambiguation
branch is temporarily deleted from `redact_paths` and **passes** with it
restored — so it now genuinely exercises the code path it claims to pin.

Full assurance suite re-verified green after the fix: **102/102 tests**
(`python3 -m unittest audits.test_project_audit`). Real audit run:
**13/14 PASS**, no blocking failures, one pre-existing non-blocking warn.
No `$HOME` path present in the emitted JSON/markdown report. PII scan
clean (837 files).

## Residual / non-blocking

- Temp-dir path leakage (codex finding, Medium) and non-`str`/`Path` leaf
  bypass (consensus finding #2, Medium) are real gaps against the module's
  broader "any absolute path" framing but outside this PR's specific
  scope (home-directory → account-name exposure, the documented threat
  model). Left as fast-follow work, not fixed here.
- Substring corruption of prefix-neighbor paths (codex, Low) — cosmetic,
  not a leak. Not fixed here.
- `check_local_pii` output can carry non-path PII (claude, pre-existing,
  out of scope for this diff). Not fixed here.

## Full reconciliation output

`~/ai-relay/runs/20260802-012941-8ball/RECONCILIATION.md` (operator-local,
off-repo — this file is the in-repo summary the L48 gate requires).

## Recommendation

Merge on CI green after this artifact lands on the PR head.
