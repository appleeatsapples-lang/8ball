# 8BALL.md — Canonical Context

**Audience:** Claude (in any chat) and any other AI working on 8ball, in any role.
**Last refreshed:** 2026-05-08.
**Companion (operator-personal):** `~/MUHAB.md` — read first for cross-project preferences.

This file is the source-of-truth for 8ball project context. Read it at the start of any 8ball work session, after `~/MUHAB.md` §1–§8. Memory is index-only; this file is canonical.

Mirrors the shape of `~/dev/SIRR/SIRR.md` deliberately. Same discipline. Smaller scope.

---

## Table of contents

1. What 8ball is
2. Architecture
3. Locked decisions
4. Lane system (multi-model)
5. Privacy & PII baseline
6. Calculation contract
7. Content rules
8. Workflow & gate sequence
9. Repo paths & env vars
10. Current state (dated)
11. Open items / next session queue
12. Where to look next
13. Refresh discipline

---

## 1. What 8ball is

A magic 8-ball that knows you. Public-facing surface is a toy: enter name + DOB once, shake or ask, get a roast. Underneath, the roast is informed by the user's sun sign, Chinese zodiac animal, and numerology life path. The depth is the trick; the trick is hidden by design.

**SIRR is the engine; 8-Ball is the deniability layer.** SIRR (sacred, private, personal) and 8ball (materialistic, public, commercial) are sibling repos. They share NOTHING in code. They share calculation rigor by example, not by import. (See `DOCTRINE.md §9`.)

**Production:** `https://the-eight-ball.netlify.app` (Netlify free tier, GitHub-connected, auto-deploys on push to main).
**Repo:** `github.com/appleeatsapples-lang/8ball` (public from day 1).
**Stack:** static HTML/CSS/ES-modules. No build step. Vitest for tests. GitHub Actions for CI. Netlify for hosting.

---

## 2. Architecture

ONE static site. No backend. No accounts. No telemetry.

Layered source:

| Folder | Contents |
|---|---|
| `core/`           | `profile.js` (calculation), `engine.js` (response generation) — pure functions, no DOM |
| `content/`        | `traits.v1.js`, `templates.v1.js` — versioned, immutable once shipped |
| `tests/`          | `fixtures.json` (calc contract), `profile.test.js` (engine + content), `pii_scan.test.js` (public banned-pattern audit) |
| `audits/`         | `LOCAL_PII_AUDIT.md`, `run_local_audit.sh`, `RELEASE_CHECKLIST.md` |
| `.github/workflows/` | `ci.yml` |
| (root)            | `index.html`, `netlify.toml`, `package.json`, `DOCTRINE.md`, `journal.md`, `8BALL.md`, `README.md`, `LICENSE` |

**Single-file rule:** `index.html` ≤ 1500 lines. Past that, split into `ui/*.js` ES modules.

---

## 3. Locked decisions (as of 2026-05-08)

| # | Decision | Locked value |
|---|---|---|
| 1 | Repo visibility | Public from day 1 |
| 2 | Domain | netlify.app subdomain `the-eight-ball.netlify.app` (live as of 2026-05-08) |
| 3 | Product display name | `8 ball` (lowercase, space). Folder & repo: `8ball`. |
| 4 | License | MIT |
| 5 | Stack | Static + ES modules; no build step |
| 6 | Persistence | localStorage only — name + DOB; nothing else, ever |
| 7 | Telemetry | None. Permanently. |
| 8 | Calc version | v1 — Pythagorean LP w/ master 11/22/33 preserved; tropical sun; Feb 4 CNY approximation |
| 9 | Content version | v1 — ~115 sun + ~85 animal + ~70 LP traits · 39 templates |
| 10 | Single-source-of-truth for content rules | DOCTRINE.md §4 |
| 11 | Single-source-of-truth for PII rules | DOCTRINE.md §11 + `audits/LOCAL_PII_AUDIT.md` |
| 12 | Multi-model lanes | DOCTRINE.md §10 (mirrors SIRR §7 pattern at smaller scale) |

---

## 4. Lane system (multi-model)

Per `DOCTRINE.md §10`. Brief summary:

- **Claude (chat)** = orchestrator, doctrine drafter, brief composer. Pragmatic write access for fast initial work; routes through CC for production-grade edits.
- **Claude Code (CC)** = the CLI tool at `/usr/local/bin/claude` (currently v2.1.42 per MUHAB.md §4). Filesystem and git operations for changes touching ≥3 files or modifying `core/`.
- **ChatGPT** (Mac desktop app) = content-batch review. Trait pool diffs, template diffs. Manual paste-and-relay.
- **Codex** (Mac desktop app) = adversarial pre-merge auditor for doctrine and release-gate changes. Manual paste-and-relay.
- **Operator** = final approver, merge gate.

**Solo authority is the failure mode.** Doctrine and content batches do not merge without a second model's review.

---

## 5. Privacy & PII baseline

**Privacy primitive (DOCTRINE.md §5):**

The product persists exactly two pieces of user data: `name` (string) and `dob` (ISO date), in `localStorage` only, on the user's own device. Nothing else is stored or transmitted.

**PII rule (DOCTRINE.md §11):**

The repo is public. Operator personal data is NEVER tracked content. Two-layer audit:

1. **Public CI scan** (`tests/pii_scan.test.js`) — operator name, SIRR cross-references, labeled-DOB shapes.
2. **Local audit** (`audits/run_local_audit.sh`) — operator's personal-data file (gitignored), grepped against tracked content before push.

**Fixture DOB sub-rule (§11):** Fixture DOBs are chosen for the calc path they exercise, never anchored to a real person. If a calc path needs a real-person DOB to land, shift it by 12 years (preserves zodiac animal + LP mod-9, breaks the anchor).

---

## 6. Calculation contract

`core/profile.js` is the calculation core. Calc version v1:

- **Sun sign:** Western tropical zodiac at standard cusps (Aries Mar 21–Apr 19, etc.).
- **Chinese zodiac animal:** 12-year cycle anchored to 2020 = Rat. Cutoff approximated at Feb 4 (real lunar tables = future work).
- **Life path:** Pythagorean. Sum digits of YYYY-MM-DD, reduce until ≤9 OR a master number (11/22/33) is hit.
- **Name number:** Pythagorean letter values (a=1..i=9, j=1..r=9, s=1..z=8), summed and reduced like life path.

**Contract:** Any change to algorithm OR fixtures triggers the gate sequence in DOCTRINE.md §3.

---

## 7. Content rules (DOCTRINE.md §4)

- Roast, not insult.
- No slurs. No protected classes. No real-person targets. No minor-targeting.
- Self-applied universal traits only.
- Versioned, not edited. Shipped pools are immutable; new release = new file (`traits.v2.js`).

If a line is funny but might cross any rule, it crosses. Cut it.

---

## 8. Workflow & gate sequence

Pre-merge (DOCTRINE.md §8 + audits/RELEASE_CHECKLIST.md):

1. CI green (5 stages: calc, engine, content, PII, single-file).
2. Local PII audit clean.
3. Diff review against §4 / §5 / §9 / §11.
4. Cross-model audit on doctrine or content changes.
5. Operator approval.

Merge → Netlify auto-deploys. Smoke-test live. Append to `journal.md`. Update `8BALL.md` if state changed.

---

## 9. Repo paths & env vars

**Canonical paths:**

- Repo: `~/dev/8ball/` (public)
- Desktop materializations: `~/Desktop/8ball/` (sessions, audits, demos — separate from code; mirrors `~/Desktop/SIRR/` pattern)
- This file: `~/dev/8ball/8BALL.md`

**No env vars** (static site, no backend, no secrets).

**Proven shell patterns** (inherit from MUHAB.md §2.6):

- Open URL: `open -a "Google Chrome" <url>`
- Local server: `npm run dev` (npx serve on :5173)
- Run tests: `npm test` (vitest)
- Run local audit: `bash audits/run_local_audit.sh`
- Open repo on GitHub: `open https://github.com/appleeatsapples-lang/8ball`

---

## 10. Current state (as of 2026-05-08)

**v0.1.2 SHIPPED 2026-05-08** at `https://the-eight-ball.netlify.app`. Live commit on `main`: `f52345f` (squash-merge of doctrine-triage + agentic tooling + Phase-2A patch). CI green (32/32). Netlify auto-deploys on push; CI gating is queued for the first-traction milestone (see DOCTRINE.md §7).

Prior milestones:
- v0.1.0 SHIPPED 2026-05-08 at `6e97b60` — initial public site.
- v0.1.1 SHIPPED 2026-05-08 at `2876385` — hex-overflow fix + multi-model lanes activated (first real Codex/ChatGPT relay).
- v0.1.2 SHIPPED 2026-05-08 at `f52345f` — §4 violations cut, §7 reality alignment, §11 PII tightening. First two-audit cycle (Codex pre-patch and post-patch) completed.

History note: an earlier sequence of commits (since rewritten) shipped a labeled-DOB leak in fixtures and a discipline patch on top. Force-rewrite collapsed both into a single clean v0.1.0 commit, then the v0.1.2 patch sanitized the journal description of that leak so the shape is no longer reproduced in tracked content. Full provenance in `journal.md` and `~/Desktop/8ball/sessions/session_distillate_2026-05-08.md`.

---

## 11. Open items / next session queue

Phase-2 structure (per `journal.md` 2026-05-08 doctrine-triage entry):

1. **Phase-2A — v0.1.2 patch.** ✅ shipped 2026-05-08 at `f52345f`. §4/§7/§11 FAILs closed; Codex re-audit clean.
2. **Phase-2B — doctrine consolidation.** Retire §1/§2/§9 (the surface-narration cluster being dissolved by the roast→deck product pivot). Rewrite §4 for card content (no medical/diagnostic framing; cultural-symbol respect if cards draw from any tradition). Revisit §10's "v1 immutable" rule under format pivot. Codex re-audit before merge. Target: 9+ PASS, FAIL ≤ 1.
3. **Phase-2C — §7 deploy-gate wiring.** Currently doctrine-correct ("not gated, acknowledged"); flip to actually-gated when traction warrants. One Netlify console toggle.
4. **Phase-2D — CONCERN dispositions** for §3 (no 33 fixture), §5 (no static gate against new storage/fetch), §8 (release ritual operator-only), §10 (lanes procedural not enforced), §12 (out-of-scope partial enforcement), §13 (Friday rule-kill not yet fired). Each gets enforcement-added or rule-amended-to-match-reality or rule-killed.
5. **Phase-2E — card system design.** Aesthetic concentration. **Locked constraint:** monochrome / grayscale, no color hues. Captured at `~/Desktop/8ball/sessions/phase_2e_aesthetic_constraints.md`. Independent of doctrine work; can run parallel.
6. **Phase-2F — card system implementation.** Engine + UI rewrite, content layer pivot. Retires `content/traits.v1.js` and `content/templates.v1.js`. Adds `content/cards.v1.js` + `assets/cards/`. Fixtures update. CC lane.

Independent / housekeeping:

7. **Bash-3.2 fix for `audits/run_local_audit.sh`** — script uses `mapfile` (bash 4+); breaks on macOS default shell. Rewrite to POSIX `while read` loop. Single-file shell-script edit, chat-lane authority.
8. **Live-fire testing** — shake the deployed URL repeatedly to surface flavor-repeats or weak lines. Likely retired by 2F pivot, but worth one round on the current pool while it's still live.
9. **Operator-personal:** create `audits/local_personal_data.txt` if not present (pattern file is gitignored; this Claude can already read it via Desktop Commander, so the operator-vigilance gap §11 names is partly closed by orchestrator-side tooling).
10. **Operator-personal:** add `8ball` row to `~/MUHAB.md` §6 bootstrap table. Operator-only edit.

Paused / retired:

- ~~Trait pool v2 expansion (ChatGPT lane)~~ — paused indefinitely; pivot retires trait pools.
- ~~Question classifier rework~~ — likely retired by 2F card system; revisit only if pivot reverses.

---

## 12. Where to look next

| Need | File |
|---|---|
| Constitution (read every release) | `DOCTRINE.md` |
| Calc contract fixtures (lock) | `tests/fixtures.json` |
| Public PII scan rules | `tests/pii_scan.test.js` |
| Local PII audit procedure | `audits/LOCAL_PII_AUDIT.md` |
| Release checklist | `audits/RELEASE_CHECKLIST.md` |
| Session log (append-only) | `journal.md` |
| User-facing description | `README.md` |
| Operator-personal preferences | `~/MUHAB.md` |
| SIRR canonical context (sibling project) | `~/dev/SIRR/SIRR.md` |
| Desktop materializations (sessions, audits) | `~/Desktop/8ball/` |

---

## 13. Refresh discipline

This file is **maintained by hand**, not generated. Update when:

- A locked decision in §3 changes
- A canonical path changes
- A doctrine version locks (§3 row 12)
- A blocker is resolved or added
- A new tool/relay is automated

**Friday rule-kill review:** same as SIRR.md and DOCTRINE.md §13. Locked rules that haven't fired in 30 days → archive.

If state in §10 looks more than 30 days old, verify against source-of-truth before acting on it.
