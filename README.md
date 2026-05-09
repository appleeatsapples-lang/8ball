# 8 ball

> it already knows. you just have to ask.

A magic 8-ball that knows you. Enter your name and DOB once. Shake. The answer is your seven calibrated coordinates — sun sign, Chinese five-element, public animal (year-pillar), private animal (month-pillar), life path, name number, and soul urge — plus the catalog index of the card the (sun sign, public animal) pair selects from a 144-card grid (12 sun rows × 12 animals). Animals pair on a single line via `⇌`; numerology collapses to a reduced triplet (`777` when single-digit, `3 11 3` when masters present). Life path drives bracket resolution (low/mid/high) within a cell, not the catalog index.

**The card content (interpretation) is private.** This public repo ships only the calculations, the UI, and a positional catalog map — the engine computes the catalog index from `(sun-row × 12 + animal-col + 1)` without loading any card strings. The full card content lives outside the repo; the future paid product surfaces it via reveal interaction.

## Run locally

```bash
npm run dev      # serves on http://localhost:5173
```

ES modules need an HTTP context — opening `index.html` directly via `file://` will fail at the import lines. The `dev` script just starts a static server, no build.

## Test

```bash
npm test         # vitest, 102 cases as of v0.2.0
```

Four suites:

1. Calculation contract + engine pipeline — `tests/profile.test.js`. `tests/fixtures.json` is the source of truth for `core/profile.js`; the algorithm must match every fixture exactly. Changes need updates in lockstep (see [`DOCTRINE.md §3`](./DOCTRINE.md)). Same file also covers the `getCard` pipeline against the full positional catalog (12 sun × 12 animal = 144) and `resolveBracket` cases.
2. Privacy scan — `tests/privacy_scan.test.js`. No network calls, no third-party fonts or scripts, system fonts only.
3. PII scan — `tests/pii_scan.test.js`. Operator-name leakage, SIRR cross-reference leakage, labeled-DOB leakage.
4. Dependency discipline — `tests/dependency_discipline.test.js`. No card-content imports in the public engine; structural guards.

## Structure

```
8ball/
├── index.html               UI + boot, single file, ES modules
├── core/
│   ├── profile.js           sun sign, animals, life path, name number, soul urge
│   └── engine.js            positional catalog (no content import), bracket resolution
├── content/                  empty in public repo — card content lives privately
│                            at ~/dev/8ball-private/cards.v1.full.js (paid layer)
├── tests/
│   ├── fixtures.json        calculation contract — locked, hand-verified
│   ├── profile.test.js      calc + engine pipeline
│   ├── privacy_scan.test.js no network / system fonts only
│   ├── pii_scan.test.js     operator/SIRR boundary
│   └── dependency_discipline.test.js  no content imports
├── .github/workflows/ci.yml CI gate
├── netlify.toml             headers + SPA redirect
├── DOCTRINE.md              constitution — read every release
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
- **§4 Content rules** — what trait phrases can and can't say.

Anything that contradicts the doctrine requires an explicit doctrine amendment in the same change.

## License

MIT. See [`LICENSE`](./LICENSE).
