# PAYWALL-REMOVE-01 — implementer brief

**Date:** 2026-09-14 · **Branch:** `claude/paywall-removal` · **Authority:** A1 only (worktree edits, branch, PR). No A2/A3 action taken — no Gumroad, Netlify, deploy, or posting action of any kind.
**Status:** Implementation complete, full suite + product auditor green, NOT merged. This is the implementer's own record; it is not a premerge-audit response and does not satisfy the L48 `_response.md` naming requirement — a fresh Claude session must still run the Verifier role and file that artifact separately, per the operator's own packet instructions.

Every claim below is labeled **VERIFIED** (I read/ran it myself in this session), **INFERRED** (reasoned from evidence, not directly executed), or **UNVERIFIED** (stated by the packet or the operator, not independently checked by me).

---

## 0 — Worktree proof

- **VERIFIED.** `~/dev/8ball` (== `~/01_ACTIVE/dev/8ball`, the environment's directory move) is the repo named in `git remote -v` for this project (see README.md for the canonical remote). `~/8ball` (ops folder) was never touched.
- **VERIFIED.** The worktree was NOT on main at session start — it sat on `claude/specimen-four-line-symbolic` (PR #205, closed not merged), with month-old (2026-08-12) uncommitted changes to `tests/fixtures.json`, `tests/helpers/capability-realm.mjs`, `tests/privacy_scan.test.js`, plus an untracked `.codex/` directory. Checked for a live Codex implementer in that exact worktree first (`ps aux`, file mtimes) — all activity was over a month stale; no live process targeted this directory. Stashed the WIP (`git stash push -u -m "pre-paywall-removal: stale specimen-four-line-symbolic WIP..."`, `stash@{0}`) rather than discarding it, then branched `claude/paywall-removal` fresh off `origin/main` after `git pull` (`ca6e1d1`, #249, 2026-09-06).
- **VERIFIED.** `git status` clean before every edit began; working tree left with only this PR's changes at hand-off.

## 1 — Inventory (the finding that reshaped the whole task)

**VERIFIED, and the single most important finding of this brief:** the task packet's premise did not match the repo. It named the OLD $1/$2/$3 rung ladder (`xjpvp`/`neysyv`/`rzqezp`, `?paid=` return handler) as the live gate to remove. That ladder was already **fully retired 2026-09-02** (doctrine v0.71, "let's make it completely free … No more gumroad this is fun" — [DOCTRINE.md:398](DOCTRINE.md) before this PR's edits), including its own absence guard pinning zero checkout tokens across every served file.

The actual live paid surface — **12 days old** at the time the packet was written — was the **dyad** (the paired reading), added 2026-09-05 (doctrine v0.81) and built out through 2026-09-06 (v0.90 Pair-inside-paid-dyad, v0.91 example page + license-key activation): $3 once, a signed ECDSA access token verified through `core/entitlement.js`, a real configured Gumroad Buy Link (`DYAD_PRODUCT_URL`), a real public key, a preview page at `/example`, and a license-key activation flow at `/activate` backed by a Netlify function (`netlify/functions/activate.mjs`) that calls Gumroad's license-verify API server-side.

Per the packet's own step-1 stop condition ("STOP and report if purchase state is server-side or env-var driven"), and because this diverged materially from the packet's literal text, **I stopped and asked the operator before implementing** rather than guessing. Confirmed answer: remove the dyad gate too.

**Inventory answers (file:line, as the repo stood before this PR):**

- **(a) Entitlement predicate:** one function, [ui/payments.js:108](ui/payments.js) `getRenderTier()`, reading a single module-level flag `_dyadEntitled` ([ui/payments.js:106](ui/payments.js), was `let _dyadEntitled = false;`) — the codebase's own documented "single seam" (remediation R1, PR #36).
- **(b) Purchase state:** a signed access token in the `?dyad=` URL param and in `localStorage['eight_ball_dyad_entitlement_v1']`, verified offline via ECDSA P-256 ([core/entitlement.js](core/entitlement.js) `verifyDyadToken`) — **not** server-side/env-var for the *reading* side. But the *signing* side is: `netlify/functions/activate.mjs` is a real Netlify serverless function using `DYAD_SIGNING_KEY` (an environment secret) and calling `api.gumroad.com/v2/licenses/verify` server-side. This is exactly the condition the packet named as a stop-and-report trigger.
- **(c) What was withheld pre-purchase:** the paired reading (Pair Dossier / Pair Imprint) only — the single-person sheet was already free (since v0.71). `pillarEntry()`/the dyad engine output itself was gated behind `getRenderTier() === 't5'` at [index.html:712](index.html) (pre-edit) and inside `ui/dyad.js`'s screen-open logic.
- **(d) Gumroad → post-purchase route:** yes, two paths — (1) the direct Buy Link to `theeightball.gumroad.com/l/dyad` with a manually-emailed signed link as fallback, and (2) `/activate`, a license-key form POSTing to the Netlify function, which verified with Gumroad and redirected to `/?dyad=<token>`.
- **(e) Locked-by-default test files (pre-edit):** `tests/dyad_entitlement.test.js`, `tests/payments_markup.test.js`, `tests/dyad_surface.test.js`, `tests/dyad_activation.test.js`, `tests/tiers.test.js` (5 files).

## 2 — What changed, and why

**Single-seam flip (VERIFIED, live-fire tested):** [ui/payments.js:106](ui/payments.js) — `let _dyadEntitled = false;` → `let _dyadEntitled = true;`, marked with a `PAYWALL REMOVED 2026-09-14 (PAYWALL-REMOVE-01)` comment preserving the old value for one-commit revert. `getRenderTier()`/`isDyadEntitled()` are untouched — same source text, same call sites — so every render path the codebase itself calls "the single resolver seam every render path uses" now answers entitled unconditionally, with zero other logic changed.

**Cascading, not rewritten (VERIFIED by reading the pre-existing code before touching it):** [core/entitlement.js:53](core/entitlement.js) `DYAD_PRODUCT_URL` → blanked to `''` (matching its own documented pre-launch fail-closed default). `ui/dyad.js`'s `dyadOfferVisible()`/`syncDyadAboutCopy()` were **already** the offer's own complementary predicates (`unentitled AND a configured url`) — blanking the one constant makes both answer `false` unconditionally, with **no changes to that gating logic itself**. This is why the Buy Link anchor, its price note, and the about-modal's "open" paragraph all go dark from one four-line edit.

**Copy scrubbed, not just hidden (VERIFIED — "no price string, no gumroad reference" is now a suite-enforced invariant, not just a UI state):** `DYAD_OFFER_COPY` ([ui/dyad.js](ui/dyad.js)) rewritten price/processor-free (`'dyad · $3 once'` → `'dyad'`; the note no longer says "checkout opens on gumroad…"). The about modal's `#about-dyad-closed` paragraph ([index.html](index.html)) rewritten to state the truth ("is free too. no purchase, no license key, no account."); `#about-dyad-open` emptied (dead, unreachable). The forget-device copy no longer calls a filed token "a purchase." `example.html`'s banner/meta ("your own pair opens after purchase", "$3 once") → "opens free" / "free". README.md's commerce paragraph and privacy-scan-scope sentence rewritten. `tests/payments_markup.test.js`'s own absence-guard tests (previously expecting exactly `{index.html:['$3'], README.md:['$3'], ui/dyad.js:['$3']}` and exactly 5 named gumroad-carrying files) now assert **zero** anywhere in shipped sources — I verified this with a direct grep sweep, not just the test.

**Routes kept, behavior retired (VERIFIED, and matches the packet's own "keep the post-purchase route, redirect to the reading" instruction applied to the one route that actually fits it):** `activate.html` no longer has a form or license-key input — it's a static page with `<meta http-equiv="refresh" content="0; url=/">` plus a manual link, so an old bookmarked or emailed `/activate` link never 404s. `netlify/functions/activate.mjs`'s `handler` now unconditionally returns a 303 to `/` without reading the POST body, checking any env var, or calling Gumroad; every other function in that file (`verifyWithGumroad`, `activate`, `isPrivateJwk`, `stubVerifyIfEnabled`, `licenseKeyFrom`) is left defined and exported — dead, unreferenced by the new handler, kept for one-commit revert. `ui/activate.js` is now unreferenced by any HTML page (still exported, still correct, just orphaned). `example.html`/`ui/example.js` were **not** gutted — the demo pair still renders live (it never gated anything); only its two static text strings needed correcting, and `ui/example.js`'s existing `syncDyadEntry('t3', DYAD_PRODUCT_URL)` call already goes inert once `DYAD_PRODUCT_URL` is blank, with zero code change needed there. `netlify.toml` was **not** touched (explicitly out of scope per the packet's own DO-NOT list) — the `/example` and `/activate` redirect rules still route to the same two HTML files, which now behave differently.

## 3 — What was deliberately left dead (not deleted)

Every item below is marked in-source with the literal comment `PAYWALL REMOVED 2026-09-14 (PAYWALL-REMOVE-01)` and a note that deletion is a named follow-up PR, not filed:

- [ui/payments.js:106](ui/payments.js) — the old `false` default, in a comment.
- [core/entitlement.js:43-53](core/entitlement.js) — the old Gumroad Buy Link URL, in a comment.
- [netlify/functions/activate.mjs](netlify/functions/activate.mjs) — the entire old `handler` body (Gumroad verify + token signing), in a comment; every pure helper function still live in the file.
- [ui/activate.js](ui/activate.js) — the whole module, now orphaned.
- The pure crypto verification path in `core/entitlement.js` (`verifyDyadToken`, `parseDyadToken`, `signDyadToken`) — untouched, still correct, still exercised by tests (this is the actual one-commit-revert lever: flip one boolean and one string constant back, and the whole gated system works exactly as before).

**Follow-up PR (named, not filed):** delete all of the above once the operator confirms prod behavior.

## 4 — Tests

**VERIFIED — full suite run before AND after every batch of edits, not just at the end:**

| | Before this PR | After this PR |
|---|---|---|
| Test files | 66 | 66 |
| Tests | 2612 | 2612 |
| `npm test` | green (baseline, on `origin/main`) | green |
| `python3 audits/project_audit.py` | *(not run pre-edit; see below)* | **PASS** — 14 pass / 0 fail / 1 advisory warn (dirty tree, expected) |
| `python3 -m unittest audits.test_project_audit` | *(not run pre-edit)* | **143/143 pass** |
| `bash audits/run_local_audit.sh` | *(not run pre-edit)* | clean, 928 files scanned |

No test was deleted. Every changed assertion is an inversion (locked-by-default → unlocked-by-default) or a copy-string update, per the packet's "invert, don't delete" instruction — including the auditor's own Python-side mutation-testing suite (`audits/test_project_audit.py`), which I discovered independently mid-task: `python3 audits/project_audit.py` is one of CLAUDE.md's three CI-blocking checks and has its own hardcoded JS contract-assertion script (`T4_MIGRATION_SCRIPT`) plus an `activation_wiring` check, both of which encoded the OLD locked-by-default/license-key-form contract and would have left this PR's CI red on a check outside the vitest suite entirely if I hadn't found and inverted them too. Two of that Python suite's own mutation tests (`test_wrong_baseline_fails`, `test_legacy_tier_honoured_fails`) tested for a GATING property that no longer exists — they're now meaningless (a mutation that "wrongly" grants everyone is now just... correct), so I removed them and added one that tests the property that matters now: a regression back to a locked-by-default flag is still caught (`test_regression_to_locked_default_fails`).

The pure token-verification tests (`tests/dyad_entitlement.test.js`'s crypto-level assertions, the Python auditor's tampered/signed-token checks) stay green because the underlying crypto logic is genuinely untouched — this is what proves the one-commit-revert claim rather than just asserting it.

## 5 — Live-fire verification (VERIFIED, this session, real browser)

Per this repo's own CLAUDE.md guidance (a past incident here specifically involved an undetected live paywall defect that static analysis missed): served the repo with `python3 -m http.server 5173`, drove it with the Claude Browser tool.

- Fresh session, no stored token, no query param: submitted a birth date → full sheet rendered, no seals.
- Clicked "read beside another sheet" → the dyad's second-person form opened **directly**, no offer anchor, no Buy Link, no price, no Gumroad copy anywhere on screen.
- Submitted a second birth date → the full Pair Dossier rendered (element cycle, combined life path, card pair, both complete sheets side by side) — confirmed with `get_page_text`, zero gate, zero purchase copy.
- About modal: reads "the dyad — a second complete sheet read beside yours, with the relation layer between them — is free too. no purchase, no license key, no account."
- `/example.html` (the local server doesn't apply Netlify's `/example` → `/example.html` rewrite, so hit the file directly): renders the fixed demo pair; banner reads "your own pair opens free"; no price in the meta description.
- `/activate.html`: tab title flashed "8 ball · the dyad is free" then the meta-refresh fired and landed on `/`.

## 6 — Doc lines corrected (found to contradict the code after this change)

- [DOCTRINE.md](DOCTRINE.md) — new v0.92 amendment added in full (§1, after the v0.91 example-page paragraph); version-header block promoted (v0.92 current, v0.91 → prior, v0.90 → superseded); the §1 "Current free/paid composition" paragraph gets an appended superseding sentence. **No locked historical entry was edited in place** — every correction is a new appended clause or a new amendment, per this file's own L17 convention (verified by reading how v0.71/v0.81/v0.90/v0.91 each did the same thing before writing mine the same way).
- [8BALL.md](8BALL.md) — "Last refreshed" header, the "Current product model" paragraph, and the v0.91 paragraph all get appended superseding sentences; new v0.92 paragraph added with the full record.
- [README.md](README.md) — three sentences rewritten in place (not superseded-chain style — README doesn't use that convention): the single-sheet/dyad free-since line, the dyad paragraph's price/Gumroad/activate description, and the privacy-scan-scope sentence naming the "restored" Buy Link redirect.
- [journal.md](journal.md) — new top entry, `## 2026-09-14 — the dyad's paid surface retired too (PAYWALL-REMOVE-01)`.
- [audits/project_audit.py](audits/project_audit.py) and [audits/test_project_audit.py](audits/test_project_audit.py) — see §4 above; these aren't "docs" in the markdown sense but they're the CI-facing source of truth about what the entitlement contract is supposed to be, and were just as stale as the doctrine text.

**Explicitly NOT touched, and why:** the old $1/$2/$3-ladder-era metrics/scorecard language (doctrine v0.56's sprint, the 07-26→08-08 scorecard, "outside orders" language) was already closed out by the v0.71 free amendment's own blanket "the ledger's prices become historical facts, not live ones" clause — 12 days before this packet was written. Re-touching already-closed historical doctrine text on a stale assumption that it's still open is exactly the failure mode this project's own standing guidance warns against (editing settled doctrine while citing the rule against it). Those two items were also explicitly listed under the operator's own "Rulings to close while you're here" section, outside the fenced task packet — the operator's own post-merge list, not delegated to this session. Left alone; flagged here for visibility.

## 7 — Still needing an operator hand (outside this session's A1 authority)

Unchanged from the operator's own plan, restated for completeness:

1. A fresh Claude session runs the Verifier role against this PR + this artifact before merge — a different session than the implementer, per L48.
2. Confirm the prod deploy on `the-eight-ball.netlify.app` in a clean profile (no localStorage, no `?dyad=` param) renders a full card and a full paired reading.
3. Netlify UI: confirm no redirect rule or env var still points at Gumroad. (`netlify.toml` was not touched by this PR — its `/example` and `/activate` rules are unchanged and now route to redirect-only pages.)
4. Gumroad: unpublish `dyad`, `xjpvp`, `neysyv`, `rzqezp` — don't delete (receipts for real sales stay live). If the `dyad` product's delivery text points buyers anywhere, edit it to say the reading is free.
5. Bios/pinned posts on X, TikTok, IG, Threads still naming a price.
6. Named follow-up: a deletion PR for everything listed in §3, once prod is confirmed.

**No A2/A3 action was taken in this session** — no Gumroad, Netlify, or social-account access was used or attempted.
