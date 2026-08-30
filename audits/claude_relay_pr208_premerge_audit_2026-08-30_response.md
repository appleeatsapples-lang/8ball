# Cross-model pre-merge audit — PR #208

**PR:** #208 — Mobile submit fixes + gender-ask removal + boot scrub
**Branch:** `claude/eight-ball-app-testing-rqphfo` (forked from `origin/main` @ `249def4`)
**Head reviewed:** `ac4b965` (the four-commit PR as opened)
**Date:** 2026-08-30
**Auditor:** in-container relay — three independent Claude-family lanes
(opus + sonnet + haiku), each on fresh context against the full diff with
the same adversarial brief, reconciled by the authoring session (fable).

## What this artifact is, and is not

The usual codex/grok relay lanes are not reachable from the remote
container this session runs in, and the controller directed the audit to
run here. Three genuinely independent model lanes reviewed the diff
without access to each other or to the authoring context; the reconciler
is the change's author, so every lane finding was re-verified against
source (and, where marked, by mutation or live-fire) before disposition —
but a reader should weight this as a same-family relay with an
author-reconciler, not as the codex/grok fan-out. Per L48 this response
does not self-clear the PR: merge stays with the controller.

## Verdicts

- haiku: **SAFE TO MERGE** (2 MED, self-disposed non-blocking)
- sonnet: **MERGE WITH FIXES** (1 MAJOR, 1 LOW — both confirmed)
- opus: **MERGE WITH FIXES** (5 MED, 5 LOW — mutation-verified)
- **Reconciled: MERGE WITH FIXES — all six fix-class findings are now
  fixed and re-verified in this response's commit. SAFE TO MERGE per this
  artifact's own read, pending the controller's read and the explicit
  merge word (§10/L48).**

## What was reviewed

The full PR diff vs `origin/main` (1676 diff lines, 19 files): the two
`ui/experience.css` mobile-submit commits with
`tests/mobile_submit_reveal.test.js`, the gender-ask removal across
`core/profile.js` / `ui/kua.js` / `ui/profile.js` / `ui/readings.js` /
`ui/dyad.js` / `index.html` with 16 reworked pins, and the three boot
scrubs with their tests. Lanes ran the full suite (opus: twice, plus 13
mutations in an isolated tree; sonnet: twice, plus a standalone
reproduction spec against the live `ui/citysearch.js`), the product
auditor, and (opus) live-fire across seven viewports. The four journal
entries shipped in the PR were treated as claims to re-verify, not as
evidence.

## Findings — fixed in this response

1. **MAJOR (sonnet F1, confirmed by reconciler + live-fire) — a late-
   resolving city search reopened the listbox after blur, re-hiding the
   sole mobile submit.** `ui/citysearch.js`'s blur handler scheduled the
   120ms `clearSuggestions` but never invalidated the in-flight search:
   a fulfillment landing after blur passed both stale-guards (generation
   unchanged, input value unchanged) and called `renderSuggestions` →
   `aria-expanded="true"` with focus gone — and the PR's new CSS
   contract hides `#enter-btn` on exactly that attribute. Realistic
   timeline: the first search of a session imports `cities.json` (real
   fetch + parse), and "type, then tap the next field" is the ordinary
   mobile gesture. A materially attenuated recurrence of the dead-end
   class commit `36023d1` exists to close; the old `:focus` rule could
   not be hit this way, so the impact is introduced by this PR.
   **Fixed:** blur now bumps `_searchGeneration`, cancels the debounce,
   and clears busy/status, so any pending fulfillment self-discards
   (the same mechanism `reset()` already used). Regression test added
   (pending promise resolved after blur → `aria-expanded` stays
   `"false"`, nothing rendered, no stale "searching…" line);
   mutation-verified red on the unfixed handler. Live-fire verified in
   Chromium with `cities.json` throttled to 1.5s: late fulfillment
   lands discarded, submit stays visible, zero console errors.

2. **MED (opus F1, mutation-verified) — the scrubs' "surgical" contract
   was asserted only against fixtures too thin to catch over-deletion.**
   All three scrubs could be extended to delete `time`/`city`/`cc`/`tz`/
   `lat`/`lng` with the full suite green — an every-boot, every-device
   silent data-destroyer the pins would not catch. **Fixed:** every
   scrub test now seeds the full field set its key can legitimately hold
   and asserts byte-equality of the non-gender remainder. All three of
   the lane's over-deletion mutations re-run against the new pins: each
   goes red on exactly one test.

3. **MED (opus F2, mutation-verified) — the `:focus` dead-end pin was
   scoped to the `@supports` slice.** The PR #200 regression re-added
   inside the same `@media (max-width: 480px)` block but outside
   `@supports` left the dedicated regression file green. **Fixed:** the
   pin now parses every rule in the stylesheet targeting `#enter-btn`;
   no such selector may contain `:focus`, file-wide. The lane's exact
   mutation re-run: red (2 tests).

4. **MED (opus F3, mutation-verified) — nothing pinned that the submit
   stays rendered.** `display: none` on the short-viewport `#enter-btn`
   rule removed the sole submit on every small screen with the suite
   green. **Fixed:** a hiding-inventory pin — no `#enter-btn` rule may
   set `display: none` anywhere, and the only rules allowed to hide it
   (visibility/opacity) are exactly the two reveal-contract rules inside
   `@supports`: the base hidden state and the single `aria-expanded`
   withdraw. The lane's mutation re-run: red.

5. **LOW (sonnet F2) — `scrubSavedReadingsGender` was not read-verified**,
   unlike its two siblings and unlike the journal's description of the
   shared contract. **Fixed:** the rewrite is now verified by read-back.

6. **MED (haiku M2) — the scrubs' quota/throw path was untested.**
   **Fixed:** throwing-`setItem` tests added for the profile and archive
   scrubs (returns false, stored bytes untouched).

## Findings — flagged for the controller, not fixed here

- **MED (opus F4) — the §1.G kua citation body is now rendered
  nowhere.** The removed single-gender read was the only consumer of
  `KUA_TRIGRAMS[n].body`; the both-values read (unchanged from its
  PR #199 shape) uses both lines for the two registry values. Paid t3
  users who previously set a gender lose the citation prose — an
  undisclosed reduction in paid content, and `content/kua.v1.js`'s
  `body` field is now dead content still pinned by
  `tests/kua_content.test.js` (the file itself stays untouched per §4).
  Two honest options: render the body (or bodies) in the both-values
  block, or record the removal as deliberate. Design call — the
  controller decides; recorded here and in the journal so it is no
  longer silent.
- **MED (opus F5) — DOCTRINE §1.D v0.63 / §5 / §5.E still specify the
  gender control, the stored field, and the archive-must-carry-it rule
  the code now deletes on sight.** The §5.E rationale is genuinely
  obsolete (both classical values render for every profile, so reopen
  and fresh submit are identical without the token), so the amendment is
  mechanical — but constitution text is the controller's pen, not this
  lane's. Until amended, journal-wins-over-doctrine (CLAUDE.md) is the
  governing read.
- **LOW (opus F8) — at 320×568 the revealed in-flow submit rests below
  the fold with no scroll affordance.** Recoverable (body-scroller
  wheel/touch, or implicit Enter submission — both live-fire verified by
  the lane), not a dead end; the fixed-circle alternative it replaced
  was an unconditional overlap. Worth a design pass on the smallest
  viewports at some point.
- **LOW (opus F9) — the two kua values carry two type styles**
  (`card-habit` italic vs `card-note` upright) now that the both-values
  read is the only read. Cosmetic; flagged for a 30-second design call.
- **LOW (opus F10) — `.kua-note:empty { display:none }` is unreachable
  on the entitled path** (the both-values note is never empty); it still
  serves the sealed path. Noted so the `:empty` collapse is not read as
  live entitled-path behavior.
- **LOW (haiku M1) — the scrubs fail silent on storage errors.** By
  design: the token is inert to every reader, so a failed scrub is
  residue, not exposure; disposed as consistent with the module's
  defended-read posture.

## Corrections to the shipped journal entries (opus F7)

The two gender entries transcribe the product audit as "PASS 12/0/1/0";
the auditor emits 14 checks and the actual output during those runs was
12 pass / 0 fail / 1 warn / 1 skip. The warn is `product.git_status`
(dirty working tree during in-flight verification runs — on this
response's clean-tree re-run the same auditor reports 13/0/0/1, matching
the opus lane); the skip is `product.local_pii` (needs the gitignored
local file). All other journal verification claims re-verified exactly:
suite counts, per-commit `index.html` line budgets, live-fire results.

## Verification after all fixes

Suite **57 files / 1950 tests green** (1946 + the blur-race regression,
the hiding-inventory pin, and two quota tests). Product audit PASS,
0 blocking. Mutation matrix re-run post-fix: the five lane mutations
(A `:focus` outside `@supports` · B `display:none` short-viewport ·
C/D/E scrub over-deletions) each red exactly their new pin; all
restored, green. Live-fire: throttled-search blur race (above) plus the
standard mobile flow, zero console errors. `git diff --check` clean.
`index.html` untouched by this response (1455/1500).

## Scope of this response's commit

`ui/citysearch.js` (blur invalidation), `ui/readings.js` (read-verified
archive scrub), `tests/mobile_submit_reveal.test.js`,
`tests/profile_ui.test.js`, `tests/readings.test.js`,
`tests/payments_markup.test.js`, this artifact, `journal.md`.
