# Agent role: auditor — Codex

> One of four agent roles per DOCTRINE §10 v0.24 extension: orchestrator (chat-Claude), implementer (CC), **auditor (Codex)**, verifier (CiC), with controller (operator) as the always-on final approver.

## What this lane does

Adversarial review against doctrine, content rules, release-gate compliance, and shipped-vs-claimed parity. Auditor is the second-eyes lane that closes the author-judge problem: the orchestrator drafted the brief and shipped the doctrine; the auditor reads both as an external critic with no incentive to confirm the orchestrator's framing.

Auditor returns categorized verdicts. It does not implement, does not merge, does not negotiate dispositions — those are orchestrator + controller responsibilities. Auditor's authority is in the verdict shape and the precision of the hooks it surfaces.

## When to invoke

**Required:**
- Pre-merge on any DOCTRINE.md change (§10 doctrine-amendments rule).
- Pre-merge on any change shipping new content (e.g. `content/cards.v1.full.js` updates).
- Pre-merge on any release-gate change (`audits/RELEASE_CHECKLIST.md`, `.github/workflows/ci.yml` gates).
- Full-PR audit at PR open for any cycle with ≥5 commits or any doctrine touch.

**Recommended:**
- Mid-cycle audit at natural seams (per L46 — between substantive commits where a chat boundary happens to fall, audit cheaply absorbs structural drift earlier than PR-open). v0.3.0 step-6-to-7 audit is the canonical instance: 8 PASS / 2 P1 / 0 P0, both P1s absorbed in step 7.

**NOT required:**
- Hygiene-only commits (post-ship state fills, §11 punch-list cleanup, journal entries without doctrine touch).
- Single-file documentation tweaks that don't touch DOCTRINE.md.

## What the orchestrator prepares

An audit brief at `~/Desktop/8ball/audits/codex_<slug>_<date>.md`, anchored with `=== PROMPT START ===` / `=== PROMPT END ===` markers.

Audit brief structure (per `codex_v030_full_pr_audit.md` and predecessors):

```
=== PROMPT START ===

# Role
Adversarial pre-merge auditor for 8ball. Read the diff + doctrine context.
Surface every hook you can defend. Categorize each: PASS / P0 / P1 / P2 / P3.

# Inputs
- Diff: <inline diff, or PR link if Codex can fetch>
- Doctrine state: <current version + relevant § quoted inline>
- Brief: <the brief the implementer worked against, quoted inline>
- Test surface: <pre + post counts, named files>

# Audit dimensions (hooks)
1. Doctrine drift — does shipped code match what §X says?
2. Content rules (§4) — voice register, banned patterns, cultural-symbol respect
3. Privacy (§5) — localStorage allow-list, no network calls, no third-party fonts/scripts
4. PII (§11) — operator name, SIRR refs, labeled-DOB shapes
5. SIRR boundary (§9) — no cross-references in tracked content
6. Test surface — claimed delta matches actual count; new tests assert what the brief required
7. Doctrine version footer parity — declared version matches code reality
8. Single-file ceiling (§6) — index.html ≤1500, ui/*.js split-pattern shape
9. Release-gate alignment (§7) — CI stages match doctrine
10. Cross-file invariants — anything that should hold across multiple files

# Verdict format
For each hook:
- **Hook N — <name>**
- **Severity:** PASS / P3 / P2 / P1 / P0
- **Evidence:** <quoted line, file:line refs>
- **Reasoning:** <why it's this severity>
- **Recommendation:** <fix, defer, or accept>

# Hard stops
- Don't suggest §-renumbering as a fix (compounds drift).
- Don't recommend feature additions (out of scope for audit).
- Don't soften severity to be polite — adversarial is the value.

=== PROMPT END ===
```

## How orchestrator consumes the auditor's return

1. **Save the response** to `~/Desktop/8ball/audits/codex_<slug>_response.md` immediately, full text, no editing.
2. **Categorize disposition:** P0 → block merge; P1 → fix-before-merge (absorb in same cycle or as follow-up minor); P2 → file to follow-up minor (post-ship if cycle is closing); P3 → backlog (file to `~/Desktop/8ball/sessions/v0X_scope_notes.md`).
3. **Each P1+ hook gets a named disposition** in the PR description or follow-up commit. "Hook N P1 — <name> — absorbed at step N+1" or "Hook N P1 — <name> — deferred to v0.X.Y per <reason>".
4. **Disclosed deviations** from the audit brief (auditor surfaces them) get journal-entry mentions.
5. **Sequencing rule (L48):** Merge does NOT fire until audit response has been read and dispositioned. The orchestrator opens the PR, prepares the audit brief, surfaces to controller for paste-relay, and waits for the response before clearing controller to merge. Five-minute CI-green-to-merge windows are the L48 failure shape; explicit audit-cleared signal is the gate.

## Boundaries (auditor never does these)

- **No implementation.** Codex returns verdicts, not patches. If a fix is obvious, the verdict notes it; the implementer writes it.
- **No merge.** Even on a PASS-clean audit, merge is controller-action.
- **No solo doctrine reading.** Audit is against the doctrine in the brief. If the audit thinks doctrine itself is wrong, the verdict raises it as a hook — the orchestrator surfaces to controller for doctrine amendment cycle.
- **No filesystem access.** Codex is paste-relay only (Mac desktop app, no `~/dev/8ball/` read). All inputs come from the audit brief; the brief must be self-contained.

## Procedures

### 1. Pre-merge audit at PR open

PR opened by orchestrator. Audit brief drafted by orchestrator. Brief pbcopy'd, paste-relayed by controller into Codex app. Response returned in Codex. Controller pastes response back into chat. Orchestrator saves response + dispositions. Each hook gets a named action. Merge clears only after dispositions are committed (in-cycle or as follow-up minor).

### 2. Mid-cycle audit at natural seams (L46)

Between substantive commits where a chat boundary happens to fall. Audit absorbs structural drift earlier than PR-open. v0.3.0 step-6-to-step-7 is the canonical case: the step-6 commit landed the markup surface; the step-7 commit absorbed the audit's two P1s. Earlier surfacing = cheaper absorption. Use when the cycle is long (>5 steps) and the natural chat boundary creates a clean checkpoint.

### 3. Full-PR audit at PR open

Standard pre-merge form. Audit reads the cumulative diff against doctrine state. Used at the end of multi-step cycles. v0.3.0's 4 PASS / 2 P1 / 4 P2 / 0 P0 / 0 FAIL is the recent shape.

### 4. Doctrine-only audit (no code)

When a cycle's only deliverable is a DOCTRINE.md amendment (e.g. consolidation passes, Friday rule-kill reviews, this cycle's §10 amendment), the audit brief skips the diff-vs-implementation hooks and focuses on: internal consistency, §-renumbering avoidance, lineage-preserving changes, footer-version accuracy, no-orphan-amendments (every amendment names what it retires).

### 5. Disposition shapes that work

- **Absorb in-cycle:** P1 named in PR description; next commit closes it; PR re-audited only if scope expanded.
- **Follow-up minor:** P1 ships as v0.X.Y patch (e.g. v0.3.0.1 cherry-picking absorb commit `b25321e`).
- **Defer:** P2/P3 filed to scope-notes; visible in next cycle's brief.
- **Reject:** Orchestrator + controller disagree with the auditor's framing; documented in journal with reasoning. Rare; preserves the audit-trail when it happens.

## Audit history (this file)

- 2026-05-12 — File created during the agents/ codification cycle (DOCTRINE v0.23 → v0.24). Codifies the audit-routing patterns from v0.1.0 onward (8 audit cycles to date, including the v0.3.0 step-6 mid-cycle audit and v0.3.0 full-PR post-merge audit absorbed as v0.3.0.1).
