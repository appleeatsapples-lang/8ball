# CODEX PRE-MERGE AUDIT PACKET — PR #129 (rowSections fail-closed: §5.D enforced + #126 errata) — 2026-07-26

## Who you are and what this is
You are an independent pre-merge auditor for PR #129 of the 8ball
repository (local checkout: ~/dev/8ball, branch
`claude/share-rowsections-fail-closed`, base origin/main @ b459fda).
The project is a static single-page divination web app (no backend, no
analytics; Netlify). Layers: index.html · core/ (pure calculation) ·
ui/ (DOM controllers) · content/ (versioned data) · tests/ (vitest).
The privacy law that matters here: paid-tier ("sealed") coordinate
values must NEVER reach the share artifact (§5.D) — the PNG/SVG bytes
and the caption both derive from one snapshot layer.

Rules that bind this audit:
- A PR may not merge until an auditor who did not write it returns a
  verdict. You are that auditor; re-derive every claim yourself.
- READ-ONLY lane plus test runs. No edits, commits, pushes, or fixes.
- Do not create branches; leave the checkout exactly as found.

## Context (why this PR exists)
The #126 pre-merge audit (`audits/codex_pr126_premerge_audit_2026-07-25_response.md`)
found F2 (Med): `rowSections()` in ui/share.js was not fail-closed —
only exact `state === 'sealed'` stripped a value; a missing, unknown,
or `unres` state wrongly carrying a value passed it into both the SVG
and the caption. Its staged fix was required before #126's merge but
never landed; #126 merged with only an `export` keyword change. The
#128 cycle recorded that miss in the release log (L48
presence-vs-content sighting) and queued this dedicated fix cycle,
which the controller then worded. This PR is that fix: the staged
whitelist, the staged adversarial pins, and the same audit's staged
F3/F4 errata. The l48-gate is expected RED on this PR until the pr129
response artifact lands — this brief precedes the verdict.

## What the PR claims
- ui/share.js `rowSections` (sole code change): fail-closed whitelist —
  exact `open` carries its value; exact `unres` carries `—`; any other,
  missing, or malformed state (including a null cell, which previously
  coerced to state `open`) returns `{state:'sealed', value:''}`.
- Well-formed producer output is byte-identical: `shareRowRefs`
  (ui/tiers.js, untouched) emits `open`+live text, `unres`+`—`,
  `sealed`+`''` — all three round-trip unchanged.
- tests/share_surface.test.js: four adversarial pins added beside the
  existing sealed-strip pin, matching the #126 audit's staged list —
  missing state, unknown state, unres-with-value, null cell. No new
  test FILE (repo_shape and CLAUDE.md counts untouched). Suite claim:
  40 files / 1432 tests (+4 over main's 1428).
- Errata (append-only, per the #126 audit's F3/F4 staged dispositions):
  `audits/test_quality_audit_pr126_2026-07-24.md` gains base-sha +
  jsdom-framing errata; `audits/mutation_survivors_core_2026-07-24.md`
  gains companion-filename + rounding-vs-counts errata; the F2/F4
  disposition rows in `audits/codex_pr126_premerge_audit_2026-07-25_response.md`
  gain FIXED markers per their own pre-authorized "flips to FIXED in
  the fix commit" wording. Nothing above the appends rewritten.
- journal.md: one new STAGED entry at top; every pre-existing entry and
  the tracker lines byte-unchanged.
- UNTOUCHED: core/, content/, index.html, ui/tiers.js,
  tests/fixtures.json, DOCTRINE.md, CLAUDE.md, README.md.

## Adversarial checklist
1. DIFF PERIMETER. `git diff --name-status origin/main...HEAD` — exactly
   ui/share.js, tests/share_surface.test.js, journal.md, the three
   #126-record audits files, plus the pr129 brief (and later response).
   `git diff origin/main...HEAD -- core/ content/ index.html ui/tiers.js
   tests/fixtures.json DOCTRINE.md CLAUDE.md README.md` must be EMPTY.
2. THE LEAK WAS REAL AND IS CLOSED. On origin/main, reproduce the F2
   constructions through `rowSections` (unres+value, missing state,
   unknown state, null cell) and confirm the value survives into the
   snapshot. On HEAD, re-run the same constructions — every malformed
   shape must come back `{state:'sealed', value:''}` (or `unres`+`—`),
   and the value string must be absent from the produced SVG AND the
   caption. Then try to construct any input that still leaks: state
   with trailing whitespace, numeric/object values, prototype tricks,
   a value smuggled on a sealed cell, nested cells arrays. The
   guarantee point is rowSections — confirm the live flow (buildCardSVG
   / buildCaption) routes exclusively through it, and name any runtime
   path that reaches `buildCardSVGFromSnapshot` / `buildCaptionFromSnapshot`
   without passing rowSections.
3. WELL-FORMED BYTE-COMPAT. Read `shareRowRefs` in ui/tiers.js: enumerate
   the exact shapes it can emit and prove each round-trips the new
   whitelist unchanged. The pre-existing share suites must be untouched
   by this diff (additions only in share_surface.test.js) and green —
   run `npx vitest run tests/share_surface.test.js tests/share_behavior.test.js`
   isolated, then the full `npm test` (claim: 40 files / 1432 tests).
4. PINS ARE REAL. Spot-read the four new tests: behavioral assertions on
   rowSections output (not regex-on-source), and together they cover the
   audit's staged list exactly. Name any staged case left unpinned.
5. ERRATA TRUTH. Re-derive each erratum yourself: actual merge-base of
   the #126 branch (claim: 7cd0947, header said a9103a7); the survivor
   record's companion-filename cite; the two count-derived scores
   ((killed+timeout)/total: 843/1363 → 61.8% vs displayed 61.9%; 73/74 →
   98.6% vs displayed 98.7%); the jsdom restatement (both new suites use
   hand-built doubles, not jsdom). Confirm the blocks are PURE APPENDS —
   no pre-existing byte in either record changed — and the FIXED flips
   in the pr126 response append to, not rewrite, the disposition cells.
6. JOURNAL + GATES. New entry newest-at-top, `## YYYY-MM-DD — Title —
   STATUS` shape, tracker lines byte-unchanged, claims match the diff.
   Scans: privacy_scan (no new localStorage key, no fetch/XHR/beacon in
   the diff), pii_scan, `/bin/bash audits/run_local_audit.sh` if the
   pattern file exists. index.html line count untouched. l48-gate:
   NOT docs-only (two .js files) → the gate requires
   `audits/codex_pr129_premerge_audit_2026-07-26_response.md` on-branch;
   confirm the filename letter is satisfiable and, once the response is
   filed, satisfied.
7. SCOPE CREEP HUNT. The fix must not alter tier entitlement, density,
   catalog, engine inputs, persistence, or network behavior; no R2 /
   credits / pricing semantic anywhere in the diff. The share PNG for
   every well-formed device state must be byte-identical to main's.

## Required output shape (so the verdict files cleanly)
- Line 1: `Verdict: MERGE` | `MERGE WITH FIXES` | `NO-GO`
- Findings table: # | High/Med/Low | finding | evidence (file:line/output)
- Then: the exact commands you ran and what they returned.
Zero findings is acceptable only after you actually ran the checks.
