# Codex pre-merge audit — PR #136 · L48 response

**PR:** #136 — `feat(cards): render all four surface queues — 97 → 288 hosted JPEGs`
**Auditor:** Codex (`gpt-5.6-sol`, reasoning effort xhigh, sandbox read-only) via `~/ai-relay/relay --models codex --base origin/main`
**Run:** `~/ai-relay/runs/20260729-004554-8ball/` · 225,689 tokens
**Date:** 2026-07-29
**Implementer:** CC lane. Audit and implementation are separate seats, per L48.

*(Bare PR numbers only: `audits/*.md` is tracked content and is **not** in the PII scanner's
`DOCTRINE_ALLOW`, so a full GitHub URL here fails `tests/pii_scan.test.js` on the repo owner's
handle. That is exactly how the first push of this artifact went red.)*

---

## Verdict as received

> **MERGE WITH FIXES** — 1×P1, 1×P2, 1×P3.

**All three accepted. All three fixed in this branch.** Disposition below, then the re-verification.

---

## What the auditor confirmed independently

Codex read the repo and ran its own checks rather than trusting the brief:

- The four queues are **genuinely pairwise disjoint** (it computed all six intersections = 0; 66 / 118 / 60 / 54 rows, union 298).
- The fixed X→TikTok→IG→Threads read order **exactly reproduces the committed 288** after the ten extras are skipped — "set membership cannot reorder output or affect surface selection", which was attack-surface #1 in the brief.
- No scheduler or ledger path changed.
- All 97 prior JPEGs remain byte-identical.
- Cross-libjpeg determinism is **correctly disclaimed** rather than overclaimed.
- The bounded ~23 MB static corpus is reasonable for this repo.
- **No package or runtime dependency leaked** (attack-surface #7).

---

## F1 · P1 — extras were excluded by manifest-key membership, with nothing tracking them

**Finding.** `scripts/build_card_jpegs.py:105`, `tests/cards_hosting.test.js:149`. The "four-queue union" is really 288 local codes out of 298 queued; the ten omissions and their URLs appeared in **no tracked guard**. A missing or malformed `publicUrl` makes `image_url_for()` fall back to `cards/{code}.jpg` — which this script deliberately does not render — and a stale/404 URL is used directly. Either case recreates the permanent no-ledger stall **while CI stays green**.

**ACCEPTED.** This is the same defect class the PR exists to close, left open on a ten-code flank. The auditor is right that skipping by key membership alone is not tracking.

**One correction to the finding's evidence, not its substance.** Codex reported `curl: (6) Could not resolve host: assets.postpeer.dev`, which reads as though the URLs are dead. That was its own sandbox: it had no DNS (the same run shows `failed to refresh available models: timeout`). Verified from this seat instead — `assets.postpeer.dev` resolves (CloudFront alias) and the extras return **HTTP 200**. So the hazard was **latent, not live**. The finding stands anyway: nothing guarded it, and "works today" is not a control.

**Fix.**
- `extra_specimen_codes()` → `extra_specimen_urls()`: an extra is only skipped if it has a usable `https://` URL. One without becomes a **hard error**, because that is precisely the case that falls back to an unrendered local card.
- `cards/manifest.json` gained `external` + `external_count`: the ten codes **with their URLs**, so cards + external together cover all 298 queued codes.
- `tests/cards_hosting.test.js` gained `EXPECTED_EXTERNAL` (pinned) and a new test asserting: the external list matches exactly, `external_count` agrees, every URL is a string starting `https://`, every external code is **not** rendered locally, and the union covers all 298.

**Stated limit.** Reachability is *not* asserted in CI — DOCTRINE §5 forbids network in tests. The guard catches an untracked, missing, or malformed URL; it cannot catch a URL that 404s later. Live reachability was checked by hand at audit time (10/10 → 200) and is recorded here as evidence, not as a standing control.

## F2 · P2 — missing queue files were silently ignored

**Finding.** `scripts/build_card_jpegs.py:93`. `if queue.is_file()` meant a renamed or unmounted queue produced a **partial manifest and a success message**.

**ACCEPTED** — same silent-partial-success shape as F1. **Fix:** all four queues are now required; any absent one raises before rendering, naming the missing paths. Verified: `VAULT=/nonexistent` now exits with `ERROR: surface queue(s) missing — refusing to render a partial manifest`.

## F3 · P3 — generated metadata still asserted the retired assumption

**Finding.** `scripts/build_card_jpegs.py:225`, `cards/manifest.json:2`. The manifest note still said codes byte-match `reach/ig_pipeline/queue.txt` **(superset of the Threads queue)** — the exact assumption this PR retires — and `--check` ignores that field. Plus `CLAUDE.md`'s inventory still said 97 cards.

**ACCEPTED.** A generated file that documents a dead assumption is how the next reader inherits it. **Fix:** the note now describes the four-queue union and the `external` block; `CLAUDE.md` reads **288** with a pointer to the off-site ten.

---

## Re-verification after the fixes

| Check | Result |
|---|---|
| `npm test` | **41 files / 1445 tests passed** (one more than before: the new external-tracking test) |
| `build_card_jpegs.py --check` | `checked 288 JPEGs, 23.02 MB total — all match tracked bytes` |
| 97 pre-existing JPEGs | byte-identical, determinism unaffected by the fixes |
| `bash audits/run_local_audit.sh` | clean, **443 files** |
| P2 guard | fires correctly on a missing queue |
| Extras reachability (manual, not CI) | 10/10 → HTTP 200 |
| Manifest coverage | 288 rendered + 10 external = **298 = every queued code** |

**Flake note, disclosed:** one `npm test` run failed on `tests/cities.test.js` — a 15s **timeout**, on a machine simultaneously running a 288-image render and a relay review. It passes on a quiet re-run and is unrelated to this change. Recorded rather than silently re-run.

---

## L48 disposition

**Audit cleared, subject to the operator's merge word.** Verdict was MERGE WITH FIXES; all fixes are applied in-branch and re-verified above. Audit and implementation were separate seats. The controller remains sole merge authority — this artifact satisfies the gate's evidence requirement, it does not authorize the merge.

**Carried forward, not fixed here:** blocker **B-10** is untouched by this PR. Every PNG source on disk is now rendered, so the corpus remains 298 codes with 245 burned and every surface still dries **~2026-08-02**. Closing B-10 needs art authored, not rendered.
