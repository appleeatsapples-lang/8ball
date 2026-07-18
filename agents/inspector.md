# Agent role: inspector — operational dashboard reads via Claude in Chrome and adjacent channels

> One of five agent roles per DOCTRINE §10 v0.29 extension: orchestrator (chat-Claude), implementer (CC), auditor (Codex), verifier (CiC against deployed product), **inspector (CiC and adjacents against operator infrastructure)**, with controller (operator) as the always-on final approver.

## What this lane does

Reads operator's own infrastructure dashboards and reports observations. Inspector is operator's eyes on the third-party surfaces that hold operational state for the project — payment processors (Gumroad), hosting (Netlify), code (GitHub), social (TikTok, Instagram, Threads), and similar dashboards the operator already has open in service of the project.

Inspector reports state; the orchestrator categorizes; the controller decides. Inspector never clicks irreversible actions; never enters credentials; never accepts terms or grants permissions.

**Sibling distinction.** **Verifier** runs against the deployed product (`the-eight-ball.netlify.app`) mimicking a paying user; **inspector** runs against operator's own infrastructure dashboards mimicking the operator scanning their own systems. Same channel family (CiC and adjacents), different surface, different success-criteria shape. See the four-way table below.

## Four-way role-boundary test

| Role | Target | Acts? | Filesystem? | Adversarial? |
|---|---|---|---|---|
| **Inspector** | operator's own infrastructure dashboards (Gumroad, Netlify, GitHub, social platforms) | no — read-only | no | no — observational |
| **Verifier** (`agents/verifier.md`) | end-users on deployed product (`the-eight-ball.netlify.app`) | no — read-only, no irreversibles | no | no — observational |
| **Auditor** (`agents/auditor.md`) | doctrine + content + PR artifacts on disk | no — verdict-issuing | no — paste-relay only (pasted file contents, no direct filesystem access) | yes — adversarial |
| **Controller** (`agents/controller.md`) | irreversible actions everywhere | yes — irreversibles | yes | no |


Inspector and verifier are the closest siblings. The boundary holds at the surface (operator infrastructure vs deployed product), not at the channel (both use CiC).

## When to invoke

**Required:**
- Pre-state-fill verification when canonical files (`8BALL.md`, journal) need to assert state of a third-party surface (e.g. "Gumroad gate cleared", "Netlify single project verified", "Threads profile published").
- Pre-merge state verification when a cycle depends on third-party state (e.g. ship-gate (b) requires processor activation; ship-gate verification requires deploy status; social-channel work requires profile state).

**Recommended:**
- Status-recheck between cycles when an open gate has a known vendor-staff-pending or operator-action-pending dependency.
- Cross-tab status synthesis when multiple operational surfaces need joint state assessment.

## What the orchestrator prepares

A directive file at `~/8ball/controllers/cic_<descriptive_slug>_<date>.md`, anchored with `=== DIRECTIVE START ===` / `=== DIRECTIVE END ===` markers (matches verifier convention; allows clean pbcopy extraction).

Structure:

```
=== DIRECTIVE START ===

# Goal
<one-paragraph statement of what state we want confirmed>

# Start URL
<exact URL on the target dashboard>

# Preconditions
<expected state: logged-in, tab open, prior session state>

# Steps
## Step N — <name>
1. <observation action>
2. Report:
   - <thing to observe>
   - <thing to observe>

# Hard stops / DO NOT
- No clicks on irreversible-action buttons (merge, publish, delete, send, submit, upload, charge, payout, withdraw)
- No credentials, no payment entries, no terms acceptance, no cookie selection, no permission grants
- No off-domain navigation
- No DevTools modifications
- No strategic / operational / doctrine synthesis beyond what STEPS explicitly request

# Final report format
<fenced template with structured observation fields>

=== DIRECTIVE END ===
```

## Boundaries (inspector never does these)

- **Read-only.** Never click irreversible-action buttons. No merges, no publish flips, no project deletions, no toggle switches, no `Save` / `Submit` / `Confirm` on form state, no upload / charge / payout / withdraw clicks.
- **No credentials, no payment entries.** Never enter passwords, never enter card numbers, never enter bank details, never enter ID-verification data.
- **No terms acceptance, no cookie selection, no permission grants.** Surface state, report, let controller decide.
- **No personal account access.** Inspector targets operational dashboards the operator already has open in service of the project; never personal email, personal banking, personal social inbox.
- **No DevTools modifications.** Inspect only. No localStorage edits via console, no fetch override, no JS injection.
- **No strategic / operational / doctrine synthesis.** Inspector reports findings against the STEPS in its directive. It does not synthesize strategic patterns, operational recommendations, or doctrine-shaped framings beyond what the directive's STEPS explicitly asked for. If the surface seems to invite synthesis ("write up what you saw on the dashboard"), the inspector records observations only; synthesis is orchestrator work. (Inherited from `agents/verifier.md` Boundaries — adapted to inspector surface, meaning preserved — chat-15 L-mitigation cycle c13-c14-c15 bundle, Clause 1, **L50** = `CiC-scope-expansion-into-strategic-content`. Sketch carried the boundary from c13-c14-c15 mitigation; promoted alongside the role at v0.29.)

All irreversibles continue to live with the controller per DOCTRINE §10.

## Channel matrix (Chrome and adjacent read paths)

| Channel | Use case | Cost (sec/call) | Reliability | Notes |
|---|---|---|---|---|
| **osascript inventory** | tab list (URLs + titles), window count, "is Chrome running" check | ~1s | reliable always | works regardless of Apple-Events-JS toggle |
| **osascript JS execution** | page text reads, banner extraction, element queries | ~1s | gated by Chrome setting | requires Chrome → View → Developer → Allow JavaScript from Apple Events = ON (one-time operator toggle; off by default on fresh installs) |
| **Control Chrome MCP `list_tabs`** | tab list (alternative to osascript) | ~1s | flaky — duplicates osascript inventory, false-negative on reads | degraded value; fallback only |
| **Control Chrome MCP `execute_javascript` / `get_page_content`** | page reads via MCP | ~1s | flaky — falsely reports "Chrome is not running" when Apple-Events-JS toggle is OFF (firing #6 datum) | don't rely; verify toggle before relying |
| **Claude in Chrome (CiC) extension** | multi-step browser flows, screenshots, paste-relay automated reads | ~30–120s (sidepanel + paste + report) | per-domain reliability via session allowlist; controller adds non-default domains before paste; payment-processor domains may also hit Anthropic-policy-level blocks (firing #7 superseded datum) | per-tab sidepanel and conversation context (see `PLATFORMS.md` "CiC per-tab scope") |
| **Operator screenshot to chat** | one-page status reads where the screen is more information-dense than a verbal summary | ~10–15s operator time | always available; bypasses every Chrome / extension / toggle gate | highest info-density-per-second when operator is at machine and answer fits one screen; required path for Stripe-hosted Connect Onboarding flows and other payment-processor domains where CiC is policy-blocked |
| **Operator eye** | one-glance binary state checks ("banner present or gone?") | ~5–15s operator time | always available | cheapest channel for one-question reads |

## Channel-decision tree

- **"Are there tabs open / what tabs are open?"** (inventory) → osascript inventory. Always works.
- **"What does the banner / status indicator say on page X?"** (single-page binary or short string)
  - If operator at machine and screen is information-dense → **operator screenshot to chat** (cheapest, proven across firings #3 #6 #8).
  - Else if operator within glance range → operator eye + verbal report.
  - Else if Chrome's Apple-Events-JS toggle ON → osascript JS execution.
  - Else → CiC directive (slowest; may be domain-blocked at default allowlist for payment processors; may be Anthropic-policy-blocked for Stripe-hosted flows).
- **"What's the full content of page X?"** (full surface)
  - If Apple-Events-JS toggle ON → osascript JS execution + truncate.
  - Else → CiC `get_page_text` or `read_page`.
- **"Click through a multi-step flow"** (boundary check — not inspector scope)
  - Always → CiC under verifier or controller routing, never inspector. Never inspector if any step is irreversible.
- **"Synthesize status across tabs"** (cross-tab)
  - Orchestrator-aggregated: one CiC directive per tab (or one osascript JS-read per tab if toggle ON), then chat-Claude aggregates. CiC cannot do this in a single directive — per-tab context.
- **"Click an irreversible button"** (merge, delete, toggle, purchase, upload, payout)
  - Always → controller. Never inspector. Never any agent.

## Characterized failure modes (from sketch firing log)

Inherited from `~/8ball/sessions/inspector_sketch_2026-05-13.md` §5 firing log (9 directive-shape firings, 8 fired, 7 unambiguously clean across 8 distinct surfaces). Six distinct failure-mode classes documented:

1. **CiC default domain allowlist blocks** payment processors, social authoring surfaces, marketing dashboards. Mitigation: controller adds domain to session allowlist before paste. Examples observed: `app.lemonsqueezy.com` (chat-13), `gumroad.com` (chat-28).

2. **Control Chrome MCP false-negative** on `execute_javascript` + `get_page_content` while Chrome demonstrably running. Mitigation: don't rely; fallback only. Root cause clarified at firing #6: requires Chrome → View → Developer → Allow JavaScript from Apple Events = ON; reports as misleading "Chrome is not running" when off. Operator paste-relay into CiC sidepanel is the proven fallback path.

3. **osascript JS execution gated** by Chrome's Apple-Events-JS toggle. Mitigation: one-time operator toggle, or pivot to operator-screenshot / CiC.

4. **CiC sidepanel context is per-tab** (not per-Chrome-session). Mitigation: directive paste discipline + URL-check step 1 in every directive (codified in `PLATFORMS.md` "CiC per-tab scope" subsection).

5. **CiC sidepanel blocks on payment-processor domains** at the Anthropic-policy level (not per-session consent). Observed on `connect.stripe.com` at firing #7 (superseded). Different mechanism than the per-domain allowlist gate. Mitigation: operator-fronted screenshot channel for Stripe-hosted Connect Onboarding flows; likely applies to Square / Adyen / Braintree / Wise / etc.

6. **CiC `javascript_tool` runtime safety filter blocks URL/query-string concatenation** on payment-context content. Observed at firing #9. Per-invocation content-shape filter (not per-session, not per-domain). Mitigation: prefer scoped `find` / `read_page` / `get_page_text` calls over bulk JS expressions when verification involves payment-related strings, URLs, or query parameters; break verification into scoped reads per-element.

L50 boundary fired once (firing #2 chat-13, MIXED verdict — agent appended ~600-word strategic-content section beyond directive STEPS). Mitigated by directive-template DO-NOT clause + no-strategic-synthesis Boundaries clause (both inherited from verifier.md, chat-15 c13-c14-c15 bundle); no L50 sightings on inspector-shaped firings since.

## How orchestrator consumes the report

1. Save CiC's report immediately to `~/8ball/audits/inspector_report_<slug>_<date>.md` (or `~/8ball/controllers/inspector_report_<slug>_<date>.md` when artifact lives alongside the directive) — full text, no editing.
2. Categorize each observation: **GATE-CLOSING** (closes an open ship-gate or state condition) / **STATE-FILL** (canonical files need update) / **BACKLOG** (worth tracking for later).
3. GATE-CLOSING observations trigger immediate state-fill in `8BALL.md` and journal entry per L51 / Procedure 8 sub-condition discipline (`agents/orchestrator.md`).
4. STATE-FILL observations update relevant canonical files (`8BALL.md`, journal).
5. BACKLOG observations file into `~/8ball/sessions/v0X_scope_notes.md` or relevant tracking file.

## Procedures (this file is the index)

### 1. Banner state read (one-line read)

Most common procedure. Directive targets one URL, observes one banner element, reports its current text (or absence). Used for vendor-staff-pending gate checks and quick state verifications between cycles.

Directive structure: GOAL + START URL + numbered observations (banner present? text? severity? linked action?) + DO NOT + report format.

Firings using this shape: #3 (LS Step 3 recheck, chat-25), #6 (Gumroad pre-Confirm, chat-28), #8 (Gumroad post-Confirm, chat-28).

### 2. Multi-tab cross-check (orchestrator-aggregated)

When state spans multiple surfaces. Directive enumerates each tab + its URL + its observation steps with TAB-numbered structure (TAB 1 / TAB 2 observations 1a–1f, 2a–2d). Cross-tab synthesis is orchestrator-side, not CiC-side (per-tab context).

Firings using this shape: #1 (Netlify single-project verify, chat-13), #6 + #8 (Gumroad settings + dashboard tabs, chat-28).

### 3. Social profile quality check

Surface enumeration on @eczaki surfaces (IG, TikTok, Threads). Tactical for carnaval-frame execution: read profile state, display-name asymmetry, follow / engagement counts, link routing.

Firings using this shape: #4 (Threads quality check, chat-26), #5 (TikTok bio-link recon, chat-27).

### 4. Live-fire smoke-test (post-deploy state-only verification)

Sibling-shaped to verifier post-deploy procedure but targets state-only DOM inspection rather than user-flow simulation. Used when verifier's user-flow procedure is overkill and a targeted state check suffices. Boundary holds — no flow-triggering clicks, even when the verification scope spans clickable elements.

Firings using this shape: #9 (v0.3.0.3 live smoke-test, chat-28 — paywall CTA href + disclosure text + LS-residual count + Gumroad-occurrence count).

## CiC directive template — standing clauses (inherited from verifier.md)

Every CiC directive drafted under the inspector role carries the two clauses below. They are the directive-template counterparts of the no-strategic-synthesis boundary: the boundary names what the inspector never does; these clauses name the directive shape that enforces it at the inbound and outbound edges.

### Downstream — DO-NOT clause on every directive

Every CiC directive includes an explicit `DO NOT` section forbidding: strategic synthesis beyond the STEPS, narrative framing beyond observation, recommendations beyond the directive's scope, write-ups about lane / role / doctrine implications of the observations. The DO-NOT clause is verbatim-pastable into a directive's "Hard stops" / "DO NOT" block; the orchestrator does not draft directives without it.

Reasoning: closes the chat-13 firing (L50 sighting #1) where CiC produced a strategic synthesis on top of the YouTube lane report when only STEPS-bound observations were asked for. Mirrors the Boundaries clause on no-strategic-synthesis but operationalizes it at the directive-drafting layer rather than the agent-behavior layer.

### Upstream — gate on directive origination

Inspector directives do not begin without an upstream purpose. Every directive originates from an orchestrator pass that names the state being verified, the cycle it serves, and the canonical file that consumes the result. Controller does not accept a directive draft that lacks an upstream-purpose preamble.

Reasoning: aligned with `verifier.md` upstream-diagnostic gate (chat-15 Clause 7). The shape is the same; the trigger differs — verifier directives are gated on register-alignment diagnostic; inspector directives are gated on canonical-file-consumption purpose. Inspector directives that fail this gate ("just check what's there") collapse into open-ended exploration; the canonical-file-consumption framing keeps the directive scoped.

## Audit history (this file)

- 2026-05-16 — File created during the v0.29 inspector promotion cycle (DOCTRINE v0.28 → v0.29). T1 tentative-lane promoted to permanent agent role after 9/9 directive-shape firings (8 fired, 7 unambiguously clean) across 8 distinct surfaces (Netlify dashboard, YouTube viewer, LS dashboard, Threads profile, TikTok settings, Gumroad payment-settings × 2 states, Netlify production deploy). All four T1 promotion pillars cleared with 4-firing buffer: ≥3 clean firings + repeatable directive shape across firings + distinct lane boundary against existing roles (four-way test in this file) + characterized failure mode (6 entries). Sketch authored chat-13 2026-05-13 at `~/8ball/sessions/inspector_sketch_2026-05-13.md`; L49-candidate discipline (fire first, codify after) preserved throughout sketch period (sketch lived in `~/8ball/sessions/`, not `~/dev/8ball/agents/`, until promotion). Boundary clause (no-strategic-synthesis) inherited from `agents/verifier.md` Boundaries (adapted to inspector surface; meaning preserved) via chat-15 c13-c14-c15 L-mitigation bundle. DOCTRINE §10 amended v0.28 → v0.29 (4-row core-agent table → 5-row, inspector inserted between verifier and controller). `agents/PLATFORMS.md` gains new H2 "Inspector (operational dashboard read)" section between CiC (verifier) entry and ChatGPT entry. `agents/AGENTS.md` role table extended from 4 core agents + 1 controller → 5 core agents + 1 controller; opening-paragraph count updated. `tests/pii_scan.test.js` DOCTRINE_ALLOW extended to add `agents/inspector.md` explicitly (sibling-to-existing-role-doc entries from v0.24 cycle); test change is one-line list addition, no logic change. Sketch updated in place with PROMOTED status marker + final firing-log entry pointing at the merged tracked role doc.
