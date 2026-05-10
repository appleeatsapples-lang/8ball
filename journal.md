# 8ball journal

Append-only. Newest entry at the top. Same shape as SIRR's `journal.txt` so the muscle memory carries across.

## v0.2.5.1 SHIPPED — feedback form thanks-page redirect (UX polish)

Date stamp filled at squash-merge.

v0.2.5 live-fire surfaced an aesthetic break: Netlify's default post-submit response is a generic white "Thank you!" page. Hard break from the cream-on-black specimen design — user gets yanked out of 8 ball's world. §5.B "fail-silent" intent was satisfied on the plumbing layer (no errors, submission captured) but the visual discontinuity was UX, not doctrine.

Fix: single-attribute add of `action="/"` on the feedback form. Netlify still captures the POST (routing is via `data-netlify="true"` + form name, not the action URL); after processing, Netlify 303-redirects to the homepage instead of showing its branded thanks page. User lands back on the result card rehydrated from localStorage; brief flash, lands coherent.

§5.B language unchanged. "Single named endpoint" still holds — `action="/"` controls success-redirect destination, not the submit endpoint. "Native HTML form POST" still holds. "Fail-silent" still holds. No DOCTRINE bump.

Test surface change: `tests/feedback_surface.test.js` first assertion replaced. Was `expect(tag).not.toMatch(/\saction=/i)` — defensively prohibiting any action attribute to keep the form fully default-Netlify, originally protecting against off-domain post targets. Now `expect(tag).toMatch(/\saction="\/"/)` — codifies the v0.2.5.1 decision precisely; the same-origin invariant the original assertion was guarding is preserved by `"/"` and is now the explicit shape under test. Tests 420/420 unchanged.

L25 (this session): pre-flight read of existing tests is mandatory before drafting "trivial single-line patch" briefs. The v0.2.5 handoff carrying v0.2.5.1 forward said "no test surface change," but `feedback_surface.test.js` had a defensive absence-of-action assertion that the `action="/"` patch would have failed in CI. Caught pre-edit by reading the test file before staging. Cost: one extra file in the touch list. Adjacent to L22 (pre-commit verification grep counts in briefs must reflect actual current state) — both are instances of brief-claims-vs-repo-state drift caught by reading the actual file before acting.

Files: index.html, tests/feedback_surface.test.js, journal.md, 8BALL.md.
Branch: v0.2.5.1-thanks-redirect.
Squash merge: MERGE_SHA_TBD.

## v0.2.5 SHIPPED — feedback surface (§5.B doctrine departure)

Date stamp filled at squash-merge.

First user-initiated network call in the product. Adds a single feedback form below the result card; submission goes to Netlify Forms at same origin; payload is exactly two user-typed fields (message, optional contact); no localStorage profile data, no derived coords, no telemetry. Native HTML form POST, not fetch — privacy_scan.test.js unchanged.

DOCTRINE bumped v0.16 → v0.17 with new §5.B clause.

Added:
- index.html: feedback <details>/<form> below result buttons; CSS for feedback styles; minimal JS for ?sent=1 confirmation banner; about-modal copy updated to disclose the new surface.
- tests/feedback_surface.test.js: codifies §5.B form-shape invariants (form present, data-netlify attribute, POST method, no profile-data field names, allow-listed field set, honeypot present, about-modal discloses).
- DOCTRINE.md §5.B + version footer line.

About-modal copy delta: final sentence "nothing is stored off-device" replaced with "nothing leaves your device on its own. a feedback form below the result card lets you write back to the operator if you want; only what you type there is sent, only when you press send."

Reciprocation framing: this is the architectural answer to "the toy is a one-way broadcast and that's extractive in the operator's direction." Every shake produced output, but no door existed for users to write back. v0.2.5 opens that door, with §5.B as the doctrine clause that bounds what can fit through it.

Files: index.html, DOCTRINE.md, tests/feedback_surface.test.js, journal.md, 8BALL.md.
Branch: v0.2.5-feedback-surface.
Squash merge: a0a2023a057496fde09aaaf82f3097ffebf0df21.

## v0.2.4.1 SHIPPED — favicon.ico repair (Cat 3 disposition)

Date stamp filled at squash-merge.

Single-asset patch closing the Cat 3 FAIL from the v0.2.4 Codex audit at `67b94a1`. The shipped favicon.ico had only 16×16 and 32×32 entries (header count=2) because the gen script passed a 32×32 source to Pillow's ICO-save with a 48×48 target — Pillow silently drops upscale targets. Regenerated with a 64×64 source that downsamples cleanly to all three entries; new ICO has count=3.

Asset bytes: 1243 → 3571.

Gen script fixed at `~/Desktop/8ball/sessions/launch_prep_asset_gen.py` for any future regeneration.

No code change, no doctrine change, no other asset change. v0.2.4 surface intact otherwise.

Files: assets/favicon.ico, journal.md, 8BALL.md.
Branch: v0.2.4.1-favicon-ico-repair.
Squash merge: 1f9d2a4.

## v0.2.4 SHIPPED — launch-prep meta polish (additive surface)

Date stamp filled at squash-merge.

Surface-additive patch. No calc change, no doctrine change, no core/ touch.

Added:
- favicon set: assets/favicon-16.png, favicon-32.png, favicon.ico, apple-touch-icon-180.png
- Open Graph + Twitter card meta tags in <head>
- og-image: 1200×630 PNG, monochrome paper-on-black, brand mark + tagline + URL
- meta block referencing all of the above

Fixed:
- stale hint string "dst not adjusted in v0.2.1" → "dst not adjusted" (post-v0.2.3 version reference)

Doctrine clean: §3 additive-only, §5 same-origin assets (zero new network surface for visitor browsers; unfurl crawlers are server-side and not the user's surface), §6 line count 815 → ~840 (under 1500), §11 og:image renders brand mark + tagline + URL only (no PII).

Aesthetic: monochrome per Phase-2E lock. Asset generation reproducible via ~/Desktop/8ball/sessions/launch_prep_asset_gen.py.

Files: index.html, assets/* (5 new), journal.md, 8BALL.md.
Branch: v0.2.4-launch-prep-meta.
Squash merge: a671f23.

Reasoning to ship: bare URL is live on TikTok bio (no card-style polish meta). Every share between v0.2.3 and a later polish is a worse-quality unfurl than it could be. Single-cycle ~30 line patch closes that gap.

## 2026-05-10 · v0.2.3 numerology revert — SHIPPED at 141da42

Surface-only revert of v0.2.2 hexagon polygon. Result-card line 4 returns to text triplet `[life path, expression, soul urge]` exactly as rendered at v0.2.1 (`f3666cb`). Format conditional: space-separated when any master number (11/22/33) is present (e.g. `3 11 3`), concatenated when all values are single-digit (e.g. `383`).

Calc fields (`personality`, `birthday`, `maturity`) added in v0.2.2 are KEPT on `buildProfile` as data-only — reserved for v0.3.0+ paid surfacing. No `core/` touch. Tests stay 414/414 green.

Doctrine v0.15 → v0.16: §1.B replaced (was: hexagon vertex-order lock; now: text-triplet surface + calc-vs-surface separation rule). §1 body updated to clarify the seven-coordinate surface and three-coordinate calc reserve.

Operator decision: hexagon polygon read as geometric/mystic and clashed with the "no mystery layer" framing in the about modal. Text triplet preserves the calibrated-coordinate spirit without the geometric flourish; opens lower half of card as breathing room reserved for v0.3.0 paid interpretation surface.

Files touched: `index.html` (~-50 net lines), `DOCTRINE.md` (§1 body + §1.B replacement + version line), `8BALL.md` (§10 + §3 row 9 + §1 description), `journal.md`. No tests, no `core/`, no audit script changes.

Branch: `v0.2.3-numerology-revert` → squash-merged to `main` at `141da42`.

**Codex audit cycle:** single-cycle, OVERALL CONCERN with one non-blocking advisory on Dimension 5 (v0.2.1 surface faithfulness). Concern: post-revert `formatNumbers` lacks the v0.2.1 inline comment block; runtime behavior identical. **Disposition: accept-divergence.** The retired comment said `// for potential surfacing in the future paid interpretation layer.` — that principle is now formally locked in DOCTRINE §1.B with more precision (calc-vs-surface separation; personality/birthday/maturity explicitly reserved for v0.3.0+). Restoring a stale comment that §1.B supersedes is redundant; writing a fresh comment duplicates §1.B. Brief overclaimed "byte-equivalent" — accurate claim was "behavioral revert to v0.2.1," which Codex confirmed.

**Lesson logged (L21):** when reverting to a prior surface state while keeping doctrine-coherent improvements, briefs should say "behavioral revert" not "byte-equivalent" to set the audit criterion at the right precision. "Byte-equivalent" implies source-level identity which is overconstrained when later doctrine has codified what the prior code only commented.

=====
2026-05-09 · v0.2.2 SHIPPED — Phase-2G-2 hexagon polygon, squash-merged at `fa552ca`
=====

v0.2.2 lives at `https://the-eight-ball.netlify.app` on `main` at `fa552ca`. The Phase-2G-2 arc closed; two-audit Codex cycle cleared (audit-1 caught a CI-gate FAIL — missing journal.md touch — promptly resolved by this entry; audit-2 PASS clean).

## What shipped

The fourth line of the result card surface — previously a reduced-numerology text triplet rendered by `formatNumbers()` (e.g. `"777"` or `"3 11 3"`) — is replaced with an inline-SVG hexagon. Six vertices carry six numerology coordinates, vertex order locked clockwise from top: Life Path, Expression, Personality, Maturity, Soul Urge, Birthday. Three of those six are new additive calc-contract fields (Personality, Birthday, Maturity); three are pre-existing (Life Path, Expression, Soul Urge). Free-tier surface goes from 8 → 11 calibrated coordinates (10 baseline + optional rising).

Visual surface (full-opts path):

```
fire
aries ↑ rabbit
rat ⇌ rabbit
[hexagon: 3 1 6 4 4 1 clockwise from top]
```

## Architecture: surface-breaking, data-additive

The split between calc contract and surface contract holds:

- **Calc contract: ADDITIVE.** `core/profile.js` gains five new exports (`getPersonality`, `getPersonalitySum`, `getBirthday`, `getMaturity`, `getMaturitySum`) and five new `buildProfile` fields (`personality`, `personalitySum`, `birthday`, `maturity`, `maturitySum`). Every existing field returns byte-identical to v0.2.1. Calc-version stays v1.
- **Surface contract: BREAKING.** Line 4 of the rendered card changes from text triplet to inline-SVG polygon. `formatNumbers()` is removed. The about-modal copy is updated from "seven calibrated coordinates" to "ten calibrated coordinates" (with rising as eleventh when birth time/place are provided).

Doctrine v0.14 → v0.15 with new §1.B codifying the surface-breaking/data-additive distinction and locking the vertex order.

## Implementation details

`core/profile.js` (44 lines added):
- `getPersonalitySum` mirrors `getSoulUrgeSum` with vowel filter inverted. Pythagorean letter values, non-letters skipped.
- `getPersonality` reduces with master 11/22/33 preservation via the existing private `reduce()` helper.
- `getBirthday` reduces day-of-month with master preservation. 31 → 4, 11 stays 11, 22 stays 22, 29 → 11.
- `getMaturity` operates on `getLifePathSum + getNameNumberSum` (the unreduced sums) and reduces. This keeps master preservation conceptually clean — operating on already-reduced inputs would yield the same result given the master-preserving `reduce()`, but summing the raw sums matches how LP and name-number themselves are derived.

`core/engine.js`, `core/countries.js`, `core/rising.js` untouched. Catalog driver `(sun, animal)` per DOCTRINE §1 unchanged.

`index.html` (852 lines, 32 lines added net of the deleted `formatNumbers`):
- `formatNumbers` deleted; `formatCoordinates` returns three lines instead of four.
- New `formatHexagonSVG(profile)` returns `<svg viewBox="0 0 100 100">` containing a regular hexagon polygon (radius 38, vertices at angles `-90°, -30°, 30°, 90°, 150°, 210°`) and six `<text>` elements at radius 50.
- Module-scope precomputed constants: `HEXAGON_POLYGON_POINTS` (the polygon-points string) and `HEXAGON_LABEL_POINTS` (six `[x, y]` pairs). No runtime trig.
- DOM grew by one element: `<div class="hexagon" id="card-hexagon" aria-hidden="true">` sibling to `#card-coordinates`. `aria-hidden` because numerology values are not announced verbally elsewhere either; the catalog and coordinates lines remain the screen-reader-relevant content.
- CSS: `.card .hexagon` wrapper sized `clamp(140px, 38vw, 180px)`; polygon stroked at `var(--label)` 1px no-fill; text in `var(--font-mono)` 11px `var(--ink)`. `overflow: visible` on the SVG was added beyond the brief — labels at radius 50 land at y=0 / y=100 (viewBox edge), and `overflow: visible` is the minimal mechanical fix to prevent half-character clipping while preserving the locked geometry. Audit-1 disposition: accept as-is.
- About-modal copy regenerated for the new ten-coordinate surface, listing each coord by name.

## Tests + audit

414 tests (was 403 at v0.2.1), +11 in `tests/profile.test.js` covering:
- `getPersonality` — empty input, simple consonants-only sum, master-number preservation (`Hal` → 8+1+3 = 11 master), non-letter ignore (`xyz!` → 6+7+8 = 21 → 3).
- `getBirthday` — single-digit pass-through, 31 → 4, master preservation (11, 22), 29 → 11 (master).
- `getMaturity` — simple sum (Alex Thomas / 1996-04-01: LP-sum 30 + name-sum 37 = 67 → 13 → 4), master preservation (LP-sum + name-sum = 11 master).
- `buildProfile` exposure — asserts the five new fields with locked values for the canonical Alex Thomas / 1996-04-01 fixture: `personality=6, personalitySum=24, birthday=1, maturity=4, maturitySum=67`.

`tests/fixtures.json` unchanged — direct unit tests cover the new functions; existing 13 cases assert sunSign/animal/lifePath only by design, and adding three new expected fields across all 13 entries would create churn with no upside.

Local PII audit clean (26 files scanned). Per-stage CI green.

## Audit cycle

- **Implementation report** (Codex on `v0.2.2-phase2g2-hexagon`): 5 files changed, +179 −30; tests 414/414; audit clean; one disclosed deviation (`overflow: visible` on the SVG to prevent label clipping at viewBox edge).
- **Pre-audit verification** (orchestrator): branch checked out and re-tested locally; vertex math sanity-checked against Alex Thomas / 1996-04-01 → `[3, 1, 6, 4, 4, 1]`; geometry verified (radius 38 polygon, radius 50 labels at the six locked angles).
- **Audit-1** (fresh Codex, independent): every checklist item PASS except one CONCERN (I4 — `overflow: visible` deviation, low-severity, accept as-is) and one FAIL — CI gate at `.github/workflows/ci.yml` lines 33-46 requires `journal.md` touch when `DOCTRINE.md` changes (DOCTRINE §3 / §8). The orchestrator's brief omitted journal.md from the file-touch spec, which propagated through implementation. This entry is the fix.
- **Audit-2** (post-journal-fix): expected to pass clean.

## Brief-discipline lesson

The implementation brief specified file-touches for `core/profile.js`, `index.html`, `tests/profile.test.js`, `DOCTRINE.md`, `8BALL.md` — but missed `journal.md`. Next time a brief touches `DOCTRINE.md`, journal.md is implicit and must be added to the file-touch list, not assumed. The CI gate exists precisely because this is easy to forget. Adding a one-line "files touched MUST include journal.md when DOCTRINE.md or content/*.js changes" pre-flight check in the brief template would prevent the regression cleanly.

This was the first time the orchestrator (rather than the implementer) caused a CI-gate-relevant brief omission since the gate landed. Audit-1 caught it; the cycle worked as designed.

## Surface-density check

Free-tier surface count after this ship: 11 calibrated coordinates (chinese five-element, sun, public animal, private animal, life path, expression, personality, maturity, soul urge, birthday + optional rising). The four 2G-3+ candidates (moon sign · day-pillar animal · lunar phase · birth card) are explicitly deferred behind v0.3.0 — operator chose to stabilize at 11 and pivot to the paid interpretation layer. May not return.

Operator should ground-truth the rendered hexagon on actual mobile viewports before any further free-tier coord additions; the hexagon is the densest visual element on the card and small-screen rendering is not yet field-tested.

## What's next

Pickup queue:

1. **v0.3.0 paid interpretation layer.** New priority. First doctrine departure for §5 zero-network — needs design pass before brief. Payment provider, auth flow, gating boundary, content-decryption strategy. Pricing decision belongs after the architecture is built and value-density is observable.
2. **Deferred 2G-3+ candidates.** Held behind v0.3.0; may not return.

=====
2026-05-09 · v0.2.1 SHIPPED — Phase-2G-1 rising sign + country auto-fill, squash-merged at `f3666cb`
=====

v0.2.1 lives at `https://the-eight-ball.netlify.app` on `main` at `f3666cb`. The Phase-2G-1 arc closed; two-audit Codex cycle cleared at audit-2 PASS clean.

## What shipped

An eighth surface coordinate: rising sign. When the user opens the optional `<details>` group and supplies birth time + country + lat + lng, line 2 of the surface renders as `${sun} ↑ ${rising}`. Without those inputs, line 2 stays a bare sun sign exactly as in v0.2.0. The other six coordinates and the catalog driver `(sun, animal)` are unchanged. Visual surface (full-opts path):

```
fire
libra ↑ scorpio
rat ⇌ rooster
3 11 3
```

## Architecture: rising as surface-only

DOCTRINE §1 stays exact: catalog driver remains `(sun, animal)`. New DOCTRINE §1.A "Rising sign — surface coordinate, not a driver" makes the boundary explicit — rising is rendered, not a deck dimension. Implementation matches:

- `core/rising.js` (86 lines, zero deps): pure Meeus ascendant. Three reference cases anchor tests within 0.01° of astro.com.
- `core/profile.js` extended additively: `buildProfile(name, dob, opts?)`. v0.2.0 callers produce byte-identical output; the new `risingSign` field is undefined unless full opts are present.
- `core/countries.js` (276 entries): ISO 3166-1 sovereigns + multi-tz country zones (US-E/C/M/P/AK/HI; CA-NL/AT/E/C/M/P; RU 4 zones; AU 3; BR 3; MX 3; ID 3; KZ 2; MN 2; CL 2). Each entry: `{code, name, utcOffsetMinutes, defaultLat, defaultLng}`. Centroids 1-decimal from CIA World Factbook. UTC offsets fixed-per-entry; DST out of scope for v0.2.1 — codified in DOCTRINE §1.A extension.
- `index.html` (820 lines, well under the 1500-line single-file gate): collapsible `<details>` rising-fields group; country `<select>` with onChange auto-fill; always-overwrite-on-country-change behavior; rehydrate-no-fire behavior; empty-country-preserves behavior.

localStorage payload extended additively: `{name, dob}` → `{name, dob, time?, country?, lat?, lng?}`. Zero network calls preserved (DOCTRINE §5).

## Tests + audit

403 tests (was 102 at v0.2.0), +301:
- `tests/rising.test.js` — 24 tests: 3 reference cases, math primitives (`julianDay`, `gmstDeg`, `obliquityDeg`, `ascendantDeg`), `buildProfile` integration, 12 edge cases (lat 0/±60/±89, lng ±179.99, dates 1924-2099).
- `tests/countries.test.js` — 276 dynamically-generated data-quality tests (defaultLat/defaultLng range validation per entry).
- `tests/profile.test.js` — additive regression test asserting `buildProfile`-without-opts has `risingSign === undefined` and 12 existing fields byte-identical to v0.2.0.
- `tests/fixtures.json` — new top-level `rising_cases` array; existing `cases` array byte-identical.

Local PII audit: 22 → 26 files (+4 = `rising.js`, `countries.js`, `rising.test.js`, `countries.test.js`).

## Two-audit cycle (Phase-2G-1)

```
audit-1 at 3540e97  PASS w/ 1 CONCERN (README stale test count "102 cases as of v0.2.0")  disposed at f79f7a9
audit-2 at c3b0e88  PASS / PASS / PASS — cycle closed
```

The auto-fill UX layer was added between audit-1 and audit-2 (extension brief at `~/Desktop/8ball/audits/codex_brief_2G1_extend_autofill_at_f79f7a9.md`). The 30 orchestrator-locked seed values in `core/countries.js` were verified at audit-2.

## Branch hygiene note

The implementing agent's first 2G-1 commit (`3540e97`) was committed directly to local main in violation of the brief's "do NOT amend main directly" instruction. Caught before any push to origin. Recovery: cut branch from work commit, reset main to `87dc494` (= origin/main), checkout branch. The auto-fill commit at `c3b0e88` followed branch discipline correctly. Worth pre-flagging more emphatically in future implementation briefs (e.g. "DO NOT commit to main; if your tooling auto-targets main, switch to the branch FIRST").

## Squash-merge

Squash to `main` produced one v0.2.1 commit at `f3666cb`. `phase-2g-1-rising-sign` deleted post-merge (local force-delete; never pushed to origin separately).

## Netlify credit-cap incident

Push to origin went through clean. Netlify silently skipped the deploy: `Skipped — Skipped due to account credit usage exceeded`. The team's free-tier credits had run out. Operator paid ~22:43 this session, upgraded to Personal plan ($9/mo, 1,000 credits/month + 30 add-on = 1,030 available, billing period May 9 – Jun 8). Netlify does NOT auto-retry skipped deploys after credit restoration — operator manually clicked Trigger deploy on the deploys dashboard, which fired the build of `main@f3666cb`.

Prod-local parity at ship: 28,031 bytes byte-exact local↔prod; new etag `b50ba742…` (was `b40f6884…` at v0.2.0); all v0.2.1 strings present (`country-input`, `rising-fields`, `risingSign`, `↑`).

Worth a calendar reminder to check Netlify credit balance before major ships in subsequent sessions.

## State at ship

- HEAD `main` at `f3666cb`, pushed to origin
- Tests 403/403 (calc+pipeline, privacy, PII, dependency, rising, countries)
- Local PII audit clean (26 files)
- Repo: private
- Doctrine: v0.14
- Calc version: v1 (Pythagorean LP w/ 11/22/33 masters · tropical sun · CNY Feb 4 cutoff · Meeus ascendant)
- Content version: v0.2.1-public (catalog-only; engine computes positionally, no card strings in public runtime; full content lives privately at `~/dev/8ball-private/cards.v1.full.js`, unchanged in v0.2.1)

## Post-ship live-fire (2026-05-09)

Operator ran the 5-gate prod live-fire on `https://the-eight-ball.netlify.app`:

1. No-opts path: 4 lines, line 2 bare sun sign, no `↑` glyph ✓
2. Full-opts path: line 2 `${sun} ↑ ${rising}` ✓
3. Auto-fill: country picks populate lat/lng with centroid; second pick overwrites; clear country preserves manual values ✓
4. Rehydrate-no-fire: manual lat/lng overrides survive reload (auto-fill doesn't re-fire on hydrate) ✓
5. Three reference cases vs astro.com (London/NYC/Riyadh): rising signs match (virgo/leo/capricorn) ✓ — math inherits from local live-fire which already cleared <0.01°.

5/5 green.

## Surface-density signal (orchestrator-flagged)

The free-surface trajectory if all post-2G-2 candidates shipped: 7 (v0.2.0) → 8 (v0.2.1) → 11 (v0.2.2 hexagon) → 15 (2G-3+ moon/day-pillar/lunar/birth-card). 15 coordinates crowds the specimen-registry austere aesthetic. Surfaced mid-session; operator chose to stabilize at 11 post-hexagon and pivot to the interpretation/paid layer (v0.3.0) instead. The four 2G-3+ candidates are explicitly deferred behind v0.3.0; may not return. Worth ground-truthing the rendered hexagon surface against actual mobile rendering before greenlighting more free coords post-2G-2.

## Carry-over (post-v0.2.1 queue)

From 8BALL.md §11 open items, residual:

- Phase-2G-2 hexagon polygon (locked decisions at `~/Desktop/8ball/sessions/queue_2G2_hexagon_polygon.md`); pickup on operator signal.
- v0.3.0 paid interpretation layer (NEW priority signaled by operator this session — $5 toy-price tier). Architecture already reserved; needs design pass.
- Deferred 2G-3+ candidates (locked decisions at `~/Desktop/8ball/sessions/queue_post_2G2_candidates.md`); held behind v0.3.0.
- Phase-2C deploy-gate wiring (still doctrine-correct as "not gated, acknowledged").
- Cleanup: shadow Netlify project (`enchanting-bonbon-2b5064`); both Netlify projects served the same stale v0.2.0 during the credit-cap incident.
- Stale branch cleanup on origin (`v0.1.4-phase2d-concern-dispositions` may still exist; verify and prune).

---

=====
2026-05-09 · v0.2.0 SHIPPED — Phase-2F card system + secret strip + symbols-only surface, squash-merged at `2b69944`
=====

v0.2.0 lives at `https://the-eight-ball.netlify.app` on `main` at `2b69944`. The Phase-2F arc closed; five-audit Codex cycle cleared at audit-5 PASS/PASS/PASS.

## What shipped

Seven calibrated coordinates from (name, DOB): sun sign, Chinese five-element, public animal (year-pillar), private animal (month-pillar), life path, name number, soul urge. Animals pair on one line via the equilibrium arrow `⇌`. Numerology numbers collapse onto one line as a reduced triplet (concatenated when single-digit, e.g. `777`; space-separated when any master 11/22/33, e.g. `3 11 3`). The (sun sign, public animal) pair drives a 144-card catalog index (12 sun rows × 12 animals), rendered as roman numeral in the corner. Life path drives bracket resolution within a cell, separately from the catalog index. Final visual surface, centered on page:

```
fire
libra
rat ⇌ rooster
3 11 3
```

## Architecture: secret strip

Card content (cell `name`/`type`/`habit`/`note` bodies) is the future paid interpretation layer. It lives privately at `~/dev/8ball-private/cards.v1.full.js`. The public engine computes the catalog index positionally with no content import:

```js
const catalogArabic = sunIdx * 12 + animalIdx + 1;
// getCard(profile) returns { name:'', type:'', habit:'', note:'', catalog }
// — empty content fields preserve the API shape for v0.3.0+
```

`tests/dependency_discipline.test.js` guards against any future content import in the public engine.

## Repo visibility flip + branch cleanup

The repo flipped from public to private at this release. `phase-2f-1-card-engine` was deleted from origin + local post-merge — the cards-containing intermediate commits (`a4032b9` first-add through `7b9b99f` last pre-strip tip) are no longer reachable via any branch ref on origin. They survive in GitHub's GC pool for ~30-90 days, then drop.

**Correction to a prior journal claim.** The 2F-3 "in-flight (cont.)" entry below stated "Branch was never pushed, so the secret was never on the public internet — caught before any leak." That was incorrect. `phase-2f-1-card-engine` had been pushed to origin during 2F-1 (when `cards.v1.js` was first integrated); the full 144-card deck was publicly visible at `github.com/appleeatsapples-lang/8ball/blob/phase-2f-1-card-engine/content/cards.v1.js` from 2F-1 first-push through this release's private flip. The exposure window was real. Going forward, the private flip + branch deletion + clean main bound the future surface; past exposure is sunk-cost. Logging the correction here as the audit record — the past entry is preserved as-written for journal append-only discipline.

## Five-audit cycle (Phase-2F-3)

```
audit-1 at 67c8abf  FAIL §4 medical-vocab + 2 CONCERNs   disposed
audit-2 at 9b7bafd  FAIL copy mismatch + 3 CONCERNs       disposed
audit-3 at 62ff5b8  FAIL catalog driver + 2 CONCERNs      disposed
audit-4 at fd265c1  FAIL virgo.dragon leak + 1 CONCERN    disposed
audit-5 at c86970e  PASS / PASS / PASS — cycle closed
```

Dispositions across the cycle: doctrine v0.3 → v0.12. Card content moved private (v0.9). §4 new clause: card-content strings forbidden in any tracked file (v0.11). §11 PII rule rewritten as visibility-independent (v0.12). §1 catalog driver corrected to (sun, animal) pair to match engine truth (v0.10). §7 CI gate stages aligned with current suites (v0.10). All audit-disposition commits and journal scrubs captured in the audit-3 and audit-4 disposition entries below.

Orchestrator's local card-content scan against the live private deck before audit-5: 864 distinct strings (≥ 8 chars) × 23 tracked files = zero hits. Live-public-claim sweep: zero hits.

## Squash-merge

The feature branch carried 34 commits beyond `7b9b99f` (the prior origin tip). The merge to `main` was squash, producing one v0.2.0 commit at `2b69944`. The 34-commit sequence is preserved in the audit history (Codex briefs at `~/Desktop/8ball/audits/codex_brief_2F3_reaudit_at_*.md`) and in the journal entries below. Squash captures: `traits.v1.js` and `templates.v1.js` deleted (retired in 2F-2); `cards.v1.js` deleted (secret strip in 2F-3); engine rewritten to compute positionally; profile.js extended with `getInnerAnimal` + month-pillar cutoffs; index.html flipped to symbols-only seven-coordinate surface; full doctrine arc; full audit-3+4 dispositions.

Diff stats vs `3f80c5e` (prior `main`): 14 files changed, 1689 insertions, 1072 deletions.

## State at ship

- HEAD `main` at `2b69944`, pushed to origin
- Tests 102/102 (calc+pipeline, privacy, PII, dependency)
- Local PII audit clean (22 files)
- Repo: private
- Doctrine: v0.12
- Calc version: v1 (Pythagorean LP w/ 11/22/33 masters · tropical sun · CNY Feb 4 cutoff)
- Content version: v0.2.0-public (catalog-only; engine computes positionally, no card strings in public runtime · full content lives privately at `~/dev/8ball-private/cards.v1.full.js`)

## Post-ship gates (per §8)

- Netlify auto-deploy fired on push to main
- Operator live-fire on `https://the-eight-ball.netlify.app` — verify the seven coordinates render correctly (element / sun sign / animal pair via `⇌` / numerology triplet) with the catalog corner in roman
- TikTok launch: operator-track

## Carry-over (post-v0.2.0 queue)

From 8BALL.md §11 open items, residual:

- Phase-2C deploy-gate wiring (Netlify required-check on GitHub Actions status). Doctrine-correct as "not gated, acknowledged" until traction warrants.
- Cleanup: shadow Netlify project (`enchanting-bonbon-2b5064`). One-click delete in Netlify dashboard.
- Cleanup: stale branch `v0.1.4-phase2d-concern-dispositions` if still on origin.
- Live-fire testing across all 12 sun rows on the deployed URL (now codified as a §8 ritual-gate sub-rule per doctrine v0.3).
- Operator-personal: add `8ball` row to `~/MUHAB.md` §6 bootstrap table.

=====
2026-05-09 · Phase-2F-3 audit-4 dispositions — missed-spot polish + virgo.dragon leak scrub
=====

Codex audit-4 at `fd265c1` returned **FAIL** + 1 CONCERN + 2 PASS. The PASS findings (3.1 catalog driver consistent everywhere; 3.4 zero code regression vs `62ff5b8`) close cleanly. The other two were missed-spot disposals from audit-3 — the audit-3 cycle's sweep wasn't comprehensive enough on either lane. All disposed in commits below.

## FAIL — current card-content string at `journal.md:245` (this commit, doctrine §4 v0.11 clause)

Codex ran an exact-string scan against `9b7bafd:content/cards.v1.js` (the pre-strip deck) and surfaced one current-system card-content leak the audit-3 scrub missed: the 2F-1 prescan-resolution note for `virgo.dragon.note.low` quoted both ChatGPT's 7-word original and the 13-word orchestrator-refined replacement verbatim. Both are real card-`note.low` bodies for the cell.

Fix: same pattern as the audit-3 CONCERN-3 scrubs — reference the cell by coordinate path only, point at the private deck for the strings. Word counts (7 → 13) and the rationale (adversarial-review comfort) preserved as procedural metadata. Doctrine §4 clause from v0.11 covers this — the violation was a missed-spot from the audit-3 sweep, not a doctrine gap.

No code changes; one journal line edited.

## CONCERN — stale-public/checklist residues (this commit, doctrine v0.11 → v0.12)

Five spots Codex flagged plus one I caught while sweeping (`DOCTRINE.md §8.1`) plus two more in `RELEASE_CHECKLIST.md` (same drift, different lines). All cleared:

- `DOCTRINE.md §11` (line 152): "The repo is public." → the rule is now stated independent of repo visibility. The PII rule survives the public→private flip; tracked content is the durable boundary, not the current ACL state. Repos can flip; the rule doesn't.
- `DOCTRINE.md §8.1` (line 108): CI stage list updated from `calc / engine / content / PII / single-file` to `calc+pipeline / privacy / PII / dependency / single-file`, with explicit pointer to §7 for the per-stage breakdown. (Audit-3 missed this in the v0.10 polish; it's the same drift as the §7 fix.)
- `8BALL.md` PII-rule restatement (line 103): same premise rewrite as `DOCTRINE.md §11`.
- `8BALL.md §9` canonical-paths block (line 164): `(public)` → `(private as of v0.2.0)`.
- `.github/workflows/ci.yml` (line 11): job name `test + content scan` → `test`. (The actual workflow steps never ran a separate content scan — the name was a leftover label from when `cards.v1.js` was scanned.)
- `audits/RELEASE_CHECKLIST.md`: stage-list line aligned with §7 v0.10+ (calc+pipeline / privacy / PII / dependency / single-file). Plus two more lines I caught while in there — the diff-review checklist's "any new line in `content/`" question rephrased to "any new private content batch" (since the public repo's `content/` is now empty), and the post-merge smoke-test/rollback wording updated from "verify the roast lands" to "verify the seven coordinates render correctly."

Doctrine version footer: v0.11 → v0.12.

## State going into audit-5 (if needed)

Tests: 102/102. Local PII audit: clean (22 files). Working tree: clean. Branch `phase-2f-1-card-engine` still unpushed.

Live doctrine claims now consistent across every surface scanned: catalog driver is `(sun, animal)` pair; repo is private as of v0.2.0; CI stages are calc+pipeline / privacy / PII / dependency / single-file; §4 forbids card-content strings in tracked files; §11 PII rule is visibility-independent.

Commit in cycle: `<this commit>`. Audit-5 (if requested) is a tighter sweep — verify the FAIL fix at `journal.md:245`, verify the CONCERN polish across the six locations, regression-check that no code changed since `62ff5b8` (which `fd265c1` already established was clean).

=====
2026-05-09 · Phase-2F-3 audit-3 dispositions — catalog-driver fix, doctrine polish v0.10, journal scrub v0.11
=====

Codex audit-3 at `62ff5b8` (post secret-strip) returned **FAIL pending one fix** + 2 CONCERNs + PASS on secret-strip mechanics and calc/UI/privacy. All three findings disposed on `phase-2f-1-card-engine` before any push to origin. The branch was never public, so all of this is pre-merge polish, not a post-ship correction.

## FAIL — catalog driver misstated (commit `428cba5`)

Codex caught a doctrine/runtime mismatch: `8BALL.md:33`, `DOCTRINE.md:11`, and `README.md:5` all claimed the `(sun sign, public animal, life path)` **triplet** drives the 144-card catalog index. Engine truth at `core/engine.js:81` is `sunIdx * 12 + animalIdx + 1` — 12 sun rows × 12 animals = 144, no slot for life path. Life path drives `resolveBracket` (low/mid/high) within a cell, separately from the catalog index.

This was a doctrine-truthfulness drift introduced during the 2F-3 secret strip itself — the engine math has always been pair-based, but the docs accreted a triplet-driver claim across earlier doc-sync rounds without ever being checked against the code. Fixed in three files; no code changes; tests still 102/102.

## CONCERN — stale public-deck/test language (commit `80011f1`, doctrine v0.9 → v0.10)

Eight stale spots flagged, all newly contradictory after the secret strip:

- `README.md`: vitest count 22 → 102; test-suite description rewritten to four current suites (`profile.test.js` / `privacy_scan.test.js` / `pii_scan.test.js` / `dependency_discipline.test.js`); structure block updated — `cards.v1.js` removed, `content/` noted empty in public, full deck pointer to `~/dev/8ball-private/`.
- `DOCTRINE.md §5`: Google-Fonts-CSS exception removed; system fonts only, zero network requests after page load.
- `DOCTRINE.md §6`: "Single repo, public on GitHub" → private as of v0.2.0 (was public through v0.1.4).
- `DOCTRINE.md §7`: CI gate stages updated to actual current suites. Old step 2 (token-leakage + recent-buffer dedup) and step 3 (content scan against `cards.v*.js`) retired with explicit footnote — the banned-pattern + banned-voice-register policy is preserved in `tests/profile.test.js` as the canonical rule reference; the scan itself moved to the private content-authoring pipeline.
- `8BALL.md:206`: Phase-2F historical entry amended to include 2F-3 secret strip; `cards.v1.js` noted as retired-from-public-repo.
- `tests/profile.test.js:8`: header comment updated to match secret-strip reality.

No code changes; mechanical text alignment with the v0.2.0-public state.

## CONCERN — journal card-content residue (this commit, doctrine v0.10 → v0.11)

Codex flagged that the journal contained card-content excerpts pre-dating the secret strip, making the doctrine claim "the public repo ships no card strings" technically false even if runtime stayed clean. Codex's framing was accept-and-defer-acceptable since the repo flips private — operator chose stronger disposition: **scrub now + add forward-looking clause**.

Scrubs in this commit (current cards-system content only):

- 2F-2 audit-disposition write-up (Phase-2F-2 dispositions section): five `§4 medical-vocab` swaps now reference cells by coordinate path only (`aries.rabbit.note.mid`, `scorpio.snake.name`, `scorpio.snake.note.low`, `scorpio.rooster.name`, `aquarius.monkey.note.high`); before/after strings dropped from journal, preserved with the private deck.
- 2F-3 minimal-surface pivot rationale: two card names quoted as readability examples replaced with a non-quoting summary ("the interpretive card-name layer read as gibberish…").
- Pre-scan note for the 2F-1 ChatGPT batch: trigger word at `aries.rabbit.note.mid` no longer named in line, only the cell coordinate.
- 2F-1 content-swap log: 12 verbatim Aries card names dropped; replaced with a pointer to the private deck.
- 2F-1 Grok cold-reading sniff (Aries row): two card names cited as a near-collision example now referenced by deck position (`v` and `x`) and archetype only (theatrical/commanding vs polished/critical).

Forward-looking clause added to `DOCTRINE.md §4`: **No card-content strings in tracked files.** Cell name/type/habit/note bodies live privately at `~/dev/8ball-private/cards.v1.full.js`; no public-repo tracked file (source, tests, fixtures, `journal.md`, audit notes, this doctrine) may contain a card-content string. Audit dispositions reference cells by coordinate path; before/after strings stored privately.

**Out of scope (retained as historical record):** trait-pool / template-pool excerpts from the retired `traits.v1.js` / `templates.v1.js` system (deleted from the repo in 2F-2). Codex audit-3 did not flag these, the system itself is gone, and the new §4 clause is explicitly forward-looking from v0.11.

## State going into audit-4

Tests: 102/102. Local PII audit: clean (22 files). Working tree: clean. Branch `phase-2f-1-card-engine` still unpushed.

Doctrine version footer reads v0.11. Catalog-driver claim in `§1` now matches engine truth. §4 forbids card-content in tracked files; §5 system-fonts-only; §6 private-as-of-v0.2.0; §7 CI stages match the actual test suites.

Commits in cycle: `428cba5` (FAIL fix) → `80011f1` (CONCERN polish) → this commit (journal scrub + §4 clause). Audit-4 brief targets the post-cycle HEAD; verifies (a) catalog-driver fix is consistent across all surfaces, (b) journal contains no current-system card-content strings, (c) §4 new clause reads cleanly, (d) no regression in secret-strip mechanics or calc/UI/privacy.

=====
2026-05-09 · Phase-2F-3 in-flight (cont.) — second-animal axis, triplet collapse, equilibrium arrow, centering, and secret strip
=====

Continuation of the 2F-3 cycle. Previous entry covered through commit `55e8f07` (post-audit-2 dispositions). This entry covers the additional architecture pivots that landed before audit-3.

## Second-animal axis: month-pillar private animal (commits cb22297, 56760af, dd64e24)

Operator decision: ship two Chinese animals — public (year-pillar, the one people commonly identify with) and private (month-pillar, the inner self). Standard Chinese astrology distinguishes 年柱 (year-pillar) from 月柱 (month-pillar); both are calibrated, year alone is incomplete tradition.

`core/profile.js` adds:
- `MONTH_ANIMAL_CUTOFFS` — 12 windows anchored at solar-term cutoffs (节气 jiéqì), fixed-date approximations consistent with the Feb 4 CNY approximation already in use
- `getInnerAnimal(month, day)` — walks cutoffs in reverse, the most recent at-or-after wins; Jan 1-5 wraps to previous-year December rat
- `buildProfile` returns `innerAnimal` between `animal` and `lifePath`

Tests: 12 new unit tests covering each cutoff (boundary + in-window day) + buildProfile shape. Test count 118 → 130. Synthetic test data only (Alex Thomas + 1988-08-15 = leo · earth · dragon · monkey).

Doc sync (8BALL §1+§10, DOCTRINE §1+§3 calc-v1 note, README line 5): four → seven calibrated coordinates with public/private animal split. Doctrine v0.6 → v0.7.

## Equilibrium-arrow animal pair + symbols-only principle (commit 56c0cb5)

Operator: "put 2 animal private public … just the symbols no explanation or interpretation. interpretation is paid for."

`formatCoordinates` collapses the two animal lines onto one with the chemistry equilibrium arrow `⇌` (U+21CC):
```
rat ⇌ rooster
```

Modal "the trick" copy stripped of interpretive parentheticals (`(your year)` / `(your month)` removed); "these are your reading" → "these are your symbols". Implementation comment rewritten to record the product principle: free surface = calibrated symbols only; interpretation is the future paid layer.

This principle becomes load-bearing for the secret strip later in the cycle.

## Triplet collapse on numerology (commit b03cd79)

Operator: "the numbers next to each other as well cleaner and if 777 apears it should be presented this way."

The three numerology numbers (life path, name number, soul urge) collapse onto one line as a reduced triplet. `formatNumbers` helper:
- All single-digit: concatenate (`777`, `369`, `123` — pattern recognition for triplets)
- Any master 11/22/33: space-separate (`3 11 3` never reads as `3113`)

Trail format (`39 → 3`) dropped from the surface. Sums still computed and exported for potential paid-layer surfacing.

`formatTrail` removed (dead code).

Surface goes 7 visual lines → 4 visual lines:
```
fire
libra
rat ⇌ rooster
3 11 3
```

(Element moved to top in commit `0e690c0`; centering applied in `e5c504f` and `5dbaa7e`.)

DOCTRINE §1 + 8BALL §1 + README line 5 updated for the triplet format. Symbols-only principle codified in DOCTRINE §1. Doctrine v0.7 → v0.8.

## Page centering (commit 5dbaa7e)

Stage flex container changes from `justify-content: flex-start` to `justify-content: center`. Card + result-controls center vertically on the page.

## SECRET STRIP — cards moved out of public repo + runtime (commit dde1799)

Operator: "ok we don't want to show the secret."

Two leak vectors that the symbols-only principle made unacceptable:

1. **Public GitHub repo.** `content/cards.v1.js` was 1645 lines of card interpretation sitting at a public URL. Any visitor could read all 144 cards.
2. **Deployed JS bundle.** `core/engine.js` imported `CARDS` from `cards.v1.js`, so every page-load downloaded the full 1645 lines. Any visitor with DevTools could read them in Sources.

Both closed in `dde1799`:

- **Repo side:** `git rm content/cards.v1.js`. Full content saved to `~/dev/8ball-private/cards.v1.full.js` (outside the repo, untracked, 67KB). `.gitignore` blocks `content/cards.v*.js` to prevent accidental re-add.
- **Runtime side:** `core/engine.js` refactored to compute the catalog index positionally — `(SUN_ORDER.indexOf(sun) × 12) + ANIMAL_ORDER.indexOf(animal) + 1`, then `toRoman()`. No `CARDS` import. `getCard` returns `{ name:'', type:'', habit:'', note:'', catalog }` — empty content fields preserve the API shape for forward compatibility with v0.3.0+ (paid layer will populate them from the private content).

Verified: libra·rat profile produces catalog `lxxiii` (matches what the previous CARDS-driven engine produced for the same profile). Positional math is identical to the catalog ordering in `cards.v1.full.js`.

Tests:
- `tests/profile.test.js`: removed `CARDS` import + `allPoolEntries()` helper + the two content-rule describe blocks (banned-pattern + banned-voice-register scans). Those scans now run on the private side as part of the content-authoring pipeline. The `BANNED_PATTERNS` and `BANNED_VOICE_REGISTER` tables remain in profile.test.js as the canonical policy reference.
- `tests/profile.test.js`: 'engine — getCard' tests assert empty content fields + correct positional catalog
- `tests/fixtures.json`: stripped 23 `name` leaks from `expected` blocks (fixture metadata was leaking card names too)
- Test count: 130 → 102

Doctrine updates:
- §1 — public repo + runtime ships catalog only; card content is private at `~/dev/8ball-private/`
- §2 — banned-voice-register scan moved to private side; Google Fonts CSS exception removed (we use system fonts only — was a stale mention from earlier doctrine)
- Footer: content version `v1` → `v0.2.0-public (catalog-only)`; doctrine v0.8 → v0.9

8BALL §1 + §2 + §3 + §10 + README updated for the architecture change. Repo visibility (8BALL §3 row 1) flipped from "Public from day 1" to "Private as of v0.2.0".

**Operator action pending:** flip the GitHub repo to private at github.com/appleeatsapples-lang/8ball/settings → Danger Zone. Branch was never pushed, so the secret was never on the public internet — caught before any leak.

## State at end of in-flight (cont.)

- HEAD `dde1799`. Branch 28 commits ahead of `7b9b99f`, 36 ahead of `origin/main` (`3f80c5e`).
- Tests 102/102. Audit clean (22 files — was 23, `cards.v1.js` gone).
- Doctrine v0.9. Content version v0.2.0-public.
- Codex audit-3 pending at this HEAD.

## Open at end of in-flight (cont.)

- Codex audit-3 brief at `dde1799`
- After clean audit-3: operator flips repo private; chat pushes branch; squash-merge to main as v0.2.0
- Netlify auto-deploy
- Update §10 SHIPPED entry with real merge SHA
- Production live-fire on `https://the-eight-ball.netlify.app`
- TikTok launch

Phase-2H forget-link discoverability still queued (partly addressed by try-another CTA at `a351c46`). Open Graph tags + favicon for shareable link previews queued. Future paid layer (v0.3.0+) will surface `~/dev/8ball-private/cards.v1.full.js` content via reveal interaction; the engine API shape (returns empty content fields in v0.2.0) is forward-compatible.

=====
2026-05-09 · Phase-2F-3 in-flight — minimal-surface pivot + six-coordinate calc additions + audit polish
=====
In-flight notes captured during Phase-2F-3 on `phase-2f-1-card-engine`. Pre-merge artifact, deploy-preview-only territory until the post-polish Codex re-audit clears and operator approves push to main. v0.2.0 release entry is post-merge by chat orchestrator.
## Phase-2F-2 audit dispositions (commits 827b87b, 77c1812, cc9a052)
Codex audit at `67c8abf` returned 1 FAIL + 2 CONCERNs. All three disposed before the 2F-3 work began:
- **FAIL §4 medical-vocab.** Codex flagged 4 cards; chat orchestrator caught a 5th in shipped 2F-1 Aries content at `aries.rabbit.note.mid` (everyday-English usage flagged on adversarial review). All 5 cut in `827b87b` per §4 Safety-patch carve-out. Cells touched: `aries.rabbit.note.mid`, `scorpio.snake.name`, `scorpio.snake.note.low`, `scorpio.rooster.name`, `aquarius.monkey.note.high`. Before/after strings preserved with the private deck at `~/dev/8ball-private/`; doctrine §4 forbids card-content strings in any tracked file as of v0.11 (audit-3 disposition).
  
  The Aries × 12 byte-identical fixtures property is now broken at the rabbit-note-mid cell. That property was load-bearing only for 2F-2 audit isolation, which has passed.
- **CONCERN rooster count.** Journal entry corrected from "5/11 (6/12 with Aries)" to "7/12" with explicit list (aries, gemini, virgo, libra, sagittarius, aquarius, pisces). Disposed in `77c1812`.
- **CONCERN stale 8BALL queue.** Lines 204 + 213 cleared. Doctrine v0.3 already shipped in 2F-2; queue references retired. Disposed in `cc9a052`.
## Phase-2F-3 minimal-surface pivot (commits 7a81665, 57b15d9)
Live-fire of `67c8abf` surfaced that the interpretive card-name layer read as gibberish to consumers without the underlying coordinates as antecedent. Original cards have no symbolic-recognition lineage in tarot/runes/I-Ching/etc.; they are interpretive language layered on top of the calibrated coordinates.
Decision: ship v0.2.0 with the calibrated coordinates as user-facing surface, card body preserved-but-not-rendered. `cards.v1.js` stays immutable per §4. Engine still resolves to find catalog index. Future v0.3.0+ may surface card body via reveal interaction.
What `7a81665` ships:
- DOM: removed card-name, two horizontal rules, three field-rows (type/habit/note); replaced with single `.coordinates` div. Catalog corner kept per operator decision.
- CSS: removed `.card .card-name`, `.card .rule`, `.field-row`, `.field-row .field-label`, `.field-row .field-value` (~39 lines); added `.card .coordinates` (~10 lines).
- JS: `formatCoordinates()` helper introduced; `renderCard()` renders coordinates unconditionally + catalog defensively.
- Copy: info modal "the trick" rewritten; `<meta description>` updated.
Live-fire iteration in `57b15d9`:
- Mid-cluster line-wrap on long sun signs (e.g. "sagittarius") created dangling-middot composition error.
- Operator picked vertical-column over horizontal-tuple. `formatCoordinates` joins with `\n`; `.coordinates` CSS bumps `line-height` to 1.5 and adds `white-space: pre-line`.
## Doc sync v0.4 round (commits 4b47d37, 4ceb263, 3c7183e)
`8BALL.md §1` + `§10`, `DOCTRINE.md §1`, `README.md` line 5 reframed for the four-coordinate minimal surface. Doctrine v0.3 → v0.4 (§1 substance reframe).
## Try-another CTA (commit a351c46)
Live-fire surfaced that the existing "forget this device" link is buried in the result-controls footer. For TikTok virality (try yours, try a friend's), users need an obvious path to enter a different profile without going through privacy-framed confirmation.
`a351c46` adds "try another" button below SHAKE AGAIN. Same action as forget-this-device underneath (clearProfile + showOnboarding) but skips the confirmation modal because the user's intent is explicit. The forget-this-device link survives in the footer for the privacy-framed reset path.
## Calc additions: chinese element + soul urge + unreduced sums (commit 304ecbf)
Operator decision mid-cycle: ship v0.2.0 with six calibrated coordinates instead of four. Reasoning: Chinese animal-without-element is incomplete tradition (canonical form is "fire rat" not just "rat"); adding a third numerology axis (soul urge) honors the inner-self/outer-expression distinction; showing unreduced sums (`39 → 3`) surfaces master numbers and lets users see the path to their final number.
`core/profile.js` adds five exports + one constant:
- `ELEMENTS = ['wood', 'fire', 'earth', 'metal', 'water']`
- `getChineseElement(year, m, d)`: 5-element 2-year cycle anchored at 1924 = wood. Shares CNY-cutoff (Feb 4) adjustment with `getAnimal`. Verified: 1924=wood, 1996=fire, 2020=metal, 2024=wood.
- `getLifePathSum(y, m, d)`, `getNameNumberSum(name)`: pre-reduction sums.
- `getSoulUrgeSum(name)`, `getSoulUrge(name)`: vowel-only Pythagorean sum (A=1, E=5, I=9, O=6, U=3; Y excluded), reduced with master 11/22/33 preserved.
`buildProfile` now returns: `name`, `firstName`, `sunSign`, `chineseElement`, `animal`, `lifePath`, `lifePathSum`, `nameNumber`, `nameNumberSum`, `soulUrge`, `soulUrgeSum`, `yyyy`, `mm`, `dd`. Existing keys unchanged — additions only.
Tests: 14 new unit tests covering each new function, master number preservation (`Aida` → 11, `Aria Stone` → 22), CNY-cutoff edge cases, and full `buildProfile` shape via synthetic profile (`Alex Thomas` + `1988-08-15`). Operator personal data deliberately scrubbed per DOCTRINE §11; first draft leaked, PII scan caught it, fixed before commit landed. Test count: 104 → 118.
## Six-line trail render (commit d362799)
`formatCoordinates` returns 6 lines via `formatTrail(unreduced, reduced)` helper:
- if `unreduced === reduced` → render reduced only (single digits, masters reached without reduction)
- else → render `unreduced → reduced` (e.g. `39 → 3`, `56 → 11`)
Surface order: date-derived first (sun, element, animal), then date-numerology (life path), then name-numerology (name number, soul urge).
Live-fire confirmed: full legal name surfaces master 11 on the nameNumber axis (sum 56 → 11). Operator's profile renders `libra / fire / rat / 39 → 3 / 56 → 11 / 21 → 3` cleanly.
## Doc sync v0.5 round (commits 0864beb, c14f720, 9b7bafd)
`8BALL.md §1` + `§10`, `DOCTRINE.md §1`, `README.md` line 5 expanded for the six-coordinate surface. Doctrine v0.4 → v0.5 (§1 substance expansion).
## Phase-2F-3 audit dispositions (commits 814b3f4, 55e8f07)
Codex re-audit at `9b7bafd` returned 1 FAIL + 3 CONCERNs.
- **FAIL copy mismatch.** index.html still described four coordinates in 3 places (meta description, info modal, implementation comment) while rendering six. The doc-sync v0.5 round updated 8BALL/DOCTRINE/README but missed the in-page surface. Fixed in `814b3f4`.
- **CONCERN focus handoff.** try-another flow lacked focus management. After clearProfile + showOnboarding, keyboard/screen-reader focus could remain on the now-hidden try-another button. Fixed in `814b3f4`: `showOnboarding()` now calls `nameInput.focus()`.
- **CONCERN calc-version contract ambiguity.** `core/profile.js` header + DOCTRINE §3 said "any change to profile.js requires fixture updates", but `304ecbf` added new exports + new buildProfile fields without fixture updates (covered by direct unit tests instead). Fixed in `55e8f07`: §3 formalizes additive-vs-breaking distinction. Calc v1 retroactively documents the v0.2.0 additive extensions. Doctrine v0.5 → v0.6.
- **CONCERN journal staleness.** This entry. Resolves the audit-trail gap.

## Open at end of 2F-3 cycle

- Codex re-audit on the post-polish HEAD (`55e8f07` or its successor)
- After clean re-audit: push + open PR + merge to main as v0.2.0
- Netlify auto-deploy
- Update `8BALL.md §10` SHIPPED entry with real merge SHA (currently `<post-merge sha>` placeholder)
- Production live-fire on `https://the-eight-ball.netlify.app`
- TikTok launch

Phase-2H forget-link discoverability still queued (partly addressed by try-another CTA at `a351c46`; full discoverability work deferred). Open Graph tags + favicon for shareable link previews queued. Grok N=132 cold-reading sniff at card-content level deferred until cards resurface in v0.3.0+.

=====
2026-05-09 · Phase-2F-2 in-flight — full 132-card deck integration
=====

In-flight notes captured during Phase-2F-2 integration on `phase-2f-1-card-engine`.
Pre-merge artifact, deploy-preview-only territory until Codex audit + Grok N=132
sniff + operator live-fire all clear. v0.2.0 release entry is post-merge by chat.

## What this commit ships

- 132 cards integrated into `content/cards.v1.js` (catalog xiii–cxliv across 11 sun rows × 12 animals). Combined with the 12 Aries cards from 2F-1, the full 144-card deck is now in place.
- `content/traits.v1.js` and `content/templates.v1.js` deleted. Engine never imported them post-2F-1; they survived only because the BANNED_VOICE_REGISTER and BANNED_PATTERNS scans walked them. Now they leave entirely.
- `tests/profile.test.js` `allPoolEntries()` walks only `CARDS` now. Imports for `traits.v1.js` and `templates.v1.js` removed. `MissingCardError` test block dropped — all 144 cards present, no profile triggers the throw path. The export survives in `core/engine.js` as defensive code for future authoring gaps.
- `tests/fixtures.json` — `missing_card` array dropped. 11 representative non-aries fixtures added (one per sun row), positive-case asserting `(sunSign, animal, catalog, bracket, name)`. The 12 Aries fixtures stay for regression coverage. Synthetic DOBs, DOCTRINE §11 sub-rule preserved.
- `8BALL.md` §1 (deck-card framing), §2 (architecture row → `cards.v1.js` only), §3 row 9 (content version), §10 (v0.2.0 SHIPPED skeleton, doctrine v0.3 reference), §11 (Phase-2F resolved, live-fire codified) updated.
- `README.md` line 5 (deck-card framing) + structure block (cards.v1.js only) updated.
- `DOCTRINE.md` §8 ritual-gate amendment: new step 9 codifies live-fire on local deploy preview as load-bearing for releases touching `index.html`, `core/engine.js`, or content batches. Existing "confirm Netlify auto-deployed" renumbered 9 → 10. Content-version footer updated. Doctrine version v0.2 → v0.3.

## Content-side notes from prescan resolution

- 1 line orchestrator-refined at `virgo.dragon.note.low`: ChatGPT's 7-word original replaced with 13-word variant for adversarial-review comfort. Both versions preserved with the private deck at `~/dev/8ball-private/`; doctrine §4 forbids card-content strings in any tracked file as of v0.11 (audit-3 disposition).
- Curly apostrophe in `sagittarius.rooster.habit` (U+2019) normalized to U+0027 globally during integration. `grep -P '\x{2019}' content/cards.v1.js` returns zero hits.
- "corrects" verb appears in 7/12 Rooster habits (aries, gemini, virgo, libra, sagittarius, aquarius, pisces). Deferred to Grok cold-reading sniff at N=132 — same lane that ruled "studies X as Y" load-bearing texture for note.high in 2F-1. Initial in-flight count understated this as 6/12; Codex audit at 67c8abf caught the miscount and corrected here.
- ChatGPT-delivered drafts used double-quoted JS strings; integration normalized to single-quoted to match the Aries-row file style. Only literal apostrophe (`everyone\'s`) is backslash-escaped.

## DOB calibration

Brief §2.C fixture table proposed synthetic DOBs that did not produce the listed `(sun, animal, LP)` tuples in 9 of 12 cases. Per §7.2, CC mentally ran each DOB against `core/profile.js` and corrected before committing. Final DOBs: `2020-05-01` (Taurus Rat LP=1), `2022-05-27` (Gemini Tiger LP=2), `1989-07-08` (Cancer Snake LP=6), `1988-08-15` (Leo Dragon LP=4), `1988-09-14` (Virgo Dragon LP=4), `1993-10-12` (Libra Rooster LP=8), `1989-11-15` (Scorpio Snake LP=8), `1989-12-12` (Sagittarius Snake LP=33 — already correct), `1994-12-24` (Capricorn Dog LP=5), `1990-02-04` (Aquarius Horse LP=7 — already correct), `1995-03-04` (Pisces Pig LP=4), `2002-04-04` (Aries Horse LP=3 — already correct). All synthetic per DOCTRINE §11.

## Audit cycle queued

- Codex audit at delivered HEAD: dual-baseline against `4aaf2d3` (cleanest baseline, v0.1.4 SHIPPED) and `7b9b99f` (immediate prior, end of 2F-1). L13 / L18 bind.
- Grok cold-reading sniff at N=132 (mirror 2F-1 pilot brief shape, scaled).
- Operator live-fire on local deploy preview — verify Aries row still works post-integration; spot-check 5–10 non-Aries DOBs across all 11 new rows. Now codified as §8 step 9 (doctrine v0.3).
- Main-merge as v0.2.0 once all four (Codex / Grok / live-fire / operator approval) clear. Release entry written post-merge, not preemptively.

## Test count delta

95 (at `7b9b99f`, end of 2F-1) → **104** (at delivered HEAD): +9 from the 11 new positive-case card fixtures (each fires multiple assertions per card) minus the 2 retired `MissingCardError` tests.

=====
End of 2026-05-09 · Phase-2F-2 in-flight notes.
=====

=====
2026-05-09 · Phase-2F-1 in-flight — card engine + Aries sample row
=====

In-flight notes captured during the Phase-2F-1 branch (`phase-2f-1-card-engine`, branched off `4aaf2d3`). Pre-merge artifact, deploy-preview-only territory; the branch does NOT merge to main until Phase-2F-2 lands the remaining 132 cards. Chat authors the full release entry at end-of-2F-2.

## What this branch ships

- **Engine flip — `core/engine.js` rewritten.** Roast generation pipeline retired (template-fill, trait-pick, question classifier, soft-cap re-roll, recent-buffer dedup). Replaced with deterministic card lookup: `getCard(profile)` → `{ name, type, habit, note, catalog }`. Plus `resolveBracket(lifePath)` (low / mid / high) and `MissingCardError` for non-Aries profiles in 2F-1.
- **Content schema — `content/cards.v1.js` added.** 12 Aries × animal cards (catalog `i`–`xii`). Each card carries `name`, `type`, `habit`, `note.{low,mid,high}`, `catalog`. Voice register is declarative-observational; pre-scan against `BANNED_VOICE_REGISTER`, banned-pattern slurs, and §4 medical/diagnostic words came back clean.
- **UI rewrite — `index.html` re-aestheticed.** Hex window + gold/blue palette retired; specimen aesthetic landed (cream paper on dark page, mono type, hairline borders, label-field grammar). Components: top bar with wordmark + info icon, welcome registry form, card-back shake state with big "8" + "ball", result variant B with name/type/habit/note label fields and catalog corner, custom forget-me modal (replacing native `window.confirm()`), about modal triggered from the info icon. CSS tokens flipped: `--gold-*` and `--blue-*` retired; `--paper`, `--ink`, `--rule`, `--label`, `--page-bg` added. Single-file rule preserved (684 lines, well under 1500).
- **Tests rewritten — `tests/profile.test.js` + `tests/fixtures.json`.** Engine block flipped from `generateAnswer` sample-and-soft-cap pattern to card-system assertions: 12 fixtures covering all three LP brackets (low/mid/high, master numbers 11/22 represented), 12 direct `resolveBracket` cases, 2 `MissingCardError` cases (Sagittarius Snake LP=33 — TODO 2F-2 — and Taurus Rat). Banned-pattern slur scan rewritten to walk pools directly (was sampling generated answers; with no `generateAnswer` it had to flip). Both content scans now walk `traits.v1.js`, `templates.v1.js`, AND `cards.v1.js` automatically through the same `allPoolEntries` generator.
- **Doctrine content-version note bumped.** "v1 (~115 sun + ~85 animal + ~70 LP traits · 39 templates)" → "v1 (cards.v1.js — 12 cards in 2F-1; full 144 in 2F-2)".
- **Files retired-in-place (not deleted):** `content/traits.v1.js` and `content/templates.v1.js`. Engine no longer imports either. They stay in repo for two reasons: the BANNED_VOICE_REGISTER and banned-pattern scans still scan them (immutable shipped content) and Phase-2F-2 finalizes the deletion alongside the full 144-card content land.
- **Calc core untouched.** `core/profile.js` and the calculation contract fixtures are byte-identical to `4aaf2d3` per DOCTRINE §3.

## §1 status

§1 FAIL closes once this branch merges (post-2F-2). Doctrine says "fixed designed deck"; the engine now returns a card from a deck. The 132 remaining cards are content authoring, not engine work.

## Open items / 2F-2 prep

1. Card content for Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces × 12 animals each (132 cards).
2. Convert the LP=33 / Sagittarius Snake `MissingCardError` fixture (`1989-12-12`) to a positive-case assertion when its card lands.
3. Final delete of `content/traits.v1.js` and `content/templates.v1.js`. Update `8BALL.md §2` architecture row to remove their mention.
4. `8BALL.md §3` row 9 (content version) updates from "trait pools" to cards-shaped at the 2F-2 ship.

## Content swap (post-`db0b510`)

Card content and modal copy in `db0b510` came from an earlier ChatGPT batch. The Phase-2F-1 brief delivered to CC at `db0b510 + 1` carries a refined ChatGPT batch (pre-scan artifact `~/Desktop/8ball/audits/prescan_chatgpt_2F1_2026-05-09.md`: 0 coded hits; one cell at `aries.rabbit.note.mid` reviewed as everyday-English usage and kept — later cut in 2F-2 per Codex finding, see entry above). CC swap:

- `content/cards.v1.js` — 12 Aries cards replaced verbatim per brief §2.B. New name strings preserved with the private deck at `~/dev/8ball-private/`; doctrine §4 forbids card-content strings in any tracked file as of v0.11 (audit-3 disposition).
- `index.html` modal copy replaced verbatim per brief §2.C. About: title `the trick`, body single-paragraph, close button `got it`. Forget-me: title `erase the paperwork`, body single-paragraph, buttons `leave it` / `erase it`. Native `×` close icon retired in favor of bottom-aligned `got it` button on the about modal; dead `.modal .close` CSS removed.
- `tests/fixtures.json` — 12 `cards` fixtures' `expected.name` strings updated to match the new batch. DOBs, catalogs, brackets unchanged.
- Schema, scans, line counts: unchanged-in-shape. All 95 tests green; local PII audit clean (25 files); `index.html` now 669 lines.

## Flip-state fix (post-`c1d281b`)

Live-fire of HEAD `c1d281b` against local `python3 -m http.server` surfaced a UX bug invisible to static audit: form-submit landed on the result face for ~300ms then auto-flipped to the 8-ball card-back, leaving the user stranded on shake-state. Same inversion in `shakeAgain` — pressing the button took the user from result back to 8-ball as final state instead of theatrical-flip-then-result. User never got to read the card.

Root cause: `.flip-inner.face-up { transform: rotateY(180deg); }` combined with `.flip-side.back { transform: rotateY(180deg); }` (preserve-3d) means the `face-up` class actually shows the 8-ball back-side, not the result front-side. The class is misnamed; the four `add`/`remove` calls in `showResult` and `shakeAgain` were inverted to compensate, in the wrong direction. The intent comment ("Land on the back side first; card-back shows for ~300ms before flip") was correct.

Fix: 4-line swap in `index.html` — invert `add` ↔ `remove` in both `showResult` (lines 574, 577) and `shakeAgain` (lines 594, 597). Class name unchanged; swap is sufficient. 95/95 tests pass; local audit clean (25 files); `index.html` still 669 lines.

This is the kind of bug Codex's static-code audit would not catch by design — audit reads code semantics, doesn't simulate DOM/CSS runtime. Live-fire is the gate the handoff anticipated before the Grok cold-reading pilot. Re-audit cycle at new HEAD before re-declaring 2F-1 cleared.

## Grok pilot result (post-`4c2e890`)

First Grok pass on the 12 Aries cards as a cold-reading / Barnum-effect sniff (lane pilot). Brief: `~/Desktop/8ball/audits/grok_brief_2F1_cold_reading_sniff.md`. Audit return: `~/Desktop/8ball/audits/grok_audit_2F1_cold_reading_sniff.md`.

Verdict: **STRONG SIGNAL.** All 12 cards classified SPECIFIC; zero BORDERLINE, GENERIC, or DRIFTING. Bracket discipline (`note.{low, mid, high}`) holds uniformly across the row. Cross-deck pattern findings: differentiation is clean (12 distinct archetypes, low cluster risk); recurring fingerprints are load-bearing texture, not Barnum echo (every habit is a single vivid verb-phrase, `note.low` opens with motion verbs, `note.mid` uses "turns... into..." / "builds...", `note.high` uses "studies X as Y"); LP-bracket discipline escalates consistently (low = raw impulse, mid = leverage-building, high = analytical / meta). Recommended-cuts list: empty.

Two production flags carried forward to 2F-2:

1. **Near-collision (Dragon ↔ Rooster):** two cards in the row (positions `v` and `x`) both occupy commanding-room-presence space — one theatrical/commanding, one polished/critical. Splits cleanly in this row, but a flag for 2F-2 — when scaling to 132 more cards, watch for similar authority-cluster collisions in other sun rows (Leo × Dragon, Capricorn × Rooster, etc.).

2. **`note.high` "studies X as Y" pattern:** the construction is load-bearing in this row but should be lightly varied across the full 144-card deck. Not a cut on the 12 Aries cards (the pattern is working); a 2F-2 ChatGPT-brief constraint to avoid uniform application across all 132 remaining cards.

**Operator decision:** Grok lane scales to 2F-2 standing audit cycle. The cycle for 2F-2 becomes: ChatGPT (content authoring) → orchestrator pre-scan → CC integration → Codex (adversarial doctrine/content audit) → Grok (cold-reading sniff at N=132) → live-fire on deploy preview → main-merge.

This sub-entry closes 2F-1 in-flight. Branch is cleared for 2F-2 brief authoring. The v0.2.0 release entry is post-2F-2-merge.

=====
End of 2026-05-09 · Phase-2F-1 in-flight notes.
=====

=====
2026-05-08 · v0.1.4 — Phase-2D · CONCERN dispositions shipped
=====

## What shipped

- **PR #3 squash-merged** as `4aaf2d3` on main. Eight feature-branch commits collapsed into one squash-merge plus this journal-entry follow-up. Live at `https://the-eight-ball.netlify.app/` with HTTP 200, `age: 0` (fresh deploy), `<title>8 ball</title>` confirmed within ~60 sec of merge.
- **Seven CONCERN dispositions landed** per the post-Phase-2B audit's open queue. Net verdict shift: 5 PASS / 7 CONCERN / 1 FAIL → **9 PASS / 3 CONCERN / 1 FAIL**.
- **§2 — enforce + amend.** New `BANNED_VOICE_REGISTER` constant + scan in `tests/profile.test.js` (23 terms, 23 cases). Word-boundary calibration (`\b<term>` start-anchored, case-insensitive). DOCTRINE.md §2 substance split into "Currently enforced (CI gates)" and "Review-discipline (no current code surface to scan)" sections. Pre-scan flagged 3 lines in `content/traits.v1.js`: 1 true positive cut (`lp33` "tired in a way that sounds spiritual"), 2 false positives surfaced for operator review and restored after calibration (`taurus`/`libra` "restaurant" lines — `aura` was substring-matching inside `restaurant`). Net pool changes vs pre-Phase-2D: `lp33` 6→5; `taurus`/`libra` unchanged.
- **§3 — enforce.** New fixture in `tests/fixtures.json`: `1989-12-12` → Sagittarius / Snake / LP=33 / nameNumber=1. Synthetic per §11. Sole coverage point for the master-number-33 preservation path in `core/profile.js`.
- **§5 — enforce.** New `tests/privacy_scan.test.js` (159 lines, 10 cases). Scans `core/`, `content/`, `index.html` for forbidden API surfaces (`sessionStorage`, `indexedDB`, `fetch(`, `XMLHttpRequest`, `navigator.sendBeacon`, `gtag(`, `dataLayer`, `analytics.`) and enforces a `localStorage.setItem` allow-list of `['eight_ball_profile_v1']` (the actual STORAGE_KEY).
- **§8 — enforce + amend.** New CI stage in `.github/workflows/ci.yml`: PRs touching `DOCTRINE.md` or `content/*.js` must also touch `journal.md`. `actions/checkout` bumped to `fetch-depth: 0` so the diff is computable. Doctrine §8 substance split into "Automated gates (CI, blocking)" (CI 5-stage + journal-touch) and "Ritual gates (operator/reviewer responsibility)" (PR title, local audit, diff review, cross-model audit, merge, journal append, live verify). The new gate fired live on this PR's own diff and passed.
- **§10 — enforce.** New `.github/pull_request_template.md` with lane-tag fields (Lane of author, Doctrine change → Codex audit checkbox, Content change → ChatGPT review checkbox, ≥3 files / `core/` → CC-authored check). Behavioral nudge by design; the §8 journal-touch gate is the hard CI surface for doctrine changes.
- **§12 — enforce.** New `tests/dependency_discipline.test.js` (3 assertions): (1) `package.json.dependencies` empty/absent, (2) `package.json.scripts.build` absent, (3) `package.json.devDependencies.length ≤ 5`. Locks the no-build-step contract structurally.
- **§13 — amend + defer.** Doctrine §13 paragraph appended clarifying the Friday rule-kill firing condition: first review = first Friday after the doctrine has aged 7 days. Immutability hash check on `content/traits.v1.js` and `content/templates.v1.js` explicitly deferred to post-Phase-2F (those files retire when `cards.v1.js` ships).
- **Polish pass on top.** §8 textual defect ("PR opened" listed under Automated gates without CI enforcement) moved to Ritual gates with parenthetical. `8BALL.md §7` (Content rules summary) synced to post-Phase-2B §4 substance. `8BALL.md §8` (Workflow) split into Automated/Ritual matching DOCTRINE.md.
- **Tests:** 32 → 69 green at `4aaf2d3`. Local audit clean (24 files scanned).

## Cross-model audit

Three-audit Phase-2D sequence completed:

- Audit 1 at `c99a641` — **8 PASS / 4 CONCERN / 1 FAIL**. §2/§3/§5 RESOLVED CONCERN→PASS. §8/§10/§12/§13 remained CONCERN with improvement noted; §1 unchanged FAIL (Phase-2F-bound). Codex flagged a §8 textual defect (PR-opened-as-automated-gate, drift mode rule-says-X-but-code-does-Y) and noted `8BALL.md §7/§8` summaries were stale relative to post-Phase-2B doctrine.
- Audit 2 at `0073189` — **9 PASS / 3 CONCERN / 1 FAIL**. Polish pass cleared §8 CONCERN→PASS and dissolved the stale-summary cross-rule finding. Zero regressions vs `c99a641`. Merge-gate cleared.

Cleanest baseline regression check: from pre-Phase-2D `32c8995` (5/7/1) through `c99a641` (8/4/1) to merge HEAD `0073189` (9/3/1) — zero regressions across the chain.

The 3 residual CONCERNs at merge are calibrated dispositions, not drift:
- §10 — PR template is behavioral nudge by design; CI lane-validation deferred to first multi-author PR friction.
- §12 — three structural assertions don't fully cover the literal §12 list (email capture, sharing UI, horoscope copy); static enforcement of the full list is brittle, review-discipline is the realistic ceiling.
- §13 — immutability hash explicitly deferred to post-Phase-2F (those files are retired by 2F's content-layer flip).

## Lessons

**L19 — Spec-locked rules need execution-time calibration.** The §2 banned-word list was operator-locked at brief-author time; the scanner spec was locked at brief-author time too. CC's pre-scan surfaced two false positives where `aura` substring-matched inside `restaurant` — a collision invisible at spec-time. The right discipline: CC pre-scans, surfaces all flags, operator-decides per-line. Calibration becomes an at-execution-time decision, not a spec-time prediction. Future enforcement-pattern briefs should explicitly tag flagged content as "operator-decision required" rather than "auto-cut."

**L20 — Polish-before-merge has a high ratio when the residuals are textual.** Path B (polish + re-audit + merge) cost ~15 min and improved verdict 8/4/1 → 9/3/1, dissolving 1 CONCERN and 1 cross-rule finding. The signal: if the audit-flagged residuals are textual / state-summary alignment, polish; if structural (test surface, doctrine substance), accept-and-defer. The §8 wording fix and `8BALL.md` sync were textual; the §10/§12/§13 residuals were structural — the path correctly polished the former and deferred the latter.

**L5 confirmation in fresh evidence.** The chat orchestrator authored the §8 doctrine substance with "PR opened with a one-line summary" listed under Automated gates — a defect chat could not have caught alone. Codex caught it in the first audit cycle; the polish pass closed it. The dual-author pattern (chat drafts + Codex audits) found a flaw the chat could not have surfaced introspectively. L5 ("solo authority IS the failure mode") fired again, in a different shape, and was caught at the structural enforcement point.

## Open items / next session queue

1. ~~Phase-2A v0.1.2 patch~~ ✅ shipped at `f52345f`.
2. ~~Phase-2B doctrine consolidation~~ ✅ shipped at `708735d`.
3. ~~Phase-2D CONCERN dispositions~~ ✅ shipped at `4aaf2d3` (this entry).
4. **Phase-2C — §7 deploy-gate wiring.** Doctrine-correct ("not gated, acknowledged"); flip when traction warrants. One Netlify console toggle + GitHub required-check. Could fold a doctrine-version bump (currently still at v0.2 despite Phase-2B/2D substance edits) into this work.
5. **Phase-2E — card system design.** Aesthetic concentration. Locked constraint: monochrome / grayscale, no color hues. Open question: strict two-tone vs grayscale-permitted (default grayscale-permitted). Captured at `~/Desktop/8ball/sessions/phase_2e_aesthetic_constraints.md`.
6. **Phase-2F — card system implementation.** Engine + UI rewrite, content layer pivot. Retires `content/traits.v1.js` and `content/templates.v1.js`. Adds `content/cards.v1.js` + `assets/cards/`. Closes the §1 FAIL. Closes the live-observed hex-overflow defect (operator's screenshots in this session showed long roast outputs still clipping the hexagon despite the v0.1.1 soft-cap fix). CC lane.
7. **Housekeeping: shadow Netlify project.** `enchanting-bonbon-2b5064` still connected to the repo; `the-eight-ball` is canonical. One-click delete in Netlify dashboard.
8. **Housekeeping: branch cleanup.** `v0.1.4-phase2d-concern-dispositions` should be deleted from origin and local post-merge. CC has a pinned task for the local side.
9. **Housekeeping: `audits/RELEASE_CHECKLIST.md` staleness.** Codex flagged in cross-rule finding 2 of the post-polish audit — file says it's pulled "directly from §8" but is more abbreviated. Sync in next housekeeping pass.
10. **Housekeeping: doctrine-version bump.** DOCTRINE.md still says `v0.2` despite Phase-2B/2D substance edits. Bump to `v0.3` next housekeeping cycle, or fold into Phase-2C.

=====
End of 2026-05-08 · v0.1.4 entry.
=====

=====
2026-05-08 · v0.1.3 — Phase-2B doctrine consolidation shipped
=====

## What shipped

- **PR #2 squash-merged** as `708735d` on main. Three feature-branch HEADs collapsed into one commit (`b74ef70` Phase-2B substance + `875596b` corrective + `32c8995` corrective #2). Live at `https://the-eight-ball.netlify.app/` with HTTP 200 and `<title>8 ball</title>` confirmed.
- **§1, §2, §9 substance rewritten.** §1 reframed from surface-narration ("interior never named") to positive-shape product description (deck product tied to name+DOB; cards openly reference symbol systems). §2 second bullet drops "no mention of zodiac/numerology/astrology" sub-clause. §9 narrowed to SIRR-boundary code corollary, heading renamed "The SIRR boundary," wording amended to cite `DOCTRINE_ALLOW` allow-list as the actual enforcement.
- **§4 restructured for post-pivot content.** New bullets: no medical/diagnostic framing, cultural-symbol respect, universal floor. "Versioned, not edited" generalized from "trait pools and templates" to "shipped content batches." Heuristic line generalized to format-agnostic "if a line lands but you can't tell..." Voice-register bullet was authored, audited as cards-vs-existing-pool FAIL, then surgically removed in corrective #2 (Phase-2F will restore it with the cards-specific register decided at design time).
- **§4 carve-out cuts.** Six lines cut from existing pool: `templates.v1.js` lost "the chart agrees" / "the universe says" (§2 mystical) and "today diagnosis" / "symptoms detected" (§4 diagnostic); `traits.v1.js` lp11 lost "a mystic with anxiety" / "astral-projecting to avoid eye contact" (§2 mystical). `TEMPLATES_NO_QUESTION` 18→15, `TEMPLATES_MAYBE` 8→7, `lp11` 6→4. No replacements; Phase-2F authors the new content layer.
- **`audits/run_local_audit.sh` POSIX fix.** `mapfile` (bash 4+) replaced with `while IFS= read -r ... done` loop. Verified clean exit 0 under macOS bash 3.2.57. §8 and §11 enforcement surfaces now actually fire.
- **Inbound cleanup.** `README.md:5` trailing "(see DOCTRINE.md §9)" stripped; `8BALL.md:33` trailing "depth is the trick; the trick is hidden by design" stripped; `tests/pii_scan.test.js:69` comment updated to "SIRR boundary rule."
- **Tests:** 32/32 green at `708735d`. Local audit clean (21 files scanned).

## Cross-model audit

Five-audit Phase-2 sequence completed:

- Audit 1 at `2876385` — 1 PASS / 6 CONCERN / 6 FAIL (baseline; doctrine confirmed aspirational).
- Audit 2 at `3e6d71a` — 4 PASS / 6 CONCERN / 3 FAIL (Phase-2A patch; §4/§7/§11 closed).
- Audit 3 at `b74ef70` — 2 PASS / 5 CONCERN / 6 FAIL (Phase-2B substance; three regressions: §4/§8/§11. Doctrine ahead of code surfaced.)
- Audit 4 at `875596b` — 4 PASS / 7 CONCERN / 2 FAIL (corrective; §2/§8/§9/§11 closed; §4 still FAIL on cards-vs-existing-pool tension).
- Audit 5 at `32c8995` — **5 PASS / 7 CONCERN / 1 FAIL** (corrective #2; §4 closed via voice-register-bullet drop; merge gate cleared).

Cleanest baseline regression check vs `3e6d71a`: §2 IMPROVED, §9 IMPROVED, all others UNCHANGED. The remaining FAIL is §1 (doctrine says deck, engine ships roast) — known-tradeoff bound to Phase-2F. Closure condition: 2F engine flip.

## Lessons

**L16 — Doctrine ahead of code is the inverse failure of aspirational doctrine; both produce the same audit verdict.** L10 named "aspirational doctrine — rules whose enforcement doesn't exist" as the most expensive doctrinal debt. Phase-2B initially produced its mirror image: rules whose code-implementation doesn't exist *yet*. The verdict shape is identical (rule-says-X-but-code-does-Y), but the disposition differs: aspirational drift has no firing condition; doctrine-bound-to-queued-phase does. The §1 FAIL is the latter — bound to Phase-2F's engine flip. The §4 voice-register FAIL initially looked like the former and was surgically removed; what survived is the constraint-shaped substance that applies to any content layer.

**L17 — §-numbering preservation under substance rewrite is a doctrine virtue, not laziness.** The Phase-2B brief decision to keep §1/§2/§9 numbers and replace substance saved ~6 cross-reference edits across `8BALL.md`, internal `DOCTRINE.md` references, and `tests/pii_scan.test.js`. Numbering stability lets people hold §-numbers in muscle memory across sessions; substance is editable, numbers shouldn't be unless retiring entirely.

**L18 — Audit-binds-to-HEAD with dual-baseline delta lines is the structural fix for multi-cycle work.** Five audits in series, each binding to a specific HEAD, with verdicts compared both to the immediate prior (`b74ef70` was a regressed state) AND to the cleanest baseline (`3e6d71a`). The merge gate ("zero regressions vs cleanest baseline") gives a stable reference point even when the immediate-prior state is regressed. Without dual-baseline tracking, the b74ef70 → 875596b transition would have looked like "improvement" because b74ef70 was so bad — but vs `3e6d71a` it had a fresh §4 regression that needed closing. The discipline correctly identified and required closing the regression before merge.

## Open items / next session queue

1. ~~Phase-2A v0.1.2 patch~~ ✅ shipped at `f52345f`.
2. ~~Phase-2B doctrine consolidation~~ ✅ shipped at `708735d` (this entry).
3. **Phase-2C — §7 deploy-gate wiring.** Currently doctrine-correct ("not gated, acknowledged"); flip to actually-gated when traction warrants. One Netlify console toggle + GitHub required-check.
4. **Phase-2D — CONCERN dispositions** for §3 (no 33 fixture), §5 (no static gate against new storage/fetch), §8 (release ritual operator-only), §10 (lanes procedural not enforced), §12 (out-of-scope partial enforcement), §13 (Friday rule-kill not yet fired). Each gets enforcement-added or rule-amended-to-match-reality or rule-killed.
5. **Phase-2E — card system design.** Aesthetic concentration. Locked constraint: monochrome / grayscale, no color hues. Open question: strict two-tone vs grayscale-permitted (default grayscale-permitted). Captured at `~/Desktop/8ball/sessions/phase_2e_aesthetic_constraints.md`.
6. **Phase-2F — card system implementation.** Engine + UI rewrite, content layer pivot. Retires `content/traits.v1.js` and `content/templates.v1.js`. Adds `content/cards.v1.js` + `assets/cards/`. Closes the §1 FAIL. CC lane.
7. **Cleanup: shadow Netlify project.** Two Netlify deploys connected to the repo (`the-eight-ball` ✓ canonical; `enchanting-bonbon-2b5064` ✗ shadow). 8BALL.md §2 says one. One-click delete in Netlify dashboard. Add to 2D dispositions.
8. ~~Bash-3.2 fix for `audits/run_local_audit.sh`~~ ✅ shipped this PR (`875596b`).
9. **Live-fire testing on the post-corrective pool.** Optional — likely retired by 2F's content-layer flip. Worth one round if the operator wants to see what survived the cuts.
10. **Branch cleanup.** `v0.1.3-phase2b-doctrine-consolidation` still on origin and local. Decision deferred to operator: keep as audit-trail or `git push origin --delete` (audits already preserve the three HEADs, so deletion is safe).

=====
End of 2026-05-08 · v0.1.3 entry.
=====

=====
2026-05-08 · v0.1.2 — §4/§7/§11 patch shipped
=====

## What shipped

- **PR #1 squash-merged** as `f52345f`. Single commit on `main` collapsing the prior agentic-tooling change (`58e5ffa`, never pushed to origin/main as a separate commit) with the Phase-2A patch (`3e6d71a`). Live at `https://the-eight-ball.netlify.app/` within ~70 seconds of merge per Netlify's `cache-status: fwd=miss` + `age: 0` on first post-merge fetch.
- **§4 — two violating trait lines cut** from `content/traits.v1.js`: a Sagittarius line invoking sexual-assault framing and an Ox line invoking mental-health-diagnostic framing. Both failed §4's literal "if you can't tell, it crosses" test; both lived in production between v0.1.0 and v0.1.2.
- **§4 safety-patch carve-out added.** Locked-decision #9 (immutable v1 pools) protects against silent flavor drift, NOT against doctrine-rule violations caught post-ship. Codex loophole-check confirmed the carve-out wording does not admit taste-cuts ("constrained to actual §4 violations and requires journal/diff doctrine notes").
- **§7 reality alignment.** Doctrine previously claimed CI gates the deploy; in fact Netlify auto-deploys on push to `main` while CI runs in parallel. §7 now describes that gap explicitly and queues required-check wiring for the first-traction milestone.
- **§11 PII regex tightened** from `[^a-z]{0,40}` to `.{0,40}` — JSON-shaped occurrences (label + alphabetic text + `YYYY-MM-DD`) now caught.
- **§11 narrower allow-list** (`LABELED_DOB_ALLOW`) for the labeled-DOB rule specifically: excludes `journal.md`, `8BALL.md`, `README.md`. Doctrine docs can NAME the leak class without REPRODUCING example shapes.
- **Journal v0.1.0 entry sanitized.** Bullet describing the labeled-DOB leak rewritten to describe the leak class without reproducing the label string or the date. Sanitization note added at the top of the v0.1.0 entry.
- **`audits/LOCAL_PII_AUDIT.md` placeholder-ized.** Illustrative DOB block now uses bracketed placeholders matching the convention already used for names and identifiers in the same block.
- **Test DOBs shifted.** `tests/profile.test.js` engine and banned-pattern tests now use `2000-01-01`. Codex confirmed `2000-01-01` produces a valid synthetic profile (Capricorn, Rabbit, LP4) and the changed tests still exercise their original engine/content code paths.
- **Tests:** 32/32 green at HEAD `3e6d71a` (pre-merge); same at `f52345f` post-merge.

## Cross-model audit

Codex re-audit of HEAD `3e6d71a` returned **4 PASS / 6 CONCERN / 3 FAIL**, deltas from prior `2876385` audit:

- §4 FAIL → PASS (RESOLVED)
- §7 FAIL → PASS (RESOLVED)
- §11 FAIL → PASS (RESOLVED)
- §1, §2, §9 FAILs unchanged (intentionally untouched in 2A; retiring in Phase-2B via product pivot)
- All CONCERNs unchanged
- Zero regressions

Full re-audit at `~/Desktop/8ball/audits/codex_reaudit_2A_2026-05-08.md`. Brief that produced it pinned to HEAD `3e6d71a` per the audits-bind-to-a-specific-HEAD principle locked at start of session.

## Lessons

**L13 — Audits bind to a specific HEAD.** The Codex audit at `2876385` remained valid for `58e5ffa` because `58e5ffa` didn't touch any audited path. The next HEAD (`3e6d71a`) DID, so a re-audit was structurally required. Verifying the equivalence (or non-equivalence) is a 2-second `git diff --stat` that protects against weeks of drift. Treat this as a default discipline before reusing any audit verdict past its pin.

**L14 — Office work is a real failure mode and the orchestrator is the right place to absorb it.** Three new operator-side defaults landed this session: (a) auto-pbcopy briefs to clipboard, (b) Claude saves tool outputs to disk while the operator only pastes content into chat, (c) Claude reformulates terse/typo'd operator directives into self-briefs before acting. Each one removed a friction point that previously generated drift. The principle generalizes: any procedural step the orchestrator can do via tools, the orchestrator should do.

**L15 — The two-audit cycle works exactly as designed.** First audit at `2876385` returned 6 FAILs, exposing aspirational doctrine. Patch authored, second audit at `3e6d71a` returned 3 FAILs, all in the cluster intentionally retired in the next phase. The structure correctly distinguished "tighten what fails" from "retire what doesn't fit," and gave a structural diff (verdicts changed vs. unchanged) as the merge gate, not operator vibes.

## Open items / next session queue

1. **Phase-2B** — doctrine consolidation. Retire §1/§2/§9 (the surface-narration cluster being dissolved by the roast→deck product pivot). Rewrite §4 for card content (no medical/diagnostic framing; cultural-symbol respect if cards draw from any tradition). Revisit §10's "v1 immutable" rule under format pivot. Codex re-audit before merge. Target: 9+ PASS, FAIL ≤ 1.
2. **Phase-2C** — §7 deploy-gate wiring. Currently doctrine-correct ("not gated, acknowledged"); flip to actually-gated when traction warrants. One Netlify console toggle.
3. **Phase-2D** — CONCERN dispositions for §3, §5, §8, §10, §12, §13. Each gets enforcement-added or rule-amended-to-match-reality or rule-killed. Friday rule-kill review per §13 is the natural moment.
4. **Phase-2E** — card system design. Aesthetic concentration. **Locked constraint:** monochrome / grayscale, no color hues. Captured at `~/Desktop/8ball/sessions/phase_2e_aesthetic_constraints.md`. Open question still: strict two-tone vs. grayscale-permitted (default is grayscale-permitted unless operator says "strict").
5. **Phase-2F** — card system implementation. Engine + UI rewrite, content layer pivot. Retires `content/traits.v1.js` and `content/templates.v1.js`. Adds `content/cards.v1.js` + `assets/cards/`. CC lane.
6. **Bash-3.2 fix for `audits/run_local_audit.sh`.** Script uses `mapfile` (bash 4+); breaks on macOS default bash 3.2. Run-around: this session executed the audit logic inline via Desktop Commander, so the §8 ritual local-audit gate was effectively run against `3e6d71a` and returned 0 hits. Fix: rewrite the `mapfile` line to a POSIX `while read` loop. Single-file shell-script edit, chat-lane authority. Land in next housekeeping PR.
7. **`8BALL.md §10`** updated this session to reflect v0.1.2 SHIPPED state. Done as part of this entry's commit.

=====
End of 2026-05-08 · v0.1.2 entry.
=====

=====
2026-05-08 · doctrine audit triage + product pivot — Phase-2 scoped
=====

Not a version bump. No code shipped. State changes captured for provenance.

## What happened

First execution of §10 multi-model lanes. Two artifacts saved to `~/Desktop/8ball/audits/`:

- `codex_doctrine_audit_2026-05-08.md` — full Codex response. **1 PASS / 6 CONCERN / 6 FAIL** out of 13 numbered rules. Brief expected 9–11 PASS, 0–1 FAIL on first audit. We are dramatically off that mark. Per the brief's own acceptance criteria: *"If FAIL count is higher than 1, the doctrine was written aspirationally; tighten or kill the failing rules before adding more."*
- `chatgpt_v2_brief_meta_review_2026-05-08.md` — ChatGPT response. NOT what queue item #4 specified. ChatGPT returned brief-design meta-review instead of v2 trait pool draft. Likely cause: brief's step 5 ("paste traits.v1.js after the prompt") was skipped at relay time, leaving ChatGPT no source content to audit. Useful as brief feedback; not the artifact intended.

## Codex FAILs — disposition

**§1 / §2 / §9 (surface-narration cluster) → retire via product pivot.** Doctrine says the calculation interior must never be named in the product. README:5 explicitly names "sun sign, Chinese zodiac animal, and numerology life path" in the same sentence that links to §9. About modal in `index.html` says "loosely informed by the date you were born and a couple of derived numbers." The doctrine and the violation lived in the same paragraph — characteristic aspirational-rule shape. Pivot decision (see below) makes these rules obsolete rather than amends them.

**§4 → fix-now patch (v0.1.2) + safety-patch carve-out.** `content/traits.v1.js` `ox` array contains "someone whose stubborn is technically a personality disorder" — invokes mental-health framing as roast target. Adjacent finding (Codex pool-scan missed; orchestrator caught while verifying the §4 evidence): `sagittarius` array contains "someone whose honesty is technically assault" — uses sexual-assault framing as roast mechanic. Both fail the doctrine's literal "if you can't tell, it crosses" test. Both lines cut. Stress-tests locked-decision #9 (immutable v1 pools). Disposition: add a §4 safety-patch carve-out — *immutability protects against silent flavor drift, not against doctrine-rule violations caught post-ship.*

**§7 (CI doesn't actually block deploy) → fix-now or amend-doctrine.** Doctrine claims CI green is required to deploy. Reality: Netlify publishes `.` on every push to main with no GitHub Actions status check. Either configure Netlify GitHub-Actions-required-check (operator setting; no code change), or soften §7 to "CI is green before merge to main; deploy auto-runs on main." Pick one.

**§11 (PII rule) → fix-now (both halves), v0.1.2.** Two issues: (a) the v0.1.0 entry below in this same journal describes the leak by quoting the labeled-DOB shape it removed, and the PII scanner allow-lists `journal.md`, so the leak survives in tracked content under the scanner's nose; (b) the labeled-DOB regex only catches label-before-date shapes with no alphabetic text between them, missing JSON-shaped occurrences. Fixes: rewrite the v0.1.0 entry to describe the leak class without reproducing the shape, tighten the regex, narrow the `journal.md` allow-list.

## Codex CONCERNs — logged

- **§3:** master numbers 11 and 22 in fixtures, 33 missing. Regression dropping 33 preservation would pass current gate. → add 33 fixture in next refresh.
- **§5:** no automated gate against new localStorage keys, fetch() calls, or analytics injections. → add static scan for forbidden API surfaces.
- **§8:** release ritual is operator vigilance only, no hard pre-merge gate. → known structural property; defer until friction shows real cost.
- **§10:** lanes documented, no automated enforcement that doctrine amendments pass through Codex. → consider PR template requiring lane-tag.
- **§12:** out-of-scope items have no automated gate. → static scan covers some (fetch presence); full coverage requires PR-level review discipline.
- **§13:** Friday rule-kill review has not fired (rule was created today). → first review scheduled at first Friday post-creation.

Per brief acceptance criteria: CONCERNs that recur in next audit escalate to FAIL.

## Product pivot: roast → designed deck

Triggered by §1/§2/§9 cluster being structurally unfixable as written. Operator decision: shake → truth tied to (name, DOB) lands as a card from a **fixed designed deck**. Declarative-observational voice, strengths-and-weaknesses framing, explicitly materialistic-aesthetic in essence by design. Roast voice retires. The trick is no longer hidden; the calculation IS the product.

This dissolves §1/§2/§9 cleanly (nothing left to deny) and transforms §4 (the violating prose lines die when format changes; §4 needs a successor for card content). §7 and §11 are independent of the pivot and still need fixing.

Pivot is decided, not implemented. Implementation is Phase-2.

## Phase-2 scope

Brief's own rule binds: when FAIL > 1, tighten or kill failing rules before adding more. So:

- **2A. v0.1.2 patch.** §4 safety-patch carve-out + cut both violating trait lines + §11 PII regex tightening + journal v0.1.0 rewrite + journal allow-list narrow. Multi-file → CC lane.
- **2B. Doctrine consolidation.** Retire §1/§2/§9; rewrite §4 for card content (no medical/diagnostic framing; cultural-symbol respect if cards draw from any tradition); revisit §10's "v1 immutable" rule given format pivot. Codex re-audit before merge. Target: 9+ PASS, FAIL ≤ 1.
- **2C. §7 deploy-gate alignment.** Wire Netlify required-check, or amend doctrine. Operator decision.
- **2D. Rule-without-enforcement CONCERNs (§5, §8, §10, §12).** Each gets one of: enforcement surface added, rule amended to match reality, or rule killed. Friday rule-kill review per §13 is the natural moment.
- **2E. Card system design.** Schema, sample cards, full deck. Where "aesthetic and taste" lives. Independent of doctrine work; can run parallel.
- **2F. Card system implementation.** Engine + UI rewrite. Retire `content/traits.v1.js` and `content/templates.v1.js`. Add `content/cards.v1.js` + `assets/cards/`. Fixtures update. CC lane.

ChatGPT v2 trait expansion is **paused indefinitely** — pivot retires trait pools.

## Tooling provisioned this session

- `CLAUDE.md` at repo root — CC entry point, lane discipline, command list, don't-do rules. CC v2.1.42 verified (predates auto-memory v2.1.59+; static-CLAUDE.md path matches project's append-only discipline anyway).
- `AGENTS.md` at repo root — cross-tool role-routing gate (the open-standard format auto-read by Codex / Cursor / Aider / Windsurf / Zed). Tells any agentic tool that lands here to identify role per §10 before modifying anything.
- Both untracked, pending clean commit alongside this journal entry.

No `.claude/` or `.codex/` subdirectories scaffolded. Per Anthropic and OpenAI docs, "small and stable, add modular config when friction shows real cost." Not adding empty config files preemptively.

## Lessons

**L10 — A doctrine that fails its own first adversarial audit at FAIL=6 is honest but unfit-for-purpose.** §10 lanes did exactly what they were built to do: a different model with a different bias profile read the doctrine literally and found drift the authoring instance could not see. The lesson is not that the doctrine is broken. The lesson is that aspirational rules masquerading as enforced rules are the most expensive kind of doctrinal debt — cheap to write, hard to retire, structurally invisible until something forces a literal read.

**L11 — Lane-relay completeness is the soft failure mode.** The ChatGPT v2-traits brief failed-soft because a paste step was skipped at relay. The model defaulted to brief-critique rather than refusing or asking for the missing input. The lane existed; the relay didn't carry. Brief should be amended to require source-content paste before any output, or relay step should include a checklist confirming all paste-targets are filled before send.

**L12 — Live-fire of the discipline beats hypothetical critique of it.** While provisioning `CLAUDE.md` this session, the PII scanner caught a home-directory file path that contains operator first name as a word. The right move was visible immediately: fix the new file rather than widen the allow-list — exactly the drift pattern Codex flagged in §11. Same scanner, same allow-list, same drift surface, fired on a fresh case and resolved correctly. The discipline working in real time on a real artifact is worth more than ten audits of how the discipline *should* work.

## Open items / next session queue

1. ~~Connect Netlify to GitHub repo~~ ✅
2. ~~Pick + reserve subdomain~~ ✅
3. ~~Hex-overflow fix~~ ✅
4. ~~Codex doctrine audit~~ ✅ done; triaged in this entry.
5. **ChatGPT v2 trait audit — PAUSED INDEFINITELY** (pivot retires trait pools).
6. Operator: create `audits/local_personal_data.txt` per `audits/LOCAL_PII_AUDIT.md`.
7. Operator: bootstrap-table update in personal preferences file (carried from v0.1.1 queue).
8. **Phase-2A: v0.1.2 patch** — §4 carve-out + violating trait lines cut + §11 PII fixes + journal v0.1.0 rewrite. Single PR. CC lane.
9. **Phase-2B: doctrine consolidation** — retire §1/§2/§9; rewrite §4 for card content; revisit §10 immutability rule under pivot. Codex re-audit before merge.
10. **Phase-2C: §7 deploy-gate alignment** — wire Netlify required-check, or amend doctrine.
11. **Phase-2D: rule-without-enforcement CONCERNs** — enforcement, amend, or kill for §5, §8, §10, §12.
12. **Phase-2E: card system design** — schema, sample cards, full deck. Aesthetic concentration.
13. **Phase-2F: card system implementation** — engine + UI rewrite, content layer pivot.
14. Codex re-audit on consolidated doctrine. Target FAIL ≤ 1.
15. Question classifier rework — independent, can run anytime (likely retired by pivot).
16. Brief amendment: require source-content paste verification at send-time (or kill if pivot retires the whole brief).
17. Candidate fifth lane: Grok. Provisioned on operator's machine. Role TBD post-pivot — possible cold-reading-sniff auditor for card content. Provision when card content exists for it to review.

=====
End of 2026-05-08 · doctrine audit triage entry.
=====

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
> **Sanitization note (v0.1.2):** the "What shipped" bullet describing the labeled-DOB leak was rewritten to describe the leak class without reproducing the label or the date. Original draft preserved no useful information beyond the shape it claimed to fix. See journal entry for v0.1.2.

## What shipped

- **Critical:** v0.1.0 fixture leak fixed. `tests/fixtures.json` contained a calculation fixture whose label tied the operator's first name to a real-shape DOB — a labeled-DOB leak in a public repo. The same leak shape appeared in this journal's prior draft. Fix: synthetic DOB shifted by 12 years (preserves Chinese zodiac animal and life path mod-9 distribution while breaking the real-DOB anchor); all operator-name labels removed from fixtures and journal.
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
