# PR #223 delta (third commit) cross-model audit — reconciled response

**Scope:** the layout-audit extension `677c540 → 73ade83` on PR #223, whose
first two commits carry the already-reconciled audit in
`audits/claude_relay_pr223_premerge_audit_2026-08-31_response.md`. This
artifact exists because the l48-gate passes MECHANICALLY on that earlier
file — the gate diffs the whole PR, so CI could never say a delta went
unreviewed; covering it is a §10/L48 obligation, honored here.
**Process:** DOCTRINE §10 two-lane adversarial review of the delta, both
lanes re-deriving the layout sweep independently rather than trusting the
relay's script, in scratch worktrees on self-verified ports.

## Lane verdicts (PR as a whole — audited base + delta)

| Lane | Verdict | Findings |
|---|---|---|
| Lane A | MERGE WITH FIXES | 4 MED + LOW/INFO record corrections |
| Lane B | MERGE WITH FIXES | 1 MED, 2 LOW + a process hazard |

**Reconciled outcome: MERGE WITH FIXES — every fix-class finding landed;
verified below. Final call remains with the controller per L48.**

## The delta, verified sound by both lanes — stronger than claimed

Both lanes' independent sweeps: base carries the trap in exactly the two
constructs the delta retires (33–46 trap states); head carries ZERO, at
every viewport and state either lane tried. The ≥720 stage change is a
TOTAL Chromium no-op — a full-DOM geometry diff (every element's box, 7
viewports × 5 states, base vs head) found zero differing nodes, stronger
than the relay's own "≤4px" claim, which did not reproduce and is
retracted in the journal. The dyad release is byte-identical at six
viewports through the real t5 flow. All three claimed delta mutants die;
suite/assurance/product-audit counts reproduce; the fail-closed story
checks (the real auditor FAILS with the stale pin, blocking count 1).

## Findings and dispositions

**MED (Lane A) — the "no condition of any kind" pin only banned
`@media`.** An `@layer` wrapper rode the full suite green and RE-ARMED
the trap at 390×844 (+135px — the field viewport): layered rules lose to
the unlayered shell. **Landed:** the extracted STYLE literal now bans
`@` outright — any scoping at-rule is a re-narrowing.

**MED (Lane A) — the styleBlock extractor was decoy-dodgeable** (a dead
earlier `const STYLE` satisfied every pin while the shipped payload
drifted). **Landed:** the module must contain exactly one STYLE literal,
pinned by count.

**MED (Lane A) — one shell line re-armed the ≥720 trap with the suite
green AND zero sweep hits.** `#result .flip-stage { aspect-ratio: 5/8 }`
out-cascades the injected same-specificity release; the sweep heuristic
cannot see it because it only flags boxes whose content already outgrew
them in the MEASURING engine — the lanes' sharpest point about the
sweep's blind spot. **Landed:** a source guard over both host
stylesheets — no flip-surface-targeting rule may declare a ratio VALUE
outside the three single-selector base boxes (`.flip-stage`, `.card`,
`.card-back`), nor any fixed height (auto and the back-beat's 100% are
the only legal values).

**MED (Lane A) / corroborating (Lane B) — the dyad pin matched raw
source.** A commented-out rule and a `@media (min-width: 3000px)` wrap
both rode green. **Landed:** the pin is rebuilt over comment-stripped,
at-rule-stripped top-level stylesheet text, with non-@media scoping
at-rules banned in the dyad stylesheet outright.

**LOW (both lanes) — `height: auto` in the dyad rule was dead** (nothing
sets a height on the sheets; proven by removal + re-measure). **Landed:**
dropped, with the reason in the rule's comment.

**LOW (Lane B) — the shell's ≥720 rail comment** still said the card
"keeps its 5/8 specimen proportions". **Landed:** corrected to the
released-box reality — the same comment-drift class this PR already
fixed once.

**LOW (Lane A) — record corrections, all folded into the journal:** the
retracted "≤4px" delta; the ≥720 overflow figures re-labeled by state
(+367 t3, +465 free-revealed, +716 t3-revealed, +984 with a meaning
panel open) and landing on the feedback block, not the rail; the
card-back disposition kept but its reason corrected (its own ratio box
is never in effect — `.flip-side .card-back { aspect-ratio: auto }`
overrides it at its only render site).

**Process hazard (Lane B), recorded:** an assigned port was already
bound by a stale server from another worktree serving BASE content —
`curl 200` alone would have validated the wrong tree. The lane
cross-checked served bytes against disk before measuring; future briefs
pin that check alongside the port-free check.

## Reconciled verification (post-fix head)

- Five delta mutants killed (layer wrap, decoy literal, shell re-arm,
  dyad comment-out, dyad media-wrap) on top of the field fix's seven and
  the journal-guard mutant, plus the three first-landing delta mutants —
  every restore byte-verified.
- Suite 57 files / 2008 tests green; product audit PASS, 0 blocking;
  PII scans clean.
- Both lanes' cleared lists stand: modals/share-fold/back-beat identical
  at ≥720 in every state, dyad clearance 18px throughout, the sweep
  heuristic's blind spot now covered by the source guard rather than
  the sweep alone.

qualifier: recorded, not certified. Merge authority remains the controller's.
