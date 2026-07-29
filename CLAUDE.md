# CLAUDE.md — Claude Code entry point for 8ball

Loaded automatically at session start. Short and stable. For canonical
project context, follow the reading order below before doing anything.

## Read first, in this order

Paths are repo-root-relative so they resolve in any checkout (operator
machine, CC worktree, remote session).

1. `8BALL.md` — canonical 8ball context, source of truth (names any operator-personal files to read alongside)
2. `DOCTRINE.md` — project constitution
3. `journal.md` — newest entry on top, read at least the latest entry for current state

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

The operator is the controller and sole merge authority. No agent auto-merges,
and per L48 no merge happens before an explicit audit-cleared signal.

## Commands

    npm ci                            # fresh container only; vitest isn't vendored
    npm run dev                       # static server on :5173
    npm test                          # vitest — full suite
    bash audits/run_local_audit.sh    # PII audit before any push
    git status / git diff / git log   # before any commit

No build step. Netlify auto-deploys on push to `main`. Node ≥20.19.

`run_local_audit.sh` needs `audits/local_personal_data.txt`, which is
gitignored and operator-local — it will not exist in a fresh container, and
the script exits 1 saying so. That's expected, not a failure to fix.

## What blocks a merge

`.github/workflows/ci.yml` runs on every push and PR to `main` and reports two
independent checks — **`test`** and **`l48-gate`**. Those are the context names
to require if branch protection is ever turned on; nothing blocks a merge on a
red check today, so treat both as advisory-but-binding by convention.

- **`npm test`** — carries §7 stages 1–4 and 6 (calc+pipeline, privacy scan,
  PII scan, dependency discipline, payments state machine).
- **Single-file rule** (§7 stage 5) — `index.html` must stay ≤1500 lines. It is
  at 1465, so there are ~35 lines of headroom; past that, split into `ui/*.js`
  per §6 rather than trimming to squeeze under.
- **Journal-touch gate** (PR only) — a PR touching `DOCTRINE.md` or
  `content/*.js` must also touch `journal.md`; one touching `DOCTRINE.md` must
  also add a file under `audits/`.
- **L48 gate** (PR only, its own `l48-gate` job) — any PR that isn't docs-only
  must ship an in-PR audit artifact named
  `audits/<model>_pr<N>_premerge_audit_<YYYY-MM-DD>_response.md`,
  or an explicit `audits/L48_override_pr<N>_<date>.md` (the override file *is*
  the sighting log). Docs-only means every changed file ends in `.md` and none
  is `audits/RELEASE_CHECKLIST.md` or `agents/*.md`. The filename must contain
  `pr<N>` matching the real PR number, so it can only be finalized once the PR
  exists. It carries no `needs:`, so it evaluates even when `test` is red — a
  failing suite no longer hides whether the artifact is present.

Failed CI does not block the Netlify deploy — an accepted gap while traffic is
operator-scale (§7 v0.43), not a licence to merge red.

Journal entries use `## YYYY-MM-DD — Title — STATUS`, newest at top (§8 v0.43).

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
- Don't hand-edit `cards/*.jpg` or `cards/manifest.json` — they're generated
  output; regenerate with `scripts/build_card_jpegs.py` (its PNG sources live
  outside this repo and won't be present here)

## Repository shape

    core/         pure functions — 10 modules (profile, engine, rising, birthcard, pillars, countries, calendar, cities, payments, math)
    ui/           ES modules — citysearch, concordance, labels, meanings, modals, payments, profile, readings, share, tiers — DOM controllers use init*UI({refs},{hooks}) per §6 v0.23; concordance is pure post-calc lookup (10 modules)
    content/      cards.v1.full.js (144-card deck, JS-gated per §1 v0.22) + meanings.v1.js (58 immutable historical entries, §1.G v0.44) + meanings.v2.js (active 1–9 numerology + element/context roles, §1.G v0.54) + concordance.v1.js (immutable historical registry, §1.I v0.51) + concordance.v2.js (active nine-number registry, §1.I v0.54)
    agents/       agent role docs + platform constraints per §10 v0.24
    tests/        41 vitest files + fixtures.json + helpers/ (dom.js, voice-register.js — de-forked shared scan tables/mocks, non-test modules per §7)
    audits/       release checklist + PII audit script + cross-model briefs
    assets/       cities.json + favicons + og:image
    cards/        368 generated catalog JPEGs + manifest.json, served at /cards for the social drip; pinned by tests/cards_hosting.test.js (10 further queued codes are hosted off-site and tracked in the manifest's `external` block, not rendered here)
    scripts/      build_card_jpegs.py — deterministic PNG→JPEG renderer for cards/
    .github/      CI workflow (6 stages per §7) + PR template
    index.html    single-file UI, ≤1500 lines
    DOCTRINE.md   constitution
    8BALL.md      canonical context, AI-readable
    journal.md    append-only release log, newest at top

## Editing this file

Two machine constraints, both of which fail CI if broken:

- `tests/repo_shape.test.js` regex-parses the three count lines above. It needs
  the literal shapes `core/ … <n> modules`, `ui/ … (<n> modules`, and
  `tests/ … <n> vitest files` — note the open paren the `ui/` pattern requires.
  Rewording those lines can break the parse even when the numbers are right.
  Update the count in the same change that adds or removes a `core/`, `ui/`, or
  test module.
- CLAUDE.md is **not** in the PII scanner's allow-list (`tests/pii_scan.test.js`
  `DOCTRINE_ALLOW`), unlike `DOCTRINE.md` / `8BALL.md` / `journal.md` /
  `README.md`. It may not contain the operator's name, handle, or GitHub
  username, the sibling-project name or its vocabulary, or a labeled DOB. Cite
  those files rather than quoting the parts that carry those tokens.

## Current state

State changes; this file shouldn't. For what's current — including any
in-flight pivot, paused work, or open queue — read the newest entry of
`journal.md`, which is authoritative for CURRENT STATE and wins over
`8BALL.md` §10 when they disagree. `8BALL.md` is canonical for
architecture and locked decisions, not the latest ship. Don't treat this
file as a state record.

Repository-shape counts above (core/ui/tests) are the canonical inventory;
`8BALL.md` / `README.md` defer here. Verified 2026-07-25 against a green
suite (38 files / 1369 tests). These counts drifted unnoticed for ~1 month
twice before `tests/repo_shape.test.js` began pinning them on 2026-07-05 —
that guard is why the numbers can now be trusted on sight, so if it's ever
weakened, go back to re-verifying with `find core ui -name '*.js' | wc -l`
and `ls tests/*.test.js | wc -l`.
