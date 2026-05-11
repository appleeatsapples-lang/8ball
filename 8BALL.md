# 8BALL.md — Canonical Context

**Audience:** Claude (in any chat) and any other AI working on 8ball, in any role.
**Last refreshed:** 2026-05-10.
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

A magic 8-ball that knows you. Public-facing surface for v0.2.3 is minimal: enter name + DOB once, optionally add birth time + country + lat/lng, shake, see seven of the ten baseline calibrated coordinates surfaced on the card — chinese five-element, sun sign, public animal (year-pillar), private animal (month-pillar), life path, expression/name number, soul urge — plus rising sign when computable. The two animals pair on a single line via an equilibrium arrow (`⇌`); sun and rising pair on line 2 via `↑`; the three numerology coordinates (life path, expression/name number, soul urge) render as a text triplet on line 4 — concatenated when all single-digit (e.g. `383`), space-separated when any value is a master number 11/22/33 (e.g. `3 11 3`). The remaining three baseline coordinates (personality, birthday, maturity) are computed on `buildProfile` as data-only and reserved for v0.3.0+ paid surfacing. Underneath, the (sun sign, public animal) pair drives a 144-card catalog index — computed positionally by `core/engine.js` (sun-row × 12 + animal-col + 1, roman numeral). Rising sign and numerology are surface-only and never enter the catalog driver. Life path drives bracket resolution (low/mid/high) within a card cell, not the catalog index. The catalog index is the only card-derived value surfaced. The card content itself (name, type, habit, note per cell) is private and lives outside this repo at `~/dev/8ball-private/`; the future paid interpretation layer will surface it.

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
| 6 | Persistence | localStorage only — name + DOB + optional rising inputs (`time`, `country`, `lat`, `lng`); no derived profile stored |
| 7 | Telemetry | None. Permanently. |
| 8 | Calc version | v2 — Pythagorean LP w/ master 11/22/33 preserved; tropical sun; real lunar new year + solar-term tables (1900–2100, Asia/Shanghai date-precision) |
| 9 | Content version | v0.2.7.2-public (city autocomplete via `assets/cities.json` lazy-load; IANA tz + DST-aware rising via `Intl.DateTimeFormat`; polar |lat|>66.5° null fallback; legacy v0.2.1+ profile rehydration path retained; `(24h)` label parenthetical dropped; catalog-only; numerology text triplet surface; positional math in engine.js; full content private at `~/dev/8ball-private/cards.v1.full.js`; launch-prep meta + favicons + og:image at /assets/; opt-in feedback surface §5.B; 18+ acknowledgment gate §4.A; symbol-label visibility toggle §5 allow-list) |
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

The product persists only user-entered profile fields in `localStorage`, on the user's own device: `name`, `dob`, and optional rising-sign inputs (`time`, `country`, `lat`, `lng`). No derived profile is stored or transmitted.

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

## 10. Current state (as of 2026-05-11)

**v0.2.7.2 SHIPPED 2026-05-11** at `https://the-eight-ball.netlify.app`. Live commit on `main`: `4d1e71d` (squash-merge of v0.2.7.2 city autocomplete + IANA tz + DST-aware rising). City-level birthplace input replaces country-centroid + fixed-offset rising; new `core/cities.js` lazy-loads `assets/cities.json` (53,308 entries; 341 unique IANA tz strings; GeoNames cities5000 + pop≥7500 floor; 2.30 MB raw, 1.04 MB gzip). New `computeRising({...tz...})` API in `core/rising.js` resolves DST + historical-tz via `Intl.DateTimeFormat` (Indiana pre-2006 no-DST, Russia post-2014 permanent UTC+3, US summer CDT — all correct). Legacy `getRisingSign(..., utcOffsetMinutes, ...)` retained for v0.2.1+ stored-profile fallback. Both APIs polar-safe at strict |lat|>66.5° → null. Bundled cosmetic fix: `(24h)` parenthetical dropped from BIRTH TIME label. DOCTRINE bumped v0.20 → v0.21 (§1.A amended — DST + historical-tz in scope, city-level birthplace, polar null; §5 amended — same-origin lazy loads of static JSON permitted, `fetch()` / `XMLHttpRequest` / `navigator.sendBeacon` ban preserved; §5 allow-list extended with `city` / `cc` / `tz`). Calc unchanged (stays v2). Tests 470 → 502 (+32). Local PII audit clean. Lane: two-lane outcome after mid-cycle re-pivot (CC calc layer; chat-Claude everything else — UI/JS rewrite, doctrine, all tests, journal, and `core/cities.js` completion + `tests/cities.test.js`) per L40 firing on two consecutive CC content-filter trips plus a third firing on Codex paste-relay friction — §10 two-eyes preserved via Codex pre-merge audit on the PR. Aesthetic mono per Phase-2E.

**v0.2.7.1.1 SHIPPED 2026-05-10** at `https://the-eight-ball.netlify.app`. Live commit on `main`: `ff6c726` (squash-merge of v0.2.7.1.1 modal copy tighten + labels-reveal title conditional fix). Two coupled surface fixes: about-modal body shortened from ~150 to ~95 words (Option B; voice-preserving; all four doctrine disclosures preserved); `coord-sun-title` label now conditional on `profile.risingSign` (`SUN ↑ RISING` when computed, `SUN` when not) — closes the operator-caught bug where the static label promised a rising sign even when no time/place was provided. Tests 468 → 470 (+2 markup-static assertions in `tests/labels_reveal.test.js`). Local PII audit clean. No DOCTRINE touch (stays v0.20). No calc touch (stays v2). No `core/` touch. Aesthetic mono per Phase-2E.

**v0.2.7.1 SHIPPED 2026-05-10** at `https://the-eight-ball.netlify.app`. Live commit on `main`: `c0772c5` (squash-merge of v0.2.7.1 lunar tables — first calc-version bump since v0.1.0 launch). Replaces v1 Feb-4 fixed-cutoff approximation with real lunar new year + solar-term tables (1900–2100), computed via Meeus astronomical algorithms in new `core/calendar.js`; Asia/Shanghai date-precision per DOCTRINE §3 (cusp resolution rule). `getInnerAnimal` signature changed `(month, day) → (year, month, day)`. Tests 437 → 466 (+29). Local PII audit clean. DOCTRINE bumped v0.19 → v0.20 (§3 calc v2 amendment + lineage). Disclosed deviation from brief's "HKO sourced" wording: tables computed via Meeus per operator-approved fork; matches all 17 sanity-lock dates byte-exact and handles 2033/2034 leap-suì edge case. No UI/index.html touch, no §5 privacy change.

**v0.2.7 SHIPPED 2026-05-10** at `https://the-eight-ball.netlify.app`. Live commit on `main`: `136c509` (squash-merge of v0.2.7 labels-reveal toggle — §5 allow-list extension, second post-launch UI-state flag). Symbol-label visibility toggle below result card; default hides titles, revealed shows uppercase title above each symbol (`FIVE-ELEMENT`, `SUN ↑ RISING`, `PUBLIC ⇌ PRIVATE`, `LIFE · NAME · SOUL`). Persists via `eight_ball_labels_revealed_v1` localStorage flag, parallel to age-ack pattern. CI green; tests 425 → 437 (+12 in `tests/labels_reveal.test.js`). Local PII audit clean. About-modal copy updated to disclose. DOCTRINE bumped v0.18 → v0.19 (§5 allow-list extended). No `core/` touch, no calc change.

**v0.2.6 SHIPPED 2026-05-10** at `https://the-eight-ball.netlify.app`. Live commit on `main`: `c9524ee` (squash-merge of v0.2.6 18+ acknowledgment gate — first §4 active gate in the product). One-time modal blocks name/DOB entry; ack persists via separate localStorage flag `eight_ball_age_ack_v1`. CI green; tests 420 → 425 (+5 age-gate markup invariants). Local PII audit clean. About-modal copy updated to disclose gate. DOCTRINE bumped v0.17 → v0.18 (§4 amended; §4.A added; §5 allow-list extended). No `core/` touch, no calc change.

**v0.2.5.2 SHIPPED 2026-05-10** at `https://the-eight-ball.netlify.app`. Live commit on `main`: `052a88b` (squash-merge of v0.2.5.2 feedback redirect `?sent=1` — closes the half-wired banner-JS loop from v0.2.5). v0.2.5.1's `action="/"` produced a working but visually-invisible redirect: Netlify 303-redirected to `/`, but the v0.2.5 banner JS at `index.html` lines 869-881 watches for `?sent=1`, so without the query string the banner never fired and the homepage post-redirect looked identical to the post-shake state because localStorage rehydrates the card. Tightened to `action="/?sent=1"` so the JS detects the query, swaps the form for "thanks. read.", then `replaceState` strips the query for a clean URL. CI green; tests 420/420 unchanged. Local PII audit clean. No `core/` touch, no doctrine change. §5.B language unchanged. Test assertion tightened from `action="/"` to `action="/?sent=1"`.

**v0.2.5.1 SHIPPED 2026-05-10** at `https://the-eight-ball.netlify.app`. Live commit on `main`: `63c277a` (squash-merge of v0.2.5.1 feedback form thanks-page redirect — single-attribute UX polish). Adds `action="/"` to the feedback form so Netlify 303-redirects to homepage post-submit instead of its branded white "Thank you!" page; card rehydrates from localStorage. CI green; tests 420/420 unchanged. Local PII audit clean. No `core/` touch, no doctrine change. §5.B language unchanged — `action` controls success-redirect, not submit endpoint; "single named endpoint" / "native HTML form POST" / "fail-silent" all still hold. Test assertion updated from absence-of-action to `action="/"` to codify the decision.

**v0.2.5 SHIPPED 2026-05-10** at `https://the-eight-ball.netlify.app`. Live commit on `main`: `a0a2023a057496fde09aaaf82f3097ffebf0df21` (squash-merge of v0.2.5 feedback surface — first §5 doctrine departure since launch). CI green; tests 414 → 420 (+6 feedback_surface invariants). Local PII audit clean. Added an opt-in feedback `<details>` below the result card (Netlify Forms POST, single named endpoint, native form post, fail-silent). About-modal copy updated to disclose. DOCTRINE bumped v0.16 → v0.17 with new §5.B clause. No `core/` touch, no calc change.

**v0.2.4.1 SHIPPED 2026-05-10** at `https://the-eight-ball.netlify.app`. Live commit on `main`: `1f9d2a4` (squash-merge of v0.2.4.1 favicon.ico repair). Single-asset patch closing the Cat 3 FAIL from the v0.2.4 Codex audit. ICO regenerated with 3 entries (16/32/48) per spec; root cause was a Pillow upscale-drop in the gen script, now fixed. No code change, no doctrine change. CI green; tests 414/414 unchanged. Local PII audit clean.

**v0.2.4 SHIPPED 2026-05-10** at `https://the-eight-ball.netlify.app`. Live commit on `main`: `a671f23` (squash-merge of v0.2.4 launch-prep meta polish — additive surface only). CI green; tests 414/414 unchanged. Local PII audit clean. Added favicon set + OG/Twitter card meta tags + 1200×630 grayscale og:image at `/assets/`. Fixed stale "dst not adjusted in v0.2.1" hint-text reference to version-agnostic phrasing. No `core/` touch, no doctrine change. Aesthetic mono per Phase-2E.

**v0.2.3 SHIPPED 2026-05-10** at `https://the-eight-ball.netlify.app`. Live commit on `main`: `141da42` (squash-merge of v0.2.3 numerology revert — surface-only revert of v0.2.2 hexagon to text triplet). CI green; tests 414/414 unchanged. Local PII audit clean. Result card now renders four text lines (chinese five-element, sun [or sun ↑ rising], public-animal ⇌ private-animal, numerology triplet [life path, expression, soul urge]) plus catalog roman numeral. Conditional spacing on triplet: `3 11 3` when any master 11/22/33 present, `383` when all single-digit. Calc fields personality/birthday/maturity remain on `buildProfile` as data-only — reserved for v0.3.0+ paid surfacing. Doctrine v0.15 → v0.16 (§1.B replaced; calc-vs-surface separation rule).

**v0.2.2 SHIPPED 2026-05-09** at `https://the-eight-ball.netlify.app`. Live commit on `main`: `fa552ca` (squash-merge of Phase-2G-2 hexagon polygon — surface-breaking line-4 numerology replacement, data-additive calc extension). CI green; tests 403 → **414** (+11 direct tests for Personality, Birthday, Maturity, and buildProfile exposure). Local PII audit clean. Result card now renders three text lines plus an inline-SVG hexagon: vertex order locked clockwise from top as Life Path · Expression · Personality · Maturity · Soul Urge · Birthday. `core/profile.js` extended additively with `getPersonality`, `getPersonalitySum`, `getBirthday`, `getMaturity`, `getMaturitySum`, plus `personality`, `personalitySum`, `birthday`, `maturity`, `maturitySum` fields on `buildProfile`. `core/engine.js`, `core/countries.js`, and `core/rising.js` unchanged. Doctrine v0.15 adds §1.B: hexagon is surface-breaking/data-additive; calc-version remains v1.

**v0.2.1 SHIPPED 2026-05-09** at `https://the-eight-ball.netlify.app`. Live commit on `main`: `f3666cb` (squash-merge of Phase-2G-1 rising sign + country auto-fill — surface-additive eighth coordinate). CI green; tests 102 → **403** (+24 rising-math, +276 country data-quality, +1 buildProfile additive regression; existing 102 byte-identical). Local PII audit clean (22 → **26** files). Surface line 2 renders as `${sun} ↑ ${rising}` when the user opens the optional rising-fields `<details>` and provides time + country + lat/lng; otherwise bare sun sign. Country selection auto-fills lat/lng to a 1-decimal centroid (276 entries: ISO 3166-1 sovereigns + multi-tz country zones for US/CA/RU/AU/BR/MX/ID/KZ/MN/CL); user-overridable; rehydrate doesn't re-fire. localStorage payload extended additively from `{name, dob}` → `{name, dob, time?, country?, lat?, lng?}`; zero network calls preserved. Catalog driver remains `(sun, animal)` per DOCTRINE §1; rising is surface-only per new DOCTRINE §1.A. Doctrine v0.12 → v0.13 (rising added) → v0.14 (§1.A extended: lat/lng auto-fill semantics; UTC offsets fixed-per-entry; DST out of scope). `phase-2g-1-rising-sign` deleted post-merge. Two-audit Codex cycle cleared at audit-2 PASS clean. Netlify auto-skipped the post-push deploy ("account credit usage exceeded"); operator paid + upgraded + manually triggered; prod parity verified at 28,031 bytes byte-exact.

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
7. ~~Phase-2G-1 — rising sign + country auto-fill.~~ ✅ shipped 2026-05-09 as v0.2.1 at `f3666cb`. Eighth surface coordinate (rising) on line 2 as `${sun} ↑ ${rising}` when full opts present; else bare sun sign. `core/rising.js` (Meeus ascendant, 86 lines, three reference cases anchored to <0.01° vs astro.com); `core/countries.js` (276 entries, 1-decimal centroids, ISO 3166-1 + multi-tz country zones); `core/profile.js` extended additively. Two-audit Codex cycle cleared at audit-2 PASS clean. DOCTRINE v0.12 → v0.14 (new §1.A: rising is surface-only, lat/lng auto-fill semantics codified). `phase-2g-1-rising-sign` deleted post-merge.
8. ~~Phase-2G-2 — hexagon polygon (line-4 numerology replacement).~~ ✅ shipped 2026-05-09 as v0.2.2 at `fa552ca`. Replaced the line-4 numerology triplet with an inline SVG hexagon — six vertices = Life Path, Expression, Personality, Maturity, Soul Urge, Birthday. Personality, Birthday, and Maturity are new additive calc fields; the surface change is breaking-on-render but catalog math remains unchanged. **Surface reverted in v0.2.3** (2026-05-10) — line 4 returned to text triplet `[life path, expression, soul urge]`; calc additions (personality, birthday, maturity) retained on `buildProfile` as data-only, reserved for v0.3.0+ paid surfacing.
9. **v0.3.0 — paid interpretation layer.** NEW priority signaled by operator this session ($5 toy-price tier). Real doctrine departure: first network surface for payment + auth + content gating. Architecture already reserved at v0.2.0 (private deck at `~/dev/8ball-private/cards.v1.full.js`). Needs its own design pass; no brief drafted yet. Pricing decision belongs after the paid product is built and value-density is observable.
10. **Deferred 2G-3+ candidates.** Moon sign · day-pillar animal · lunar phase · birth card. Locked decisions in `~/Desktop/8ball/sessions/queue_post_2G2_candidates.md`. Surface-density flag fired 2026-05-09 (free-tier trajectory: 7 → 8 → 11 → 15 coords); operator chose to stabilize at 11 post-hexagon and pivot to interpretation/paid layer. Held behind v0.3.0; may not return.

**v0.3.0 — free-vs-$9.99-entry pricing conversation (open).** Operator signal: "this is a toy for adults, $9.99 is the price to sin." Three readings possible: hard paywall (no free tier), free-symbols-with-$9.99-deck-unlock (current v0.3.0 plan), or hybrid 18+ gate + paid deck. Needs design conversation, not a brief. v0.3.0_design.md to be revisited.

Independent / housekeeping:

11. **Cleanup: shadow Netlify project.** Two Netlify deploys connected to the repo (`the-eight-ball` ✓ canonical; `enchanting-bonbon-2b5064` ✗ shadow). 8BALL.md §2 says one. One-click delete in Netlify dashboard. Both projects served stale v0.2.0 during the credit-cap incident this release; both will likely deploy after the trigger.
12. ~~Cleanup: branch deletion.~~ ✅ `phase-2f-1-card-engine` deleted from origin + local at v0.2.0 merge (also bounds the cards-containing-history exposure on origin); `phase-2g-1-rising-sign` deleted post-v0.2.1 merge. Older `v0.1.4-phase2d-concern-dispositions` cleanup remains — verify and prune if still present.
13. ~~`audits/RELEASE_CHECKLIST.md` staleness.~~ ✅ shipped at `c86970e` (audit-4 disposition); stage list aligned with §7 v0.10+, plus drift fixes for content-folder reference and post-merge smoke-test wording.
14. ~~Doctrine-version bump.~~ ✅ shipped 2026-05-09 in Phase-2F-2 as part of the §8 live-fire ritual-gate amendment. DOCTRINE.md now reads **v0.14** (was v0.3 post-2F-2 → v0.12 post-2F-3 → v0.14 post-2G-1).
15. **Live-fire testing** — shake the deployed URL across all 12 sun rows post-2F-2 to confirm card variety reads cleanly. v0.2.1 5-gate live-fire (no-opts / full-opts / auto-fill / rehydrate / three reference cases vs astro.com) cleared on prod 2026-05-09. Now codified as a §8 ritual-gate sub-rule (per doctrine v0.3).
16. **Operator-personal:** add `8ball` row to `~/MUHAB.md` §6 bootstrap table (operator-only edit).

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
