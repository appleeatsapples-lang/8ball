# Cross-model pre-merge audit — PR #196

**PR:** #196 — fix(mobile): keep revealed-label flip-stage from overlapping the result rail
**Branch:** `claude/ios-threads-labels-layout-1wfe6h` (forked from `main` at 67d0bde, two docs/audits-only commits behind `origin/main`; trial-merge clean, no overlap with #194/#195 files)
**Date:** 2026-08-02
**Auditor:** Claude Code session (claude-fable-5), running (a) a 12-agent adversarially-verified
review workflow — four independent dimensions (CSS correctness, test load-bearing-ness via live
mutation testing, doctrine/project-law compliance, regression blast radius), each finding
re-derived by an independent refutation-first verifier, plus a completeness critic — and
(b) a `relay --base origin/main` cross-model fan-out (grok + claude reviews reconciled by claude;
codex refused per its lane's process gate, a procedural non-finding; gemini errored on auth), and
(c) direct local verification: full vitest suite, the product auditor and its assurance suite, the
local PII audit, and a real-browser live-fire pass at mobile and desktop viewports, including
counterfactual (fix-removed) and frozen mid-flip states.

## Verdict

**MERGE WITH FIXES → all four fixes landed on this branch, now SAFE TO MERGE**
(pending operator's own read of this artifact; merge authority stays with the controller per L48).

## What was reviewed

The full PR diff against `origin/main` (`index.html` one-line DI wiring, `ui/labels.js`
class-toggle + self-injected mobile stylesheet, `tests/labels_reveal.test.js` source pins,
`tests/meanings_behavior.test.js` behavior assertions), the flip-stage geometry it modifies
(`index.html` flip/side-rail CSS), every caller of `initLabelsUI`/`applyLabelsState`, the
sheet/dyad/share/readings surfaces for class or stylesheet leakage, and the §5/§6/§7/§12
constraint surface (no new localStorage keys, no fetch/analytics/deps, single-file budget,
repo-shape counts, PII scanner surface).

## Findings

### Blocking (fixed on this branch before merge)

1. **HIGH — the load-bearing CSS declaration was unpinned; the new tests passed with the fix
   deleted.** The base `.flip-stage` rule in `index.html` sets no `height` — only the 5/8
   `aspect-ratio` box — so the injected `height: auto` is a no-op declaration and
   `aspect-ratio: auto` is the property that actually releases the fixed box. The new test pinned
   only `height:\s*auto`: deleting `aspect-ratio: auto` left the whole suite green while the
   mobile overlap defect returned. Found by grok in the relay fan-out, verified by the relay
   reconciler against `index.html`, and re-verified here both by regex analysis in the live DOM
   and by mutation run. This is the third instance of the vacuous-pin defect class this repo has
   caught in pre-merge review (journal 2026-08-01, 2026-08-02).
2. **HIGH — `injectStyle()` was a silent no-op in every test run; the CSS payload (the fix's
   entire delivery mechanism) could be deleted without any test noticing.** In the vitest Node
   environment `document` is undefined, so the function's own guard returned before its first
   line of real work; no test stubbed a document for it, and the source pins only asserted the
   function's text existed, not that init calls it. Found independently by grok (relay) and by
   the workflow's mutation-testing dimension; the workflow's adversarial verifier reproduced the
   uncaught mutation in a scratch tree (P1, not refuted).
3. **MEDIUM — the blanket `.card-back { height: auto }` collapsed the card back to a ~115px
   clipped strip inside the still-951px stage during every pre-flip back-beat with labels
   revealed.** `showResult` and `shakeAgain` both land on the back face for ~300–320ms before
   flipping; the revealed-labels class stays applied throughout, so mobile users with the
   preference on saw a content-height sliver (the logo glyph clipped mid-render) floating above
   ~800px of empty stage on every submit and FLIP AGAIN. Found by the workflow's CSS-correctness
   dimension, confirmed by its verifier via independent live reproduction, and reproduced here
   with measured geometry (115.0px back vs 951.1px stage) and a frozen-state screenshot.
4. **LOW — fractional-width viewports between 719px and 720px matched neither the fix's
   `max-width: 719px` block nor the desktop `min-width: 720px` rail, re-exposing the original
   overlap in that band** (browser zoom produces fractional CSS viewport widths). Found by the
   workflow's CSS-correctness dimension; verifier empirically confirmed the hole.

### Adjudicated non-blocking (documented, not fixed here)

- **≥720px WebKit viewports are outside the fix's scope** (iPad portrait/landscape, phones in
  landscape). There the rail sits beside the card, so the overlap this PR fixes cannot occur;
  if WebKit's non-growth premise holds there, revealed-label content can still overflow the
  stage box downward into empty page flow below `#result`-main — a pre-existing, lower-harm
  geometry this PR deliberately does not touch (its own tests pin the desktop block as
  untouched). Workflow verifier: confirmed as accurate scope description, P3, not a defect
  introduced here. Tracked as a possible fast-follow only if field reports surface it.
- **The WebKit non-growth premise itself remains unverified in a real WebKit engine.** The
  code comment says so honestly. Local verification options were exhausted: Chromium
  counterfactual (style removed) shows the stage grows anyway in that engine — confirming both
  that the defect is WebKit-specific and that the fix is a no-op-safe belt in Chromium;
  `safaridriver` on this machine requires the operator to enable Safari's "Allow remote
  automation"; no Xcode/iOS-simulator runtime is installed; Playwright's WebKit build is not
  cached locally. The fix's mechanism (intrinsic `auto` sizing at every level) is
  engine-independent by construction, which is the design's own mitigation for exactly this
  unverifiable premise.
- **`flipStage` is an unguarded required ref** (`applyLabelsState` throws if a future caller
  omits it). The workflow's adversarial verifier REFUTED this as a defect: the caller inventory
  is exhaustive (one real call site, wired correctly; one test mock, wired correctly), no live
  path throws, and unguarded required refs are the module's existing DI convention (`cardFace`
  and `labelsToggle` are equally unguarded). Not actioned.
- **Stale branch base** (two commits behind `origin/main`, both docs/audits-only). Trial merge
  is clean; the merged tree was built and fully re-verified. No rebase performed mid-audit, per
  this repo's own recorded rerere/sighting-collision hazards.

### Clean dimensions

Doctrine/project-law: **clean across all seven checks** — empty `package.json` diff, no new
localStorage/fetch/analytics tokens, `index.html` at 1497/1500 on both the PR head and the merged
tree, repo-shape counts still true (12 core / 13 ui / 51 test files), PII and privacy scans green,
journal-touch gate not triggered (no DOCTRINE/content files), DI shape and the self-injected
stylesheet pattern both genuinely precedented in `ui/dyad.js`. Blast radius: sheet/dyad/share/
readings surfaces build their own DOM and consume neither the `flip-stage` classes nor the
injected stylesheet; the boot path (`applyLabelsState(isLabelsRevealed())`) is wired and was
live-verified to restore the stored preference onto both elements in lockstep after reload.

## Disposition

All four blocking/fixed findings landed on this branch in one audit-fix commit:

- `aspect-ratio: auto` is now pinned by a dedicated test alongside the `height: auto` pin.
- `injectStyle` gained a behavioral test that stubs a document the way
  `tests/dyad_surface.test.js` does for `ui/dyad.js`: it asserts init creates `#labels-style`
  with the real payload (the `aspect-ratio: auto` rule and the media query) and that a second
  init is idempotent (exactly one append).
- The auto-height override now targets only the front card; `.card-back` keeps `index.html`'s
  `height: 100%`, which resolves against its grid-stretched `.flip-side` once the front's
  content has sized the row — definite in every engine, a different mechanism from the
  aspect-ratio non-growth this PR works around. A test pins both the narrowed selector and the
  absence of any `card-back` override.
- The media bound moved to `max-width: 719.98px`, the standard fractional complement of the
  720px breakpoint; the breakpoint pin and the behavioral payload assertion both updated.

**Every new or updated guard was proven load-bearing by live mutation, not just written** —
five mutations, each reverted before the next, each run against the two test files:
deleting `aspect-ratio: auto` fails 2 tests; commenting out the `injectStyle()` call fails 1;
restoring `.card-back` into the override fails 1; reverting `719.98px` to `719px` fails 2;
deleting the `flipStage` class toggle fails 2 (the PR's own pre-existing pin, still armed).
Restored baseline: green.

## Recorded verification runs (this session, local)

- PR head (23945d09): vitest **51 files / 1841 tests green**; auditor assurance suite **93/93
  OK**; `audits/project_audit.py` **PASS 14/14** (with the operator-local PII pattern file
  copied in); `audits/run_local_audit.sh` **clean, 837 files**; `index.html` 1497/1500.
- Merged tree (`origin/main` + PR + audit fixes): vitest **51 files / 1844 tests green**
  (+3 from the audit's added tests); `audits/project_audit.py` **PASS 13 + 1 info-level skip**
  (`product.local_pii` — pattern file absent in a fresh worktree, the auditor's documented
  expected state); `index.html` 1497/1500.
- Amended branch tip: full suite re-run green before commit (recorded in the PR conversation).
- Live-fire, real browser (Chromium engine), serving the merged tree:
  - 375×812: real form submit → flip → reveal. Stage grows 735.8 → 951.1px with
    `aspect-ratio: auto` computed; card content ends inside the stage; result rail sits 14px
    below it — the exact seam the defect corrupts. Round-trip (hide) returns the 5/8 box
    byte-for-byte. Counterfactual with the injected style removed: Chromium grows the stage
    anyway — the defect is WebKit-specific, the fix Chromium-inert, exactly as the code
    comment claims.
  - Back-beat, frozen mid-flip with labels revealed: card back **115px (clipped) before the
    fix commit → 951.1px (fills the stage) after**, screenshot-verified both ways.
  - Boot path: stored preference restored onto both elements in lockstep on reload; exactly
    one `#labels-style` node.
  - 1280×800: mobile rule inert (5/8 ratio and `flex-basis: 360px` restored), rail beside the
    card, tops aligned. Desktop side-rail untouched.
  - Zero console errors throughout; test-only localStorage state cleared afterward.

## Full reconciliation output

`~/ai-relay/runs/20260802-023058-8ball-pr196-audit/RECONCILIATION.md` (operator-local,
off-repo — this file is the in-repo summary the L48 gate requires). Workflow transcripts under
the session's `subagents/workflows/wf_034c8331-26b/` directory, same machine.

## Recommendation

Merge on CI green after this artifact lands on the PR head. The audit-fix commit and this
artifact ship together; nothing else is queued on the branch.
