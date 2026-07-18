# Agent role: auditor — Codex

> One of five agent roles per DOCTRINE §10 v0.29 extension: orchestrator (chat-Claude), implementer (CC), **auditor (Codex)**, verifier (CiC against deployed product), inspector (CiC + adjacents against operator infrastructure), with controller (operator) as the always-on final approver.

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

An audit brief at `~/8ball/audits/codex_<slug>_<date>.md`, anchored with `=== PROMPT START ===` / `=== PROMPT END ===` markers.

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
3. Privacy (§5) — localStorage allow-list, no unpermitted network calls (only §5-permitted same-origin lazy loads + §5.B user-initiated feedback POST / Gumroad Buy Link redirect), no third-party fonts/scripts
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

1. **Save the response** to `~/8ball/audits/codex_<slug>_response.md` immediately, full text, no editing.
2. **Categorize disposition:** P0 → block merge; P1 → fix-before-merge (absorb in same cycle or as follow-up minor); P2 → file to follow-up minor (post-ship if cycle is closing); P3 → backlog (file to `~/8ball/sessions/v0X_scope_notes.md`).
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

### 6. Corpus drift-sweep

Cross-document doctrine-vs-shipped audit across the full tracked-content surface. Used when state docs have accumulated enough drift that per-cycle audits are no longer catching it — the rewrite-makes-adjacent-text-salient mechanism means each surface-touch cycle leaves new staleness in adjacent paragraphs that wasn't visible at the time of the touch. Drift-sweep is the periodic explicit pass that catches what per-cycle audits structurally miss.

**When to invoke:** when corpus age + cumulative shipped surface change suggests state docs lag shipped reality. Three firings to date — inaugural sweep at chat-8 (28 drifts surfaced across 12 files / 1624 lines), tier-1 cleanup re-audit at chat-9 (10/10 PASS + 2 new drifts), tier-2 cleanup re-audit at chat-10 (19/19 PASS + 3 new drifts). A drift-sweep cycle generally produces a tier-split corpus repair (large-N drift corpora split by coherence — e.g. tier-1 honesty-critical P0+P1 / tier-2 structural cleanup) shipped across consecutive PRs.

**Brief shape (drift-sweep audit):**

```
=== EXAMPLE BRIEF START ===

# Role
Adversarial corpus auditor for 8ball. Read every tracked content file inlined below.
Surface every drift hook you can defend between doctrine + shipped reality.

# Inputs
- Corpus (full contents inlined via `git show <branch>:<file>` per file):
  <file 1>
  <file 2>
  ...

# Audit dimensions
1. Doctrine-vs-doctrine internal consistency (§-references resolve, version footers consistent)
2. Doctrine-vs-shipped (claims about code state match `core/`, `ui/`, `tests/` reality)
3. State-doc-vs-doctrine (8BALL.md, README.md, root AGENTS.md + CLAUDE.md, agents/*.md alignment with DOCTRINE.md)
4. Cross-file vocabulary consistency (shipped path names, file counts, version strings, test counts)
5. Stale-amendment residue (deprecated rules + retired vocabularies that linger in adjacent text)

# Verdict format

Procedure 6 operates in two modes. The verdict shape differs.

**Mode A — Initial drift-finding sweep** (corpus is stale; output is the drift list):

For each drift:
- **Drift N — <short name>**
- **File:** <path>
- **Location:** <section ref + line range>
- **Severity:** P0 / P1 / P2 / P3
- **Quoted stale text:** "<exact text>"
- **Current reality:** <what shipped reality says>
- **Recommendation:** <fix>

No PASS slot in Mode A — corpus is stale by assumption; nothing is being passed.

**Mode B — Re-audit on closed drifts** (corpus is the re-fixed file + the implementer's claimed-closed drift list; output verifies or re-opens):

For each claimed-closed drift:
- **Drift N — <short name>**
- **Severity:** PASS / P0 / P1 / P2 / P3
- **Evidence:** <file:line refs or quoted text>
- **Reasoning:** <why this severity>
- **Recommendation:** <fix, or "verified closed" on PASS>

PASS is the load-bearing verdict shape in Mode B. New drifts surfaced beyond the claimed-closed scope (rewrite-makes-adjacent-text-salient mechanism) are flagged separately as `New Drift A/B/C…` and carry full Mode A verdict shape.

Closing section: cross-file consistency findings clustering the drifts into structural categories.

# Hard stops
- Don't suggest §-renumbering as a fix (compounds drift).
- Don't recommend feature additions or new doctrine clauses (out of scope for drift catch).
- Don't soften severity to be polite — adversarial is the value.
- Re-audit cycles surface 2–3 new drifts per pass via the rewrite-makes-adjacent-text-salient mechanism. This is expected; pre-budget a post-audit absorb commit in cycle scope rather than treating new drifts as out-of-scope.

=== EXAMPLE BRIEF END ===
```

**How orchestrator consumes a drift-sweep return:**

1. Save the response to `~/8ball/audits/codex_drift_sweep_<slug>_response.md` immediately, full text.
2. If N > 10 drifts surface, split the corpus by coherence (e.g. tier-1 honesty-critical P0+P1 closing first, tier-2 structural cleanup shipping second). Single-tier-large-N briefs lose implementer focus.
3. Each tier ships as its own PR, with its own re-audit. Re-audit briefs are constructed via `git show <branch>:<file>` of each post-fix file inlined — corpus paste, not diff paste.
4. **Pre-budget the absorb commit.** Three firings, three N>0 results on new drifts surfaced post-fix. The rewrite-makes-adjacent-text-salient mechanism is a structural feature of the procedure. Scope the cycle to include either an in-PR absorb (if PR is still open per chat-9 pattern via `39596f7`) or a post-merge absorb on main (if PR has already been merged per chat-10 pattern via `4bb3f77`). Both are valid; the choice depends on merge timing, not on drift severity.

**Boundaries:**

- Drift-sweep is read-only verdict; implementer writes the fixes per Procedure 1 / 2 / 3 routing.
- Drift-sweep is NOT a doctrine amendment surface. If the audit thinks doctrine itself is wrong, the verdict raises it — the orchestrator surfaces to controller for separate doctrine cycle.
- Drift-sweep does NOT replace pre-merge audits at PR open. Per-cycle audits catch in-cycle drift; drift-sweep catches accumulated drift. Both fire.

**Discipline footnotes:**

- Three firings, zero Codex-side friction. The lane works when (a) the brief is self-contained, (b) the corpus is bounded (4–12 files, <2500 lines), (c) the per-drift verdict format is pre-specified with PASS + severity ladder.
- L48 firing shape (controller-merge-without-audit-signal) is more likely in drift-sweep cycles because the cycle's primary deliverable is doctrine-shaped, not code-shaped — CI green looks like the whole gate, but the audit-cleared signal is the actual gate. Pre-merge audit response must land in chat before merge clears.

## Audit history (this file)

- 2026-05-12 — File created during the agents/ codification cycle (DOCTRINE v0.23 → v0.24). Codifies the audit-routing patterns from v0.1.0 onward (8 audit cycles to date, including the v0.3.0 step-6 mid-cycle audit and v0.3.0 full-PR post-merge audit absorbed as v0.3.0.1).
