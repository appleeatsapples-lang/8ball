# CLAUDE.md — Claude Code entry point for 8ball

Loaded automatically at session start. Short and stable. For canonical
project context, follow the reading order below before doing anything.

## Read first, in this order

1. `~/dev/8ball/8BALL.md` — canonical 8ball context, source of truth (names any operator-personal files to read alongside)
2. `~/dev/8ball/DOCTRINE.md` — project constitution
3. `~/dev/8ball/journal.md` — newest entry on top, read at least the latest entry for current state

After those, this file's only job is to name what's specific to working
through Claude Code as a lane.

## Lane discipline (DOCTRINE.md §10)

Claude Code owns the filesystem and git lane. It's the right tool for:

- Changes touching ≥3 files in one logical change
- Any modification to `core/` (calculation, engine)
- Test runs, audit script runs, git operations
- Multi-file refactors

For 1–2 file edits that don't touch `core/`, the Claude chat lane is preferred.
Don't pull work into CC just because CC is open.

## Commands

    npm run dev                       # static server on :5173
    npm test                          # vitest
    bash audits/run_local_audit.sh    # PII audit before any push
    git status / git diff / git log   # before any commit

No build step. Netlify auto-deploys on push to `main`.

## Don't-do list

- Don't `git push` without explicit operator confirmation in the same session
- Don't merge anything that touches `DOCTRINE.md` without cross-model audit per §10
- Don't edit shipped content batches (e.g. `content/cards.v1.full.js`) — per
  DOCTRINE §4, new release = new file (e.g. `cards.v2.full.js`), not in-place
  edit. Exception: documented safety-patch carve-outs (DOCTRINE §4 safety-patch
  carve-out).
- Don't edit `tests/fixtures.json` without updating `core/profile.js` in lockstep per §3
- Don't add runtime dependencies, `fetch()` calls, analytics, or new
  `localStorage` keys (§5, §12)
- Don't widen the PII scanner allow-list (`tests/pii_scan.test.js`) without
  journal note explaining why

## Repository shape

    core/         pure functions — 9 modules (profile, engine, rising, birthcard, pillars, countries, calendar, cities, payments)
    ui/           DOM-touching ES modules — labels, meanings, modals, payments, profile, share, tiers — init*UI({refs},{hooks}) shape per §6 v0.23 (7 modules; payments.js + tiers.js also carry pure exports)
    content/      cards.v1.full.js (144-card deck, JS-gated per §1 v0.22) + meanings.v1.js (58 tradition-cited entries, §1.G v0.44)
    agents/       agent role docs + platform constraints per §10 v0.24
    tests/        27 vitest files + fixtures.json
    audits/       release checklist + PII audit script + cross-model briefs
    assets/       cities.json + favicons + og:image
    .github/      CI workflow (6 stages per §7)
    index.html    single-file UI, ≤1500 lines
    DOCTRINE.md   constitution
    8BALL.md      canonical context, AI-readable
    journal.md    append-only release log, newest at top

## Current state

State changes; this file shouldn't. For what's current — including any
in-flight pivot, paused work, or open queue — read the newest entry of
`journal.md`, which is authoritative for CURRENT STATE and wins over
`8BALL.md` §10 when they disagree. `8BALL.md` is canonical for
architecture and locked decisions, not the latest ship. Don't treat this
file as a state record.

Repository-shape counts above (core/ui/tests) verified 2026-07-04 and are
the canonical inventory; `8BALL.md` / `README.md` defer here. **v0.44 note:**
these counts drifted for ~1 month before the 2026-07-04 drift-sweep caught
them (last verified 2026-07-01, ui/ and tests/ both stale by the time of
this check) — if you're reading this more than a few weeks after the date
above, re-verify with `find core ui -name '*.js' | wc -l` and
`ls tests/*.test.js | wc -l` rather than trusting the number on sight.
