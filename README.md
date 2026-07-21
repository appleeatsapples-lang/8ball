# 8 ball

> it already knows. you just have to ask.

A magic 8-ball that knows you. Enter your name and DOB once; optionally add birth time and city (autocompletes from a 53k-entry GeoNames subset; sets IANA timezone + lat + lng atomically) for rising sign. Shake. The free card surfaces **five** calibrated coordinates from your date of birth — tarot birth card, sun sign, public animal (year-pillar), life path, and the catalog numeral — rendered on a constant compartment **specimen sheet**: every coordinate has a cell, and the ones above your tier show as sealed hatches (withheld, not absent). Every one of the fourteen sheet cells is clickable and keyboard-accessible. A resolved cell opens its value-specific meaning, followed by a separate contextual reading. Numerology is a strict nine-number system: life path, name number, soul urge, personality, birthday, and maturity resolve only to 1–9, and each resolved number is interpreted in its own role `with the other numbers`; a name with no contributing vowel or consonant shows an honest unresolved dash rather than a tenth value `0`. Other coordinates retain the broader `in this sheet` context—for example, Earth stability as the material tempo working through Capricorn ambition and Snake discretion. Unresolved and sealed cells explain why no meaning can yet join the sheet without exposing a hidden value. The catalog numeral remains separate and is not a detail trigger. Three paid rungs ($3 / $6 / $9) open the rest of the sheet — your name enters the math at the first rung: rising sign, five-element, private animal, name number, soul urge; then personality, birthday, maturity, day pillar; then the hour pillar and the written 144-card entry. At t3, each explicit `flip again` spends one read and rotates that entry through its three shipped note positions; flips at lower tiers remain cosmetic. Reveal labels to read each coordinate's name, its derivation, and which counting system it belongs to; the result also states how many of the fifteen coordinates are open versus sealed at paid tiers. The catalog index is the card the (sun sign, public animal) pair selects from a 144-card grid (12 sun rows × 12 animals); life path anchors the first visible note position (low/mid/high) within a cell, not the index. All coordinates are surface-only — they never feed the catalog driver. Completed readings can be saved explicitly to Previous Readings in the same browser, then reopened, renamed, deleted, or cleared, or selected in pairs for a finite structural Concordance. Both entries are recalculated through the existing pipeline before relation lookup; there is no account, sync, or remote copy.

**The card content ships in the public bundle.** This source tree includes the calculations, the UI, the positional catalog map, and `content/cards.v1.full.js` — 144 entries with name/type/habit/note × low/mid/high brackets. The locked render path shows symbols only; the unlocked render path (gated by paid credits per DOCTRINE §1 v0.22 / §4.B / §5.C) shows the full card content. The deck bytes are inspectable via View Source — the lock is a UI convention, not a vault. Private authoring source is preserved at `~/dev/8ball-private/cards.v1.full.js`.

## Run locally

```bash
npm run dev      # serves on http://localhost:5173
```

ES modules need an HTTP context — opening `index.html` directly via `file://` will fail at the import lines. The `dev` script just starts a static server, no build.

## Test

```bash
npm test         # vitest — file count: CLAUDE.md (canonical); case count: newest journal.md entry
```

Six CI stages per [`DOCTRINE.md §7`](./DOCTRINE.md):

1. Calculation contract + engine pipeline — `tests/profile.test.js`, `tests/rising.test.js`, `tests/cities.test.js`, `tests/countries.test.js`, `tests/numerology_display.test.js`, `tests/labels_reveal.test.js`, `tests/dob_validation.test.js`, `tests/payments_markup.test.js`. `tests/fixtures.json` is the source of truth for `core/profile.js`; the algorithm must match every fixture exactly. Changes need updates in lockstep (see [`DOCTRINE.md §3`](./DOCTRINE.md)). These files also cover the `getCard` pipeline against the full positional catalog (12 sun × 12 animal = 144), `resolveBracket` cases, rising-sign math, the v0.22 deck scan, and the §1.G content-policy/completeness scans over both `content/meanings.v1.js` and the additive `content/meanings.v2.js` context layer.
2. Privacy scan — `tests/privacy_scan.test.js`. No unpermitted network calls (only DOCTRINE §5-permitted same-origin lazy loads and §5.B user-initiated feedback POST / Gumroad Buy Link redirect); no third-party fonts or scripts; system fonts only. Saved Readings adds one doctrine-allow-listed local key; `tests/readings.test.js` locks its minimal schema and lifecycle. Concordance adds no key or schema field; `tests/concordance.test.js` locks its transient recomputation boundary and finite relation inventory.
3. PII scan — `tests/pii_scan.test.js`. Operator-name leakage, SIRR cross-reference leakage, labeled-DOB leakage.
4. Dependency discipline — `tests/dependency_discipline.test.js`. No card-content imports in the public engine; no runtime deps; devDependencies ≤ 5.
5. Single-file rule — `index.html` ≤ 1500 lines (CI-enforced; the current count lives in the newest `journal.md` entry, not here).
6. Payments state machine — `tests/payments_state.test.js` (`isNewPair`, `nextShakeState`, `applyPaidReturn` transitions; replay-attack no-pending branch; same-profile idempotence; pending-profile round-trip), `tests/facet_rotation.test.js` (t3-only round-robin note rotation, debit coupling, persistence, zero-credit no-hidden-burn path), plus `tests/feedback_surface.test.js`.

## Structure

```
8ball/
├── index.html               UI + boot, single file, ES modules (≤1500 LOC per §6)
├── core/                    10 pure-logic ES modules — no DOM
│   ├── profile.js           sun, animals, numbers; aggregates birth card + day/hour pillars
│   ├── engine.js            positional 144-card catalog + bracket resolution
│   ├── rising.js            Meeus ascendant — DST + historical-tz aware
│   ├── birthcard.js         Major Arcana birth card (digit-sum reduction) — v0.5.0
│   ├── pillars.js           day + hour BaZi pillars (stem+branch+element) — surface-only
│   ├── countries.js         legacy v0.2.1 fixed-offset entries (backward-compat for stored profiles)
│   ├── calendar.js          Meeus lunar new year + solar terms, 1900–2100
│   ├── cities.js            city autocomplete loader (lazy-loads assets/cities.json)
│   ├── math.js              shared primitives: euclidean mod, sumDigits, normalizeDeg
│   └── payments.js          pure state machines: new-profile reads + t3 facet rotation
├── ui/                      10 ES modules — init*UI({refs}, {hooks}) DI shape for DOM controllers; pure concordance lookup
│   ├── tiers.js             compartment-card render + shareRowRefs + provenance/atlas/density
│   ├── payments.js          paywall/paid-return controller + t3 current-facet storage
│   ├── profile.js           profile persistence + form helpers
│   ├── readings.js          Saved Readings storage + previous/read/rename/delete/clear UI
│   ├── concordance.js       pure post-calculation relation lookup; no DOM/storage/network
│   ├── share.js             free card → on-device PNG → Web Share / clipboard fallback
│   ├── labels.js            symbol-label reveal toggle (§6 split)
│   ├── meanings.js          all-cell value meaning + deterministic sheet context (§1.G v0.53)
│   ├── modals.js            about / forget controllers + escape-to-close + focus trap (§6 split)
│   └── citysearch.js        city-autocomplete controller — debounce, race guard, polar mirror (§6 split)
├── content/
│   ├── cards.v1.full.js     144-card deck (name/type/habit/note × low/mid/high) — JS-gated per §1 v0.22
│   ├── meanings.v1.js       58 tradition-cited coordinate meanings (§1.G v0.44) — static, no network call
│   ├── meanings.v2.js       element meanings + all-coordinate context roles (§1.G v0.53)
│   ├── concordance.v1.js    immutable historical relation registry (§1.I v0.51)
│   └── concordance.v2.js    active registry for strict 1–9 numerology (§1.I v0.54)
├── agents/                  agent role docs + platform constraints (per DOCTRINE §10 v0.24)
├── tests/                   vitest files + fixtures.json — counts: CLAUDE.md + newest journal entry
│   ├── fixtures.json        calculation contract — locked, hand-verified
│   ├── profile / rising / cities / countries / birthcard / pillars  core calc + engine pipeline
│   ├── tiers / labels_reveal / numerology_display / prose_coordinate_count  surface + tier render
│   ├── provenance / atlas / density   CLP legibility surfaces (DOCTRINE §1.E / §1.F)
│   ├── meanings_content / meanings_ui   coordinate meanings content policy + DI shape (DOCTRINE §1.G)
│   ├── share_surface / readings / concordance / payments_markup / payments_state / facet_rotation / feedback_surface / modals  UI surfaces + state
│   └── privacy_scan / pii_scan / dependency_discipline / dob_validation / rising_disclosure  guards
├── audits/                  release checklist + local PII audit + cross-model briefs
├── assets/                  cities.json + favicons + og:image
├── .github/workflows/ci.yml CI gate (6 stages per §7)
├── netlify.toml             headers + SPA redirect
├── DOCTRINE.md              constitution — read every release
├── 8BALL.md                 canonical context, AI-readable
├── journal.md               append-only release log
└── README.md                this
```

## Deploy

Netlify, **Pro plan ($20/mo — corrected 2026-07-10; earlier docs wrongly said free tier)**, `main` branch. Auto-deploys on push when the GitHub repo is connected.

First-time Netlify setup:

1. https://app.netlify.com/start → "Import from GitHub" → pick this repo.
2. Build command: leave blank.
3. Publish directory: `.` (or set to repo root).
4. Deploy. The first build will pick up `netlify.toml` and apply security headers.

## Read before contributing

[`DOCTRINE.md`](./DOCTRINE.md) is the constitution. The two load-bearing sections are:

- **§3 Calculation contract** — fixtures gate algorithm changes.
- **§4 Content rules** — what card lines (name/type/habit/note × low/mid/high) can and can't say.

Anything that contradicts the doctrine requires an explicit doctrine amendment in the same change.

## License

MIT. See [`LICENSE`](./LICENSE).
