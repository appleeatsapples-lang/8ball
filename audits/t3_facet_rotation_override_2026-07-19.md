# T3 written-entry rotation — override and audit handoff

- Date: 2026-07-19
- Branch: `codex/t3-facet-rotation`
- Base: clean `origin/main` at worktree creation (`24309bf`)
- Status: STAGED — round-1 MERGE WITH FIXES absorbed; delta re-audit SAFE TO MERGE

## Authority recorded

The controller explicitly authorized two overrides in the originating task:

1. Codex may leave its repository's normal read-only lane and implement the change in an isolated worktree.
2. The standing traction gate and c.2 content-authoring prerequisite for the parked facet feature are waived for this cut.

The authorized substitute is c.1 mechanical reuse of the immutable v1 `note.low`, `note.mid`, and `note.high` positions. This change does not claim those strings were re-authored as outward, inward, or returning facets, and it does not create or imply a v2 deck.

## Staged contract

- Only an explicit t3 `flip again` may advance the visible note position and debit one credit.
- Rotation is strict round-robin: low → mid → high → low.
- The life-path grouping selects the first visible position; it does not change the catalog index.
- Free, t1, and t2 flips remain cosmetic and credit-preserving.
- `eight_ball_facet_index_v1` stores the currently visible zero-based position only.
- Reload and same-profile submission preserve that position. New profiles and consumed pending-profile returns reset it to the life-path anchor. Forget clears it.
- A zero-credit t3 flip clears stale pending intent and opens the paywall without advancing or spending a hidden read. The paid return grants credits; the next explicit flip performs the advance/debit.

## Scope truth

Runtime and tests touch `core/payments.js`, `ui/payments.js`, `index.html`, and coordinated tests. Documentation, release, privacy allow-list, package-version, and journal records are co-versioned. `content/`, `tests/fixtures.json`, runtime dependencies, and network behavior are unchanged.

## Cross-model audit — round 1

Grok and Claude independently reviewed the uncommitted worktree through the approved private-diff relay. Both returned **MERGE WITH FIXES**; Claude reconciled the panel. Full reconciliation is preserved at `~/Desktop/8ball/audits/codex_t3_facet_rotation_2026-07-19_response.md` (relay run `20260719-010415-codex-t3-facet-rotation`).

Disposition:

- Absorb: add the missing v0.49 amendment stating that a funded t3 result-screen flip decrements `eight_ball_credits_v1`; preserve the v0.3.0/v0.36 wording as lineage.
- Absorb: clarify the separate result-screen state machine versus same-pair form-submit idempotence.
- Absorb: actively clear abandoned pending-profile intent on a zero-credit t3 top-up. The reconciliation dismissed the stale-pending path, but direct sequence review found a reproducible route: abandon a Path A paywall, reload the stored t3 profile, then top up from `flip again`. Clearing before the top-up is the fail-closed contract.
- Absorb: replace stale about-modal “life-path bracket” copy with the rotating-position truth.
- Absorb: pin parity with `resolveBracket` and pin the host note-selection call so the duplicated anchor tables or render wiring cannot drift silently.

Because the pending-profile fix changes runtime behavior after round 1, the audit-cleared signal remains open until a delta re-audit passes.

## Cross-model audit — delta

Grok and Claude independently re-reviewed the full post-absorb worktree through relay run `20260719-011336-codex-t3-facet-rotation`. Both returned **SAFE TO MERGE**; reconciliation found no blocker/high issue and no material disagreement. Full response: `~/Desktop/8ball/audits/codex_t3_facet_rotation_2026-07-19_reaudit_response.md`.

The delta verified the v0.49 credits amendment, clear-before-open stale-pending closure, rotating about copy, anchor-parity test, exact host note-selection pin, and unchanged privacy/content/fixture boundaries. The independent-audit signal is clear. This status does not authorize commit, push, PR creation, merge, or deploy; those remain separate controller actions.

## Audit clearance

DOCTRINE §1.H / §5 / §7 and the v0.49 footer were reviewed against debit coupling, paid-return behavior, persistence/reset semantics, stale-pending cleanup, c.1 content truth, and both override citations. Round 1 returned MERGE WITH FIXES; all findings were dispositioned; delta re-audit returned SAFE TO MERGE. The §10 independent-audit gate is cleared for this staged diff.
