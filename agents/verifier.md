# Agent role: verifier — live UX via Claude in Chrome

> One of four agent roles per DOCTRINE §10 v0.24 extension: orchestrator (chat-Claude), implementer (CC), auditor (Codex), **verifier (CiC)**, with controller (operator) as the always-on final approver.

## What this lane does

Drives the deployed product through user-style interactions and reports observations. Verifier is operator's eyes on the live site — text-level findings (DOM presence, copy accuracy, state correctness, console errors, network behavior, localStorage shape) plus screenshots for anything visual.

Verifier does NOT make judgment calls about whether findings block merge. It reports; the orchestrator categorizes; the controller decides.

## When to invoke

**Required:**
- Post-deploy-preview, pre-merge for any PR touching surface (UI, copy, mechanics, calc). Verifier confirms the preview behaves as the brief specifies.

**Recommended:**
- Pre-implementation baseline for doctrine-monster cycles. Captures the current UX state so post-implementation deltas are clear, and surfaces pre-existing friction that the new surface might amplify.
- Post-merge live-fire on production for the first 24-48 hours after a significant ship.

## What the orchestrator prepares

A directive file at `~/Desktop/8ball/controllers/cic_<descriptive_slug>_<date>.md`, anchored with `=== DIRECTIVE START ===` / `=== DIRECTIVE END ===` markers (matches the project convention; allows clean pbcopy extraction).

Structure (per existing artifacts in controllers/):

```
=== DIRECTIVE START ===

# Goal
<one-paragraph statement of what we want to learn>

# Context
<what cycle, what version, what's been tested already, what's open>

# Test data
<synthetic profiles ONLY — never operator-personal data>

# Steps
## Step N — <name>
1. <action>
2. <action>
3. Report:
   - <thing to observe>
   - <thing to observe>

# Hard stops
- <irreversible actions to NOT take>
- <destructive actions to NOT take>

# Final report format
<fenced template with the structured fields the orchestrator wants back>

=== DIRECTIVE END ===
```

## Boundaries (verifier never does these)

- **No real payments.** Test mode only. Never complete a live charge.
- **No irreversible UI actions.** Never click merge/publish/delete/send/submit-feedback. Surface state, report, let controller decide.
- **No operator-personal data.** Use the synthetic profile pool below; never enter operator's real name, DOB, or location.
- **No DevTools modifications.** Inspect only. No localStorage edits via console, no fetch override, no JS injection.
- **No strategic / operational / doctrine synthesis.** Verifier reports findings against the STEPS in its directive. It does not synthesize strategic patterns, operational recommendations, or doctrine-shaped framings beyond what the directive's STEPS explicitly asked for. If the surface seems to invite synthesis ("write up what you saw"), the verifier records observations only; synthesis is orchestrator work. (Added chat-15 per L-candidate `CiC-scope-expansion-into-strategic-content` chat-13 sighting #1; firing was the YouTube algorithm-tune directive where the agent appended a ~600-word strategic-content section beyond the directive's STEPS scope and that synthesis contradicted DOCTRINE §2 arcade-toy carve-out with a $3/month subscription framing.)

## How orchestrator consumes the report

1. Save CiC's report immediately to `~/Desktop/8ball/controllers/verifier_report_<slug>_<date>.md` — full text, no editing. (This mirrors the existing pattern: `verifier_report_v02711_postship.md`.)
2. Categorize each finding: **BLOCKER** (cannot merge) / **FIX-BEFORE-MERGE** (P1) / **FILE-FOR-BACKLOG** (P2, future cycle).
3. BLOCKER / FIX-BEFORE-MERGE findings become new dispositions in the active brief or PR description.
4. BACKLOG findings file into `~/Desktop/8ball/sessions/v0X_scope_notes.md` for the relevant future version.

## Synthetic profile pool (use these, never real data)

For diverse coverage across (sun × animal × life path) and edge cases:

| Profile | Name | DOB | Birthplace | Time | Purpose |
|---|---|---|---|---|---|
| P1 | Sam Carter | 1990-05-15 | — | — | Canonical baseline (Taurus, Horse, LP 3) |
| P2 | Jane Doe | 1985-11-22 | — | — | Master life path (LP 11) — numerology formatting check |
| P3 | Alex Reed | 1995-07-04 | New York City (dropdown: `New York City · United States`) | 14:30 | Full surface with rising sign |
| P4 | Lin Tromsø | 1980-12-15 | Tromsø, Norway | 03:00 | Polar latitude — should surface "rising unavailable" |
| P5 | José Núñez | 2000-02-29 | — | — | Non-ASCII name + leap-year DOB — encoding + date math |
| P6 | Anna Smith | 1968-04-12 | Indianapolis, US | 08:00 | Pre-2006 Indiana no-DST historical tz case (regression-locked at v0.2.7.2) |

Most cycles use P1–P4. P5–P6 are reserved for regression-sensitive cycles (calc changes, tz changes, content changes touching name-encoding paths).

## Procedures (project-local, this file is the index)

### 1. Multi-profile baseline UX check

Most-frequent procedure. Run before doctrine-monster cycles to establish the foundation, and after deploy-preview to confirm new surface. Directive template at `~/Desktop/8ball/controllers/cic_<version>_baseline_<date>.md`.

Profile sequence: P1 → P2 → P3 → P4 (clean session between each via "try another" or localStorage clear).

Per-profile checks: form acceptance, shake-completes, card renders, coordinates present, catalog roman numeral correct, numerology triplet formatting, "show labels" toggle, "try another" reset, about-modal copy.

Cross-profile checks: 18+ gate persists, no network calls beyond expected (cities.json lazy-load, feedback POST when explicitly submitted), localStorage keys are allow-listed only, mobile viewport doesn't break.

### 2. Payment flow walkthrough (current — paid surface shipped in v0.3.0; awaiting LS Live for end-to-end)

After v0.3.0 shipped (2026-05-11), this procedure became the standard live-fire for the paid surface. Currently runs against LS Test mode only; LS identity verification is pending, so Live-mode end-to-end is deferred until the LS account clears. Procedure runs:
- 3 free tries hitting locked render
- 4th try hitting paywall (Path A)
- Lock-tap on a locked card hitting paywall (Path B)
- Test-mode LS checkout (Stripe test card `4242 4242 4242 4242`)
- `?paid=t1` return + pending-profile consumption
- Replay-attack probe: manual `/?paid=t1` URL entry
- About-modal + paywall-modal LS-disclosure copy assertions

Live-fire §13 of the v0.3.0 brief is the source-of-truth checklist; CiC procedure derives from it.

### 3. Feedback form e2e (current — shipped in v0.2.5)

Verify Netlify Forms submission lands in dashboard. CiC must NOT submit during normal verifier runs (hard stop above); this dedicated procedure is the exception, with explicit operator approval and a known-test-payload that operator monitors.

## CiC directive template — standing clauses (added chat-15)

Every CiC directive drafted under the verifier role carries the two clauses below. They are the directive-template counterparts of the no-strategic-synthesis boundary above: the boundary names what the verifier never does; these clauses name the directive shape that enforces it at the inbound and outbound edges.

### Downstream — DO-NOT clause on every directive

Every CiC directive includes an explicit `DO NOT` section forbidding: strategic synthesis beyond the STEPS, narrative framing beyond observation, recommendations beyond the directive's scope, write-ups about lane / role / doctrine implications of the observations. The DO-NOT clause is verbatim-pastable into a directive's "Hard stops" / "DO NOT" block; the orchestrator does not draft directives without it.

Reasoning: closes the chat-13 firing where CiC produced a strategic synthesis on top of the YouTube lane report when only STEPS-bound observations were asked for. Mirrors the Boundaries clause on no-strategic-synthesis but operationalizes it at the directive-drafting layer rather than the agent-behavior layer.

### Upstream — gate on directive origination

CiC directives do not begin with "go seed X" or "tune Y lane." Every directive originates from an orchestrator diagnostic pass (`orchestrator.md` Procedure 6 register-alignment diagnostic for content seeds; equivalent procedure for non-seed surfaces). Controller does not accept a directive draft that lacks an upstream-diagnostic preamble.

Reasoning: closes the chat-14 firing where controller seeded the YouTube algorithm tune from mainstream defaults (L-candidate `controller-content-seed-defaults-mainstream`, sighting #1) without an orchestrator register-alignment pass — the directive was draftable in principle but would have locked a register-mismatched feed without the diagnostic. The upstream gate makes the diagnostic pass a precondition of the directive existing, not a courtesy step before it executes.

Both clauses are paired: downstream DO-NOT covers what the verifier writes inside the directive's window; upstream gate covers how the directive comes into being before the verifier sees it. Neither is sufficient alone.

## Audit history (this file)

- 2026-05-11 — File created during v0.3.0 brief cycle. Operator request: codify the verifier role + sample procedure ahead of v0.3.0 implementation, so the lane is documented before the surface change that needs it.

## Boundaries addendum — CiC session domain allowlist (added 2026-05-11)

CiC enforces a per-session domain allowlist as a safety control. The default allowlist covers read-only / static-content domains (the deployed 8ball site, GitHub public pages, similar). Domains outside the default set are blocked at navigation.

**Pre-flight requirement for directives targeting non-default domains:** the directive must state explicitly which domain(s) are required, and the controller (operator) must add them to the CiC session allowlist before pasting. Examples of domains likely to require explicit approval:

- Payment processors (`lemonsqueezy.com`, `stripe.com`, `paypal.com`)
- Social media authoring surfaces (`tiktok.com` business dashboard, `x.com` compose)
- Analytics, advertising, marketing-automation dashboards
- Anywhere an agent could in principle trigger irreversible actions (charges, payouts, posts, sends, deletions)

Even with the domain allowlisted, the verifier's existing boundaries hold: no credentials, no payment entries, no irreversible action clicks. The allowlist gates access; the boundaries gate what's done with that access.

## Audit history additions

- 2026-05-11 — Domain-allowlist constraint surfaced when first non-default-domain directive (`cic_ls_store_setup_2026-05-11.md` targeting `app.lemonsqueezy.com`) was blocked at pre-flight. Skill updated with boundaries addendum above. Verifier report at `~/Desktop/8ball/controllers/verifier_report_ls_store_blocked_2026-05-11.md`.
- 2026-05-12 — Preamble updated from "v0.22 extension (proposed)" to "v0.24 extension" as part of the agents/ codification cycle (DOCTRINE v0.23 → v0.24). Sibling role docs landed: `orchestrator.md`, `implementer.md`, `auditor.md`, `controller.md`. Index doc `AGENTS.md` + platform notes `PLATFORMS.md` shipped alongside. The role doc's substance was controller-verified locally against the authored state from the prior session to be unchanged in this cycle; only the preamble citation reference and this audit entry were touched. (The file was previously untracked, so this claim is not independently auditable from git history — controller-verified locally is the audit trail.)
- 2026-05-13 — chat-15 L-mitigation cycle (c13-c14-c15 bundle). Added no-strategic-synthesis bullet to Boundaries (Clause 1, chat-13 L-candidate `CiC-scope-expansion-into-strategic-content`, 1 sighting); added "CiC directive template — standing clauses" H2 with downstream DO-NOT clause (Clause 3, chat-13 mitigation pair to Clause 1) and upstream-diagnostic gate (Clause 7, chat-14 L-candidate `controller-content-seed-defaults-mainstream` pair to controller.md content-seed routing Procedure 5 + orchestrator.md Procedure 6 register-alignment diagnostic). No DOCTRINE touch this cycle. Sibling clauses landed in same cycle: `controller.md` Procedure 5 (content-seed routing); `orchestrator.md` Procedure 6 (register-alignment diagnostic) + Procedure 7 (paper-design surface sanity check); `PLATFORMS.md` CiC per-tab scope subsection (Clause 2). Inspector sketch (`~/Desktop/8ball/sessions/inspector_sketch_2026-05-13.md`) inherits the no-strategic-synthesis boundary; sketch updated in-place per chat-15 mitigation note (not a chat-1 authoring decision).
