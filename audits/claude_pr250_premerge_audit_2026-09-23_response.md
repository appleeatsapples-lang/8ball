# L48 pre-merge verifier — PAYWALL-REMOVE-01 (PR #250)

**PR:** #250, `claude/paywall-removal` → `main`.
**Filed:** 2026-09-23.
**Role:** independent Verifier session (per `agents/verifier.md` / `agents/auditor.md` L48
convention) — a different session than the implementer that wrote
`audits/paywall_removal_2026-09-14_brief.md`. No memory of that session; every claim
below was re-derived from a real checkout of this branch, not taken on the brief's word.
**Verdict: MERGE.** No blocking defect found after real effort — full suite run, both
Python auditors run, a live-fire browser pass, a targeted mutation test against the
guard the implementer says is load-bearing, and a line-by-line read of every touched
file against the brief's specific file:line claims. Two trivial, non-blocking wording
mismatches are noted in §5; nothing else. **This entry claims no merge authority — the
merge word stays with the controller per §10/L48.**

---

## 0. What I actually did

Checked out `origin/claude/paywall-removal` (`49cdad7`) into an isolated worktree —
this session's own worktree is sandboxed to `.claude/worktrees/agent-af55c72d7ee12284c`,
so I branched `verify-pr250-paywall-removal` off `origin/claude/paywall-removal` rather
than reusing the branch name (the operator's main checkout already had it checked out).
Confirmed before starting: `gh pr view 250 --json mergeable,mergeStateStatus` reported
`MERGEABLE` / `UNSTABLE` (CI gate pending this artifact, not a real conflict), branch
`claude/paywall-removal` → `main`, state `OPEN`.

I did not read the brief first and take it as ground truth — I read `CLAUDE.md`,
`agents/verifier.md`, `agents/auditor.md`, and one precedent artifact
(`audits/relay_pr204_premerge_audit_2026-08-12_response.md`) for shape and tone, then
read the real diff (`git diff main...verify-pr250-paywall-removal`, 21 files,
+471/−265) file by file before opening the brief, and cross-checked the brief's
specific file:line citations against what the diff actually shows.

## 1. The diff, verified against the brief's claims

**File list matches exactly** what the brief and the task packet describe — 8BALL.md,
DOCTRINE.md, README.md, activate.html, audits/paywall_removal_2026-09-14_brief.md,
audits/project_audit.py, audits/test_project_audit.py, core/entitlement.js,
example.html, index.html, journal.md, netlify/functions/activate.mjs, 5 test files,
ui/activate.js, ui/dyad.js, ui/example.js, ui/payments.js. `netlify.toml` has **zero**
diff (`git diff main...verify-pr250-paywall-removal -- netlify.toml` is empty) —
confirmed untouched, matching the out-of-scope claim. No email/signup capture,
analytics, or sibling `~/8ball` ops-folder file appears anywhere in the diff.

**The single-seam flip** — `ui/payments.js:120`, `let _dyadEntitled = true;` (was
`false`) — is genuinely the only behavioral line in that file; `getRenderTier()` and
`isDyadEntitled()` are byte-identical to `main`. Read `resolveDyadEntitlement()` in
full (lines ~172–196): every branch either sets `_dyadEntitled = true` or returns
`granted: _dyadEntitled` — there is no code path that can set it back to `false`. With
the default now `true`, the flag can only ever stay `true` for the life of the module.
Confirmed this is the only assignment site with `grep -n "_dyadEntitled ="
ui/payments.js`.

**Cascade through pre-existing predicates, not new logic** — `core/entitlement.js`'s
`DYAD_PRODUCT_URL` is blanked to `''` (was the live Gumroad URL). Read `ui/dyad.js`'s
`dyadOfferVisible(tier, url)` (line 151): `return !dyadEntitled(tier) && typeof url ===
'string' && url.length > 0;` — unedited in this diff. With `tier` always `t5` now
(`dyadEntitled('t5')` is true, since `coordsForTier('t5')` includes `dyadRelation`),
the first conjunct alone forces `false`; the blanked URL is redundant-but-consistent
belt-and-suspenders. This is exactly the "cascading, not rewritten" claim, verified by
reading the predicate myself rather than trusting the brief's description of it.

**`ui/example.js`'s inert offer-anchor claim** — the brief says `syncDyadEntry('t3',
DYAD_PRODUCT_URL)` "already goes inert once `DYAD_PRODUCT_URL` is blank, with zero code
change needed." Checked: the diff to `ui/example.js` is comments only (+11/−10, all
prose); the one executable line (`d.syncDyadEntry('t3', DYAD_PRODUCT_URL)`) is
byte-identical to `main`. True as claimed.

**`netlify/functions/activate.mjs`** — read the whole file, not just the diff. The
`export default async function handler(_request)` at the bottom is exactly `{ return
redirectResponse('/'); }` — the parameter is even named `_request` (unused-by-convention),
confirming it never reads the body. Every function above it
(`verifyWithGumroad`, `activate`, `isPrivateJwk`, `stubVerifyIfEnabled`,
`licenseKeyFrom`, `parseSigningKey`) is still defined and exported, but nothing in the
file calls any of them — grepped for each name as a call site, all zero hits outside
their own definitions and the commented-out dead handler. No path in this file reaches
Gumroad or reads `DYAD_SIGNING_KEY` under any input.

**`activate.html`** — read in full. No `<form>`, no `<input>`, a
`<meta http-equiv="refresh" content="0; url=/">`, one text link back to `/`. Matches.

**Orphaned `ui/activate.js`** — `grep -rn "activate\.js" *.html ui/*.js core/*.js
netlify/functions/*.mjs` (excluding the file's own header) returns nothing. No page or
module imports it. Confirmed orphaned, as claimed.

**Grep sweep of my own** (not the implementer's) across every file a browser loads
(`index.html`, `example.html`, `activate.html`, `ui/*.js`, `core/*.js`,
`content/*.js`):
- `gumroad` (case-insensitive): **zero hits**.
- `\$[0-9]`: hits only inside `//` comments describing retired history (`ui/payments.js`
  top-of-file doctrine note, `core/entitlement.js` top-of-file note, `ui/labels.js`
  incident note, `core/public.js` retired-$9-rung note) — none in a rendered string, none
  in `index.html`/`example.html`/`activate.html`.
- `license.key|checkout|\bbuy\b` (case-insensitive): hits only in (a) the corrected
  negation copy ("no purchase, no license key, no account" in `index.html` and
  `activate.html`), (b) code comments, and (c) `ui/activate.js`'s dead, unreferenced
  validation-message string. No live purchase copy anywhere.

**DOCTRINE.md — the L17 append-only claim, checked against precedent, not just read.**
The diff touches three regions: (1) the top-of-file "Current free/paid composition"
paragraph gets one appended sentence, byte-identical text before it; (2) a wholly new
v0.92 amendment paragraph is inserted after v0.91 — pure addition; (3) the
"doctrine version:"/"doctrine version, prior:"/"superseded:" footer block is rotated —
v0.91's block is relabeled from "doctrine version:" to "doctrine version, prior:" and
v0.90's from "doctrine version, prior:" to "superseded:", both with **unchanged body
text**, only the label prefix moves. I did not take the brief's word that this
mechanical relabeling is an established convention — I pulled the actual prior commit
that promoted v0.90 to v0.91 (`git show e00a3d3 -- DOCTRINE.md`) and confirmed it
performed the exact same three-region pattern (append a sentence, add a new amendment,
rotate the footer labels with body text untouched). This PR's DOCTRINE.md diff follows
established precedent; it does not invent a shortcut.

## 2. Checks run myself, with real output

All run from this real checkout of `claude/paywall-removal` (`49cdad7` + this
artifact), not copied from the brief.

```
$ npm ci        # 45 packages, clean
$ npm test
 Test Files  66 passed (66)
      Tests  2612 passed (2612)
```
Matches the brief's claimed pre/post counts (66 files / 2612 tests) exactly.

```
$ python3 audits/project_audit.py
{"verdict": "PASS", "counts": {"pass": 14, "fail": 0, "warn": 0, "skip": 1}, ...}
```
14 PASS / 0 FAIL / 1 SKIP, blocking_failure_count 0. The one skip is
`product.local_pii` — `audits/local_personal_data.txt` absent, which `CLAUDE.md` names
as an expected non-failure in a fresh checkout, not a defect. (The brief called this
"1 advisory warn"; the machine-reported severity is actually `info`/`skip`, not `warn`
— a wording slip in the brief, not a functional discrepancy — see §5.)

```
$ python3 -m unittest audits.test_project_audit
Ran 143 tests in 38.2s
OK
```
143/143, matches the brief's claim.

```
$ cp <main-checkout>/audits/local_personal_data.txt audits/   # gitignored fixture,
                                                                 # per this project's own
                                                                 # worktree-PII-audit gotcha
$ bash audits/run_local_audit.sh
LOCAL PII AUDIT: clean (929 files scanned)
```
Clean. The brief reported 928 files; this run reports 929 (one-file drift, almost
certainly this new artifact or a branch-state difference — see §5, non-blocking). The
copied fixture is gitignored (`grep -n local_personal_data .gitignore` confirms) and
`git status --short` is clean after the copy — nothing leaked into the branch.

## 3. A mutation test against the load-bearing guard, not just reading the code

This project's own memory record flags "a new test can pass for the wrong reason until
the mutation flips it" as a recurring failure class here, so I did not just read
`ui/payments.js` and trust the "one-line seam" claim — I broke it and watched the
guards catch it.

Reverted `let _dyadEntitled = true;` back to `false` (the pre-PR value) in a scratch
copy of `ui/payments.js`, on this branch:

- `npm test` → **10 failed / 2602 passed** across 3 test files
  (`tests/tiers.test.js`, `tests/dyad_entitlement.test.js`,
  `tests/payments_markup.test.js`) — every failure the expected
  `getRenderTier()` mismatch, nothing unrelated broke.
- `python3 audits/project_audit.py` → **verdict FAIL**, `{"pass": 12, "fail": 2, "warn":
  1, "skip": 0}` — the `product.t4_migration` and `product.activation_wiring`-adjacent
  contract check both flip red on exactly this regression.

Restored the file (`git diff --stat ui/payments.js` empty afterward, `git status
--short` clean), re-ran `npm test` → 66/66 files, 2612/2612 green again. This confirms
the "one-commit revert" framing is not just narratively true but mechanically
enforced: the guard the brief says protects this property actually does, on both the
JS and the Python side.

## 4. Live-fire, in a real browser, driven by me

Per this repo's own `CLAUDE.md` guidance (the 2026-07-29 undetected-paywall-defect
precedent it cites by name), static analysis alone is not enough for a change that
touches render-gating — so I served the branch (`python3 -m http.server`) and drove it
with the Claude Browser tool myself, fresh profile, no stored token, no query param:

- Submitted a birth date (Test Verifier, 1990-05-15) → the complete single sheet
  rendered — tarot, western, Chinese, numerology, written entry, symbolic
  associations, no sealed cells.
- Clicked "READ BESIDE ANOTHER SHEET" → the pair-entry form opened **directly** —
  no offer anchor, no price, no Buy Link, no Gumroad copy anywhere on screen
  (confirmed via `get_page_text`, not just a screenshot glance).
- Submitted a second birth date (1985-11-22) → the full Pair Dossier rendered:
  element cycle (`A · metal → B · wood · controlling`), combined life path
  (`3 + 11 → 5`), card pair, both complete sheets side by side, Share/Compare-another
  controls. Zero gate, zero purchase copy, confirmed by reading the full extracted
  page text.
- `/example.html` → renders the fixed demo pair; banner reads **"your own pair opens
  free"** (not "after purchase"), no price in the meta description.
- `/activate.html` → tab title read "8 ball · the dyad is free"; the meta-refresh fired
  immediately and landed back on `/` (confirmed by re-reading the page text
  post-navigation — title reverted to the sheet page).

All five observations match the brief's own live-fire claims exactly; I did not take
them on faith.

## 5. Non-blocking notes (not fixed, because nothing is wrong)

- **§2's "advisory warn" vs. actual "skip/info".** The brief describes
  `python3 audits/project_audit.py`'s one non-pass result as "1 advisory warn"; the
  tool itself reports it as severity `info`, status `skip`. Same underlying
  check (`product.local_pii`, expected-absent fixture), same non-blocking meaning —
  just an imprecise word in the brief's own summary table. Does not affect CI, does
  not affect the verdict, not worth a commit to fix a sentence in a prior artifact.
- **929 vs. 928 files scanned** by `run_local_audit.sh`. One-file drift between the
  implementer's run (2026-09-14) and mine (2026-09-23, nine days and one branch-tip
  commit later, plus my own artifact file now present). Not a defect — the script's
  job is "clean or not," and it reports clean both times.

Neither note changes the verdict and neither warranted a code change.

## 6. What I looked for and did not find

- **Tautological or weakened assertions in the inverted tests.** Read the full diff of
  all five touched test files (`tests/dyad_entitlement.test.js`,
  `tests/payments_markup.test.js`, `tests/dyad_surface.test.js`,
  `tests/dyad_activation.test.js`, `tests/tiers.test.js`) line by line. Every inversion
  still asserts something that can fail — e.g. `tests/dyad_entitlement.test.js` still
  requires a forged/tampered token to fail the *underlying* crypto verify (storage
  stays empty) even though the render tier no longer depends on the outcome; the about-
  modal test now asserts the open paragraph is literally empty (`<p id=
  "about-dyad-open" hidden></p>`) rather than removing the check. No self-referential
  or vacuous assertions found (the specific defect class this project's own memory
  flags as recurring here).
- **The two hidden Python checks the brief says it found independently**
  (`product.t4_migration`'s `T4_MIGRATION_SCRIPT` and `product.activation_wiring` in
  `audits/project_audit.py`). Read both functions in full, pre- and post-diff. Both
  were genuinely repointed to assert the new contract (dyad free by default; the
  activation function/page/routes stay dead) rather than just relaxed to pass. The
  paired assurance-suite diff in `audits/test_project_audit.py` replaces the two
  mutation tests that tested a now-nonexistent gating property
  (`test_wrong_baseline_fails`, `test_legacy_tier_honoured_fails`) with one that tests
  the property that matters now (`test_regression_to_locked_default_fails`) — verified
  this isn't a name-only swap by running the full 143-test assurance suite myself (§2)
  and by my own mutation in §3, which is exactly the scenario that new test guards
  against.
- **Scope creep.** No `netlify.toml` diff, no analytics, no new `localStorage` key, no
  new dependency, no file under a sibling `~/8ball` ops path anywhere in the diff.
- **Stale doc claims introduced by the correction itself.** Read the full diffs of
  `8BALL.md`, `README.md`, `journal.md`. All three read as accurate against the code as
  it now stands (e.g. README's dyad paragraph now says "free too... no purchase, no
  license key, no account," matching what I drove in the browser in §4). 8BALL.md
  follows the same append-superseding-sentence shape as DOCTRINE.md; README.md is
  rewritten in place, which the brief flags as README's own (non-doctrine) convention
  rather than an oversight — confirmed README carries no "superseded" apparatus
  anywhere else in the file either, so that's consistent with how it's always been
  maintained.

## 7. Standing

**MERGE.** Full suite green (66/66, 2612/2612), both Python auditors green
(14/0/1-skip; 143/143), PII scan clean, a real mutation against the one load-bearing
flag caught by both the JS suite and the Python auditor, and a live-fire browser pass
I drove myself confirms the product behaves exactly as claimed: free single sheet,
free dyad, no purchase surface reachable from any page, old `/activate` and `/example`
links redirect rather than 404. No blocking issue found; the two notes in §5 are
copy-accuracy nits in a prior artifact, not defects in the shipped change. I made no
code changes on this branch — nothing needed one.

**This entry claims no merge authority — the merge word stays with the controller per
§10/L48.**
