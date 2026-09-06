# PR #248 pre-merge cross-model audit — reconciled response

**PR:** 8ball #248 — DOCTRINE v0.91: the complete example before checkout, and immediate activation by one stateless signing function (Route F)
**Base → head:** `76aebab` (#247) → `182ae38` at audit start; both lanes' fixes land in `7c262eb` and this artifact's commit.
**Process:** DOCTRINE §10 / L48 two-lane adversarial review, driven directly from the local Mac (codex `gpt-5.5`, grok default; corpus 155,504 chars, UTF-8-clean: the complete diff, the full `core/entitlement.js`, the dyad module's injected-id inventory and its open/submit/offer code, `ui/profile.js`'s payload path, DOCTRINE §12 in full plus the v0.91 clauses and footer, the journal entry). Lanes were told the corpus was complete. Neither lane wrote a fix. Run directory `~/ai-relay/runs/20260906-134816-8ball-step1-direct/`.

## Lane verdicts

| Lane | Verdict | Findings |
|---|---|---|
| Codex | MERGE WITH FIXES | 1 P1, 2 P2, 2 P3 |
| Grok | MERGE WITH FIXES | 4 P1, 4 P2, several P3 |

**Reconciled outcome: MERGE WITH FIXES — every finding landed; the four grok P1s were real and two of them were security defects in the function as first written.** Both lanes confirmed the parts that held: the caller cannot choose `iat` or `id`; the token carries only `v/p/id/iat`; the buyer's email never leaves the verify function; the stub is env-gated, not request-gated; `profileFromPayload` reads no storage; `core/entitlement.js` is DOM-free at import and `signDyadToken` runs on Node's Web Crypto; `privacy_scan` covers the two new pages and modules; §12's bounds are real; L17 holds.

## Findings and dispositions

| # | Lane | Sev | Finding | Disposition |
|---|---|---|---|---|
| 1 | Grok | P1 | `Location` built with `new URL(redirect, request.url)` → a request with a foreign `Host` 303s a bearer credential to another origin; behind Netlify's proxy `request.url` may not even be the site | **Fixed** (`7c262eb`): every response goes through `redirectResponse()` with a RELATIVE `Location`; the auditor fails on any `request.url` read; handler tests post with `Host: evil.test` and pin a relative `Location` on every path; curl probe against `netlify dev` shows `location: /?dyad=…` raw |
| 2 | Grok | P1 | `maxlength="35"` truncates a pasted key carrying a stray space before the server's trim | **Fixed**: `maxlength="64"`, no `minlength`; the server's shape check after trim is the only length gate; live-fire pastes ` <key> ` and activates |
| 3 | Grok | P1 | The example page's page-local `t5` hook is live before the controls are removed; a render that throws leaves a working paired-reading form with no token | **Fixed**: the sweep runs in `finally`, strips by kind (`form, input, textarea, select`) and by id; `initExamplePage` takes injectable deps and a test makes `submitSecond` throw and proves the sweep; a source-level pin enumerates every control id the dyad module injects against the removed/kept lists (grok's mutant 3) |
| 4 | Grok | P1 | Offer/about copy said Gumroad "shows a license key" — false until the controller flips the per-sale switch | **Fixed**: copy true in both states ("paste the license key from your gumroad receipt — or open the access link the operator emails you"); the launch doc and PR name the switch as a merge-adjacent hand step |
| 5 | Codex | P2 | `dyad-relation-retry` not in the removed list | **Fixed**: added, with `dyad-submit`; by-kind sweep covers the rest |
| 6 | Grok | P2 | Product identity request-only: a `success:true` for another product signs | **Fixed**: `product_permalink` must equal what was asked; `GUMROAD_PRODUCT_ID` (env, optional) must match when set; numeric sale ids accepted; fixtures for each |
| 7 | Codex P1 / Grok P2 | Abuse: 10,000 well-shaped keys → 10,000 Gumroad verifies, no throttle | **Bounded, not solved**: a platform rate limit declared in the function's own `config` (30 per ip per minute — outside product state), the body capped at 4 KB, and §12 v0.91 states the residual budget (a random key costs one verify and grants nothing). No counter is kept: that would be state |
| 8 | Codex P2 / Grok P2 | A key that cannot sign → platform 500, no `no-store`, no reason | **Fixed**: `isPrivateJwk` (four fields, string-shaped) before any verify is spent; the signing call caught to `unconfigured`; tested with a well-shaped dead key |
| 9 | Grok | P2 | The rail names `/activate` but does not link it | **Fixed**: `already bought? open your dyad` line, same visibility as the note |
| 10 | Codex P3 / Grok P2 | Auditor check was substring-level: `||` injection into the guard, bracket-access email, a `new Response` without headers, a deleted example page all survived | **Fixed**: the guard must be the exact conjunction on its own `if` line with no `||` and must include `CONTEXT !== 'production'`; `['email']` and `console.info/debug` fail; every `new Response(` must carry `no-store` inline; `request.url` fails; the rate-limit export and `example.html` are required — six more assurance mutants, each failing by name (142 assurance tests OK) |
| 11 | Codex | P3 | "nothing else is sent" overclaims | **Fixed**: "only the key is sent to 8ball; it is checked with gumroad once and not kept" |
| 12 | Grok | P3 | Stub code ships; add `CONTEXT !== 'production'`; 8BALL v0.90 paragraph edited in place; example page has no visible exit | **Fixed**: all three (guard, a separate dated v0.91 paragraph, a "back to the sheet" link) |
| 13 | Grok | P2 | Example tests never boot a DOM | **Partly**: the repo vendors no DOM; the sweep is tested through an injectable fake document on the success and throw paths, the control inventory is pinned from source, and the real-browser live-fire below is the DOM run |
| 14 | Grok | P3 | `disputed` maps to the "refunded" sentence | Accepted as is: a disputed sale does not activate; the sentence is close enough and names no processor detail |

## Mutants planted (both lanes') — killed, by name

| Mutant | Killed by |
|---|---|
| Stub guard `… \|\| env.DYAD_VERIFY_STUB === '1'` | auditor `stub_guard` (assurance test) · `stubVerifyIfEnabled({DYAD_VERIFY_STUB:'1'})` null |
| Wrong product, `success:true` | "a sale for another product never signs" |
| New steering control `#dyad-swap` (an input) | by-kind sweep test · the injected-control inventory pin |
| Host-poisoned Location | handler test with `Host: evil.test` · auditor `location_origin` |
| Email via bracket access | auditor `function_privacy` (assurance) · source pin |
| Invalid private JWK after a successful verify | "a well-shaped but cryptographically dead key never 500s" |
| Early `new Response('bad')` without headers | auditor `no_store` (assurance) |
| Delete `NETLIFY_DEV === 'true' &&` | auditor + unit pin |
| Token payload gains a field | "keys are exactly iat/id/p/v" |

## Verification at the head carrying this artifact (local Mac, live runs)

- `npx vitest run` — **66 files / 2609 tests** green (main 65/2579)
- `python3 -m unittest audits.test_project_audit` — **142 OK**; `python3 audits/project_audit.py` — PASS, 15 checks, 0 blocking
- `bash audits/run_local_audit.sh` — clean, 926 files
- Live-fire under `netlify dev --offline` on a scratch copy keyed with a throwaway pair, after the absorbs: `/example` renders Mara × Teo, zero forms/inputs, every listed control absent, the real offer, empty storage, zero console errors; the sheet shows the example and activate lines; through the real form: non-hex → shape sentence, unknown → invalid sentence, stub key → `dyad · filed on this device.`, token stored, the dyad opens. curl: GET → `303 /activate`; POST with `Host: evil.test` → raw `location: /?dyad=…` (relative); a key padded with spaces → success; every response `cache-control: no-store`. Evidence `~/8ball/audits/dyad_step1_activation_example_livefire_2026-09-06/`
- `index.html` 747 lines

## What this audit does not claim

The real Gumroad verify call against a real key (the stub stands in; the controller's first activation after deploy is that check). Netlify's production bundling of `../../core/entitlement.js` (loaded under `netlify dev`; confirm on the first deploy preview). The platform rate limit's enforcement is Netlify's, not tested here. A DOM boot of the example page in the unit suite (no DOM is vendored).

**This artifact claims no merge authority — the merge word stays with the controller per §10/L48.**

## Addendum — verified on Netlify's own runtime (deploy preview of head `b7e9206`, 2026-09-06)

The two items the section above listed as unverifiable from the repo are now verified against `https://deploy-preview-248--the-eight-ball.netlify.app`, which carries no signing key:

- **Bundling and runtime:** `GET /.netlify/functions/activate` → `303`, `location: /activate`, `cache-control: no-store` — the function loaded with its `../../core/entitlement.js` import intact. `POST` of a well-shaped key → `303 /activate?e=unconfigured` (the no-key branch, reached before any Gumroad call); `license_key=nope` → `303 /activate?e=shape`. A request with a foreign `Host` is refused by Netlify's edge (`404`) before the function runs.
- **Routes:** `/example` and `/activate` serve their pages (200) through the real redirect engine; the publish scrub kept the function and both pages.
- **Browser, 390 wide:** `/example` renders Mara × Teo with the signature, zero forms/inputs, no retry control, the real offer href, empty storage, zero console errors; the sheet shows both new lines under the offer with the entry control hidden; the activation page round-trips a well-shaped key to the fixed sentence `activation is not switched on for this build yet. the emailed access link still works.` and strips the query.

Still not verified, and only the controller can: the real Gumroad verify call with a real key once the switch and the environment are set.
