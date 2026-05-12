# 8ball — DOCTRINE.md

> One page. Read every release. Edit only deliberately.

This document is the constitution of `8ball`. The codebase obeys it. PRs that contradict it require an explicit doctrine amendment in the same change.

## §1. What this is

A fixed designed deck that knows you. Enter your name and date of birth once. Shake.

The product calculates ten baseline calibrated coordinates from (name, DOB): sun sign, Chinese five-element, public animal (year-pillar), private animal (month-pillar), life path, expression/name number, personality, maturity, soul urge, and birthday. The two animals pair on a single line via an equilibrium arrow (`⇌`); three of the numerology coordinates (life path, expression/name number, soul urge) render as a text triplet on line 4 of the result card. The (sun sign, public animal) pair drives a 144-card catalog index — computed positionally in `core/engine.js` (sun-row × 12 + animal-col + 1, rendered as roman numeral). Life path drives bracket resolution (low/mid/high) within a card cell via `resolveBracket`, not the catalog index. The catalog index is the only card-derived field surfaced.

As of v0.2.3 the result card surfaces seven of the ten baseline coordinates (chinese five-element, sun, public animal, private animal, life path, expression/name number, soul urge), optional rising sign, and the catalog index. The remaining three baseline coordinates (personality, birthday, maturity) are computed on buildProfile but reserved for v0.3.0+ paid surfacing — see §1.B. The card content itself (name, type, habit, note per cell) is the future paid interpretation layer and lives outside this repo (`~/dev/8ball-private/`). The public repo ships no card strings — the engine computes catalog from positional math without any content import. The free surface is symbols only — no interpretation, no per-symbol explanation.

The voice is declarative-observational, framed in strengths and weaknesses. Cards openly reference the symbol systems they draw from — sun sign, Chinese five-element, Chinese zodiac animals (year and month pillars), numerology life path, name number, soul urge — and name them as such.

**v0.22 amendment (v0.3.0).** As of v0.3.0, the public repo ships the full card-content layer at `content/cards.v1.full.js` (144 entries, name · type · habit · note × low/mid/high). Visibility is JS-gated behind the `eight_ball_credits_v1` localStorage flag — unset/zero renders the locked surface (symbols only), positive value renders the unlocked surface (symbols + card-content). The deck bytes are inspectable via View Source — the lock is a UI convention, not a server-gated fortress (see §5.C). **The free-surface invariant "symbols only — no interpretation, no per-symbol explanation" still applies to the locked render path; the unlocked render path is the named exception, gated by paid credits.**

**§1.A. Rising sign — surface coordinate, not a driver.**

As of v0.2.1 the result card surfaces an eighth coordinate when the operator provides birth time, country, latitude, and longitude: the rising sign (astronomical ascendant). Rising sign is computed from `(year, month, day, hour, minute, utcOffsetMinutes, lat, lng)` via standard ascendant math (Meeus); see `core/rising.js` for the exact algorithm. It is rendered on line 2 of the result card paired with the sun sign as `${sunSign} ↑ ${risingSign}`.

Rising sign is **surface-only**: it does not enter `getCard`, `resolveBracket`, or any catalog computation. The catalog driver remains `(sunSign, animal)` per §1. Rising adds a coordinate to the visual surface; it does not branch the card layer.

When any of (time, country, lat, lng) is missing, rising sign is `undefined` and line 2 falls back to the v0.2.0 bare-sun-sign render. Existing v0.2.0 profiles in localStorage continue to work without modification.

**v0.21 amendment (v0.2.7.2).** Birthplace input is city-level via `core/cities.js` — a 53,308-entry pop≥7500 subset of GeoNames cities5000, lazy-loaded from `assets/cities.json` per §5 (v0.21 same-origin lazy-load permission). Selecting a city atomically sets `tz` (IANA timezone), `lat`, `lng`, and country code on the form state. The country-centroid + fixed-UTC-offset path from v0.2.1 is retained inside `core/profile.js` for backward compatibility with stored v0.2.1–v0.2.7.1 profiles, but the UI no longer surfaces country selection.

Rising-sign math is now DST-aware and historical-tz-aware. The new `computeRising({...tz...})` API in `core/rising.js` resolves the UTC offset for the (year, month, day, hour, minute) wall-time input via `Intl.DateTimeFormat` with `{ timeZone: tz, timeZoneName: 'longOffset' }` — gives correct offset including DST transitions and historical-rule changes (e.g. Indiana pre-2006 no-DST, Russia post-2014 permanent UTC+3, US summer DST). Legacy `getRisingSign(..., utcOffsetMinutes, ...)` is retained for v0.2.1+ stored-profile rehydration; both APIs are polar-safe.

Polar latitudes (|lat| > 66.5°, strictly past the polar circles) return `null` from both rising APIs. The horizon-plane geometry degenerates at the poles and a rising sign is not astrologically meaningful inside the polar circle. The UI surfaces "rising unavailable at this latitude" at city-selection time when |lat| > 66.5°. Boundary cases (|lat| == 66.5°) return a valid sign — the rule is strict greater-than.

Pre-1970 dates: `Intl.DateTimeFormat`'s historical-tz coverage falls back to LMT (Local Mean Time) approximation for some timezones in pre-tzdata-coverage periods. This is acknowledged as a precision tradeoff; the about-modal disclosure copy lands at v0.2.8 (calculator-framing rewrite cycle).

The v0.14 wording (fixed UTC offsets per country entry; DST and historical-tz changes "out of scope") is retired by this amendment. The catalog-driver rule (rising surface-only, never entering `getCard` or `resolveBracket`) is unchanged.

**§1.B. Numerology surface — text triplet, calc reserved.**

As of v0.2.3 the result-card numerology surface renders as a three-number text line: life path, expression/name number, soul urge. Values are always space-separated for readability (e.g. `3 8 3`, `3 11 3`). **v0.23 amendment (CiC Fix A): the v0.22 hasMaster-branched concatenation (`383` for all-single-digit, spaced when any master present) is retired — the concatenated form read cognitively as a single three-digit number rather than three independent coordinates.** Codified by `tests/numerology_display.test.js`.

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
- **Arcade-toy carve-out (v0.22, v0.3.0).** Paid surface is one-time purchase, fixed-credit. Three dollars buys three reads with depth content unlocked. Tier ladders (v0.3.1+: $6 / 6 tries at depth+hexagon; $9 / 9 tries at depth+hexagon+four) extend the model without changing its shape. Not a subscription. Device-stored credit counter preserves the no-account constraint. The arcade frame is load-bearing — any future amendment that breaks `dollars == tries` or introduces recurring billing requires explicit re-amendment.

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

- **calc v2** (v0.2.7.1) — Real lunar new year table for year-pillar cusps (year-pillar animal + 5-element pillar). Real solar-term table for month-pillar (`innerAnimal`). Both tables span 1900–2100, evaluated at date-precision in canonical Asia/Shanghai timezone (UTC+8); DOB given as `YYYY-MM-DD` is treated as the truth — no timezone conversion of user input. Lunar new year dates and the 12 month-start solar-term dates are computed in JS via Meeus astronomical algorithms (Chapter 25 sun position, Chapter 49 lunar phases with periodic + planetary corrections), mirroring the `core/rising.js` Meeus pattern; results match Hong Kong Observatory canonical tables byte-exact at the sanity-lock checkpoints in `tests/profile.test.js`. Zero runtime deps, zero devDeps, zero build step. The v1 Feb-4 fixed-cutoff approximation is retired. **`getInnerAnimal` signature changed from `(month, day)` to `(year, month, day)`** as a breaking calc change. All existing fixtures other than the v1-bug-locking fixture #6 (CNY Feb 4 cutoff) remain byte-identical; fixture #6 is intentionally re-spec'd because it was locking the bug being fixed.
- **calc v1** (initial through v0.2.7) — Pythagorean life path with master numbers 11/22/33 preserved at the final reduce. Western tropical sun signs at standard cusps. Chinese zodiac with Feb 4 cutoff approximation (retired in calc v2). Additively extended at v0.2.0 with: chinese five-element (2-year cycle, 1924 anchor), public/private animal split (year-pillar already present at `animal`; month-pillar added as `innerAnimal` via solar-term cutoff approximations), soul urge (vowel-only Pythagorean, masters preserved), and unreduced sums (lifePathSum, nameNumberSum, soulUrgeSum) exported for potential future surfacing. Additively extended at v0.2.1 with optional rising sign (surface-only ascendant) when birth time + country + lat/lng are present. All additions covered by direct unit tests in `tests/profile.test.js` and `tests/rising.test.js`; existing fixtures unchanged.

If a fixture changes silently, the test gate catches it. If a test changes silently, code review catches it. If both change in the same commit without a doctrine note, the reviewer rejects.

## §4. Content rules — copy & traits

- **No slurs.** Banned-pattern check runs in `tests/profile.test.js`.
- **No medical/diagnostic framing.** Cards do not adopt clinical or diagnostic vocabulary, including ironic adoption (e.g., "diagnosis," "syndrome," "disorder").
- **Cultural-symbol respect.** If the deck draws from any tradition (tarot, I Ching, runes, zodiac, etc.), cards respect that tradition's lineage. No syncretic flattening, no caricature of source traditions.
- **No targeting minors.** Copy assumes adult user. UI does not pander to children. As of v0.2.6, an 18+ acknowledgment gate is required before name/DOB entry — see §4.A.
- **No real-person targets.** No "you're like [public figure]" lines.
- **Universal floor.** Cards should land equally on a person who picked their own DOB.
- **No card-content strings in tracked files.** As of v0.2.0 the card content (cell `name`, `type`, `habit`, `note` bodies) lives privately at `~/dev/8ball-private/cards.v1.full.js`. No public-repo tracked file (source, tests, fixtures, `journal.md`, audit notes, this doctrine) may contain a card-content string. Audit dispositions and content-batch logs reference cells by coordinate path (e.g. `aries.rabbit.note.mid`); before/after strings are stored with the private deck. Forward-looking from doctrine v0.11; pre-v0.11 trait-pool / template-pool excerpts in journal entries (retired `traits.v1.js` / `templates.v1.js` system, deleted from repo in 2F-2) are out of scope. **v0.22 amendment (v0.3.0):** the rule is scoped, not retired — exactly one tracked file, `content/cards.v1.full.js`, is permitted to contain card-content strings (the 144-card content layer: `name`, `type`, `habit`, `note` × `{low, mid, high}` brackets). All other tracked files remain prohibited, including source modules in `core/`, all `tests/`, `tests/fixtures.json`, `journal.md`, audit notes under `audits/`, `DOCTRINE.md`, `8BALL.md`, `README.md`. Audit dispositions continue to reference cells by coordinate path; the carve-out covers the deck file alone, not its discussion in tracked text. Voice-register enforcement (`BANNED_VOICE_REGISTER` scan in `tests/profile.test.js`) now runs against `content/cards.v1.full.js`. The private location at `~/dev/8ball-private/cards.v1.full.js` is retained as the authoring source; `content/cards.v1.full.js` is a verbatim copy maintained via `cp` at release-prep time.
- **Versioned, not edited.** Shipped content batches are immutable. New release = new file (e.g. `traits.v2.js`, `cards.v2.js`). Diff lives in `journal.md`.

**§4.A — 18+ acknowledgment gate.**

As of v0.2.6 the product gates entry to the onboarding form behind a one-time 18+ acknowledgment. Mechanics:

- On first load, a modal blocks the onboarding form. Single button: "confirm." Tapping it is the acknowledgment.
- Acknowledgment persists via `eight_ball_age_ack_v1` localStorage flag (string `'true'` on confirm). On subsequent visits the gate is skipped.
- Acknowledgment is a click-through, not verification. Copy must be explicit about that — no implication of legal age-gating, no health-product warning theatre, no false claim of identity verification.
- Disclosure: the about-modal mentions the gate's existence and shape so the user knows what the storage flag is for.

If a future feature needs harder age verification (paid tier, adult-content layer, regulatory requirement), that requires a §4.A amendment and likely a §5 amendment for whatever data-collection surface the verification introduces.

**§4.B — Three-free-tries cap (v0.22, v0.3.0).**

Three free tries total per device. First three unique `(name, dob)` pairs render the locked card (symbols visible, depth bars dimmed, lock icon top-left — Pattern C surface per `~/Desktop/8ball/sessions/v03_pattern_c_locked_vs_unlocked.html`). The fourth new pair triggers the paywall modal. The cap is monotonic and per-device — wiping localStorage resets it. Paying does not reset the cap; paying adds paid credits separately (see §5 `eight_ball_credits_v1`). The about-modal discloses the cap exists ("first three readings are free. after that, three dollars buys three more reads…"). The localStorage-wipe reset is intentionally not advertised in user-facing copy — disclosing the cap shape is the load-bearing disclosure; advertising the bypass is not.

The cap exists to admit the offer plainly: this is a paid toy, not an ad-supported product, not a free-trial-with-aggressive-upsell. Three free tries is the demo.

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
- optional `city` (city display name from `assets/cities.json` — user's birthplace selection. Added v0.2.7.2.)
- optional `cc` (ISO 3166-1 alpha-2 country code, paired with `city` for display rehydration. Added v0.2.7.2.)
- optional `tz` (IANA timezone string — drives DST-aware rising-sign computation per §1.A v0.21. Added v0.2.7.2.)
- `eight_ball_age_ack_v1` — separate boolean flag (string `'true'`) set when the user confirms the 18+ acknowledgment gate per §4.A. Independent of the profile payload.
- `eight_ball_labels_revealed_v1` — separate string flag (`'true'` or `'false'`) tracking whether the user has chosen to reveal the symbol-name labels on the result card. UI preference only; independent of the profile payload. Added v0.2.7.
- `eight_ball_tries_used_v1` — integer (serialized as string). Monotonic counter incrementing on every new-pair shake regardless of paid state. Read against the constant `3` for the §4.B cap check. Added v0.3.0.
- `eight_ball_credits_v1` — integer (serialized as string). `+= 3` on each `?paid=t1` handler invocation; decrements by 1 on each new-pair shake when `> 0`. Hits zero → next new-pair triggers paywall or locked render depending on `tries_used`. Non-negative invariant. Added v0.3.0.
- `eight_ball_pending_profile_v1` — JSON-stringified profile object, transient. Written when the paywall modal opens (both Path A new-pair shake and Path B lock-tap on already-rendered card per §5.C). Consumed on the `?paid=t1` return: one credit decremented, profile saved to `eight_ball_profile_v1`, key deleted. Lifetime is one round-trip; either absent or present-and-valid. Added v0.3.0.

Nothing else. No derived profile is stored — it's recomputed on each load. No analytics. No third-party endpoints. No third-party scripts. System fonts only.

**Network behavior is scope-restricted, not absolute** (v0.21 amendment). The product makes no telemetry calls, no third-party calls, no fingerprinting calls, no out-of-band data flow. The following same-origin asset loads are permitted:

- **Initial page load.** HTML and ES modules served from the deployed origin, plus same-origin static assets (favicons, og:image).
- **Same-origin lazy loads.** Dynamic ES `import()` of same-origin JSON or modules. As of v0.2.7.2, `assets/cities.json` is lazy-loaded the first time the user opens the rising-sign `<details>` element. Lazy loads carry no user state — they fetch a static asset whose bytes are identical for every visitor.
- **§5.B user-initiated network calls.** Two outbound network calls, both user-initiated (see §5.B): (1) feedback form POST to Netlify Forms, (2) Lemon Squeezy Buy Link redirect for paid-tier unlock. Added v0.3.0.

`fetch()`, `XMLHttpRequest`, and `navigator.sendBeacon` remain forbidden in tracked source under `core/`, `content/`, and `index.html` — enforced by `tests/privacy_scan.test.js`. Dynamic `import()` with import attributes (`with: { type: 'json' }`) is the permitted same-origin lazy-load mechanism for static JSON; it does not trip the `fetch(` ban because it is an ES module-loader call, not an XHR.

The v0.14 wording "zero network requests after page load" is retired by this amendment. The intent — no third-party traffic, no telemetry, no out-of-band data flow — is preserved verbatim.

If a future feature requires storing or transmitting more, that feature requires a doctrine amendment to §5 and a privacy-policy update before merge.

## §5.B — User-initiated network calls (feedback v0.2.5, LS redirect v0.3.0)

The site permits exactly two user-initiated network calls:

1. **Feedback POST** — submission of a feedback form to the Netlify Forms endpoint at the same origin (added v0.2.5).
2. **Lemon Squeezy Buy Link redirect** — navigation away to the operator's hosted Lemon Squeezy checkout when the user taps the paywall CTA (added v0.3.0).

Both calls are out-of-band — neither echoes user profile state. These are the only network calls permitted in the product runtime; everything else in §5 stands.

### Call 1 — Feedback POST

Constraints:

- **User-initiated only.** The submission fires only on user click of the explicit submit button. No timer, no auto-fire, no submission on page load, on shake, on result-render, or on any other implicit trigger.
- **User-authored content only.** The submitted payload contains exactly two fields: a free-text `message` and an optional free-text `contact`, both typed by the user inside the form. No localStorage profile data (`name`, `dob`, `time`, `country`, `lat`, `lng`, `city`, `cc`, `tz`) is included. No derived coordinates. No name, no DOB, no IP enrichment from the page, no analytics tags, no UTM params, no fingerprint. The form has no hidden field carrying user-data state.
- **Single named endpoint.** The `<form>` action is the same-origin Netlify Forms handler (no `action` attribute or `action="/?sent=1"` for redirect after submit; Netlify intercepts the POST). No third-party form provider, no webhook fan-out, no secondary destination.
- **Native form post, no JavaScript fetch.** The form uses HTML `<form method="POST" data-netlify="true">` semantics. No `fetch()`, no `XMLHttpRequest`, no `navigator.sendBeacon`. The privacy scan (`tests/privacy_scan.test.js`) is unchanged and remains the enforcement.
- **Fail-silent.** On submission failure (offline, provider outage, network error), the browser handles the error natively. No retry queue, no remote error reporting, no telemetry of failure. If the user's browser is offline, the submit fails and the user can decide what to do.
- **Submission visibility.** Submissions land in the Netlify dashboard under the Forms tab. The operator may configure email notifications per Netlify defaults. Submissions are not echoed back to the page or persisted in localStorage.
- **No retention by 8ball.** 8ball-the-codebase does not retain submissions. Netlify-the-platform does (for as long as operator keeps them in the dashboard); that is operator's responsibility, not 8ball's runtime concern.

The about-modal copy is updated to disclose this surface honestly. Disclosure is the load-bearing piece: anyone reading the modal must learn that a feedback form exists and what happens when they submit it.

### Call 2 — Lemon Squeezy Buy Link redirect (added v0.3.0)

User taps `unlock · $3` on the paywall modal → browser navigates to `https://8-ball.lemonsqueezy.com/checkout/buy/<variant-id>` (hosted by Lemon Squeezy, which acts as Merchant of Record). LS processes payment (Stripe under the hood for cards; PayPal at buyer option). On successful payment, LS displays a confirmation page with a return button targeting `https://the-eight-ball.netlify.app/?paid=t1`; on return, the page-load JS handler parses the query, calls `applyPaidReturn()` from `core/payments.js` to credit the device (`+= 3`) and — if `eight_ball_pending_profile_v1` is present — consume it (decrement one credit, save the profile, render unlocked), then `replaceState({}, '', window.location.pathname)` strips the query for a clean URL.

Constraints:

- **User-initiated only.** Tap of the explicit paywall CTA. No timer, no auto-fire, no redirect on page load, on shake, on result-render, or on any other implicit trigger.
- **Hosted redirect, not in-page overlay.** Plain `<a href>` navigation. The Lemon Squeezy overlay script is permanently rejected per §5's third-party-script ban — operator decision logged at `~/Desktop/8ball/controllers/ls_store_state_2026-05-11.md`.
- **No user data leaves on the redirect.** The Buy Link URL is static — no profile fields encoded, no UTM tags, no tracking identifiers appended.
- **No SDK, no `fetch`, no webhook.** 8ball-the-codebase never talks to Lemon Squeezy programmatically; the redirect IS the entire payment surface.
- **Trust-based return.** `/?paid=t1` is unsigned. Manual URL entry grants credits without payment (see §5.C). Acceptable for the arcade-toy model and disclosed in the about-modal.
- **No customer object retained.** Lemon Squeezy captures buyer email for its own receipt and tax compliance; 8ball never sees it. No localStorage entry for purchase metadata beyond `eight_ball_credits_v1` count.
- **Disclosure.** The about-modal names Lemon Squeezy as the payment processor and the data-flow boundary (payment + email to Lemon Squeezy; reading stays on-device). The paywall modal carries a compact `.modal-disclosure` line mirroring the same disclosure.

If a future feature would require a third endpoint, additional fields, or any non-user-initiated network behavior, that requires a further §5 amendment.

## §5.C — Content-delivery transparency (added v0.3.0)

The card-content layer (`content/cards.v1.full.js` — `name`, `type`, `habit`, `note` × 144 cards) ships in the public bundle. JS visibility is gated by the `eight_ball_credits_v1` flag; the data itself is inspectable via View Source, and `/?paid=t1` is not signed — manual URL entry will grant `+= 3` credits without payment. **The lock is a UI convention; the deck is in the source — we trust adults to tip when they enjoyed the toy.**

Backend-gated delivery (Netlify Functions + Stripe webhook verification, or Lemon Squeezy license-key issuance with server-side validation) is doctrinally permitted as a future amendment but not built in v0.3.0. The about-modal discloses the bundle shape so payment is informed-tip, not deception. The disclosure line "the deck is visible in source; the lock is a convention, not a vault" is the load-bearing piece — users tip the operator for the toy, not for content scarcity.

## §6. Architecture

- Single repo, private on GitHub as of v0.2.0 (was public through v0.1.4; flipped private to protect the future paid card-content layer at `~/dev/8ball-private/`).
- Static site. Deployed on Netlify free tier from `main` branch.
- ES modules in the browser. No build step.
- Three-folder source layout: `core/` (logic), `content/` (data — `cards.v1.full.js` 144-card deck added v0.3.0 per §1/§4 amendments), `tests/` (gates). Plus `index.html` and config. The private location at `~/dev/8ball-private/cards.v1.full.js` remains the authoring source; the public `content/cards.v1.full.js` is a verbatim copy maintained via `cp` at release-prep time.
- The single-file rule: `index.html` may not exceed 1500 lines. If it would, split into `ui/*.js` modules. Not before. **v0.23 amendment: the split-target shape is locked. A `ui/*.js` module is an ES module with pure exports (no DOM, vitest-testable without jsdom) alongside DOM-touching helpers gated by an `init*UI({refs}, {hooks})` injection point. Host-side `let` bindings stay in `index.html`; the module mutates them via host-injected setter callbacks (e.g. `setCurrentProfile`, `setSelectedCity`). Module-internal localStorage keys are bare-string `const KEY = '...'` definitions inside the module so `tests/privacy_scan.test.js`'s same-file identifier resolution catches them. Concrete precedents: `ui/payments.js` (v0.3.0 step 6, 165 LOC) and `ui/profile.js` (v0.3.0 step 7, 153 LOC). Future splits inherit the shape rather than re-deriving it.**

## §7. CI gate

`.github/workflows/ci.yml` runs on every push and PR to main. The gate has these stages:

1. **Calculation contract + engine pipeline** — `tests/profile.test.js` must pass (calc cases against `tests/fixtures.json`, `getCard` pipeline across the 144 positional catalog cells, `resolveBracket` cases). **v0.22 extension:** additionally verifies `content/cards.v1.full.js` parses as an ES module exporting `CARDS` with exactly 144 entries (12 sun signs × 12 animals), and runs the existing `BANNED_VOICE_REGISTER` scan against the deck's content strings (`name`, `type`, `habit`, `note.{low, mid, high}` fields).
2. **Privacy scan** — `tests/privacy_scan.test.js` must pass (no network calls, no third-party fonts/scripts, system fonts only). **v0.22 extension:** `LOCALSTORAGE_KEY_ALLOW` extended with `eight_ball_tries_used_v1`, `eight_ball_credits_v1`, `eight_ball_pending_profile_v1` per §5.
3. **PII scan** — `tests/pii_scan.test.js` must pass (operator-name leakage, SIRR cross-reference leakage, labeled-DOB leakage). **v0.22 extension:** scans `content/cards.v1.full.js` for the same banned patterns; no DOB strings should appear in card content but the scan codifies the invariant.
4. **Dependency discipline** — `tests/dependency_discipline.test.js` must pass (npm runtime dependencies absent/empty, no build step, devDependencies ≤ 5).
5. **Single-file rule** — `index.html` ≤ 1500 lines.
6. **Payments state machine** (added v0.3.0) — `tests/payments_state.test.js` must pass (`isNewPair`, `nextShakeState`, `applyPaidReturn` transitions covering credits, cap, paywall trigger, replay-attack `no-pending` branch, same-profile idempotence, pending-profile round-trip). Markup-static assertions for the paywall surface in `index.html` are covered by `tests/payments_markup.test.js` (counted under stage 5's file budget; runs in the same vitest pass).

(History note: the `cards.v*.js` content-scan retired in v0.2.0 when the deck moved private; it returns as of v0.3.0 against the new public-tracked `content/cards.v1.full.js` — see stage 1's v0.22 extension and stage 3's. The private content-authoring pipeline at `~/dev/8ball-private/` continues to run its own scans before each release-prep `cp` to the public path.)

Netlify is configured to auto-deploy on push to `main`. CI runs in parallel on the same push. Failed CI does not currently block the auto-deploy itself — this gap is acknowledged and acceptable while traffic is operator-only. Wiring a Netlify required-check on the GitHub Actions status is queued for the first traction milestone (see `journal.md`); at that point, this paragraph gets re-tightened to "a failed gate blocks the deploy."

## §8. Release ritual

Every release, however small, has automated gates and ritual gates.

**Automated gates (CI, blocking):**

1. CI green (6 stages — calc+pipeline / privacy / PII / dependency / single-file / payments-state). See §7 for the per-stage breakdown.
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

For 8ball at its current scale, the system runs **four agent roles plus one always-on controller**. Full role docs live at `~/dev/8ball/agents/*.md`; platform-specific constraints at `~/dev/8ball/agents/PLATFORMS.md`; this § is the constitutional summary.

**Core agent roles** (v0.24):

| Role | Tool | Role doc | Read access | Write access |
|---|---|---|---|---|
| **Orchestrator** — context, briefs, dispositions, sequencing | Claude (chat) | [`agents/orchestrator.md`](agents/orchestrator.md) | Everywhere in `~/dev/8ball/` and `~/Desktop/8ball/` | Pragmatic for fast initial work; routes through implementer for production-grade edits |
| **Implementer** — multi-file production edits, git ops, repo filesystem | Claude Code (CC) — `/usr/local/bin/claude` | [`agents/implementer.md`](agents/implementer.md) | Repo + `~/Desktop/8ball/` | Repo + `~/Desktop/8ball/` |
| **Auditor** — adversarial pre-merge review on doctrine, content, release-gates | Codex — Mac desktop app, paste-and-relay | [`agents/auditor.md`](agents/auditor.md) | Pasted briefs only | Returns categorized verdicts (PASS / P3 / P2 / P1 / P0) |
| **Verifier** — live UX on deployed product, structured findings + screenshots | Claude in Chrome (CiC) — browser extension | [`agents/verifier.md`](agents/verifier.md) | Per-session domain allowlist (default = read-only/static; non-default requires controller approval) | Reports text + screenshots only; no irreversible action clicks |

**Controller** (always-on, never an agent): the **Operator**. Sole authority for merges, deploys, payments, account changes, sharing-permission changes, TOS acceptance, identity verification flows, and any irreversible third-party action. Full role doc at [`agents/controller.md`](agents/controller.md).

**Adjunct lanes** (not core agents; invoked ad-hoc, no project-specific role doc): **ChatGPT** for content/copy review (paste-relay); **Perplexity** for web search; **Gemini** for second opinion. Per `~/MUHAB.md` §3.

**Lane discipline (v0.24):**

- The orchestrator does NOT autonomously override §4 or §5. Borderline content gets flagged for ChatGPT review before merge.
- Doctrine amendments go through the auditor before merge. Mechanical edits do not.
- All filesystem and git operations route to the implementer for any change touching ≥3 files or modifying `core/`. Single-file documentation tweaks may stay in chat.
- Live-UX verification routes to the verifier post-deploy-preview (pre-merge for surface changes) and post-merge for the first 24–48h on production for any significant ship.
- The controller is always the final approver. No agent auto-merges. Per L48: explicit audit-cleared signal before merge; five-minute-CI-green-to-merge windows are the L48 failure shape.

For per-cycle artifact locations (briefs, audits, directives, reports), see `agents/PLATFORMS.md` "Artifact-location matrix". For SIRR-specific lane discipline, see `~/dev/SIRR/SIRR.md` §7.

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
**content version:** v0.3.0-public-tier-1 (catalog + JS-gated card-content layer at `content/cards.v1.full.js`; locked render = symbols only per §1 free-surface invariant; unlocked render = symbols + name/type/habit/note × low/mid/high gated by paid credits per §1 v0.22 / §4 v0.22 / §4.B / §5.C; rising-sign surface coordinate; numerology text triplet [life path, expression, soul urge]; symbol-label visibility toggle; opt-in feedback surface §5.B Call 1; LS Buy Link redirect §5.B Call 2; 18+ acknowledgment gate §4.A; three-free-tries cap §4.B; content-delivery transparency §5.C; private authoring source preserved at `~/dev/8ball-private/cards.v1.full.js`)
**doctrine version:** 2026-05-12 · v0.24 (§10 restructured as 4 core agents + 1 always-on controller + adjuncts; agents/ folder formalized with `AGENTS.md`, `PLATFORMS.md`, and 5 role docs at `agents/orchestrator.md` / `implementer.md` / `auditor.md` / `verifier.md` / `controller.md`; v0.23 5-row table reshaped, lane labels aligned with role docs, ChatGPT moved from core lane to adjunct, verifier (Claude in Chrome) added as the fourth agent role)
- v0.23: 2026-05-11 (§1.B amended — numerology triplet always space-separated, v0.22 hasMaster branch retired post-CiC Fix A; §4.B amended — about-modal discloses cap shape, not the localStorage-wipe reset; §6 amended — ui/*.js split pattern locked with `ui/payments.js` + `ui/profile.js` as concrete precedents and DI shape specified).
- v0.22: §1 / §2 / §4 / §5 / §5.B / §5.C / §6 / §7 amended or added — paid surface (3 free + $3/3 reads via LS Buy Link redirect; public-bundle JS-gated deck delivery; arcade-toy carve-out; payments state-machine CI stage).
- v0.21: §1.A amended — DST + historical-tz handling in scope; city-level birthplace via core/cities.js; |lat|>66.5° returns null. §5 amended — same-origin lazy loads permitted, fetch() ban preserved. §5 allow-list extended with city/cc/tz.
- v0.20: §3 calc v2 — real lunar new year + solar-term tables; getInnerAnimal signature change; date-precision Asia/Shanghai cusp resolution.
- v0.19: §5 allow-list extended with `eight_ball_labels_revealed_v1`.
- v0.18: §4.A added — 18+ acknowledgment gate, click-through (no verification), one-time, persists via separate localStorage flag.
- v0.17: §5.B added — feedback surface, user-initiated only, single named endpoint, native form POST, fail-silent.
