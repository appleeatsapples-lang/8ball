# Correction — the §10 amendment draft's founding premise is false

**Corrects:** `audits/doctrine_s10_auditor_lane_amendment_draft_2026-07-29.md`
(merged as `3ec1e87`, PR #166).
**Author:** the implementer lane that wrote the draft.
**Classification:** correction of a false claim in a merged record. No doctrine,
no code.

## The claim, and why it is false

The draft's Finding section asserts:

> **Codex is retired.**

It is not. Two genuine relay verdicts sit in `audits/`, both dated the same day
the draft was written, each naming a model, a run directory and a token count:

| artifact | auditor line | run | tokens |
|---|---|---|---|
| `codex_pr136_premerge_audit_2026-07-29_response.md` | `Codex (gpt-5.6-sol, reasoning effort xhigh, sandbox read-only) via ~/ai-relay/relay --models codex --base origin/main` | `20260729-004554-8ball` | 225,689 |
| `codex_pr150_postmerge_audit_2026-07-29_response.md` | same | `20260729-080131-8ball` | 340,311 |

#136 returned **MERGE WITH FIXES** with three findings. #150 returned
**SAFE TO MERGE**, zero findings, and produced a substantive PII observation
about JPEG coordinates being reconstructable. Neither is a stub.

## The timeline, which is the part that matters

All times local (+03:00), from commit author dates and the run directory names:

```
00:45  Codex relay runs for #136                    <- lane is ALIVE
01:28  #136 merges, carrying its Codex verdict into audits/
06:13  #140 merges  (sighting #12)
07:42  #144 merges  (sighting #14 — "Codex is retired")
08:00  #153 merges  (sighting #15)
08:01  Codex relay runs for #150                    <- lane is ALIVE again
08:49  #150 merges
09:38  #157 merges  (sighting #16 — multi-agent read used instead)
```

Sighting #14 asserted the lane was retired **seven hours after a successful
Codex run that same day**, with that run's verdict already committed to the very
directory the override was being written into, and **nineteen minutes before the
next successful run**.

The claim was not overtaken by events. **It was false when written.**

## Two lanes made the same error, and mine is the worse one

The override was quoting an operator brief — *"Codex is dead, so file an
explicit override artifact stating the cross-model lane is unavailable"* —
which is a defensible reason to believe it. It is not a reason to assert it as
fact into a governance record without looking at the adjacent files.

**This lane then did something less defensible: it read that override and
propagated the claim into a proposed constitutional amendment without checking
either.** `codex_pr136_premerge_audit_2026-07-29_response.md` was on `main`,
in the directory this lane had been reading and writing all session, and had
already been listed in this lane's own `ls audits/` output earlier in the same
session. The check that would have caught it is the one this lane applied to
every other claim it handled today — R1's closure, #131's red-then-green legs,
#129's F1 fix, every SHA in two fire-line headers — and skipped on the single
claim that reshaped its recommendations.

Recorded plainly because a correction that spreads the blame evenly would be
false: the override had a source, and this lane had the artifact.

## What this does to the draft

**Dead — the urgency argument.** The draft's frame is that a vendor-named role
went vacant when the vendor disappeared, leaving the override as the only
available path for seven consecutive clearances. That is wrong. For sightings
#14, #15 and #16 a cross-model read was **available and not used**. The
instrument was not forced; it was chosen.

**Still standing — the design argument.** Naming a vendor in the constitution is
fragile whether or not the vendor is currently alive, and `agents/auditor.md`
hard-codes both the tool and a paste-relay workflow the artifacts show has been
superseded by `~/ai-relay/relay` with a real checkout. Defining the role by
properties survives this correction intact.

**Still standing, and independently verified — the scope ambiguity.** §10:430
says "doctrine **amendments**", §8 gate 6 says "doctrine and content
**changes**". That gap is real, this lane used it on #146 and #147, and it is
unaffected by anything here.

**Newly visible, and sharper than the original finding.** The override
instrument was used three consecutive times while the alternative existed. That
is a more serious observation than "the rule became unsatisfiable", because it
cannot be fixed by an amendment — no wording change makes a lane check whether
the auditor is reachable before declaring it gone.

## What is NOT wrong in the draft

The verified mechanical claims stand: the `l48-gate` predicate's `[a-z0-9_]+`
token accepts any lane name, so no workflow change was ever needed; the ten
override artifacts and the seven-consecutive count are accurate; every
`DOCTRINE.md` quotation was checked verbatim. The ranking of audit forms —
cross-model strongest, multi-agent independent of context but not of model,
self-review never an audit — is unaffected.

## Consequence for the two open briefs

`audits/codex_pr140_retroactive_audit_2026-07-29_brief.md` and
`audits/codex_pr146_pr147_retroactive_audit_2026-07-29_brief.md` are **runnable
exactly as their fire-line headers specify.** This lane advised against relaying
them on the strength of the false premise; that advice is withdrawn. The #140
packet remains the one worth firing first — a calculation change live in
production, read by its author only.

## Recommendation

1. **Fire the #140 brief.** The blocker was invented.
2. **Do not apply the §10 amendment as drafted.** Its finding section is false.
   If the controller still wants the role defined by properties rather than by
   vendor, that is a smaller amendment resting on the design argument alone, and
   it should be re-drafted rather than patched.
3. **Treat "the auditor lane is unavailable" as a claim requiring evidence**,
   the same as any other claim in an L48 artifact. The cheapest possible check —
   `ls audits/ | grep codex` — would have caught this twice.
