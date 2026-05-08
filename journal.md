# 8ball journal

Append-only. Newest entry at the top. Same shape as SIRR's `journal.txt` so the muscle memory carries across.

=====
2026-05-08 · v0.1.1 — hex-overflow fix + multi-model lanes activated
=====

## What shipped

- **Hex-window overflow fix.** Live screenshots from the operator showed long answers clipping the hexagonal display (top, sides, bottom — "PLOT TWIST" cut off, "...HEN YO DECIDED" cut off). Two-layer fix:
  - Engine: `generateAnswer()` now soft-caps at 120 chars. Re-rolls up to 12 times to find a fitting candidate; returns a length-clean fallback if 12 fail.
  - UI: dynamic font-size scaling on `.answer` based on text length (default / `size-medium` for 60+ / `size-small` for 90+). Default size lowered slightly to give a baseline buffer.
- **Test added** for the soft cap: 1000 generations must produce <5% over-cap. Currently passing comfortably.
- **Multi-model lanes activated** — first real handoff briefs written and saved to `~/Desktop/8ball/audits/`:
  - `chatgpt_brief_v2_traits.md` — paste-ready prompt for ChatGPT to (a) audit v1 trait pool against §4, (b) flag flavor-repeats, (c) propose ~168 v2 expansion phrases.
  - `codex_brief_doctrine_audit.md` — paste-ready prompt for Codex to audit DOCTRINE.md §1–§13 against the actual code, with PASS/CONCERN/FAIL verdicts per rule and 9 named scrutiny points.
- **Tests:** 32/32 green.

## Lessons

**L8 (new) — The doctrine that documents lanes but doesn't activate them is doctrine that doesn't fire.** v0.1.0 documented §10 lanes. v0.1.1 actually used them. Documenting without activating is exactly the recursion-fires-through-orchestrator failure mode §13 names.

**L9 (new) — Live screenshots beat synthetic test cases.** The hex-overflow bug was invisible in unit tests because no test checked rendered visual integrity. Operator's real-use screenshots surfaced it in one minute. Add to release checklist: shake live URL N times before declaring v.x done.

## Open items / next session queue

1. ~~Connect Netlify to GitHub repo for auto-deploy~~ ✅ done 2026-05-08 16:17. Live at `https://the-eight-ball.netlify.app`.
2. ~~Pick + reserve subdomain~~ ✅ reserved `the-eight-ball`.
3. ~~Hex-overflow fix~~ ✅ v0.1.1 ships in this commit.
4. Operator: paste `~/Desktop/8ball/audits/chatgpt_brief_v2_traits.md` into ChatGPT.app. Save response back to `~/Desktop/8ball/audits/chatgpt_v2_trait_review_<date>.md`.
5. Operator: paste `~/Desktop/8ball/audits/codex_brief_doctrine_audit.md` into Codex.app. Save response back to `~/Desktop/8ball/audits/codex_doctrine_audit_<date>.md`.
6. Operator: create `audits/local_personal_data.txt` per `audits/LOCAL_PII_AUDIT.md`.
7. Operator: add `8ball` row to `~/MUHAB.md` §6 bootstrap table (operator-personal file).
8. Trait pool v2 — incorporate ChatGPT review per item 4.
9. Doctrine fix-ups — incorporate Codex audit per item 5.
10. Question classifier rework.

=====
End of 2026-05-08 · v0.1.1 entry.
=====

=====
2026-05-08 · v0.1.0 build session — PII leak found mid-build, patched, discipline added pre-ship
=====
## What shipped

- **Critical:** v0.1.0 fixture leak fixed. `tests/fixtures.json` had a fixture labeled `"Gemini Horse LP4 (canonical Muhab test)"` with `dob: "1990-06-15"` — a labeled tie between operator name and a real-shape DOB in a public repo. Same leak in `journal.md`. Fix: shifted synthetic DOB by 12 years (preserves animal + LP mod-9), removed all operator-name labels.
- **Public PII scanner** at `tests/pii_scan.test.js` — 9 cases covering operator-name leakage, SIRR cross-references, GitHub-username leakage, labeled-DOB shapes. Doctrine and config files allow-listed (their job is naming the boundary).
- **Local PII audit infrastructure** at `audits/LOCAL_PII_AUDIT.md` + `audits/run_local_audit.sh`. Operator's personal-data file is gitignored; script greps tracked content against the patterns.
- **Release checklist** at `audits/RELEASE_CHECKLIST.md` — operational form of DOCTRINE.md §8 gates.
- **DOCTRINE.md v0.2** — added §10 multi-model lane system (mirrors SIRR §7 at smaller scale), §11 PII rule with fixture-DOB sub-rule, §13 refresh discipline + Friday rule-kill review.
- **8BALL.md** — canonical AI-session-bootstrap context. Mirrors `~/dev/SIRR/SIRR.md` shape.
- **`~/Desktop/8ball/`** folder structure with `sessions/` and `audits/` subdirs, mirroring `~/Desktop/SIRR/`. v0.1.1 session distillate filed.
- **`.gitignore`** updated to exclude `audits/local_personal_data.txt`.
- **CI workflow** unchanged but the new tests run automatically as part of `npm test`.
- **Tests:** 31/31 green (22 calc + engine + content; 9 PII scan).

## Lessons

**L1 — The PII gate that doesn't exist before push doesn't exist.** Build the gate the same release as the surface it protects.

**L4 — Files are canon, memory is not** (carried from SIRR L4). This Claude started the session without reading `~/MUHAB.md`. Operator caught it. Process discipline is the only counter.

**L5 — Solo authority IS the failure mode.** Same instance wrote the doctrine, the code, the tests, the fixtures. The labeled-DOB leak slipped through because of single-author blindness. §10 lanes codify the structural fix.

**L7 — The recursion fires through the orchestrator too.** Watch for tooling that feels rigorous but doesn't fire. Friday rule-kill review is the structural counter.

Full session distillate: `~/Desktop/8ball/sessions/session_distillate_2026-05-08.md`.

## Open items / next session queue

1. ~~Connect Netlify to GitHub repo for auto-deploy~~ ✅ done 2026-05-08 16:17. Live at `https://the-eight-ball.netlify.app`.
2. ~~Pick + reserve subdomain~~ ✅ reserved `the-eight-ball`.
3. Operator: create `audits/local_personal_data.txt` per `audits/LOCAL_PII_AUDIT.md`.
4. Operator: add `8ball` row to `~/MUHAB.md` §6 bootstrap table (operator-personal file).
5. Trait pool v2 — ChatGPT lane drafts; doctrine §4 review gates.
6. Question classifier rework.
7. First cross-model audit dry-run (Codex on a doctrine change).
8. Live-fire testing post-deploy.

=====
End of 2026-05-08 · v0.1.1 entry.
=====

=====
2026-05-08 · v0.1 — repo bootstrapped, calc contract locked
=====

## What shipped

- Repo restructured from single-folder `8ball-app/` to layered `8ball/` with `core/`, `content/`, `tests/`, `.github/workflows/`.
- Calculation core extracted to `core/profile.js`. Pure functions, no DOM. Re-importable in tests.
- Response engine extracted to `core/engine.js`. Tokens documented inline.
- Trait pools and templates split into versioned files: `content/traits.v1.js` and `content/templates.v1.js`. Immutable once shipped — v2 = new file.
- `index.html` slimmed to UI + boot, ES module imports.
- `tests/fixtures.json` — 12 calculation fixtures + 4 name-number fixtures, every value hand-verified against the algorithm. All DOBs synthetic per §11.
- `tests/profile.test.js` — 22 cases across calculation contract, engine token-leakage, recent-buffer dedup coverage (>80 unique strings in 500 calls), question classifier, banned-pattern content scan.
- `DOCTRINE.md` written. 10 sections. The §3 calculation contract and §4 content rules are the load-bearing parts.
- `.gitignore` includes explicit `**/SIRR/`, `**/PRIVATE/`, `**/_ARCHIVE/` barriers so cross-pollination from SIRR is impossible by accident.
- `LICENSE` MIT.
- `package.json` — vitest only; no build step, no framework.

## Decisions locked

| # | Decision | Locked value |
|---|---|---|
| 1 | Repo visibility | Public on GitHub from day 1 |
| 2 | Domain | netlify.app subdomain only until traction |
| 3 | Product name | `8 ball` (lowercase, space; folder & repo `8ball`) |
| 4 | License | MIT |
| 5 | Stack | Static + ES modules; no build step |
| 6 | Persistence | localStorage only — name + DOB; nothing else, ever |
| 7 | Telemetry | None. Permanently. |
| 8 | Calc version | v1 — Pythagorean LP w/ master 11/22/33 preserved; tropical sun; Feb 4 CNY approximation |

## Errata caught during build

Initial `tests/fixtures.json` had hand-calc errors on 6/12 cases. All caught by running the algorithm against the fixtures before locking. Lesson: never lock fixtures from memory — generate them from the algorithm, then hand-verify the algorithm itself against an external source. The fix took 10 minutes; finding it after a bad release would have taken weeks.

## Open items / next session queue

1. **`git init` + push to GitHub.** Repo URL TBD pending availability of preferred name.
2. **Wire Netlify to GitHub.** Currently the v0 deployment (if any) was drag-and-drop from the old `8ball-app/` folder. Reconnect to `8ball` repo, deploy on push to main.
3. **Rename existing Netlify subdomain** if a v0 deployment exists. Target name: `8ball.netlify.app` or `the-eight-ball.netlify.app` depending on availability.
4. **Trait pool expansion (v2).** Current pool is the seed. Doubling each axis pool will materially reduce flavor-repetition complaints.
5. **Question classifier rework.** Regex-grade dumb in v1. v2: distinguish regret vs choice vs future vs identity.
6. **iOS wrap.** Capacitor or PWA install prompt. Only after web shows pulse — don't pre-build.
7. **Live-fire testing.** Open the deployed URL. Shake 30 times with real DOB. Note any flavor-repeats or weak lines for v1.1.

## Lessons (the ones not in code)

**L1 — Test gate works.** The fixtures-vs-algorithm mismatch was caught by writing tests before believing my own arithmetic. Process did its job.

**L2 — Doctrine before content.** `DOCTRINE.md §4` was written before `traits.v1.js` was reviewed. Re-reading the §4 rules surfaced one borderline phrase that was cut. Doctrine first means content review has a yardstick, not a vibe.

**L3 — Mirroring SIRR's process is cheap and load-bearing.** The journal-shape, doctrine-doc, fixture-locked tests are SIRR-shaped. Reusing the shape means we don't re-derive process discipline every session.

=====
End of 2026-05-08 entry.
=====
