# 8ball — release checklist

> Read top to bottom every release. No skipping.

Pulled directly from `DOCTRINE.md §8`; reflects §7's 6 CI stages (with v0.22 extensions) and §10 v0.29's 5-agent + always-on-controller structure. Operational form of the same gates.

## Pre-merge

- [ ] **CI green.** All 6 stages pass: calc+pipeline, privacy scan, PII scan, dependency discipline, single-file rule, payments state machine. (Per `DOCTRINE.md §7` v0.22+ extensions.)
- [ ] **Local PII audit clean.** `/bin/bash audits/run_local_audit.sh` from repo root. Zero hits. (`/bin/bash` explicit for macOS bash 3.2 compatibility.)
- [ ] **Diff review.** Read every line. Ask:
  - [ ] Any new tracked content cross §4 (slurs, medical/diagnostic framing, real-person targets, minor-targeting, card-content strings outside the v0.22 carve-out — `content/cards.v1.full.js` is the ONE permitted tracked deck file)?
  - [ ] §4.B three-free-tries cap intact? (§4.A 18+ acknowledgment gate retired v0.48, 2026-07-06 — no longer applicable.)
  - [ ] Any new path under `core/` / `ui/` / `content/` / `index.html` cross §5 (persisting more than the v0.21+ allow-list, transmitting out-of-band, introducing `fetch` / `XMLHttpRequest` / `navigator.sendBeacon`)?
  - [ ] Any new §5.B user-initiated network call beyond the two named (Netlify Forms feedback POST + Gumroad Buy Link redirect)?
  - [ ] §5.C content-delivery transparency invariant intact (deck visible in source; lock is convention; about-modal disclosure preserved)?
  - [ ] Any new tracked content cross §11 (operator personal data) or §9 (SIRR cross-references)?
- [ ] **Cross-model audit per §10 v0.24.** Doctrine amendments → Codex (auditor lane, Procedure 4 or Procedure 6 as appropriate). Content batches → ChatGPT (adjunct, copy review). Mechanical edits → no audit required.
- [ ] **L48 discipline — wait for explicit audit-cleared signal before merge.** Five-minute-CI-green-to-merge windows are the L48 failure shape. Codified in `agents/controller.md`.
- [ ] **Verifier (CiC) on deploy preview if applicable** — surface changes route through verifier post-deploy-preview pre-merge per §10. Pure doctrine / agents/ cycles skip this gate.
- [ ] **Single-file rule.** `wc -l index.html` < 1500. (CI also checks.)

## Merge

- [ ] **Squash-merge to `main`.** `gh pr merge --squash --delete-branch`.
- [ ] **Verify origin post-merge** (per `gh --delete-branch` 3-leg L generalization, chat-9/10): `git ls-remote --heads origin` — should be `main` only. If a survivor branch shows, run `git push origin --delete <branch>` explicitly. Local-delete survivors clear with `git branch -D <branch>`.
- [ ] **Resolve squash-merge divergence locally** if applicable: `git checkout main && git reset --hard origin/main`.
- [ ] Confirm Netlify auto-deploy fires; wait ~30s for build; open the live URL with hard reload (Cmd+Shift+R).

## Post-merge

- [ ] **Live smoke test** (verifier lane via CiC, or operator-eyes). Run the paths the release touched:
  - Free render — name + DOB → shake → the constant compartment specimen sheet renders five free coordinate values (tarot birth card / sun / public animal / life path / roman catalog numeral), every higher-tier cell sealed (hatch + row/label structure, value absent from the DOM). No console errors.
  - Rising sign — birth time + city autocomplete fill; rising stays a sealed cell at free. At t1+: renders when computable; partial inputs render the `—` empty field (sealed ≠ unresolvable, DOCTRINE §1.D v0.37).
  - Labels toggle — uppercase labels + provenance placards + atlas legend reveal/hide; `eight_ball_labels_revealed_v1` persists.
  - Density strip — result-rail census reads `N of 15 coordinates open · M sealed at paid tiers` and matches the render tier (5 open at free).
  - Paid surface — first 3 reads free; 4th new pair triggers the three-rung paywall (t1 $3 / t2 $6 / t3 $9); each Gumroad Buy Link href is bare (no query string — redirect via product Content-tab Button per DOCTRINE §5.B Call 2); post-payment `/?paid=t1|t2|t3` lands the sheet opened to that rung with +3 credits; `replaceState` strips the query.
  - Paid-return persistence — the stored rung (`eight_ball_tier_v1`) survives reload and re-shake at the entitled density; monotonic (a higher rung bought later upgrades, never downgrades — highest rung bought holds). t3 additionally opens the hour pillar + the written card entry (name/type/habit/bracket note).
  - Feedback surface — submit form → `/?sent=1` redirect → in-page banner swap to "thanks. read." → `replaceState` strips query.
  - **Live-surface scan** (post-deploy, L-watch per chat-22 RUM closure): `curl -s <live-url> | grep -cE '<banned-injection-patterns>'` against any known CDN-injection risk (`netlify-rum`, `cwv-token`, etc.). 0 expected.
- [ ] **Append to `journal.md`.** Use the `## YYYY-MM-DD — Title:` markdown-header shape (newest-at-top per journal preamble). Document what shipped (with live commit SHA on `main`), what was rejected or deferred, any incident + remediation.
- [ ] **SHA-fill discipline (chat-18 inheritance).** Write Live SHA as `<TBD>` in the entry, commit, push, then fill the SHA in a follow-up commit. NO `--amend` on pushed history (chat-18 `abb5539` was the cleanup commit codifying this rule).
- [ ] **Update `8BALL.md` if state changed.** Refresh date, §3 locked decisions, §10 SHIPPED record with live SHA, §11 row closures.

## If something fails

- CI red → fix the cause; do not bypass.
- Local audit red → fix per `audits/LOCAL_PII_AUDIT.md` "what to do if you find a leak."
- Live URL broken → roll back via Netlify dashboard (instant); diagnose offline.
- Surface lands wrong but functional → file an `x.y.z` follow-up note in `journal.md`; hotfix release if §4 / §5 / §11 violation, otherwise surface-polish cycle.
- Post-merge audit surfaces P0/P1 → absorb in follow-up PR or hotfix release. v0.3.0.1 / v0.3.0.2 are the canonical pattern: cherry-pick onto a fresh branch from `main` per L48 / L27. Do NOT push direct-to-main for post-merge defect closure.
