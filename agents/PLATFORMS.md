# PLATFORMS.md — platform-specific constraints per agent role

Companion to `AGENTS.md` and the role docs in this folder. Each agent runs on a specific platform with its own surface constraints, content-policy reach, paste-relay shape, and known friction modes. This file is the index of those constraints; role docs reference back to this file for the mechanics.

## Chat (Claude — orchestrator)

**Surface.** Anthropic web/desktop/mobile chat. Per-conversation context window; no persistent state across chats (memory + canonical files on disk carry state).

**Capabilities present.**
- Full read access to `~/dev/8ball/` and `~/Desktop/8ball/` via Desktop Commander.
- Pragmatic write access for fast initial work (per §10).
- Shell command execution (read-only verification, git operations, test runs, pbcopy).
- URL opening: `open -a "Google Chrome" "<url>"`.
- App opening: `open -a "Codex"`, `open -a "Code"`.

**Constraints.**
- Context window finite — long cycles use handoff files at chat boundaries (per orchestrator.md §4).
- Tool-call latency adds up — single-call "let me check" preambles are friction; batch operations aggressively per MUHAB.md §2.3.
- No background processes — every action is synchronous within the chat turn.
- Tool schema verification belongs in the same pre-flight bucket as file-read verification (v0.3.0 footnote: tool-schema confusion between `edit_block` and `str_replace` cost one mid-cycle recovery).

**Friction modes observed.**
- Long context — slow tool calls. Mitigation: handoff files at natural seams.
- Single-call narration — adds turns without progress. Mitigation: MUHAB.md §2.3 unleashed mode.

## Claude Code (CC — implementer)

**Surface.** `/usr/local/bin/claude` CLI tool, currently v2.1.42 per `MUHAB.md` §4. Runs in a terminal session; operator launches with `claude` command in repo root.

**Capabilities present.**
- Multi-file production-grade edits.
- Git operations (branch, commit, push).
- Test runs, audit scripts.
- Direct repo filesystem authority.

**Constraints.**
- Content-filter has stricter reach than chat-Claude — borderline content (scoring rules, mystical vocabulary, certain calc descriptions) trips opaque refusal. v0.2.7.2 saw two consecutive content-filter trips on `core/cities.js` writing.
- Operates on real filesystem — destructive actions are real.
- Single-session: each `claude` invocation is its own context; no carry-over between sessions without handoff files.

**Friction modes observed.**
- **L40 — content-filter trip.** "Do the standard workaround does not always succeed." 2-attempt cap on opaque workarounds, then close to next scope by pivoting back to chat-Claude. v0.2.7.2 cycle had three L40 firings (two content-filter on cities.js, one paste-relay friction on Codex implementer routing).
- Brief drift — when CC operates on an aspirational brief that doesn't match disk state. Mitigation: implementer.md §1 — verify file paths exist before acting.

## Codex (auditor)

**Surface.** Codex Mac desktop app. No filesystem access from outside the app — paste-and-relay only. Operator launches with `open -a "Codex"`.

**Capabilities present.**
- Adversarial reading of pasted briefs.
- Structured verdict output (when prompted with explicit format).
- Multi-hook categorization (PASS / P0 / P1 / P2 / P3).

**Constraints.**
- No direct repo access — all inputs come from the orchestrator's audit brief. Brief must be self-contained (diff quoted inline, doctrine § quoted inline, brief quoted inline).
- Paste-relay roundtrip — controller is the network. Latency is human-paced.
- Response truncation possible on long audits — orchestrator drafts audit briefs with explicit "Verdict format" section that compresses cleanly.

**Friction modes observed.**
- Paste-relay friction — response gets clipped, formatting breaks, target app stuck. Mitigation: orchestrator surfaces explicit pbcopy one-liner + verification command (`pbpaste | wc -l`).
- Implementer routing trip (v0.2.7.2 cycle) — operator surfaced friction at first paste hurdle when Codex was tentatively routed as implementer. L40 fired; routing pivoted back to chat-Claude direct-write. Codex's earned strength is the auditor role per MUHAB.md.

## Claude in Chrome (CiC — verifier)

**Surface.** Browser extension installed in Chrome. Operator runs from the Chrome sidepanel; CiC drives the active tab.

**Capabilities present.**
- Live page interaction (click, type, screenshot, read DOM, read console).
- Tab/window management within Chrome.
- Multi-step procedures driven by a pasted directive.
- Per-session domain allowlist (default = read-only / static; non-default requires explicit approval).

**Constraints.**
- Default domain allowlist gates access to payment processors, social authoring surfaces, marketing dashboards, etc. — controller adds domains to the session allowlist before pasting.
- No credentials, no payment entries, no irreversible action clicks (per verifier.md boundaries).
- No DevTools modifications — inspect only.
- Screenshots are visual; report is text.

**Friction modes observed.**
- Domain allowlist block at pre-flight (v0.3.0 cycle): LS store-setup directive hit `app.lemonsqueezy.com`, blocked at pre-flight; controller added domain to session allowlist before retry succeeded. Documented in `verifier_report_ls_store_blocked_2026-05-11.md`.
- Region enforcement on platforms (Thread A closure, v0.3.0 cycle): TikTok KSA account-region locked at registration time; Business switch flow appeared to complete but silently reverted on region re-detection. Disposition per L40 cap: 2 attempts, then close to next scope; bio reverted to plain-text URL, calculator-framing rewrite deferred to a future v0.2.8.

## ChatGPT (adjunct — content/copy review)

**Surface.** ChatGPT Mac desktop app. Paste-relay only.

**Capabilities present (per MUHAB.md §3).**
- Aesthetic copy review.
- Experience-design feedback.
- Trait pool diff review (legacy; retired post-pivot per `8BALL.md` §11 paused/retired).

**Constraints.**
- Not in the 4-agent core system; adjunct lane only.
- No filesystem access; paste-relay only.
- Voice register has its own training prior — orchestrator briefs constrain explicitly per §2 voice register rules.

**Friction modes observed.**
- (None codified to date; ChatGPT lane has been quiet since the trait-pool retirement.)

## Other adjuncts (Perplexity, Gemini)

Per `MUHAB.md` §3:
- **Perplexity** — web search / current-info verification.
- **Gemini** — personal queries / second opinion.

Neither is in the 4-agent core or used in standard cycle flow. Reserved for cross-check use cases as they arise.

## Artifact-location matrix

| Artifact | Path |
|---|---|
| Role docs (this folder) | `~/dev/8ball/agents/*.md` |
| Briefs for implementer | `~/Desktop/8ball/sessions/brief_<slug>_<date>.md` |
| Handoffs at chat boundaries | `~/Desktop/8ball/sessions/handoff_<slug>_<date>.md` |
| Audit briefs for Codex | `~/Desktop/8ball/audits/codex_<slug>_<date>.md` |
| Audit responses from Codex | `~/Desktop/8ball/audits/codex_<slug>_response.md` |
| Directives for CiC | `~/Desktop/8ball/controllers/cic_<slug>_<date>.md` |
| Verifier reports from CiC | `~/Desktop/8ball/controllers/verifier_report_<slug>_<date>.md` |
| Content-batch reviews for ChatGPT | `~/Desktop/8ball/sessions/content_<slug>_<date>.md` |
| Session distillates | `~/Desktop/8ball/sessions/session_distillate_<date>.md` |
| Scope notes for future versions | `~/Desktop/8ball/sessions/v0X_scope_notes.md` |

The split between repo tracked (`~/dev/8ball/`) and Desktop materialization (`~/Desktop/8ball/`) is intentional: tracked = the constitutional + canonical state, Desktop = per-cycle working artifacts that don't need to ship with the repo but need to survive across sessions.

## Audit history (this file)

- 2026-05-12 — File created during the agents/ codification cycle (DOCTRINE v0.23 → v0.24). Codifies the per-platform constraints observed across the v0.1.0 → v0.3.0.1 cycles. L40 firing log will live here in subsequent cycles; new platform additions (e.g. if Cowork or another adjunct gets a defined role) extend the table.
