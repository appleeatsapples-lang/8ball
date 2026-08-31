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
    python3 audits/project_audit.py   # product-scope health audit (the product-audit CI job)
    python3 -m unittest audits.test_project_audit   # that auditor's own assurance suite
    bash audits/run_local_audit.sh    # PII audit before any push
    git status / git diff / git log   # before any commit

Both Python commands run from the repo root and need no dependencies beyond
the stdlib. `project_audit.py` shells out to `git`/`node`/`npx`/`npm`/`bash`;
two of its checks execute vitest suites directly, so `npm ci` must have run
first. The assurance suite is what proves the auditor's checks can still
fail — an auditor nothing tests is an auditor that degrades silently, so run
it in the same breath as any edit to `audits/project_audit.py`.

No build step. Netlify auto-deploys on push to `main`. Node ≥20.19.

**Live-fire (§8 gate 9) is runnable in a container — it is not operator-only.**
Chromium and Playwright are pre-installed here (`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`),
so any change touching `index.html` can be rendered and inspected before it
ships. This was believed impossible for a day and cost a live paywall defect
(journal 2026-07-29); the recipe is written down so no lane re-derives it:

    python3 -m http.server 5173          # from the repo root
    mkdir -p /tmp/lf && cd /tmp/lf && npm i playwright-core

Drive it with `chromium.launch({ executablePath: '/opt/pw-browsers/chromium-*/chrome-linux/chrome' })`.
**The driver goes in a scratch directory, NEVER in `package.json`** — §7 stage 4
caps devDependencies and this repo vendors no browser tooling. A local pass
answers rendering, cascade and viewport questions; it does NOT answer what the
deployed site serves, since egress policy blocks the product domain from here.

`run_local_audit.sh` needs `audits/local_personal_data.txt`, which is
gitignored and operator-local — it will not exist in a fresh container, and
the script exits 1 saying so. That's expected, not a failure to fix.

## What blocks a merge

`.github/workflows/ci.yml` runs on every push and PR to `main` and reports
three independent checks — **`test`**, **`product-audit`** and **`l48-gate`**.
Those are the context names to require if branch protection is ever turned on;
nothing blocks a merge on a red check today, so treat all three as
advisory-but-binding by convention. (`product-audit` is the newest and is the
one a stale copy of this section will omit — it was added on the calc-v3.1/HKO
authority branch, and a 2026-07-30 cross-model audit caught this list still
naming only two.)

- **`npm test`** — carries §7 stages 1–4 and 6 (calc+pipeline, privacy scan,
  PII scan, dependency discipline, payments state machine).
- **`product-audit`** — runs the auditor's own assurance suite
  (`python3 -m unittest audits.test_project_audit`) and then
  `audits/project_audit.py`, uploading its JSON+markdown report as a build
  artifact. Fourteen checks; a blocking-severity failure exits non-zero. Two
  of them (`product.hko_calendar`, and the pair that execute the L48 suites)
  are the fail-closed gates — a missing comparator, fixture or regression
  suite is a failure, never a skip.
- **Single-file rule** (§7 stage 5) — `index.html` must stay ≤1500 lines. The
  2026-08-31 shell-stylesheet split (§6 amendment, controller-ordered) moved
  the whole inline `<style>` block verbatim to `ui/shell.css`, taking the file
  from 1455 to 683 lines — ~800 of headroom. `ui/shell.css` must stay linked
  BEFORE `ui/experience.css` (cascade order; pinned in
  `tests/meanings_ui.test.js` along with a no-inline-`<style>`-creep guard).
  Features still split into `ui/*.js` per §6 — modules inject their own
  scoped styles at init, never edit the shell stylesheets; the §1.J dyad tier
  is the model (screen, styles and entry control all injected from
  `ui/dyad.js`, host footprint = import + DI call).
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

    core/         pure functions — 13 modules (profile, engine, rising, birthcard, pillars, countries, calendar, cities, payments, math, public, dyad, kua)
    ui/           ES modules — citysearch, concordance, dyad, kua, labels, meanings, modals, payments, profile, public, readings, result, share, sheet, tiers — DOM controllers use init*UI({refs},{hooks}) per §6 v0.23; concordance is pure post-calc lookup (the two-reading compare + the panels' intra-sheet filed-relation helper); public renders the t3-ceiling public read (§1.D v0.60 — t4 is retired); kua renders the t3 kua block (both classical values, no gender ask) and injects its own style and block node (§1.D kua amendment); dyad renders the t5 paired read (§1.J) and injects its own screen + CSS; sheet builds an instanced standalone specimen sheet, reusing tiers' cellRenderState so the dyad's two sheets and the host sheet cannot disagree (15 modules)
    content/      dyad.v1.js (immutable t5 relation tables — 25 ordered element pairs, 6 branch registers, 9 ordered bracket registers; §1.J) + dyad.v2.js (ACTIVE — v1 tables unedited, master-preserving combined-path frames + provenance, §1.J v0.62) + cards.v1.full.js (144-card deck, JS-gated per §1 v0.22) + meanings.v1.js (58 immutable historical entries, §1.G v0.44) + meanings.v2.js (superseded 1–9 view + element/context roles, §1.G v0.54) + meanings.v3.js (superseded-as-active twelve-value numerology registry — masters reused byte-for-byte from v1, §1.G v0.62; its tables remain the live tables via v4's re-export) + meanings.v4.js (superseded — v3 re-exported unedited plus the per-slot numerology lines and the theme-tension registry, §1.G; its tables remain live via v5's re-export) + meanings.v5.js (ACTIVE — v4 re-exported unedited plus the rising/private-animal placement lines, §1.G) + concordance.v1.js (immutable historical registry, §1.I v0.51) + concordance.v2.js (superseded nine-number registry, §1.I v0.54) + concordance.v3.js (ACTIVE twelve-value domain + the three master-reduction links, §1.I v0.62) + public.v1.js + public.v2.js (public-read tables — favorability, domain families, work modes, role postures; v2 carries v1 unedited and re-keys the mode to the birthday per §1.D v0.59; the read is a t3 ceiling block per §1.D v0.60) + public.v3.js (ACTIVE — v1/v2 tables unedited plus the declared master-to-base mode bridge, §1.D v0.62) + kua.v1.js (ACTIVE eight-trigram registry for the kua t3 block — citation register + provenance incl. the named post-2000 limitation, §1.D kua amendment)
    agents/       agent role docs + platform constraints per §10 v0.24
    tests/        57 vitest files + fixtures.json + helpers/ (dom.js, voice-register.js — de-forked shared scan tables/mocks, non-test modules per §7)
    audits/       release checklist + PII audit script + cross-model briefs + project_audit.py (product-scope health auditor, the product-audit CI job) + test_project_audit.py (its assurance suite, plain unittest — deliberately NOT under tests/, which repo_shape.test.js pins) + hko_compare.mjs (calendar-vs-authority comparator) + fixtures/hko_calendar_authority_1901_2100.json (200 official HKO tables, each with its source SHA-256)
    assets/       cities.json + favicons + og:image
    cards/        611 generated catalog JPEGs + manifest.json, served at /cards for the social drip; pinned by tests/cards_hosting.test.js (10 further queued codes are hosted off-site and tracked in the manifest's `external` block, not rendered here)
    scripts/      build_card_jpegs.py — deterministic PNG→JPEG renderer for cards/ · extract_hko_fixture.py — regenerates the HKO fixture from the 200 upstream sources (two-step by design: re-extract, then update HKO_FIXTURE_CONTENT_SHA256 in project_audit.py in the same commit)
    .github/      CI workflow (6 stages per §7, 3 reported checks) + PR template
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
