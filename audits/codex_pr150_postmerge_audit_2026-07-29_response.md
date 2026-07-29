# Codex audit — PR #150 · L48 record · **POST-MERGE**

**PR:** #150 — `feat(cards): host the B-10 batch — 80 extended specimens, 288 → 368 JPEGs`
**Merged:** `c30e93a`, 2026-07-29 05:49Z, from head `bd0dfce`
**Audited:** 2026-07-29 ~08:01–08:10 — **after the merge, not before it**
**Auditor:** Codex (`gpt-5.6-sol`, reasoning effort xhigh, sandbox read-only) via `~/ai-relay/relay --models codex --base origin/main`
**Run:** `~/ai-relay/runs/20260729-080131-8ball/` · 340,311 tokens
**Implementer:** CC lane. Audit and implementation are separate seats, per L48.

*(Bare PR numbers only — `audits/*.md` is tracked content and is **not** in the PII scanner's
`DOCTRINE_ALLOW`, so a full GitHub URL here fails `tests/pii_scan.test.js` on the repo owner's handle.)*

---

## Why this says POST-MERGE, and what went wrong in the bookkeeping

**#150 merged at 05:49Z. I relayed it for a "pre-merge" audit at 08:01 — about two hours later — and
did not notice.** I had run `gh pr checks 150`, seen `l48-gate fail`, and read that as *open and
gated*. I never checked `state`. The checks I was reading came from a run against the pre-merge head
and were stale; the PR was already closed.

So this is **not** the gate artifact it was written to be. It is a post-merge audit record.
Consequences, stated plainly rather than papered over:

- **#150 merged without an L48 artifact.** The `l48-gate` job was red at merge time. Nothing blocked
  it — per `CLAUDE.md`, failed CI does not block a merge here; both checks are advisory-but-binding
  by convention. The convention was not met, and this file does not retroactively make it met.
- **The audit itself is fully valid.** Codex reviewed head `bd0dfce`, which is exactly what merged as
  `c30e93a`. Verified while writing this: `git diff bd0dfce..HEAD -- cards/ scripts/ tests/cards_hosting.test.js`
  is **empty**, and `build_card_jpegs.py --check` on current `main` reports
  `checked 368 JPEGs, 29.96 MB total — all match tracked bytes`. **The bytes that were audited are the
  bytes that shipped.**
- A first attempt landed this artifact on the merged branch as `f1b742b`. That commit is orphaned —
  its PR was already closed — and is superseded by this file. The branch can be deleted.

---

## Verdict as received

> **SAFE TO MERGE**
> **Findings:** None — no P0/P1/P2/P3 defects found.

The same auditor returned **MERGE WITH FIXES** on #136 hours earlier and all three of its findings
were real and were fixed. A zero-finding verdict from it is a result, not a formality.

## What the auditor verified independently

- **`npm test` on its own run: 41 files, 1,445 tests passed.**
- **The 368 + 10 repin is exact and ordered** — Codex matched it against the four disjoint queues
  itself: 368 local + 10 external = the whole queued corpus.
- **Zero exact caption collisions across the complete caption corpus**, and it closed the near-miss
  case by reasoning rather than assertion: recovery matching is exact after NFKC/trim and further
  constrained by platform, ledger date, and the 6h window, so near-similarity cannot confuse T-1.
- **Git itself establishes the 288 prior JPEGs are unchanged** — stronger than my byte-compare,
  because it does not depend on my having run mine correctly.
- **Cross-libjpeg reproducibility is intentionally not claimed** — read as a deliberate disclaimer.
- ~7.3 MB PR increase / 29.96 MB corpus: reasonable.

---

## The substantive result: PII is reversible in principle, and no automated gate can see it

This was attack surface #1 in the brief — the only genuinely new risk in this PR, and the one I could
not clear myself.

**What Codex found.** It **reconstructed all 80 synthetic dates uniquely** from the rendered
coordinates; the 1951 specimen was unique even across a full 1900–2100 search. It also observed that
`tests/pii_scan.test.js` scans only a text-extension allow-list (`TEXT_EXTS`), so **JPEGs are never
scanned at all**.

**Why it still cleared.** The fixtures are programmatically synthetic, carry no identity, and match
none of the private personal-date entries in the local audit. That satisfies **DOCTRINE §11's fixture
DOB sub-rule**, which states fixture DOBs are *"chosen for the calc path they exercise, not anchored
to any real person"*, and prescribes a 12-year shift if one ever collides with a real person. Doctrine
already permits DOB-derived **symbols** without the DOB **string**.

**What this changes, and it is not nothing:**

1. **"The PII scan passed" is not evidence of non-reversibility.** I leaned on `run_local_audit.sh`
   clean across 524 files as though it bore on this. It does not — it cannot read a JPEG, and the
   reversibility lives in the rendered coordinates, not in any string.
2. **The exposure is structural, not specific to these 80.** Any card rendered from a real person's
   DOB carries the same reconstructable coordinate set, and nothing in CI would notice. Today's
   protection is entirely the **fixture-selection discipline of §11**, enforced by whoever picks the
   dates — a human control, not a machine one.
3. **Correctly scoped as pre-existing.** Codex is right that this is a doctrine / full-t3-share
   question, not a defect #150 introduced. Recorded here so it is on the record *before* someone finds
   it the expensive way.

---

## Disclosure: I moved a file under the auditor mid-run

The brief pointed Codex at `~/8ball/reach/postpeer_catalog.py` and
`~/8ball/reach/tiktok_pipeline/post_tiktok_postpeer.py` — outside this repo — because the
"admission before hosting is safe" claim rests on `media_is_live()` and `select_publishable()`, and
neither appears in the diff.

**The run started 08:01. On operator word I ported `select_publishable()` into the TikTok pipeline at
~08:10, while the audit was live.** Codex's summary therefore says TikTok *"does not walk past an
unavailable head"* — accurate for the bytes it read, **stale for what is now on disk**.

Its safety conclusion is unaffected, and is the sharper statement anyway: TikTok *"checks media before
claiming or posting, so it can stall — not post a 404 or burn the code."* Stalling was the defect;
posting a 404 or burning a code never was.

---

## Scope note — what is NOT covered by this verdict

The vault (`~/8ball`) is not a git repository, so none of the following was under review and none of
it is covered:

- admission of the 80 codes to the four surface queues,
- `select_publishable()` in either pipeline, and the `resolve_asset()` prefix fix that let TikTok
  resolve `spec_extended_*` at all — 20 of its 22 admitted codes were failing outright,
- `media_is_live()`'s Content-Type guard.

Reach-side suites after those changes: **catalog 51, TikTok 38, green.** They want their own review;
this artifact does not stand in for one.

---

## Verification at record time (on `main`, post-merge)

| Check | Result |
|---|---|
| Audited bytes vs shipped | `git diff bd0dfce..HEAD -- cards/ scripts/ tests/cards_hosting.test.js` → **empty** |
| `build_card_jpegs.py --check` | `checked 368 JPEGs, 29.96 MB total — all match tracked bytes` |
| `npm test` | **41 files / 1,445 tests passed** |
| `bash audits/run_local_audit.sh` | clean, **524 files** *(see the PII section for what that does and does not prove)* |
| Manifest coverage | 368 rendered + 10 external = **378 = every queued code** |

---

## L48 disposition

**Audit cleared on the merits; the gate sequence was not followed.** The verdict is SAFE TO MERGE with
zero findings and nothing required fixing — but it was obtained after the merge, so it satisfies the
*evidence* requirement retrospectively and not the *ordering* one. Filed as a post-merge record so the
ledger reads true.

**Process lesson worth keeping:** `gh pr checks` shows check results; it does not tell you whether the
PR is open. Read `state` before treating a red gate as a live block.

**Carried forward:**

- **B-10 remains open.** This batch moved runway ~55 → ~74 unfired per surface (4.6 → 6.2 days), dry
  date ~2026-08-02 → **~2026-08-04**. The sprint ends **08-08**; the ~260-code estimate stands.
- **The PII reversibility property above** — an operator/doctrine question, not a code change.
