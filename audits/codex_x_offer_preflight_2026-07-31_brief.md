# Codex preflight audit brief — REACH-X-OFFER-01 (X sprint offer, 2026-07-31)

**Task:** independent A0 preflight audit of the staged offer experiment before the operator taps. This is the audits/-filed brief your 2026-07-30 STOP said was missing. Audit-only: read, verify, return a verdict file. No file modification, formatting, generation, staging, or deletion anywhere except writing your response file. Record starting and ending worktree state.

**Packet under audit:** `~/8ball/sessions/packet_offer_x_sprint_2026-07-31.md` (execution copy of the Controller's Task Packet REACH-X-OFFER-01, staged 2026-07-30 ~23:30 +03).

**Response file (your one permitted write):** `audits/codex_x_offer_preflight_2026-07-31_response.md` — per-criterion VERIFIED/INFERRED/UNVERIFIED with evidence, then overall **GO** or **STOP**. Your verdict is a gate, not execution authority: the tap is operator-only A2 regardless of GO.

## Verify (label every claim; current sources only, never a document's memory)

1. **Gate class.** The experiment is attention-generation + measurement (REACH-eligible under the freeze), not product work. Confirm no repository code change is required or implied by the packet.
2. **Your 2026-07-30 blockers, closed same night — verify, don't trust:**
   - Operating reads: `journal.md` front-matter now points forward (`next_strategic_read: 2026-08-13` · `next_analytics_read: 2026-08-06`); the reads themselves are file-backed at `~/8ball/reach/strategic_read_2026-07-30.md` and `~/8ball/reach/analytics_read_2026-07-20_pasteback.md` (+ K1 close in `~/8ball/reach/k1_scorecard_read_2026-07-27.md` §7).
   - Doctrine contradiction (line ~143 vs footer): v0.61 footer flipped to SHIPPED with the audit chain named (`audits/mechanical_footer_correction_v061_2026-07-30.md`). Confirm DOCTRINE.md no longer contradicts itself on #187's audit status.
   - This brief exists under `audits/` (self-evident, but cite it).
3. **Live preflight, at audit time** (state changes hourly — date-stamp your reads):
   - `~/8ball/reach/x_pipeline/posted_ledger.txt`: rows dated the tap day < 12; zero offer rows this day.
   - `~/8ball/reach/x_pipeline/HOLD`: absent.
   - `~/8ball/reach/x_pipeline/n_per_day.txt`: first line 12.
   - Asset exists: `~/8ball/content/8ball-specimen-cxx.png`.
   - No PENDING row in the X ledger (an unresolved PENDING is a stop).
4. **Slot arithmetic.** Confirm from `post_x.py` (today-row count vs cap, ~lines 159–171) that a hand-logged offer row is absorbed into the 12/day cap and the pipeline self-skips its last slot — i.e., the packet's "no 13th post" mechanism is real in code.
5. **Single-variable design.** One post, one surface, message-class is the only change; product, price, account, cap, route, asset class, checkout all held. Flag anything in the packet that sneaks a second variable.
6. **Copy vs doctrine.** Both captions: $3-single-full matches the 2026-07-29 ~21:25 ladder lock; no $1/$2/$6/$9/tier language; no prediction/therapeutic/guidance claim (§2 clinical); exactly one URL, the first-party `/x` path; no Gumroad link in caption; §5.1.a labeled-sprint requirements met (product name + CTA + first-party URL).
7. **Measurement readiness.** `netlify.toml` `/x` 200-rewrite present; `tests/channel_routes.test.js` exists and passes (run it); Gumroad metrics operator-readable (their dashboard — UNVERIFIED from your seat is acceptable, say so). Confirm doctrine forbids client-side event tracking, so its absence is not a defect.
8. **No concurrent offer** on any surface ledger for the tap day.

## Stop guidance

Return STOP if any precondition fails at your read time, if the packet's mechanism claims contradict code, or if copy conflicts with doctrine. A stale-by-hours ledger count alone is a **conditional GO** ("GO if rows < 12 at tap and row logged per packet") — say it exactly that way rather than failing on timing you cannot see.

## Authority

You: A0 + the one response file. Owner (Claude pen seat): A1 local logging only. Executor: operator, A2, exactly one post. Merges, posts, deploys, payments remain operator-only per AGENTS.md.
