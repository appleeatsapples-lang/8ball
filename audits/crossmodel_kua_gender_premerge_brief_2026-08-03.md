# CROSS-MODEL PRE-MERGE AUDIT PACKET — kua block + optional gender input (§1.D v0.63) — 2026-08-03

=== PROMPT START ===

## Authority and lane

You are the independent, read-only auditor for the kua/gender branch. The
change was written by a Claude Code lane under an explicit controller
override of the product-surface freeze (vehicle, tier, and process were
controller decisions of 2026-08-03; §1.G v0.44 precedent). Re-derive every claim
from the checked-out branch; do not trust this packet's characterisation
without reproducing it. The Codex lane is parked — this packet is written
for whichever model the operator relays it to (PR #198 precedent).

Repository: the 8ball repo.

- Branch: `claude/gender-reading-influence-citp5k`
- Base: `origin/main` @ `9dc0eac` (warm-paper card renders, #198)
- Six commits: §6 headroom split (paywall specimen fill →
  `ui/payments.js`) · `core/kua.js` + tests · `content/kua.v1.js` +
  tests · `ui/kua.js` + ladder/sheet/dyad wiring + tests · persistence
  (profile/readings/dyad person-B) + tests · doctrine (§1.D v0.63,
  §5 v0.63) + journal + this brief.
- The PR-time artifact (`audits/<model>_pr<N>_premerge_audit_<date>_response.md`
  or `audits/L48_override_pr<N>_<date>.md`) is added once the PR number
  exists; this brief deliberately carries no PR number.

## What to audit hardest

1. **Doctrine fit of the first demographic input.** §1.D v0.63 claims:
   optional forever; strict `'male' | 'female'` at every write seam;
   free = DOB-only untouched (the field feeds only the sealed t3 block);
   no-gender renders BOTH classical values, never a silent default.
   Verify each claim against `ui/profile.js`, `ui/readings.js`,
   `ui/dyad.js` submitSecond, `index.html`'s submit handler, and
   `ui/kua.js` — the write seams are enumerated in the §5 v0.63
   amendment. Try to construct a path where an off-vocabulary or
   unconsented value is stored, or where the free tier's output varies
   with gender.
2. **Register law.** `content/kua.v1.js` must be citation-only registry
   facts (§1.G shape) with zero directional guidance (§12 no-oracle) and
   zero second person. `tests/kua_content.test.js` pins this — check the
   pins actually bite (mutate mentally: would "favorable direction" fail?).
3. **Calculation truth.** `core/kua.js`: male 11−S / female 4+S over the
   repeated digit sum of the SOLAR year; Li Chun boundary at-or-after
   from `core/calendar.js` (`monthAnimalSolarTerm(year, 0)`); 5→2/5→8
   remap RETURNED, never silent; the 1900–1999 sweep pins equivalence to
   the classical (100−yy)%9 / (yy−4)%9 statements; the post-2000
   competing school (9−S / 6+S) is named in provenance and deliberately
   not implemented. Check the 2005 worked example and the 2021-02-03
   boundary case by hand.
4. **Block mechanics.** `kuaRead` must be a block, not a compartment:
   census 15/15 at t3 AND t5, no CELL_KEYS change, sealed-DOM purity
   (§1.D v0.37 — an unentitled render carries no entitled string),
   unseal beat reachable (`registerKuaRoot`), no tier literals in
   index.html, dyad sheets fed by handed-in reads (single-importer pin
   on `core/kua.js`).
5. **The split commit.** The paywall specimen move must be
   behavior-identical (one repointed test assertion is the whole test
   diff) and the host stays ≤1500 (ends 1486).

## Known limits, stated up front

- Copy is draft register: gender field label, dual-display note, remap
  note, `· kua sealed` density tail, about-modal sentence — flag wording,
  don't fail the audit on it (queued for this round explicitly).
- The §1.D v0.63 version number assumes v0.62 is the latest; correct it
  if the numbering collides.
- 8BALL.md was deliberately not touched (journal is authoritative for
  state); say so if you disagree.

## Verification commands

    npm ci && npm test                     # 54 files / 1887 tests green
    python3 audits/project_audit.py        # PASS
    wc -l < index.html                     # 1486

=== PROMPT END ===
