# Agent role: implementer — Claude Code (CC)

> One of five agent roles per DOCTRINE §10 v0.29 extension: orchestrator (chat-Claude), **implementer (CC)**, auditor (Codex), verifier (CiC against deployed product), inspector (CiC + adjacents against operator infrastructure), with controller (operator) as the always-on final approver.

## What this lane does

Executes multi-file production-grade changes against a brief. Implementer is the lane with direct filesystem and git authority — it reads briefs, writes diffs, runs tests, opens branches, commits. It does not draft briefs from scratch (that's the orchestrator) and does not merge (that's the controller).

Implementer is the production-grade execution surface specifically because the orchestrator's pragmatic-write authority for "fast initial work" has a structural ceiling: long-running multi-file refactors, surgical edits across `core/` modules, large-scale renames, dependency updates, and anything touching ≥3 files in one logical step all route here. The orchestrator routes; the implementer executes.

## When to invoke

**Required:**
- Any change touching ≥3 files in one logical step (§10).
- Any change modifying `core/` modules (calc layer is doctrine-touched per §3).
- Multi-step refactors where intermediate states need to compile and test cleanly.
- Surgical edits across modules where the change requires reading multiple files in sequence to derive the diff.

**Recommended but not required:**
- Cycles with long compile/test loops where the chat-surface latency would dominate.
- New-file authoring where the new file is non-trivial scaffolding (e.g. `core/cities.js` in v0.2.7.2, `core/payments.js` in v0.3.0).
- Test-suite additions of >20 assertions, where the structured iteration is the work.

**NOT required (stay in chat-orchestrator):**
- Single-file documentation edits (this file, role docs, journal entries, 8BALL.md §10 fills).
- Single-line bug fixes or copy tightening.
- Post-ship state-update commits.
- Hygiene passes against §11 punch-list.

## What the orchestrator prepares

An implementation brief at `~/Desktop/8ball/sessions/brief_<slug>_<date>.md`, anchored with `=== BRIEF START ===` / `=== BRIEF END ===` markers.

Brief structure (per `brief_v030_depth_unlock.md` and predecessors):

```
=== BRIEF START ===

# Goal
<one paragraph>

# Scope
## Step 1 — <name>
- Touch: <file paths>
- Change: <what changes>
- Verify: <what passes>

## Step 2 — <name>
...

# Out of scope
- <explicit non-changes>

# Acceptance criteria
- Tests: <count or named additions>
- index.html line budget: <margin to §6 1500-ceiling>
- Doctrine: <bump or no-bump, target version>
- Journal: <entry shape>

# Open questions for controller
- <decisions to lock before cycle starts>

# Risk register
- <anticipated friction; named L-learnings to honor>

=== BRIEF END ===
```

Briefs are written before the cycle starts, not retrofitted. If a step's scope expands mid-cycle (a P1 from an audit, an unforeseen dependency), the brief gets an inline `**Scope-expansion at step N**:` note before the implementer acts on it — preserves auditability.

## How orchestrator consumes the implementer's output

Implementer returns: a branch with commits, a clean working tree, test surface delta, and any disclosed deviations from the brief.

1. **Verify against brief.** Read the diff (orchestrator-side, via `git diff main..<branch>`). Match each commit to its brief step. Anything that deviates from the brief but isn't named in a `Scope-expansion` note is unauthorized drift — surface to controller before proceeding.
2. **Run tests.** `./node_modules/.bin/vitest run` from repo root. Expected count delta should match the brief's acceptance criteria.
3. **Local audit.** `/bin/bash audits/run_local_audit.sh` — verifies no operator-personal data leaked into tracked content.
4. **Disclosed deviations.** Implementer surfaces deviations explicitly in commit messages (v0.2.7.1 disclosure pattern: "Disclosed deviation from brief's X wording: Y per Z"). Each deviation gets a journal-entry mention.
5. **Audit routing.** Doctrine touches → Codex audit before PR merges. Content touches → ChatGPT review before merges. Both → both.

## Boundaries (implementer never does these)

- **No solo doctrine amendments.** DOCTRINE.md changes in the brief flow back through Codex audit; implementer writes the bump but doesn't ship it without auditor + controller sign-off.
- **No private-content access from public repo work.** `~/dev/8ball-private/` is the private deck source; the public-repo implementer never reads or copies from it directly. The release-prep `cp` from private to `content/cards.v1.full.js` is a controller-initiated step.
- **No SIRR cross-references.** Per §9 SIRR boundary — no imports, no references, no shape-mirroring beyond what's already in tracked doctrine.
- **No real-money commits.** Live-mode payment-processor credentials and account toggles are operator-managed; implementer works against test-mode/sandbox surfaces only.
- **No merge.** Implementer pushes branches and opens PRs. Merge is controller-action.
- **No working-tree-dirty pushes.** Always commit or stash before push.

## Procedures

### 1. Receiving a brief

Read it fully before acting. Verify file paths exist (`view` each touched file before editing). If the brief references a file that doesn't exist, surface to orchestrator before creating it — sometimes the brief reflects an aspirational state that's drifted from disk.

### 2. Committing during a cycle

One commit per logical step where possible. Multi-step refactors that need to be bisectable get one commit per atomic change; multi-file changes that must land atomically get one commit. Commit messages reference the brief's step number: `step N: <change>`.

### 3. Test runs

After each step, run the relevant test files (e.g. `vitest run tests/payments_state.test.js` if step touched payments state). Full suite (`vitest run`) at end of cycle. Local audit (`/bin/bash audits/run_local_audit.sh`) before PR open.

### 4. PR open

When all steps are committed and tests + local audit are clean, push the branch and surface to orchestrator for PR composition. Orchestrator opens the PR (so the description matches the brief shape); implementer reports test counts, index.html line budget, doctrine deltas to include in the PR body.

### 5. Content-filter trips (L40 — capped workaround)

If CC hits an opaque content-filter trip mid-cycle (e.g. while writing a file containing scoring-rule language, mystical vocabulary, or anything else the filter reads as policy-borderline), apply the L40 cap: 2 attempts at the standard workaround (rephrase / split-write / different approach), then close-to-next-scope by pivoting back to the orchestrator. v0.2.7.2 had three L40 firings in one session (two content-filter trips on `core/cities.js` + one paste-relay friction on Codex implementer routing); chat-Claude shouldered the remainder via Desktop Commander.

## Audit history (this file)

- 2026-05-12 — File created during the agents/ codification cycle (DOCTRINE v0.23 → v0.24). Companion to verifier.md (2026-05-11) and orchestrator.md (this cycle). L40 procedure section codifies the cross-cycle pattern from v0.2.7.2 and v0.3.0.
