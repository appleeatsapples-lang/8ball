# Gate 6 cross-model audit — §14 Operator Calibration

**Date:** 2026-07-05
**Branch:** `docs/operator-calibration-s14`
**Subject:** DOCTRINE.md §14, as committed at `d2b3418` (v0.45)
**Method:** `codex`/`grok` CLIs were logged out on this machine at review time
(`relay providers` showed both MISSING). Rather than fix auth first, the
identical review prompt was pasted manually into Grok's `grok build`
interface and separately into Codex's interface. Full responses captured
below. This is a manual substitute for `ai-relay`'s automated fan-out, not
the tool itself — worth fixing the CLI logins so future gate-6 runs don't
need this workaround.

**Disposition:** Neither model refused the section. Both returned
PASS-with-findings. Findings were reconciled and folded into a v0.46 revision
of §14 (see journal.md 2026-07-05 entry and the DOCTRINE.md v0.46 footer for
the itemized fix list). This brief is the source record; DOCTRINE.md/journal.md
carry the canonical summary, per this section's own ephemeral-artifact clause.

## Prompt sent (identical to both models)

See `journal.md` 2026-07-05 entry or the chat transcript for the full prompt
text; it asked for critique on internal consistency, enforceability, fail-closed
vs fail-open behavior, human-AI dynamics red flags, and any outright refusal
points, against the full v0.45 §14 text.

## Codex — full response (complete)

Findings

P1: DOCTRINE.md (line 439) pushes too hard toward deference. "Terse input
carries maximum trust" + "reconstruct, don't clarify" is the main human-AI red
flag. It should be narrowed to reversible, low-blast-radius work with clear
acceptance criteria. Otherwise it can suppress exactly the pushback §14 says
it wants.

P1: DOCTRINE.md (line 440) overclaims objectivity. The override flags are not
"observable in the message itself": contradiction against standing law
requires doctrine interpretation, "scope doubling" is judgment-heavy, and
"reverses a decision" requires transcript context. Better wording: "observable
from the message, current transcript, and canonical doctrine; no inferred
mood/fatigue."

P2: DOCTRINE.md (line 454) is mostly fail-closed, but scope is ambiguous. The
threshold rule is sound for evidence-gated decisions. It becomes weird if
applied to taste/product calls, and too weak if an override can be
reclassified as "taste" or "real objective stated." Add: empirical
claims/gated work need thresholds; safety/privacy/standing-law violations
cannot be overridden by stating an objective.

P2: DOCTRINE.md (line 449) contains the most deference-biased sentence: "The
override is usually right for the unstated goal." I would change it to: "The
override may reveal an unstated goal." The current version trains the
assistant to rationalize overrides.

P2: DOCTRINE.md (line 440) through (line 442) needs operational definitions
for "morning read," "local," and "irreversible-adjacent." The midnight rule is
acceptable only if narrowly scoped. Otherwise it becomes paternalistic
time-based override of the operator.

P2: DOCTRINE.md (line 463) conflicts with the doctrine's own lesson at
DOCTRINE.md (line 422): calendar-only cadence does not self-fire. "Weekly
analytics read" needs a file-backed trigger like `next_analytics_read`, or
"missing date = overdue."

P3: DOCTRINE.md (line 456) and (line 470) conflict with existing
paste-relay/Desktop-artifact practice unless scoped. §10 still says Codex
auditor is pasted-brief only. Say "canon is repo-resident; ephemeral
briefs/audits may live outside repo until reduced into canon."

Verdict

I would not call this unsound, but I would not merge it untouched. The
architecture is good: blast-radius scaling, threshold-pinned evidence, no
inferred fatigue, operator-hands irreversibles, and self-firing checks are
all directionally right.

The problem is that §14 says "mechanism, not judgment" while several core
parts still depend on judgment. The biggest merge-risk is not safety theater;
it is future assistants reading this as permission to clarify less, defer
more, and treat operator overrides as presumptively correct. Tighten those
clauses and I'd be comfortable operating under it.

## Grok — response (partial capture)

Terminal window was scrolled during capture; the opening portion of point 1
was cut off mid-sentence ("...clarifying.""). Reconstructed context from what
was visible: this concerned the terse-trust default. Captured verbatim from
here:

> 2. "The override is usually right for the unstated goal" as written. I'd
> accept "state the unstated objective before executing" — that's good. I'd
> reject "usually right" — it's an unearned prior that reduces warranted
> pushback. Replace with neutral: "may be right; lanes lack operator-private
> context; objective must be explicit before proceed."
>
> 3. The observability claim as audit language. If this goes to Codex as
> audit-cleared doctrine, I'd want the text to stop claiming (a)/(b) are
> "observable in the message itself" and instead say "transcript-checkable
> heuristics with residual judgment" — honesty that prevents false confidence
> in compliance.

> I would not refuse: evidence-threshold fail-closed, midnight auto-defer on
> irreversibles, self-firing strategic read, executing-to-avoid-questioning
> as named failure mode, or circuit-break on posts/merges/deploys. Those are
> sound.

Summary verdict table (as rendered):

| Dimension | Assessment |
|---|---|
| Internal consistency | Mostly solid with §10–§13; tensions on deference semantics, terse-vs-BLOCK priority, and soft vs hard override flags |
| Enforceability | Threshold rule and date triggers are real; terse-mode and flags (a)/(b) oversell mechanization |
| Fail-closed | Strong on undefined gates and (d); default daily posture is fail-open/fast-execute |
| Human-AI dynamics | Terse-trust + "override usually right" are the real sycophancy risks; mitigations exist but are narrow |
| Refuse? | No to whole section; yes to unconditional terse-trust and "usually right" without scoping |

> If I were filing this in your auditor vocabulary: PASS with P2 findings on
> (1) terse-trust default vs. ambiguity, (2) "override usually right"
> epistemics, (3) overclaimed observability on flags (a)/(b). Not P0/P1 —
> nothing here is reckless on irreversibles or evidence gates. The section
> does what it says: calibrates for speed with a skilled operator, not for
> maximum model skepticism.
>
> The sharpest edit, if you want one change before merge: split "reading the
> operator" into compression-trust (operator uses telegraphic style on
> purpose) vs. ambiguity-trust (missing specs). Right now those are conflated,
> and that's where reduced pushback actually lives.
