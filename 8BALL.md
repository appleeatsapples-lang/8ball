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

A magic 8-ball that knows you. Public-facing surface for v0.2.0 is minimal: enter name + DOB once, shake, see your seven calibrated coordinates — sun sign, Chinese five-element, public animal (year-pillar), private animal (month-pillar), life path, name number, and soul urge. The two animals pair on a single line via an equilibrium arrow (`⇌`); the three numerology numbers collapse onto a single line as a reduced triplet (concatenated when all single-digit, e.g. `777`; space-separated when any master 11/22/33, e.g. `3 11 3`). Underneath, the (sun sign, public animal) pair drives a 144-card catalog index — computed positionally by `core/engine.js` (sun-row × 12 + animal-col + 1, roman numeral). Life path drives bracket resolution (low/mid/high) within a card cell, not the catalog index. The catalog index is the only card-derived value surfaced. The card content itself (name, type, habit, note per cell) is private and lives outside this repo at `~/dev/8ball-private/`; the future paid interpretation layer will surface it.

**SIRR is the engine; 8-Ball is the deniability layer.** SIRR (sacred, private, personal) and 8ball (materialistic, public, commercial) are sibling repos. They share NOTHING in code. They share calculation rigor by example, not by import. (See `DOCTRINE.md §9`.)

**Production:** `https://the-eight-ball.netlify.app` (Netlify free tier, GitHub-connected, auto-deploys on push to main).
**Repo:** `github.com/appleeatsapples-lang/8ball` (PRIVATE as of v0.2.0 — was public through v0.1.4; flipped private to protect the future paid card-content layer).
**Stack:** static HTML/CSS/ES-modules. No build step. Vitest for tests. GitHub Actions for CI. Netlify for hosting.

---

## 2. Architecture

ONE static site. No backend. No accounts. No telemetry.

Layered source:

| Folder | Contents |
|---|---|
| `core/`           | `profile.js` (calculation), `engine.js` (card lookup) — pure functions, no DOM |
| `content/`        | (empty in public repo as of v0.2.0; was `cards.v1.js`. Card content moved to `~/dev/8ball-private/cards.v1.full.js` — future paid layer.) |
| `tests/`          | `fixtures.json` (calc contract), `profile.test.js` (engine + content), `pii_scan.test.js` (public banned-pattern audit) |
| `audits/`         | `LOCAL_PII_AUDIT.md`, `run_local_audit.sh`, `RELEASE_CHECKLIST.md` |
| `.github/workflows/` | `ci.yml` |
| (root)            | `index.html`, `netlify.toml`, `package.json`, `DOCTRINE.md`, `journal.md`, `8BALL.md`, `README.md`, `LICENSE` |

**Single-file rule:** `index.html` ≤ 1500 lines. Past that, split into `ui/*.js` ES modules.

---

## 3. Locked decisions (as of 2026-05-08)

| # | Decision | Locked value |
|---|---|---|
| 1 | Repo visibility | Private as of v0.2.0 (was public through v0.1.4; flipped to protect the future paid card-content layer) |
| 2 | Domain | netlify.app subdomain `the-eight-ball.netlify.app` (live as of 2026-05-08) |
| 3 | Product display name | `8 ball` (lowercase, space). Folder & repo: `8ball`. |
| 4 | License | MIT |
| 5 | Stack | Static + ES modules; no build step |
| 6 | Persistence | localStorage only — name + DOB; nothing else, ever |
| 7 | Telemetry | None. Permanently. |
| 8 | Calc version | v1 — Pythagorean LP w/ master 11/22/33 preserved; tropical sun; Feb 4 CNY approximation |
| 9 | Content version | v0.2.0-public (catalog-only; positional math in engine.js; full content private at `~/dev/8ball-private/cards.v1.full.js`) |
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

Operator personal data is NEVER tracked content. The repo is private as of v0.2.0, but the rule is independent of repo visibility — tracked content is the durable boundary, not the current ACL state. Two-layer audit:

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

- No slurs. Banned-pattern check in `tests/profile.test.js`.
- No medical/diagnostic framing (no "diagnosis", "syndrome", "disorder"; ironic adoption included).
- Cultural-symbol respect when drawing from any tradition (tarot, I Ching, runes, zodiac, etc.).
- No targeting minors. No real-person targets.
- Universal floor — cards land equally on a person who picked their own DOB.
- Versioned, not edited. Shipped content batches are immutable; new release = new file (e.g. `traits.v2.js`, `cards.v2.js`).
- Safety-patch carve-out: immutability protects taste discipline, not post-ship doctrine violations.

§2 voice register (no mystical / spiritual / guidance language) is enforced separately by `BANNED_VOICE_REGISTER` scan in the same test file.

If a line lands but you can't tell whether it crosses any of the above, it crosses. Cut it.

---

## 8. Workflow & gate sequence

Pre-merge (DOCTRINE.md §8 + audits/RELEASE_CHECKLIST.md):

**Automated (CI, blocking):**
1. CI green (5 stages: calc, engine, content, PII, single-file).
2. Doctrine/content change requires journal entry (`.github/workflows/ci.yml` journal-touch gate).

**Ritual (operator/reviewer):**
3. PR opened with one-line summary.
4. Local PII audit clean.
5. Diff review against §4 / §5 / §9 / §11.
6. Cross-model audit on doctrine or content changes.
7. Operator approval.

Merge → Netlify auto-deploys. Smoke-test live. Append to `journal.md`. Update `8BALL.md` if state changed.

---

## 9. Repo paths & env vars

**Canonical paths:**

- Repo: `~/dev/8ball/` (private as of v0.2.0)
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

## 10. Current state (as of 2026-05-09)

**v0.2.0 SHIPPED 2026-05-09** at `https://the-eight-ball.netlify.app`. Live commit on `main`: `2b69944` (squash-merge of Phase-2F card system + 2F-3 minimal surface strip + calc additions + secret strip + audit-3/4 dispositions). CI green. The public repo + runtime ships only seven calibrated coordinates and a positionally-computed catalog index — zero card content (name/type/habit/note) in any public file. Card content moved to private location `~/dev/8ball-private/cards.v1.full.js` for the future paid interpretation layer. **Repo flipped from public to private as of this release.** `phase-2f-1-card-engine` deleted from origin + local post-merge — cards-containing intermediate commits (a4032b9 → 7b9b99f) no longer reachable via any branch ref on origin. Animals pair on a line via `⇌`; numerology collapses to a reduced triplet. `traits.v1.js`, `templates.v1.js`, and `cards.v1.js` retired from public repo. Doctrine v0.2 → v0.3 (live-fire) → v0.4 (minimal surface) → v0.5 (six coordinates) → v0.6 (additive-vs-breaking) → v0.7 (seven coordinates) → v0.8 (presentation tightening) → v0.9 (cards privatized + positional engine) → v0.10 (audit-3 polish: catalog driver pair, CI stages aligned) → v0.11 (§4 card-content-strings forbidden in tracked files) → v0.12 (audit-4 dispositions: §11 PII rule visibility-independent + missed-spot polish). Five-audit Codex cycle cleared at audit-5 PASS/PASS/PASS.

**Past-exposure note:** Cards content (`content/cards.v1.js`, full 144-card deck) was publicly visible on `github.com/appleeatsapples-lang/8ball` at the `phase-2f-1-card-engine` branch from 2F-1 first-push (commit `a4032b9`) through repo private-flip on this release. The 2F-3 "in-flight (cont.)" journal entry incorrectly stated "branch was never pushed" — that was wrong; the branch had been on origin since 2F-1. Private flip + branch deletion bound the future exposure window; main never had cards in its history. Past exposure is sunk-cost.

**v0.1.4 SHIPPED 2026-05-08** at `https://the-eight-ball.netlify.app`. Live commit on `main`: `4aaf2d3` (squash-merge of Phase-2D · CONCERN dispositions, eight feature-branch commits collapsed). CI green (32 → **69**). Netlify auto-deploys on push; CI deploy-gating still queued for Phase-2C.

Prior milestones:
- v0.1.0 SHIPPED 2026-05-08 at `6e97b60` — initial public site.
- v0.1.1 SHIPPED 2026-05-08 at `2876385` — hex-overflow fix + multi-model lanes activated (first real Codex/ChatGPT relay).
- v0.1.2 SHIPPED 2026-05-08 at `f52345f` — §4 violations cut, §7 reality alignment, §11 PII tightening. First two-audit cycle (Codex pre-patch and post-patch) completed.
- v0.1.3 SHIPPED 2026-05-08 at `708735d` — Phase-2B doctrine consolidation: §1/§2/§4/§9 substance rewritten for post-pivot product; six §4 carve-out content cuts; §9 wording amended to match scanner; `run_local_audit.sh` bash-3.2 fix. Five-audit cycle cleared at 5/7/1 with §1 the only remaining FAIL.
- v0.1.4 SHIPPED 2026-05-08 at `4aaf2d3` — Phase-2D CONCERN dispositions: §2 banned-voice-register scan + doctrine split, §3 LP=33 fixture, §5 privacy scan, §8 journal-touch CI gate + automated/ritual doctrine split, §10 PR template, §12 dependency discipline test, §13 Friday-rule firing condition + immutability defer. Three-audit cycle (`c99a641 → 0073189 → 4aaf2d3`) cleared at **9/3/1** with §1 the only remaining FAIL (Phase-2F-bound).

History note: an earlier sequence of commits (since rewritten) shipped a labeled-DOB leak in fixtures and a discipline patch on top. Force-rewrite collapsed both into a single clean v0.1.0 commit, then the v0.1.2 patch sanitized the journal description of that leak so the shape is no longer reproduced in tracked content. Full provenance in `journal.md` and `~/Desktop/8ball/sessions/session_distillate_2026-05-08.md`.

---

## 11. Open items / next session queue

Phase-2 structure (per `journal.md` 2026-05-08 doctrine-triage entry):

1. **Phase-2A — v0.1.2 patch.** ✅ shipped 2026-05-08 at `f52345f`. §4/§7/§11 FAILs closed; Codex re-audit clean.
2. **Phase-2B — doctrine consolidation.** ✅ shipped 2026-05-08 at `708735d`. §1/§2/§4/§9 substance rewritten; six §4 carve-out content cuts; §9 wording matches scanner. Five-audit cycle cleared at 5/7/1; §1 the only remaining FAIL (bound to Phase-2F).
3. **Phase-2D — CONCERN dispositions.** ✅ shipped 2026-05-08 at `4aaf2d3`. Seven CONCERN dispositions landed (§2/§3/§5/§8 enforce, §10 enforce, §12 enforce, §13 amend+defer). Three-audit cycle (`c99a641 → 0073189 → 4aaf2d3`) cleared at **9/3/1**. The 3 residual CONCERNs (§10/§12/§13) are calibrated dispositions, not drift.
4. **Phase-2C — §7 deploy-gate wiring.** Currently doctrine-correct ("not gated, acknowledged"); flip to actually-gated when traction warrants. One Netlify console toggle + GitHub required-check.
5. **Phase-2E — card system design.** Aesthetic concentration. **Locked constraint:** monochrome / grayscale, no color hues. Captured at `~/Desktop/8ball/sessions/phase_2e_aesthetic_constraints.md`. Independent of doctrine work; can run parallel.
6. ~~Phase-2F — card system implementation.~~ ✅ shipped 2026-05-09 as v0.2.0 (Phase-2F-1 engine + UI flip + Aries sample row; Phase-2F-2 full 132-card deck integration; Phase-2F-3 minimal-surface pivot to seven coordinates + symbols-only presentation, then secret strip — `content/cards.v1.js` moved to `~/dev/8ball-private/cards.v1.full.js`, public engine computes catalog positionally with no content import). `content/traits.v1.js` and `content/templates.v1.js` retired and deleted in 2F-2; `content/cards.v1.js` retired from the public repo in 2F-3. §1 FAIL closed. Hex-overflow defect retired by specimen-aesthetic UI rewrite.

Independent / housekeeping:

7. **Cleanup: shadow Netlify project.** Two Netlify deploys connected to the repo (`the-eight-ball` ✓ canonical; `enchanting-bonbon-2b5064` ✗ shadow). 8BALL.md §2 says one. One-click delete in Netlify dashboard.
8. ~~Cleanup: branch deletion.~~ ✅ `phase-2f-1-card-engine` deleted from origin + local at v0.2.0 merge (also bounds the cards-containing-history exposure on origin). Older `v0.1.4-phase2d-concern-dispositions` cleanup remains — verify and prune if still present.
9. ~~`audits/RELEASE_CHECKLIST.md` staleness.~~ ✅ shipped at `c86970e` (audit-4 disposition); stage list aligned with §7 v0.10+, plus drift fixes for content-folder reference and post-merge smoke-test wording.
10. ~~Doctrine-version bump.~~ ✅ shipped 2026-05-09 in Phase-2F-2 as part of the §8 live-fire ritual-gate amendment. DOCTRINE.md now reads v0.3.
11. **Live-fire testing** — shake the deployed URL across all 12 sun rows post-2F-2 to confirm card variety reads cleanly. Now codified as a §8 ritual-gate sub-rule (per doctrine v0.3).
12. **Operator-personal:** add `8ball` row to `~/MUHAB.md` §6 bootstrap table (operator-only edit).

Paused / retired:

- ~~Trait pool v2 expansion (ChatGPT lane)~~ — paused indefinitely; pivot retires trait pools.
- ~~Question classifier rework~~ — likely retired by 2F card system; revisit only if pivot reverses.
- ~~Bash-3.2 fix for `audits/run_local_audit.sh`~~ — ✅ shipped at `875596b` (in v0.1.3).
- ~~`audits/local_personal_data.txt`~~ — ✅ present (operator created during v0.1.1/v0.1.2 cycle).

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
