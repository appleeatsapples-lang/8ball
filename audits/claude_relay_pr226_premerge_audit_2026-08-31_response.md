# PR #226 pre-merge cross-model audit — reconciled response

**PR:** 8ball #226 — DOCTRINE v0.69: the §1.J price-column reconciliation
closes, adopting nothing
**Base → head:** `00d514d` → `4757059` at audit start; every finding lands
in the reconciliation commit carrying this artifact — no mid-audit push.
**Process:** DOCTRINE §10 two-lane adversarial review of CONSTITUTION
text — the mandatory cross-model read for a DOCTRINE-touching PR. The
brief's sharpest question was aimed at the amendment's own derivation:
does "two units at $3" survive the one purchase path the product
presents?

## Lane verdicts

| Lane | Verdict | Findings |
|---|---|---|
| Lane A | MERGE WITH FIXES | 2 P1, 2 P2, 4 P3 |
| Lane B | MERGE WITH FIXES | 1 MAJOR, 2 minors, 1 info |

**Reconciled outcome: MERGE WITH FIXES — the amendment's operative
clause is REWRITTEN, not patched; every fix-class finding landed.
Final call remains with the controller per L48.**

## The headline: both lanes broke the derivation, independently

The first draft derived t5's $6 as "two units" of a $3 complete-sheet
unit, reading v0.55's run as fractions-to-whole. Both lanes converged
on the same hole from different angles: on the presented t3→t5 path a
buyer's cumulative spend is $3 + $6 = $9 — three units for two
delivered sheets — so the subtraction silently prices the relation
layer at exactly the standalone $3 the same sentence claimed no clause
quotes, in exactly the category v0.60 used to retire the $9 rung ("five
derived strings, computing no new coordinate"; §1.J itself records the
relation layer computes no new coordinate). One lane additionally showed
the unit account HOLDS on the direct path (the bare `neysyv` URL grants
t5 from any tier at $6 — real, not hypothetical) and that non-proration
is the column's established behavior (a t1 owner pays the full $3 to
reach t3), merely undisclosed.

**Landed as a rewrite.** The reconciled clause adopts the sound
reading: the Price column is v0.55's LEDGER of controller-set,
one-time, FROM-ZERO rung prices — monotone, never derived by formula,
never prorated on upgrade, with the non-proration now DISCLOSED. t5's
from-zero price is $6 — two complete sheets' worth at the ladder's
literal $3, the relation layer deliberately unpriced — and the clause
states outright that subtraction has never priced anything in this
column (the t1→t3 subtraction "prices" five coordinates plus the
written entry at $3 while the same $3 buys all fifteen from zero), so
the v0.60 defense is never owed rather than merely unquoted.

## The other findings and dispositions

**P1-B (Lane A) — "already live on Gumroad" was false.** Only the $3
product is live; the $6 listing is staged and unpublished pending the
v0.67 operator-hand steps; t1/t2 are not currently separate storefront
offers. **Landed:** the clause keeps LEDGER and STOREFRONT distinct and
states the storefront truth plainly.

**P2 (Lane A; Lane B F3) — "fractions-to-whole" reinterpreted v0.55.**
The run is ordinal ($1 buys 10 of 15 coordinates, not a third of the
sheet). **Landed:** the gloss is dropped; only the literal claim
survives ($3 is the complete-sheet price, which the sprint sells).

**P2 (Lane A) — the "zero open reconciliations" count was argued, not
literal:** the v0.58 sentence still read open on the page. **Landed:**
it carries an appended MOOTED marker (v0.60 retirement as the record),
so zero is literal; the mooting argument itself was verified sound.

**P3-E (Lane A; Lane B F2) — a fabricated quotation.** No shipped or
constitutional string reads "the complete sheet · $3 once". **Landed:**
the clause quotes §4.B v0.56's own `complete 8ball · $3 once` exactly.

**P3-F (both lanes) — "that note's t5 extension" overstated.**
**Landed:** the amendment names itself a NEW supersession of the Price
column standing beside the Table-currency paragraph's v0.55 note.

**P3-G (Lane A) — the dominance fact, surfaced.** Once `neysyv` is
published, t5 at $6 entitles a strict superset of t3 at $3, so direct
$6 dominates the presented $9 path. **Landed:** stated in the clause as
a property of the declared column rather than left to be discovered at
publication; whether any below-t3 surface should present the direct
path remains the reserved v0.61/v0.67 controller decision, restated.

**P3-H (Lane A, informational) — section placement:** the amendment
sits in the amendment stack after v0.67 (which is itself §1.J-headed
there) and the §1.J marker routes the reader explicitly.
Precedent-consistent; recorded, no change.

**Environment (Lane A), recorded not rerun-past:** one product-audit
run hit the known `tests/cities.test.js` 15s contention flake (passes
in isolation; the direct suite run was green). Merge-time CI is the
clean check.

## Mechanically clean, verified by both lanes byte-level

L17: word-diff shows the only deletion in DOCTRINE.md is the footer
label rotation; all markers appended with originals intact; the locked
rung table untouched. Journal: exactly four deletions, all heading
suffixes (the STAGED→SHIPPED batch), bodies untouched, PR numbers
verified against git log; the eaten-heading guard green. Footer
rotation correct (one head, one prior, v0.67 to superseded, changelog).
Suite 57 files / 2011 tests green; assurance suite 104 OK; product
audit PASS, 0 blocking; no PII in the diff. Both `test`'s
DOCTRINE-artifact leg and `l48-gate` were red by design until this
artifact; this file satisfies both.

qualifier: recorded, not certified. Merge authority remains the controller's.
