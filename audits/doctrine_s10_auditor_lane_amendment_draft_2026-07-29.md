# DRAFT — DOCTRINE §10 amendment: the auditor lane is vacant

**Status: DRAFT for controller decision. Not applied. `DOCTRINE.md` is untouched
by the PR carrying this file.**

## Why this is a draft and not an edit

§10's own lane discipline reads *"Doctrine amendments go through the auditor
before merge."* This is a doctrine amendment about the auditor. **The auditor
does not exist.** An amendment that fixes a broken review mechanism cannot be
reviewed by that mechanism, and this lane will not resolve that recursion by
quietly applying its own text to the constitution.

So: exact replacement wording is given below, ready to apply, and applying it is
a controller decision made in the open rather than an implementer edit that
happens to be correct.

## The finding

Sighting #14 (`audits/L48_override_pr144_2026-07-29.md`) states it plainly:

> No second model read any of it. **Codex is retired**; no other lane was
> commissioned, and none is in flight.

The operator brief it quotes is blunter: *"Codex is dead, so file an explicit
override artifact stating the cross-model lane is unavailable and naming who
reviewed."*

§10's role table hard-codes the tool:

> | **Auditor** … | **Codex** — Mac desktop app, paste-and-relay | … | Pasted briefs only | … |

and §8 gate 6 does the same:

> Doctrine and content changes go through **Codex** (or ChatGPT for content
> batches) before merge.

**Naming a vendor in the constitution made the role vacant the instant the
vendor went away.** The consequence is visible in the record: ten override
artifacts on disk (sightings #6 and #8–#16), of which **#10 through #16 are seven
consecutive**, and every one of those seven records no cross-model read. That reads as lane discipline decaying. It is more
accurately a rule that became unsatisfiable, so the override — designed as the
exception — became the only available path.

## What is NOT broken, and should not be changed

**The CI gate is already tool-agnostic.** The `l48-gate` predicate is
`^audits/([a-z0-9_]+_pr<N>_premerge_audit_<date>_response|L48_override_pr<N>_<date>)\.md$`.
The `[a-z0-9_]+` model token accepts `multiagent`, `gemini`, `chatgpt`, `claude`
— verified. **No workflow change is required by this amendment.** The machinery
was written more flexibly than the prose it enforces.

## Proposed replacement — §10 role table, Auditor row

> | **Auditor** — adversarial pre-merge review on doctrine, content, release-gates | **Any lane meeting the independence test below.** Codex retired 2026-07-29; the role is defined by properties, not by vendor | [`agents/auditor.md`](agents/auditor.md) | The brief, plus a repo checkout where the lane supports one | Returns categorized verdicts (PASS / P3 / P2 / P1 / P0) |

## Proposed addition — §10 lane discipline, new clause

> **Auditor independence (v0.59).** The auditor role is defined by what it must
> satisfy, not by which product provides it. Hard-coding a vendor is what left
> the role vacant when Codex retired, and made the override the default path for
> seven consecutive clearances. A lane may act as auditor if it: **(a)** did not
> author the change, its tests, or its brief; **(b)** reads adversarially, under
> instructions to refute rather than confirm; **(c)** returns categorized
> verdicts with evidence, not prose approval; **(d)** holds no authority to
> implement, merge, or clear what it reviews.
>
> Accepted forms, **ranked and explicitly not equivalent**:
>
> 1. **Cross-model read** — a different vendor's model. Strongest: independent of
>    the authoring context *and* of the authoring model's systematic blind spots.
>    Required where one is available.
> 2. **Independent multi-agent read** — several agents of the same model family,
>    each with fresh context, adversarial instructions, and findings verified by
>    separate agents before filing. Independent of **context**, not of **model**:
>    a blind spot inherent to the model reproduces across its own agents, so this
>    form cannot catch that class. Accepted as the standing substitute while no
>    cross-model lane exists. It is not a formality — the #153 read filed 30
>    findings, 11 survived adversarial verification, and one was a HIGH defect
>    live in production that the suite had passed over (`#157`).
> 3. **Same-lane self-review** — never an audit, in any circumstance. Does not
>    satisfy this clause and may not be filed as a verdict.
>
> **Every L48 artifact must name which form was used.** A form-2 read files as a
> normal verdict response (`<lane>_pr<N>_premerge_audit_<date>_response.md`), not
> as an override — the gate predicate already accepts any lane token. The
> override remains the instrument for clearing with **none** of the forms, and
> reverting to it when form 2 was available is itself a finding.

## Proposed replacement — §8 gate 6

> 6. Cross-model audit on doctrine or content changes. See §10. Solo authority IS
>    the failure mode. Doctrine and content changes go through **an auditor lane
>    meeting the §10 independence test** (ChatGPT remains the preferred lane for
>    content batches) before merge. Mechanical edits do not.

## Also — the ambiguity this amendment should close while it is open

§10 and §8 gate 6 state the exemption in **two different scopes**, and this lane
has already used the gap:

- `DOCTRINE.md:430` — "Doctrine **amendments** go through the auditor…"
- `DOCTRINE.md:403` — "Doctrine and content **changes** go through Codex…"

"Amendment" plausibly excludes a status marker; "change" does not. PRs #146 and
#147 claimed the exemption on the narrower reading; #128, the nearest comparable
case, did not claim it and its audit returned a Medium. That question is under
audit in `audits/codex_pr146_pr147_retroactive_audit_2026-07-29_brief.md` (hook
1) — a brief now addressed to a retired lane, which is its own illustration of
the problem. **If the controller wants the two clauses reconciled, this is the
amendment to do it in**; this draft deliberately does not pick a side, because
this lane is the interested party.

## What this amendment does NOT fix

- **It does not supply an auditor.** It defines what one must be and blesses a
  substitute. If neither form 1 nor form 2 is actually run, the override remains
  the path and nothing improves.
- **It does not address §8 gate 9 live-fire**, which is the outstanding gate that
  #157's F1 belongs to — a rendered-surface defect no source-reading test can
  see. That is a separate amendment and should not ride here.
- **It does not touch the 61 Codex references** across `DOCTRINE.md`,
  `CLAUDE.md`, and eight `agents/*.md` files, including `agents/auditor.md`,
  whose title is literally "Agent role: auditor — Codex" and whose Procedure 1
  describes a paste-relay workflow that no longer has a destination. Those are
  follow-on and should be their own cycle — bundling a doc sweep into a
  constitutional amendment would bury the decision in a large diff.
- **It cannot be audited.** Stated once more because it is the whole shape of the
  problem: the first change this amendment would govern is itself.

## Open questions genuinely for the controller

1. **Is a multi-agent read acceptable as the standing substitute**, or should a
   real cross-model lane be commissioned (Gemini and ChatGPT are already named as
   adjuncts in §10) before doctrine blesses the weaker form?
2. **Should form 2 file as a verdict or stay an override?** Filing as a verdict
   is more honest about what happened and stops override inflation; keeping it an
   override preserves the sighting log as a single unbroken record of
   "no cross-model read", which has its own value.
3. **Reconcile "amendment" vs "change" now, or wait** for the #146/#147 audit
   that is currently addressed to a retired lane?

## Provenance

Drafted by the implementer lane (Claude Code) after checking the parallel lane's
overrides at controller request. No second lane has read this draft. It proposes
the rule that would govern how drafts like it are reviewed, which is exactly why
it is filed as a proposal rather than applied.
