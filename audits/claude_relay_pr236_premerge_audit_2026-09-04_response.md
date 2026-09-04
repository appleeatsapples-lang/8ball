# PR #236 pre-merge cross-model audit — reconciled response

**PR:** 8ball #236 — DOCTRINE v0.77: the host panel blanks on close too —
one part contract, two panels
**Base → head:** `55e6975` → `fd3a922` at audit start; every finding lands
in the reconciliation commit carrying this artifact — no mid-audit push.
**Process:** DOCTRINE §10 / L48 two-lane adversarial review; per-lane
subdirectories and port bands; both lanes worked from their own clones and
left the working tree untouched. Both live-fired the host panel at 390 /
1100 / 1440; Lane A also drove the base for a side-by-side.

## Lane verdicts

| Lane | Verdict | Findings |
|---|---|---|
| Lane A | MERGE WITH FIXES | 1 HIGH, 4 MED, 4 LOW; 19 mutants, 13 killed, 4 real survivors |
| Lane B | MERGE | 1 MED, 3 LOW; 11 mutants, 11 killed (2 source-pin-only) |

**Reconciled outcome: MERGE WITH FIXES — the change was behaviourally
correct on every close path at every width, with no a11y or live-region
regression and a genuine de-fork; but it shipped one measured animation
regression on every viewport below 1100px, and three of its pins were
weaker than the claims they were cited for. All fixed. Final call remains
with the controller per L48 (no advance authorization covered this pass).**

## The finding that mattered, and how it was missed

**HIGH (Lane A) — the blank destroyed the close animation below 1100px.**
`close()` removes `.open`, starting the panel's 280ms `max-height`
collapse; blanking in the same task reflows the box to its empty-content
height in the first frame. Measured at 390 wide: the card dropped 365px and
the rail 183px in one frame (base: ~16px), then an empty panel carrying only
the CLOSE button faded out for the remaining ~270ms. Unaffected at ≥1100,
where the docked panel has `max-height: none` and never animated.

**Both the PR's own live-fire and Lane B's missed it, in the same way.** Both
asserted end-state DOM — "every close path blanks all six parts" — which is
true and says nothing about the transition. Only Lane A's frame-by-frame
timeline saw it. Recorded plainly because it is the §8 gate 9 lesson in its
recurring form: a destination assertion is not a journey assertion.

**Fixed on both panels**, so they cannot re-fork: the blank waits 300ms — the
module's existing outlast-the-transition convention, shared with the scroll
timer — and a reopen inside the window cancels the pending timer. The dyad's
`clearOutput` teardown still blanks IMMEDIATELY: that path carries the §5.F
guarantee and animates nothing. Re-measured after the fix: first-frame drop
16px, card 1218 → 1093 → 955 → 933 across the transition, body blanked at
305ms, no console errors.

## Findings and dispositions

**MED (Lane A) — the coverage pin was blind to digits and capitals.** Its id
pattern was `[a-z-]+`, so a part named `body2` or `subTitle` was invisible.
Lane A's mutant — a part emitted in both prefixes, written on every open,
blanked by neither panel — passed the full suite, which made the amendment's
"neither panel can gain a part without a blanker" false as written. Widened
to `[A-Za-z0-9-]+` in both the pin and the harness's markup mock, and the
pattern is now pinned against a synthetic part, so the widening is
falsifiable instead of decorative.

**MED (Lane A) / LOW (Lane B) — the behavioural blank test was
self-referential.** It derived its expectation from the very lists under
test, so dropping a part shrank the oracle along with the code and the test
stayed green. It now walks the panel's own nodes and asserts the walk covered
every one — an oracle independent of the constants.

**MED (Lane A) — the `{ close }` handle had zero coverage.** Neutering it to
a no-op, or returning the no-op handle from the live path, both passed 2091
tests; only the guarded no-op handle was exercised. The LIVE init's handle is
now driven: it closes, blanks after the collapse, returns focus, and is
idempotent.

**LOW (Lane A) — the amendment over-claimed.** "The device owner's own label
and reading, never a second person's" is true of the NAME (verified: the host
head is `coordinate.label.toUpperCase()` and never interpolates one) but not
of the reading, since `try another` re-enters the form. The sentence now
claims the name and says so.

**Three of the reconciliation's own fixes were cut back by their own
mutants.** A `!activeCell` guard in the deferred callback and an up-front
`blankPanel()` in each `openFor` all survived removal: the cancel in `openFor`
is what carries the guarantee, and the open overwrites every part regardless.
They were deleted rather than kept as untested defence, with the reasoning in
the code.

**Recorded, not changed.** Lane B: two pins (the blank's position after
`setPaneEntry`, and `blankPanel` iterating the lists) are source-shape only
and protect documented rationale, not runtime behaviour — accurate, and worth
knowing when reading the tally. Lane A: `aria-labelledby` names two nodes the
blank empties, harmless only because `aria-hidden` lands first; a latent trap
for anyone who later drops that attribute. Lane B resolved the `Object.freeze`
question against Lane A — the freeze does throw on mutation under strict mode,
so it is real protection for a value two modules share, merely untested.
Lane A verified there is no spurious live-region announcement, at the
accessibility-tree level and by mutation ordering, on both head and base.

**The PII-gate sighting — neither lane could reproduce it either**, so it
stays unpinned, and both agree leaving the scanner untouched in this PR is
right. Both verified the mechanism from source. Lane B added that `BANNED`
has nine entries and the walk runs once per entry with no caching, so the
untracked report bulk multiplies the read burden ninefold per run — and that
this class has bitten once before (`.claude` was added to `SKIP_DIRS` after
a local settings file leaked the operator handle into this same scan). Lane A
found a correctness channel rather than a cost one: the product auditor stores
every check's full subprocess output unconditionally, and the local-PII check
shells out to a script that prints the operator's own patterns and matching
lines on a hit — so on the operator's machine one local hit writes an identity
token into a report the public scan then reads, in a file the repository does
not carry. **Filed as a named follow-up: scope the walk to tracked content, or
skip `audits/automated`. Both lanes say it should not be left a third time.**

## Reconciled verification (post-fix head)

- Suite 61 files / 2095 tests green; product audit PASS, 0 blocking.
- Nine reconciliation mutants, all killed: blanking synchronously again on
  either panel; the teardown deferred to a timer; the coverage pattern
  narrowed back; either panel's `openFor` cancel removed; the guards and
  up-front blanks whose survival cut them.
- Live-fire at 390 on a frame timeline (the check that was missing): the
  collapse is smooth and the blank lands after it.
- Gates: the `test` job's DOCTRINE-artifact leg and `l48-gate` were red by
  design until this artifact; this file satisfies both.

qualifier: recorded, not certified. Merge authority remains the controller's.
