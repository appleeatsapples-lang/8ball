# PR #97 pre-merge cross-model audit — response (L48 author-lane gate)

Dated 2026-07-20. Packet §5 salvage leg: the sibling chat lane's preserved
meanings transition-pin delta, applied verbatim by CC from
`sessions/staged_salvage_meanings_behavior_2026-07-19.patch`. Author lane =
Claude (sibling chat authored the delta; CC applied it), so the gate
required a fresh non-author reviewer: a fresh Codex session via the local
`relay` orchestrator (codex CLI 0.144.6, model `gpt-5.6-sol`, reasoning
xhigh), run against a dedicated detached worktree at the PR head `8a0490f`
vs base `ef198cd`. Raw run: `~/ai-relay/runs/20260720-033635-relay-97/`.
This PR is the L48 gate's first post-promotion exercise on a claude/* code
subject: CI red-blocked on exactly the artifact step until this file — the
gate demonstrating itself, as the packet intended.

**VERDICT (Codex): MERGE WITH FIXES — 1 MED, absorbed in-PR at `7d5a8f0`
with the reviewer's verbatim remedy. No other findings.**

## Finding and disposition

**MED — `tests/meanings_behavior.test.js` (replacement test) — the
transition log proved ordering, not validity; the removed pre/post inert
assertions were independently load-bearing. ABSORBED at `7d5a8f0`.**
Codex: because the harness `_fire()` bypasses real inert behavior and the
interceptors record only truthy transitions, (a) a regression that never
clears inert on open, and (b) a `close()` that re-activates the panel
after the recorded transitions, both passed falsely. Remedy applied
verbatim: post-open pins `p.inert === false` + `aria-hidden === 'false'`;
terminal pins `p.inert === true` + `aria-hidden === 'true'` after the
ordering check (the interceptors pass through, so terminal reads see real
state). Focused suite 10/10 and full suite 1291/1291 after the absorb.

**Confirmed clean by the reviewer:** a direct re-inversion of `close()`
ordering fails correctly (`inert:close` labels); the
`Object.defineProperty`/`setAttribute` interception is test-local,
preserves underlying state, and fresh per-test fixtures prevent leakage;
no unrelated weakening in the file; scope is exactly one test file with
`ui/meanings.js` untouched (its sibling-diff hunk stays superseded by #88).

**Method note.** The reviewer's focused-suite execution was unavailable in
the relay worktree (`vitest: command not found` — deps deliberately not
installed in the fresh detached worktree), so its review was static;
execution evidence is this lane's local runs on the same tree: focused
10/10 pre-absorb, and post-absorb focused 10/10 + full 1291/1291 (36
files) with the local PII audit clean. `git diff --check` passed both
sides.

**Disposition requested:** with the MED absorbed and verified, no
objection to the merge word for #97.

— Filed by the CC lane per L48 choreography; reviewer of record: fresh
Codex session (non-author), 2026-07-20
