# Codex pre-merge audit response — calc v4 (master-number preservation)

**Audit target:** `d03a7687aef87ab8d56f3b0b7d439c0bdebf41db`
**Branch:** `claude/master-number-preservation`
**Audit date:** 2026-07-31
**Verdict:** **DO NOT MERGE — CHANGES REQUESTED**
**Findings:** 0 P0 · 1 P1 · 2 P2

> **Filing note.** This artifact is HEAD-bound, not PR-bound: no PR exists yet, so the
> L48 CI gate's `audits/<model>_pr<N>_premerge_audit_<YYYY-MM-DD>_response.md` filename
> cannot be finalized. When the orchestrator opens the PR, this file is renamed to carry
> the real `pr<N>` (or an explicit `audits/L48_override_pr<N>_<date>.md` is filed).
> Per L48 the remediation below does NOT clear the gate: a **fresh** independent read of
> the corrected HEAD is required before merge consideration.

---

## Findings as filed

### P1 — The public-mode bridge disclosure never reaches the user

The engine correctly returns `modeKey`, `bridged`, and `bridgeNote` in `core/public.js:285`.
But the sole production formatter in `ui/public.js:45` discards all of them, returning only
`families`, `antiFit`, and `roleLine`.

Consequently, a birthday `11` or `22` silently receives base-mode copy in both the t3 block
and t5 sheets. This recreates at the rendered surface the exact silent substitution rejected
by `DOCTRINE.md:137`. Existing surface tests use a non-master birthday and cannot catch it
(`tests/public_surface.test.js:52`).

**Recommendation:** carry the bridge note into the visible formatted output and test
birthdays 11 and 22 at the host and dyad surfaces, including sealed-state clearing.

### P2 — Active state references still name the retired facet key

The current persistence row correctly names `_v3`, while the same current-state table later
names `_v2` in `8BALL.md:77`. The active dyad-sheet comment also names `_v2` in
`ui/sheet.js:184`. Similar stale active-module references remain in test helper comments.

Runtime migration is correct; this is canon/source drift. Update current statements to `_v3`,
preserving genuinely historical `_v2` text as explicit lineage.

### P2 — `meanings.v3` duplicates rather than structurally carries v2 themes

`content/meanings.v3.js:43` imports only element/context data from v2, then restates all nine
existing themes at lines 55–59. The output currently matches v2, but the claim that those
themes are "carried across unchanged" is not structurally enforced, and tests do not compare
the nine v3 themes with v2.

**Recommendation:** build v3 from v2's nine active entries plus the three master entries, or
add an exact cross-version theme pin.

## Verified clean (at `d03a768`)

* Vitest: 51 files / 1,814 tests passed
* Auditor assurance: 93/93 passed
* Product audit: 13 pass / 0 fail / 1 disclosed warning
* Local PII audit: clean, 854 files
* `git diff --check`: clean
* `index.html`: 1,497 lines, unchanged
* Historical content files and `package.json`: byte-unchanged
* Facet `_v1`/`_v2` clearing, master brackets, Concordance, dyad reduction, and calculator
  outputs verified
* Repository remains unchanged with the same three disclosed untracked paths

**Environment note (auditor's own):** the supplied workspace was an empty repository; the
matching checkout was `/Users/8ball/dev/8ball`.

---

## Disposition (implementer, same day)

All three findings **accepted without dispute**. None is contested; the P1 in particular is
correct on its own terms and on the branch's own stated terms — DOCTRINE §1.D v0.62 names
silent substitution as the wrong fix in the same clause whose implementation performed it at
the render surface.

### P1 — FIXED

* `ui/public.js` `formatPublicRead` returns a fourth string, `bridge`, carrying the engine's
  own `mode.bridgeNote` when `mode.bridged` and `''` otherwise. Still no copy of its own:
  every rendered string is the engine's, joined or passed through.
* `renderPublicRead` writes it to a `.public-bridge` node and clears it on the sealed branch
  and on any subsequent unbridged render.
* `index.html` is **byte-identical**. The node and its scoped CSS are injected by
  `ui/public.js` at init in the §6 v0.23 DI shape `ui/meanings.js` and `ui/dyad.js` already
  use, so the host's four-id boot wiring — pinned by this suite — is unchanged.
* The node collapses on `:empty`, **not** the `hidden` attribute. This repo has a logged case
  of an author `display:` rule beating the UA `[hidden]` rule and shipping a "hidden" control
  visible in production (the F1 bug class, pinned in `tests/public_surface.test.js`);
  `:empty` keys off the node's actual content, so there is no attribute for a cascade to
  override.
* `ui/sheet.js` emits `data-sheet-public-bridge` in both dyad sheets, fills it on the same
  branch as the other three, and — because the node joins `valueNodes()` — `clear()` scrubs
  it without a second edit. A second person with a master birthday gets the same disclosure
  the first does.
* **Tests added** (the gap the finding names — every prior surface case used a non-master
  birthday): both reachable master birthdays driven end-to-end through the real engine,
  formatter and render on the host block and on a real `createSheet(...).render(...)`;
  sealed-state clearing; `clear()` scrubbing; a **non-master-after-master** render (both
  entitled, so the sealed branch never runs — the case a per-branch clear would miss);
  a direct `formatPublicRead` pin so the render layer is not the only thing between the
  engine's disclosure and the reader; and a structural pin that the node is injected rather
  than added to `index.html`.
* DOCTRINE §1.D v0.62 records the correction in the clause itself rather than only in the
  journal, per the §1.J PR #187 precedent; §7's v0.62 extension names the new pins.

### P2 (facet key) — FIXED

* `8BALL.md:77` content-version row → `eight_ball_facet_index_v3`, naming `_v1`/`_v2` as
  retired generations.
* `ui/sheet.js` render comment → `_v3`, with the retired generations named as such.
* `tests/readings.test.js` untouched-payment-keys pin now seeds **all three** generations —
  it named two, so it would have greened while the archive scrubbed the active key.
* `DOCTRINE.md` §5 `_v2` bullet carries an explicit RETIRED/lineage marker; its body is
  preserved verbatim per L17, and §1.H v0.62 / the `_v3` bullet remain the current authority.

### P2 (`meanings.v3`) — FIXED

* `content/meanings.v3.js` now imports v2's `NUMEROLOGY_MEANINGS` and spreads it, authoring
  only the three master themes. The carry-over is structural; there is no second list to
  drift.
* A cross-version test pins every v2 entry present in v3 with identical `theme` / `register`
  / `body`, and pins that the difference between the two registries is **exactly**
  `['11','22','33']` — so a fourth addition fails CI rather than arriving unreviewed.

### Post-remediation gate state

* Vitest: **51 files / 1,824 tests passed** (was 1,814; +10 for the disclosure and
  cross-version coverage)
* Self-audit: 28 findings filed by six adversarial lenses, 27 refuted, 1 confirmed and fixed
  (DOCTRINE §1.C, above)
* Auditor assurance: 93/93 passed
* Product audit: 13 pass / 0 fail / 1 disclosed warning (`product.git_status`, the three
  known untracked paths)
* Local PII audit: clean
* `index.html`: 1,497 lines, byte-identical
* Historical content files and `package.json`: byte-unchanged
* Browser live-fire re-run against the corrected branch, master birthdays included

### Self-audit after remediation (implementer, same day)

Rather than trust a second green suite, a 35-agent adversarial verification was run over the
corrected branch: six independent lenses — production reachability, sealed-DOM purity,
doctrine-vs-code contradiction, test integrity (would each new test fail if the fix were
removed), a completeness critic sweeping every consumer of a numerology coordinate for OTHER
instances of the P1's defect class, and immutability/versioning — with every finding handed to
an independent skeptic whose default verdict was "refuted".

**28 findings filed · 27 refuted · 1 survived.** The survivor was the same class Codex filed:
`DOCTRINE.md:69` (§1.C) still asserted in active voice that the life-path reduction in
`core/profile.js` "floors at a single digit `1..9`". Calc v4 makes that false, no v0.62
amendment had touched §1.C, and `git log -G "pre-calc-v3 lineage"` shows the calc v3 commit
(`7d3285a`) rewrote that exact parenthetical in lockstep with its own calculation change — so
this document's history treats the line as calc-version-coupled rather than transitively
superseded. Fixed in the same shape, with the superseded wording preserved as lineage per L17
and the birth-card contract (`22 → 0 · the fool`) restated as untouched.

Two results worth recording because they are negative: the **completeness critic found no
other** nine-valued table, range assumption, layout assumption, regex or nine-arm lookup
reached by a twelve-valued input anywhere in `core/`, `ui/`, `content/` or `index.html`; and
the **immutability lens re-confirmed** zero lines changed in every shipped content file,
`package.json` and `index.html`.

**Status: STAGED.** L48 is not cleared by this disposition. A fresh independent Codex read of
the corrected HEAD is required before merge consideration, and the merge itself is the
controller's.
