# AGENTS.md — agent-team system index

> Codifies the agent-team model per DOCTRINE §10 v0.24 extension. Read this file at the start of any cycle that will route across multiple roles.

This folder (`~/dev/8ball/agents/`) is the constitutional surface for the agent-team model. Each role has a doc here. Per-cycle artifacts (briefs, audits, directives, reports) live in `~/Desktop/8ball/` per the artifact-location matrix in `PLATFORMS.md`.

## The system in one paragraph

8ball runs four agent roles plus one always-on controller. The **orchestrator** (chat-Claude, codename كن فيكون / kun fayakun) holds context and composes briefs. The **implementer** (Claude Code) executes multi-file production-grade edits. The **auditor** (Codex) adversarially reviews doctrine + content + release-gates before merge. The **verifier** (Claude in Chrome) drives the deployed product through user-style interactions and reports findings. The **controller** (operator) is the always-on layer — final approver for every merge, deploy, payment, and irreversible action. Solo authority is the failure mode; doctrine and content do not ship without the second pair of eyes.

## Roles

| Role | Tool | Role doc | Codename |
|---|---|---|---|
| Orchestrator | Claude (chat) | [`orchestrator.md`](./orchestrator.md) | كن فيكون / kun fayakun |
| Implementer | Claude Code (CC) | [`implementer.md`](./implementer.md) | — |
| Auditor | Codex (Mac app) | [`auditor.md`](./auditor.md) | — |
| Verifier | Claude in Chrome (CiC) | [`verifier.md`](./verifier.md) | — |
| Controller (always-on) | Operator | [`controller.md`](./controller.md) | — |

**Orchestrator codename note.** `كن فيكون` (kun fayakun) is the Quranic phrase "Be, and it is" — Allah's creative command. Operator-coined as the orchestrator skill's working name. Used as the codename in `orchestrator.md`'s H1; treat as religious-scholarly Arabic vocabulary (do not gloss in tracked content per MUHAB.md §8 #6). The Latin transliteration is a navigation aid for non-Arabic readers, not a translation.

## Adjunct lanes (not core agents)

Per `PLATFORMS.md`:
- **ChatGPT** — content/copy review (aesthetic, voice register, trait pools when active). Paste-relay only.
- **Perplexity** — web search / current-info verification.
- **Gemini** — personal queries / second opinion.

Adjuncts are invoked ad-hoc, not on every cycle. They have no role docs because they don't have project-specific procedures; the MUHAB.md §3 lane table is sufficient.

## How a cycle routes through the agents

```
controller states scope
       │
       ▼
orchestrator drafts brief  ──────►  ~/Desktop/8ball/sessions/brief_<slug>.md
       │
       ▼
controller paste-relays to CC
       │
       ▼
implementer executes ───────────►  branch + commits
       │
       ▼
orchestrator drafts audit brief ─►  ~/Desktop/8ball/audits/codex_<slug>.md
       │
       ▼
controller paste-relays to Codex
       │
       ▼
auditor returns verdicts ───────►  ~/Desktop/8ball/audits/codex_<slug>_response.md
       │
       ▼
orchestrator dispositions hooks
       │
       ▼ (if surface change)
orchestrator drafts CiC directive ►  ~/Desktop/8ball/controllers/cic_<slug>.md
       │
       ▼
controller paste-relays to CiC
       │
       ▼
verifier reports findings ───────►  ~/Desktop/8ball/controllers/verifier_report_<slug>.md
       │
       ▼
orchestrator dispositions findings
       │
       ▼
controller merges PR (gh pr merge --squash --delete-branch)
       │
       ▼
orchestrator fills MERGE_SHA_TBD, updates 8BALL.md §10, appends journal
       │
       ▼
controller runs §13 live-fire on prod (if surface change)
       │
       ▼
cycle closes; handoff file if continuing in new chat
```

Not every cycle hits every node. Hygiene cycles skip auditor + verifier. Surface-free cycles (doctrine-only) skip verifier. Mid-cycle audits (L46) fire at natural seams between substantive commits rather than at PR-open. The graph is the maximum-shape; cycles instantiate the subset they need.

## Artifact locations

See `PLATFORMS.md` "Artifact-location matrix" for the full table. Summary:

- **Repo tracked** (`~/dev/8ball/`) — constitutional + canonical state. Doctrine, role docs, code, tests, audits/RELEASE_CHECKLIST.md, journal.md, 8BALL.md.
- **Desktop materialization** (`~/Desktop/8ball/`) — per-cycle working artifacts. Briefs, handoffs, audit briefs/responses, CiC directives/reports, session distillates, scope notes. Survives across sessions; does not ship with the repo.

The split is intentional: tracked content is the durable-doctrinal surface, Desktop is the per-cycle scratch surface. Per §11 PII rule, operator-personal data + SIRR cross-references stay out of tracked content but can appear in Desktop files (per `audits/LOCAL_PII_AUDIT.md` discipline).

## Relationship to DOCTRINE §10

`DOCTRINE.md` §10 is the constitutional summary: names the roles, names the lane discipline, names the failure mode. This file (`AGENTS.md`) and the role docs are the operational detail. §10 is read every release; `agents/*.md` is read when routing a cycle.

If §10 and an `agents/*.md` file disagree, §10 wins. The agents/ docs are the implementation of §10; §10 is the constraint they implement against.

## When to amend agents/ vs DOCTRINE §10

- **DOCTRINE §10 amendment:** when the role structure changes (a role added or removed, the controller boundary redefined, the lane discipline rules updated). Requires Codex audit + controller approval per §10 itself.
- **`agents/*.md` edit (no doctrine touch):** when procedures within a role evolve (new directive shape, new platform constraint, new friction mode added to PLATFORMS.md, new procedure in a role doc). No doctrine bump.

The split keeps the constitutional surface stable while letting operational detail evolve at cycle cadence.

## Audit history (this file)

- 2026-05-12 — File created during the agents/ codification cycle (DOCTRINE v0.23 → v0.24). Index ships alongside `orchestrator.md`, `implementer.md`, `auditor.md`, `controller.md`, `PLATFORMS.md`. Existing `verifier.md` preamble updated to cite v0.24 extension.
