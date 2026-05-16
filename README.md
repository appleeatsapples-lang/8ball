# 8 ball

> it already knows. you just have to ask.

A magic 8-ball that knows you. Enter your name and DOB once; optionally add birth time and city (autocompletes from a 53k-entry GeoNames subset; sets IANA timezone + lat + lng atomically) for rising sign. Shake. The answer is your seven baseline calibrated coordinates — sun sign, Chinese five-element, public animal (year-pillar), private animal (month-pillar), life path, name number, and soul urge — plus optional rising sign and the catalog index of the card the (sun sign, public animal) pair selects from a 144-card grid (12 sun rows × 12 animals). Sun and rising pair via `↑`; animals pair via `⇌`; numerology renders as a text triplet (life path, expression/name number, soul urge), always space-separated (e.g. `7 7 7`, `3 11 3`). Rising sign is surface-only. Life path drives bracket resolution (low/mid/high) within a cell, not the catalog index.

**The card content ships in the public bundle.** This public repo includes the calculations, the UI, the positional catalog map, and `content/cards.v1.full.js` — 144 entries with name/type/habit/note × low/mid/high brackets. The locked render path shows symbols only; the unlocked render path (gated by paid credits per DOCTRINE §1 v0.22 / §4.B / §5.C) shows the full card content. The deck bytes are inspectable via View Source — the lock is a UI convention, not a vault. Private authoring source is preserved at `~/dev/8ball-private/cards.v1.full.js`.

## Run locally

```bash
npm run dev      # serves on http://localhost:5173
```

ES modules need an HTTP context — opening `index.html` directly via `file://` will fail at the import lines. The `dev` script just starts a static server, no build.

## Test

```bash
npm test         # vitest, 586 cases as of v0.3.0+
```

Six CI stages per [`DOCTRINE.md §7`](./DOCTRINE.md):

1. Calculation contract + engine pipeline — `tests/profile.test.js`, `tests/rising.test.js`, `tests/cities.test.js`, `tests/countries.test.js`, `tests/numerology_display.test.js`, `tests/labels_reveal.test.js`, `tests/age_gate.test.js`, `tests/dob_validation.test.js`, `tests/payments_markup.test.js`. `tests/fixtures.json` is the source of truth for `core/profile.js`; the algorithm must match every fixture exactly. Changes need updates in lockstep (see [`DOCTRINE.md §3`](./DOCTRINE.md)). These files also cover the `getCard` pipeline against the full positional catalog (12 sun × 12 animal = 144), `resolveBracket` cases, rising-sign math, and the v0.22 extension that scans `content/cards.v1.full.js` against the banned-voice-register policy.
2. Privacy scan — `tests/privacy_scan.test.js`. No unpermitted network calls (only DOCTRINE §5-permitted same-origin lazy loads and §5.B user-initiated feedback POST / Gumroad Buy Link redirect); no third-party fonts or scripts; system fonts only.
3. PII scan — `tests/pii_scan.test.js`. Operator-name leakage, SIRR cross-reference leakage, labeled-DOB leakage.
4. Dependency discipline — `tests/dependency_discipline.test.js`. No card-content imports in the public engine; no runtime deps; devDependencies ≤ 5.
5. Single-file rule — `index.html` ≤ 1500 lines (currently 1455).
6. Payments state machine — `tests/payments_state.test.js` (`isNewPair`, `nextShakeState`, `applyPaidReturn` transitions; replay-attack no-pending branch; same-profile idempotence; pending-profile round-trip) plus `tests/feedback_surface.test.js`.

## Structure

```
8ball/
├── index.html               UI + boot, single file, ES modules (≤1500 LOC per §6)
├── core/                    7 pure-logic ES modules — no DOM
│   ├── profile.js           sun, animals, life path, name number, soul urge, personality, birthday, maturity
│   ├── engine.js            positional 144-card catalog + bracket resolution
│   ├── rising.js            Meeus ascendant — DST + historical-tz aware
│   ├── countries.js         legacy v0.2.1 fixed-offset entries (backward-compat for stored profiles)
│   ├── calendar.js          Meeus lunar new year + solar terms, 1900–2100
│   ├── cities.js            city autocomplete loader (lazy-loads assets/cities.json)
│   └── payments.js          pure state machine: isNewPair, nextShakeState, applyPaidReturn
├── ui/                      DOM-touching ES modules — init*UI({refs}, {hooks}) DI shape per §6 v0.23
│   ├── payments.js          paywall modal controller + ?paid=t1 handler
│   └── profile.js           profile persistence + form helpers
├── content/
│   └── cards.v1.full.js     144-card deck (name/type/habit/note × low/mid/high) — JS-gated per §1 v0.22
├── agents/                  agent role docs + platform constraints (per DOCTRINE §10 v0.24)
├── tests/                   14 test files + fixtures.json
│   ├── fixtures.json        calculation contract — locked, hand-verified
│   ├── profile.test.js      calc + engine pipeline
│   ├── rising.test.js       rising-sign math + integration
│   ├── cities.test.js       city autocomplete + tz integration
│   ├── countries.test.js    country data quality
│   ├── numerology_display.test.js   triplet rendering invariants
│   ├── labels_reveal.test.js        symbol-label toggle markup
│   ├── age_gate.test.js             §4.A 18+ ack markup
│   ├── dob_validation.test.js       future-DOB submit-gate + HTML5 max=
│   ├── feedback_surface.test.js     §5.B Call 1 form invariants
│   ├── payments_state.test.js       §6 state machine transitions
│   ├── payments_markup.test.js      §5.B Call 2 paywall + Buy Link markup
│   ├── privacy_scan.test.js no unpermitted network / system fonts only
│   ├── pii_scan.test.js     operator/SIRR/labeled-DOB boundary
│   └── dependency_discipline.test.js  no runtime deps, no card-content imports
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

Netlify, free tier, `main` branch. Auto-deploys on push when the GitHub repo is connected.

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
