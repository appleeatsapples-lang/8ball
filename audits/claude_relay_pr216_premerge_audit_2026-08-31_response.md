# PR #216 pre-merge cross-model audit — reconciled response

**PR:** 8ball #216 — dyad t5 activation: the comparative rung goes on offer
**Base → head:** `573a71d` → `c4ba96d` at audit start; the reconciliation commit
on the same branch carries every landed fix below.
**Process:** DOCTRINE §10 two-lane adversarial review, relayed through the CC
lane. Both lanes received the same brief, the full diff, and repo access; both
independently ran the suite, the auditor, the claimed mutants, and their own
live-fire passes in the pre-installed Chromium (one lane additionally drove
blocked-storage, replay, and garbage-param passes).

## Lane verdicts

| Lane | Verdict | Findings |
|---|---|---|
| Lane A | MERGE WITH FIXES | 2 (1 LOW, 1 NIT) |
| Lane B | MERGE WITH FIXES | 14 (2 HIGH, 5 MED, 5 LOW, 2 NIT) |

**Reconciled outcome: MERGE WITH FIXES — every fix-class finding landed;
verified below. Final call remains with the controller per L48.**

## Findings and dispositions

**HIGH 1 (Lane B) — the re-point trap.** `neysyv`'s tracked Content-tab return
param is `/?paid=t2` from its v0.6.0 life as the t2 product — §5.B v0.36 and
§1.D v0.55 both still bound the listing to t2, v0.67 superseded neither, and
the journal framed the operator remainder as a fresh wire. Publishing without
re-pointing would silently grant a $6 buyer t2: below the $3 product, no dyad,
monotonic, permanent, runtime-undetectable. **Landed (doc-truth):** the v0.67
supersession list now names the §5.B v0.36 mapping and the §1.D v0.55
restatement (listing re-purposed t2 → t5); the operator remainder is rewritten
everywhere it appears — DOCTRINE, footer, journal, `8BALL.md`, and the
constant's own source comment — as "RE-point the existing button from
`/?paid=t2` to `/?paid=t5`", with the failure mode stated in one sentence.

**HIGH 2 (Lane B) — the resurrected credits claim.** v0.67, the footer, and
the journal all said the `?paid=t5` return "grants +3 credits". It grants
none — `applyPaidReturn`'s one write is the tier, and §1.D v0.55 retired that
exact sentence. **Landed:** all three corrected to "the monotonic tier write
is the entire grant (§1.D v0.55 — no credits exist)".

**MED 3 (Lane B) — no storage preflight on the new checkout.** Resolved as a
DECIDED exposure, stated in v0.67 rather than left to be found: the anchor
carries no `stagePurchase`-style preflight because the t5 return needs no
staged pending profile (the lane verified the no-pending branch is correct),
and the return path is retry-preserving by design — a failed `setTier` keeps
the `?paid=t5` URL and banners the allow-storage-then-reload instruction, the
same recovery every rung's return has.

**MED 4 (Lane B) — the rail checkout bypassed the product's only third-party
disclosure.** **Landed:** `#dyad-offer-note` injected beside the anchor,
carrying the modal disclosure's exact claim in the same register, shown and
hidden with the offer; pinned.

**MED 5 (Lane B) — two prices on one rail, and a delta label that overstated
the price to every device below t3.** **Landed** via the restrict option: the
offer is scoped to t3 exactly (`coordsForTier(tier).has('cardEntry') &&
!dyadEntitled(tier)`) — the one rung the "$6 second sheet + relation layer"
delta is true of. Below t3 the rail presents the $3 step alone; whether t5
joins that presentation stays the reserved v0.61 controller decision, now
explicitly not made by this PR. Truth-table and rail pins rewritten; live-fire
confirms free shows no dyad offer and t3 shows no $3 offer.

**MED 6 (Lane B) — a green test titled "the only purchase surface" was false
of the running product.** **Landed:** retitled to what it pins (index.html
carries exactly one Gumroad URL), plus a companion pin asserting the full
reachable-checkout set across `index.html` + `ui/*` is exactly {xjpvp modal,
neysyv dyad rail} — a third surface must be declared, not discovered.

**MED 7 (Lane B) — `8BALL.md` still said the constant stays empty.**
**Landed:** the storefront paragraph carries a dated partial supersession to
the v0.67 state, including the re-point trap.

**LOW 8 (Lane B) — two more unsuperseded empty-constant clauses.** **Landed:**
§7's v0.61-extension parenthetical and §1.J's "Two limits" closing sentence
added to the v0.67 supersession list.

**LOW 9 (Lane B) — the $6 control rendered half-width, four lines, below the
device footer.** **Landed:** the module's injected style spans the rail grid
for the injected pair and the note (`grid-column: 1 / -1`). Live-fire
re-measured: 358px full width at 390×844.

**LOW 10 (Lane B) — the hidden-guard scan cannot see injected controls.**
**Landed** via the targeted pin: both injected controls must wear the
`btn-block` class AND the shell must carry the `.btn-block[hidden]` author
guard — the dependency pinned at both ends.

**LOW 11 (Lane B) — fail-closed degradation was source-regexed, not
behavioral.** **Landed:** `dyadOfferVisible(tier, url = T5_PRODUCT_URL)` —
the empty-URL case is now driven at runtime across every tier. The amendment
notes why this is not the R6 mistake: R6 barred the ENTRY predicate from a
second input; the offer predicate is defined in terms of the URL.

**LOW 12 (Lane B) — the injection-time dark state was unpinned (mutant
survived).** **Landed:** asserted before any sync; the mutant now fails.

**NIT 13 (Lane B) — the in-screen placeholder CTA became permanent dead
code.** **Landed:** node, CSS rule, and both clearing blocks deleted; a pin
asserts `dyad-cta` no longer appears in the module.

**NIT 14 (Lane B) — "absent at t5" title over a hidden-only assertion, href
parked in the DOM.** **Landed:** the sync owns the href's whole lifecycle —
stripped whenever the offer hides — pinned at free/t1/t2/t5, and the test
retitled to the contract it enforces.

**LOW (Lane A) — the offer-label register test hand-rolled a weaker
second-person regex and skipped the banned-register table entirely.**
**Landed:** the label is scanned through the canonical
`tests/helpers/voice-register.js` apparatus (`voiceRegisterHits` +
`SECOND_PERSON_RE`), with the urgency alternation kept for the vocabulary the
§2 tables deliberately omit. Mutation-verified with the exact `yours`
inflection the ad hoc shape missed.

**NIT (Lane A) — the empty-URL source pins prove presence, not behavior.**
Superseded by the LOW 11 fix above: the degradation is now runtime-driven.

## Reconciled verification (post-fix head)

- Suite 57 files / 1989 tests green; product audit PASS, 0 blocking.
- Eight mutants killed on the reconciled shape: emptied constant, predicate
  widened back below t3, URL-guard dropped, href parked instead of stripped,
  offer injected visible, disclosure emptied, `yours`-inflected label, a JS
  click handler bolted on.
- Live-fire: free = $3 step only; t3 = $6 anchor full-width with exact bare
  href + disclosure, $3 offer gone; t5 = entry in, offer hidden AND
  href-stripped; zero page errors.
- Both lanes' clean checks stand: product identity (`neysyv` is the $6
  comparative listing v0.62 verified — the return-param trap is a separate
  axis, fixed above), §5.B mechanism, no new storage key, paywall modal pins
  untouched, R2 grandfather still t3, `?paid` replay idempotent, R6 contract
  holding at every tier including garbage values.

qualifier: recorded, not certified. Merge authority remains the controller's.
