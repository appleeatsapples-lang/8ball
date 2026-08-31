# PR #220 pre-merge cross-model audit — reconciled response

**PR:** 8ball #220 — no leaf type crosses the redaction boundary: the
PR #194 fast-follow lands
**Base → head:** `37d8acf` → `86cc0ad` at audit start; every finding lands
in the reconciliation commit carrying this artifact — no mid-audit push
this time (the pr217/pr218 relay-collision lesson applied).
**Process:** DOCTRINE §10 two-lane adversarial review, relayed through the
CC lane. Both lanes reproduced every claim in scratch worktrees, ran their
own mutants beyond the two claimed, and swept type semantics old-vs-new.

## Lane verdicts

| Lane | Verdict | Findings |
|---|---|---|
| Lane A | MERGE WITH FIXES | 6 (1 MED, 1 LOW, 2 NIT, 2 INFO) |
| Lane B | SAFE TO MERGE | 2 (1 MED, 1 LOW) |

**Reconciled outcome: MERGE WITH FIXES — every fix-class finding landed;
verified below. Final call remains with the controller per L48.**

## The code, verified sound by both lanes

All claims reproduced independently: assurance suite 104/104 in this
container, both revert-mutants killed with the exact FAIL/ERROR
distinction claimed, vitest 57 files / 1995 tests green, product audit
PASS 0 blocking. One lane instrumented `redact_paths` inside a real
end-to-end audit run: zero non-native leaves or keys occur today (keys
100% str), so the change is behavior-neutral now and purely
forward-looking insurance — established empirically, not by inspection.
A 22-type equivalence sweep found no type where the new path changes
artifact content beyond redaction; bool/IntEnum ordering, sets,
frozensets, bytes, nested tuples, recursion cost and the key-collision
disambiguation branch all check clean. The sweep also confirmed a bonus
the PR did not claim: set/frozenset/bytes leaf vectors are closed too.

## Findings and dispositions

**MED (both lanes, independently, from opposite ends) — the new tests
did not pin the fallbacks' genericity.** Lane B narrowed the LEAF
fallback to an allow-list of exactly {Path, OSError} — the two types the
test used — and rode both new tests green. Lane A narrowed the KEY
fallback to Path-only and survived the entire 104-test suite while the
mutant still crashes with TypeError on tuple/bytes keys — exactly the
failure the fallback exists to prevent (asymmetric with the leaf test,
whose second type already killed the Path-only leaf mutant). **Landed:**
a set leaf (`{root}`) joins the leaf test's payload and a tuple key
(`(1, 2)`) joins the key test, each with an exact-value assertion; both
narrowing mutants now die (allow-list leaf FAILS, Path-only key ERRORS),
re-verified alongside the two original revert-mutants.

**LOW (Lane A, F2) — a stringified non-native key can collide with a
JSON-native int key without tripping the disambiguation branch,** since
`3` and `"3"` are distinct dict keys in Python but serialize identically,
yielding duplicate JSON keys (last one wins on re-parse). Pre-existing
shape (a str `"3"` beside an int `3` did the same before this PR) and
unreachable today. **Recorded and queued** in the journal beside the
other named non-ordered items rather than widening this PR.

**LOW (Lane B) / NIT (Lane A, F3–F4) — the journal true-up was
inconsistent, in form and in reach.** The new entry flipped only the
entry directly above it, using a novel `SHIPPED as #N` form where the
historical convention is `SHIPPED (#N)`, and stale `STAGED on branch,
PR pending` headings remained for a run of already-merged PRs.
**Landed:** the form normalized, and thirteen headings for #208–#219
flipped to `SHIPPED (#NN)` per the existing batch-flip precedent (the
#56 cleanup); entry bodies untouched, preserving the per-cut record.

**INFO (Lane A, F5) — console stdout stays outside the boundary.**
Pre-existing and deliberate (documented in the module header: stdout
names the report files so the controller can open them; it is not the
shared artifact). No action.

**INFO (Lane A, F6) — `default=str` is now provably unreachable for
types the recursion sees.** The code comment already hedges it honestly
as belt-and-braces. No action.

## Reconciled verification (post-fix head)

- Assurance suite 104/104 OK in this container after the genericity
  pins; four mutants killed in total (leaf revert, key revert,
  allow-list leaf, Path-only key); full vitest suite 57 files / 1995
  tests green; product audit PASS, 0 blocking.
- Both lanes' clean sweeps stand: no current evidence-construction site
  stores a non-native leaf or key; PII scan of the diff against every
  scanner pattern clean; the journal lineage (PR #194 → pr219 F5 →
  this fix) cross-checked verbatim against the historical entries.

qualifier: recorded, not certified. Merge authority remains the controller's.
