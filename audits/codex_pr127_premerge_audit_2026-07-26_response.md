# Codex pre-merge audit — PR #127 response — filed 2026-07-26

Relay run: `~/ai-relay/runs/20260726-023252-8ball` (codex, read-only
sandbox, xhigh reasoning; single-reviewer run — the reconciler leg was
skipped: its CLI seat was logged out, and with one reviewer there is
nothing to reconcile). Brief: `audits/codex_pr127_premerge_audit_2026-07-26_brief.md`.
Dispositions appended below the verbatim verdict; each finding carries a
named action per the L48 record discipline.

---

## Verbatim verdict

Verdict: MERGE WITH FIXES

| # | Severity | finding | evidence |
|---|---|---|---|
| 1 | Med | R2 mishandles positive legacy credits below 1. `normalizeCounter()` floors before the grandfather test, so `0.1`, `0.9`, and `"0.5"` resolve free instead of t3. This contradicts the brief's "any positive … fractional" requirement. Use a finite `Number(value) > 0` predicate for R2 and add persistence tests for sub-unit values. | `core/payments.js:17-20,123-127`; `tests/tiers.test.js:243-250`; reproduction: `0.9 => free`, `"0.5" => free` |
| 2 | Low | Deletion/documentation is incomplete. Runtime comments still name the retired tries key, Path A, credit consumption, and free-try counting; README's active test description still promises debit/zero-credit coverage. This breaks the claim that runtime no longer names the key and leaves misleading current documentation. Scrub or rewrite these lines. | `ui/payments.js:24-25,44`; `index.html:637,1318-1321,1333`; `README.md:30` |

Density, sealed-DOM purity, tier monotonicity for every reachable writer, unknown-return replay safety, privacy scanning, and displayed prices otherwise check out.

What others may miss: PR #126 adds no executable tests pinning retired payment behavior. Its 45 `readings_ui`, 22 `share_behavior`, and one `share_surface` test apply without payment-file overlap; merge-tree is conflict-free, projecting 40 files / 1428 tests. Retired behavior appears only in its audit narrative. PR #124 also auto-merges, but introduces a historical journal entry claiming calc v2/master numbers remain current; annotate it as superseded before merging #124.

Commands and results (as reported by the auditor):

```text
git diff origin/main...HEAD -- ui/tiers.js
# empty

git hash-object ui/tiers.js
git show origin/main:ui/tiers.js | git hash-object --stdin
# both 4afd9849b3e85ff5215e47887dca3db83a59d189

node --input-type=module -e "...tierDensitySummary..."
# free 5/15; t1 10/15; t2 14/15; t3 15/15 + cardEntry

node --input-type=module -e "...resolveRenderTier..."
# 0.1=>free; 0.9=>free; "0.5"=>free; 1=>"t3"; "3"=>"t3"

rg -n "eight_ball_tries_used_v1" core content ui index.html
# ui/payments.js:44

rg -n "setItem\([^)]*CREDITS_KEY" core ui index.html
# no matches

npm test
# 38 files passed; 1360 tests passed

ls tests/*.test.js | wc -l
# 38

wc -l index.html
# 1401

/bin/bash audits/run_local_audit.sh
# LOCAL PII AUDIT: clean (235 files scanned)

git diff --check
# clean
```

---

## Dispositions (orchestrator, same session, pre-merge)

**F1 (Med) — R2 sub-unit legacy credits → free. DECLINED (behavior
pinned as correct), rationale on record.** The flagged behavior is
byte-identical to `main` — the auditor's own hash check shows
`resolveRenderTier` unchanged, and the sub-unit pins at
`tests/tiers.test.js:243-250` are carried verbatim from the pre-v0.55
suite, where they assert fractional/junk values floor to 0 → free as
*storage-corruption hardening*. No genuine buyer device can hold a
sub-unit credit: every legacy writer (`setCredits`, `applyPaidReturn`
+3, `nextShakeState` −1, funded facet −1) wrote whole non-negative
integers; sub-unit values arise only from hand-edited storage. The
implementation brief's constraint is "Legacy grandfather (R2)
SURVIVES" — i.e. unchanged — and the "any positive … fractional"
phrase the auditor audited against came from this PR's own audit
packet, which overstated the R2 contract; the packet wording is
corrected by this disposition rather than the shipped semantics
widened. Widening R2 to `Number(value) > 0` would change main's
behavior for hand-edited shapes inside a PR whose contract is that R2
ships untouched — declined here; open to the controller as a separate
one-line amendment if they want hand-edited sub-unit values
grandfathered too. The named buyer-protection case (whole-integer
credits, no tier) is pinned green at `tests/tiers.test.js` (R2 suite)
and was verified live in-session (credits='2' → t3 persisted, credits
frozen).

**F2 (Low) — stale comments/docs. FIXED in-PR, same session.** All six
named locations scrubbed or rewritten: `ui/payments.js` header no
longer names Path A; the retired-key comment no longer carries the key
string (doctrine §5 v0.55 "the code names no such key" now literally
true — `rg eight_ball_tries_used_v1 core content ui index.html` returns
nothing); `index.html` CSS section comment, try-another comment, and
Path B comment rewritten to the ownership model; `README.md` stage-6
description rewritten (no debit/zero-credit promises). Suite + privacy
scan + local PII audit re-run green after the fix.

**Cross-PR notes (for the controller, not this PR):** the auditor
projects #126 merging cleanly after #127 (no payment-file overlap,
40 files / 1428 tests) — no interference action needed; #124 should get
its historical journal entry annotated as superseded before ITS merge.

Merge remains gated on the controller's word (L48). This artifact plus
the in-PR brief constitute the cross-model audit record for PR #127.
