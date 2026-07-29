# RETROACTIVE AUDIT PACKET — PRs #146 + #147 (DOCTRINE v0.57 / v0.56 footer corrections) — 2026-07-29
#
# WHICH LANE — the independence test, not a vendor. This packet may be run by
# any lane that is NOT the lane that authored the changes and NOT the lane that
# authored this brief. Both are Claude Code, so **Claude does not satisfy the
# test for these PRs**. Sharper here than for the #140 packet: hook 3 asks
# whether this lane's own asymmetric framing of its two corrections is earned
# or rhetorically constructed, which a same-lineage reader is least equipped
# to answer. Any other lane qualifies.
#
# Fire line (from any terminal), substituting the lane you actually have:
#   cd ~/dev/8ball && git checkout main && git pull && \
#   ~/ai-relay/relay --models <lane> \
#     "$(cat audits/pr146_pr147_retroactive_audit_2026-07-29_brief.md)"
#
# NOTE — deliberately NO `--base`. Both PRs are merged, so `origin/main` yields
# an empty diff; and unlike the #140 packet, a single range CANNOT isolate this
# change. The two squashes are not adjacent on main:
#
#     e3bb407  #147  v0.56 footer correction      <- newer
#     6b1a7ab  #148  journal flip      (other lane)
#     b5cc119  #144  public-tier engine (other lane, substantive)
#     98141cd  #146  v0.57 footer correction      <- older
#
# `--base 98141cd^` would sweep #144 and #148 into the review — a feature change
# by a different lane that is not under audit here. Review exactly these two:
#
#     git show 98141cd     # PR #146 — v0.57
#     git show e3bb407     # PR #147 — v0.56
#
# The verdict files as
# audits/<lane>_pr146_pr147_retroactive_audit_2026-07-29_response.md, where
# <lane> matches [a-z0-9_]+ and the file ends `_response.md`. The
# `retroactive_audit` shape is verified rejected by the l48-gate predicate for
# both pr146 and pr147, so no verdict filed against this brief can green any
# gate regardless of which lane runs it. Save it verbatim per
# agents/auditor.md procedure 1.
#
# The packet below is self-contained: both appended clauses and the §10 text are
# inlined verbatim, so the audit stands even with no diff attached.

## Why this audit exists, and why the lane that wrote the PRs is asking for it

Both PRs are **already merged** — #146 as `98141cd`, #147 as `e3bb407`. Both
claimed §10's **mechanical-edit exemption** and shipped with no cross-model read.

The reason for commissioning this is not a controller instruction to double-check
routine work. It is that the implementing lane, while flipping a third stale
entry hours later (#151), found the counter-precedent to its own claim:

> **#128 was a DOCTRINE footer flip — the same class of change — and it did NOT
> claim the exemption. It went to Codex, and the audit returned MERGE WITH FIXES
> with a Medium.**

That Medium was a *truth defect in a release record*: the #126 entry cited its
Codex verdict while omitting that #126 had merged without its required F2 fix,
"leaving the release log masking an L48 clearance failure." A truth defect in a
release record is precisely what a footer flip edits. So the premise the
exemption rests on — that this class of change cannot be substantively wrong —
was falsified the last time anyone checked.

**The lane picked the reading that required nothing of it. This packet is the
correction.**

## Naming — this cannot green anything

Filed as `retroactive_audit`, not `premerge_audit`. The `l48-gate` predicate
accepts only `<model>_pr<N>_premerge_audit_<date>_response.md` or an override, so
a response to this brief **cannot retroactively satisfy any gate** for #146,
#147, or anything else. Both PRs are merged. The only product of this audit is a
verdict on whether the corrections are true and whether the exemption was
legitimate. Revert of either is trivial — each is one appended sentence plus a
note file.

## Who you are and what this is

Independent auditor for PRs #146 and #147. Assume **no filesystem access** —
everything needed is inlined. Rules:

- READ-ONLY. Verdicts, not patches.
- Do not soften severity to be polite.
- **The lane that wrote both PRs also wrote this brief, including its framing of
  the case against itself.** A self-authored indictment is still self-authored;
  it can flatter by appearing candid while steering you away from what it did not
  think of. Re-derive independently.

## Hook 1 (primary) — was the mechanical-edit exemption legitimate?

**§10 states the rule twice, and the two statements differ.** Both are inlined
verbatim:

`DOCTRINE.md:393` —
> 6. Cross-model audit on doctrine or content changes. See §10. **Solo authority
> IS the failure mode.** Doctrine and content **changes** go through Codex (or
> ChatGPT for content batches) before merge. Mechanical edits do not.

`DOCTRINE.md:430` —
> - Doctrine **amendments** go through the auditor before merge. Mechanical edits
> do not.

The PRs cited the §430 form. "Amendment" plausibly excludes a status marker;
"**change**" plausibly does not, and a footer edit is unambiguously a change to
`DOCTRINE.md`. §393 additionally opens with **"Solo authority IS the failure
mode"** — which reads directly against a lane certifying its own edit as exempt.

Judge:
1. Which statement governs, and is "mechanical edit" defined anywhere, or is it
   left to the editor's own judgement? If the latter, is a self-applied exemption
   coherent at all under a rule whose stated purpose is that solo authority fails?
2. Precedent is **split**: `audits/mechanical_footer_correction_2026-07-08.md`
   (v0.48) and `..._2026-07-20.md` (v0.51) took the exemption; **#128 (2026-07-26,
   the most recent before these) did not, and its audit found a Medium.** Does the
   split resolve in favour of the exemption, against it, or does it show the rule
   needs an amendment naming the boundary?
3. If the exemption was NOT legitimate, what follows for two already-merged PRs?

## What the PRs did

### #146 — DOCTRINE v0.57 footer (`98141cd`), 3 files, +91/−1

`DOCTRINE.md` — one clause **appended** to the v0.57 footer head entry, the
original STAGED text left in place ahead of it. The pre-existing text ended:

> STAGED on `claude/calendar-pre1929-lmt-fix`; per §10/L48 a cross-model audit is
> REQUIRED before merge — this is a calc change and a DOCTRINE change, the case
> the don't-do list names explicitly, and an override is not an appropriate
> substitute here.

The appended clause, verbatim:

> **SHIPPED — squash-merged to `main` as `8b51c38` (#140) on 2026-07-29; the
> STAGED language above is superseded by that merge, corrected on sighting per the
> v0.48/v0.50/v0.51/v0.55 footer precedent (mechanical edit, see
> `audits/mechanical_footer_correction_2026-07-29.md`). Corrected, NOT vindicated:
> the requirement stated above was not satisfied. No cross-model audit was run, and
> the gate was cleared by explicit controller override —
> `audits/L48_override_pr140_2026-07-29.md`, L48 sighting #12, which opens by
> calling itself the weakest use of that instrument in the chain and records that
> one author wrote the change, its evidence and its clearance. A retroactive
> cross-model read has since been commissioned (brief at
> `audits/codex_pr140_retroactive_audit_2026-07-29_brief.md`, #145, merged
> `a9957b5`); its verdict is outstanding, and it is deliberately named so that it
> cannot retroactively satisfy any gate. The HKO re-confirmation the NOTE above
> asks for also remains open.**

Plus `journal.md` (a follow-ups block appended to the existing #140 entry) and
`audits/mechanical_footer_correction_2026-07-29.md` (new).

### #147 — DOCTRINE v0.56 footer (`e3bb407`), 3 files, +79/−3

Appended to the v0.56 changelog entry, verbatim:

> **SHIPPED — squash-merged to `main` as `c471e92` (#130) on 2026-07-26; the
> STAGED language above is superseded by that merge, corrected on sighting per the
> v0.48/v0.50/v0.51/v0.55 footer precedent (mechanical edit, see
> `audits/mechanical_footer_correction_v056_2026-07-29.md`). The cross-model
> requirement stated here was **met, not overridden** — the distinction from the
> v0.57 clause corrected in the same change. Chain on file: Codex verdict MERGE
> WITH FIXES, 3 Medium truth/control-plane findings and 2 Low
> (`audits/codex_pr130_premerge_audit_2026-07-26_response.md`), all three Mediums
> closed in the in-branch fix cycle; then a re-audit of the fix delta returning
> MERGE WITH FIXES with a single Low
> (`audits/codex_pr130_premerge_reaudit_2026-07-26_response.md`), R1, the stale
> journal snapshots, itself reconciled in place. Live note rather than staleness:
> the sprint presentation this clause defines expires **2026-08-08** unless
> renewed, and revert is mechanical.**

Plus `journal.md` (the `2026-07-26 — Revenue reset …` entry flipped
`STAGED → SHIPPED`, original text retained behind `Was:`) and
`audits/mechanical_footer_correction_v056_2026-07-29.md` (new).

## Hook 2 — #147's positive claims are the sharpest exposure

#146 mostly *withholds* a claim ("Corrected, NOT vindicated"). **#147 asserts
things**, and assertions about a completed audit chain are exactly what #128's
Medium was about. Verify each independently:

- Verdict was MERGE WITH FIXES with **3 Medium and 2 Low** — count them.
- **All three Mediums closed** in the in-branch fix cycle — is that true, or were
  some declined/deferred? (Note: the sibling v0.55 clause records a #127 finding
  as **DECLINED with rationale**, so "closed" is not the only outcome this repo
  uses, and conflating declined with closed would be a defect.)
- A **re-audit of the fix delta** exists and returned MERGE WITH FIXES with one
  Low.
- **R1 was closed.** R1 was: the journal entry contained pre-fix snapshots stated
  in present tense. The lane claims it verified this in the shipped text, which
  now reads *"Suite green at the initial cut's 41 files / 1438 tests … after the
  fix cycle and the #129 merge-forward below, the merged suite passes 41 files /
  1444 tests."* Is that genuinely R1's requested "initial-state → corrected-state
  history," or does the entry still contain other present-tense pre-fix claims the
  lane did not look for? **R1 named two paragraphs; the lane checked the pattern,
  not necessarily both.**
- `c471e92` is #130's squash and the dates are right.

## Hook 3 — is the asymmetry self-serving?

The same lane wrote both corrections and decided that one reads
`Corrected, NOT vindicated` and the other `met, not overridden` — then wrote in
#147's note that #130 "is what the process looks like when it runs as designed."
A lane grading its own two artifacts, awarding one a clean bill, is a conflict
even when the underlying facts support it.

Judge whether the asymmetry is **factually earned** or **rhetorically
constructed**. Specifically: #130's chain was completed by *other* actors (a real
Codex verdict, a real re-audit). Does #147 borrow credibility from that chain for
its own correction, which had none?

## Hook 4 — lineage preservation

Both claim the original STAGED text is preserved **verbatim**, with only an
append. Diff the pre-existing text against what remains and confirm nothing was
silently reworded, softened, or truncated. A footer "correction" that quietly
edits the superseded text would defeat the whole convention.

## Hook 5 — selective scope

#146/#147 corrected v0.57 and v0.56 and explicitly left **v0.52, v0.53, v0.54**
carrying similar STAGED language, unverified, citing the house pattern of one
footer-flip cycle per merge. Is that a legitimate boundary, or does correcting the
two most recent — including the one that makes the lane's own run look
well-governed — while leaving three older ones stale, amount to selective
curation of the truth surface?

## Hook 6 — the gate path these PRs took

Both changed `DOCTRINE.md` yet were **exempt from `l48-gate`**, because every
changed file ends `.md` and none is `audits/RELEASE_CHECKLIST.md` or
`agents/*.md`. The §8 audit-artifact gate did fire, and was satisfied by
`audits/mechanical_footer_correction_*.md` — **a file the same lane wrote, whose
own `Classification` line reads "no cross-model audit run for this change."**

So a `DOCTRINE.md` change satisfied its audit gate with a self-authored note
declaring no audit happened. Judge whether that is the documented mechanical-edit
path working as intended, or a hole worth a follow-up. (Related, for context: the
`l48-gate` residual already on record from #131's verdict — a self-authored file
merely named `_response.md`, or an unauthorized override, still greens the gate,
because content and provenance are unchecked.)

## Hook 7 — did the corrections introduce NEW truth defects?

This is the #128 Medium's exact shape, applied to its successors. Check every
factual claim in both appended clauses and both note files:

- SHAs `8b51c38`, `c471e92`, `a9957b5`, `98141cd`, `e3bb407` resolve to what is
  claimed.
- PR numbers, dates, verdict summaries, finding counts.
- The characterization of sighting #12 as "the weakest use of that instrument in
  the chain" — does the override actually say that, and is it a fair summary or a
  selective quote?
- The claim that #145's brief "cannot retroactively satisfy any gate" — verify
  against the shipped regex rather than the assertion.
- Anything **omitted** that would change how a reader understands the record —
  omission is what #128's Medium turned on.

## Hook 8 — the deferred item

Both PRs surfaced that the v0.56 sprint presentation **expires 2026-08-08** and
neither acted on it. Correct call, or should a footer flip that marks a
time-boxed clause "delivered" carry the expiry to the controller more forcefully
than a note?

## Required output shape

- Line 1: `Verdict: CORRECT AS SHIPPED` | `CORRECT WITH FOLLOW-UPS` | `DEFECTIVE — REVERT` | `DEFECTIVE — FIX FORWARD`
- **Separately, on hook 1:** `EXEMPTION LEGITIMATE` | `EXEMPTION NOT LEGITIMATE` |
  `RULE AMBIGUOUS — NEEDS AMENDMENT`. This is the finding with consequences
  beyond these two PRs.
- Findings table: # | High/Med/Low | finding | evidence
- Per hook 1–8: severity `PASS / P3 / P2 / P1 / P0`, evidence, reasoning,
  recommendation.
- Then: exact commands or sources used and what they returned.

If you cannot verify something, **say which hook** rather than passing it.

## Disclosure

Written by the lane that authored #146, #147, the two mechanical-edit notes, the
journal entries under discussion, and the #145 brief. No second model has read
any of it. Seven consecutive L48 sightings record no cross-model read; these two
PRs are not among them only because they claimed an exemption instead of an
override, which is the thing hook 1 asks you to judge.
