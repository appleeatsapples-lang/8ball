# 8ball — DOCTRINE.md

> One page. Read every release. Edit only deliberately.

This document is the constitution of `8ball`. The codebase obeys it. PRs that contradict it require an explicit doctrine amendment in the same change.

## §1. What this is

A fixed designed deck that knows you. Enter your name and date of birth once. Shake.

The product calculates ten baseline calibrated coordinates from (name, DOB): sun sign, Chinese five-element, public animal (year-pillar), private animal (month-pillar), life path, expression/name number, personality, maturity, soul urge, and birthday. The two animals pair on a single line via an equilibrium arrow (`⇌`); three of the numerology coordinates (life path, expression/name number, soul urge) render as a text triplet on line 4 of the result card. The (sun sign, public animal) pair drives a 144-card catalog index — computed positionally in `core/engine.js` (sun-row × 12 + animal-col + 1, rendered as roman numeral). Life path drives bracket resolution (low/mid/high) within a card cell via `resolveBracket`, not the catalog index. The catalog index is the only card-derived field surfaced.

As of v0.2.3 the result card surfaces seven of the ten baseline coordinates (chinese five-element, sun, public animal, private animal, life path, expression/name number, soul urge), optional rising sign, and the catalog index. The remaining three baseline coordinates (personality, birthday, maturity) are computed on buildProfile but reserved for v0.3.0+ paid surfacing — see §1.B. The card content itself (name, type, habit, note per cell) is the future paid interpretation layer and lives outside this repo (`~/dev/8ball-private/`). The public repo ships no card strings — the engine computes catalog from positional math without any content import. The free surface is symbols only — no interpretation, no per-symbol explanation.

The voice is declarative-observational, framed in strengths and weaknesses. Cards openly reference the symbol systems they draw from — sun sign, Chinese five-element, Chinese zodiac animals (year and month pillars), numerology life path, name number, soul urge — and name them as such.

**§1.A. Rising sign — surface coordinate, not a driver.**

As of v0.2.1 the result card surfaces an eighth coordinate when the operator provides birth time, country, latitude, and longitude: the rising sign (astronomical ascendant). Rising sign is computed from `(year, month, day, hour, minute, utcOffsetMinutes, lat, lng)` via standard ascendant math (Meeus); see `core/rising.js` for the exact algorithm. It is rendered on line 2 of the result card paired with the sun sign as `${sunSign} ↑ ${risingSign}`.

Rising sign is **surface-only**: it does not enter `getCard`, `resolveBracket`, or any catalog computation. The catalog driver remains `(sunSign, animal)` per §1. Rising adds a coordinate to the visual surface; it does not branch the card layer.

When any of (time, country, lat, lng) is missing, rising sign is `undefined` and line 2 falls back to the v0.2.0 bare-sun-sign render. Existing v0.2.0 profiles in localStorage continue to work without modification.

UTC offsets in `core/countries.js` are fixed per entry (typically standard time, not DST). Lat/lng default to the selected country/zone's geographic centroid (1-decimal precision); user can override with birthplace-precise coordinates for greater accuracy. DST-aware computation, historical timezone changes, and pre-1970 date adjustments are out of scope for v0.2.1.

**§1.B. Numerology surface — text triplet, calc reserved.**

As of v0.2.3 the result-card numerology surface renders as a three-number text line: life path, expression/name number, soul urge. Single-digit values concatenate (e.g. `383`); when any value is a master number (11/22/33), values are space-separated for readability (e.g. `3 11 3`).

The additional calc fields personality (consonants only), birthday (day-of-month reduced with master preservation), and maturity (life-path sum plus expression/name-number sum, reduced with master preservation) remain on `buildProfile` as data-only — computed but not surfaced. They are reserved for v0.3.0+ paid surfacing per §1.

Catalog driver (§1) and rising semantics (§1.A) are unchanged. v0.2.3 reverts the v0.2.2 hexagon surface; this is breaking-on-render and additive-on-data. Calc-version remains v1.

## §2. What this is NOT

**Currently enforced (CI gates, see §7):**

- Not a "spiritual" product. The voice is declarative-observational and materialistic, not mystical or guidance-oriented. Banned-voice-register scan ran on `cards.v1.js` content in v0.1.x; as of v0.2.0 the card content is private (paid layer) and that scan runs on the private content-authoring pipeline, not in the public test suite. The regex policy itself is preserved in `tests/profile.test.js` as the canonical rule reference.
- Not a SIRR product. Never references SIRR. Never imports from SIRR. The two repos are siblings, not parent/child. (See §9.) Enforced by `tests/pii_scan.test.js`.
- Not an analytics product. No tracking, no telemetry, no network calls of any kind. Enforced by `tests/privacy_scan.test.js` (see §5). The page uses system fonts only — no Google Fonts, no third-party CSS, zero network requests after page load.

**Review-discipline (no current code surface to scan; rule fires when a feature is proposed):**

- Not a horoscope app. Not a numerology calculator. Not a guidance product. (Voice register; partly captured by the banned-list above.)
- Not a logged-in product. No accounts, no signup, no "save your reading."
- Not a payments product. No paywall, no premium tier, no in-app purchase. Revisit only with a real reason.

## §3. The calculation contract

`core/profile.js` is the calculation core. Changes fall into two categories:

**Breaking changes** — modify existing outputs (sunSign, animal, lifePath, nameNumber, chineseElement, soulUrge for any input). The contract:

1. Add or update fixtures in `tests/fixtures.json` reflecting the intended new behavior.
2. Update the algorithm.
3. Run `npm test`. All cases must pass.
4. Bump the calc-version note at the bottom of this file.

**Additive changes** — add new outputs without modifying existing ones (e.g. new functions exported, new fields on the `buildProfile` return value). The contract:

1. Add direct unit tests for the new outputs in `tests/profile.test.js`.
2. Run `npm test`. All cases must pass, including the new tests.
3. Existing `tests/fixtures.json` cases must remain byte-identical (no silent drift).
4. Calc-version stays the same major (additive doesn't break v1 consumers).

Algorithm versions documented:

- **calc v2** (v0.2.7.1) — Real lunar new year table for year-pillar cusps (year-pillar animal + 5-element pillar). Real solar-term table for month-pillar (`innerAnimal`). Both tables span 1900–2100, evaluated at date-precision in canonical Asia/Shanghai timezone (UTC+8); DOB given as `YYYY-MM-DD` is treated as the truth — no timezone conversion of user input. The v1 Feb-4 fixed-cutoff approximation is retired. **`getInnerAnimal` signature changed from `(month, day)` to `(year, month, day)`** as a breaking calc change. All existing fixtures other than the v1-bug-locking fixture #6 (CNY Feb 4 cutoff) remain byte-identical; fixture #6 is intentionally re-spec'd because it was locking the bug being fixed.
- **calc v1** (initial through v0.2.7) — Pythagorean life path with master numbers 11/22/33 preserved at the final reduce. Western tropical sun signs at standard cusps. Chinese zodiac with Feb 4 cutoff approximation (lunar tables = future work). Additively extended at v0.2.0 with: chinese five-element (2-year cycle, 1924 anchor), public/private animal split (year-pillar already present at `animal`; month-pillar added as `innerAnimal` via solar-term cutoff approximations), soul urge (vowel-only Pythagorean, masters preserved), and unreduced sums (lifePathSum, nameNumberSum, soulUrgeSum) exported for potential future surfacing. Additively extended at v0.2.1 with optional rising sign (surface-only ascendant) when birth time + country + lat/lng are present. All additions covered by direct unit tests in `tests/profile.test.js` and `tests/rising.test.js`; existing fixtures unchanged.

If a fixture changes silently, the test gate catches it. If a test changes silently, code review catches it. If both change in the same commit without a doctrine note, the reviewer rejects.

## §4. Content rules — copy & traits

- **No slurs.** Banned-pattern check runs in `tests/profile.test.js`.
- **No medical/diagnostic framing.** Cards do not adopt clinical or diagnostic vocabulary, including ironic adoption (e.g., "diagnosis," "syndrome," "disorder").
- **Cultural-symbol respect.** If the deck draws from any tradition (tarot, I Ching, runes, zodiac, etc.), cards respect that tradition's lineage. No syncretic flattening, no caricature of source traditions.
- **No targeting minors.** Copy assumes adult user. UI does not pander to children. As of v0.2.6, an 18+ acknowledgment gate is required before name/DOB entry — see §4.A.
- **No real-person targets.** No "you're like [public figure]" lines.
- **Universal floor.** Cards should land equally on a person who picked their own DOB.
- **No card-content strings in tracked files.** As of v0.2.0 the card content (cell `name`, `type`, `habit`, `note` bodies) lives privately at `~/dev/8ball-private/cards.v1.full.js`. No public-repo tracked file (source, tests, fixtures, `journal.md`, audit notes, this doctrine) may contain a card-content string. Audit dispositions and content-batch logs reference cells by coordinate path (e.g. `aries.rabbit.note.mid`); before/after strings are stored with the private deck. Forward-looking from doctrine v0.11; pre-v0.11 trait-pool / template-pool excerpts in journal entries (retired `traits.v1.js` / `templates.v1.js` system, deleted from repo in 2F-2) are out of scope.
- **Versioned, not edited.** Shipped content batches are immutable. New release = new file (e.g. `traits.v2.js`, `cards.v2.js`). Diff lives in `journal.md`.

**§4.A — 18+ acknowledgment gate.**

As of v0.2.6 the product gates entry to the onboarding form behind a one-time 18+ acknowledgment. Mechanics:

- On first load, a modal blocks the onboarding form. Single button: "confirm." Tapping it is the acknowledgment.
- Acknowledgment persists via `eight_ball_age_ack_v1` localStorage flag (string `'true'` on confirm). On subsequent visits the gate is skipped.
- Acknowledgment is a click-through, not verification. Copy must be explicit about that — no implication of legal age-gating, no health-product warning theatre, no false claim of identity verification.
- Disclosure: the about-modal mentions the gate's existence and shape so the user knows what the storage flag is for.

If a future feature needs harder age verification (paid tier, adult-content layer, regulatory requirement), that requires a §4.A amendment and likely a §5 amendment for whatever data-collection surface the verification introduces.

If a line lands but you can't tell whether it crosses any of the above, it crosses. Cut it.

**Safety-patch carve-out.** Locked-decision #9 (immutable v1 pools) protects against silent flavor drift. It does NOT protect a doctrine-rule violation caught post-ship. If a shipped trait, template, or card line violates §4, it is cut in a patch release; the journal records the cut and the diff carries the doctrine note. Immutability is for taste discipline, not error preservation.

## §5. Privacy primitive

The product persists only user-entered profile fields, in `localStorage` only, on the user's own device:

- `name` (string)
- `dob` (ISO date YYYY-MM-DD)
- optional `time` (HH:MM string, 24-hour)
- optional `country` (country/zone entry code from `core/countries.js`)
- optional `lat` (decimal latitude)
- optional `lng` (decimal longitude)
- `eight_ball_age_ack_v1` — separate boolean flag (string `'true'`) set when the user confirms the 18+ acknowledgment gate per §4.A. Independent of the profile payload.
- `eight_ball_labels_revealed_v1` — separate string flag (`'true'` or `'false'`) tracking whether the user has chosen to reveal the symbol-name labels on the result card. UI preference only; independent of the profile payload. Added v0.2.7.

Nothing else. No derived profile is stored — it's recomputed on each load. No analytics. No remote endpoints. No third-party scripts. System fonts only — zero network requests after page load.

If a future feature requires storing or transmitting more, that feature requires a doctrine amendment to §5 and a privacy-policy update before merge.

## §5.B — Feedback surface (added v0.2.5)

The site permits exactly one user-initiated network call: submission of a feedback form to the Netlify Forms endpoint at the same origin. This is the only network call permitted in the product runtime; everything else in §5 stands.

Constraints:

- **User-initiated only.** The submission fires only on user click of the explicit submit button. No timer, no auto-fire, no submission on page load, on shake, on result-render, or on any other implicit trigger.
- **User-authored content only.** The submitted payload contains exactly two fields: a free-text `message` and an optional free-text `contact`, both typed by the user inside the form. No localStorage profile data (`name`, `dob`, `time`, `country`, `lat`, `lng`) is included. No derived coordinates. No name, no DOB, no IP enrichment from the page, no analytics tags, no UTM params, no fingerprint. The form has no hidden field carrying user-data state.
- **Single named endpoint.** The `<form>` action is the same-origin Netlify Forms handler (no `action` attribute or `action="/?sent=1"` for redirect after submit; Netlify intercepts the POST). No third-party form provider, no webhook fan-out, no secondary destination.
- **Native form post, no JavaScript fetch.** The form uses HTML `<form method="POST" data-netlify="true">` semantics. No `fetch()`, no `XMLHttpRequest`, no `navigator.sendBeacon`. The privacy scan (`tests/privacy_scan.test.js`) is unchanged and remains the enforcement.
- **Fail-silent.** On submission failure (offline, provider outage, network error), the browser handles the error natively. No retry queue, no remote error reporting, no telemetry of failure. If the user's browser is offline, the submit fails and the user can decide what to do.
- **Submission visibility.** Submissions land in the Netlify dashboard under the Forms tab. The operator may configure email notifications per Netlify defaults. Submissions are not echoed back to the page or persisted in localStorage.
- **No retention by 8ball.** 8ball-the-codebase does not retain submissions. Netlify-the-platform does (for as long as operator keeps them in the dashboard); that is operator's responsibility, not 8ball's runtime concern.

The about-modal copy is updated to disclose this surface honestly. Disclosure is the load-bearing piece: anyone reading the modal must learn that a feedback form exists and what happens when they submit it.

If a future feature would require a second endpoint, additional fields, or any non-user-initiated network behavior, that requires a further §5 amendment.

## §6. Architecture

- Single repo, private on GitHub as of v0.2.0 (was public through v0.1.4; flipped private to protect the future paid card-content layer at `~/dev/8ball-private/`).
- Static site. Deployed on Netlify free tier from `main` branch.
- ES modules in the browser. No build step.
- Three-folder source layout: `core/` (logic), `content/` (data — empty in the public repo as of v0.2.0; full deck lives privately), `tests/` (gates). Plus `index.html` and config.
- The single-file rule: `index.html` may not exceed 1500 lines. If it would, split into `ui/*.js` modules. Not before.

## §7. CI gate

`.github/workflows/ci.yml` runs on every push and PR to main. The gate has these stages:

1. **Calculation contract + engine pipeline** — `tests/profile.test.js` must pass (calc cases against `tests/fixtures.json`, `getCard` pipeline across the 144 positional catalog cells, `resolveBracket` cases).
2. **Privacy scan** — `tests/privacy_scan.test.js` must pass (no network calls, no third-party fonts/scripts, system fonts only).
3. **PII scan** — `tests/pii_scan.test.js` must pass (operator-name leakage, SIRR cross-reference leakage, labeled-DOB leakage).
4. **Dependency discipline** — `tests/dependency_discipline.test.js` must pass (no card-content imports in the public engine).
5. **Single-file rule** — `index.html` ≤ 1500 lines.

(Content scan against `cards.v*.js` was retired in v0.2.0 when the deck moved to `~/dev/8ball-private/`. The banned-pattern + banned-voice-register policy is preserved in `tests/profile.test.js` as the canonical rule reference; it now runs on the private content-authoring pipeline, not in the public CI.)

Netlify is configured to auto-deploy on push to `main`. CI runs in parallel on the same push. Failed CI does not currently block the auto-deploy itself — this gap is acknowledged and acceptable while traffic is operator-only. Wiring a Netlify required-check on the GitHub Actions status is queued for the first traction milestone (see `journal.md`); at that point, this paragraph gets re-tightened to "a failed gate blocks the deploy."

## §8. Release ritual

Every release, however small, has automated gates and ritual gates.

**Automated gates (CI, blocking):**

1. CI green (5 stages — calc+pipeline / privacy / PII / dependency / single-file). See §7 for the per-stage breakdown.
2. **Doctrine/content change requires journal entry.** PRs touching `DOCTRINE.md` or `content/*.js` must also touch `journal.md`. Enforced in `.github/workflows/ci.yml`.

**Ritual gates (operator/reviewer responsibility):**

3. PR opened with a one-line summary. (PR title discipline; CI doesn't validate title quality.)
4. Operator runs local PII audit (`audits/run_local_audit.sh`). The public CI cannot see the operator's personal data; the local audit closes that gap. Skipping it is the failure mode, so it's a checklist item, not a vibe.
5. Reviewer reads the diff. Asks: any new line cross §4? Any new path cross §5?
6. Cross-model audit on doctrine or content changes. See §10. Solo authority IS the failure mode. Doctrine and content changes go through Codex (or ChatGPT for content batches) before merge. Mechanical edits do not.
7. Merge.
8. Append to `journal.md` with the `===== YYYY-MM-DD · Title =====` shape: what shipped, what was rejected, what's deferred.
9. **Live-fire on local deploy preview.** Static audit cannot simulate DOM/CSS or engine runtime. Releases touching `index.html`, `core/engine.js`, or content batches require an operator-run local-server pass against the changed surface before merge. Phase-2F-1 made this load-bearing — the flip-state inversion bug was invisible to Codex's static audit and only surfaced when the operator shook the deploy preview.
10. Confirm Netlify auto-deployed. Open the live URL. Shake it.

## §9. The SIRR boundary

Tracked content of this repo MAY NOT contain the string "SIRR" (case-sensitive) or any SIRR-domain vocabulary (`sirr.studio`, `abjad`, `hebrew_gematria`, etc.) outside the boundary-naming files allow-listed in `tests/pii_scan.test.js` (`DOCTRINE_ALLOW`). SIRR is a sibling project, not a parent or child of `8ball`; the two repos share no code and no imports. Enforced by `tests/pii_scan.test.js`.

## §10. Multi-model lane system

**The author-judge problem is real.** A single instance writing AND reviewing its own work has a structural blind spot. SIRR's session L4 named this directly: "Solo authority on doctrine IS the failure mode."

For 8ball at its current scale, the lanes are:

| Role | Tool | Read access | Write access |
|---|---|---|---|
| Orchestrator, brief composer, doctrine drafter | **Claude (chat)** | Everywhere in `~/dev/8ball/` and `~/Desktop/8ball/` | Pragmatic for fast initial work; routes through CC for production-grade edits |
| Engine work, filesystem, git ops, audit-script execution | **Claude Code (CC)** — CLI tool installed at `/usr/local/bin/claude` | Repo + `~/Desktop/8ball/` | Repo + `~/Desktop/8ball/` |
| Content-batch review (trait pool diffs, template diffs) | **ChatGPT** — Mac desktop app, manual paste-and-relay | Pasted briefs only | Returns flagged-line lists only |
| Adversarial pre-merge auditor (doctrine changes, release-gate passes) | **Codex** — Mac desktop app, manual paste-and-relay | Pasted briefs only | Returns verdicts only |
| Editorial approver, merge gate, deploy authorization | **Operator** | Everywhere | Everywhere |

**Lane discipline:**

- This Claude (chat) does NOT autonomously override §4 or §5. Borderline content gets flagged for ChatGPT review before merge.
- Doctrine amendments go through Codex review before merge. Mechanical edits do not.
- All filesystem and git operations are routed through CC for any change touching ≥3 files or modifying core/. Single-file documentation tweaks may stay in chat.
- The operator is always the final approver. No model auto-merges.

For SIRR-specific lane discipline, see `~/dev/SIRR/SIRR.md` §7.

## §11. PII rule

Personal data of the operator, family, friends, or any other identifiable person is NEVER tracked content. The repo is private as of v0.2.0, but this rule is independent of repo visibility — tracked content is the durable boundary, not the current ACL state. Repos can flip; the rule survives the flip.

Specifically forbidden in any tracked file:

- The operator's full name in association with personal data (DOB, address, ID numbers).
- Test fixtures using real-person DOBs labeled to a real person.
- Any string matching combination patterns: `(operator-name) + (YYYY-MM-DD)` within 40 characters.
- SIRR cross-references outside of explicit boundary-naming doctrine.

The `tests/pii_scan.test.js` enforces a public-banned subset. The local audit at `audits/LOCAL_PII_AUDIT.md` closes the gap for personal data the public CI cannot know about.

**Fixture DOB rule (sub-rule of §11):** Fixture DOBs are chosen for the calc path they exercise, not anchored to any real person. If a calc path accidentally hits a real-person DOB, the fixture date is shifted by 12 years (preserves Chinese zodiac animal and life path mod-9 distribution while breaking real-DOB anchor) and the calc path is re-verified.

## §12. Out of scope, permanently

- Account systems
- Email capture
- Push notifications
- AI-generated trait phrases at runtime (latency, cost, repeatability all break)
- Multi-language until v2 of the trait pool exists in any language
- Astrology charts, planetary aspects, anything beyond sun sign + optional rising sign
- Daily/weekly horoscopes ("today's reading")
- Sharing/social-card export until a privacy review explicitly clears it
- Anything touching the SIRR engine, codebase, or vocabulary

## §13. Refresh discipline

This file is **maintained by hand**, not generated. Update it when:

- A locked rule is added under any §-number
- A canonical path changes
- A doctrine version locks (note the version)
- A blocker is resolved or added
- A new tool/relay is automated (kill the old manual entry)

**Friday rule-kill review:** every locked rule that hasn't fired in 30 days → archive. Doctrine that doesn't breathe accumulates cost without producing safety. 15 min/week.

First Friday rule-kill review fires the first Friday after the doctrine has aged 7 days. Until then, the rule is dormant by design — a doctrine days old has no firing surface to evaluate against.

If you find yourself adding more locked rules than you're killing on Fridays, that's the recursion firing through the orchestrator. Stop drafting and ship something.

---

**calc version:** v2 (Pythagorean LP w/ 11/22/33 masters · tropical sun · real lunar new year tables · real solar-term tables · canonical Asia/Shanghai date-precision for cusps)
**content version:** v0.2.7-public (catalog-only; optional rising-sign surface coordinate; numerology text triplet surface [life path, expression, soul urge]; symbol-label visibility toggle §5 allow-list; engine computes catalog positionally, no card strings in public runtime · full content lives privately at `~/dev/8ball-private/cards.v1.full.js`; opt-in feedback surface §5.B; 18+ acknowledgment gate §4.A)
**doctrine version:** MERGE_DATE_TBD · v0.20 (§3 calc v2 — real lunar new year + solar-term tables; getInnerAnimal signature change; date-precision Asia/Shanghai cusp resolution)
- v0.19: §5 allow-list extended with `eight_ball_labels_revealed_v1`.
- v0.18: §4.A added — 18+ acknowledgment gate, click-through (no verification), one-time, persists via separate localStorage flag.
- v0.17: §5.B added — feedback surface, user-initiated only, single named endpoint, native form POST, fail-silent.
