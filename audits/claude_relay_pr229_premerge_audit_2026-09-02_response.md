# PR #229 pre-merge cross-model audit — reconciled response

**PR:** 8ball #229 — DOCTRINE v0.71: the product is completely free —
the storefront retires
**Base → head:** `5399301` → `59bf877` at audit start; every finding lands
in the reconciliation commit carrying this artifact — no mid-audit push.
**Process:** DOCTRINE §10 two-lane adversarial review — the mandatory
cross-model read for a DOCTRINE-touching PR, on the largest change of
the project's life. Per the pr228 process note each lane worked in its
own subdirectory with its own port band; the round ran collision-free.

## Lane verdicts

| Lane | Verdict | Findings |
|---|---|---|
| Lane A | MERGE WITH FIXES | 1 HIGH, 6 MEDIUM (+ cleared list) |
| Lane B | MERGE WITH FIXES | 2 MEDIUM, 1 LOW, 1 INFO |

**Reconciled outcome: MERGE WITH FIXES — the runtime cleared from both
directions; the fixes were the record and three unswept corners, all
landed and verified below. The controller's "Approve and continue"
stands as advance merge authorization once green.**

## The runtime, cleared independently twice

Both lanes: `core/payments.js` and `ui/tiers.js` sha256-identical to
base; the free ceiling verified as a genuine one-seam change ("no
caller changed" held); suite 56 files / 1929 tests and the base's
56/1986 both reproduced; L17 word-diff over all of DOCTRINE yields
EXACTLY one deleted word-run (the licensed footer label rotation);
independent live-fire on byte-verified servers across eight device
states — fresh, legacy t1/t2/t3, raw t4, credits-only, a gendered
staged pending payload, all-garbage storage — every one rendering
15/15 + the dyad end-to-end (open, submit, relation, close/reopen),
scrubbing to exactly the surviving keys, zero console errors, zero
price strings, zero checkout anchors; paid-era archives reopen
identically; the banner fires at both save sites; modal
focus/trap/Escape correct; `?paid=t3` inert. One lane built ten
mutants, the other re-ran the relay's three: all died.

## Findings and dispositions

**HIGH (Lane A; Lane B LOW independently) — README.md is SERVED on the
production origin and still sold the product.** `netlify.toml`
publishes the repo root, its clean-list omits README, and the `/*`
rewrite is non-forced — so the file that says "Three paid rungs
($1/$2/$3…) open the rest of the sheet" and calls `ui/payments.js` a
"paywall/paid-return controller" is a live URL, falsifying the
amendment's "every shipped source file" claim (the guard scanned
`index.html` + `ui`/`core`/`content` only). **Landed:** README
rewritten to the free surface (the derivation split kept as
derivation), the guard's scanned set now includes README.md, and the
amendment names the real scope with the catch credited.

**MEDIUM (Lane A, driven live) — forget-device missed a post-boot
commerce write.** A stale pre-amendment tab can write
`eight_ball_pending_profile_v1` (name+DOB) AFTER this page booted;
forget then left it standing. **Landed:** the forget flow's fourth
erasure leg is the same read-verified scrub, wired through the
existing hook pattern and behavior-tested.

**MEDIUM (both lanes) — the amendment certified assurance work not
done.** "The auditor's assurance suite updated in the same commit" was
false — the suite had only been RUN — and the gap was real: one lane
gutted `check_t4_migration` into an unconditional pass and all 104
assurance tests stayed green. The pr228 lesson (never certify without
grepping), repeated. **Landed:** five `FreeCeilingProbeTests` now
exercise the real check against conforming and violating module stubs
(wrong ceiling / storage write / scrub no-op / scrub false); a gutted
probe fails four of them, mutation-verified; the amendment sentence
now says what actually happened, with the repeat named.

**MEDIUM (Lane A; Lane B's other MEDIUM = the first item) — unmarked
clauses reading as live commerce.** DOCTRINE's own
"authoritative composition" summary, the §1.D v0.55 density/stored-tier
clause, the §5 commerce-key bullets, and the §5.B Call 2 section all
still read live, and the footer's §1.D/§1.J/§5 scope claim had no
in-section routing. **Landed:** appended markers at all four sites
(originals intact per L17) routing to v0.71.

**MEDIUM (Lane A) — `.unlocked` was dead wiring under a false
comment.** No rule in either stylesheet keys it since the lock icon
left. **Landed:** the class riders removed from `index.html` and
`ui/sheet.js`; the render comment states the lineage honestly.

**MEDIUM (Lane A) — the unfurl still described the paywall.** Both
og/twitter alt strings said "ten sealed hatches." **Landed:** alts
rewritten. **QUEUED, controller-visible:** the og IMAGE itself still
shows sealed hatches; its PNG sources are off-repo, so regenerating
the asset is follow-up work, not this PR's.

**MEDIUM (Lane A) — 8BALL.md's storefront block.** **Landed:** the
superseded-in-full marker appended, per the #216 precedent.

**INFO (Lane B) — three stale comments** naming removed exports in
`ui/share.js` / `ui/profile.js` / `ui/tiers.js`. **Landed:** retired.

## Reconciled verification (post-fix head)

- Suite 56 files / 1929 tests green; assurance suite 109 OK (104 + the
  five probe tests); product audit PASS, 0 blocking; repo_shape + PII
  guards green; CLAUDE.md counts (13/14/56) unchanged and true.
- Mutation status: the ten + three runtime mutants from the lanes, the
  three probe mutants from the relay, and the gutted-probe assurance
  mutant — all verified killed on the reconciled tree.
- Gates: the `test` job's DOCTRINE-artifact leg and `l48-gate` were red
  by design until this artifact; this file satisfies both, and the
  journal-touch gate already passed.

qualifier: recorded, not certified. Merge authority remains the
controller's — exercised in advance by the standing "Approve and
continue" order, recorded in the journal and the PR.
