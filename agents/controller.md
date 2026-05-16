# Agent role: controller — operator

> The always-on layer per DOCTRINE §10 v0.29 extension. Not one of the five agent roles (orchestrator / implementer / auditor / verifier / inspector) — the controller is the human running them.

## What this lane does

Holds taste, final approval, irreversible-action authority, and account/identity boundaries. The controller is the only authority that can: merge a PR, push to main, deploy to production, accept terms of service, make payments, change account settings, share documents, or take any action that crosses the chat boundary into a third-party account or service.

Controller is never asynchronous. There is no scheduled controller-review pass — every cycle's terminal step is controller approval, by definition. The controller is the one running the cycle; the agents propose.

## When to invoke

**Always.** Same as orchestrator — controller is present in every cycle by definition. The question is what action the controller is taking this turn (merging, paste-relaying, approving, redirecting, deferring).

## What the controller does in a typical cycle

| Phase | Controller action |
|---|---|
| Cycle start | States the goal / scope / constraints. Orchestrator drafts the brief; controller approves or adjusts. |
| Implementation | Paste-relays briefs to CC (implementer). Receives CC's diff via the chat surface or git push. |
| Mid-cycle audits (L46) | Paste-relays audit brief to Codex. Pastes response back to chat. Orchestrator dispositions; controller approves disposition. |
| Verification | Paste-relays directive to Claude in Chrome (verifier). Pastes report back. Orchestrator dispositions; controller approves. |
| PR open | Orchestrator opens PR. Controller reviews + paste-relays full-PR audit brief to Codex if applicable. |
| Merge gate | Controller waits for audit-cleared signal from orchestrator before clicking merge. Per L48: explicit clearance, not implicit. |
| Post-merge | Controller confirms Netlify deploy. Orchestrator updates state docs (8BALL.md, journal). |
| Live-fire | Controller runs §13 17-step checklist (or equivalent for the cycle) on prod. Reports outcomes; orchestrator dispositions. |

## What the orchestrator prepares for the controller

Controllers receive: pbcopy'd briefs ready to paste, exact `sed -n '...' | pbcopy` one-liners for re-extraction, opened URLs (`open -a "Google Chrome" "<url>"` already run), and one-line summaries of what to click on the loaded page. The orchestrator never asks the controller to manually copy text from a file or remember a long path.

For high-stakes actions (merges, deploys, payment authorizations), the orchestrator surfaces a one-line confirmation request and waits. Single-token responses (`yes` / `go` / `merge`) execute the named scope without sub-questions per MUHAB.md §2.5.

## How orchestrator consumes controller output

**Single-token authorizations** (`go`, `yes`, `merge`, `donzo`, `continue`) = full execution authority for the named scope. Don't ask sub-questions; just do it.

**Single-letter picks** on A/B/C options = explicit pick. Execute the named branch.

**Terse messages with typos or fragments** = reformulate internally into a fully-specified brief, state interpretation in one line, proceed with the most defensible reading.

**Corrections** = brief acknowledgment, integrate, continue. No apology-spiral.

**"I wait" / "go ahead"** = full execution authority for the named scope; the controller is unblocking the agent to proceed without further checkpoints.

**Reflective-register messages** (multi-clause, line-break-as-period stacks, faith-vocabulary, single-image metaphors) = pause the operational thread; respond in matching register; don't pivot to housekeeping. Per MUHAB.md §8 cross-scope synthesis.

## Boundaries (controller never delegates these)

- **Merge button.** Always controller-clicked. Even on PASS-clean audits.
- **Deploy authorization.** Netlify auto-deploys on push, but payment-processor Live-mode toggles (e.g. Gumroad processor activation) are controller-only.
- **Account creation.** Per MUHAB.md system rules — agents never create accounts on operator's behalf.
- **Payment authorizations.** Test-mode is agent-runnable; Live-mode charges are controller-only. Even a $3 live-fire test charge is controller-initiated.
- **Sharing permissions / ACL changes.** Doc sharing, repo visibility flips (public/private), CI permission changes — all controller.
- **Terms of service / consent acceptance.** Per agent-policy rules — every TOS click is controller.
- **Operator-personal data entry.** Real name, DOB, payment details, ID — controller enters directly, never via agent.
- **Identity verification flows.** Any KYC / ID-upload / banking-detail step is controller, end-to-end.

## Procedures

### 1. Paste-relay (to Codex, CiC, ChatGPT, CC)

Orchestrator produces the brief on disk + pbcopy's it. Controller opens the target app, pastes, returns response to chat. Orchestrator saves response to disk + dispositions.

Friction shape (L40 caveat): if the paste-relay itself fails (target app stuck, response truncated, formatting broken), the controller surfaces the friction back to chat. Orchestrator either retries with reformulated input or pivots the routing per L40's 2-attempt cap. v0.2.7.2 mid-cycle saw L40 fire on Codex implementer routing; the implementer role pivoted back to chat-Claude.

### 2. Merge approval

Controller waits for orchestrator's explicit "ready to merge" signal that includes: CI green status, audit-cleared signal (if applicable), live-fire results (if applicable). Merges via `gh pr merge --squash --delete-branch` from the orchestrator-surfaced command, or via GitHub UI directly. Post-merge: orchestrator handles the state-fill commits (`MERGE_SHA_TBD` fills) direct-to-main per the post-release pattern.

### 3. Live-fire on production

Controller runs the §13 17-step checklist (or release-appropriate equivalent) on the deployed prod site. Reports per-step outcomes back to chat. Orchestrator dispositions findings: clean → close cycle; regressions → triage as P0/P1 follow-up minor.

### 4. End-of-session

When the cycle is closing (or chat context is getting heavy), controller signals via "donzo" / "we're good" / "next chat" etc. Orchestrator writes the handoff file to `~/Desktop/8ball/sessions/handoff_<slug>_<date>.md`, pbcopy's the handoff prompt for the next chat, and confirms what was shipped this session.

### 5. Content-seed routing (added chat-15)

For content-surface seeding actions — algorithm lane tunes (YouTube, Spotify, TikTok), subscription bulk-imports, follow-list pivots (X / Twitter, LinkedIn), RSS feed seeds, Substack discovery, podcast-app subscription seeds, news-source seeds — route the candidate seed list through the orchestrator for a register-alignment check against `~/MUHAB.md §9` + recent Diamond Compression artifacts before executing. Controller-direct seeding without an orchestrator pass defaults to mainstream-skewed defaults regardless of source platform; the orchestrator pass is the corrective layer. The diagnostic pass is `orchestrator.md` Procedure 6 (register-alignment diagnostic for content seeds); the directive that executes the realignment is drafted by the orchestrator and goes through the verifier per the upstream-diagnostic gate codified in `verifier.md`'s CiC directive-template clauses (Clause 7 of the chat-15 L-mitigation bundle).

Reasoning: chat-14 L-candidate `controller-content-seed-defaults-mainstream` (1 sighting at chat-14, YouTube mental-performance lane seeded across 4–5 Huberman / Daily Stoic / Big Think / Aperture watches; orchestrator caught the 40% Huberman weight + the practice-prescriptive / cinematic-essay tier mismatch against operator's documented cross-domain primary-source register; realignment directive drafted). Sibling-shape of L48 (controller-merge-without-audit-signal): both are "controller acts on an instinct that bypasses the orchestrator diagnostic pass that would have caught the gap." Mitigation generalizes: same shape applies anywhere controller seeds a new content surface.

## Audit history (this file)

- 2026-05-12 — File created during the agents/ codification cycle (DOCTRINE v0.23 → v0.24). Codifies the controller role explicitly so the 4-agent system has its boundary surface named; the controller is not an agent but the system can't be described without it.
- 2026-05-13 — chat-15 L-mitigation cycle (c13-c14-c15 bundle). Added Procedure 5 (Content-seed routing) per chat-14 L-candidate `controller-content-seed-defaults-mainstream` (1 sighting; mitigation queued pre-promotion). Pairs with `orchestrator.md` Procedure 6 (register-alignment diagnostic — the upstream half of the closed loop) and `verifier.md` upstream-diagnostic-gate clause on CiC directives (Clause 7). No DOCTRINE touch this cycle.
