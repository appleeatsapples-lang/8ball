# Mechanical footer correction — v0.61 STAGED → SHIPPED (2026-07-30)

Same class as `mechanical_footer_correction_v056_2026-07-29.md` and the v0.48–v0.55 precedents: the doctrine
footer's write-time language went stale the moment the merge it anticipated landed, and is corrected on sighting
as a mechanical edit — no doctrine substance changed.

**What was stale.** The `**doctrine version:** 2026-07-30 · v0.61` footer line still read "no cross-model audit
has cleared the corrected branch — per L48 a fresh independent read is required before merge … STAGED — merge is
its own word", while (a) the §1.D/§1.J clause body already recorded the re-audit, and (b) `main` already carried
the merge. Flagged independently twice on 2026-07-30: the Codex preflight audit (DOCTRINE.md:143 vs :621
contradiction, "prevents treating the footer as reliable merge-gate evidence") and the Architect journey audit
(contradiction register #2).

**The truth it now records.** L48 was met, not overridden: Codex first audit **DO NOT MERGE — CHANGES
REQUESTED** at `9c749ef` (six P1, two P2) → correction commits `98792b1` + `e34458a` → independent Codex
re-audit **SAFE TO MERGE** (`audits/codex_pr187_premerge_reaudit_2026-07-30_response.md`) → squash-merge to
`main` as `2cdaa3c` (#187).

**Edit shape.** Append-only within the footer line: the original STAGED words are preserved verbatim and a bold
SHIPPED correction is appended after them, naming this file. Companion edit in the same commit: `journal.md` new
top entry superseding the "STAGED, not merged" status of the entry beneath it (journal is append-only; corrected
by a newer entry, never by editing the old one), plus the front-matter read-pointer bump the Codex preflight
required.

**Authority.** Operator word "repo" to the Claude Cowork "8 ball" seat, 2026-07-30 ~23:30 +03. Docs only; no
code, no tests, no product surface touched.
