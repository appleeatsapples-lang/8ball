# Test-quality audit — session record (2026-07-24)

Four-part audit of the test suite's actual strength, run on branch
`claude/test-coverage-analysis-27tc7k` against main @ `a9103a7`
(38 test files / 1369 tests green at session start). Produced by the
Claude Code lane. One durable code change shipped (§5 below); all
tooling used for measurement was temporary and fully reverted.

Parts: (1) instrumented line/branch coverage, (2) classification of
every test by what it actually asserts, (3) CLAUDE.md doctrine-rule →
enforcement mapping, (4) mutation testing over `core/`. Then the
shipped change, a ranked synthesis, and reproduction notes.

---

## 1. Instrumented coverage (V8, temporary `@vitest/coverage-v8`)

Overall `core/`+`ui/`+`content/`: **73.9% statements / 71.2% branches /
79.0% functions**. `core/` alone: 96.8% stmts, 100% functions.

Weak spots (statements / branches / functions):

| module | stmts | branch | funcs | note |
|---|--:|--:|--:|---|
| ui/readings.js | **22.0%** | 33.2% | 18/54 | controller (L337–697) never executes; storage layer well tested |
| ui/share.js | **50.4%** | 41.3% | 8/25 | pure snapshot builders tested; live path (rowSections → onShare) never executes |
| ui/modals.js | 87.9% | **66.7%** | 11/13 | backdrop-click + Escape branches untested |
| ui/citysearch.js | 88.3% | **69.6%** | 12/12 | keyboard-nav guards |
| core/rising.js | 93.8% | **81.0%** | 11/11 | tz/DST failure paths (getOffsetAtInstant) |
| ui/payments.js | 89.9% | 83.0% | 22/25 | setPendingProfile / isPaywallOpen never called |

At 100% (all three axes): content/*, ui/labels.js, core/{math,pillars,
birthcard,countries}. Strong (92–100% stmts): remaining core/ + ui/.

Also mapped: the ~471-line inline module script in `index.html`
(renderCard / showResult / shakeAgain / submit handler / boot) has zero
behavioral coverage — pinned only by source-regex tests.

**The figures in this section are the session-start baseline** (before the
§5 change). Appendix B carries the complete 25-module table measured after
it, and is the current one — `ui/share.js` in particular has moved.

Proposed improvement areas (ranked, from the session's first report):
1. Behavioral tests for the Saved Readings / Concordance controller
   (`initReadingsUI` down — §5.F two-selection rule, delete/clear
   confirm flows, rename, corrupt-entry rendering, focus handling).
2. Share live path (rowSections + onShare flow with stubbed
   canvas/Image/navigator; §5.D boundary — partially closed by §5 below).
3. Paywall/modal interaction edges (setPendingProfile round-trip,
   isPaywallOpen, backdrop-click, Escape delegation).
4. Rising-sign tz edge fixtures (DST spring-forward, fractional-offset
   zones, invalid tz → unresolved; only 3 reference fixtures exist).
5. Composition-root extraction (`ui/app.js`) or honest renaming of the
   grep-based wiring tests — needs operator sign-off (repo_shape +
   CLAUDE.md counts move).
6. Defensive-dead branches in core: cover cheaply or annotate.
7. Process: a non-gating coverage script (devDep #2 of ≤5; needs
   journal note per dependency discipline).

## 2. Classification of all 1369 tests

Every test classified by what its assertions consume (verified: per-file
sums reconcile exactly to vitest's JSON-reported counts).

- **(a) executes product code / shipped data and asserts the result:
  1137 tests (83.1%)** — 465 of 681 source `it()` blocks.
- **(b) reads source text / greps a file: 221 (16.1%)** — 205 blocks.
- **(c) constant/fixture-only: 11 (0.8%)** — all deliberate
  guard-the-guard sentinels for the scan tables.

Rules: priority a > b > c when mixed; (a) requires an assertion
*subject* produced by product code — a product-derived needle grepped
against source text stays (b). Full per-file table and complete (b)/(c)
listing: Appendix A.

Key patterns surfaced:
- Much of (b) is intentional policy enforcement (pii/privacy/dependency/
  repo-shape/reach scans) — grep is the right tool there.
- The (b) tests whose *names claim runtime behavior* (all 5
  readings-wiring tests, 6 facet_rotation, 11 tiers, 11 dob_validation,
  modals' escape-delegation) trace to the index.html inline script and
  the uncovered controller halves of ui/readings.js and ui/share.js.
- The five "exports init*UI with (refs, hooks) arity" tests split
  classes by implementation: four are source regexes (b), tiers'
  asserts the imported function's arity (a).

## 3. CLAUDE.md doctrine-rule → enforcement map

Of 14 §-numbered rules CLAUDE.md states, **only 2 have behavioral
enforcement**: fixtures/calc lockstep (§3 — profile.test.js runs every
fixture through the calc), and shipped-content immutability (§4) for
the deck (content_shape value-pins) and concordance registry.

| rule | enforcement | type |
|---|---|---|
| §10 lane discipline | — | none (process) |
| no push w/o operator confirmation | — | none (process) |
| DOCTRINE change needs cross-model audit (§10) | ci.yml diff-gate (journal.md + audits/ artifact presence) | source-grep |
| §4 deck immutability | content_shape (36 value-pin tests), profile deck contract | behavioral |
| §4 concordance.v1 immutability | concordance inventory pins | behavioral |
| §4 meanings.v1 immutability | completeness/shape/voice only — no exact-string pins | weak (flagged) |
| §3 fixtures lockstep | profile.test.js fixture pipeline | behavioral |
| §12 no runtime deps | dependency_discipline (package.json) | source-grep |
| §5 no fetch() | privacy_scan + per-module greps | source-grep |
| §5/§7 no analytics | privacy_scan tokens | source-grep |
| §5 no new localStorage keys | privacy_scan setItem allow-list | source-grep |
| §11 don't widen PII allow-list | — (sentinels catch broken regexes, not widened lists) | none (flagged) |
| §6 index.html ≤1500 | meanings_ui line count + ci.yml | source-grep |
| repo-shape counts lockstep | repo_shape.test.js | source-grep |

Flagged as pure process trust: lane discipline, push confirmation,
audit *substance* (the CI gate proves an audits/ file exists, not that
an audit happened), PII-scanner scope. Flagged as weaker than stated:
meanings.v1 "immutability" (a clinical in-place rewording passes the
suite; only the journal-touch diff-gate makes it visible).

## 4. Mutation testing — `core/` (Stryker 9.6.1 + vitest runner)

3097 mutants; **overall score 62.0%** (1897 killed, 22 timeout, 1152
survived, 26 no-coverage). Run 13m54s. **All 1178 undetected mutants
are listed, with line / mutator / original -> replacement, in the
companion file `audits/mutation_survivors_core_2026-07-24.md`** — the
evidence is committed, so no finding here requires repeating the
14-minute run.

| file | score | | file | score |
|---|--:|---|---|--:|
| math.js | 100.0% | | countries.js | 61.8% |
| pillars.js | 98.6% | | calendar.js | **42.7%** |
| payments.js | 95.6% | | cities.js | **14.8%** |
| engine.js | 86.9% | | profile.js | 77.7% |
| rising.js | 79.0% | | birthcard.js | 71.2% |

The load-bearing result: three files are heavily *executed but weakly
asserted* (line coverage ~97–100%, mutation score far lower):

- **cities.js (14.8%)** — 222 surviving StringLiteral mutants L34–167:
  an entire country-name table plus the 'json' import attribute are
  never value-asserted.
- **calendar.js (42.7%)** — 171 surviving arithmetic mutants across the
  Meeus formulas; even the jieqi bisection midpoint `(lo+hi)/2 → *2`
  survives. The ~10 date-precision sanity locks pin far too little.
- **countries.js (61.8%)** — 244 unary-minus flips (centroid **sign
  flips** stay inside range checks) + 276 name strings blankable.

Other notable survivors: ten SUN_SIGNS boundary arrays can be emptied
(`[2,19] → []`) without any fixture noticing — the 23 calc fixtures do
not cover every sign window; DOB regex anchors droppable
(profile.js L244); GMT-offset regex anchor droppable (rising.js L129);
toRoman range guard removable (engine.js L33); arcana numeral labels
blankable (birthcard.js L45–46).

Caveats: one source-pin test (cities_search) was skipped during the run
— instrumentation necessarily breaks source-text pins; it kills no
mutants; reverted after. Stryker's dry run reported 1074 tests vs plain
vitest's 1369 — unattributed runner-side counting of loop-generated
tests; per-file kill counts (843 in countries.js) confirm the loop
suites executed.

## 5. Shipped change (commit 4df1eee)

`tests: pin §5.D sealed-value strip at the share snapshot layer`

One adversarial test in tests/share_surface.test.js: `rowSections()`
fed a live row ref whose sealed cell wrongly carries its value must
return a snapshot with that value absent from every field (open cells
keep theirs). Enabler: `rowSections` gained an `export` keyword in
ui/share.js — it was module-internal and otherwise reachable only
through the canvas/Image flow. Suite 1369 → 1370; no repo_shape or
CLAUDE.md count changes (no new file). The §5.D strip
(`state === 'sealed' → value ''`) previously had zero coverage; the
mutation run confirms the pattern class (uncovered guards survive
mutation silently).

## 6. Synthesis — where the suite is weakest, ranked

1. Data/math value-pinning in core: cities.js name table, calendar.js
   Meeus outputs, countries.js centroids+names (mutation §4).
2. ui/readings.js controller — largest uncovered behavioral surface,
   carries §5.E/§5.F destructive flows (coverage §1, classification §2).
3. ui/share.js live flow — §5.D boundary; snapshot layer now pinned
   (§5), onShare/renderCardPng still uncovered.
4. Sun-sign fixture windows + DOB/offset regex anchors (mutation §4).
5. index.html composition root — behavioral blind spot; grep tests
   overclaim (classification §2).
6. Unenforced process rules — PII-scanner scope and audit substance are
   the least-visible-violation candidates (mapping §3).

## 7. Reproduction notes

- Coverage: `npm i --no-save @vitest/coverage-v8@4.1.9 && npx vitest
  run --coverage --coverage.include='core/**/*.js'
  --coverage.include='ui/**/*.js' --coverage.include='content/**/*.js'`
- Mutation: `npm i --no-save @stryker-mutator/core
  @stryker-mutator/vitest-runner`, config `{ mutate: ["core/**/*.js"],
  testRunner: "vitest", coverageAnalysis: "perTest", reporters:
  ["progress","clear-text","json"], disableTypeChecks: false,
  timeoutMS: 10000, concurrency: 3 }`; skip the cities_search source-pin
  test for the run (instrumentation breaks source-text pins).
- Both installs leave package.json/lock untouched; restore
  node_modules with `npm ci`.
- Classification denominator: `npx vitest run --reporter=json` per-file
  assertionResults counts.

---

## Appendix A — classification detail

Totals: a=1137 / b=221 / c=11 (runtime); a=465 / b=205 / c=11 (blocks).

Per-file (a/b/c): atlas 12/3/0 · birthcard 10/4/0 · cards_hosting 1/2/0
· cities 14/0/0 · cities_search 7/1/0 · citysearch 12/5/0 · concordance
15/3/0 · content_shape 36/0/0 · countries 557/0/0 · density 7/8/0 ·
dependency_discipline 0/3/0 · dob_validation 0/11/0 · facet_rotation
31/6/0 · feedback_surface 0/7/0 · labels_reveal 0/21/0 · math 3/0/0 ·
meanings_behavior 18/0/0 · meanings_content 17/1/7 · meanings_ui 0/8/0
· modal_a11y 6/4/0 · modals 2/5/0 · numerology_display 1/5/0 ·
payments_markup 7/40/0 · payments_state 43/0/0 · pii_scan 0/9/3 ·
pillars 31/2/1 · privacy_scan 0/10/0 · profile 134/1/0 · profile_ui
12/0/0 · prose_coordinate_count 1/4/0 · provenance 8/3/0 ·
reach_surface 1/9/0 · readings 10/5/0 · repo_shape 0/3/0 · rising
50/0/0 · rising_disclosure 0/7/0 · share_surface 19/20/0 (now 20/20/0
with §5's test) · tiers 72/11/0.

Complete (b)/(c) listing with per-test grep targets:


## CLASS B — source-text / file greps

### tests/atlas.test.js — 3 tests
- ui/tiers.js writes .coord-atlas at init, never on render — regex over ui/tiers.js source slices
- gated behind the existing labels toggle — no new localStorage key — regex index.html CSS plus ui/tiers.js source
- NOT serialized into the §5.D share PNG (ui/share.js never reads .coord-atlas) — regex coord-atlas over ui/share.js source

### tests/birthcard.test.js — 4 tests
- arcana coord-section leads the card (before FIVE-ELEMENT) — indexOf over index.html text
- arcana row has no locked-extras (free coordinate, no paid layer) — substring check over index.html slice
- share refs lead with the arcana row (PNG matches free card; per-cell share refs) — contains/regex over index.html text
- render populates the arcana cell from profile.birthCard.label (ui/tiers.js) — regex over ui/tiers.js source text

### tests/cards_hosting.test.js — 2 tests
- manifest is exactly the canonical queue superset, in order — cards/manifest.json codes vs test-local EXPECTED_CODES list
- no stray cards/*.jpg outside the manifest — cards/ directory listing compared against manifest filename list

### tests/cities_search.test.js — 1 test
- source pin: a failed load resets _loading so the session can retry — regex over core/cities.js source text (try/finally pin)

### tests/citysearch.test.js — 5 tests
- exports initCitySearchUI with (refs, hooks) arity — regex export signature in ui/citysearch.js text
- introduces no localStorage keys and no network surface — regex/negative regex over ui/citysearch.js text
- index.html boots the surface via initCitySearchUI and keeps selectedCity host-owned — regex boot wiring in index.html
- index.html no longer defines the inline autocomplete handlers — negative regex inline handlers in index.html
- the polar check is imported from the core authority, not duplicated — regex isPolarLatitude import in ui/citysearch.js text

### tests/concordance.test.js — 3 tests
- recomputes in the host and gives concordance no storage or network capability — regex over index.html, concordance.js, readings.js text
- exposes an accessible two-selection flow and a separate comparison screen — regex over ui/readings.js source text
- scans the exact registry module the runtime imports (scan-target parity) — import-specifier regex over ui/concordance.js source text

### tests/density.test.js — 8 tests
- the helper never reads a profile or the catalog driver — regex over ui/tiers.js function slice
- copy is clinical — no FOMO / sales / urgency tokens (§2 / §5.C) — regex over index.html template-literal copy
- copy interpolates count fields only — no profile value — regex over index.html block interpolations
- strip lives in .result-rail, OUTSIDE the share-serialized #card-face — regex over index.html rail/card slices
- is always-on — no .card.labels-revealed gate (unlike placards/atlas) — regex over index.html CSS gating
- ui/share.js never references the strip (off-snapshot by construction) — regex over ui/share.js source text
- density census is a live status region for screen readers — regex over index.html density-strip tag
- the specimen sheet region is named + live for assistive tech — regex over index.html card-face tag

### tests/dependency_discipline.test.js — 3 tests
- package.json has no runtime dependencies — parsed package.json dependencies object asserted empty
- package.json has no build script — package.json scripts.build asserted absent or no-op
- devDependencies count is at most ${DEV_DEP_THRESHOLD} — package.json devDependencies key count vs threshold

### tests/dob_validation.test.js — 11 tests
- dob-error element exists with id, class, and hidden attribute — regex dob-error markup in index.html
- dob-error copy names the failure mode ("future") — regex-extracted dob-error copy from index.html
- dob-error lives inside the DOB field block (adjacent to dob-input) — regex field-block adjacency in index.html
- field-error CSS class is defined alongside hint classes — regex .field-error CSS in index.html
- dobInput.max set at boot to today via local-date helper — regex dobInput.max assignment in index.html script
- input event handler hides dob-error on edit — regex input-handler source in index.html
- submit handler compares dob against today (ISO lexicographic) — regex submit comparison source in index.html
- todayIsoLocal helper uses local-date math, not UTC (step-12 codex hook 4 P2) — regex todayIsoLocal source plus negative UTC patterns, index.html
- submit handler surfaces dobError on future-DOB rejection — regex dobError.hidden=false in index.html
- dobError DOM reference is declared near other field refs — regex dobError ref declaration in index.html
- boot rehydration guards buildProfile so a corrupt stored DOB never crashes boot OR leaks its city — regex try/catch rehydration source in index.html

### tests/facet_rotation.test.js — 6 tests
- only t3 calls the credit-consuming facet transition — index.html regex: t3 consumeFacetShake guard line
- zero-credit rotation opens the paywall without staging pending intent — index.html regex: show-paywall block body
- renders the written note from the persisted current position — index.html regex: cardNote getFacetSlot render line
- new profiles and consumed pending profiles explicitly reset to the anchor — index.html regex: ensureFacetIndex reset call sites
- forget and corrupt-profile cleanup clear the facet position — index.html match count: clearFacetIndex() occurrences
- mechanical c.1 mapping is explicit and does not claim v2 content — ui/payments.js source regex: FACET_SLOTS array literal

### tests/feedback_surface.test.js — 7 tests
- feedback form is present as native same-origin Netlify POST — regex over index.html form tag attributes
- sent-banner detection is an exact URLSearchParams check, not a substring test — regex over index.html inline-script source text
- feedback form does not include profile-data field names — regex for banned name= attributes over index.html form body
- feedback form fields are all allow-listed — regex-extracted name= attributes from index.html vs allow-set
- feedback form exposes only message plus optional contact as user-authored fields — regex over index.html form body for textarea/input markup
- feedback form has honeypot for bot detection — regex over index.html form tag/body for honeypot markup
- about-modal discloses the feedback surface — regex over index.html about-modal markup text

### tests/labels_reveal.test.js — 21 tests
- toggle button element exists with id — regex over index.html labels-toggle id
- default toggle copy is "→ reveal labels" — regex over index.html toggle copy
- toggle has aria-pressed attribute (default false) — regex over index.html aria-pressed
- eight coord-section elements present — count coord-section matches in index.html
- eight coord-title elements present — count coord-title matches in index.html
- fourteen compartment value nodes present (v0.7.0 per-cell sheet) — count coord-val matches in index.html
- locked title copy: FIVE-ELEMENT — regex over index.html title copy
- locked title copy: SUN ↑ RISING — regex over index.html title copy
- coord-sun-title element has id for runtime conditional (v0.2.7.1.1) — regex over index.html sun-title id
- coord-animal-title element has id for runtime conditional (v0.6.0) — regex over index.html animal-title id
- tier render keeps the paired-row title grammar — SUN ↑ RISING vs SUN · RISING (v0.7.0) — regex over ui/tiers.js source assignment
- tier render keeps the paired-row title grammar — PUBLIC ⇌ PRIVATE vs PUBLIC · PRIVATE (v0.7.0) — regex over ui/tiers.js source assignment
- locked title copy: PUBLIC ⇌ PRIVATE — regex over index.html title copy
- locked title copy: LIFE · NAME · SOUL — regex over index.html title copy
- locked title copy: PERSONALITY · BIRTHDAY · MATURITY (v0.6.0 t2 row) — regex over index.html title copy
- locked title copy: DAY PILLAR + HOUR PILLAR — clinical register (v0.6.0 §2 voice) — regex over index.html pillar titles
- localStorage key lives in ui/labels.js (canonical labels key, §6 split) — regex over ui/labels.js LABELS_KEY const
- about-modal discloses the toggle — regex over index.html about-modal subtree
- exports initLabelsUI with (refs, hooks) arity — regex over ui/labels.js source, module never imported
- exports the pure persistence helpers — regex over ui/labels.js export signatures
- index.html boots the labels surface via initLabelsUI — regex over index.html import/init call

### tests/meanings_content.test.js — 1 test
- scans the exact meanings module the runtime imports (scan-target parity) — import-specifier regex over ui/meanings.js source text

### tests/meanings_ui.test.js — 8 tests
- exports initMeaningsUI with a single refs-object arity — regex over ui/meanings.js source text
- index.html imports and calls initMeaningsUI once, passing cardFace — regex over index.html text
- excludes catalog from COORDINATES — no detail trigger for the compound card — negative regex over ui/meanings.js text
- registers every coordinate value id as interactive — valueId literals searched in ui/meanings.js text
- imports the expanded meaning/context registry from meanings.v2.js — import regex over ui/meanings.js text
- uses meaning context rather than derivation/provenance copy — string includes over ui/meanings.js text
- injects its own style/panel rather than editing index.html markup/CSS — regex over index.html and ui/meanings.js text
- index.html net line-budget for this feature is import + one init call (single-file rule) — line count of index.html text

### tests/modal_a11y.test.js — 4 tests
- all three dialogs carry aria-modal="true" alongside role="dialog" — counts role=dialog / aria-modal matches in index.html
- the dark-chrome label token exists and the AA-failing pairs are off it — regex --label-on-dark token and CSS pairs, index.html
- closed modals leave the keyboard tab order (visibility, not just opacity) — regex .modal-bg visibility rules in index.html
- modal-disclosure no longer dilutes its AA-passing color with opacity — negative regex .modal-disclosure opacity in index.html

### tests/modals.test.js — 5 tests
- exports initModalsUI with (refs, hooks) arity — regex export signature in ui/modals.js text
- introduces no localStorage key at all — regex eight_ball_ keys over ui/modals.js text
- index.html boots the modal surface via initModalsUI — regex import/boot call in index.html
- index.html no longer defines the inline modal handlers — negative regex openAbout in index.html
- escape-to-close reaches the paywall via injected hooks, not a cross-module import — regex hook names in ui/modals.js text

### tests/numerology_display.test.js — 5 tests
- each numerology number renders into its own compartment cell (v0.7.0) — setNumerologyCell regex over ui/tiers.js text
- no .join('') — never concatenated — join('') regex over tiers.js and index.html text
- the §1.B triplet references all three numerology coordinates — profile.* regex over ui/tiers.js text
- the §1.D second triplet references personality / birthday / maturity — profile.* regex over ui/tiers.js text
- no hasMaster-branched display logic anywhere in the render path — hasMaster regex over tiers.js and index.html text

### tests/payments_markup.test.js — 40 tests
- lock-icon element exists with id and SVG — index.html regex: card-lock-icon subtree + svg
- paywall modal element exists with required attributes — index.html regex: paywall-modal aria-hidden
- paywall CTA is a Gumroad Buy Link (v0.3.0.3) — index.html regex: gumroad Buy Link href
- paywall ladder carries exactly three Gumroad CTAs with the locked product URLs (v0.6.0) — index.html regex: three CTA hrefs, bare URLs
- ladder copy: each CTA names its rung price and clinical contents (v0.6.0) — index.html regex: CTA copy prices and labels
- t1 CTA sells the name-derived pair, never the retired triplet (§1.D v0.38 / codex F01) — index.html regex: t1 CTA copy substrings
- paywall title and body carry the three-rung framing (v0.6.0) — index.html regex: paywall title/body copy
- reads-chip element exists — index.html regex: reads-chip id present
- no inline credit count hardcoded in markup — index.html regex: reads-chip inner text empty
- reads-chip is in-flow, not absolutely positioned (v0.6.1) — index.html CSS text: .reads-chip block
- flip faces are grid-stacked so the card can grow at t3 (v0.6.1) — index.html CSS text: .flip-inner/.flip-side blocks
- the locked-extras bars are fully retired (v0.7.0 seal system supersedes) — index.html negative regex: locked-extras absent
- compartment cells and seal layers are present (v0.7.0) — index.html match counts: coord-cell/coord-seal
- seal treatment is the single root token .card.seal-hatch with one gradient (F1) — index.html regex: seal-hatch token, gradient count
- unlocked-render slots exist (card-name / card-type / card-habit / card-note) — index.html regex: four card slot ids
- paid-return banner exists hidden-by-default with exact unlock copy — index.html regex: paid-banner hidden attr + copy
- handlePaidReturn reads ?paid via URLSearchParams — ui/payments.js source regex: URLSearchParams pattern
- handlePaidReturn calls applyPaidReturn from core — ui/payments.js source regex: applyPaidReturn( call
- handlePaidReturn strips query via replaceState to pathname (not hard-coded /) — ui/payments.js source regex: replaceState pathname
- about-modal: contains "calculator-grade" — index.html about-modal subtree regex
- about-modal: discloses the ladder prices ("three, six, or nine dollars") — index.html about-modal subtree regex
- about-modal: names gumroad (case-insensitive) — index.html about-modal subtree regex
- about-modal: discloses on-device data boundary — index.html about-modal subtree regex
- about-modal: discloses source visibility ("the deck is visible in source") — index.html about-modal subtree regex
- about-modal: discloses lock-as-convention framing — index.html about-modal subtree regex
- about-modal: discloses what a rung buys ("three more reads with the sheet opened to that rung") — index.html about-modal subtree regex
- about-modal: discloses the t3 written-entry ceiling and the stored rung (v0.6.0) — index.html about-modal subtree regex
- about-modal: conditional coordinates carry their input qualifiers (v0.6.0 absorb) — index.html about-modal subtree regex
- free-card copy binds the free coordinates to DOB only (v0.6.0 absorb / §1.D v0.38) — index.html subtree plus whole-html negative regex
- about-modal: word "subscription" only appears in the negation "no subscription" — index.html subtree occurrence counts compared
- paywall modal contains .modal-disclosure element — index.html paywall-modal subtree regex
- paywall modal disclosure names gumroad (case-insensitive) — index.html paywall-modal subtree regex
- paywall modal disclosure routes payment + email to Gumroad — index.html paywall-modal subtree regex
- paywall modal disclosure keeps reading on-device — index.html paywall-modal subtree regex
- setPendingProfile is called immediately before openPaywall (Path A + Path B) — index.html regex: setPendingProfile-openPaywall sequence count
- the actual localStorage write for the pending profile lives in ui/payments.js — ui/payments.js and index.html source regex
- clearPendingProfile is called inside handlePaidReturn — ui/payments.js source regex: function body extract
- tryAnotherBtn handler calls resetFormDisplay and NOT clearProfile — index.html regex: click-handler body contents
- renderCard references profile.animal in the unlocked branch — index.html regex: profile.animal indexing expression
- profile.publicAnimal is not referenced anywhere in index.html — index.html negative regex: profile.publicAnimal absent

### tests/pii_scan.test.js — 9 tests
- no match for ${label}: ${pattern} (×9) — repo-wide tracked-file walk, regex over file text, expects zero hits

### tests/pillars.test.js — 2 tests
- index.html ships the day/hour pillar rows for the tier gate — contains/regex over index.html text
- pillars stay out of the catalog driver (DOCTRINE §1.D — surface-only) — negative regex over index.html text

### tests/privacy_scan.test.js — 10 tests
- forbidden API surface: ${token} (×9) — readFileSync core/ui/content/index.html text, token includes, expects zero hits
- localStorage.setItem keys are allow-listed — regex over product source text; setItem keys vs allow-list

### tests/profile.test.js — 1 test
- scans the exact deck module the runtime imports (scan-target parity) — import-specifier regex over index.html and own source text

### tests/prose_coordinate_count.test.js — 4 tests
- meta descriptions claim the free-surface count derived from TIER_COORDS — needle derived from TIER_COORDS import; subject is index.html text
- about-modal free count matches TIER_COORDS and names every free coordinate — needle derived from TIER_COORDS import; subject is index.html text
- about-modal names every ladder coordinate across the three rungs — index.html about-modal text toContain test-local ladder names
- share export refs stay coupled to rendered coordinate rows — two regex-derived index.html counts compared to each other

### tests/provenance.test.js — 3 tests
- ui/tiers.js writes .coord-prov at init, never on render — regex over ui/tiers.js source slices
- gated behind the existing labels toggle — no new localStorage key — regex index.html CSS plus ui/tiers.js source
- NOT serialized into the §5.D share PNG (ui/share.js never reads .coord-prov) — regex coord-prov over ui/share.js source

### tests/reach_surface.test.js — 9 tests
- canonical points at the site root — regex canonical link in index.html text
- JSON-LD is valid, WebApplication, honest, URL-correct — JSON.parse of ld+json extracted from index.html text
- robots.txt allows crawlers and points to the sitemap — regex over robots.txt text
- sitemap.xml is well-formed and lists the canonical root — regex over sitemap.xml text
- og:image and twitter:image agree and live under the site origin — regex og/twitter image metas in index.html
- og:image:alt and twitter:image:alt agree and actually describe the image — regex alt metas in index.html text
- meta description is clinical/specimen (no predictive/mystical phrasing) — MYSTICAL regex over index.html meta description
- JSON-LD description is clinical AND identical to the meta description (parity) — regex/equality over index.html-extracted descriptions
- meta description fits a SERP snippet (<=160 chars) with the privacy differentiator present — length/regex over index.html meta description

### tests/readings.test.js — 5 tests
- boots the controller and exposes save plus previous-readings actions — regex over index.html and ui/readings.js source text
- revisits through profileFromPayload and showResult without a core import in the controller — regex index.html; negative regex ui/readings.js text
- re-anchors the t3 written-entry position on archive open exactly like a submit — single regex over index.html openReading source
- archive open is a pure rehydrate — no payment state machine, counters read-only — extracted openReading body from index.html text, regex asserts
- injects an accessible confirmation dialog and responsive list styles — regex over ui/readings.js source text

### tests/repo_shape.test.js — 3 tests
- core/ module count matches CLAUDE.md — readdirSync core/ file count vs CLAUDE.md regex-extracted number
- ui/ module count matches CLAUDE.md — readdirSync ui/ file count vs CLAUDE.md regex-extracted number
- tests/ vitest-file count matches CLAUDE.md — tests/ dir listing count vs CLAUDE.md regex-extracted number

### tests/rising_disclosure.test.js — 7 tests
- #rising-fields disclosure element is present — regex match over index.html source text
- stays a <details> (collapsible escape hatch preserved, not a plain div) — regex on index.html <details> tag text
- ships OPEN by default so birth time + birthplace are visible on first load — regex for open attribute in index.html text
- summary names birth time, frames the rising-sign benefit, keeps "(optional)" — regex over index.html <summary> text
- summary no longer reads as the bare skippable add-on — string compare on index.html summary text
- resetFormDisplay keeps #rising-fields open (does not re-collapse on reset) — regex over ui/profile.js function body text
- no code path in ui/profile.js collapses the rising disclosure — negative regex over ui/profile.js source text

### tests/share_surface.test.js — 20 tests
- #share-btn lives inside .result-controls — regex id=share-btn over index.html controls slice
- #share-btn is the second control, promoted above try-another (§5.D reach) — indexOf ordering of button ids in index.html text
- #share-btn label is "share" and type is button — regex over index.html button markup
- share-status confirmation node exists — regex id=share-status over index.html
- exports initShareUI with (refs, hooks) arity — regex over ui/share.js source, no import consumed
- index.html boots the share surface via initShareUI — regex import/call text in index.html
- the initShareUI call site passes no profile or paid-card ref (§5.D a/b at the wiring) — substring checks on index.html call-site slice
- index.html passes all eight coordinate rows to initShareUI — regex symbols array in index.html text
- the builder renders per-cell from the row refs, not a hidden-filter — regex over ui/share.js source
- share.js still imports nothing and knows no tier constant (gating stays in ui/tiers.js) — regex imports/tier tokens over ui/share.js source
- share flow uses sharePngFilename for File + download (not a fixed generic name) — regex filename usage over ui/share.js source
- share flow couples the caption: native share text + fallback copies caption (H5) — regex navigator.share/writeText over ui/share.js source
- a one-line mechanism strip sits between the registry header and the form — indexOf ordering in index.html text
- the mechanism strip carries no pricing or CTA — regex mechanism-strip content in index.html
- ui/share.js introduces no network surface (fetch / XHR / sendBeacon) — regex fetch/XHR/sendBeacon over ui/share.js source
- ui/share.js does not reference the paid card-content layer — substring checks over ui/share.js source
- ui/share.js does not serialize the provenance placard (.coord-prov) — regex coord-prov over ui/share.js source
- ui/share.js carries no name/DOB profile read — regex profile property reads over ui/share.js source
- the shared URL is the bare production URL with no query string — regex SITE_URL constant in ui/share.js source
- ui/share.js renders on-device (canvas/toBlob) and pulls no dependency — regex toBlob/imports over ui/share.js source

### tests/tiers.test.js — 11 tests
- cold-boot rehydration renders at getRenderTier() — no boot-circumstance branch — regex over index.html rehydration source
- cold-boot rehydration passes triesUsed — the free-tries chip must survive a reload (Codex audit 2026-07-04, Hook 1) — regex over index.html triesUsed arg
- same-pair submit and paid reads render at getRenderTier() — no action-based density — regex over index.html submit path
- same-card shake renders at getRenderTier() — regex over index.html shakeAgain source
- all eight .coord-section rows ship without hidden attributes — regex counts coord-section tags in index.html
- ui/tiers.js never hides a row — the v0.6.0 hidden-gating is retired — regex over ui/tiers.js source text
- 14 compartment cells + the entry block each carry a seal layer — regex counts coord-cell/coord-seal in index.html
- index.html clears the written-entry slots below t3 (name/type/habit/note empty) — regex over index.html clear branch
- the mock's opacity trick is not ported: no opacity-gated .coord-val rule — regex over index.html CSS rules
- index.html primes the baseline BEFORE handlePaidReturn applies the purchase — regex/indexOf ordering over index.html
- index.html wires the share surface through shareRowRefs — regex over index.html share wiring

## CLASS C — constant/fixture-only

### tests/meanings_content.test.js — 7 tests
- substring matcher fires on the suffix inflections the old \b shape missed — helper voiceRegisterHits on test-local sentinel strings
- substring matcher still fires on exact terms and multiword terms — helper voiceRegisterHits on test-local sentinel strings
- safelist suppresses only listed benign containments, never a real hit — helper safelist/banned tables plus local strings
- second-person pattern fires on every form including yours/yourself — helper SECOND_PERSON_RE on test-local samples
- diagnostic pattern fires on the whole diagnos* family plus plurals — helper DIAGNOSTIC_FRAMING_RE on test-local samples
- BANNED_PATTERNS stay word-bounded — ordinary vocabulary must not trip them — helper BANNED_PATTERNS regex on test-local samples
- parameterized terms (provenance/atlas verb extension) ride the same matcher + safelist — helper matcher with INTERPRETATION_VERBS on local strings

### tests/pii_scan.test.js — 3 tests
- labeled-DOB regex fires on the v0.1.0 leak shape it was written for — test-local BANNED regex tested against literal sample strings
- labeled-DOB regex does NOT fire on the retired false positives — test-local regex tested against literal non-matching strings
- every banned pattern except labeled-DOB fires on a sample of its own leak token — BANNED table entries checked against test-local samples table

### tests/pillars.test.js — 1 test
- fixtures span more than 50 years (epoch-error guard) — Math over DAY_FIXTURES test-local years only

## Appendix B — full per-file coverage (V8)

Vitest 4.1.9 + `@vitest/coverage-v8` (installed `--no-save`, removed after;
`package.json` and the lockfile untouched). Measured 2026-07-24 against this
branch at `da7bc5b` — i.e. *including* the `rowSections` test from `4df1eee`,
so the `ui/share.js` row is current rather than the pre-change figure quoted
in section 1. Suite green, 1370/1370.

Committed in full so no figure here depends on re-running the tooling. All 25
instrumented modules are listed; a text reporter hides the 100% rows, which is
why section 1 shows only the weak subset.

Regenerate with:

```sh
npm i --no-save @vitest/coverage-v8@4.1.9
npx vitest run --coverage --coverage.include='core/**/*.js' \
  --coverage.include='ui/**/*.js' --coverage.include='content/**/*.js'
npm ci   # restore node_modules exactly
```

### core/ — pure calculation

| module | statements | branches | functions | uncovered functions |
|---|--:|--:|--:|---|
| `core/rising.js` | 93.8% (76/81) | 81.0% (34/42) | 100.0% (11/11) | — |
| `core/cities.js` | 96.6% (28/29) | 93.3% (14/15) | 100.0% (5/5) | — |
| `core/payments.js` | 96.7% (59/61) | 95.5% (42/44) | 100.0% (12/12) | — |
| `core/engine.js` | 97.1% (34/35) | 93.3% (14/15) | 100.0% (4/4) | — |
| `core/profile.js` | 97.2% (105/108) | 89.0% (105/118) | 100.0% (18/18) | — |
| `core/calendar.js` | 97.3% (144/148) | 93.8% (30/32) | 100.0% (12/12) | — |
| `core/birthcard.js` | 100.0% (10/10) | 100.0% (2/2) | 100.0% (2/2) | — |
| `core/countries.js` | 100.0% (5/5) | — (0/0) | 100.0% (3/3) | — |
| `core/math.js` | 100.0% (7/7) | — (0/0) | 100.0% (4/4) | — |
| `core/pillars.js` | 100.0% (19/19) | 100.0% (6/6) | 100.0% (4/4) | — |
| **subtotal** | **96.8%** (487/503) | **90.1%** (247/274) | **100.0%** (75/75) | |

### ui/ — DOM controllers

| module | statements | branches | functions | uncovered functions |
|---|--:|--:|--:|---|
| `ui/readings.js` | 22.0% (101/459) | 33.2% (72/217) | 33.3% (18/54) | 36 (incl. `(anonymous_32)`, `(anonymous_40)`, `(anonymous_41)`, …) |
| `ui/share.js` | 52.5% (73/139) | 50.5% (55/109) | 44.0% (11/25) | 14 (incl. `(anonymous_15)`, `(anonymous_16)`, `(anonymous_17)`, …) |
| `ui/modals.js` | 87.9% (58/66) | 66.7% (34/51) | 84.6% (11/13) | `(anonymous_11)`, `(anonymous_7)` |
| `ui/citysearch.js` | 88.3% (98/111) | 69.6% (39/56) | 100.0% (12/12) | — |
| `ui/payments.js` | 89.9% (98/109) | 83.0% (39/47) | 88.0% (22/25) | `(anonymous_17)`, `isPaywallOpen`, `setPendingProfile` |
| `ui/concordance.js` | 92.1% (70/76) | 88.7% (63/71) | 100.0% (14/14) | — |
| `ui/meanings.js` | 94.7% (144/152) | 83.0% (78/94) | 100.0% (19/19) | — |
| `ui/tiers.js` | 98.6% (145/147) | 86.6% (149/172) | 100.0% (25/25) | — |
| `ui/labels.js` | 100.0% (15/15) | 100.0% (6/6) | 100.0% (5/5) | — |
| `ui/profile.js` | 100.0% (83/83) | 84.5% (60/71) | 100.0% (8/8) | — |
| **subtotal** | **65.2%** (885/1357) | **66.6%** (595/894) | **72.5%** (145/200) | |

### content/ — shipped data batches

| module | statements | branches | functions | uncovered functions |
|---|--:|--:|--:|---|
| `content/cards.v1.full.js` | 100.0% (1/1) | — (0/0) | — (0/0) | — |
| `content/concordance.v1.js` | 100.0% (10/10) | — (0/0) | — (0/0) | — |
| `content/concordance.v2.js` | 100.0% (2/2) | — (0/0) | — (0/0) | — |
| `content/meanings.v1.js` | 100.0% (4/4) | — (0/0) | — (0/0) | — |
| `content/meanings.v2.js` | 100.0% (6/6) | — (0/0) | 100.0% (1/1) | — |
| **subtotal** | **100.0%** (23/23) | **—** (0/0) | **100.0%** (1/1) | |

**All instrumented files:** statements 74.1% (1395/1883) · branches 72.1% (842/1168) · functions 80.1% (221/276).

Line coverage is the weakest of the four signals in this audit — section 4
shows `core/cities.js` at ~97% lines and 14.8% mutation score. Read this table
with the mutation listing, not instead of it.
