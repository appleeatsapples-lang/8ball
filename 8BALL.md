# 8BALL.md — Canonical Context

**Audience:** Claude (in any chat) and any other AI working on 8ball, in any role.
**Last refreshed:** 2026-07-03.
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
10. Current state (journal pointer + standing notes)
11. Open items / next session queue
12. Where to look next
13. Refresh discipline

---

## 1. What 8ball is

A magic 8-ball that knows you. **Current-surface spec: read `README.md` (top paragraph) + `DOCTRINE.md §1.D` (tier ladder, as amended through v0.38) + `DOCTRINE.md §1.G` (coordinate meanings, v0.44) FIRST — this paragraph is orientation, not the spec, and defers to those on any disagreement.** Enter name + DOB once, optionally add birth time + city (autocomplete from `assets/cities.json`, sets IANA tz + lat + lng atomically — see DOCTRINE §1.A v0.21), shake. The free card surfaces five calibrated coordinates from the date of birth alone — tarot birth card, sun sign, public animal (year-pillar), life path, catalog numeral — rendered on a constant compartment specimen sheet (§1.D v0.37): every coordinate has a cell, and cells above the device's tier show as sealed hatches (withheld, not absent). Four of those five (all but the catalog numeral) are tappable to a static tradition-cited meaning entry (§1.G v0.44). Three paid rungs ($3 / $6 / $9 — §1.D v0.36) open the rest of the sheet; the name enters the math at the first rung: t1 = rising sign (when computable) · five-element · private animal (month-pillar) · the name-derived numerology pair (name number + soul urge); t2 = + personality · birthday · maturity · day pillar; t3 = + hour pillar · the written 144-card entry. Underneath, the (sun sign, public animal) pair drives a 144-card catalog index — computed positionally by `core/engine.js` (sun-row × 12 + animal-col + 1, roman numeral). All other coordinates are surface-only and never enter the catalog driver; life path drives bracket resolution (low/mid/high) within a card cell, not the catalog index. The card content (name, type, habit, note per cell × low/mid/high brackets) ships in the public bundle at `content/cards.v1.full.js`, JS-gated per DOCTRINE §1 v0.22 / §4.B / §5.C — the written entry opens at t3; private authoring source is preserved at `~/dev/8ball-private/cards.v1.full.js`.

**Metaphorically: SIRR is the engine, 8-Ball is the deniability layer. Architecturally: siblings — no code shared, no imports.** "Deniability layer" is a privacy/identity split — 8ball public + materialistic, SIRR unnamed + private — not a status claim: it does NOT require 8ball to stay small, hidden, or unserious; 8ball may stand as a first-class public object (v0.35). The load-bearing rule is `DOCTRINE.md §9` (no SIRR string in tracked content), which is unchanged. SIRR (sacred, private, personal) and 8ball (materialistic, public, commercial) are sibling repos. They share NOTHING in code. They share calculation rigor by example, not by import. (See `DOCTRINE.md §9`.)

**Production:** `https://the-eight-ball.netlify.app` (Netlify free tier, GitHub-connected, auto-deploys on push to main).
**Repo:** `github.com/appleeatsapples-lang/8ball` (PRIVATE as of v0.2.0 — was public through v0.1.4; flipped private to protect the future paid card-content layer).
**Stack:** static HTML/CSS/ES-modules. No build step. Vitest for tests. GitHub Actions for CI. Netlify for hosting.

---

## 2. Architecture

ONE static site. No backend. No accounts. No telemetry.

Layered source:

| Folder | Contents |
|---|---|
| `core/`           | `profile.js` (calc — sun, animals, life path, name number, soul urge, personality, birthday, maturity; aggregates `birthCard` / `dayPillar` / `hourPillar`), `engine.js` (positional catalog + bracket resolution), `rising.js` (ascendant math), `birthcard.js` (Major Arcana birth card — added v0.5.0), `pillars.js` (day + hour BaZi pillars, stem+branch+element — added 2026-05-31, build A; surface-only/paid-reserved, never enters the catalog), `countries.js` (legacy v0.2.1 fixed-offset country entries — backward-compat for stored profiles), `calendar.js` (Meeus lunar new year + solar terms 1900–2100), `cities.js` (city autocomplete loader for `assets/cities.json`), `payments.js` (pure state machine — `isNewPair`, `nextShakeState`, `applyPaidReturn`). Pure functions, no DOM. |
| `ui/`             | 7 modules: `payments.js` (paywall modal controller + `?paid=t1` handler — v0.3.0), `profile.js` (profile persistence + form helpers — v0.3.0), `share.js` (free-card → on-device PNG → Web Share / clipboard fallback — v0.4.0), `tiers.js` (v0.7.0 compartment-card render + `shareRowRefs` + provenance/atlas placards + `tierDensitySummary` — DOCTRINE §1.D/§1.E/§1.F), `labels.js` (symbol-label toggle — §6 split, Cycle A), `meanings.js` (tappable coordinate meanings, injects its own panel/CSS — §1.G v0.44), `modals.js` (about/forget/18+-gate controllers + escape-to-close — §6 split, CLP cut 1). DOM-touching ES modules with `init*UI({refs}, {hooks})` DI shape per DOCTRINE §6 v0.23. |
| `content/`        | `cards.v1.full.js` (144-card deck — name/type/habit/note × low/mid/high brackets — public-bundled as of v0.3.0; JS-gated by `eight_ball_credits_v1` per DOCTRINE §1 v0.22 / §4.B / §5.C; private authoring source preserved at `~/dev/8ball-private/cards.v1.full.js`). |
| `tests/`          | vitest test files + `fixtures.json` (file/case counts live in CLAUDE.md "Repository shape" — canonical — and the newest journal entry; this row is thematic, not an inventory): calc + engine pipeline (`profile`, `rising`, `cities`, `countries`, `numerology_display`, `labels_reveal`, `age_gate`, `dob_validation`, `payments_markup`, `tiers`); privacy (`privacy_scan`); PII (`pii_scan`); dependency discipline (`dependency_discipline`); payments state machine (`payments_state`); feedback surface (`feedback_surface`); share surface (`share_surface`); tarot birth-card (`birthcard`); rising-input disclosure (`rising_disclosure`); four-pillars day+hour (`pillars`); prose coordinate-count (`prose_coordinate_count`); CLP legibility surfaces (`provenance` §1.E, `atlas` + `density` §1.F); §6 modal split (`modals`); reach surface (`reach_surface` — §2 indexable-voice + canonical/JSON-LD/robots/sitemap/og-asset pins). See DOCTRINE §7 for the 6-stage CI breakdown. |
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
| 6 | Persistence | localStorage only — see DOCTRINE §5 for the canonical allow-list (profile payload `eight_ball_profile_v1` containing name + DOB + optional rising inputs `time`/`city`/`cc`/`tz`/`lat`/`lng`; behavior flags for age-ack / labels-revealed / tries-used / credits / pending-profile; purchased tier `eight_ball_tier_v1` — highest purchased rung per §1.D, monotonic, absent = free). No derived profile stored. |
| 7 | Telemetry | No third-party / client telemetry. Permanently. (First-party server-side host logs are not telemetry — DOCTRINE §5.) |
| 8 | Calc version | v2 — Pythagorean LP w/ master 11/22/33 preserved; tropical sun; real lunar new year + solar-term tables (1900–2100, Asia/Shanghai date-precision) |
| 9 | Content version | v0.3.0-public-tier-1 (catalog + JS-gated card-content layer at `content/cards.v1.full.js`; compartment specimen-sheet render at every tier — sealed cells carry row/label structure, never values (§1.D v0.37); free surface = five DOB-derived coordinate values (§1.D v0.38) — tarot birth card (Major Arcana numeral + name, digit-sum reduction, §1.C, v0.5.0) · sun · public animal (year) · life path · catalog numeral; four of those five are tappable to a static tradition-cited meaning entry at `content/meanings.v1.js` (§1.G v0.44 — catalog excluded, that compound reading is the t3 paid entry); three-rung paid ladder (§1.D v0.36): t1 = rising (when computable) · five-element · private animal (month) · name-derived numerology pair (name number + soul urge, §1.D v0.38 / §1.B v0.43 — the pre-v0.38 text triplet is superseded lineage); t2 = + personality · birthday · maturity number trio · day pillar; t3 = + hour pillar · the written 144-card entry (name/type/habit/note × low/mid/high), gated by paid credits per §1 v0.22 / §4 v0.22 / §4.B / §5.C; symbol-label visibility toggle; provenance placards (per-coordinate derivation note, labels-gated, surface-only, §1.E v0.40); atlas system-name legend (per-coordinate, labels-gated, §1.F v0.41); density census (always-on result-rail aggregate, off-PNG, §1.F v0.41); opt-in feedback surface §5.B Call 1; Gumroad Buy Link redirect §5.B Call 2 (LS path retired v0.3.0.3); 18+ acknowledgment gate §4.A; three-free-tries cap §4.B; content-delivery transparency §5.C; share surface §5.D — full specimen sheet (open coordinate values + sealed-compartment hatch structure) + catalog + wordmark → on-device PNG, Web Share API with a clinical caption, v0.39; private authoring source preserved at `~/dev/8ball-private/cards.v1.full.js`) |
| 10 | Single-source-of-truth for content rules | DOCTRINE.md §4 |
| 11 | Single-source-of-truth for PII rules | DOCTRINE.md §11 + `audits/LOCAL_PII_AUDIT.md` |
| 12 | Multi-model lanes | DOCTRINE.md §10 + `agents/AGENTS.md` (5 core agents — orchestrator/implementer/auditor/verifier/inspector — plus controller; adjuncts: ChatGPT/Perplexity/Gemini per `~/MUHAB.md` §3). Mirrors SIRR §7 pattern at smaller scale. |

---

## 4. Lane system (multi-model)

Per `DOCTRINE.md §10` (constitutional summary) and `agents/AGENTS.md` (operational detail). Five core agent roles plus one always-on controller, plus ad-hoc adjuncts. Brief summary:

- **Orchestrator** = Claude (chat). Holds context, drafts briefs, dispositions audits, sequences cycles. Codename `كن فيكون` / `kun fayakun`. Full role doc: `agents/orchestrator.md`.
- **Implementer** = Claude Code (CC) — CLI tool at `/usr/local/bin/claude` (v2.1.42 per MUHAB.md §4). Multi-file production-grade edits, git ops, repo filesystem. Required for changes touching ≥3 files or modifying `core/`. Full role doc: `agents/implementer.md`.
- **Auditor** = Codex (Mac desktop app). Adversarial pre-merge review on doctrine, content, release-gates. Manual paste-and-relay. Returns categorized verdicts (PASS / P3 / P2 / P1 / P0). Full role doc: `agents/auditor.md`.
- **Verifier** = Claude in Chrome (CiC) — browser extension. Live UX on deployed product; structured findings + screenshots. Per-session domain allowlist; no irreversible action clicks. Full role doc: `agents/verifier.md`.
- **Inspector** = Claude in Chrome (CiC) + osascript + operator-screenshot adjacents. Read-only state on operator-controlled third-party dashboards (Gumroad, Netlify, GitHub, social — IG / TikTok / Threads). Structured observations; no irreversible action clicks, no credentials, no terms acceptance. Promoted from sketch v0.29 (chat-29 2026-05-16). Full role doc: `agents/inspector.md`.
- **Controller** = Operator. Always-on final approver for merges, deploys, payments, account changes, irreversible actions. Not an agent — the human running them. Full role doc: `agents/controller.md`.

**Adjunct lanes** (not core agents): ChatGPT (content/copy review), Perplexity (web search), Gemini (second opinion). Per MUHAB.md §3.

**Solo authority is the failure mode.** Doctrine and content batches do not merge without the auditor + the controller. Per L48: explicit audit-cleared signal before merge; five-minute-CI-green-to-merge windows are the L48 failure shape.

Per-cycle artifact locations (briefs, audit briefs/responses, CiC directives/reports) live at `~/Desktop/8ball/` — see `agents/PLATFORMS.md` "Artifact-location matrix" for the full table.

---

## 5. Privacy & PII baseline

**Privacy primitive (DOCTRINE.md §5):**

The product persists only user-entered profile fields in `localStorage`, on the user's own device. The canonical allow-list lives in DOCTRINE §5; the shipped scope is: profile payload `eight_ball_profile_v1` containing `name` + `dob` + optional rising-sign inputs (`time`, `city`, `cc`, `tz`, `lat`, `lng` — city-level birthplace via `assets/cities.json` since v0.21); plus behavior flags `eight_ball_age_ack_v1` (§4.A 18+ ack), `eight_ball_labels_revealed_v1` (symbol-label toggle preference); plus paid state `eight_ball_tries_used_v1` (§4.B free-tries counter), `eight_ball_credits_v1` (paid credits balance), `eight_ball_pending_profile_v1` (transient pending-profile payload for paid round-trip per §5.B Call 2), `eight_ball_tier_v1` (highest purchased rung per §1.D — monotonic, never downgrades; absent = free). No derived profile is stored or transmitted; recomputed on each load.

**PII rule (DOCTRINE.md §11):**

Operator personal data is NEVER tracked content. The repo is private as of v0.2.0, but the rule is independent of repo visibility — tracked content is the durable boundary, not the current ACL state. Two-layer audit:

1. **Public CI scan** (`tests/pii_scan.test.js`) — operator name, SIRR cross-references, labeled-DOB shapes.
2. **Local audit** (`audits/run_local_audit.sh`) — operator's personal-data file (gitignored), grepped against tracked content before push.

**Fixture DOB sub-rule (§11):** Fixture DOBs are chosen for the calc path they exercise, never anchored to a real person. If a calc path needs a real-person DOB to land, shift it by 12 years (preserves zodiac animal + LP mod-9, breaks the anchor).

---

## 6. Calculation contract

`core/profile.js` is the calculation core. Calc version v2 (since v0.2.7.1):

- **Sun sign:** Western tropical zodiac at standard cusps (Aries Mar 21–Apr 19, etc.).
- **Chinese zodiac animal:** 12-year cycle anchored to 2020 = Rat. Year-pillar cusp is real lunar new year (Asia/Shanghai date-precision); month-pillar (`innerAnimal`) cuts at the 12 jieqi that start animal months. Tables span 1900–2100, computed via Meeus astronomical algorithms in `core/calendar.js`. Replaces the v1 Feb-4 fixed-cutoff approximation.
- **Life path:** Pythagorean. Sum digits of YYYY-MM-DD, reduce until ≤9 OR a master number (11/22/33) is hit.
- **Name number:** Pythagorean letter values (a=1..i=9, j=1..r=9, s=1..z=8), summed and reduced like life path.
- **Personality:** Pythagorean consonant sum, reduced like name number.
- **Birthday:** Day-of-month, reduced with master 11/22/33 preserved.
- **Maturity:** Life-path sum plus name-number sum, reduced with master 11/22/33 preserved.

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
1. CI green (6 stages per DOCTRINE §7: calc+engine pipeline / privacy / PII / dependency discipline / single-file / payments state machine).
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

## 10. Current state (journal pointer + standing notes)

**`journal.md` (newest entry on top) is authoritative for the ship-by-ship history AND current state — read its newest entry first; per CLAUDE.md it wins over this section when they disagree.** §10 carries NO dated state — no "as of" line, no doctrine version, no in-flight campaign. Each of those rotted here on a slower cadence than the journal (the v0.32 "prune-discipline" lesson, re-confirmed by the 2026-07-03 codex full-project audit F04); only the standing branch/lab notes below live in this section. For the live `main` SHA, the current doctrine version, and the latest ships, read the journal's newest entries.

**Interrogation lab — DELETED 2026-07-04 (was BRANCH-ONLY, NEVER MERGES, closed 2026-06-26).** A derivation-trace + LLM-"clerk" experiment on `prototype/interrogation-layer` (six commits over an old main base; the live surface `index.html`/`core/`/`ui/`/`content/` was byte-identical to main — the changed set was 12 lab/config/test files only, ran via a Netlify function with all math computed locally before any model call). Was accepted as a **learning artifact only**; carried a known-open **G3 P2** finding (12 of 45 adversarial-payload probes still slipped the trace-integrity validator) that was never going to close without rebuilding the engine inside the validator. Per direction given 2026-07-04, purged rather than hardened further — the branch is deleted, not merged; the six commits are preserved at git tag `archive/interrogation-layer-purged-2026-07-04` (git history, not this repo's tracked content) rather than deleted outright, per this project's own archive-don't-delete discipline. **`origin` no longer carries `prototype/interrogation-layer`** — every prior journal/8BALL reference to it as an "intentional" second branch on origin is now historical. Superseded same-day by DOCTRINE §1.G's static tradition-cited meanings surface (see journal 2026-07-04), which was the direct replacement direction chosen over hardening the lab further.

**Standing strategic stance — orchestrator dissent, on record since v0.38:** reach is the verified bottleneck (the 06-15 read — genuine reach is ~2 orders of magnitude off the ~2–3k tripwire); conversion is not the constraint at current N. Surface/legibility work (the tier ladder, free-surface composition, the Coordinate Legibility Pack) does not move reach — flag any future cut framed as a *measured conversion fix*.

**Repo-history standing note:** the repo is private as of v0.2.0; the 144-card deck was briefly public on the since-deleted `phase-2f-1-card-engine` branch (2F-1 through the v0.2.0 private-flip) — sunk-cost, and `main` never carried cards in its history. The PII boundary is *tracked content*, independent of repo visibility (DOCTRINE §11).


---

## 11. Open items / next session queue

Phase-2 structure (per `journal.md` 2026-05-08 doctrine-triage entry):

1. **Phase-2A — v0.1.2 patch.** ✅ shipped 2026-05-08 at `f52345f`. §4/§7/§11 FAILs closed; Codex re-audit clean.
2. **Phase-2B — doctrine consolidation.** ✅ shipped 2026-05-08 at `708735d`. §1/§2/§4/§9 substance rewritten; six §4 carve-out content cuts; §9 wording matches scanner. Five-audit cycle cleared at 5/7/1; §1 the only remaining FAIL (bound to Phase-2F).
3. **Phase-2D — CONCERN dispositions.** ✅ shipped 2026-05-08 at `4aaf2d3`. Seven CONCERN dispositions landed (§2/§3/§5/§8 enforce, §10 enforce, §12 enforce, §13 amend+defer). Three-audit cycle (`c99a641 → 0073189 → 4aaf2d3`) cleared at **9/3/1**. The 3 residual CONCERNs (§10/§12/§13) are calibrated dispositions, not drift.
4. **Phase-2C — §7 deploy-gate wiring.** Currently doctrine-correct ("not gated, acknowledged"); flip to actually-gated when traction warrants. One Netlify console toggle + GitHub required-check.
5. **Phase-2E — card system design.** Aesthetic concentration. **Capture closed 2026-05-15** (chat-22): all six open questions resolved — three by operator pick (mono-face = all-mono, type-scale ratio = 1.25 major-third, hairline = `#888` neutral mid-gray) and three by Claude default + operator non-override (three-tier graduated reduced-motion fallback, motion locus = card-stage carries the settle + SHAKE button press-compression-only, card max-width fixed 360–420px range with no card-back per field-guide consistency). **Locked constraints:** monochrome / grayscale, no color hues; specimen / field-guide / catalog-card aesthetic register (mono type, cream paper stock `#ebe5d4`, hairline borders, label-field grammar); rule-cool `#888` / labels-warm `#7a7470` tonal asymmetry is load-bearing; modular spacing rhythm 4/8/12/16/24/32/48px; motion grammar = spring physics + soft settle + 250–400ms reveal beat (not crossfade / not instant / not slide); reference lineage = modern tarot deck typography · brutalist editorial print · field-guide / museum specimen grammar · print-first divination/symbol books (explicitly NOT SaaS-premium / crypto-oracle / wellness / "modern AI product" tropes). Canonical at `~/Desktop/8ball/sessions/phase_2e_aesthetic_constraints.md`. **First consumption:** v0.3.1 cycle — CSS variable block declaration in `index.html` `<style>` + facet-transition motion grammar; brief v0.3 §12 (chat-23 additive pass at `~/Desktop/8ball/sessions/brief_v031_facet_reroll.md`) carries the orchestrator-level binding table. Subsequent surface cycles inherit. Independent of doctrine work; can run parallel.
6. ~~Phase-2F — card system implementation.~~ ✅ shipped 2026-05-09 as v0.2.0 (Phase-2F-1 engine + UI flip + Aries sample row; Phase-2F-2 full 132-card deck integration; Phase-2F-3 minimal-surface pivot to seven coordinates + symbols-only presentation, then secret strip — `content/cards.v1.js` moved to `~/dev/8ball-private/cards.v1.full.js`, public engine computes catalog positionally with no content import). `content/traits.v1.js` and `content/templates.v1.js` retired and deleted in 2F-2; `content/cards.v1.js` retired from the public repo in 2F-3. §1 FAIL closed. Hex-overflow defect retired by specimen-aesthetic UI rewrite.
7. ~~Phase-2G-1 — rising sign + country auto-fill.~~ ✅ shipped 2026-05-09 as v0.2.1 at `f3666cb`. Eighth surface coordinate (rising) on line 2 as `${sun} ↑ ${rising}` when full opts present; else bare sun sign. `core/rising.js` (Meeus ascendant, 86 lines, three reference cases anchored to <0.01° vs astro.com); `core/countries.js` (276 entries, 1-decimal centroids, ISO 3166-1 + multi-tz country zones); `core/profile.js` extended additively. Two-audit Codex cycle cleared at audit-2 PASS clean. DOCTRINE v0.12 → v0.14 (new §1.A: rising is surface-only, lat/lng auto-fill semantics codified). `phase-2g-1-rising-sign` deleted post-merge.
8. ~~Phase-2G-2 — hexagon polygon (line-4 numerology replacement).~~ ✅ shipped 2026-05-09 as v0.2.2 at `fa552ca`. Replaced the line-4 numerology triplet with an inline SVG hexagon — six vertices = Life Path, Expression, Personality, Maturity, Soul Urge, Birthday. Personality, Birthday, and Maturity are new additive calc fields; the surface change is breaking-on-render but catalog math remains unchanged. **Surface reverted in v0.2.3** (2026-05-10) — line 4 returned to text triplet `[life path, expression, soul urge]`; calc additions (personality, birthday, maturity) retained on `buildProfile` as data-only, reserved for v0.3.0+ paid surfacing.
9. ~~**v0.3.0 — paid interpretation layer.**~~ ✅ shipped 2026-05-11 as v0.3.0 at `f955607` (10 commits / 11 steps squash-merged from `v0.3.0-depth-unlock`). Three-free-tries cap; $3 buys three reads with depth content unlocked (name, type, habit, bracket-resolved note from public-bundle `content/cards.v1.full.js`); Lemon Squeezy hosted-redirect checkout via plain `<a href>` Buy Link; β try-counting (re-shake same profile is idempotent); pending-profile mechanic for paywall-trigger round-trip; `try another` clears form display without wiping storage. DOCTRINE v0.21 → v0.22 → v0.23. Codex pre-merge audit at step-6 seam cleared 8 PASS / 2 P1 / 0 P0 (absorbed at step 7); full-PR audit post-merge returned 4 PASS / 2 P1 / 4 P2 / 0 P0; two P1s shipped as v0.3.0.1 follow-up (cherry-pick of `b25321e`). LS Test→Live swap operator-paced — LS account in identity verification as of ship time; verify-then-Live sequence independent of v0.3.0's merge timing. Tier ladder ($6/6 at v0.3.1+, $9/9 at v0.3.2+) reserved in §10.2 of the brief; localStorage schema admits `tier_v1` field without migration.
10. **Deferred 2G-3+ candidates.** Moon sign · day-pillar animal · lunar phase · ~~birth card~~ (**birth card SHIPPED 2026-05-30 as v0.5.0** — Major Arcana free coordinate, lead row, DOCTRINE §1.C; see §10). Locked decisions in `~/Desktop/8ball/sessions/queue_post_2G2_candidates.md`. Surface-density flag fired 2026-05-09 (free-tier trajectory: 7 → 8 → 11 → 15 coords); operator chose to stabilize at 11 post-hexagon and pivot to interpretation/paid layer. Held behind v0.3.0; may not return.

11. **v0.3.1 — SHAKE AGAIN facet re-roll (paid-surface depth re-roll).** Design-locked chat-12 (2026-05-13); taxonomy locked chat-13 (2026-05-13). Paper-design pass + cycle brief + calibration trial-run on disk: `~/Desktop/8ball/sessions/v0.3.x_shake_again_facet_reroll.md` (parking doc, chat-6 + chat-12 + chat-13 layers) + `~/Desktop/8ball/sessions/brief_v031_facet_reroll.md` (cycle brief v0.4, chat-24 self-audit absorb pass on 2026-05-15 — closed 3 P1 + 2 P2 from `~/Desktop/8ball/audits/orchestrator_self_audit_brief_v031_2026-05-15.md`: ship-gate wording refreshed against `v031_ship_gate_respec.md` canonical + 4-step LS activation flow; `habit` single-string lock per chat-13 surfaced in §1 / §5 / ChatGPT PROMPT schema; `.gitignore` carve-out amendment step added to §6 CC PROMPT + coordinated DOCTRINE §4 (b) cover; §5/§6 paste-target paths corrected `sessions/` not `audits/`; §7 Audit 1 verdict format corrected to standard Procedure 4. Predecessor v0.3 chat-23 Phase-2E alignment additive pass added §12 orchestrator-level binding table + CC PROMPT Phase-2E subsection + Codex Audit 3 adherence hook + ~5 token-assertion tests in `tests/payments_markup.test.js`; three-lane scope: ChatGPT authoring + CC implementer + Codex audit with extractable PROMPT START/END blocks per lane) + `~/Desktop/8ball/sessions/v0.3.1_taxonomy_trial_run_aries_rat.md` (chat-13 two-cell stress-test on `aries/i` + `cancer/xlii`). Sub-path c.2 locked (re-author existing 3 brackets per cell as lateral lenses); all 5 listed sub-decisions resolved with recommendations (selection rule = round-robin no-immediate-repeat; first-shake anchor = LP-bracket-derived; storage = new `eight_ball_facet_index_v1` key). **Sub-decision #6 (lateral facet taxonomy, added chat-12) LOCKED chat-13 2026-05-13 = outward / inward / returning** — Facet I (the move outward, archetype expresses to others / in action), Facet II (the move inward, archetype expresses to self / private), Facet III (the move returning, archetype meets the same energy in others / relational mirror); equal in standing, no hierarchy. Universal across all 144 cards. Brand-fit clean with @eczaki tagline. Calibration trial-run on `aries/i` "the receipt runner" + `cancer/xlii` "the locked tide" surfaces an authoring risk on inward-tilted archetypes (water signs + Snake/Rabbit/Pig animals — facet collapse into paraphrase) pre-flagged for the ChatGPT authoring brief; `habit` confirmed single-string (authoring scope holds at 432 lines, not 864). Doctrine amendment text tightened chat-12 with routing correction (chat-6 parking doc's "§6.5/§7.1 amendment" framing referenced non-existent subclauses — β-idempotence currently lives only as a test invariant in §7 stage 6, never doctrine-codified): NEW §1.C (paid-surface facet rotation, mirrors §1.A rising / §1.B numerology surface-clause pattern) + surgical edits at §4 v0.22 amendment text / §5 allow-list / §7 stages 1+3+6. Bump v0.27 → v0.28 proposed. Schema migration `cards.v1.full.js` → `cards.v2.full.js` per §4 immutability. **Ship-gate: signal-gated, not time-gated** — requires (a) ✅ taxonomy lock on sub-decision #6 (closed chat-13 2026-05-13), (b) **✅ CLOSED 2026-05-16** live payment processor activation cleared AND tier-1 product live — via Gumroad path (DOCTRINE §5.B Call 2 v0.28 codifies the LS→Gumroad processor swap; Gumroad Stripe Connect verification cleared 2026-05-16 per `~/Desktop/8ball/audits/gumroad_post_confirm_recheck_2026-05-16.md` CiC firing #8 PASS; Gumroad product `theeightball.gumroad.com/l/rzqezp` PUBLISHED 2026-05-16 18:25 KSA; v0.3.0.3 LS→Gumroad cutover merged to main at `e64ec8f`; CiC firing #9 live-fire smoke-test PASS clean per `~/Desktop/8ball/audits/v0_3_0_3_live_smoke_test_2026-05-16.md`; LS-activation history: chat-19 marked Step-2 clearance at `2d25c65` per `~/Desktop/8ball/audits/ls_dashboard_snapshot_2026-05-14.md`; chat-20 2026-05-15 surfaced LS docs 4-step activation flow + observed "application has been received" KYC/KYB-review banner — Step 3 vendor-staff-pending through chat-25 + chat-28; chat-28 chose Gumroad path per "whichever clears first becomes primary funnel" framing. LS store preserved off-runtime per DOCTRINE §5.B Call 2 v0.28 single-processor-at-a-time codification; LS path permanently retired 2026-05-17 per DOCTRINE §5.C + §10 v0.30 — LS rejected operator application after Step 3 KYC/KYB review, no future re-route possible), (c) ≥5 paid Live purchases AND ≥1 Strong-tier qualitative facet-variation-demand signal by 2026-06-15, surfaced via at least one of three+1 observation channels (Gumroad dashboard purchases / §5.B feedback POST / @eczaki social — IG + TikTok + Threads per carnaval framing; Gumroad dashboard added 2026-05-16 post-cutover) — operational definition (channel signal-tier matrix, falsification table, 2026-06-15 diagnostic vocabulary) lives at `~/Desktop/8ball/sessions/v031_ship_gate_respec.md`, which is canonical for the gate; this row is the index pointer (chat-21 state-fill 2026-05-15, default-filled under carnaval frame, calibration #1 pre-8ball-follower boundary resolved chat-21). Pre-traction design lock; post-traction ship trigger. Sibling cosmetic ticket parked at `~/Desktop/8ball/sessions/v0.3.x_paint_gap_paid_return.md` — piggybacks onto v0.3.1 surface touch, not standalone.

~~**v0.3.0 — free-vs-$9.99-entry pricing conversation.**~~ ✅ resolved by ship. v0.3.0 shipped 2026-05-11 with three-free-tries cap + Tesla-369 staircase ($3/3 reads at tier-1; $6/6 and $9/9 reserved as future tiers, localStorage schema admits `tier_v1` without migration). The "$9.99 entry price to sin" framing was retired during the v0.3.0 design churn: per `~/Desktop/8ball/sessions/v0.3.0_design.md` v3 decision (now SUPERSEDED), free-first, observe under real conditions, design paid scope from live data. Free + paid coexist; the 18+ acknowledgment gate (§4.A) gates the free entry, the paywall (§4.B) gates the depth-unlock. Future-pricing conversation is now post-traction, not pre-traction.

Independent / housekeeping:

12. ~~**Cleanup: shadow Netlify project.**~~ ✅ `enchanting-bonbon-2b5064` deleted 2026-05-12 in chat-7 housekeeping via controller dashboard `/configuration/general/Danger zone/Delete this project` flow. Project ID `6f0fbabc-fa42-4423-bd74-78a7b951613e`; created 2026-05-08 at 4:49 PM, 32 minutes after the canonical `the-eight-ball` (project ID `cfc7f984-b54d-4116-a206-6a4647daaeeb`, 4:17 PM same day); had been silently double-deploying every push to main since creation. Team-projects page now reflects single canonical project. Expected side effect: ~50% reduction in netlify credit consumption per push, easing the recurring credit-cap pressure documented at v0.2.1 ship time.
13. ~~Cleanup: branch deletion.~~ ✅ `phase-2f-1-card-engine` deleted from origin + local at v0.2.0 merge (also bounds the cards-containing-history exposure on origin); `phase-2g-1-rising-sign` deleted post-v0.2.1 merge; `v0.3.0-depth-unlock` deleted post-v0.3.0 merge. Older `v0.1.4-phase2d-concern-dispositions` branch confirmed absent from origin (verified 2026-05-12 — origin contains `main` only).
14. ~~`audits/RELEASE_CHECKLIST.md` staleness.~~ ✅ shipped at `c86970e` (audit-4 disposition); stage list aligned with §7 v0.10+, plus drift fixes for content-folder reference and post-merge smoke-test wording.
15. ~~Doctrine-version bump.~~ ✅ shipped 2026-05-09 in Phase-2F-2 as part of the §8 live-fire ritual-gate amendment. DOCTRINE.md now reads **v0.14** (was v0.3 post-2F-2 → v0.12 post-2F-3 → v0.14 post-2G-1).
16. ~~Live-fire testing.~~ ✅ codified as a §8 ritual-gate sub-rule (per DOCTRINE v0.3+ amendment). v0.2.1 5-gate live-fire (no-opts / full-opts / auto-fill / rehydrate / three reference cases vs astro.com) cleared on prod 2026-05-09. Subsequent releases run the equivalent gate; v0.2.7.2 city / DST sweep cleared 2026-05-11; v0.3.0 paid-surface live-fire cleared at v0.3.0.3 via Gumroad path (CiC firing #9 PASS clean per `~/Desktop/8ball/audits/v0_3_0_3_live_smoke_test_2026-05-16.md`; §13 17-step checklist authored in `~/Desktop/8ball/sessions/brief_v030_depth_unlock.md` and §11.11 ship-gate (b) closed 2026-05-16; LS-Live end-to-end-firing path retired 2026-05-17 per DOCTRINE §5.C + §10 v0.30). v0.4.0 share-surface live-fire cleared on prod 2026-05-29 (CiC verifier PASS 5/5 — share button + grayscale PNG with labeled symbols/catalog/wordmark + no paid content/no PII + **zero network on share click** + bare-URL clipboard; directive `~/Desktop/8ball/controllers/cic_share_livefire_2026-05-29.md`, response `~/Desktop/8ball/audits/cic_share_livefire_2026-05-29_response.md`).
17. ~~Operator-personal: add `8ball` row to `~/MUHAB.md` §6 bootstrap table.~~ ✅ row present (verified post-v0.3.0.1 cleanup pass).

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
