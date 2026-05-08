# 8 ball

> it already knows. you just have to ask.

A magic 8-ball that knows you. Enter your name and DOB once. Shake or ask. The answer is a roast — surface jokey, internally based on your sun sign, Chinese zodiac animal, and numerology life path. The depth is hidden by design (see [`DOCTRINE.md §9`](./DOCTRINE.md)).

## Run locally

```bash
npm run dev      # serves on http://localhost:5173
```

ES modules need an HTTP context — opening `index.html` directly via `file://` will fail at the import lines. The `dev` script just starts a static server, no build.

## Test

```bash
npm test         # vitest, 22 cases as of v0.1
```

Two suites:

1. Calculation contract — `tests/fixtures.json` is the source of truth. The algorithm in `core/profile.js` must match every fixture exactly. Changes need updates in lockstep (see [`DOCTRINE.md §3`](./DOCTRINE.md)).
2. Engine + content — no template tokens leak into output, recent-buffer dedup produces > 80 unique strings in 500 calls, banned-pattern subset clean.

## Structure

```
8ball/
├── index.html               UI + boot, single file, ES modules
├── core/
│   ├── profile.js           sun sign, animal, life path, name number
│   └── engine.js            response generation, slot fill
├── content/
│   ├── traits.v1.js         roast pools per axis
│   └── templates.v1.js      response templates
├── tests/
│   ├── fixtures.json        calculation contract — locked, hand-verified
│   └── profile.test.js      vitest suite
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
