# 8ball — release checklist

> Read top to bottom every release. No skipping.

Pulled directly from `DOCTRINE.md §8`; reflects §7's 6 CI stages (with v0.22 extensions) and §10 v0.29's 5-agent + always-on-controller structure. Operational form of the same gates.

## Pre-merge

- [ ] **CI green.** All 6 stages pass: calc+pipeline, privacy scan, PII scan, dependency discipline, single-file rule, payments state machine. (Per `DOCTRINE.md §7` v0.22+ extensions.)
- [ ] **Local PII audit clean.** `/bin/bash audits/run_local_audit.sh` from repo root. Zero hits. (`/bin/bash` explicit for macOS bash 3.2 compatibility.)
- [ ] **Diff review.** Read every line. Ask:
  - [ ] Any new tracked content cross §4 (slurs, medical/diagnostic framing, real-person targets, minor-targeting, card-content strings outside the v0.22 carve-out — `content/cards.v1.full.js` is the ONE permitted tracked deck file)?
  - [ ] §4.B three-free-tries cap intact? (§4.A 18+ acknowledgment gate retired v0.48, 2026-07-06 — no longer applicable.)
  - [ ] Any new path under `core/` / `ui/` / `content/` / `index.html` cross §5 (persisting more than the allow-list, including §5.E's exact Saved Readings schema; transmitting out-of-band; introducing `fetch` / `XMLHttpRequest` / `navigator.sendBeacon`)?
  - [ ] If t3 written-entry rotation changed: `eight_ball_facet_index_v1` still stores only the current integer position 0/1/2; no deck-content rewrite or outward/inward/returning taxonomy claim slipped into the c.1 implementation (§1.H v0.49).
  - [ ] Registry + Concordance keeps §5.F's transient boundary: no comparison key/schema field/history/cache/share artifact; both entries recompute before lookup; `core/` + calculation fixtures have no diff?
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
  - Free render — name + DOB → shake → the constant compartment specimen sheet renders. *Superseded 2026-09-02, doctrine v0.71 free amendment: the storefront retired — every one of the fifteen coordinates renders on every device, no cell is sealed by tier. The "sealed hatch" language below this line describes the pre-v0.71 product and is retained as history, not current behavior.* No console errors.
  - Rising sign — birth time + city autocomplete fill; renders when computable; partial inputs render the `—` empty field (DOCTRINE §1.D v0.37).
  - Cards + og regeneration — any change to the sheet's rows, titles, cells or paper (ui/tiers.js, ui/sheet.js, SHEET_GROUPS, ROW_TITLES) is followed by `node scripts/render_cards.mjs --specimens --og --driver <scratch playwright-core dir>`; `tests/render_cards.test.js` digest pins fail until it is re-run (v0.75).
  - Labels toggle — row titles reveal/hide (v0.74: nothing else on the card); each compartment's meaning panel shows `<system name> · <derivation>` under its head; `eight_ball_labels_revealed_v1` persists.
  - Paired sheets (v0.76) — open the dyad, land a pair: both sheets show titles iff the host does; the screen's own toggle flips both and the host follows on back; tap a cell on EACH sheet — the panel head names that sheet's first name, the derivation line matches the host's for the same compartment, the context reads that sheet's values; Escape/close/second tap close; a re-submission closes the panel.
  - Density strip — result-rail census reads `N of 15 coordinates open`. *Superseded 2026-09-02, doctrine v0.71: no tier gate remains, so there is no "M sealed" remainder to report — N is always 15.*
  - *Superseded in full 2026-09-02, doctrine v0.71 free amendment: the three-rung Gumroad paywall ($1/$2/$3 → later $3/$6/$9), the `/?paid=t1|t2|t3` return path, and `eight_ball_tier_v1` tier persistence are retired. The storefront no longer exists; there is no checkout, no credit grant, and no monotonic-tier check to run. Retained here as history only — do not attempt to smoke-test a paywall that no longer ships.* (Was: "Paid surface" — first 3 reads free, 4th triggers paywall, bare Buy Link hrefs, post-payment credit grant.) (Was: "Paid-return persistence" — stored rung survives reload, t3 facet rotation debits credits.)
  - Pair Dossier (v0.79, §1.J) — open the dyad, land a resolved pair: the heading (`<h1 id="dyad-heading">`) receives focus on open; the pair signature (element cycle / combined life path / card pair) renders above the two sheets and always names the ACTIVE sheng/ke direction, never the passive framing; the split evidence below expands via keyboard (Enter on a real `<details>/<summary>`, not just a click); `back to my sheet` returns focus to the control that opened the screen. A fail-closed unresolved relation (not reachable from an ordinary calculated pair) shows the `relation layer unavailable` copy plus a `compare another` recovery action and hides the signature/evidence/share controls — never a dead button pointed at nothing.
  - Pair Imprint (v0.79, §1.J/§5.D) — the pre-action disclosure text matches the device's real share capability (`shares the pair imprint directly` vs. `saves the pair imprint as an image on this device`) before the button is ever pressed; the share button goes `aria-busy="true"` and disables for the duration of image generation; a second press or a changed pair mid-export cannot land stale output (generation-guarded); the exported PNG's footer text clears the frame edge; the constructed snapshot never carries a name, DOB, city, either raw sheet, or written card text — only the three allow-listed relation summaries plus fixed copy.
  - Screen ownership (v0.79) — opening Previous Readings while the Pair screen is active closes Pair first (clears B and both meaning panels) instead of stacking; `back` from Previous Readings afterward resolves to the sheet.
  - Live-fire gates specific to the paired surface — verify against a REAL browser, not synthetic DOM dispatch: `<input type="date">` must be set via a native property-setter write (raw character-by-character typing corrupts its segmented editing model); the narrow-screen A/B jump control's pressed state must be checked after a real touch-drag pan, not just after a click; the split-evidence `<details>` must be checked with a real keyboard Enter (`rawKeyDown` + `code: 'Enter'` — a plain `keyDown` is silently ignored by Chrome's native toggle handling).
  - Feedback surface — submit form → `/?sent=1` redirect → in-page banner swap to "thanks. read." → `replaceState` strips query.
  - Saved Readings — completed result saves once; duplicate exact profile deduplicates; Previous Readings sorts newest-first; reopen recomputes without changing tries/credits; rename persists; individual delete confirms; clear-all confirms; corrupt/blocked storage reports safely; `forget this device` clears current profile + archive.
  - Registry + Concordance — native checkboxes select exactly two valid entries; primary action explains disabled state before two and prevents a third; comparison opens as a separate screen, focuses its heading, and returns to Previous Readings; matching axes show only `registered` / `adjacent` / `unfiled` with relation + registry citation; element appears only at t1+; no score/forecast/advice/compatibility claim; reload leaves no comparison state; archive bytes, tries, credits, tier, and reading output stay unchanged.
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
