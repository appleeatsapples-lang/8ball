# PR #215 pre-merge cross-model audit — reconciled response

**PR:** 8ball #215 — shell-stylesheet split: index.html 1455 → 683 lines
**Base → head:** `1732f13` → `25ddbb6` at audit start; the branch moved to
`36c231c` mid-audit (the first lane's HIGH, fixed immediately) and the remaining
findings below land in the reconciliation commit on the same branch.
**Process:** DOCTRINE §10 two-lane adversarial review, relayed through the CC
lane. Both lanes received the same brief, the full diff, and repo access; each
independently verified the byte move, ran the suite and the auditor, and
mutation-tested in scratch trees.

## Lane verdicts

| Lane | Verdict | Findings |
|---|---|---|
| Lane A | MERGE WITH FIXES | 2 (1 HIGH, 1 LOW) |
| Lane B | MERGE WITH FIXES | 11 (1 HIGH, 4 MED, 4 LOW, 2 NIT) |

The two HIGHs are the same defect, found independently. **Reconciled outcome:
MERGE WITH FIXES — every fix-class finding landed; verified below. Final call
remains with the controller per L48.**

## Findings and dispositions

**HIGH (both lanes, mutation-proven) — a CSS negative guard degraded into a
tautology.** `tests/kua_surface.test.js` still sliced index.html's `<style>`
block; with the block gone, both `indexOf` calls return −1 and the slice is
`''`, so the "no kua CSS in the shell" pin passed unconditionally — a
`.kua-read` rule appended to `ui/shell.css` left the whole suite green.
**Landed** (mid-audit, `36c231c`): repointed to the combined shell source;
re-verified by both lanes that the mutant now fails.

**MED ×3 (Lane B, each mutation-proven silent) — three more negatives lost
their subject.** `tests/tiers.test.js` (`.coord-cell.locked`),
`tests/labels_reveal.test.js` (the `.flip-stage.labels-revealed` ownership
guard — its title and comments also still named index.html as the side-rail
block's owner), and `tests/payments_markup.test.js` (the `reads-chip` and
`locked-extras` retirement guards' CSS halves) all scanned bare `html`, which
now contains no CSS. **Landed:** all repointed to the combined shell source;
labels' title/comments corrected to name `ui/shell.css`. Each revived guard
mutation-verified.

**MED (Lane B) — the dated §6 amendment shipped with no footer version
entry.** The constitution's own version marker still read v0.65 while §6
carried a new dated block. **Landed:** footer bumped to
`2026-08-31 · v0.66 (§6 — the shell stylesheet …)`, v0.65 demoted to prior,
v0.64 to superseded, matching `- v0.66:` changelog line added.

**LOW (Lane B) — 771 lines left §5 scan coverage.** The privacy scan's
`TEXT_EXTS` was `.js`/`.html` only, so `ui/shell.css` — and the pre-existing
`ui/experience.css` — were scanned by nothing, and the CSS egress shapes §5
cares about (`@import`, remote `url(…)`) had no scanner at all. **Landed:**
`.css` added to the scan walk plus four egress tokens (`@import`,
`url(http`, `url('http`, `url("http`); the product tree is clean against all
of them.

**LOW (Lane B) — the canonical inventory omitted the stylesheets.**
**Landed:** CLAUDE.md's `ui/` line now names `shell.css` (linked first) and
`experience.css` (linked second) as the two host stylesheets, worded so the
regex-pinned `(15 modules` shape is untouched; `tests/repo_shape.test.js`
green.

**LOW (Lane B) — 8BALL.md/README.md single-file wording contradicted the new
§6.** **Landed:** both now admit the `ui/*.css` split target / name
`ui/shell.css` as the styles home.

**LOW (Lane B) — the no-inline-`<style>` pin had no constitutional basis.**
**Landed** via the amendment route the lane offered: §6's shell-stylesheet
amendment now states the rule explicitly and names the pin, and records that
critical-CSS inlining would be a fresh amendment, not an exception.

**LOW (Lane A) / verification note 4 (Lane B) — FOUC blast radius.** The
split trades inline CSS's delivery guarantee: a failed `/ui/shell.css` fetch
renders the whole page unstyled, where before only the `experience.css`
layer was exposed to fetch failure. Both lanes rate it the accepted cost of
any inline-to-external split (same-origin, atomic Netlify deploys, the
`experience.css` precedent). **Acknowledged on the record** in the journal
and this artifact; no code change.

**NIT (Lane B) — the hidden-guard walker could widen for free.** **Landed:**
`tests/public_surface.test.js`'s `[hidden]`-override scan now reads
`ui/experience.css` too (its 9 `display:` rules had never been checked
against the hidden-shipping elements; zero live exposure today).

**NIT (Lane B) — the new link pin's soft edges.** **Landed:** the two links
are matched by href regex (attribute-order-proof) and compared by position;
the non-vacuous floor rose from 10KB to 20KB after the lane showed a 58%
truncation passing the old floor.

## Reconciled verification (post-fix head)

- Byte identity re-confirmed by both lanes independently: sha256 of the
  removed inline block equals the stylesheet body under its header comment.
- Cascade equivalence proven at runtime by Lane B: 37 selectors × 36
  properties + the 9 `:root` tokens, static and post-flow, at free/t3/t5 ×
  three viewports — identical old-vs-new; `document.styleSheets` order and
  count match; no runtime CSS introspection exists in the product to break.
- Netlify servability confirmed (non-forced catch-all, `ui/` untouched by
  the build command, `experience.css` precedent).
- Full suite green including every revived guard; all reconciliation
  mutants red (five silenced-guard mutants, link-order swap, inline-`<style>`
  reintroduction, shell-rule deletion, palette-scan mutant in
  `experience.css`, 58% stylesheet truncation).
- `audits/project_audit.py` PASS, 0 blocking; the auditor assurance suite
  carries only the documented container-only `test_guard_can_fail` failure.

qualifier: recorded, not certified. Merge authority remains the controller's.
