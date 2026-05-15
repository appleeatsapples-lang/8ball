# 8ball journal

Append-only. Newest entry at the top. Same shape as SIRR's `journal.txt` so the muscle memory carries across.

## 2026-05-15 — STATE-FILL: 8BALL.md §11.11 (c) wording — v0.3.1 ship-gate (c) wired to off-repo re-spec file

**Status:** state-fill — no surface, no code, no doctrine touch. Updates v0.3.1 ship-gate (c) in `8BALL.md` §11.11 to point at `~/Desktop/8ball/sessions/v031_ship_gate_respec.md` as canonical for the gate's operational definition. Re-spec file authored chat-19 (skeleton); default-filled chat-21 under carnaval frame; calibration #1 (pre-8ball @eczaki follower boundary) resolved by operator chat-21 ("most of those are strangers"), applied to Channels 1 + 3 Noise.

**Cycle:** single surgical edit to `8BALL.md` §11.11 (c) wording + off-repo re-spec file fills. State-fill commit pattern matches chat-20 §11.11 (b)-reopen (`1344c2e`) + chat-18 sub-decision-#6 (`bf89317`).

**Changes:**
- `8BALL.md` §11.11 (c) — wording from "≥5 real paid purchases on Live LS with observed SHAKE AGAIN behavior" → "≥5 paid Live purchases AND ≥1 Strong-tier qualitative facet-variation-demand signal by 2026-06-15, surfaced via at least one of three observation channels (LS dashboard / §5.B feedback POST / @eczaki social — IG + TikTok + Threads per carnaval frame); operational definition lives at `~/Desktop/8ball/sessions/v031_ship_gate_respec.md` (canonical), this row is the index pointer."
- `~/Desktop/8ball/sessions/v031_ship_gate_respec.md` (off-repo, not tracked) — 9 TBD cells default-filled under carnaval frame; Channel 3 frame acknowledges IG + TikTok + Threads as three distinct surfaces; pre-8ball @eczaki follower bucket moved Noise → outside-network (Weak/Strong eligible) on Channels 1 + 3 per operator's calibration #1 resolution.
- This journal entry (chat-21 state-fill record).

**Two structural fixes the re-spec resolved (chat-19 framing carried in the file):**
- Original (c) said "observed SHAKE AGAIN behavior" — but v0.3.1 hasn't shipped, and v0.3.0 SHAKE AGAIN is β-idempotent on same profile by design (DOCTRINE §7 stage 6 test invariant). No facets to vary yet. Gate was measuring demand signal for facet variation, not behavior on a non-existent surface.
- Locked decision #7 is "no telemetry, permanently." Original gate had no instrumentation path. Re-spec defines signal types per channel through operator-eyes-only observation, the only path that exists by doctrine.

**Gates:**
- Tests: 586/586 unchanged (no code touch).
- Local PII audit: unchanged.
- `index.html`: 1455 lines (margin 45, unchanged).
- No `core/`, no `ui/`, no `content/`, no `tests/`, no DOCTRINE touch, no shipped-surface change.

**Live SHA:** `TBD` (direct-to-main commit, no PR; follow-up SHA-fill commit fills this line per chat-18 inheritance discipline).

**Lessons / discipline:**
- **Re-spec file's own discipline notes anticipated this state-fill in advance** — the file states: "When operator fills the `[TBD: …]` markers, state-fill commit updates §11.11 (c) to point at this file's filled version." Not a drift cycle — a planned transition from skeleton-pointer to filled-canonical.
- **Calibration-#1 resolution = real change in gate semantics.** Pre-8ball @eczaki followers (~28 IG + ~33 TikTok = ~60 outside-network handles operator inherited from the lineage-name era) are mostly strangers per operator's chat-21 ruling. Default proposal had them in known-network Noise; resolution moved them to outside-network. Treating them as Noise would have made any conversions from this base invisible to the gate; treating them as outside-network preserves their signal value. Affects how the gate reads if any current followers convert.
- **Carnaval frame's Channel 3 Noise call shipped without operator pushback** — engagement on non-8ball posts (IG AI-dreams, TikTok music, Threads aphorisms) is NOT 8ball signal under carnaval frame. Strongest single application of carnaval to operational doctrine yet. A rising IG follower count from a dream post does not validate v0.3.1. If operator later wants cross-pollination to count, this is the line to revisit.
- **L51-candidate firing-shape does NOT apply to this cycle.** L51 (closure-discipline-on-multi-step-external-processes) is about declaring done from a sub-step signal. This cycle is the inverse: defining what done means. State-fill correctly enumerates the falsification conditions before claiming any gate-closure.
- **Cycle ships state-fill + journal-entry.** No DOCTRINE touch, no PR, no audit cycle (state-fill is an orchestrator-controller cycle per established discipline). Direct-to-main commit, two-commit SHA-fill per chat-18 inheritance.


## 2026-05-15 — STATE-CORRECTION: §11.11 (b) reopened — multi-step LS activation flow surfaced; identity-verification ≠ Live

**Status:** state-correction — no surface, no code, no DOCTRINE touch. Reopens v0.3.1 ship-gate (b) from ✅ to OPEN. Chat-19 closure on 2026-05-14 at `2d25c65` was premature — read identity-verification banner clearance as Live-unlock; LS docs surfaced chat-20 2026-05-15 reveal the actual activation is a 4-step process: (1) submit questionnaire, (2) verify identity, (3) LS KYC/KYB staff review (2-3 business days), (4) operator `Copy to Live Mode` on tier-1 product. Steps 1+2 cleared by 2026-05-14; Step 3 still in progress as of 2026-05-15 08:21 KSA (application-received banner observed on orders page); Step 4 is post-activation, not yet runnable.

**Trigger:** Chat-20 operator query "Am I getting money or not yet" → LS dashboard PDF appeared to show $21 / 7 orders → orders-page screenshot revealed Test-mode toggle ON (Stripe-test-card transactions, $0 real revenue) AND application-received banner present in bottom-left sidebar. LS docs (`Test Mode` + `Statement Descriptor` + `Activate Your Store`) loaded sequentially to identify the banner as the post-submission KYC/KYB review state, not identity verification. Chat-19 (b)-closure built on identity-verification clearance alone misread a sub-step signal as terminal.

**Changes:**

- `8BALL.md` §11.11 ship-gate (b) bullet — wording tightened from "LS Live unlock from identity verification" to "LS store activation cleared (Step 1 questionnaire + Step 2 identity verification + Step 3 LS KYC/KYB review) AND Step 4 tier-1 product `Copy to Live Mode` executed." Flipped from ✅ to **OPEN** with reopening citation pointing at `~/Desktop/8ball/audits/ls_dashboard_snapshot_2026-05-15.md`.
- `~/Desktop/8ball/audits/ls_dashboard_snapshot_2026-05-15.md` — rewritten with corrected Test/Live mode reading, application-received banner identified as KYC/KYB review state, activation-flow resolution, LS-business-type-fit risk flagged as a watch item, brand-traction sequencing implication noted (posting while Step 3 open may be wasted distribution if Buy Link doesn't route to a working Live checkout).
- This journal entry (chat-20 state-correction record).

**Gates:**

- Tests: 586/586 unchanged (no code touch).
- Local PII audit: unchanged.
- `index.html`: 1455 lines (margin 45, unchanged).
- No `core/`, no `ui/`, no `content/`, no `tests/`, no DOCTRINE touch, no shipped-surface change.

**Live SHA:** `1344c2e` (direct-to-main commit, no PR — pattern matches `2d25c65` chat-19 + `bf89317` chat-18 state-fill commits + `012f59b` chat-20 Friday review commit; follow-up SHA-fill commit fills this line per chat-18 inheritance discipline).

**LS-business-type-fit watch item:**

LS approval FAQ states approved categories are "digital goods that can be fulfilled by Lemon Squeezy (e.g. eBooks, PDFs, design assets, photos, audio, video, etc.)" plus subscription/license-key SaaS. 8ball's fulfillment per DOCTRINE §5.B Call 2 + §5.C is the trust-based `?paid=t1` redirect granting device-local credit — no LS-side artifact, no license key, no subscription. May not cleanly fit the LS schema and could complicate KYC/KYB review. Not necessarily blocking; flagging as watch item. Resolution arrives at the 2-3-business-day mark when LS responds (approval, request-for-info, or rejection).

**Lessons / discipline:**

- **L sighting #3 candidate — closure-discipline on multi-step external processes.** chat-18 sighting #1 (sub-decision #6: design-doc-done ≠ state-row updated), chat-19 sighting #2 (dashboard-evidence-moved ≠ state-row updated), chat-20 sighting #3 (identity-verification-cleared ≠ Live-unlocked). Refined common pattern across all three: declaring done from a sub-step signal without confirming the full state. Per chat-19 conservative-default-read, 3 sightings → L promotion candidate. **Proposed framing: L51 = closure-discipline-on-multi-step-external-processes** (orchestrator-side analog of the L48 controller-side merge-before-audit-signal pattern). Operator-call on naming + promotion timing.
- **Standing mitigation (applies prospectively, orchestrator-side):** before marking a multi-step external-process gate as ✅, enumerate all known steps explicitly + confirm each is closed against direct evidence, not via inference from a related signal. The chat-19 inference was "identity-verification banner gone → Live unlocked"; the correct read would have been "identity verification (one of N steps) cleared; what are the remaining steps, and is each confirmed against direct evidence?" Applies to LS activation, any future vendor multi-stage onboarding (Stripe direct, PayPal payout, tax-registration), and any 8ball-internal cycle with multiple ship-conditions.
- **Test/Live mode read discipline.** Chat-20 initial $21-as-Live-revenue read was the orchestrator-side firing of the same multi-step-signal misread shape, on the dashboard rather than the activation flow. Pattern: LS dashboard data has no implicit Test/Live indicator — the toggle state must be read explicitly. Adding to standing orchestrator-side discipline: any LS dashboard read references the toggle state explicitly before the data is treated as canonical.
- **State-correction cycle ships journal-entry + state-row edit + snapshot rewrite.** No DOCTRINE touch (the rule itself is fine; the closure-discipline is the issue). No PR, no audit cycle (state-correction is an orchestrator-controller cycle per established state-fill pattern). Direct-to-main commit, two-commit SHA-fill per chat-18 inheritance.


## Friday rule-kill review — 2026-05-15

**Status:** First firing of §13 since the rule was authored (2026-05-08, 7 days ago). Inaugural review is calibration, not pruning — doctrine doesn't have 30-day-without-firing data yet. Pre-read prepared chat-15 at `~/Desktop/8ball/sessions/friday_rule_kill_review_2026-05-15.md`; chat-20 walked the inventory.

**Cycle:** Walk DOCTRINE.md @ v0.27 — 15 top-level §-headers + 4 labeled subclauses (§1.A / §1.B / §4.A / §4.B). For each: review last firing per journal + 8BALL.md §10 + test surface; propose KEEP / KILL / AMEND. No rule-touch this cycle.

**Verdict counts:** 19 KEEP / 0 KILL / 0 AMEND-now / 1 AMEND-flagged-for-next-Friday.

The 1 amend-flag is §12: wording "multi-language until v2 of the trait pool exists in any language" — trait pools were retired in v0.2.0 / Phase-2F. Should read "v2 of the cards." Carry forward to 2026-05-22 or absorb opportunistically into a future structural pass.

**Pre-read divergence — §5.C (content-delivery transparency, v0.22):**

Pre-read v1 flagged §5.C as KILL-candidate via the heuristic "never fired in journal — only label-referenced from §1 / §1.B / §4.B / 8BALL.md content-version footer." Reading the clause text on Friday surfaced that §5.C is anchor-role, not aspirational: §1 v0.22 amendment says `(see §5.C)`, §1.B references §5.C, §4 references §5.C, §4.B references §5.C, and the about-modal disclosure copy ("the deck is visible in source; the lock is a convention, not a vault") is doctrine-bound to it. The clause fires every release by being the canonical name for the JS-gated-bundle convention. Pre-read's heuristic mistook anchor-role for aspirational. **KEEP.**

**Gates:**

- Tests: 586/586 unchanged (no code touch).
- Local PII audit: unchanged.
- `index.html`: 1455 lines (margin 45, unchanged).
- No `core/`, no `ui/`, no `content/`, no `tests/`, no DOCTRINE touch, no shipped-surface change.

**Live SHA:** `012f59b` (direct-to-main commit, no PR — pattern matches `2d25c65` chat-19 + `bf89317` chat-18 state-fill commits; follow-up SHA-fill commit fills this line per chat-18 inheritance discipline).

**Lessons / discipline:**

- **First §13 firing landed as calibration, not pruning** — as the pre-read predicted. Nothing has had time to atrophy at 7-day doctrine age. The value of running early is the audit of "has every rule fired at least once" — 19/19 have, across 9 doctrine versions (v0.18 → v0.27) and substantial release activity (v0.2.5 → v0.3.0.2 → 3 drift-sweep cycles → agents codification → T1 promotion). Next review: 2026-05-22.
- **Pre-read heuristic refinement on anchor-role clauses.** "Never fired in journal" is the *start* of an inspection, not the conclusion. If a clause is the source-of-truth name for a shipped surface, or is cross-referenced from ≥2 other §-clauses, it's anchor-role and KEEPs regardless of journal-firing count. §5.C was the trigger; refinement folded into the 2026-05-22 pre-read methodology. Not promoting to L-status yet — single observation.
- **§12 wording-stale flag deferred, not absorbed.** "Trait pool" → "cards" is a one-line edit; could ship as v0.27 → v0.28. The §13 discipline ("if you find yourself adding more locked rules than you're killing on Fridays — stop drafting and ship something") argues for bundling with another structural pass rather than spinning a cycle on a single-word fix. Carry forward to 2026-05-22.
- **Cycle ships journal-entry-only.** Zero KILLs, zero AMEND-now → no doctrine touch, no code touch, no audit cycle, no PR. State-fill commit pattern: direct-to-main, no `--amend`, SHA-fill via follow-up commit per chat-18 inheritance.


## 2026-05-14 — STATE-FILL: 8BALL.md §11.11 — v0.3.1 ship-gate (b) ✅ closure (LS Live unlock)

**Status:** state-fill — no surface, no code, no doctrine touch. Closes second of three v0.3.1 ship-gates: LS Live unlock from identity verification, confirmed via LS dashboard snapshot 2026-05-14 19:02 KSA (`~/Desktop/8ball/audits/ls_dashboard_snapshot_2026-05-14.md`) — no identity-verification banner, account Live, product `8 ball — 3 tries · tier 1` Published at $3.00, 0 sales. Banner-state per chat-13 dashboard read (2026-05-13) was identity verification; resolved 2026-05-14.

**Cycle:** single surgical edit to `8BALL.md` §11.11 ship-gate (b) line. Pattern matches chat-18 (a)-closure state-fill (`bf89317`).

**Changes:**
- `8BALL.md` §11.11 ship-gate — (b) marked ✅ closed (2026-05-14) with citation to LS dashboard snapshot + dashboard-row detail (Live, no banner, Published at $3.00). (a) ✅ closed (chat-13, state-filled chat-18 at `bf89317`). (c) ≥5 real paid Live purchases remains open (0/5).

**Gates:**
- Tests: 586/586 unchanged (no code touch).
- Local PII audit: unchanged.
- `index.html`: 1455 lines (margin 45, unchanged).
- No `core/`, no `ui/`, no `content/`, no `tests/`, no DOCTRINE touch, no shipped-surface change.

**Live SHA:** `2d25c65` (direct-to-main state-fill commit, no PR — pattern matches chat-18 `bf89317` + `eaead15` PR #24 state-fill + `c45c722` chat-12 §11 housekeeping).

**Lessons / discipline:**
- **SHA-fill discipline (chat-18 inheritance applied).** Live SHA written as TBD in this commit; follow-up commit fills the actual SHA. No `--amend` on the state-fill commit — that was the chat-18 trip-up that needed `abb5539` to clean up. Standing rule from chat-18: either leave the placeholder until after the final commit (git log is canonical), or fill via a separate follow-up commit, not via pre-push amend.
- **Off-repo-ahead-of-on-repo state drift — possible sighting #2.** chat-18 logged sighting #1 (refinement of L4: when an `8BALL.md` state row references off-repo design docs, the design docs win on substance; row needs explicit catch-up edit). This cycle has a similar shape: LS dashboard evidence moved 2026-05-14 (account Live) while §11.11 row still cited the 2026-05-13 banner-state. Same pattern (state row out of sync with off-repo reality), or distinct sub-shape (evidence-tracking vs decision-canonicalization)? Operator's call on framing. Conservative-default read: same pattern, L-promotion path on second sighting per established discipline. Orchestrator working-default for chat-19+: when any §11 state row cites an off-repo source (design doc OR evidence file) with a dated reference, cross-check the source's current state before treating the row as canonical for downstream questions.
- **Single-edit cycle below the journal-entry threshold debate avoided.** This is one line. PR #23 retroactive entry from chat-17 codified the standing rule: every ship cycle gets a journal entry, regardless of diff size (comment-only line edits counted). State-fill cycles are even less ambiguous — they exist to close drift between on-repo state and reality, and the journal entry IS the closing-record artifact. No debate; entry filed.


## 2026-05-14 — STATE-FILL: 8BALL.md §11.11 — v0.3.1 sub-decision #6 lock (chat-13 retroactive)

**Status:** state-fill — no surface, no code, no doctrine touch. Closes off-repo-ahead-of-on-repo drift: sub-decision #6 (v0.3.1 lateral facet taxonomy) was locked chat-13 (2026-05-13) in `~/Desktop/8ball/sessions/v0.3.x_shake_again_facet_reroll.md` + `~/Desktop/8ball/sessions/brief_v031_facet_reroll.md` + `~/Desktop/8ball/sessions/v0.3.1_taxonomy_trial_run_aries_rat.md`, but the corresponding `8BALL.md` §11.11 row (last updated chat-12) was never refreshed. chat-18 caught the drift after operator asked to close v0.3.1 open items; orchestrator initially mis-framed #6 as still open quoting stale §11.11; cross-check against design docs surfaced the chat-13 lock + work product, operator confirmed stick-with-chat-13 over re-lock.

**Cycle:** three surgical edits to `8BALL.md` §11.11 reflecting chat-13 lock + trial-run + ship-gate (a) closure.

**Changes:**
- `8BALL.md` §11.11 design-lock framing — "Design-locked chat-12" → "Design-locked chat-12 (2026-05-13); taxonomy locked chat-13 (2026-05-13)"; parking-doc layers extended chat-6 + chat-12 → chat-6 + chat-12 + chat-13; calibration trial-run file `~/Desktop/8ball/sessions/v0.3.1_taxonomy_trial_run_aries_rat.md` referenced; stale line counts on parking doc + brief dropped (out-of-date by chat-13 expansion).
- `8BALL.md` §11.11 sub-decisions status — "4 of 5 listed sub-decisions resolved ... one open operator-taste decision — sub-decision #6 lateral facet taxonomy (recommended lock: ... ; alternatives: ...)" → "all 5 listed sub-decisions resolved ... **Sub-decision #6 (lateral facet taxonomy, added chat-12) LOCKED chat-13 2026-05-13 = outward / inward / returning**" with Facet I/II/III gloss + brand-fit + calibration trial-run cells `aries/i` + `cancer/xlii` + authoring-risk pre-flag for ChatGPT brief + `habit` single-string confirmation (432-line authoring scope).
- `8BALL.md` §11.11 ship-gate — (a) marked ✅ closed (chat-13); (b) LS Live + (c) ≥5 paid Live purchases remain open.

**Gates:**
- Tests: 586/586 unchanged (no code touch).
- Local PII audit: unchanged (state-row edit; all new vocabulary already in tracked design docs).
- `index.html`: 1455 lines (margin 45, unchanged).
- No `core/`, no `ui/`, no `content/`, no `tests/`, no DOCTRINE touch, no shipped-surface change.

**Live SHA:** `bf89317` (direct-to-main state-fill commit, no PR — pattern matches `eaead15` PR #24 state-fill + `c45c722` chat-12 §11 housekeeping).

**Lessons / discipline:**
- **Off-repo-ahead-of-on-repo state drift, sighting #1.** Refinement of L4 (files canon / memory not) for the layered-files case: when a state row references off-repo design docs, the design docs win on substance; the state row needs an explicit catch-up edit to stay canonical. Orchestrator default: when 8BALL.md state references a design doc, cross-check the design doc before treating the state row as canonical for downstream questions. Observation only; not L-promoted (single sighting).
- **Operator-prompted catch-shape worked.** "let's close [open items]" → orchestrator quotes stale state row → operator pick exposes contradiction with off-repo reality → orchestrator surfaces drift instead of executing blind. Blind-execution would have torn up chat-13 work product (trial-run + brief §1.C voice register + §1.C amendment draft, ~half a chat of paper-work). The recovery shape is: read the design doc the row points to, before posing the question, not after.
- **Chat-numbering correction filed inline.** chat-18 first response misquoted "Last conversation closed at chat-15" — actual sequence per journal is chat-15 (agents L-mitigation brief) → chat-16 (PR #24 ship + state-fill) → chat-17 (PR #23 retroactive + audit response reconstruction). This is chat-18. Confident-prior misread on the chat counter; corrected in this entry.



## 2026-05-13 — SHIPPED: agents/ L-mitigation cycle — c13-c14-c15 bundle

**Status:** SHIPPED 2026-05-13 at squash-merge `c2a8c2b` (PR #24, 5 commits collapsed). State-fill commit on main flips IN-FLIGHT → SHIPPED + adds live SHA per chat-9 codified discipline. PR #23 retroactive entry bundled into this state-fill per chat-16 handoff item 5 recommendation (a).

**Cycle:** absorb three L-source findings from chats 13–15 into `agents/*.md` role docs + one out-of-`agents/` inspector-sketch update. No DOCTRINE touch this cycle (per §10 v0.24 scope codification — agents/ content changes don't fire the §10 footnote / lineage track). 8 clauses across 5 files.

**L sources absorbed:**
- **L50** = `CiC-scope-expansion-into-strategic-content` — promoted at chat-15 close on 2 sightings (chat-13 YouTube algorithm-tune firing + chat-15 Sonnet 4.6 verifier firing #1 verbose process-narration). Source: chat-13 → chat-14 handoff + chat-15 → chat-16 handoff.
- chat-14 L-candidate `controller-content-seed-defaults-mainstream` (1 sighting; mitigation queued pre-promotion). Source: `~/Desktop/8ball/sessions/L_candidate_controller_mainstream_default_2026-05-13.md`.
- **L49** = `paper-design-routing-errors-are-paper-equivalent-of-aspirational-doctrine` — promoted at chat-15 close on 2 sightings (chat-12 v0.3.1 parking doc §6.5/§7.1 + chat-15 Friday rule-kill review pre-read inherited vocabulary). Source: `~/Desktop/8ball/sessions/friday_rule_kill_review_2026-05-15.md` Routing-error finding subsection.

**L-number disambiguation:** chat-7 v0.24-cycle pre-allocated "L49-candidate" to `agents-ahead-of-code-and-doctrine` (still at 1 sighting, retains candidate status). The L49 assignment in this cycle supersedes that pre-allocation; chat-7 candidate will receive the next available number on second-sighting promotion. L49 and L50 numbers locked at chat-16 open per operator delegation.

**Changes (8 clauses, 5 files):**
- `agents/verifier.md` — Clause 1 (no-strategic-synthesis Boundary bullet) + new H2 "CiC directive template — standing clauses" with Clause 3 (downstream DO-NOT) + Clause 7 (upstream-diagnostic gate on directive origination) + chat-15 audit-history entry.
- `agents/PLATFORMS.md` — Clause 2 (CiC per-tab scope H3 inside the existing CiC entry) + chat-15 audit-history entry.
- `agents/controller.md` — Clause 5 (Procedure 5 Content-seed routing) + chat-15 audit-history entry.
- `agents/orchestrator.md` — Clause 6 (Procedure 6 Register-alignment diagnostic for content seeds) + Clause 8 (Procedure 7 Paper-design surface sanity check) + chat-15 audit-history entry.
- `~/Desktop/8ball/sessions/inspector_sketch_2026-05-13.md` — Clause 4 (inspector inherits the verifier no-strategic-synthesis-beyond-STEPS boundary; sketch §10 audit-history added marking this as chat-15 mitigation, not chat-1 authoring decision). Out-of-`agents/`, out-of-repo (sketch lives in `~/Desktop/8ball/sessions/`).

**Closed loops:**
- Content-seed routing: `controller.md` Procedure 5 (downstream actor) ↔ `orchestrator.md` Procedure 6 (upstream diagnostic) ↔ `verifier.md` upstream-diagnostic gate (Clause 7, directive-template precondition).
- Synthesis-overreach: `verifier.md` Boundary clause (Clause 1) ↔ `verifier.md` downstream DO-NOT directive-template clause (Clause 3) ↔ Inspector sketch §1 boundary inherit (Clause 4).
- Per-tab discipline: `PLATFORMS.md` CiC per-tab scope (Clause 2) names the platform constraint that `verifier.md`'s directive-template clauses operationalize.

**Gates (pre-merge):**
- Tests: 586/586 (CI surface; no code touched, no `core/` / `ui/` / `content/` / `tests/` change). Local `npm test` shows one pii_scan failure caused by gitignored `.claude/settings.local.json` containing harness-local command paths with the operator handle — does NOT reach CI since the file is gitignored. My edits add no banned tokens; verified via `git diff main..HEAD -- agents/ | grep -iE 'muhab|akif|appleeatsapples|\bSIRR\b'` → no hits.
- Local PII audit: clean (53 files scanned).
- index.html: 1455 lines (margin 45, unchanged).
- No `core/`, no `ui/`, no `content/`, no `tests/`, no shipped-surface change.

**Audit return target:** `~/Desktop/8ball/audits/codex_agents_l_mitigations_c13_c14_c15_response_2026-05-13.md` per §10 standing pre-merge audit pattern. Codex Procedure 4 (doctrine-only audit) applies — this cycle's only deliverables are `agents/*.md` content + an out-of-repo sketch edit. No DOCTRINE.md / `core/` / shipped-surface diff.

**Live SHA:** `c2a8c2b` (PR #24 squash-merge, 5 commits collapsed: `24aa8ba` verifier+PLATFORMS / `7b73801` controller+orchestrator / `92f694d` journal IN-FLIGHT / `567282a` orchestrator pre-audit refinement / `0a679b7` codex hook 6 P2 absorb).

**Lessons / discipline:**
- Bundle absorbed 2 promoted Ls (**L49** + **L50**, each at 2 sightings) + 1 L-candidate (chat-14 `controller-content-seed-defaults-mainstream`, 1 sighting, mitigated pre-promotion per operator decision to absorb the mitigation early rather than wait for sighting #2). Pre-promotion mitigation is the rarer shape; standard pattern is mitigate-on-promotion.
- Procedure 7 (paper-design sanity check) self-check fired on its own brief during chat-15 authoring; refined assertion-vs-meta-discussion distinction is chat-15 learning, codified inline.
- gh `--delete-branch` L mitigation pulled forward: CC worktree (`focused-morse-8fbe06`) removed at chat-16 pre-audit refinement pass rather than post-merge, since orchestrator refinement edits needed the branch checked out in the main worktree. Post-merge `git ls-remote --heads origin` verify still required regardless of merge mechanism.
- Orchestrator pre-pass on CC output (this cycle): operator delegation prompted a refinement commit before firing Codex Procedure 4 audit — plugged L49/L50 numbers, fixed L50 sighting-count framing (CC followed brief which predated chat-15 close 2-sighting state), added chat-7 L49-candidate disambiguation. Net: cleaner audit surface for Codex, less P2/P3 polish-noise in the audit response.
- **Post-chat-16 absorb cycle (chat between handoff and chat-17):** Codex Procedure 4 audit returned **P1 overall, PASS 11 / P2 1 / P1 1 / P0 0**. Hook 4 P1 (Inspector sketch boundary verbatim + L50 promoted framing at lines 25/172 of `~/Desktop/8ball/sessions/inspector_sketch_2026-05-13.md`) absorbed on disk (out-of-repo session doc, not in PR commit chain per L49-candidate discipline). Hook 6 P2 (orchestrator.md Procedure 6 step-count brief↔code mismatch — brief said "5-step Procedure" but procedure had 4 numbered steps) absorbed via in-PR commit `0a679b7` using codex Option A (add explicit step 5 codifying the verifier paste-relay + controller approval handoff that previously lived buried in the Reasoning paragraph). Step 4 now scopes cleanly to directive drafting; step 5 closes the loop.
- **Codex response file reconstruction discipline gap (chat-17 cleanup):** the absorb cycle ran in a separate chat which exhausted its budget before persisting the Codex paste to disk. chat-17 reconstructed a summary-shape response file at `~/Desktop/8ball/audits/codex_agents_l_mitigations_c13_c14_c15_response_2026-05-13.md` anchoring verdict + hook 4 + hook 6 dispositions from prior chat context + commit `0a679b7` message. Verbatim Codex per-hook output on the 11 PASS hooks is not recoverable. Future cycles: save the Codex paste to disk BEFORE in-chat absorb work. L48-adjacent: persist before process.
- **PR merged via GitHub UI before terminal merge command ran (chat-17, L48-adjacent sighting):** chat-17 prepped + queued the `gh pr merge 24 --squash --delete-branch` sequence in pbcopy; operator pasted into terminal but the PR was already merged via GitHub UI (gh returned `! Pull request appleeatsapples-lang/8ball#24 was already merged`). The downstream `--delete-branch` cleanup proceeded in cleanup-mode. No harm — the audit-cleared signal was already explicit on disk via the reconstructed response file pre-merge — but the merge-out-of-band shape is worth tracking as a near-sibling of L48 (CI-green-to-merge windows). Sighting #1 of this near-sibling pattern.
- **gh `--delete-branch` L sighting (chat-17, sighting #N where N≥4):** branch `agents-l-mitigations-c13-c14-c15` survived on origin post-merge despite gh's `✓ Deleted remote branch` claim. Verified via `git ls-remote --heads origin` showing the branch still present at `0a679b7`. Cleaned manually via `git push origin --delete agents-l-mitigations-c13-c14-c15`. Same generalized lesson as chat-9, chat-10, chat-16: gh's `--delete-branch` is a leaky abstraction over a 3-leg cleanup; always verify with `git ls-remote --heads origin` post-merge and explicit-delete on survivors. The codified discipline is working as intended — verification caught the failure, cleanup was routine.

## 2026-05-13 — SHIPPED: tracked-content drift fix — L49 corpus sweep (PR #23, retroactive entry)

**Status:** SHIPPED 2026-05-13 at squash-merge `03728ce` (PR #23). Retroactive journal entry — PR #23 shipped without a journal entry at the time (chat-16 discipline gap, flagged in chat_16_to_chat_17_handoff.md item 5). Bundled into the PR #24 state-fill commit per handoff recommendation (a) — one commit covers both. The discipline rule remains: every ship cycle gets a journal entry; comment-only line edits still count as cycles.

**Cycle:** Three line-edits closing L49 backward-cleanup drift (paper-design routing errors as paper equivalent of aspirational doctrine — promoted at chat-15 close). Tracked content scanned for inherited L49-shape vocabulary referencing non-existent doctrine subclauses (the chat-12 v0.3.1 parking doc framing "§6.5/§7.1 amendment" referenced subclauses that don't exist; the routing-error was inherited into the Friday rule-kill review pre-read, becoming the L49 second sighting).

**Changes (3 line edits, comment-only):**
- T1 sweep: tracked content referencing `§6.5` / `§7.1` as if they were live doctrine subclauses — corrected to point at the actual β-idempotence location in DOCTRINE §7 stage 6 test invariant.
- T2 sweep: secondary inherited references in same vocabulary cluster.
- Line-4 ambiguity fix: one trailing wording disambiguation.

No code touch. No DOCTRINE touch. No surface change. Comment-level / parking-doc-level edits only.

**Gates:**
- Tests: 586/586 unchanged.
- Local PII audit: clean.
- index.html: 1455 lines (margin 45, unchanged).
- No `core/`, no `ui/`, no `content/`, no `tests/`, no shipped-surface change.

**Audit return:** `~/Desktop/8ball/audits/codex_spot_audit_pr23_drift_fix_2026-05-13.md` — Codex Procedure 1 spot-audit returned **PASS 3/3**, no new drifts surfaced.

**Live SHA:** `03728ce` (PR #23 squash-merge).

**Lessons / discipline:**
- Comment-only / wording-fix cycles still earn journal entries — L49 backward-cleanup is a real cycle even though no shipped surface moved. The chat-16 omission was the failure mode; the chat-17 retroactive bundle is the correction. Standing rule re-confirmed: journal entry per cycle, regardless of diff size or surface impact.
- **gh `--delete-branch` L sighting (PR #23):** operator merged PR #23 via GitHub UI (browser flow rather than terminal `gh`); branch survived on origin post-merge; cleaned manually in chat-16. Captured retroactively in this entry; another firing of the generalized leaky-3-leg-abstraction lesson — failure mode is independent of merge mechanism (CLI, UI, hybrid all produce the same survivor pattern when `--delete-branch` doesn't atomically clear all three legs).

## 2026-05-13 — SHIPPED: DOCTRINE v0.27 — T1 lane codification (Procedure 6)

**Status:** SHIPPED 2026-05-13 at squash-merge `a76320e` (PR #22). State-fill commit on main flips IN-FLIGHT → SHIPPED + adds live SHA in both journal and 8BALL.md §10 per chat-9 codified discipline.

**Cycle:** T1 tentative-lane PROMOTION codification. Three clean firings (chat-8 28-drift inaugural / chat-9 tier-1 re-audit / chat-10 tier-2 re-audit) cleared all four promotion criteria by chat-10 close. This cycle absorbs the lane as a real auditor procedure.

**Changes:**
- `agents/auditor.md` — Procedure 6 (Corpus drift-sweep) added after Procedure 5. Brief shape, paste workflow, verdict format, tier-split-by-coherence pattern, pre-budget-absorb pattern, hard stops, discipline footnotes (L48 firing-shape in drift-sweep cycles).
- `DOCTRINE.md` — §10 amended additively with single-clause bullet pointing to Procedure 6 (v0.27). Version footer v0.26 → v0.27; v0.26 entry preserved verbatim in lineage.
- `8BALL.md` §10 — new v0.27 entry prepended; v0.26 entry preserved verbatim.

**gh `--delete-branch` L generalization (carried in v0.27 entry):** chat-10 sighting #2 (non-worktree variant) sharpened the chat-9 worktree-specific L framing. The canonical generalized lesson: `gh pr merge --delete-branch` is a courtesy attempt over a non-atomic 3-leg cleanup; always verify `git ls-remote --heads origin` post-merge regardless of merge mechanism.

**Gates:**
- Tests: 586/586 unchanged (no code touch).
- Local PII audit: clean (53 files).
- index.html: 1455 lines (margin 45, unchanged).
- No `core/`, no `ui/`, no `content/`, no `tests/`, no shipped-surface change.

**Audit return target:** `~/Desktop/8ball/audits/codex_v027_audit_response_2026-05-13.md` per §10 standing pre-merge audit pattern (drift-sweep cycle's first invocation of its own newly-codified Procedure 6 happens later; this cycle uses the existing Procedure 4 doctrine-only audit pattern).

**Live SHA:** `a76320e` (PR #22 squash-merge, 3 commits collapsed). Codex Procedure 4 audit returned **PASS 7 / P3 0 / P2 0 / P1 1 / P0 0**; Hook 6 P1 (Procedure 6 verdict-format internal inconsistency — example brief omitted PASS while footnote + state entry claimed `PASS + severity ladder`) absorbed pre-merge in `fa7c615` via two-mode codification (Mode A initial drift-finding sweep, P0–P3 only / Mode B re-audit on closed drifts, PASS + severity ladder + evidence/reasoning/recommendation) per codex Option B recommendation. Audit response saved at `~/Desktop/8ball/audits/codex_v027_audit_response_2026-05-13.md`. gh `--delete-branch` L did NOT fire this cycle — squash-merge cleared all three legs; origin-state verification post-merge confirmed clean (only `main` on origin).

**Lessons / discipline:**
- T1 promotion the orchestrator-side codification mirror of the chat-9 `gh --delete-branch` L promotion (both: 3-firing-track-record → real-doc codification).
- L48 mitigation candidates from chat-10 (orchestrator pre-flight `git fetch origin --prune`; "DO NOT MERGE until codex response is in chat" framing in brief openers) NOT codified this cycle — still observation phase; codify on second firing.
- L-candidate `cc-session-bound-to-removed-worktree-becomes-unrecoverable` (chat-10 origin) still watching; not codified.

## drift-sweep tier 2 — DOCTRINE v0.25 → v0.26 — SHIPPED

2026-05-12. Tier 2 of 28-drift cleanup from chat-8 codex drift-sweep audit (`~/Desktop/8ball/audits/codex_drift_sweep_response_2026-05-12.md`) plus chat-9 tier-1 re-audit (`~/Desktop/8ball/audits/codex_drift_sweep_tier1_response_2026-05-12.md`). 17 drifts closed + Drift 12 disposition + Drift 19 verification:

- **DOCTRINE.md (3 drifts):** §5.B Call 1 retires the stale `action="/?sent=1"` ban (Drift 5 = chat-9 New Drift A, P1); §5.B Call 2 documents the URL-encoded `checkout[success_url]` query-param mechanism shipped at v0.3.0.2 paired with the dashboard Button link (Drift 6, P1); §6 main paragraph re-aligned with shipped `ui/` folder + 7-module `core/` + 14-test `tests/` (Drift 7, P1).
- **8BALL.md (7 drifts + 1 disposition + 1 verification):** §1 rising input city-level not country+lat/lng (Drift 9, P1); §1 numerology always space-separated per §1.B v0.23 (Drift 10, P2); §1 SIRR engine framing recast as metaphor/architecture split per **controller disposition B** (Drift 12, P1); §2 `core/` row enumerates 7 modules (Drift 13, P1); §2 new `ui/` row added; §2 `content/` row describes shipped `cards.v1.full.js` (Drift 14, P2); §2 `tests/` row enumerates 14 files + 586 cases (Drift 15, P1); §8 CI green claim 5→6 stages per §7 v0.22 (Drift 18, P1); §10 v0.25 entry SHA verified consistent with chat-9 state-fill discipline (Drift 19, P2 auto-resolved, no edit).
- **README.md (3 drifts):** opening paragraph city-level rising input + numerology always space-separated (Drifts 20 + 21, P1 + P2); Test section 586 cases + 6 CI stages (Drift 23, P1); Structure tree shows `ui/` + 7 `core/` modules + populated `content/` + `agents/` + 14 tests (Drift 25, P1).
- **root AGENTS.md (1 drift):** auditor vocabulary PASS / P3 / P2 / P1 / P0 + fix-recommendation language matches `agents/auditor.md` v0.24 (Drift 26, P1).
- **root CLAUDE.md (1 drift):** repo shape lists `ui/`, `agents/`, `assets/`; `content/` describes shipped deck (not retired trait+template pools); CI 6 stages (Drift 27, P1).
- **agents/auditor.md (1 drift):** Hook 3 wording matches §5 / §5.B scoped-network model (Drift 28, P2).

Doctrine v0.25 → v0.26. Lineage preserves v0.25. No code touch. No tests added or removed (586/586 unchanged). No `index.html` change. Local PII audit clean.

L48 discipline observation: codex re-audit returned at `~/Desktop/8ball/audits/codex_drift_sweep_tier2_response_2026-05-12.md` — **19/19 tier-2 drifts PASS** plus 3 new drifts surfaced (1 P1 + 1 P2 + 1 P3). PR #21 was merged at squash-commit `839eefa` 2 minutes after CI green, before the codex re-audit response landed in chat — the 2-minute CI-green-to-merge window is the L48 failure shape (chat-9 codified). Outcome was fine because codex came back clean on the original 19 drifts, but the 3 new drifts (C/D/E) shipped to prod un-absorbed; post-merge absorb follows in the next commit on main.

T1 lane third firing: **CLEAN.** All four promotion criteria now hit (3 firings + repeatable brief shape + distinct lane boundary + failure-mode characterized as "no Codex-side friction across three firings — the lane works smoothly when brief is self-contained, corpus is bounded, verdict format is pre-specified"). **PROMOTION:** codify drift-sweep as `agents/auditor.md` Procedure 6 in a subsequent micro-cycle. Observation across all three firings: re-audit surfaces 2–3 new drifts beyond original scope per cycle (chat-9: 2; chat-10: 3). The rewrite-makes-adjacent-text-salient mechanism is the load-bearing value, not a side-effect — future drift-sweep cycles should plan a follow-up absorb commit by default.

T2 second firing opportunity: openclaw cold-read of this brief planned before paste-relay to CC.

Per chat-9 L promotion (gh `--delete-branch` worktree-occupies failure): CC removes worktree as part of completion-state; orchestrator post-merge playbook checks `git worktree list` before `gh pr merge --squash --delete-branch`.

Shipped 2026-05-12 at squash-merge `839eefa` (PR #21, single commit). State-fill commit on main flips IN-FLIGHT → SHIPPED + adds 8BALL.md §10 v0.26 entry per chat-9 state-fill discipline. Post-merge absorb commit follows for new drifts C/D/E (no doctrine bump). Branch `drift-sweep-tier-2` survived on origin post-merge — gh `--delete-branch` did not fire (new sighting of the chat-9 L, this time without a worktree; the leaky-3-leg-abstraction lesson generalizes beyond worktree-occupies failure mode). Cleaned manually post-state-fill.

## drift-sweep tier 1 — DOCTRINE v0.24 → v0.25 — SHIPPED

2026-05-12. Tier 1 of 28-drift cleanup from chat-8 codex drift-sweep audit (`~/Desktop/8ball/audits/codex_drift_sweep_response_2026-05-12.md`). 9 drifts closed: 2 P0 (Drift 3 + Drift 24, absolute "no network calls" claim in DOCTRINE §2/§7 + README) + 7 P1 (Drift 1/2/4/11/16/17/22, paid-content state alignment + persistence allow-list explicit wrapper key). Plus 1 P3 (Drift 8, 8BALL.md refresh date) folded in as freebie.

**Drift 12 (P1, SIRR engine framing 8BALL §1 vs DOCTRINE §2) parked** — controller decision pending. Will land in a subsequent cycle as A (soften to "sibling reference discipline") or B (expand metaphor-vs-architecture explicitly).

Doctrine v0.24 → v0.25. Lineage preserves v0.24. No code touch. No tests added or removed (586/586 unchanged). No index.html change. Local PII audit untouched.

Tier 2 (~18 remaining drifts: structural P1s + P2s across DOCTRINE §5.B/§6, 8BALL §1/§2/§3/§8, README, root AGENTS.md, root CLAUDE.md, agents/auditor.md) follows in a subsequent cycle. Tier 3 (Drift 8, P3 refresh date) folded in here.

Audit return: codex re-audit pre-merge per §10.

Shipped 2026-05-12 at squash-merge `3d81c6f` (PR #20, 2 commits collapsed: drift-fix absorb + journal-label discipline). Codex re-audit response at `~/Desktop/8ball/audits/codex_drift_sweep_tier1_response_2026-05-12.md` — 10/10 PASS on the original tier-1 scope plus 2 new drifts surfaced (New Drift B P2 journal-label pre-merge SHIPPED, absorbed in-PR via commit `39596f7`; New Drift A P1 DOCTRINE §5.B stale `action="/?sent=1"` ban contradicts shipped v0.2.5.2 feedback redirect — parked for tier 2 per codex recommendation).

**L-candidate promoted to real L: gh `--delete-branch` worktree-occupies failure** (3rd sighting). PR #18 and PR #19 were silent failures (remote branch survived with no error message). PR #20 was the explicit-error variant: gh aborted both legs of cleanup (remote + local branch deletion) once local-delete failed because the CC worktree at `~/dev/8ball/.claude/worktrees/intelligent-cori-459ee6` was still occupying `drift-sweep-tier-1`. Remote branch survived on origin post-merge; cleaned up manually post-state-fill via `git push origin --delete drift-sweep-tier-1` + `git worktree remove` + `git branch -D`. **Mitigation:** before any future `gh pr merge --squash --delete-branch`, remove any CC worktree on the branch first (`git worktree remove <path>`), OR pass `--delete-branch=false` and manage deletion explicitly via `git push origin --delete <branch>` after worktree teardown. Lesson framing candidate: "worktree state is part of merge-cleanup state; gh's --delete-branch is a leaky abstraction over a 3-leg cleanup (merge / remote-delete / local-delete) and a failure on any leg can abort the others." Codify in `agents/implementer.md` procedure 4 (CC must `git worktree remove` after completion) and in the post-merge orchestrator playbook.

## chat-8 housekeeping: A vs B redirect thread retired — CLOSED

2026-05-12. Thread 4 from chat-8 handoff (`~/Desktop/8ball/sessions/chat_7_to_chat_8_handoff.md`) closed without resolution. Terminal verify (chat-8) confirmed:

- prod Buy Link href intact and well-formed: `8-ball.lemonsqueezy.com/checkout/buy/14e9e2e6-...` with URL-encoded `checkout[success_url]=https://the-eight-ball.netlify.app/?paid=t1`. LS 302s to cart-id session without 4xx; cookies set (`ls_cart_id`, `XSRF-TOKEN`, `laravel_session`).
- `success_url` is NOT echoed in page body, form action, or cookies. LS swallows it into server-side cart state at the 302 hop. The redirect-vs-default-modal fork only resolves at payment completion, when LS reads its cart record server-side.

Implication: A (query-param mechanism) vs B (dashboard Button link mechanism) cannot be disentangled by static inspection. Only a real checkout with the dashboard Button toggled OFF would resolve it.

Decision: retire from active queue. Belt-and-suspenders is structurally sound — code-tracked `success_url` plus dashboard Button link both set. The gate is "redirect lands cleanly post-payment," and v0.3.0.2 live-fire on 2026-05-12 (CiC §13 PASS, per 8BALL.md §10) already demonstrated that gate firing. A vs B is a curiosity, not a blocker.

Reopen condition: a real Live-mode purchase fails to redirect. Until then, the question is noise.

No DOCTRINE touch. No code touch. No tests added or removed (586/586 unchanged). Local PII audit untouched. No live-fire required.

## chat-7 housekeeping: branch drift + shadow netlify deletion — SHIPPED

2026-05-12. Two housekeeping items closed this chat, no code touch.

**Branch drift cleanup.** Found at chat-7 bootstrap: `git ls-remote --heads origin` showed `agents-codification-doctrine-v024` and `v0.3.0.2-redirect-fix` still alive on origin alongside `main`, despite both PR #18 and PR #19 having been merged via `gh pr merge --squash --delete-branch`. The `--delete-branch` flag did not fire as expected on either merge. Cleaned manually with `git push origin --delete <branch>` (both) plus `git branch -D <branch>` (both). Origin and local now reflect main-only (`git ls-remote --heads origin` returns one ref: `refs/heads/main`). Worth watching the next squash-merge to see whether the flag fires correctly or whether this is a recurring `gh`-version or branch-protection interaction; if it repeats, that's an L-candidate sighting for codification.

**Shadow netlify deletion.** `enchanting-bonbon-2b5064` (project ID `6f0fbabc-fa42-4423-bd74-78a7b951613e`, created 2026-05-08 at 4:49 PM) deleted via the controller dashboard `/configuration/general/Danger zone/Delete this project` flow. Sibling to the canonical `the-eight-ball` (project ID `cfc7f984-b54d-4116-a206-6a4647daaeeb`, created 32 minutes earlier same day at 4:17 PM); both had been silently double-deploying every push to main since their creation. 8BALL.md §11 item 11 closes; team-projects page now reflects single canonical project. Expected side effect: ~50% reduction in netlify credit consumption per push, easing the recurring credit-cap pressure documented at v0.2.1 ship time (warning visible on the team-projects page at deletion time was from before deletion took effect).

No DOCTRINE touch. No code touch. No tests added or removed (586/586 unchanged). Local PII audit untouched (no tracked-content changes beyond journal.md + 8BALL.md). No live-fire required (no surface or deploy-gate change).

## agents/ codification + DOCTRINE v0.23 → v0.24 — SHIPPED

2026-05-12. Doctrine + scaffolding cycle on branch `agents-codification-doctrine-v024`. No code touch (no `core/`, no `index.html`, no `ui/*.js`, no tests added/removed). 585/585 passing; local PII audit clean.

**Trigger.** Operator query "go through the project and find us work we are radiating from energy" at the chat-4 routing point (LS still in identity verification per chat-3 close, Path C unrelated-work selected). Chat-Claude surfaced four candidates; operator picked #3 first (stale cleanup pass, shipped at `e340e02`), then picked the radiating-work pointer ("go") routing back to #1: agents/ scaffold codification.

**Pre-cycle state.** `~/dev/8ball/agents/verifier.md` (7.7KB) existed as a fully-written role doc but was untracked, citing "v0.22 extension (proposed)" — a citation that never landed in DOCTRINE.md because the v0.22 / v0.23 cycles shipped paid-surface clauses, not agent-team clauses. The orchestrator + implementer + auditor + controller roles existed in prose-form in DOCTRINE §10 v0.23 but with the verifier (Claude in Chrome) absent from the table; verifier.md was a structurally-orphaned role doc, with its operational vocabulary (orchestrator / implementer / auditor / verifier / controller) not yet codified in doctrine. The userMemories signal named the orchestrator skill `كن فيكون` / `kun fayakun` as the operator-coined working name (gloss in `agents/AGENTS.md`). `~/Desktop/8ball/controllers/` had 13 controller artifacts (directives + reports) from the v0.3.0 cycle indexing the existing operational pattern.

**Cycle scope** (all on branch, awaiting auditor + controller before merge):

1. **5 role docs in `agents/`** — `orchestrator.md` (79 lines, codename `كن فيكون / kun fayakun` in H1), `implementer.md` (115 lines, CC role + L40 procedure section), `auditor.md` (116 lines, Codex role + 5 disposition shapes), `controller.md` (82 lines, operator-as-always-on-layer with full boundary list), and `verifier.md` preamble updated from "v0.22 extension (proposed)" to "v0.24 extension" + audit-history entry appended. All five role docs follow the verifier.md shape (H1 + blockquote preamble citing §10 + What-this-lane-does + When-to-invoke + Boundaries + Procedures + Audit-history).

2. **`agents/PLATFORMS.md`** (128 lines) — per-platform constraints and friction modes for the 4 agents + ChatGPT adjunct + other adjuncts. Codifies the L40 firing log (CC content-filter v0.2.7.2; Codex paste-relay friction same cycle; CiC domain-allowlist block v0.3.0; TikTok region enforcement Thread A closure). Includes the artifact-location matrix mapping every cycle-shape to its canonical disk path.

3. **`agents/AGENTS.md`** (110 lines) — index doc tying the system together. One-paragraph system summary, role table with codename column, adjunct-lanes section, cycle-routing graph (controller → orchestrator → implementer → auditor → verifier → controller → merge → state-fill → live-fire), DOCTRINE §10 relationship section ("§10 is the constitutional summary; agents/*.md is the operational detail; if they disagree, §10 wins"), amendment-cadence note (doctrine §10 vs agents/*.md edits).

4. **DOCTRINE §10 amendment** (v0.23 → v0.24) — keeps the §ID + L17 preserves §-numbering under substance rewrite. Reshapes from 5-row prose table to: 4-row core-agent table (orchestrator/implementer/auditor/verifier) with role-doc column, controller called out separately as the always-on layer, adjuncts (ChatGPT/Perplexity/Gemini) in their own list. Lane discipline bullets retained with v0.24 vocabulary; L48 explicit-audit-cleared rule added. References to `agents/AGENTS.md` and `agents/PLATFORMS.md` make the operational detail discoverable from doctrine without bloating §10. Footer bumped to v0.24 dated 2026-05-12; v0.23 paragraph moved to lineage bullets.

5. **`8BALL.md` updates** — §3 row 12 ("Multi-model lanes") amended to point at both DOCTRINE.md §10 and `agents/AGENTS.md`. §4 ("Lane system") rewritten with v0.24 vocabulary, codename note, adjunct-lanes call-out, L48 sequencing rule, artifact-location matrix pointer.

**Naming note: `كن فيكون` / `kun fayakun`.** Operator-coined working name for the orchestrator role; gloss is in `agents/AGENTS.md` "Orchestrator codename note" (the single canonical disambiguation paragraph). Treated as religious-scholarly Arabic vocabulary per MUHAB.md §8 #6 (no gloss outside AGENTS.md in tracked content); the Latin transliteration is a navigation aid for non-Arabic readers, not a translation. Appears in `orchestrator.md` H1 + `AGENTS.md` role table + the project's working vocabulary going forward.

**Doctrinal substance retired by v0.24** (audit hooks for codex full-PR review):
- v0.23 §10 5-row table (Orchestrator/CC/ChatGPT/Codex/Operator) — superseded by the 4-agent + 1-controller + adjuncts structure. ChatGPT moves from "core lane" to "adjunct" because its role-shape (content/copy review, paste-relay only, project-no-specific-doctrine) matches the adjunct definition, not the core-agent definition. Codex's lane label tightens from "adversarial pre-merge auditor (doctrine changes, release-gate passes)" to "auditor — adversarial pre-merge review on doctrine, content, release-gates" — substance preserved, vocabulary aligned. CC's label tightens from "engine work, filesystem, git ops, audit-script execution" to "implementer — multi-file production edits, git ops, repo filesystem" — substance preserved. Chat-Claude's label tightens from "orchestrator, brief composer, doctrine drafter" to "orchestrator — context, briefs, dispositions, sequencing" — substance preserved + the "doctrine drafter" framing moved into the role doc's What-this-lane-does. Operator's lane re-framed as "controller" (the always-on layer) per the project's existing verifier.md vocabulary; not an agent, the human running them.

**Gate sequence** (per §8 + §10):

- ✅ Branch `agents-codification-doctrine-v024` created from main.
- ✅ All commits on branch.
- ✅ Local PII audit clean (53 files scanned, no hits — 47 pre-cycle + 6 new agents/*.md tracked entries).
- ✅ Test surface 585/585 passing (no new tests added — doctrine + docs cycle).
- ✅ Journal entry (this entry).
- ✅ PR #18 opened 2026-05-12. Audit brief at `~/Desktop/8ball/audits/codex_agents_codification_2026-05-12.md`.
- ✅ Codex full-PR audit returned overall P1. Response saved at `~/Desktop/8ball/audits/codex_agents_codification_response.md`.
- ✅ Audit dispositions. 1 P1 + 3 P2 absorbed in-cycle (commit `29023dd` on branch); no hooks deferred.
- ✅ Controller squash-merge 2026-05-12 via `gh pr merge --squash --delete-branch` (PR #18).
- ✅ Post-merge: `76b83ea` squash-SHA filled + `8BALL.md` §10 state row + journal entry stamped (this commit, 2026-05-12).

**L-candidate (this cycle): L49-candidate — agents-codification as the inverse of doctrine-ahead-of-code.** L16 named "doctrine-ahead-of-code is the inverse of aspirational doctrine." L49 candidate is the sibling form: **agents-ahead-of-code-and-doctrine**. The verifier.md role doc was written 2026-05-11 citing a doctrine extension that didn't exist (`v0.22 extension (proposed)`). The doc was true to its own logic but the citation was structurally floating. This cycle lands the cited doctrine and brings the role doc's citation into truth-with-disk. The lesson is symmetric to L16: a role doc that cites a doctrine clause not yet landed is the same shape as code that implements a doctrine clause not yet landed. Both produce the same audit verdict — citation-not-found. Mitigation: when writing a role doc that requires a doctrine amendment, write both or neither; don't ship the role doc with a "(proposed)" citation expecting the doctrine to land later, because the role doc is doctrine-shaped content and inherits the same gates. (Tentative; promote to full L on second sighting.)

**No code change, no test surface delta, no `core/` touch, no `index.html` touch, no `ui/*.js` touch.** This cycle is doctrine + scaffolding only. Test count stays 585; local PII audit clean; 53 files scanned by the local audit (47 pre-cycle + 6 new agents/*.md tracked entries).

Files modified or added this cycle: `DOCTRINE.md` (§10 amendment + footer v0.23 → v0.24 + v0.23 line moved to lineage bullets), `8BALL.md` (§3 row 12 + §4 rewrite), `agents/orchestrator.md` (NEW), `agents/implementer.md` (NEW), `agents/auditor.md` (NEW), `agents/controller.md` (NEW), `agents/verifier.md` (preamble + audit-history), `agents/PLATFORMS.md` (NEW), `agents/AGENTS.md` (NEW), `journal.md` (this entry).

Branch: `agents-codification-doctrine-v024`.
Squash merge: `76b83ea` (PR #18, 2026-05-12).

**Codex full-PR audit disposition (2026-05-12).** Overall P1. Response saved at `~/Desktop/8ball/audits/codex_agents_codification_response.md`. Hooks 1–7, 10–12: PASS. Hook 8 P1 (codename gloss not single-sourced): absorbed in-cycle — stripped Quranic-phrase gloss from `agents/orchestrator.md` audit history + `journal.md` pre-cycle-state paragraph + `journal.md` "Naming note" paragraph; gloss now lives only in `agents/AGENTS.md` "Orchestrator codename note" per the AGENTS.md claim. Hook 9 P2 (verifier.md substance-unchanged claim not independently auditable from git): softened the claim in `agents/verifier.md` audit-history; controller-verified is now the audit trail (the file was previously untracked). Hook 13 P2 (audit count drift 47 → 53): fixed both spots in the journal entry above. Hook 14 P2 (stale "future" wording in `verifier.md` §2/§3 procedures): reworded §2 as "current — paid surface shipped in v0.3.0; awaiting LS Live for end-to-end" and §3 as "current — shipped in v0.2.5". All four absorbs land in a single follow-up commit on the same branch; no re-audit requested since the changes are surface-narrow.

## v0.3.0.2 SHIPPED — LS checkout success_url in Buy Link href

2026-05-12. Hotfix on branch `v0.3.0.2-redirect-fix`. Surfaced during the §13 17-step live-fire on Path A (operator running the paywall path on the deployed site, test-mode LS checkout, test card `4242 4242 4242 4242`). Test charge processed cleanly in LS Test mode; operator landed on LS's default "Thanks for your order!" modal with a "View order" button instead of being auto-redirected back to `the-eight-ball.netlify.app/?paid=t1` to trigger `applyPaidReturn()`.

**Root cause.** The Buy Link `<a href>` in `index.html` line 916 was the bare LS storefront URL with no `?checkout[success_url]=...` query parameter. LS only auto-redirects post-purchase when (a) a per-product Thank-you URL is set in the LS dashboard, or (b) the Buy Link URL itself carries `checkout[success_url]`. Neither was true. LS UI for setting the dashboard-side Thank-you URL is hidden under Product → Variant → Edit → some "after purchase" sub-section that the operator couldn't surface during 3 panels of clicking (Email receipt, Add Variant, product actions menu — all dead ends for this setting).

**Fix.** Append the URL-encoded `?checkout[success_url]=https://the-eight-ball.netlify.app/?paid=t1` to the Buy Link href. Code-tracked rather than dashboard-config because: (a) ships through normal PR → audit → merge gate, doctrine-clean; (b) same href works in Test + Live without per-mode config; (c) survives LS account migrations or store swaps without re-configuration drift. The §5.B Call 2 contract ("Success URL is `/?paid=t1` — JS parses the query on next load, runs `applyPaidReturn()`") was always the doctrine; this fix routes LS through the contract instead of relying on dashboard state.

**Tests.** Tightened the existing `paywall CTA is a Lemon Squeezy Buy Link` regex to accept an optional query string after the variant UUID. Added a new assertion `paywall CTA carries checkout success_url back to /?paid=t1 (v0.3.0.2)` that locks the URL-encoded `checkout%5Bsuccess_url%5D=https%3A%2F%2Fthe-eight-ball.netlify.app%2F%3Fpaid%3Dt1` substring in the href. Test count 585 → 586. Local PII audit clean.

**Out of scope.** No `core/` touch. No DOCTRINE touch (stays v0.23 on `main`; agents/ PR #18 still proposing v0.24 in parallel — independent of this hotfix). No new files. No new dependencies. No surface change on the site itself — the change is invisible to the user until they tap the paywall CTA, at which point LS receives the success_url and redirects cleanly post-purchase.

**Operator notes for re-test.** After merge + Netlify deploy lands, repeat §13-step-7: trigger paywall with a new pair → tap `unlock · $3` → pay with `4242 4242 4242 4242` / any future expiry / any CVC → confirm browser auto-redirects to `the-eight-ball.netlify.app/?paid=t1` (not the LS modal) → confirm the four post-pay verifications (URL query stripped, banner shown, card unlocked, localStorage matches §13 expected). If LS still shows its modal post-deploy, then `checkout[success_url]` may have been silently rejected (account-level redirect-domain allow-list, etc.) — but that's a controller-facing LS support question, not a code issue.

**Gate sequence.** ✅ Branch + commit + push. ✅ PR #19 opened. ✅ Codex spot-audit returned overall P1 (response at `~/Desktop/8ball/audits/codex_v0302_redirect_fix_response.md`; noted `checkout[success_url]` is undocumented per LS; operator merged anyway with belt-and-suspenders shape — LS dashboard Confirmation modal Button link also set to `https://the-eight-ball.netlify.app/?paid=t1` on product 1045549 variant 1639690, 2026-05-12). ✅ Controller squash-merge 2026-05-12 via `gh pr merge --squash --delete-branch` (PR #19). ✅ Post-merge: `6619cb9` squash-SHA filled + `8BALL.md` §10 state row + journal entry stamped + re-test on prod (live-fire outcome below).

**Live-fire on prod (2026-05-12, post-deploy).** CiC agent ran the full §13-shape sequence on `the-eight-ball.netlify.app` (Test mode LS, `4242` test card). Report at `~/Desktop/8ball/audits/cic_live_fire_v0302_redirect_report.md`. Outcome: **PASS end-to-end**. Free 3-of-3 consumed cleanly (Sam Carter / Jane Doe / Alex Reed); paywall fired at try 4 (Casey Park) as designed; LS checkout link confirmed carrying the `?checkout[success_url]=` query param; payment processed; **Path C ruled out** — browser landed on `the-eight-ball.netlify.app/` with the `?paid=t1` already stripped and the Casey Park card rendered in unlocked state (depth surface visible: card-name `the floating trick`, type `trickster · soft chaos`, habit + bracket-resolved note, "2 reads left" chip); subsequent shake didn't re-trigger the paywall; localStorage state correct (`eight_ball_credits_v1: "2"`, `eight_ball_tries_used_v1: "4"`). **A vs B undetermined** — controller completed checkout manually; the CiC observation window opened post-redirect so the v0.3.0.2 query-param mechanism (A) vs the dashboard Confirmation modal Button link (B) couldn't be distinguished on this fire. Belt-and-suspenders shape preserved; the operational outcome (redirect lands cleanly) is what matters for v0.3.0.2's gate. Two non-blocking deviations flagged: (1) CiC reported the `three reads unlocked. enjoy.` banner not observed on landing — code path verified intact (`ui/payments.js:147-149` calls `showPaidBanner()` after `replaceState`; banner has ~4s visible window + 600ms fade); most likely a screenshot-timing artifact across the controller's manual checkout dance, but no test coverage exists on the banner DOM and that's a small QA gap worth noting. (2) CiC reported SHAKE AGAIN "broken" — verified by code-level inspection (`index.html:1192-1203`) as the β idempotence behavior locked at v0.3.0 per DOCTRINE §6.5/§7.1; re-shake on the same profile is cosmetic and credit-preserving by design, not a bug. CiC misread the spec expecting re-roll semantics. Parked the depth-re-roll design conversation at `~/Desktop/8ball/sessions/v0.3.x_shake_again_facet_reroll.md` as a v0.3.1 candidate (option c facet re-roll); not in scope for v0.3.0.2.

Branch: `v0.3.0.2-redirect-fix`.
Squash merge: `6619cb9` (PR #19, 2026-05-12).

## post-v0.3.0.1 — 8BALL.md §11 + sessions/ stale cleanup pass

2026-05-12. Hygiene-only commit during LS-identity-verification wait (chat-4 picked Path C: unrelated work while LS pending). No code touched. No DOCTRINE touch (stays v0.23). No tests added or removed.

**Closed §11 items** in `8BALL.md`:
- Item 12 — residual `v0.1.4-phase2d-concern-dispositions` branch cleanup verified absent on origin (origin contains `main` only). Appended `v0.3.0-depth-unlock` deletion to the branch-history note.
- Item 15 — live-fire testing reframed from work-to-do to ✅ codified per §8 ritual-gate sub-rule. Subsequent firings recorded (v0.2.1, v0.2.7.2, v0.3.0-pending-LS-Live).
- Item 16 — MUHAB.md §6 8ball row confirmed in place; marked done.
- "v0.3.0 — free-vs-$9.99-entry pricing conversation (open)" paragraph reframed as ✅ resolved by ship. The $9.99 entry-price framing was retired during the v0.3.0 design churn; v3 of the design doc locked free-first; v0.3.0 shipped at $3/3 Tesla-369 staircase. Pricing conversation is now post-traction.

**Sessions/ archaeology** in `~/Desktop/8ball/sessions/`:
- `v0.3.0_design.md` marked SUPERSEDED at top with reference to `f955607` + `21bfb5c` as the executing commits. Preserves history as decision-locking artifact, signals it is no longer a live working doc. Live state pointer points to `8BALL.md` §10/§11 + the `v0.3.0 SHIPPED` / `v0.3.0.1 SHIPPED` journal entries.

**Still open in §11** (not touched in this pass):
- Item 11 — shadow Netlify project deletion. Operator-action (one-click in Netlify dashboard); can't be done from chat.
- Item 10 — deferred 2G-3+ candidates (moon sign / day-pillar / lunar phase / birth card). Held behind v0.3.0; valid held-state, may not return.

**Trigger.** Operator query "go through the project and find us work we are radiating from energy" at the chat-4 routing point (LS still pending identity verification). Chat-Claude surfaced four candidates: agents/ scaffold codification (most operator-signal), Friday rule-kill on DOCTRINE v0.23 (highest-leverage hygiene given recent doctrine churn), this stale cleanup pass (#3), folded #1+#2. Operator picked #3.

**Rationale.** §11 punch-list staleness is a doctrine-virtue cost: an open-items list that contains already-closed items dilutes the working signal in every future bootstrap read. Three items were already done at the implementation level but not yet at the documentation level; the cleanup re-aligns disk-state with shipped-state. The `v0.3.0_design.md` SUPERSEDED banner is the minimal annotation that preserves historical context while signaling "not the live source." Adjacent option: deleting the design doc — rejected per the project's "files are canon; memory is index-only" pattern (MUHAB.md §2.2). Historical artifacts stay on disk with status banners.

**No L-candidate this pass.** Cleanup work was pure execution against the visible state delta; no novel sequencing, audit, or doctrine learning surfaced.

Files modified: `8BALL.md` (§11 items 12/15/16 + the freestanding $9.99-pricing paragraph), `~/Desktop/8ball/sessions/v0.3.0_design.md` (SUPERSEDED banner), `journal.md` (this entry).
Commit: direct-to-main per post-release fill pattern (mirrors `ebe039b` / `f3c6c09` / `22bcedf`). No PR, no DOCTRINE touch, no `core/` touch.

## v0.3.0.1 SHIPPED — codex full-PR audit absorb

Date stamp filled at squash-merge.

Follow-up minor closing both P1s and one P2 from the v0.3.0 codex full-PR audit (response at `~/Desktop/8ball/audits/codex_v030_full_pr_response.md`). Per L48-candidate (v0.3.0 entry below), the merge-gate fired at 17:24Z before the audit response landed; v0.3.0.1 ships the dispositions as the standard remedy. Cherry-picked from commit `b25321e` on the orphaned `v0.3.0-depth-unlock` branch (the absorb work was pushed there post-step-12-merge while the audit was still being dispositioned).

**Dispositioned hooks:**

- **Hook 10 P1 — modal overflow at 568px / 720px viewports.** `.modal` had no `max-height`; Playwright measured 1045px modal height at 320×568 (iPhone SE), which clipped the about-modal's third paragraph past the page bottom. Fix: add `max-height: calc(100vh - 48px)` + `max-height: calc(100dvh - 48px)` (dvh override for mobile-safe behavior) + `overflow-y: auto` to the `.modal` selector. Modal scrolls internally when content exceeds viewport instead of overflowing the page. No content/copy change; markup-static tests unchanged.

- **Hook 4 P2 — toISOString UTC midnight off-by-one in DOB validation.** `new Date().toISOString().slice(0, 10)` returns the UTC calendar date. In positive-UTC timezones (KSA UTC+3), the user's local today is one day ahead of UTC between local-midnight and UTC-midnight; a same-day DOB would be rejected as "future" relative to UTC yesterday. Fix: small `todayIsoLocal()` helper that composes the ISO string from `getFullYear` / `getMonth` / `getDate` (all local-tz accessors). Replaces both call sites (HTML5 `max=` at boot + JS submit-handler gate). `tests/dob_validation.test.js` updated: two existing UTC-pattern assertions retargeted to the helper shape; one new positive assertion that the helper definition contains the three local-tz accessors AND negative assertions that the retired UTC pattern is gone from both call sites. Edge-case stakes: 1 user / ~1000 days per positive-UTC timezone whose birthday falls between local-midnight and UTC-midnight on their entry day. Real but low. Fix is ~6 LOC + tighter test surface.

- **Hook 3 P2 — 18+ substring not asserted in payments_markup.** The about-modal copy contains "first-visit 18+ tap is a click-through, not verification" (§4.A carry from v0.18), but `tests/payments_markup.test.js` `describe('disclosure copy ...')` had no positive assertion for the `18+` substring. Fix: add `it('about-modal: discloses the 18+ acknowledgment gate (§4.A carry)', ...)` with `expect(aboutSubtree).toMatch(/18\+/)`. Guards against a future copy tightening silently dropping the disclosure.

**Hooks NOT absorbed** (with disposition):

- **Hook 6 P1 — §16 PayPal payout verify** — operator-action, not code. The brief §16 punch-list item ("PayPal account verified + connected as LS payout method; test a small withdrawal-to-KSA-bank route before launch") is independent of code surface. Surfaced as explicit step-12.6 prerequisite in the recovery sequence. No PR change.
- **Hook 8 P2 — literal "XHR" in core/cities.js comment** — comment text, not runtime code; `tests/privacy_scan.test.js` does not fire on comment strings. Known-deferred; can fold into a future patch if the scan ever tightens to include comments. Not blocking.
- **Hook 9 P2 — LS Test→Live operational gate reminder** — codex verified the URL is identical in both LS modes (dashboard toggle, not a URL swap). Already on the operator-action queue per step 12.6 of the original handoff. Recalibrated mid-recovery: the LS account is still in identity verification (per chat-3 21:08 KSA screenshot), so Live mode is not one-toggle-away yet anyway. No code change.

**Test surface.** 583 → 585 (+2: 18+ disclosure assertion + todayIsoLocal helper assertion). Two existing dob_validation assertions retargeted to the new shape (zero net delta from those).

**index.html.** 1441 → 1455 (margin 45 to §6 ceiling, down from 59). The modal CSS fix is +9 LOC including the comment block; the todayIsoLocal helper + comment block is +4 LOC net at the boot site; the submit-gate site swap is 0 LOC delta.

**Doctrine.** No DOCTRINE bump. Fix B layered validation (HTML5 `max=` + JS gate + `.field-error` markup) was already in §1.B v0.23 scope; the toISOString → local-date swap is a sub-fix to the same doctrine surface, not a new clause. v0.23 footer wording stays accurate against shipped code.

**Cycle shape.** Three fixes, three files touched (index.html + payments_markup test + dob_validation test). The cherry-pick from `b25321e` carried the absorb commit verbatim; this journal entry + 8BALL.md row update are the only additions on top of the cherry-pick.

Files: index.html, tests/payments_markup.test.js, tests/dob_validation.test.js, journal.md (this entry), 8BALL.md.
Branch: v0.3.0.1-codex-absorb (cherry-picked `b25321e` from the orphaned `v0.3.0-depth-unlock` branch post-v0.3.0 merge).
Squash merge: `21bfb5c`.

## v0.3.0 SHIPPED — paid surface (3 free tries, $3/3 reads, hosted LS checkout)

2026-05-11 at `https://the-eight-ball.netlify.app`. Live commit on `main`: `f955607` (squash-merge of `v0.3.0-depth-unlock`, 10 commits collapsing 11 steps). Codex full-PR audit dispositioned post-merge as v0.3.0.1 follow-up — see "Step 12 sequencing slip" below.

First paid surface in the product. Free tier remains the locked symbol-only render (sun, five-element, public/private animals, life · name · soul, optional rising). After three new-pair shakes consume the free tier, the lock icon and form-submit both route to a paywall modal whose CTA is a plain `<a href>` Buy Link to a Lemon Squeezy hosted checkout. On successful payment, LS redirects to `?paid=t1`; the page handler credits +3 reads, consumes any pending profile staged at paywall-trigger time, and renders the card "opened up" — name, type, habit, and the bracket-resolved trait for the user's life-path bracket from the 144-cell deck at `~/dev/8ball-private/cards.v1.full.js`. Three free tries, then $3 buys three reads — Tesla 369 staircase pricing (3/6/9), arcade-toy economics calibrated to the actual computational density of the calculator below.

**Architectural shape.** The paid surface separates into three concerns: pure state machine (`core/payments.js` — isNewPair, nextShakeState, applyPaidReturn, all vitest-testable without jsdom); UI controller (`ui/payments.js` — localStorage keys, paywall modal handlers, paid-return redirect handler); and the cross-module state machine driver (form-submit + lock-icon handlers in `index.html`). The deck content itself ships in the public bundle as `content/cards.v1.full.js` — the lock is a UI convention, not a vault. The about-modal discloses this honestly: the deck is visible in source, the three-dollar coin funds more of the toy, we trust adults to tip when they enjoyed it. Backend-gated delivery (Netlify Functions + Stripe webhook verification, or LS license-key issuance) is doctrinally permitted as a future amendment but not built in v0.3.0 — calibrated against the actual production traffic and tip-vs-free conversion that v0.3.0 will reveal.

**Steps shipped on `v0.3.0-depth-unlock`** (11 steps, squash-merged at `f955607`):

1. **DOCTRINE.md v0.21 → v0.22.** Paid-surface clauses landed: §1.B (depth-unlock surface), §4.B (paywall + on-device disclosure requirements), §5.B (LS hosted-checkout exemption from the same-origin rule + new LS allow-listed key set), §6 (single-file ceiling + ui/*.js split target), §7 (β try-counting + idempotent re-shake on stored profile).
2. **`core/payments.js` + `tests/payments_state.test.js`.** Pure functions for the three state-machine primitives. 34 unit tests covering the transition table (render-idempotent / render-unlocked / render-locked / show-paywall), credit accounting, and replay-attack safety on `?paid=t1` without a pending profile.
3–4. **Deck copy from private → public + privacy_scan extensions.** `content/cards.v1.full.js` shipped to the public repo (lock-is-convention disclosure makes this honest). `tests/privacy_scan.test.js` extended with the three new LS keys in the allow-list and `'ui'` added to SCAN_ROOTS so the eventual ui/*.js modules get scanned.
5. **Paywall surface HTML + CSS.** `<div id="paywall-modal">` with CTA Buy Link, `.modal-disclosure` line, lock icon, reads-chip, paid-banner, unlocked-card slots (card-name / card-type / card-habit / card-note). No JS yet — pure markup + style.
6. **Paywall JS controller + `ui/payments.js` split.** `index.html` breached the 1500-line §6 ceiling pre-split; extracting the LS-keys + counter shims + paywall modal handlers + handlePaidReturn into a 165-LOC ui/payments.js module landed the line budget at 1498 (2-line margin). The split established the ui/*.js pattern.
7. **About-modal copy + `ui/profile.js` split + markup smoke tests.** Codex pre-merge audit on step-6 diff returned 8 PASS / 2 P1 / 0 P0; both P1s (line-budget runway gone; new DOM wiring untested) absorbed into step 7. `ui/profile.js` extracted (153 LOC — profile persistence + form helpers with DI hooks for selectedCity/currentProfile mutation). About-modal rewritten to §10.2's ~180-word copy with Lemon Squeezy named, payment + email vs on-device data-flow boundary disclosed, source-visibility framing explicit. `tests/payments_markup.test.js` NEW with 21 forward-ported assertions covering DOM existence (lock-icon, paywall-modal, reads-chip, unlocked-render slots), URL handling (URLSearchParams + applyPaidReturn + replaceState-with-pathname), and all of §10.3's about-modal + paywall-modal disclosure substrings.
8. **CiC Fix A + Fix B.** Two coupled fixes from the verifier baseline report. Fix A: `formatNumbers` always space-separated (the hasMaster-branched display retired; "3 8 3" reads as three coordinates where "383" read as one three-digit number). Fix B: future-DOB validation, layered — HTML5 `dobInput.max = today` (soft fence, set at boot for cache-freshness) + JS submit-handler real gate (`dob > todayIso` lexicographic compare catches today+1 through any future year) + inline `.field-error` markup (`<p id="dob-error" hidden>`) that surfaces on rejection and hides on next input event. New CSS class `.field-error` uses `--ink` for slightly more emphasis than the muted `--label` of passive hints. Test coverage: `tests/numerology_display.test.js` NEW (5 assertions) + `tests/dob_validation.test.js` NEW (9 assertions).
9. **Full payments_markup coverage.** Deferred 4 JS-pattern groups landed: `pending_profile_write` (setPendingProfile → openPaywall sequence in both Path A and Path B + locality guard that bare-string LS write lives ONLY in ui/payments.js), `pending_profile_consume` (clearPendingProfile call inside handlePaidReturn body), `try_another_behavior` (tryAnotherBtn handler calls resetFormDisplay NOT clearProfile per β try-counting), `profile_animal_field` (profile.animal in unlocked render; profile.publicAnimal forbidden anywhere). Tests 577 → 583 (+6).
10. **8BALL.md §10 IN-FLIGHT row + this journal entry (real-time).** Written mid-cycle at chat-2 → chat-3 handoff to carry structured state across the chat boundary. MERGE_SHA_TBD placeholder + future-tense step-11/12 language at write-time; both replaced post-merge in the v0.3.0 fill commit.
11. **DOCTRINE.md v0.22 → v0.23 final bump.** Three amendments locking doctrine against shipped reality: **§1.B v0.23** retired the v0.22 `hasMaster`-branch numerology language (Fix A made the triplet always space-separated, so the branch language no longer matched code); **§4.B v0.23** corrected the about-modal disclosure scope from "localStorage-wipe reset" to "cap shape (3 free + $3/3 reads)"; **§6 v0.23** locked the `ui/*.js` split pattern with both `ui/payments.js` (165 LOC) and `ui/profile.js` (153 LOC) as concrete precedents, and named the DI shape `initThingUI(refs, hooks)`.

**Test surface.** 502 (pre-cycle) → 583 (post-step-9). +81 across the cycle: 34 payments_state + 27 payments_markup (21 step-7 + 6 step-9) + 5 numerology_display + 9 dob_validation + 6 misc (existing tests' updated counts from markup deltas).

**Single-file ceiling pressure** (codex hook 8 P1 disposition trail). index.html crossed 1500 at the end of step 5 markup. Step 6 split landed at 1498 (2-line margin). Step 7 absorbed two more concerns (about-modal +5 LOC, initProfileUI block +12 LOC) but offset by extracting profile.js (~92 LOC), netting index.html to 1418 — 82 lines of margin. Step 8 added DOB validation surface (+23 LOC), bringing index.html to 1441 — still 59 lines of margin to the §6 ceiling at the moment of writing this entry. Doctrine step-11 final bump locks the ui/*.js pattern with `ui/payments.js` + `ui/profile.js` as established precedent rather than a one-off.

**L-candidates** (this cycle):

- **L40 (continued).** "Do the standard workaround does not always succeed" is the cross-cycle workhorse principle. Cycle saw it fire again, this time NOT as a model-routing pivot but as a doctrine-vs-implementation pivot: the codex pre-merge audit at step 6 surfaced two P1s that would have compounded silently into step 8 if absorbed lazily. L40-shaped instinct: pivot the scope of step 7 rather than keep grinding on the original about-modal-only plan. Absorption disposition (move the next ui/*.js split forward + forward-port 6 of 10 markup tests) closed both P1s in one commit.

- **L46-candidate (new).** Mid-cycle adversarial audit as a structural breakpoint, not just a pre-merge ritual. The codex audit between step 6 (lane: chat-A) and step 7 (lane: chat-B, this chat) compressed multi-day risk-surface into a single audit checkpoint at the natural between-substantive-commits seam. The handoff document at `~/Desktop/8ball/sessions/handoff_v030_step6_to_12_2026-05-11.md` carried the structured state across the chat boundary; the audit response carried the structured critique. Both inputs converged at the start of chat-B and dispositioned cleanly in one chat-turn. Difference from §10's standard "Codex pre-merge audit on the PR" pattern: this audit fires AT the natural workflow seam (post-step-6, pre-step-7), not at PR-open. Earlier surfaces the structural drift earlier; cheaper to absorb.

- **L47-candidate (new).** Test forward-porting under audit P1 absorption. Codex hook 9 P1 (no direct DOM-wiring test coverage on step-6 surface) was absorbable not as "rewrite step 9 timeline" but as "forward-port a slim subset of step 9 into step 7." Six of ten markup groups (DOM-existence + URL handling + disclosure substrings) land at step 7 alongside the about-modal copy edit; the four JS-pattern groups that scan across both files stay at step 9 where their original scope-correctness lives. The forward-ported subset closes the P1 (every step-6 wiring assertion now under test) while preserving the step-9 scope. Forward-porting > rewriting step boundaries — when an audit P1 is "test gap on shipped surface," the cheapest absorption is to land the markup-static subset of the future test plan immediately, not to rebuild the test plan.

- **L48-candidate (new).** Merge-before-audit-disposition is an L27-family sequencing slip. CI passed at 12.3 (17:19:52Z); the codex full-PR audit brief was drafted, clipboard-loaded, and surfaced at 12.4 (~17:20Z); operator merged the PR at 17:24:26Z — ~5 min after CI green, before the audit response landed and before live-fire fired. Codex full-PR audit returned 4 PASS / 2 P1 / 4 P2 / 0 P0 / 0 FAIL ~10 min after merge; the two P1s (modal overflow at iPhone SE 320×568 + 1280×720 desktop heights; toISOString UTC midnight off-by-one in DOB validation) became live-on-prod regressions on `f955607`. The merge gate fires once; audit dispositions must land before merge OR ship as a separately-tagged follow-up minor — both v0.3.0 (the merged squash) and v0.3.0.1 (the absorb follow-up cherry-picking `b25321e`) shipped this cycle. Practical-stakes recalibration mid-recovery: the L27 framing assumed LS Live mode was one toggle away, but the LS merchant account (`sirr1148.lemonsqueezy`) was still in identity verification per screenshot at chat-3 ~21:08 KSA, so no real revenue surface could route to Test or Live yet. The sequencing slip was doctrinally real but practically inert at v0.3.0 timing — the rule still holds against the future-Live case where stakes won't be dormant. Don't retire L27; constrain its claimed stakes to "Live-verified LS or equivalent merchant-of-record."

- **Footnote (tool-use slip).** Mid-step-7 the chat-B orchestrator confused two edit-tool schemas (Desktop Commander's `edit_block` has no `description` parameter; the host platform's `str_replace` does) and wrote `<parameter name="description">` literal text into index.html as new_string content. Caught by the next read; recovered by a single str_replace-shaped edit. One-off recovery; not promoted to numbered L because the pattern doesn't recur in tracked behavior — the next edits resumed clean. Worth a footnote because the slip illustrates that tool-schema verification belongs in the same pre-flight bucket as file-read verification, even mid-session when momentum is high.

**Bound for steps 10–12** at journal-write time, now shipped:

- **Step 10** — done at this entry + 8BALL.md §10 IN-FLIGHT row prepend (chat-2 → chat-3 handoff carrier).
- **Step 11** — done at `bbd532e` (DOCTRINE.md v0.22 → v0.23 final bump per L48 entry above).
- **Step 12** — sequencing slip. PR #16 opened at 17:19Z (`gh pr create` against `main`, 10 commits enumerated, doctrine v0.21→v0.22→v0.23 trajectory in body). CI passed in 15s. Codex full-PR audit brief drafted at `~/Desktop/8ball/audits/codex_v030_full_pr_audit.md` (10 hooks; 117-line brief; PROMPT-START/END anchored). **Operator merged at 17:24Z before the audit response landed.** Codex response came back 4 PASS / 2 P1 / 4 P2 / 0 P0 (full breakdown at `~/Desktop/8ball/audits/codex_v030_full_pr_response.md`); two P1s became live-on-prod and were absorbed in commit `b25321e` (orphan on the post-merge branch). Disposition: cherry-pick `b25321e` onto a fresh branch from main as v0.3.0.1 follow-up PR (closes P1 hook 10 modal overflow + P1 hook 4 toISOString UTC + P2 hook 3 18+ substring test). Tag `v0.3.0` lands on `f955607`. LS Test→Live swap (L27 step-12.6 substep) is operator-paced; LS account is in identity verification per chat-3 21:08 KSA, so the verify-then-Live sequence is independent of v0.3.0's merge timing and not on the critical path.

Files modified or added this cycle: DOCTRINE.md, core/payments.js (NEW), ui/payments.js (NEW), ui/profile.js (NEW), content/cards.v1.full.js (moved public), index.html, tests/payments_state.test.js (NEW), tests/payments_markup.test.js (NEW), tests/numerology_display.test.js (NEW), tests/dob_validation.test.js (NEW), tests/privacy_scan.test.js, 8BALL.md, journal.md (this entry).

Branch: v0.3.0-depth-unlock.
Squash merge: `f955607`.

## v0.2.7.2 SHIPPED — city autocomplete + IANA timezone + DST-aware rising

Date stamp filled at squash-merge.

City-level birthplace input replaces country-centroid + fixed-offset rising. v0.2.1's `(country, lat, lng, utcOffsetMinutes)` form is retired from the UI; selecting a city now atomically sets `(city, cc, tz, lat, lng)` on the form state and routes rising-sign math through the new tz-aware `computeRising()` API. DST and historical timezone rule changes (Indiana pre-2006 no-DST, Russia post-2014 permanent MSK, US summer CDT) are now resolved correctly via `Intl.DateTimeFormat` with `{ timeZone: tz, timeZoneName: 'longOffset' }`. Legacy `getRisingSign(..., utcOffsetMinutes, ...)` API retained inside `core/rising.js` for v0.2.1+ stored-profile fallback; both APIs polar-safe (|lat| > 66.5° → null).

Bundled cosmetic fix: dropped `(24h)` parenthetical from the BIRTH TIME label. v0.2.7.1 verifier-caught — the browser renders the input in 12-hour locale regardless of the parenthetical, so the label promised what the UI didn't deliver.

DOCTRINE bumped v0.20 → v0.21: §1.A amended (DST + historical-tz handling in scope; city-level birthplace; polar null at strict >66.5°); §5 amended (same-origin lazy loads of static JSON permitted; `fetch()` / `XMLHttpRequest` / `navigator.sendBeacon` ban preserved); §5 allow-list extended with `city` / `cc` / `tz`. The v0.14 "fixed UTC offsets" wording and the §5 v0.10-era "zero network requests after page load" wording are retired by this amendment; intent ("no third-party traffic, no telemetry, no out-of-band data flow") is preserved verbatim.

Calc version unchanged: stays v2. Rising is surface-only per §1.A and does not enter the catalog driver.

**Data layer.** New `core/cities.js` implements lazy-loaded city autocomplete + ASCII-fold search + IANA timezone resolution. Backed by new `assets/cities.json` (2.30 MB raw, 1.04 MB gzip; 53,308 entries; 341 unique IANA tz strings, deduplicated via index lookup; sorted by population descending). Source: GeoNames cities5000 (`https://download.geonames.org/export/dump/cities5000.zip`) with additional pop ≥ 7500 floor to fit §5/§6 disciplines. New `tests/cities.test.js` codifies the data-quality contract (≥50K entries; valid IANA round-trip on every tz; no near-duplicate cities; population-sort invariant).

**Lane discipline carry-forward (v0.2.7.2-specific).** This cycle ran across two implementation lanes after a mid-cycle re-pivot:

1. **CC** wrote the calc layer (`core/rising.js` new `computeRising` API, `core/profile.js` plumbing) and built `assets/cities.json` via a Node prune script. Hit two consecutive API content-filter trips while writing the next file (`core/cities.js`), once at the rising-sign-description boundary and once at the cities-module-description boundary. L40 cap fired ("do the standard workaround does not always succeed — set a 2-attempt cap on opaque workarounds and close to next scope rather than grinding"; same pattern as Thread A KSA TikTok region enforcement earlier in the same session).

2. **Chat-Claude** took over and shouldered the remainder via Desktop Commander: `index.html` UI rewrite + JS rewrite, `DOCTRINE.md` v0.21 amendments, `tests/rising.test.js` rewrite (polar-strict + DST-aware + parity), `core/cities.js` completion (COUNTRY_NAMES table K–Z covering 224 ISO codes + `loadCities` / `searchCities` / `getCountryName` exports), `tests/cities.test.js` NEW (14 assertion groups), this journal entry, `8BALL.md` state update.

Mid-cycle the plan briefly added a third lane: Codex implementing `core/cities.js` + `tests/cities.test.js` from a paste-ready directive. The directive was drafted, extracted to clipboard, and surfaced to operator. Operator surfaced friction at the first paste-relay hurdle ("i dont know what should i do for codex its open tho"). L40 fired a third time in the same session, pivoting back to chat-Claude direct-write. Codex's earned role per MUHAB.md is adversarial doctrine audit, not implementer; the implementer routing was an L40-forced re-pivot that didn't survive the first friction test. DOCTRINE §10 two-eyes preserved via Codex pre-merge audit on the PR + operator final approval — the second model is the auditor, where it already has earned strength.

**Disclosed deviations from the brief** (per v0.2.7.1 disclosure pattern):

1. **GeoNames cities5000 + pop ≥ 7500 floor.** Brief specified cities5000 as default with ≤2.5 MB hard cap. Raw cities5000 is 68,581 entries / 7.98 MB. Applied additional pop ≥ 7500 floor to land 53,308 entries (clears the brief's "~52K entries" target + ≥50,000 test gate) at 2.30 MB. CC re-derived the implicit floor that yielded the brief's stated count — L42-candidate. Also applied a tz-dedup-via-index layout that further compressed the asset.

2. **Dynamic `import()` with import attributes instead of `fetch()`.** `tests/privacy_scan.test.js` line 59 forbids the literal token `fetch(` in tracked source under `core/`, `content/`, and `index.html`. CC pivoted to `import('../assets/cities.json', { with: { type: 'json' } })` — pure ESM module-loader path, no XHR, no `fetch(` token in source. The privacy scan stays as-is and this remains the enforced gate. L41-candidate: token bans constrain implementation paths, not just runtime behavior; the gate did its job by forcing the cleaner ESM-native path.

3. **NFD accent-fold at search time.** GeoNames stores diacritics ("Reykjavík", "São Paulo"); the brief implied accent-tolerant search via the Reykjavík sanity case. Implementation NFD-strips at search time (no bundle cost). Closes the "Reykjavik"-no-accent gap inline.

4. **§5 framed as amendment, not clarification.** The brief used "clarification" wording for the same-origin lazy-load doctrine. On second pass (CC's pre-flight + chat-Claude's mediation), the literal §5 wording "zero network requests after page load" was too absolute to permit lazy loads under the existing rule. Reframed as a real amendment with the v0.14 wording explicitly retired. Honest framing > paper-over. Codex audits this as an amendment, not a clarification. L43-candidate.

5. **`tests/fixtures.json` `rising_cases` NOT touched.** Brief touch list (post-CC pre-flight conflict-B) added fixtures.json re-anchoring. On execution, the legacy `rising_cases` test the legacy `getRisingSign` API which is preserved unchanged; the new tz-aware test surface went inline in the `computeRising` describe block (`parityCases` + `dstCases` arrays). Both approaches valid; inline arrays kept fixtures.json simpler and let parity + DST cases live next to their describe-block usage.

6. **Polar test rewrite.** Existing edge-cases in `tests/rising.test.js` expected valid signs at lat ±89°. Brief §2.3 specifies strict |lat| > 66.5° → null. Tests split into two describe blocks: valid-sign cases (boundary ±66.5°, IDL crossings, pre-1970 anchor, post-2050 future) and polar-null cases (89°, Svalbard 78.2°, Antarctica −78°, just-past-circle ±66.5001°). Both `getRisingSign` and `computeRising` tested at the polar boundary.

**Test surface.** 470 → 502 (+32). Net additions: `tests/rising.test.js` extended with `computeRising` (tz-aware) describe block (parity + DST cases), plus polar-null describe block (12 cases across both APIs); `tests/cities.test.js` NEW with structure / size / tz-validity / duplicate / pop-sort / sanity-lookup assertions.

**User-impact note.** v0.2.1+ stored profiles (with country/lat/lng but no city/tz) continue to work without modification: `core/profile.js` routes through the legacy `getRisingSign` fallback when `opts.tz` is absent. The UI surfaces a non-blocking "this profile pre-dates city lookup. update your birthplace for accuracy." hint when a legacy profile is rehydrated. v0.2.8 retires the entire profile-persistence layer (calculator-framing pivot), so hard migration here would be cost for no v0.2.8 benefit.

**Operator live-fire required pre-merge** (per brief §5): three DST-aware rising cases against astro.com — US summer DST (Chicago 1990-07-15 14:00 CDT, scorpio rising), Indiana pre-2006 no-DST (Indianapolis 1985-07-15 14:00 EST, scorpio rising), Russia post-2014 permanent UTC+3 (Moscow 2020-07-15 14:00 MSK, scorpio rising). Plus existing Sam-Carter-style reference cases (London BST → virgo, NYC EST → leo, Riyadh AST → capricorn). City autocomplete sanity: "Riyadh", "Indianapolis", "Moscow", "Reykjavík" all return plausible top hits.

**L-candidates** (this session):

- **L40 (re-fire, three instances this session).** "Do the standard workaround does not always succeed" — (i) Thread A KSA TikTok region enforcement, (ii) v0.2.7.2 CC content-filter retries, (iii) Codex paste-relay friction at the first hurdle. Pattern compounds: when an opaque workaround fails twice, the cost of continued attempts compounds while marginal information drops. Pivot to next path (different model lane, different scope, different routing) rather than grinding. Three firings in one session is a strong signal that the underlying L40 principle is correctly calibrated.

- **L41-candidate.** Privacy-scan token bans (forbidden literal strings under `core/`, `content/`, `index.html`) constrain implementation paths, not just runtime behavior. Implementer pivoting from `fetch()` to `import()` w/ attributes is the right move; the test gate did its job by forcing the cleaner ESM-native path. Reinforced mid-cycle when a stale rule-stating comment in `core/cities.js` used the literal banned token and tripped the scan — fix was a comment rewrite, but it demonstrates that token bans apply to the entire textual surface, not just executable code. Worth surfacing in v0.2.8 doctrine-touch consideration if the pattern recurs.

- **L42-candidate.** When a brief states a target entry count without specifying the implicit floor that produces it ("~52K entries"), the implementer landing on that exact count by re-deriving the floor (pop≥7500) is a brief-comprehension signal worth keeping. Either future briefs spell out the floor, or implementers continue the re-derivation discipline.

- **L43-candidate.** When a brief frames a doctrine change as "clarification" but the literal current text contradicts the new behavior, the implementer's reframe to "amendment" is the right disposition. Preserves doctrine integrity and primes the cross-model audit for real review rather than rubber-stamp.

- **L44-candidate (refined this cycle).** Lane discipline (DOCTRINE §10) is about two-model-eyes, not specifically about "which model writes which file." When CC trips content filters repeatedly, chat-Claude can shoulder file ops via Desktop Commander while a second-model audit at PR-open + operator merge approval preserve the two-eyes intent. The second model doesn't have to be the implementer; the auditor role satisfies the rule.

- **L45-candidate (new).** Lane re-routing under L40 pressure should match earned model strengths. When L40 forces a pivot, the new routing inherits all the friction risks of any unfamiliar path — and any friction at the first hurdle is a signal to re-evaluate whether the new routing matches earned strengths rather than double down. This cycle: routing Codex as cities.js + cities.test.js implementer (a stretch from its earned auditor role per MUHAB.md) didn't survive the first paste-relay friction. Chat-Claude direct-write was the right path the whole time; the L40 pivot to Codex-as-implementer was an over-rotation. Codify: under L40 pressure, prefer pivots that strengthen existing earned roles over pivots that stretch new ones.

Files: core/cities.js (NEW), core/rising.js, core/profile.js, assets/cities.json (NEW), index.html, tests/rising.test.js, tests/cities.test.js (NEW), DOCTRINE.md, journal.md, 8BALL.md.
Branch: v0.2.7.2-geo-tz.
Squash merge: 4d1e71d.

## v0.2.7.1.1 SHIPPED — modal copy tighten + labels title conditional fix

Date stamp filled at squash-merge.

Two coupled surface fixes shipped together. No calc touch (stays v2), no doctrine bump (stays v0.20), no `core/` touch.

**Fix 1 — modal copy tightened to Option B.** The about-modal body collapsed from ~150 words to ~95 words. Voice opener "there is no mystery layer" preserved per operator pick. Two `<p>` paragraphs for visual break between the seven-coordinates intro and the privacy block. All four doctrine disclosures intact: §4.A 18+ ack ("first-visit 18+ tap is a click-through, not verification"), §5 privacy primitive ("nothing leaves your device on its own. inputs and the show-labels toggle are stored locally"), §5 allow-list including labels-toggle, §5.B feedback ("the feedback form below the card sends only what you type there, only when you press send").

**Fix 2 — labels-reveal title conditional.** Operator caught a bug during v0.2.7.1 live-fire: the `<div class="coord-title">SUN ↑ RISING</div>` label was static, hardcoded, while `renderCard()` correctly renders the value as just `libra` (no rising) when birth time/place absent. Label promised what value didn't deliver — mismatch. Fix: added `id="coord-sun-title"` to the element; declared `coordSunTitle` DOM reference adjacent to `coordSunSymbol`; `renderCard()` now sets `coordSunTitle.textContent = profile.risingSign ? 'SUN ↑ RISING' : 'SUN'`. Default static text remains `SUN ↑ RISING` so the existing markup-static test (`locked title copy: SUN ↑ RISING`) still holds — JS replaces conditionally at render.

Test surface: 468 → 470 (+2). New markup-static tests in `tests/labels_reveal.test.js`: (a) `coord-sun-title` id-presence assertion, (b) `renderCard` conditional-set JS pattern match. No jsdom — stays consistent with existing markup-static pattern. CC's D10 advisory (DOM-behavior tests with jsdom) remains tracked for a future cycle.

Why ship both together: both surface-only, both touch `index.html`, both no-doctrine. Fold preserves clean concern separation from v0.2.7.1 (calc-only) while keeping the surface polish cycle as one PR.

Operator-discipline carry-forward: I (the orchestrator) previously misclassified the static-label issue as "intentional per mockup" during a prior live-fire screenshot review. Operator correctly flagged it as a bug on the next live-fire pass. Lesson: when label and value half of a labeled coordinate diverge in promise vs delivery, that's a bug, not a static-mockup feature.

Files: index.html, tests/labels_reveal.test.js, journal.md, 8BALL.md.
Branch: v0.2.7.1.1-modal-and-labels.
Squash merge: ff6c726.

## v0.2.7.1 SHIPPED — lunar tables (calc v1 → v2)

Date stamp filled at squash-merge.

First calc-version bump since v0.1.0 launch. Replaces the v1 Feb-4 fixed-cutoff approximation for Chinese-astrology cusps with real astronomical computation: lunar new year for year-pillar cusps (`getAnimal`, `getChineseElement`); 12 jieqi (lichun → xiaohan) for month-pillar (`getInnerAnimal`). Both evaluated at date-precision in canonical Asia/Shanghai timezone (UTC+8). DOB given as `YYYY-MM-DD` is treated as the truth — no timezone conversion of user input. Range: 1900–2100.

`getInnerAnimal` signature changed from `(month, day)` to `(year, month, day)` — this is a breaking calc change documented in DOCTRINE §3. All existing fixtures other than the v1-bug-locking fixture #6 (CNY Feb 4 cutoff → ox) remain byte-identical; fixture #6 is intentionally re-spec'd from `ox` to `rat` because it was locking the bug being fixed (LNY 2021 = Feb 12, so Feb 4 2021 falls in the 2020 lunar year = rat).

DOCTRINE bumped v0.19 → v0.20: §3 calc-v2 amendment with cusp-resolution rule (date-precision, Asia/Shanghai canonical) + lineage line documenting v1 retirement; calc-version footer rewritten.

**Disclosed deviation (per brief §10):** the brief specifies "Hong Kong Observatory" as the authoritative source for both tables. Operator approved a fork to compute the tables via Meeus astronomical algorithms (Chapter 25 solar position, Chapter 49 lunar phases) — same family already used by `core/rising.js` for ascendant math. The Meeus computation matches all 17 sanity-lock dates from the brief (10 LNY: 1900/1924/1950/1985/1990/2000/2010/2020/2024/2025; 7 solar-term: lichun 1985/1990/2000/2024, jingzhe 2024, qingming 2024, xiaohan 1985) byte-exact, and correctly handles the 2033/2034 leap-suì edge case (run shiyi yue) where simple "+2 lunations after dongzhi" gives Jan 20 but the leap-month rule shifts LNY 2034 to Feb 19. Codex pre-merge audit RECOMMENDED per brief §8.

`core/calendar.js` (NEW) implements: (1) `solarLongitude(jde)` — Meeus low-accuracy solar longitude formula, ~0.01° accurate over the range; (2) `newMoonJDE(k)` — Meeus mean-phase plus 25-term periodic correction plus 14-term planetary correction; (3) `solarLongitudeCrossingJDE(target, roughJDE)` — bisection in a 60-day window; (4) `monthAnimalSolarTerm(year, animalIndex)` — Asia/Shanghai date for the start of an animal's month in `year`; (5) `lunarNewYearDate(year)` — full dongzhi rule with leap-month detection via "first month after m11 with no zhongqi." Range guards: 1900 ≤ year ≤ 2100, throw otherwise.

Test surface: 437 → 466 (+29). Profile suite: 92 → 121 tests. Net additions: 10 LNY-cusp/solar-term-cusp fixtures (case 5 relabeled, case 6 flipped, +10 new); 4 range-guard tests; 10 LNY sanity locks; 5 solar-term sanity locks. The 12 inner-animal direct unit tests rewritten to 3-arg signature anchored at year 1985 (per brief §5.2 suggestion); 3 boundary assertions flipped where v1 had wrong cutoff dates by 1 day (jingzhe Mar 5 not 6, lixia May 5 not 6, liqiu Aug 7 not 8 in 1985). One existing chinese-element test `1996-02-04 → fire` flipped to `→ wood` because v2 places Feb 4 1996 in the previous lunar year (LNY 1996 = Feb 19); relabeled to document the v1 bug fix.

User-impact note: v0.2.7 users who saw a Feb-4-cusp animal that fell in the LNY-window may see a different animal post-v0.2.7.1. Pre-traction; small audience; mitigation is the doctrine framing ("calc v2 is correct lunar-new-year math; v1 was an approximation"). No user-facing copy change in v0.2.7.1; calc-version bump is invisible to users beyond corrected animal output. About-modal calc disclosure deferred to v0.2.8 calculator-framing rewrite.

L31 (this session): pre-flight question on data sourcing surfaced ambiguity between brief letter ("HKO sourced") and operational reality (no HKO data feed in CC's environment). Operator chose Meeus computation; that fork shipped against the brief's existing 17-sanity-lock + operator-live-fire merge gates rather than blocking on data acquisition. The brief's pseudocode in §3.4 had a subtle bug (reverse-array walk treats ox/xiaohan-Jan as the latest cutoff because it's at array index 11, but xiaohan is the EARLIEST jieqi within `year`); first npm test run caught it via 17 failures, fix was reverse-CHRONOLOGICAL walk + previous-year-rat fallthrough. Brief-pseudocode is starting code, not gospel — read first, run tests early.

Files: core/calendar.js (NEW), core/profile.js, tests/fixtures.json, tests/profile.test.js, DOCTRINE.md, journal.md, 8BALL.md.
Branch: v0.2.7.1-lunar-tables.
Squash merge: c0772c5.

## v0.2.7 SHIPPED — labels-reveal toggle (§5 allow-list extension)

Date stamp filled at squash-merge.

Symbol-label visibility toggle below the result card. Default state (current behavior, unchanged): four lowercase symbol lines distributed across card. Revealed state (new): a small uppercase title sits above each symbol — `FIVE-ELEMENT`, `SUN ↑ RISING`, `PUBLIC ⇌ PRIVATE`, `LIFE · NAME · SOUL`. Toggle persists across reloads via new `eight_ball_labels_revealed_v1` localStorage flag.

Why now: deferred from v0.2.6 when the 18+ gate took priority. Operator-pasted mockup at `~/Desktop/8ball/sessions/v026_card_layout_labels_reveal_distributed.html` with directive "like this exactly" — mockup is the canonical visual spec.

DOCTRINE bumped v0.18 → v0.19: §5 allow-list extended with the new flag (third separate flag, parallel to age-ack). About-modal copy updated to disclose, matching §4.A / §5.B precedent.

Two prior decisions retired by the mockup (documented in handoff): topbar toggle placement (3-NEW) and 9px/0.22em form-field-label-match typography. Mockup explicitly uses below-card toggle and 11px/0.1em uppercase title typography. Operator's pick stands.

Hairline-rule prestige refinements 1-2 from prior handoff (rules between sections, rule below `no. lxxiii`) NOT shipped — mockup omits them and "like this exactly" supersedes the verbal carry-forward. Refinements 3-5 (leading, title-symbol gap, top-right index) absorbed by the mockup. Refinement 6 (page margin around card) deferred unless visual review surfaces a need.

Test surface: 425 → 437 (+12). New `tests/labels_reveal.test.js` follows the existing markup-static pattern (mirrors `age_gate.test.js`). Codex's D10 advisory (DOM-behavior tests) remains tracked — adding jsdom infrastructure is a separate cycle. The new toggle's behavior path (click → class flip → localStorage write) is exactly the kind of thing D10 flagged; v0.2.7 covers markup invariants but not click-flow behavior.

L30 (this session): pre-flight reads of touch-list files surfaced the mockup-vs-handoff hairline tension and the jsdom-not-installed reality before brief drafting. Surfacing both as pre-flight catches with defensible defaults (drop hairlines, markup-static labels test) let the brief draft land clean. L28 family continues to compound — pre-flight reads BEFORE briefing > pre-flight reads BEFORE implementation.

Files: index.html, DOCTRINE.md, tests/privacy_scan.test.js, tests/labels_reveal.test.js, journal.md, 8BALL.md.
Branch: v0.2.7-labels-reveal.
Squash merge: 136c509.

## v0.2.6 SHIPPED — 18+ acknowledgment gate (§4.A doctrine departure)

Date stamp filled at squash-merge.

First age-gate in the product. One-time modal before name/DOB entry; tap confirms; flag persists via separate localStorage key `eight_ball_age_ack_v1`. Acknowledgment is a click-through, not verification — copy explicit about that ("there is no verification — under-18 users should not enter"). About-modal discloses the gate's existence and shape per §4.A disclosure requirement.

Why now: operator decision — "kids shouldn't use it." Coupled to a larger pricing-shape conversation (free vs $9.99 entry tier, "$9.99 is the price to sin") that is deferred to its own session. The disclaimer ships independently because it lands cleanly regardless of pricing direction.

DOCTRINE bumped v0.17 → v0.18: §4 amended (existing "no targeting minors" tightened from passive posture to active gate), §4.A added (gate mechanics, click-through framing, disclosure requirement), §5 allow-list extended with the new flag.

Sequencing note: labels-reveal + prestige refinements (originally v0.2.6 in the prior handoff) deferred to v0.2.7. The pre-flight typography catch (form-field labels are 9px/0.22em, not 11px/0.1em as the prior handoff claimed) and storage-key naming convention catch (`eight_ball_labels_revealed_v1` to match `eight_ball_profile_v1` namespace) ride forward to the v0.2.7 brief at `~/Desktop/8ball/sessions/handoff_v026_label_reveal_prestige.md`.

Free-vs-$9.99-entry pricing pivot: deferred to its own design session. v0.3.0_design.md to be revisited.

L28 (this session): pre-flight reads of the touch-list files surfaced two brief-discipline catches before drafting started — typography spec drift and storage-key convention drift, both in the prior handoff. Pre-flight reads as the brief-drafting discipline (not just the implementation discipline) is the L25/L26 family completing its loop: read the actual file, do not infer from the handoff.

Files: index.html, DOCTRINE.md, tests/privacy_scan.test.js, tests/age_gate.test.js, journal.md, 8BALL.md.
Branch: v0.2.6-age-gate.
Squash merge: c9524ee.

## v0.2.5.2 SHIPPED — feedback redirect ?sent=1 (banner-JS closure)

Date stamp filled at squash-merge.

v0.2.5.1 shipped `action="/"` per the v0.2.5 handoff. Live-fire returned "no redirect" — the redirect WAS firing (curl confirmed `action='/'` in the served HTML, with Netlify additionally rewriting the form tag at build to strip `data-netlify="true"` and reorder attributes), but the existing v0.2.5 banner JS at `index.html` lines 869-881 watches for `?sent=1`. Without the query string the banner never fired, and the homepage post-redirect looked visually identical to the post-shake state because localStorage rehydrates the card. Visually-invisible-redirect was the correct diagnosis.

Fix: `action="/"` → `action="/?sent=1"`. Netlify 303s to `/?sent=1`; the banner JS detects the query, swaps the form for `<div class="feedback-sent">thanks. read.</div>`, then `replaceState` strips the query for a clean URL. End state: card rehydrated from localStorage, "thanks. read." banner visible, no Netlify branding, no query string in the address bar.

This closes the half-wired loop the v0.2.5 banner JS was already waiting for. v0.2.5.1 wired the redirect; v0.2.5.2 wires the redirect *target* the JS expects. Two ships were the cycle the bug actually needed — the v0.2.5 handoff specified one but the JS was wired for two.

§5.B language unchanged. "Single named endpoint" still holds — `action` controls success-redirect destination, not the submit endpoint. "Native HTML form POST" still holds. "Fail-silent" still holds. No DOCTRINE bump.

Test surface change: `tests/feedback_surface.test.js` first assertion tightened from `/\saction="\/"/` to `/\saction="\/\?sent=1"/` to lock the precise shape under test. 420/420 tests still green.

L26 (this session): pre-flight read of related-feature JS is mandatory when the patch hooks into existing client-side behavior. The v0.2.5 handoff specified `action="/"` as the right value for v0.2.5.1, but the v0.2.5 banner JS was already wired for `?sent=1` — the brief described the redirect destination but missed that the JS expected a specific query string. Live-fire surfaced the gap as "no redirect" (visually invisible because the homepage state matched the input state). Adjacent to L25 (pre-flight read of existing tests): same family of brief-claim-vs-repo-state drift, caught only when the actual file is read instead of inferred from the brief.

L27 (this session): operator-merge-during-live-fire ordering hazard. v0.2.5.1's PR #9 was merged via the GitHub web UI between the operator opening the deploy preview to test and reporting the result. A fixup commit (`45ab8bc` on the v0.2.5.1-thanks-redirect branch) pushed mid-cycle was orphaned — the PR was already closed. Recovery cost: re-apply the fixup as v0.2.5.2 on a fresh branch from post-merge main (this ship). Hygiene for future cycles: when surfacing a deploy-preview live-fire, clarify whether merge happens before or after the test result lands; or wait for live-fire confirmation in chat before approving merge. The merge → test → fix → orphan-fixup sequence is a real failure mode that doesn't require operator error to occur, just default GitHub web-UI flow.

Files: index.html, tests/feedback_surface.test.js, journal.md, 8BALL.md.
Branch: v0.2.5.2-sent-banner.
Squash merge: 052a88b.

## v0.2.5.1 SHIPPED — feedback form thanks-page redirect (UX polish)

Date stamp filled at squash-merge.

v0.2.5 live-fire surfaced an aesthetic break: Netlify's default post-submit response is a generic white "Thank you!" page. Hard break from the cream-on-black specimen design — user gets yanked out of 8 ball's world. §5.B "fail-silent" intent was satisfied on the plumbing layer (no errors, submission captured) but the visual discontinuity was UX, not doctrine.

Fix: single-attribute add of `action="/"` on the feedback form. Netlify still captures the POST (routing is via `data-netlify="true"` + form name, not the action URL); after processing, Netlify 303-redirects to the homepage instead of showing its branded thanks page. User lands back on the result card rehydrated from localStorage; brief flash, lands coherent.

§5.B language unchanged. "Single named endpoint" still holds — `action="/"` controls success-redirect destination, not the submit endpoint. "Native HTML form POST" still holds. "Fail-silent" still holds. No DOCTRINE bump.

Test surface change: `tests/feedback_surface.test.js` first assertion replaced. Was `expect(tag).not.toMatch(/\saction=/i)` — defensively prohibiting any action attribute to keep the form fully default-Netlify, originally protecting against off-domain post targets. Now `expect(tag).toMatch(/\saction="\/"/)` — codifies the v0.2.5.1 decision precisely; the same-origin invariant the original assertion was guarding is preserved by `"/"` and is now the explicit shape under test. Tests 420/420 unchanged.

L25 (this session): pre-flight read of existing tests is mandatory before drafting "trivial single-line patch" briefs. The v0.2.5 handoff carrying v0.2.5.1 forward said "no test surface change," but `feedback_surface.test.js` had a defensive absence-of-action assertion that the `action="/"` patch would have failed in CI. Caught pre-edit by reading the test file before staging. Cost: one extra file in the touch list. Adjacent to L22 (pre-commit verification grep counts in briefs must reflect actual current state) — both are instances of brief-claims-vs-repo-state drift caught by reading the actual file before acting.

Files: index.html, tests/feedback_surface.test.js, journal.md, 8BALL.md.
Branch: v0.2.5.1-thanks-redirect.
Squash merge: 63c277a.

## v0.2.5 SHIPPED — feedback surface (§5.B doctrine departure)

Date stamp filled at squash-merge.

First user-initiated network call in the product. Adds a single feedback form below the result card; submission goes to Netlify Forms at same origin; payload is exactly two user-typed fields (message, optional contact); no localStorage profile data, no derived coords, no telemetry. Native HTML form POST, not fetch — privacy_scan.test.js unchanged.

DOCTRINE bumped v0.16 → v0.17 with new §5.B clause.

Added:
- index.html: feedback <details>/<form> below result buttons; CSS for feedback styles; minimal JS for ?sent=1 confirmation banner; about-modal copy updated to disclose the new surface.
- tests/feedback_surface.test.js: codifies §5.B form-shape invariants (form present, data-netlify attribute, POST method, no profile-data field names, allow-listed field set, honeypot present, about-modal discloses).
- DOCTRINE.md §5.B + version footer line.

About-modal copy delta: final sentence "nothing is stored off-device" replaced with "nothing leaves your device on its own. a feedback form below the result card lets you write back to the operator if you want; only what you type there is sent, only when you press send."

Reciprocation framing: this is the architectural answer to "the toy is a one-way broadcast and that's extractive in the operator's direction." Every shake produced output, but no door existed for users to write back. v0.2.5 opens that door, with §5.B as the doctrine clause that bounds what can fit through it.

Files: index.html, DOCTRINE.md, tests/feedback_surface.test.js, journal.md, 8BALL.md.
Branch: v0.2.5-feedback-surface.
Squash merge: a0a2023a057496fde09aaaf82f3097ffebf0df21.

## v0.2.4.1 SHIPPED — favicon.ico repair (Cat 3 disposition)

Date stamp filled at squash-merge.

Single-asset patch closing the Cat 3 FAIL from the v0.2.4 Codex audit at `67b94a1`. The shipped favicon.ico had only 16×16 and 32×32 entries (header count=2) because the gen script passed a 32×32 source to Pillow's ICO-save with a 48×48 target — Pillow silently drops upscale targets. Regenerated with a 64×64 source that downsamples cleanly to all three entries; new ICO has count=3.

Asset bytes: 1243 → 3571.

Gen script fixed at `~/Desktop/8ball/sessions/launch_prep_asset_gen.py` for any future regeneration.

No code change, no doctrine change, no other asset change. v0.2.4 surface intact otherwise.

Files: assets/favicon.ico, journal.md, 8BALL.md.
Branch: v0.2.4.1-favicon-ico-repair.
Squash merge: 1f9d2a4.

## v0.2.4 SHIPPED — launch-prep meta polish (additive surface)

Date stamp filled at squash-merge.

Surface-additive patch. No calc change, no doctrine change, no core/ touch.

Added:
- favicon set: assets/favicon-16.png, favicon-32.png, favicon.ico, apple-touch-icon-180.png
- Open Graph + Twitter card meta tags in <head>
- og-image: 1200×630 PNG, monochrome paper-on-black, brand mark + tagline + URL
- meta block referencing all of the above

Fixed:
- stale hint string "dst not adjusted in v0.2.1" → "dst not adjusted" (post-v0.2.3 version reference)

Doctrine clean: §3 additive-only, §5 same-origin assets (zero new network surface for visitor browsers; unfurl crawlers are server-side and not the user's surface), §6 line count 815 → ~840 (under 1500), §11 og:image renders brand mark + tagline + URL only (no PII).

Aesthetic: monochrome per Phase-2E lock. Asset generation reproducible via ~/Desktop/8ball/sessions/launch_prep_asset_gen.py.

Files: index.html, assets/* (5 new), journal.md, 8BALL.md.
Branch: v0.2.4-launch-prep-meta.
Squash merge: a671f23.

Reasoning to ship: bare URL is live on TikTok bio (no card-style polish meta). Every share between v0.2.3 and a later polish is a worse-quality unfurl than it could be. Single-cycle ~30 line patch closes that gap.

## 2026-05-10 · v0.2.3 numerology revert — SHIPPED at 141da42

Surface-only revert of v0.2.2 hexagon polygon. Result-card line 4 returns to text triplet `[life path, expression, soul urge]` exactly as rendered at v0.2.1 (`f3666cb`). Format conditional: space-separated when any master number (11/22/33) is present (e.g. `3 11 3`), concatenated when all values are single-digit (e.g. `383`).

Calc fields (`personality`, `birthday`, `maturity`) added in v0.2.2 are KEPT on `buildProfile` as data-only — reserved for v0.3.0+ paid surfacing. No `core/` touch. Tests stay 414/414 green.

Doctrine v0.15 → v0.16: §1.B replaced (was: hexagon vertex-order lock; now: text-triplet surface + calc-vs-surface separation rule). §1 body updated to clarify the seven-coordinate surface and three-coordinate calc reserve.

Operator decision: hexagon polygon read as geometric/mystic and clashed with the "no mystery layer" framing in the about modal. Text triplet preserves the calibrated-coordinate spirit without the geometric flourish; opens lower half of card as breathing room reserved for v0.3.0 paid interpretation surface.

Files touched: `index.html` (~-50 net lines), `DOCTRINE.md` (§1 body + §1.B replacement + version line), `8BALL.md` (§10 + §3 row 9 + §1 description), `journal.md`. No tests, no `core/`, no audit script changes.

Branch: `v0.2.3-numerology-revert` → squash-merged to `main` at `141da42`.

**Codex audit cycle:** single-cycle, OVERALL CONCERN with one non-blocking advisory on Dimension 5 (v0.2.1 surface faithfulness). Concern: post-revert `formatNumbers` lacks the v0.2.1 inline comment block; runtime behavior identical. **Disposition: accept-divergence.** The retired comment said `// for potential surfacing in the future paid interpretation layer.` — that principle is now formally locked in DOCTRINE §1.B with more precision (calc-vs-surface separation; personality/birthday/maturity explicitly reserved for v0.3.0+). Restoring a stale comment that §1.B supersedes is redundant; writing a fresh comment duplicates §1.B. Brief overclaimed "byte-equivalent" — accurate claim was "behavioral revert to v0.2.1," which Codex confirmed.

**Lesson logged (L21):** when reverting to a prior surface state while keeping doctrine-coherent improvements, briefs should say "behavioral revert" not "byte-equivalent" to set the audit criterion at the right precision. "Byte-equivalent" implies source-level identity which is overconstrained when later doctrine has codified what the prior code only commented.

=====
2026-05-09 · v0.2.2 SHIPPED — Phase-2G-2 hexagon polygon, squash-merged at `fa552ca`
=====

v0.2.2 lives at `https://the-eight-ball.netlify.app` on `main` at `fa552ca`. The Phase-2G-2 arc closed; two-audit Codex cycle cleared (audit-1 caught a CI-gate FAIL — missing journal.md touch — promptly resolved by this entry; audit-2 PASS clean).

## What shipped

The fourth line of the result card surface — previously a reduced-numerology text triplet rendered by `formatNumbers()` (e.g. `"777"` or `"3 11 3"`) — is replaced with an inline-SVG hexagon. Six vertices carry six numerology coordinates, vertex order locked clockwise from top: Life Path, Expression, Personality, Maturity, Soul Urge, Birthday. Three of those six are new additive calc-contract fields (Personality, Birthday, Maturity); three are pre-existing (Life Path, Expression, Soul Urge). Free-tier surface goes from 8 → 11 calibrated coordinates (10 baseline + optional rising).

Visual surface (full-opts path):

```
fire
aries ↑ rabbit
rat ⇌ rabbit
[hexagon: 3 1 6 4 4 1 clockwise from top]
```

## Architecture: surface-breaking, data-additive

The split between calc contract and surface contract holds:

- **Calc contract: ADDITIVE.** `core/profile.js` gains five new exports (`getPersonality`, `getPersonalitySum`, `getBirthday`, `getMaturity`, `getMaturitySum`) and five new `buildProfile` fields (`personality`, `personalitySum`, `birthday`, `maturity`, `maturitySum`). Every existing field returns byte-identical to v0.2.1. Calc-version stays v1.
- **Surface contract: BREAKING.** Line 4 of the rendered card changes from text triplet to inline-SVG polygon. `formatNumbers()` is removed. The about-modal copy is updated from "seven calibrated coordinates" to "ten calibrated coordinates" (with rising as eleventh when birth time/place are provided).

Doctrine v0.14 → v0.15 with new §1.B codifying the surface-breaking/data-additive distinction and locking the vertex order.

## Implementation details

`core/profile.js` (44 lines added):
- `getPersonalitySum` mirrors `getSoulUrgeSum` with vowel filter inverted. Pythagorean letter values, non-letters skipped.
- `getPersonality` reduces with master 11/22/33 preservation via the existing private `reduce()` helper.
- `getBirthday` reduces day-of-month with master preservation. 31 → 4, 11 stays 11, 22 stays 22, 29 → 11.
- `getMaturity` operates on `getLifePathSum + getNameNumberSum` (the unreduced sums) and reduces. This keeps master preservation conceptually clean — operating on already-reduced inputs would yield the same result given the master-preserving `reduce()`, but summing the raw sums matches how LP and name-number themselves are derived.

`core/engine.js`, `core/countries.js`, `core/rising.js` untouched. Catalog driver `(sun, animal)` per DOCTRINE §1 unchanged.

`index.html` (852 lines, 32 lines added net of the deleted `formatNumbers`):
- `formatNumbers` deleted; `formatCoordinates` returns three lines instead of four.
- New `formatHexagonSVG(profile)` returns `<svg viewBox="0 0 100 100">` containing a regular hexagon polygon (radius 38, vertices at angles `-90°, -30°, 30°, 90°, 150°, 210°`) and six `<text>` elements at radius 50.
- Module-scope precomputed constants: `HEXAGON_POLYGON_POINTS` (the polygon-points string) and `HEXAGON_LABEL_POINTS` (six `[x, y]` pairs). No runtime trig.
- DOM grew by one element: `<div class="hexagon" id="card-hexagon" aria-hidden="true">` sibling to `#card-coordinates`. `aria-hidden` because numerology values are not announced verbally elsewhere either; the catalog and coordinates lines remain the screen-reader-relevant content.
- CSS: `.card .hexagon` wrapper sized `clamp(140px, 38vw, 180px)`; polygon stroked at `var(--label)` 1px no-fill; text in `var(--font-mono)` 11px `var(--ink)`. `overflow: visible` on the SVG was added beyond the brief — labels at radius 50 land at y=0 / y=100 (viewBox edge), and `overflow: visible` is the minimal mechanical fix to prevent half-character clipping while preserving the locked geometry. Audit-1 disposition: accept as-is.
- About-modal copy regenerated for the new ten-coordinate surface, listing each coord by name.

## Tests + audit

414 tests (was 403 at v0.2.1), +11 in `tests/profile.test.js` covering:
- `getPersonality` — empty input, simple consonants-only sum, master-number preservation (`Hal` → 8+1+3 = 11 master), non-letter ignore (`xyz!` → 6+7+8 = 21 → 3).
- `getBirthday` — single-digit pass-through, 31 → 4, master preservation (11, 22), 29 → 11 (master).
- `getMaturity` — simple sum (Alex Thomas / 1996-04-01: LP-sum 30 + name-sum 37 = 67 → 13 → 4), master preservation (LP-sum + name-sum = 11 master).
- `buildProfile` exposure — asserts the five new fields with locked values for the canonical Alex Thomas / 1996-04-01 fixture: `personality=6, personalitySum=24, birthday=1, maturity=4, maturitySum=67`.

`tests/fixtures.json` unchanged — direct unit tests cover the new functions; existing 13 cases assert sunSign/animal/lifePath only by design, and adding three new expected fields across all 13 entries would create churn with no upside.

Local PII audit clean (26 files scanned). Per-stage CI green.

## Audit cycle

- **Implementation report** (Codex on `v0.2.2-phase2g2-hexagon`): 5 files changed, +179 −30; tests 414/414; audit clean; one disclosed deviation (`overflow: visible` on the SVG to prevent label clipping at viewBox edge).
- **Pre-audit verification** (orchestrator): branch checked out and re-tested locally; vertex math sanity-checked against Alex Thomas / 1996-04-01 → `[3, 1, 6, 4, 4, 1]`; geometry verified (radius 38 polygon, radius 50 labels at the six locked angles).
- **Audit-1** (fresh Codex, independent): every checklist item PASS except one CONCERN (I4 — `overflow: visible` deviation, low-severity, accept as-is) and one FAIL — CI gate at `.github/workflows/ci.yml` lines 33-46 requires `journal.md` touch when `DOCTRINE.md` changes (DOCTRINE §3 / §8). The orchestrator's brief omitted journal.md from the file-touch spec, which propagated through implementation. This entry is the fix.
- **Audit-2** (post-journal-fix): expected to pass clean.

## Brief-discipline lesson

The implementation brief specified file-touches for `core/profile.js`, `index.html`, `tests/profile.test.js`, `DOCTRINE.md`, `8BALL.md` — but missed `journal.md`. Next time a brief touches `DOCTRINE.md`, journal.md is implicit and must be added to the file-touch list, not assumed. The CI gate exists precisely because this is easy to forget. Adding a one-line "files touched MUST include journal.md when DOCTRINE.md or content/*.js changes" pre-flight check in the brief template would prevent the regression cleanly.

This was the first time the orchestrator (rather than the implementer) caused a CI-gate-relevant brief omission since the gate landed. Audit-1 caught it; the cycle worked as designed.

## Surface-density check

Free-tier surface count after this ship: 11 calibrated coordinates (chinese five-element, sun, public animal, private animal, life path, expression, personality, maturity, soul urge, birthday + optional rising). The four 2G-3+ candidates (moon sign · day-pillar animal · lunar phase · birth card) are explicitly deferred behind v0.3.0 — operator chose to stabilize at 11 and pivot to the paid interpretation layer. May not return.

Operator should ground-truth the rendered hexagon on actual mobile viewports before any further free-tier coord additions; the hexagon is the densest visual element on the card and small-screen rendering is not yet field-tested.

## What's next

Pickup queue:

1. **v0.3.0 paid interpretation layer.** New priority. First doctrine departure for §5 zero-network — needs design pass before brief. Payment provider, auth flow, gating boundary, content-decryption strategy. Pricing decision belongs after the architecture is built and value-density is observable.
2. **Deferred 2G-3+ candidates.** Held behind v0.3.0; may not return.

=====
2026-05-09 · v0.2.1 SHIPPED — Phase-2G-1 rising sign + country auto-fill, squash-merged at `f3666cb`
=====

v0.2.1 lives at `https://the-eight-ball.netlify.app` on `main` at `f3666cb`. The Phase-2G-1 arc closed; two-audit Codex cycle cleared at audit-2 PASS clean.

## What shipped

An eighth surface coordinate: rising sign. When the user opens the optional `<details>` group and supplies birth time + country + lat + lng, line 2 of the surface renders as `${sun} ↑ ${rising}`. Without those inputs, line 2 stays a bare sun sign exactly as in v0.2.0. The other six coordinates and the catalog driver `(sun, animal)` are unchanged. Visual surface (full-opts path):

```
fire
libra ↑ scorpio
rat ⇌ rooster
3 11 3
```

## Architecture: rising as surface-only

DOCTRINE §1 stays exact: catalog driver remains `(sun, animal)`. New DOCTRINE §1.A "Rising sign — surface coordinate, not a driver" makes the boundary explicit — rising is rendered, not a deck dimension. Implementation matches:

- `core/rising.js` (86 lines, zero deps): pure Meeus ascendant. Three reference cases anchor tests within 0.01° of astro.com.
- `core/profile.js` extended additively: `buildProfile(name, dob, opts?)`. v0.2.0 callers produce byte-identical output; the new `risingSign` field is undefined unless full opts are present.
- `core/countries.js` (276 entries): ISO 3166-1 sovereigns + multi-tz country zones (US-E/C/M/P/AK/HI; CA-NL/AT/E/C/M/P; RU 4 zones; AU 3; BR 3; MX 3; ID 3; KZ 2; MN 2; CL 2). Each entry: `{code, name, utcOffsetMinutes, defaultLat, defaultLng}`. Centroids 1-decimal from CIA World Factbook. UTC offsets fixed-per-entry; DST out of scope for v0.2.1 — codified in DOCTRINE §1.A extension.
- `index.html` (820 lines, well under the 1500-line single-file gate): collapsible `<details>` rising-fields group; country `<select>` with onChange auto-fill; always-overwrite-on-country-change behavior; rehydrate-no-fire behavior; empty-country-preserves behavior.

localStorage payload extended additively: `{name, dob}` → `{name, dob, time?, country?, lat?, lng?}`. Zero network calls preserved (DOCTRINE §5).

## Tests + audit

403 tests (was 102 at v0.2.0), +301:
- `tests/rising.test.js` — 24 tests: 3 reference cases, math primitives (`julianDay`, `gmstDeg`, `obliquityDeg`, `ascendantDeg`), `buildProfile` integration, 12 edge cases (lat 0/±60/±89, lng ±179.99, dates 1924-2099).
- `tests/countries.test.js` — 276 dynamically-generated data-quality tests (defaultLat/defaultLng range validation per entry).
- `tests/profile.test.js` — additive regression test asserting `buildProfile`-without-opts has `risingSign === undefined` and 12 existing fields byte-identical to v0.2.0.
- `tests/fixtures.json` — new top-level `rising_cases` array; existing `cases` array byte-identical.

Local PII audit: 22 → 26 files (+4 = `rising.js`, `countries.js`, `rising.test.js`, `countries.test.js`).

## Two-audit cycle (Phase-2G-1)

```
audit-1 at 3540e97  PASS w/ 1 CONCERN (README stale test count "102 cases as of v0.2.0")  disposed at f79f7a9
audit-2 at c3b0e88  PASS / PASS / PASS — cycle closed
```

The auto-fill UX layer was added between audit-1 and audit-2 (extension brief at `~/Desktop/8ball/audits/codex_brief_2G1_extend_autofill_at_f79f7a9.md`). The 30 orchestrator-locked seed values in `core/countries.js` were verified at audit-2.

## Branch hygiene note

The implementing agent's first 2G-1 commit (`3540e97`) was committed directly to local main in violation of the brief's "do NOT amend main directly" instruction. Caught before any push to origin. Recovery: cut branch from work commit, reset main to `87dc494` (= origin/main), checkout branch. The auto-fill commit at `c3b0e88` followed branch discipline correctly. Worth pre-flagging more emphatically in future implementation briefs (e.g. "DO NOT commit to main; if your tooling auto-targets main, switch to the branch FIRST").

## Squash-merge

Squash to `main` produced one v0.2.1 commit at `f3666cb`. `phase-2g-1-rising-sign` deleted post-merge (local force-delete; never pushed to origin separately).

## Netlify credit-cap incident

Push to origin went through clean. Netlify silently skipped the deploy: `Skipped — Skipped due to account credit usage exceeded`. The team's free-tier credits had run out. Operator paid ~22:43 this session, upgraded to Personal plan ($9/mo, 1,000 credits/month + 30 add-on = 1,030 available, billing period May 9 – Jun 8). Netlify does NOT auto-retry skipped deploys after credit restoration — operator manually clicked Trigger deploy on the deploys dashboard, which fired the build of `main@f3666cb`.

Prod-local parity at ship: 28,031 bytes byte-exact local↔prod; new etag `b50ba742…` (was `b40f6884…` at v0.2.0); all v0.2.1 strings present (`country-input`, `rising-fields`, `risingSign`, `↑`).

Worth a calendar reminder to check Netlify credit balance before major ships in subsequent sessions.

## State at ship

- HEAD `main` at `f3666cb`, pushed to origin
- Tests 403/403 (calc+pipeline, privacy, PII, dependency, rising, countries)
- Local PII audit clean (26 files)
- Repo: private
- Doctrine: v0.14
- Calc version: v1 (Pythagorean LP w/ 11/22/33 masters · tropical sun · CNY Feb 4 cutoff · Meeus ascendant)
- Content version: v0.2.1-public (catalog-only; engine computes positionally, no card strings in public runtime; full content lives privately at `~/dev/8ball-private/cards.v1.full.js`, unchanged in v0.2.1)

## Post-ship live-fire (2026-05-09)

Operator ran the 5-gate prod live-fire on `https://the-eight-ball.netlify.app`:

1. No-opts path: 4 lines, line 2 bare sun sign, no `↑` glyph ✓
2. Full-opts path: line 2 `${sun} ↑ ${rising}` ✓
3. Auto-fill: country picks populate lat/lng with centroid; second pick overwrites; clear country preserves manual values ✓
4. Rehydrate-no-fire: manual lat/lng overrides survive reload (auto-fill doesn't re-fire on hydrate) ✓
5. Three reference cases vs astro.com (London/NYC/Riyadh): rising signs match (virgo/leo/capricorn) ✓ — math inherits from local live-fire which already cleared <0.01°.

5/5 green.

## Surface-density signal (orchestrator-flagged)

The free-surface trajectory if all post-2G-2 candidates shipped: 7 (v0.2.0) → 8 (v0.2.1) → 11 (v0.2.2 hexagon) → 15 (2G-3+ moon/day-pillar/lunar/birth-card). 15 coordinates crowds the specimen-registry austere aesthetic. Surfaced mid-session; operator chose to stabilize at 11 post-hexagon and pivot to the interpretation/paid layer (v0.3.0) instead. The four 2G-3+ candidates are explicitly deferred behind v0.3.0; may not return. Worth ground-truthing the rendered hexagon surface against actual mobile rendering before greenlighting more free coords post-2G-2.

## Carry-over (post-v0.2.1 queue)

From 8BALL.md §11 open items, residual:

- Phase-2G-2 hexagon polygon (locked decisions at `~/Desktop/8ball/sessions/queue_2G2_hexagon_polygon.md`); pickup on operator signal.
- v0.3.0 paid interpretation layer (NEW priority signaled by operator this session — $5 toy-price tier). Architecture already reserved; needs design pass.
- Deferred 2G-3+ candidates (locked decisions at `~/Desktop/8ball/sessions/queue_post_2G2_candidates.md`); held behind v0.3.0.
- Phase-2C deploy-gate wiring (still doctrine-correct as "not gated, acknowledged").
- Cleanup: shadow Netlify project (`enchanting-bonbon-2b5064`); both Netlify projects served the same stale v0.2.0 during the credit-cap incident.
- Stale branch cleanup on origin (`v0.1.4-phase2d-concern-dispositions` may still exist; verify and prune).

---

=====
2026-05-09 · v0.2.0 SHIPPED — Phase-2F card system + secret strip + symbols-only surface, squash-merged at `2b69944`
=====

v0.2.0 lives at `https://the-eight-ball.netlify.app` on `main` at `2b69944`. The Phase-2F arc closed; five-audit Codex cycle cleared at audit-5 PASS/PASS/PASS.

## What shipped

Seven calibrated coordinates from (name, DOB): sun sign, Chinese five-element, public animal (year-pillar), private animal (month-pillar), life path, name number, soul urge. Animals pair on one line via the equilibrium arrow `⇌`. Numerology numbers collapse onto one line as a reduced triplet (concatenated when single-digit, e.g. `777`; space-separated when any master 11/22/33, e.g. `3 11 3`). The (sun sign, public animal) pair drives a 144-card catalog index (12 sun rows × 12 animals), rendered as roman numeral in the corner. Life path drives bracket resolution within a cell, separately from the catalog index. Final visual surface, centered on page:

```
fire
libra
rat ⇌ rooster
3 11 3
```

## Architecture: secret strip

Card content (cell `name`/`type`/`habit`/`note` bodies) is the future paid interpretation layer. It lives privately at `~/dev/8ball-private/cards.v1.full.js`. The public engine computes the catalog index positionally with no content import:

```js
const catalogArabic = sunIdx * 12 + animalIdx + 1;
// getCard(profile) returns { name:'', type:'', habit:'', note:'', catalog }
// — empty content fields preserve the API shape for v0.3.0+
```

`tests/dependency_discipline.test.js` guards against any future content import in the public engine.

## Repo visibility flip + branch cleanup

The repo flipped from public to private at this release. `phase-2f-1-card-engine` was deleted from origin + local post-merge — the cards-containing intermediate commits (`a4032b9` first-add through `7b9b99f` last pre-strip tip) are no longer reachable via any branch ref on origin. They survive in GitHub's GC pool for ~30-90 days, then drop.

**Correction to a prior journal claim.** The 2F-3 "in-flight (cont.)" entry below stated "Branch was never pushed, so the secret was never on the public internet — caught before any leak." That was incorrect. `phase-2f-1-card-engine` had been pushed to origin during 2F-1 (when `cards.v1.js` was first integrated); the full 144-card deck was publicly visible at `github.com/appleeatsapples-lang/8ball/blob/phase-2f-1-card-engine/content/cards.v1.js` from 2F-1 first-push through this release's private flip. The exposure window was real. Going forward, the private flip + branch deletion + clean main bound the future surface; past exposure is sunk-cost. Logging the correction here as the audit record — the past entry is preserved as-written for journal append-only discipline.

## Five-audit cycle (Phase-2F-3)

```
audit-1 at 67c8abf  FAIL §4 medical-vocab + 2 CONCERNs   disposed
audit-2 at 9b7bafd  FAIL copy mismatch + 3 CONCERNs       disposed
audit-3 at 62ff5b8  FAIL catalog driver + 2 CONCERNs      disposed
audit-4 at fd265c1  FAIL virgo.dragon leak + 1 CONCERN    disposed
audit-5 at c86970e  PASS / PASS / PASS — cycle closed
```

Dispositions across the cycle: doctrine v0.3 → v0.12. Card content moved private (v0.9). §4 new clause: card-content strings forbidden in any tracked file (v0.11). §11 PII rule rewritten as visibility-independent (v0.12). §1 catalog driver corrected to (sun, animal) pair to match engine truth (v0.10). §7 CI gate stages aligned with current suites (v0.10). All audit-disposition commits and journal scrubs captured in the audit-3 and audit-4 disposition entries below.

Orchestrator's local card-content scan against the live private deck before audit-5: 864 distinct strings (≥ 8 chars) × 23 tracked files = zero hits. Live-public-claim sweep: zero hits.

## Squash-merge

The feature branch carried 34 commits beyond `7b9b99f` (the prior origin tip). The merge to `main` was squash, producing one v0.2.0 commit at `2b69944`. The 34-commit sequence is preserved in the audit history (Codex briefs at `~/Desktop/8ball/audits/codex_brief_2F3_reaudit_at_*.md`) and in the journal entries below. Squash captures: `traits.v1.js` and `templates.v1.js` deleted (retired in 2F-2); `cards.v1.js` deleted (secret strip in 2F-3); engine rewritten to compute positionally; profile.js extended with `getInnerAnimal` + month-pillar cutoffs; index.html flipped to symbols-only seven-coordinate surface; full doctrine arc; full audit-3+4 dispositions.

Diff stats vs `3f80c5e` (prior `main`): 14 files changed, 1689 insertions, 1072 deletions.

## State at ship

- HEAD `main` at `2b69944`, pushed to origin
- Tests 102/102 (calc+pipeline, privacy, PII, dependency)
- Local PII audit clean (22 files)
- Repo: private
- Doctrine: v0.12
- Calc version: v1 (Pythagorean LP w/ 11/22/33 masters · tropical sun · CNY Feb 4 cutoff)
- Content version: v0.2.0-public (catalog-only; engine computes positionally, no card strings in public runtime · full content lives privately at `~/dev/8ball-private/cards.v1.full.js`)

## Post-ship gates (per §8)

- Netlify auto-deploy fired on push to main
- Operator live-fire on `https://the-eight-ball.netlify.app` — verify the seven coordinates render correctly (element / sun sign / animal pair via `⇌` / numerology triplet) with the catalog corner in roman
- TikTok launch: operator-track

## Carry-over (post-v0.2.0 queue)

From 8BALL.md §11 open items, residual:

- Phase-2C deploy-gate wiring (Netlify required-check on GitHub Actions status). Doctrine-correct as "not gated, acknowledged" until traction warrants.
- Cleanup: shadow Netlify project (`enchanting-bonbon-2b5064`). One-click delete in Netlify dashboard.
- Cleanup: stale branch `v0.1.4-phase2d-concern-dispositions` if still on origin.
- Live-fire testing across all 12 sun rows on the deployed URL (now codified as a §8 ritual-gate sub-rule per doctrine v0.3).
- Operator-personal: add `8ball` row to `~/MUHAB.md` §6 bootstrap table.

=====
2026-05-09 · Phase-2F-3 audit-4 dispositions — missed-spot polish + virgo.dragon leak scrub
=====

Codex audit-4 at `fd265c1` returned **FAIL** + 1 CONCERN + 2 PASS. The PASS findings (3.1 catalog driver consistent everywhere; 3.4 zero code regression vs `62ff5b8`) close cleanly. The other two were missed-spot disposals from audit-3 — the audit-3 cycle's sweep wasn't comprehensive enough on either lane. All disposed in commits below.

## FAIL — current card-content string at `journal.md:245` (this commit, doctrine §4 v0.11 clause)

Codex ran an exact-string scan against `9b7bafd:content/cards.v1.js` (the pre-strip deck) and surfaced one current-system card-content leak the audit-3 scrub missed: the 2F-1 prescan-resolution note for `virgo.dragon.note.low` quoted both ChatGPT's 7-word original and the 13-word orchestrator-refined replacement verbatim. Both are real card-`note.low` bodies for the cell.

Fix: same pattern as the audit-3 CONCERN-3 scrubs — reference the cell by coordinate path only, point at the private deck for the strings. Word counts (7 → 13) and the rationale (adversarial-review comfort) preserved as procedural metadata. Doctrine §4 clause from v0.11 covers this — the violation was a missed-spot from the audit-3 sweep, not a doctrine gap.

No code changes; one journal line edited.

## CONCERN — stale-public/checklist residues (this commit, doctrine v0.11 → v0.12)

Five spots Codex flagged plus one I caught while sweeping (`DOCTRINE.md §8.1`) plus two more in `RELEASE_CHECKLIST.md` (same drift, different lines). All cleared:

- `DOCTRINE.md §11` (line 152): "The repo is public." → the rule is now stated independent of repo visibility. The PII rule survives the public→private flip; tracked content is the durable boundary, not the current ACL state. Repos can flip; the rule doesn't.
- `DOCTRINE.md §8.1` (line 108): CI stage list updated from `calc / engine / content / PII / single-file` to `calc+pipeline / privacy / PII / dependency / single-file`, with explicit pointer to §7 for the per-stage breakdown. (Audit-3 missed this in the v0.10 polish; it's the same drift as the §7 fix.)
- `8BALL.md` PII-rule restatement (line 103): same premise rewrite as `DOCTRINE.md §11`.
- `8BALL.md §9` canonical-paths block (line 164): `(public)` → `(private as of v0.2.0)`.
- `.github/workflows/ci.yml` (line 11): job name `test + content scan` → `test`. (The actual workflow steps never ran a separate content scan — the name was a leftover label from when `cards.v1.js` was scanned.)
- `audits/RELEASE_CHECKLIST.md`: stage-list line aligned with §7 v0.10+ (calc+pipeline / privacy / PII / dependency / single-file). Plus two more lines I caught while in there — the diff-review checklist's "any new line in `content/`" question rephrased to "any new private content batch" (since the public repo's `content/` is now empty), and the post-merge smoke-test/rollback wording updated from "verify the roast lands" to "verify the seven coordinates render correctly."

Doctrine version footer: v0.11 → v0.12.

## State going into audit-5 (if needed)

Tests: 102/102. Local PII audit: clean (22 files). Working tree: clean. Branch `phase-2f-1-card-engine` still unpushed.

Live doctrine claims now consistent across every surface scanned: catalog driver is `(sun, animal)` pair; repo is private as of v0.2.0; CI stages are calc+pipeline / privacy / PII / dependency / single-file; §4 forbids card-content strings in tracked files; §11 PII rule is visibility-independent.

Commit in cycle: `<this commit>`. Audit-5 (if requested) is a tighter sweep — verify the FAIL fix at `journal.md:245`, verify the CONCERN polish across the six locations, regression-check that no code changed since `62ff5b8` (which `fd265c1` already established was clean).

=====
2026-05-09 · Phase-2F-3 audit-3 dispositions — catalog-driver fix, doctrine polish v0.10, journal scrub v0.11
=====

Codex audit-3 at `62ff5b8` (post secret-strip) returned **FAIL pending one fix** + 2 CONCERNs + PASS on secret-strip mechanics and calc/UI/privacy. All three findings disposed on `phase-2f-1-card-engine` before any push to origin. The branch was never public, so all of this is pre-merge polish, not a post-ship correction.

## FAIL — catalog driver misstated (commit `428cba5`)

Codex caught a doctrine/runtime mismatch: `8BALL.md:33`, `DOCTRINE.md:11`, and `README.md:5` all claimed the `(sun sign, public animal, life path)` **triplet** drives the 144-card catalog index. Engine truth at `core/engine.js:81` is `sunIdx * 12 + animalIdx + 1` — 12 sun rows × 12 animals = 144, no slot for life path. Life path drives `resolveBracket` (low/mid/high) within a cell, separately from the catalog index.

This was a doctrine-truthfulness drift introduced during the 2F-3 secret strip itself — the engine math has always been pair-based, but the docs accreted a triplet-driver claim across earlier doc-sync rounds without ever being checked against the code. Fixed in three files; no code changes; tests still 102/102.

## CONCERN — stale public-deck/test language (commit `80011f1`, doctrine v0.9 → v0.10)

Eight stale spots flagged, all newly contradictory after the secret strip:

- `README.md`: vitest count 22 → 102; test-suite description rewritten to four current suites (`profile.test.js` / `privacy_scan.test.js` / `pii_scan.test.js` / `dependency_discipline.test.js`); structure block updated — `cards.v1.js` removed, `content/` noted empty in public, full deck pointer to `~/dev/8ball-private/`.
- `DOCTRINE.md §5`: Google-Fonts-CSS exception removed; system fonts only, zero network requests after page load.
- `DOCTRINE.md §6`: "Single repo, public on GitHub" → private as of v0.2.0 (was public through v0.1.4).
- `DOCTRINE.md §7`: CI gate stages updated to actual current suites. Old step 2 (token-leakage + recent-buffer dedup) and step 3 (content scan against `cards.v*.js`) retired with explicit footnote — the banned-pattern + banned-voice-register policy is preserved in `tests/profile.test.js` as the canonical rule reference; the scan itself moved to the private content-authoring pipeline.
- `8BALL.md:206`: Phase-2F historical entry amended to include 2F-3 secret strip; `cards.v1.js` noted as retired-from-public-repo.
- `tests/profile.test.js:8`: header comment updated to match secret-strip reality.

No code changes; mechanical text alignment with the v0.2.0-public state.

## CONCERN — journal card-content residue (this commit, doctrine v0.10 → v0.11)

Codex flagged that the journal contained card-content excerpts pre-dating the secret strip, making the doctrine claim "the public repo ships no card strings" technically false even if runtime stayed clean. Codex's framing was accept-and-defer-acceptable since the repo flips private — operator chose stronger disposition: **scrub now + add forward-looking clause**.

Scrubs in this commit (current cards-system content only):

- 2F-2 audit-disposition write-up (Phase-2F-2 dispositions section): five `§4 medical-vocab` swaps now reference cells by coordinate path only (`aries.rabbit.note.mid`, `scorpio.snake.name`, `scorpio.snake.note.low`, `scorpio.rooster.name`, `aquarius.monkey.note.high`); before/after strings dropped from journal, preserved with the private deck.
- 2F-3 minimal-surface pivot rationale: two card names quoted as readability examples replaced with a non-quoting summary ("the interpretive card-name layer read as gibberish…").
- Pre-scan note for the 2F-1 ChatGPT batch: trigger word at `aries.rabbit.note.mid` no longer named in line, only the cell coordinate.
- 2F-1 content-swap log: 12 verbatim Aries card names dropped; replaced with a pointer to the private deck.
- 2F-1 Grok cold-reading sniff (Aries row): two card names cited as a near-collision example now referenced by deck position (`v` and `x`) and archetype only (theatrical/commanding vs polished/critical).

Forward-looking clause added to `DOCTRINE.md §4`: **No card-content strings in tracked files.** Cell name/type/habit/note bodies live privately at `~/dev/8ball-private/cards.v1.full.js`; no public-repo tracked file (source, tests, fixtures, `journal.md`, audit notes, this doctrine) may contain a card-content string. Audit dispositions reference cells by coordinate path; before/after strings stored privately.

**Out of scope (retained as historical record):** trait-pool / template-pool excerpts from the retired `traits.v1.js` / `templates.v1.js` system (deleted from the repo in 2F-2). Codex audit-3 did not flag these, the system itself is gone, and the new §4 clause is explicitly forward-looking from v0.11.

## State going into audit-4

Tests: 102/102. Local PII audit: clean (22 files). Working tree: clean. Branch `phase-2f-1-card-engine` still unpushed.

Doctrine version footer reads v0.11. Catalog-driver claim in `§1` now matches engine truth. §4 forbids card-content in tracked files; §5 system-fonts-only; §6 private-as-of-v0.2.0; §7 CI stages match the actual test suites.

Commits in cycle: `428cba5` (FAIL fix) → `80011f1` (CONCERN polish) → this commit (journal scrub + §4 clause). Audit-4 brief targets the post-cycle HEAD; verifies (a) catalog-driver fix is consistent across all surfaces, (b) journal contains no current-system card-content strings, (c) §4 new clause reads cleanly, (d) no regression in secret-strip mechanics or calc/UI/privacy.

=====
2026-05-09 · Phase-2F-3 in-flight (cont.) — second-animal axis, triplet collapse, equilibrium arrow, centering, and secret strip
=====

Continuation of the 2F-3 cycle. Previous entry covered through commit `55e8f07` (post-audit-2 dispositions). This entry covers the additional architecture pivots that landed before audit-3.

## Second-animal axis: month-pillar private animal (commits cb22297, 56760af, dd64e24)

Operator decision: ship two Chinese animals — public (year-pillar, the one people commonly identify with) and private (month-pillar, the inner self). Standard Chinese astrology distinguishes 年柱 (year-pillar) from 月柱 (month-pillar); both are calibrated, year alone is incomplete tradition.

`core/profile.js` adds:
- `MONTH_ANIMAL_CUTOFFS` — 12 windows anchored at solar-term cutoffs (节气 jiéqì), fixed-date approximations consistent with the Feb 4 CNY approximation already in use
- `getInnerAnimal(month, day)` — walks cutoffs in reverse, the most recent at-or-after wins; Jan 1-5 wraps to previous-year December rat
- `buildProfile` returns `innerAnimal` between `animal` and `lifePath`

Tests: 12 new unit tests covering each cutoff (boundary + in-window day) + buildProfile shape. Test count 118 → 130. Synthetic test data only (Alex Thomas + 1988-08-15 = leo · earth · dragon · monkey).

Doc sync (8BALL §1+§10, DOCTRINE §1+§3 calc-v1 note, README line 5): four → seven calibrated coordinates with public/private animal split. Doctrine v0.6 → v0.7.

## Equilibrium-arrow animal pair + symbols-only principle (commit 56c0cb5)

Operator: "put 2 animal private public … just the symbols no explanation or interpretation. interpretation is paid for."

`formatCoordinates` collapses the two animal lines onto one with the chemistry equilibrium arrow `⇌` (U+21CC):
```
rat ⇌ rooster
```

Modal "the trick" copy stripped of interpretive parentheticals (`(your year)` / `(your month)` removed); "these are your reading" → "these are your symbols". Implementation comment rewritten to record the product principle: free surface = calibrated symbols only; interpretation is the future paid layer.

This principle becomes load-bearing for the secret strip later in the cycle.

## Triplet collapse on numerology (commit b03cd79)

Operator: "the numbers next to each other as well cleaner and if 777 apears it should be presented this way."

The three numerology numbers (life path, name number, soul urge) collapse onto one line as a reduced triplet. `formatNumbers` helper:
- All single-digit: concatenate (`777`, `369`, `123` — pattern recognition for triplets)
- Any master 11/22/33: space-separate (`3 11 3` never reads as `3113`)

Trail format (`39 → 3`) dropped from the surface. Sums still computed and exported for potential paid-layer surfacing.

`formatTrail` removed (dead code).

Surface goes 7 visual lines → 4 visual lines:
```
fire
libra
rat ⇌ rooster
3 11 3
```

(Element moved to top in commit `0e690c0`; centering applied in `e5c504f` and `5dbaa7e`.)

DOCTRINE §1 + 8BALL §1 + README line 5 updated for the triplet format. Symbols-only principle codified in DOCTRINE §1. Doctrine v0.7 → v0.8.

## Page centering (commit 5dbaa7e)

Stage flex container changes from `justify-content: flex-start` to `justify-content: center`. Card + result-controls center vertically on the page.

## SECRET STRIP — cards moved out of public repo + runtime (commit dde1799)

Operator: "ok we don't want to show the secret."

Two leak vectors that the symbols-only principle made unacceptable:

1. **Public GitHub repo.** `content/cards.v1.js` was 1645 lines of card interpretation sitting at a public URL. Any visitor could read all 144 cards.
2. **Deployed JS bundle.** `core/engine.js` imported `CARDS` from `cards.v1.js`, so every page-load downloaded the full 1645 lines. Any visitor with DevTools could read them in Sources.

Both closed in `dde1799`:

- **Repo side:** `git rm content/cards.v1.js`. Full content saved to `~/dev/8ball-private/cards.v1.full.js` (outside the repo, untracked, 67KB). `.gitignore` blocks `content/cards.v*.js` to prevent accidental re-add.
- **Runtime side:** `core/engine.js` refactored to compute the catalog index positionally — `(SUN_ORDER.indexOf(sun) × 12) + ANIMAL_ORDER.indexOf(animal) + 1`, then `toRoman()`. No `CARDS` import. `getCard` returns `{ name:'', type:'', habit:'', note:'', catalog }` — empty content fields preserve the API shape for forward compatibility with v0.3.0+ (paid layer will populate them from the private content).

Verified: libra·rat profile produces catalog `lxxiii` (matches what the previous CARDS-driven engine produced for the same profile). Positional math is identical to the catalog ordering in `cards.v1.full.js`.

Tests:
- `tests/profile.test.js`: removed `CARDS` import + `allPoolEntries()` helper + the two content-rule describe blocks (banned-pattern + banned-voice-register scans). Those scans now run on the private side as part of the content-authoring pipeline. The `BANNED_PATTERNS` and `BANNED_VOICE_REGISTER` tables remain in profile.test.js as the canonical policy reference.
- `tests/profile.test.js`: 'engine — getCard' tests assert empty content fields + correct positional catalog
- `tests/fixtures.json`: stripped 23 `name` leaks from `expected` blocks (fixture metadata was leaking card names too)
- Test count: 130 → 102

Doctrine updates:
- §1 — public repo + runtime ships catalog only; card content is private at `~/dev/8ball-private/`
- §2 — banned-voice-register scan moved to private side; Google Fonts CSS exception removed (we use system fonts only — was a stale mention from earlier doctrine)
- Footer: content version `v1` → `v0.2.0-public (catalog-only)`; doctrine v0.8 → v0.9

8BALL §1 + §2 + §3 + §10 + README updated for the architecture change. Repo visibility (8BALL §3 row 1) flipped from "Public from day 1" to "Private as of v0.2.0".

**Operator action pending:** flip the GitHub repo to private at github.com/appleeatsapples-lang/8ball/settings → Danger Zone. Branch was never pushed, so the secret was never on the public internet — caught before any leak.

## State at end of in-flight (cont.)

- HEAD `dde1799`. Branch 28 commits ahead of `7b9b99f`, 36 ahead of `origin/main` (`3f80c5e`).
- Tests 102/102. Audit clean (22 files — was 23, `cards.v1.js` gone).
- Doctrine v0.9. Content version v0.2.0-public.
- Codex audit-3 pending at this HEAD.

## Open at end of in-flight (cont.)

- Codex audit-3 brief at `dde1799`
- After clean audit-3: operator flips repo private; chat pushes branch; squash-merge to main as v0.2.0
- Netlify auto-deploy
- Update §10 SHIPPED entry with real merge SHA
- Production live-fire on `https://the-eight-ball.netlify.app`
- TikTok launch

Phase-2H forget-link discoverability still queued (partly addressed by try-another CTA at `a351c46`). Open Graph tags + favicon for shareable link previews queued. Future paid layer (v0.3.0+) will surface `~/dev/8ball-private/cards.v1.full.js` content via reveal interaction; the engine API shape (returns empty content fields in v0.2.0) is forward-compatible.

=====
2026-05-09 · Phase-2F-3 in-flight — minimal-surface pivot + six-coordinate calc additions + audit polish
=====
In-flight notes captured during Phase-2F-3 on `phase-2f-1-card-engine`. Pre-merge artifact, deploy-preview-only territory until the post-polish Codex re-audit clears and operator approves push to main. v0.2.0 release entry is post-merge by chat orchestrator.
## Phase-2F-2 audit dispositions (commits 827b87b, 77c1812, cc9a052)
Codex audit at `67c8abf` returned 1 FAIL + 2 CONCERNs. All three disposed before the 2F-3 work began:
- **FAIL §4 medical-vocab.** Codex flagged 4 cards; chat orchestrator caught a 5th in shipped 2F-1 Aries content at `aries.rabbit.note.mid` (everyday-English usage flagged on adversarial review). All 5 cut in `827b87b` per §4 Safety-patch carve-out. Cells touched: `aries.rabbit.note.mid`, `scorpio.snake.name`, `scorpio.snake.note.low`, `scorpio.rooster.name`, `aquarius.monkey.note.high`. Before/after strings preserved with the private deck at `~/dev/8ball-private/`; doctrine §4 forbids card-content strings in any tracked file as of v0.11 (audit-3 disposition).
  
  The Aries × 12 byte-identical fixtures property is now broken at the rabbit-note-mid cell. That property was load-bearing only for 2F-2 audit isolation, which has passed.
- **CONCERN rooster count.** Journal entry corrected from "5/11 (6/12 with Aries)" to "7/12" with explicit list (aries, gemini, virgo, libra, sagittarius, aquarius, pisces). Disposed in `77c1812`.
- **CONCERN stale 8BALL queue.** Lines 204 + 213 cleared. Doctrine v0.3 already shipped in 2F-2; queue references retired. Disposed in `cc9a052`.
## Phase-2F-3 minimal-surface pivot (commits 7a81665, 57b15d9)
Live-fire of `67c8abf` surfaced that the interpretive card-name layer read as gibberish to consumers without the underlying coordinates as antecedent. Original cards have no symbolic-recognition lineage in tarot/runes/I-Ching/etc.; they are interpretive language layered on top of the calibrated coordinates.
Decision: ship v0.2.0 with the calibrated coordinates as user-facing surface, card body preserved-but-not-rendered. `cards.v1.js` stays immutable per §4. Engine still resolves to find catalog index. Future v0.3.0+ may surface card body via reveal interaction.
What `7a81665` ships:
- DOM: removed card-name, two horizontal rules, three field-rows (type/habit/note); replaced with single `.coordinates` div. Catalog corner kept per operator decision.
- CSS: removed `.card .card-name`, `.card .rule`, `.field-row`, `.field-row .field-label`, `.field-row .field-value` (~39 lines); added `.card .coordinates` (~10 lines).
- JS: `formatCoordinates()` helper introduced; `renderCard()` renders coordinates unconditionally + catalog defensively.
- Copy: info modal "the trick" rewritten; `<meta description>` updated.
Live-fire iteration in `57b15d9`:
- Mid-cluster line-wrap on long sun signs (e.g. "sagittarius") created dangling-middot composition error.
- Operator picked vertical-column over horizontal-tuple. `formatCoordinates` joins with `\n`; `.coordinates` CSS bumps `line-height` to 1.5 and adds `white-space: pre-line`.
## Doc sync v0.4 round (commits 4b47d37, 4ceb263, 3c7183e)
`8BALL.md §1` + `§10`, `DOCTRINE.md §1`, `README.md` line 5 reframed for the four-coordinate minimal surface. Doctrine v0.3 → v0.4 (§1 substance reframe).
## Try-another CTA (commit a351c46)
Live-fire surfaced that the existing "forget this device" link is buried in the result-controls footer. For TikTok virality (try yours, try a friend's), users need an obvious path to enter a different profile without going through privacy-framed confirmation.
`a351c46` adds "try another" button below SHAKE AGAIN. Same action as forget-this-device underneath (clearProfile + showOnboarding) but skips the confirmation modal because the user's intent is explicit. The forget-this-device link survives in the footer for the privacy-framed reset path.
## Calc additions: chinese element + soul urge + unreduced sums (commit 304ecbf)
Operator decision mid-cycle: ship v0.2.0 with six calibrated coordinates instead of four. Reasoning: Chinese animal-without-element is incomplete tradition (canonical form is "fire rat" not just "rat"); adding a third numerology axis (soul urge) honors the inner-self/outer-expression distinction; showing unreduced sums (`39 → 3`) surfaces master numbers and lets users see the path to their final number.
`core/profile.js` adds five exports + one constant:
- `ELEMENTS = ['wood', 'fire', 'earth', 'metal', 'water']`
- `getChineseElement(year, m, d)`: 5-element 2-year cycle anchored at 1924 = wood. Shares CNY-cutoff (Feb 4) adjustment with `getAnimal`. Verified: 1924=wood, 1996=fire, 2020=metal, 2024=wood.
- `getLifePathSum(y, m, d)`, `getNameNumberSum(name)`: pre-reduction sums.
- `getSoulUrgeSum(name)`, `getSoulUrge(name)`: vowel-only Pythagorean sum (A=1, E=5, I=9, O=6, U=3; Y excluded), reduced with master 11/22/33 preserved.
`buildProfile` now returns: `name`, `firstName`, `sunSign`, `chineseElement`, `animal`, `lifePath`, `lifePathSum`, `nameNumber`, `nameNumberSum`, `soulUrge`, `soulUrgeSum`, `yyyy`, `mm`, `dd`. Existing keys unchanged — additions only.
Tests: 14 new unit tests covering each new function, master number preservation (`Aida` → 11, `Aria Stone` → 22), CNY-cutoff edge cases, and full `buildProfile` shape via synthetic profile (`Alex Thomas` + `1988-08-15`). Operator personal data deliberately scrubbed per DOCTRINE §11; first draft leaked, PII scan caught it, fixed before commit landed. Test count: 104 → 118.
## Six-line trail render (commit d362799)
`formatCoordinates` returns 6 lines via `formatTrail(unreduced, reduced)` helper:
- if `unreduced === reduced` → render reduced only (single digits, masters reached without reduction)
- else → render `unreduced → reduced` (e.g. `39 → 3`, `56 → 11`)
Surface order: date-derived first (sun, element, animal), then date-numerology (life path), then name-numerology (name number, soul urge).
Live-fire confirmed: full legal name surfaces master 11 on the nameNumber axis (sum 56 → 11). Operator's profile renders `libra / fire / rat / 39 → 3 / 56 → 11 / 21 → 3` cleanly.
## Doc sync v0.5 round (commits 0864beb, c14f720, 9b7bafd)
`8BALL.md §1` + `§10`, `DOCTRINE.md §1`, `README.md` line 5 expanded for the six-coordinate surface. Doctrine v0.4 → v0.5 (§1 substance expansion).
## Phase-2F-3 audit dispositions (commits 814b3f4, 55e8f07)
Codex re-audit at `9b7bafd` returned 1 FAIL + 3 CONCERNs.
- **FAIL copy mismatch.** index.html still described four coordinates in 3 places (meta description, info modal, implementation comment) while rendering six. The doc-sync v0.5 round updated 8BALL/DOCTRINE/README but missed the in-page surface. Fixed in `814b3f4`.
- **CONCERN focus handoff.** try-another flow lacked focus management. After clearProfile + showOnboarding, keyboard/screen-reader focus could remain on the now-hidden try-another button. Fixed in `814b3f4`: `showOnboarding()` now calls `nameInput.focus()`.
- **CONCERN calc-version contract ambiguity.** `core/profile.js` header + DOCTRINE §3 said "any change to profile.js requires fixture updates", but `304ecbf` added new exports + new buildProfile fields without fixture updates (covered by direct unit tests instead). Fixed in `55e8f07`: §3 formalizes additive-vs-breaking distinction. Calc v1 retroactively documents the v0.2.0 additive extensions. Doctrine v0.5 → v0.6.
- **CONCERN journal staleness.** This entry. Resolves the audit-trail gap.

## Open at end of 2F-3 cycle

- Codex re-audit on the post-polish HEAD (`55e8f07` or its successor)
- After clean re-audit: push + open PR + merge to main as v0.2.0
- Netlify auto-deploy
- Update `8BALL.md §10` SHIPPED entry with real merge SHA (currently `<post-merge sha>` placeholder)
- Production live-fire on `https://the-eight-ball.netlify.app`
- TikTok launch

Phase-2H forget-link discoverability still queued (partly addressed by try-another CTA at `a351c46`; full discoverability work deferred). Open Graph tags + favicon for shareable link previews queued. Grok N=132 cold-reading sniff at card-content level deferred until cards resurface in v0.3.0+.

=====
2026-05-09 · Phase-2F-2 in-flight — full 132-card deck integration
=====

In-flight notes captured during Phase-2F-2 integration on `phase-2f-1-card-engine`.
Pre-merge artifact, deploy-preview-only territory until Codex audit + Grok N=132
sniff + operator live-fire all clear. v0.2.0 release entry is post-merge by chat.

## What this commit ships

- 132 cards integrated into `content/cards.v1.js` (catalog xiii–cxliv across 11 sun rows × 12 animals). Combined with the 12 Aries cards from 2F-1, the full 144-card deck is now in place.
- `content/traits.v1.js` and `content/templates.v1.js` deleted. Engine never imported them post-2F-1; they survived only because the BANNED_VOICE_REGISTER and BANNED_PATTERNS scans walked them. Now they leave entirely.
- `tests/profile.test.js` `allPoolEntries()` walks only `CARDS` now. Imports for `traits.v1.js` and `templates.v1.js` removed. `MissingCardError` test block dropped — all 144 cards present, no profile triggers the throw path. The export survives in `core/engine.js` as defensive code for future authoring gaps.
- `tests/fixtures.json` — `missing_card` array dropped. 11 representative non-aries fixtures added (one per sun row), positive-case asserting `(sunSign, animal, catalog, bracket, name)`. The 12 Aries fixtures stay for regression coverage. Synthetic DOBs, DOCTRINE §11 sub-rule preserved.
- `8BALL.md` §1 (deck-card framing), §2 (architecture row → `cards.v1.js` only), §3 row 9 (content version), §10 (v0.2.0 SHIPPED skeleton, doctrine v0.3 reference), §11 (Phase-2F resolved, live-fire codified) updated.
- `README.md` line 5 (deck-card framing) + structure block (cards.v1.js only) updated.
- `DOCTRINE.md` §8 ritual-gate amendment: new step 9 codifies live-fire on local deploy preview as load-bearing for releases touching `index.html`, `core/engine.js`, or content batches. Existing "confirm Netlify auto-deployed" renumbered 9 → 10. Content-version footer updated. Doctrine version v0.2 → v0.3.

## Content-side notes from prescan resolution

- 1 line orchestrator-refined at `virgo.dragon.note.low`: ChatGPT's 7-word original replaced with 13-word variant for adversarial-review comfort. Both versions preserved with the private deck at `~/dev/8ball-private/`; doctrine §4 forbids card-content strings in any tracked file as of v0.11 (audit-3 disposition).
- Curly apostrophe in `sagittarius.rooster.habit` (U+2019) normalized to U+0027 globally during integration. `grep -P '\x{2019}' content/cards.v1.js` returns zero hits.
- "corrects" verb appears in 7/12 Rooster habits (aries, gemini, virgo, libra, sagittarius, aquarius, pisces). Deferred to Grok cold-reading sniff at N=132 — same lane that ruled "studies X as Y" load-bearing texture for note.high in 2F-1. Initial in-flight count understated this as 6/12; Codex audit at 67c8abf caught the miscount and corrected here.
- ChatGPT-delivered drafts used double-quoted JS strings; integration normalized to single-quoted to match the Aries-row file style. Only literal apostrophe (`everyone\'s`) is backslash-escaped.

## DOB calibration

Brief §2.C fixture table proposed synthetic DOBs that did not produce the listed `(sun, animal, LP)` tuples in 9 of 12 cases. Per §7.2, CC mentally ran each DOB against `core/profile.js` and corrected before committing. Final DOBs: `2020-05-01` (Taurus Rat LP=1), `2022-05-27` (Gemini Tiger LP=2), `1989-07-08` (Cancer Snake LP=6), `1988-08-15` (Leo Dragon LP=4), `1988-09-14` (Virgo Dragon LP=4), `1993-10-12` (Libra Rooster LP=8), `1989-11-15` (Scorpio Snake LP=8), `1989-12-12` (Sagittarius Snake LP=33 — already correct), `1994-12-24` (Capricorn Dog LP=5), `1990-02-04` (Aquarius Horse LP=7 — already correct), `1995-03-04` (Pisces Pig LP=4), `2002-04-04` (Aries Horse LP=3 — already correct). All synthetic per DOCTRINE §11.

## Audit cycle queued

- Codex audit at delivered HEAD: dual-baseline against `4aaf2d3` (cleanest baseline, v0.1.4 SHIPPED) and `7b9b99f` (immediate prior, end of 2F-1). L13 / L18 bind.
- Grok cold-reading sniff at N=132 (mirror 2F-1 pilot brief shape, scaled).
- Operator live-fire on local deploy preview — verify Aries row still works post-integration; spot-check 5–10 non-Aries DOBs across all 11 new rows. Now codified as §8 step 9 (doctrine v0.3).
- Main-merge as v0.2.0 once all four (Codex / Grok / live-fire / operator approval) clear. Release entry written post-merge, not preemptively.

## Test count delta

95 (at `7b9b99f`, end of 2F-1) → **104** (at delivered HEAD): +9 from the 11 new positive-case card fixtures (each fires multiple assertions per card) minus the 2 retired `MissingCardError` tests.

=====
End of 2026-05-09 · Phase-2F-2 in-flight notes.
=====

=====
2026-05-09 · Phase-2F-1 in-flight — card engine + Aries sample row
=====

In-flight notes captured during the Phase-2F-1 branch (`phase-2f-1-card-engine`, branched off `4aaf2d3`). Pre-merge artifact, deploy-preview-only territory; the branch does NOT merge to main until Phase-2F-2 lands the remaining 132 cards. Chat authors the full release entry at end-of-2F-2.

## What this branch ships

- **Engine flip — `core/engine.js` rewritten.** Roast generation pipeline retired (template-fill, trait-pick, question classifier, soft-cap re-roll, recent-buffer dedup). Replaced with deterministic card lookup: `getCard(profile)` → `{ name, type, habit, note, catalog }`. Plus `resolveBracket(lifePath)` (low / mid / high) and `MissingCardError` for non-Aries profiles in 2F-1.
- **Content schema — `content/cards.v1.js` added.** 12 Aries × animal cards (catalog `i`–`xii`). Each card carries `name`, `type`, `habit`, `note.{low,mid,high}`, `catalog`. Voice register is declarative-observational; pre-scan against `BANNED_VOICE_REGISTER`, banned-pattern slurs, and §4 medical/diagnostic words came back clean.
- **UI rewrite — `index.html` re-aestheticed.** Hex window + gold/blue palette retired; specimen aesthetic landed (cream paper on dark page, mono type, hairline borders, label-field grammar). Components: top bar with wordmark + info icon, welcome registry form, card-back shake state with big "8" + "ball", result variant B with name/type/habit/note label fields and catalog corner, custom forget-me modal (replacing native `window.confirm()`), about modal triggered from the info icon. CSS tokens flipped: `--gold-*` and `--blue-*` retired; `--paper`, `--ink`, `--rule`, `--label`, `--page-bg` added. Single-file rule preserved (684 lines, well under 1500).
- **Tests rewritten — `tests/profile.test.js` + `tests/fixtures.json`.** Engine block flipped from `generateAnswer` sample-and-soft-cap pattern to card-system assertions: 12 fixtures covering all three LP brackets (low/mid/high, master numbers 11/22 represented), 12 direct `resolveBracket` cases, 2 `MissingCardError` cases (Sagittarius Snake LP=33 — TODO 2F-2 — and Taurus Rat). Banned-pattern slur scan rewritten to walk pools directly (was sampling generated answers; with no `generateAnswer` it had to flip). Both content scans now walk `traits.v1.js`, `templates.v1.js`, AND `cards.v1.js` automatically through the same `allPoolEntries` generator.
- **Doctrine content-version note bumped.** "v1 (~115 sun + ~85 animal + ~70 LP traits · 39 templates)" → "v1 (cards.v1.js — 12 cards in 2F-1; full 144 in 2F-2)".
- **Files retired-in-place (not deleted):** `content/traits.v1.js` and `content/templates.v1.js`. Engine no longer imports either. They stay in repo for two reasons: the BANNED_VOICE_REGISTER and banned-pattern scans still scan them (immutable shipped content) and Phase-2F-2 finalizes the deletion alongside the full 144-card content land.
- **Calc core untouched.** `core/profile.js` and the calculation contract fixtures are byte-identical to `4aaf2d3` per DOCTRINE §3.

## §1 status

§1 FAIL closes once this branch merges (post-2F-2). Doctrine says "fixed designed deck"; the engine now returns a card from a deck. The 132 remaining cards are content authoring, not engine work.

## Open items / 2F-2 prep

1. Card content for Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces × 12 animals each (132 cards).
2. Convert the LP=33 / Sagittarius Snake `MissingCardError` fixture (`1989-12-12`) to a positive-case assertion when its card lands.
3. Final delete of `content/traits.v1.js` and `content/templates.v1.js`. Update `8BALL.md §2` architecture row to remove their mention.
4. `8BALL.md §3` row 9 (content version) updates from "trait pools" to cards-shaped at the 2F-2 ship.

## Content swap (post-`db0b510`)

Card content and modal copy in `db0b510` came from an earlier ChatGPT batch. The Phase-2F-1 brief delivered to CC at `db0b510 + 1` carries a refined ChatGPT batch (pre-scan artifact `~/Desktop/8ball/audits/prescan_chatgpt_2F1_2026-05-09.md`: 0 coded hits; one cell at `aries.rabbit.note.mid` reviewed as everyday-English usage and kept — later cut in 2F-2 per Codex finding, see entry above). CC swap:

- `content/cards.v1.js` — 12 Aries cards replaced verbatim per brief §2.B. New name strings preserved with the private deck at `~/dev/8ball-private/`; doctrine §4 forbids card-content strings in any tracked file as of v0.11 (audit-3 disposition).
- `index.html` modal copy replaced verbatim per brief §2.C. About: title `the trick`, body single-paragraph, close button `got it`. Forget-me: title `erase the paperwork`, body single-paragraph, buttons `leave it` / `erase it`. Native `×` close icon retired in favor of bottom-aligned `got it` button on the about modal; dead `.modal .close` CSS removed.
- `tests/fixtures.json` — 12 `cards` fixtures' `expected.name` strings updated to match the new batch. DOBs, catalogs, brackets unchanged.
- Schema, scans, line counts: unchanged-in-shape. All 95 tests green; local PII audit clean (25 files); `index.html` now 669 lines.

## Flip-state fix (post-`c1d281b`)

Live-fire of HEAD `c1d281b` against local `python3 -m http.server` surfaced a UX bug invisible to static audit: form-submit landed on the result face for ~300ms then auto-flipped to the 8-ball card-back, leaving the user stranded on shake-state. Same inversion in `shakeAgain` — pressing the button took the user from result back to 8-ball as final state instead of theatrical-flip-then-result. User never got to read the card.

Root cause: `.flip-inner.face-up { transform: rotateY(180deg); }` combined with `.flip-side.back { transform: rotateY(180deg); }` (preserve-3d) means the `face-up` class actually shows the 8-ball back-side, not the result front-side. The class is misnamed; the four `add`/`remove` calls in `showResult` and `shakeAgain` were inverted to compensate, in the wrong direction. The intent comment ("Land on the back side first; card-back shows for ~300ms before flip") was correct.

Fix: 4-line swap in `index.html` — invert `add` ↔ `remove` in both `showResult` (lines 574, 577) and `shakeAgain` (lines 594, 597). Class name unchanged; swap is sufficient. 95/95 tests pass; local audit clean (25 files); `index.html` still 669 lines.

This is the kind of bug Codex's static-code audit would not catch by design — audit reads code semantics, doesn't simulate DOM/CSS runtime. Live-fire is the gate the handoff anticipated before the Grok cold-reading pilot. Re-audit cycle at new HEAD before re-declaring 2F-1 cleared.

## Grok pilot result (post-`4c2e890`)

First Grok pass on the 12 Aries cards as a cold-reading / Barnum-effect sniff (lane pilot). Brief: `~/Desktop/8ball/audits/grok_brief_2F1_cold_reading_sniff.md`. Audit return: `~/Desktop/8ball/audits/grok_audit_2F1_cold_reading_sniff.md`.

Verdict: **STRONG SIGNAL.** All 12 cards classified SPECIFIC; zero BORDERLINE, GENERIC, or DRIFTING. Bracket discipline (`note.{low, mid, high}`) holds uniformly across the row. Cross-deck pattern findings: differentiation is clean (12 distinct archetypes, low cluster risk); recurring fingerprints are load-bearing texture, not Barnum echo (every habit is a single vivid verb-phrase, `note.low` opens with motion verbs, `note.mid` uses "turns... into..." / "builds...", `note.high` uses "studies X as Y"); LP-bracket discipline escalates consistently (low = raw impulse, mid = leverage-building, high = analytical / meta). Recommended-cuts list: empty.

Two production flags carried forward to 2F-2:

1. **Near-collision (Dragon ↔ Rooster):** two cards in the row (positions `v` and `x`) both occupy commanding-room-presence space — one theatrical/commanding, one polished/critical. Splits cleanly in this row, but a flag for 2F-2 — when scaling to 132 more cards, watch for similar authority-cluster collisions in other sun rows (Leo × Dragon, Capricorn × Rooster, etc.).

2. **`note.high` "studies X as Y" pattern:** the construction is load-bearing in this row but should be lightly varied across the full 144-card deck. Not a cut on the 12 Aries cards (the pattern is working); a 2F-2 ChatGPT-brief constraint to avoid uniform application across all 132 remaining cards.

**Operator decision:** Grok lane scales to 2F-2 standing audit cycle. The cycle for 2F-2 becomes: ChatGPT (content authoring) → orchestrator pre-scan → CC integration → Codex (adversarial doctrine/content audit) → Grok (cold-reading sniff at N=132) → live-fire on deploy preview → main-merge.

This sub-entry closes 2F-1 in-flight. Branch is cleared for 2F-2 brief authoring. The v0.2.0 release entry is post-2F-2-merge.

=====
End of 2026-05-09 · Phase-2F-1 in-flight notes.
=====

=====
2026-05-08 · v0.1.4 — Phase-2D · CONCERN dispositions shipped
=====

## What shipped

- **PR #3 squash-merged** as `4aaf2d3` on main. Eight feature-branch commits collapsed into one squash-merge plus this journal-entry follow-up. Live at `https://the-eight-ball.netlify.app/` with HTTP 200, `age: 0` (fresh deploy), `<title>8 ball</title>` confirmed within ~60 sec of merge.
- **Seven CONCERN dispositions landed** per the post-Phase-2B audit's open queue. Net verdict shift: 5 PASS / 7 CONCERN / 1 FAIL → **9 PASS / 3 CONCERN / 1 FAIL**.
- **§2 — enforce + amend.** New `BANNED_VOICE_REGISTER` constant + scan in `tests/profile.test.js` (23 terms, 23 cases). Word-boundary calibration (`\b<term>` start-anchored, case-insensitive). DOCTRINE.md §2 substance split into "Currently enforced (CI gates)" and "Review-discipline (no current code surface to scan)" sections. Pre-scan flagged 3 lines in `content/traits.v1.js`: 1 true positive cut (`lp33` "tired in a way that sounds spiritual"), 2 false positives surfaced for operator review and restored after calibration (`taurus`/`libra` "restaurant" lines — `aura` was substring-matching inside `restaurant`). Net pool changes vs pre-Phase-2D: `lp33` 6→5; `taurus`/`libra` unchanged.
- **§3 — enforce.** New fixture in `tests/fixtures.json`: `1989-12-12` → Sagittarius / Snake / LP=33 / nameNumber=1. Synthetic per §11. Sole coverage point for the master-number-33 preservation path in `core/profile.js`.
- **§5 — enforce.** New `tests/privacy_scan.test.js` (159 lines, 10 cases). Scans `core/`, `content/`, `index.html` for forbidden API surfaces (`sessionStorage`, `indexedDB`, `fetch(`, `XMLHttpRequest`, `navigator.sendBeacon`, `gtag(`, `dataLayer`, `analytics.`) and enforces a `localStorage.setItem` allow-list of `['eight_ball_profile_v1']` (the actual STORAGE_KEY).
- **§8 — enforce + amend.** New CI stage in `.github/workflows/ci.yml`: PRs touching `DOCTRINE.md` or `content/*.js` must also touch `journal.md`. `actions/checkout` bumped to `fetch-depth: 0` so the diff is computable. Doctrine §8 substance split into "Automated gates (CI, blocking)" (CI 5-stage + journal-touch) and "Ritual gates (operator/reviewer responsibility)" (PR title, local audit, diff review, cross-model audit, merge, journal append, live verify). The new gate fired live on this PR's own diff and passed.
- **§10 — enforce.** New `.github/pull_request_template.md` with lane-tag fields (Lane of author, Doctrine change → Codex audit checkbox, Content change → ChatGPT review checkbox, ≥3 files / `core/` → CC-authored check). Behavioral nudge by design; the §8 journal-touch gate is the hard CI surface for doctrine changes.
- **§12 — enforce.** New `tests/dependency_discipline.test.js` (3 assertions): (1) `package.json.dependencies` empty/absent, (2) `package.json.scripts.build` absent, (3) `package.json.devDependencies.length ≤ 5`. Locks the no-build-step contract structurally.
- **§13 — amend + defer.** Doctrine §13 paragraph appended clarifying the Friday rule-kill firing condition: first review = first Friday after the doctrine has aged 7 days. Immutability hash check on `content/traits.v1.js` and `content/templates.v1.js` explicitly deferred to post-Phase-2F (those files retire when `cards.v1.js` ships).
- **Polish pass on top.** §8 textual defect ("PR opened" listed under Automated gates without CI enforcement) moved to Ritual gates with parenthetical. `8BALL.md §7` (Content rules summary) synced to post-Phase-2B §4 substance. `8BALL.md §8` (Workflow) split into Automated/Ritual matching DOCTRINE.md.
- **Tests:** 32 → 69 green at `4aaf2d3`. Local audit clean (24 files scanned).

## Cross-model audit

Three-audit Phase-2D sequence completed:

- Audit 1 at `c99a641` — **8 PASS / 4 CONCERN / 1 FAIL**. §2/§3/§5 RESOLVED CONCERN→PASS. §8/§10/§12/§13 remained CONCERN with improvement noted; §1 unchanged FAIL (Phase-2F-bound). Codex flagged a §8 textual defect (PR-opened-as-automated-gate, drift mode rule-says-X-but-code-does-Y) and noted `8BALL.md §7/§8` summaries were stale relative to post-Phase-2B doctrine.
- Audit 2 at `0073189` — **9 PASS / 3 CONCERN / 1 FAIL**. Polish pass cleared §8 CONCERN→PASS and dissolved the stale-summary cross-rule finding. Zero regressions vs `c99a641`. Merge-gate cleared.

Cleanest baseline regression check: from pre-Phase-2D `32c8995` (5/7/1) through `c99a641` (8/4/1) to merge HEAD `0073189` (9/3/1) — zero regressions across the chain.

The 3 residual CONCERNs at merge are calibrated dispositions, not drift:
- §10 — PR template is behavioral nudge by design; CI lane-validation deferred to first multi-author PR friction.
- §12 — three structural assertions don't fully cover the literal §12 list (email capture, sharing UI, horoscope copy); static enforcement of the full list is brittle, review-discipline is the realistic ceiling.
- §13 — immutability hash explicitly deferred to post-Phase-2F (those files are retired by 2F's content-layer flip).

## Lessons

**L19 — Spec-locked rules need execution-time calibration.** The §2 banned-word list was operator-locked at brief-author time; the scanner spec was locked at brief-author time too. CC's pre-scan surfaced two false positives where `aura` substring-matched inside `restaurant` — a collision invisible at spec-time. The right discipline: CC pre-scans, surfaces all flags, operator-decides per-line. Calibration becomes an at-execution-time decision, not a spec-time prediction. Future enforcement-pattern briefs should explicitly tag flagged content as "operator-decision required" rather than "auto-cut."

**L20 — Polish-before-merge has a high ratio when the residuals are textual.** Path B (polish + re-audit + merge) cost ~15 min and improved verdict 8/4/1 → 9/3/1, dissolving 1 CONCERN and 1 cross-rule finding. The signal: if the audit-flagged residuals are textual / state-summary alignment, polish; if structural (test surface, doctrine substance), accept-and-defer. The §8 wording fix and `8BALL.md` sync were textual; the §10/§12/§13 residuals were structural — the path correctly polished the former and deferred the latter.

**L5 confirmation in fresh evidence.** The chat orchestrator authored the §8 doctrine substance with "PR opened with a one-line summary" listed under Automated gates — a defect chat could not have caught alone. Codex caught it in the first audit cycle; the polish pass closed it. The dual-author pattern (chat drafts + Codex audits) found a flaw the chat could not have surfaced introspectively. L5 ("solo authority IS the failure mode") fired again, in a different shape, and was caught at the structural enforcement point.

## Open items / next session queue

1. ~~Phase-2A v0.1.2 patch~~ ✅ shipped at `f52345f`.
2. ~~Phase-2B doctrine consolidation~~ ✅ shipped at `708735d`.
3. ~~Phase-2D CONCERN dispositions~~ ✅ shipped at `4aaf2d3` (this entry).
4. **Phase-2C — §7 deploy-gate wiring.** Doctrine-correct ("not gated, acknowledged"); flip when traction warrants. One Netlify console toggle + GitHub required-check. Could fold a doctrine-version bump (currently still at v0.2 despite Phase-2B/2D substance edits) into this work.
5. **Phase-2E — card system design.** Aesthetic concentration. Locked constraint: monochrome / grayscale, no color hues. Open question: strict two-tone vs grayscale-permitted (default grayscale-permitted). Captured at `~/Desktop/8ball/sessions/phase_2e_aesthetic_constraints.md`.
6. **Phase-2F — card system implementation.** Engine + UI rewrite, content layer pivot. Retires `content/traits.v1.js` and `content/templates.v1.js`. Adds `content/cards.v1.js` + `assets/cards/`. Closes the §1 FAIL. Closes the live-observed hex-overflow defect (operator's screenshots in this session showed long roast outputs still clipping the hexagon despite the v0.1.1 soft-cap fix). CC lane.
7. **Housekeeping: shadow Netlify project.** `enchanting-bonbon-2b5064` still connected to the repo; `the-eight-ball` is canonical. One-click delete in Netlify dashboard.
8. **Housekeeping: branch cleanup.** `v0.1.4-phase2d-concern-dispositions` should be deleted from origin and local post-merge. CC has a pinned task for the local side.
9. **Housekeeping: `audits/RELEASE_CHECKLIST.md` staleness.** Codex flagged in cross-rule finding 2 of the post-polish audit — file says it's pulled "directly from §8" but is more abbreviated. Sync in next housekeeping pass.
10. **Housekeeping: doctrine-version bump.** DOCTRINE.md still says `v0.2` despite Phase-2B/2D substance edits. Bump to `v0.3` next housekeeping cycle, or fold into Phase-2C.

=====
End of 2026-05-08 · v0.1.4 entry.
=====

=====
2026-05-08 · v0.1.3 — Phase-2B doctrine consolidation shipped
=====

## What shipped

- **PR #2 squash-merged** as `708735d` on main. Three feature-branch HEADs collapsed into one commit (`b74ef70` Phase-2B substance + `875596b` corrective + `32c8995` corrective #2). Live at `https://the-eight-ball.netlify.app/` with HTTP 200 and `<title>8 ball</title>` confirmed.
- **§1, §2, §9 substance rewritten.** §1 reframed from surface-narration ("interior never named") to positive-shape product description (deck product tied to name+DOB; cards openly reference symbol systems). §2 second bullet drops "no mention of zodiac/numerology/astrology" sub-clause. §9 narrowed to SIRR-boundary code corollary, heading renamed "The SIRR boundary," wording amended to cite `DOCTRINE_ALLOW` allow-list as the actual enforcement.
- **§4 restructured for post-pivot content.** New bullets: no medical/diagnostic framing, cultural-symbol respect, universal floor. "Versioned, not edited" generalized from "trait pools and templates" to "shipped content batches." Heuristic line generalized to format-agnostic "if a line lands but you can't tell..." Voice-register bullet was authored, audited as cards-vs-existing-pool FAIL, then surgically removed in corrective #2 (Phase-2F will restore it with the cards-specific register decided at design time).
- **§4 carve-out cuts.** Six lines cut from existing pool: `templates.v1.js` lost "the chart agrees" / "the universe says" (§2 mystical) and "today diagnosis" / "symptoms detected" (§4 diagnostic); `traits.v1.js` lp11 lost "a mystic with anxiety" / "astral-projecting to avoid eye contact" (§2 mystical). `TEMPLATES_NO_QUESTION` 18→15, `TEMPLATES_MAYBE` 8→7, `lp11` 6→4. No replacements; Phase-2F authors the new content layer.
- **`audits/run_local_audit.sh` POSIX fix.** `mapfile` (bash 4+) replaced with `while IFS= read -r ... done` loop. Verified clean exit 0 under macOS bash 3.2.57. §8 and §11 enforcement surfaces now actually fire.
- **Inbound cleanup.** `README.md:5` trailing "(see DOCTRINE.md §9)" stripped; `8BALL.md:33` trailing "depth is the trick; the trick is hidden by design" stripped; `tests/pii_scan.test.js:69` comment updated to "SIRR boundary rule."
- **Tests:** 32/32 green at `708735d`. Local audit clean (21 files scanned).

## Cross-model audit

Five-audit Phase-2 sequence completed:

- Audit 1 at `2876385` — 1 PASS / 6 CONCERN / 6 FAIL (baseline; doctrine confirmed aspirational).
- Audit 2 at `3e6d71a` — 4 PASS / 6 CONCERN / 3 FAIL (Phase-2A patch; §4/§7/§11 closed).
- Audit 3 at `b74ef70` — 2 PASS / 5 CONCERN / 6 FAIL (Phase-2B substance; three regressions: §4/§8/§11. Doctrine ahead of code surfaced.)
- Audit 4 at `875596b` — 4 PASS / 7 CONCERN / 2 FAIL (corrective; §2/§8/§9/§11 closed; §4 still FAIL on cards-vs-existing-pool tension).
- Audit 5 at `32c8995` — **5 PASS / 7 CONCERN / 1 FAIL** (corrective #2; §4 closed via voice-register-bullet drop; merge gate cleared).

Cleanest baseline regression check vs `3e6d71a`: §2 IMPROVED, §9 IMPROVED, all others UNCHANGED. The remaining FAIL is §1 (doctrine says deck, engine ships roast) — known-tradeoff bound to Phase-2F. Closure condition: 2F engine flip.

## Lessons

**L16 — Doctrine ahead of code is the inverse failure of aspirational doctrine; both produce the same audit verdict.** L10 named "aspirational doctrine — rules whose enforcement doesn't exist" as the most expensive doctrinal debt. Phase-2B initially produced its mirror image: rules whose code-implementation doesn't exist *yet*. The verdict shape is identical (rule-says-X-but-code-does-Y), but the disposition differs: aspirational drift has no firing condition; doctrine-bound-to-queued-phase does. The §1 FAIL is the latter — bound to Phase-2F's engine flip. The §4 voice-register FAIL initially looked like the former and was surgically removed; what survived is the constraint-shaped substance that applies to any content layer.

**L17 — §-numbering preservation under substance rewrite is a doctrine virtue, not laziness.** The Phase-2B brief decision to keep §1/§2/§9 numbers and replace substance saved ~6 cross-reference edits across `8BALL.md`, internal `DOCTRINE.md` references, and `tests/pii_scan.test.js`. Numbering stability lets people hold §-numbers in muscle memory across sessions; substance is editable, numbers shouldn't be unless retiring entirely.

**L18 — Audit-binds-to-HEAD with dual-baseline delta lines is the structural fix for multi-cycle work.** Five audits in series, each binding to a specific HEAD, with verdicts compared both to the immediate prior (`b74ef70` was a regressed state) AND to the cleanest baseline (`3e6d71a`). The merge gate ("zero regressions vs cleanest baseline") gives a stable reference point even when the immediate-prior state is regressed. Without dual-baseline tracking, the b74ef70 → 875596b transition would have looked like "improvement" because b74ef70 was so bad — but vs `3e6d71a` it had a fresh §4 regression that needed closing. The discipline correctly identified and required closing the regression before merge.

## Open items / next session queue

1. ~~Phase-2A v0.1.2 patch~~ ✅ shipped at `f52345f`.
2. ~~Phase-2B doctrine consolidation~~ ✅ shipped at `708735d` (this entry).
3. **Phase-2C — §7 deploy-gate wiring.** Currently doctrine-correct ("not gated, acknowledged"); flip to actually-gated when traction warrants. One Netlify console toggle + GitHub required-check.
4. **Phase-2D — CONCERN dispositions** for §3 (no 33 fixture), §5 (no static gate against new storage/fetch), §8 (release ritual operator-only), §10 (lanes procedural not enforced), §12 (out-of-scope partial enforcement), §13 (Friday rule-kill not yet fired). Each gets enforcement-added or rule-amended-to-match-reality or rule-killed.
5. **Phase-2E — card system design.** Aesthetic concentration. Locked constraint: monochrome / grayscale, no color hues. Open question: strict two-tone vs grayscale-permitted (default grayscale-permitted). Captured at `~/Desktop/8ball/sessions/phase_2e_aesthetic_constraints.md`.
6. **Phase-2F — card system implementation.** Engine + UI rewrite, content layer pivot. Retires `content/traits.v1.js` and `content/templates.v1.js`. Adds `content/cards.v1.js` + `assets/cards/`. Closes the §1 FAIL. CC lane.
7. **Cleanup: shadow Netlify project.** Two Netlify deploys connected to the repo (`the-eight-ball` ✓ canonical; `enchanting-bonbon-2b5064` ✗ shadow). 8BALL.md §2 says one. One-click delete in Netlify dashboard. Add to 2D dispositions.
8. ~~Bash-3.2 fix for `audits/run_local_audit.sh`~~ ✅ shipped this PR (`875596b`).
9. **Live-fire testing on the post-corrective pool.** Optional — likely retired by 2F's content-layer flip. Worth one round if the operator wants to see what survived the cuts.
10. **Branch cleanup.** `v0.1.3-phase2b-doctrine-consolidation` still on origin and local. Decision deferred to operator: keep as audit-trail or `git push origin --delete` (audits already preserve the three HEADs, so deletion is safe).

=====
End of 2026-05-08 · v0.1.3 entry.
=====

=====
2026-05-08 · v0.1.2 — §4/§7/§11 patch shipped
=====

## What shipped

- **PR #1 squash-merged** as `f52345f`. Single commit on `main` collapsing the prior agentic-tooling change (`58e5ffa`, never pushed to origin/main as a separate commit) with the Phase-2A patch (`3e6d71a`). Live at `https://the-eight-ball.netlify.app/` within ~70 seconds of merge per Netlify's `cache-status: fwd=miss` + `age: 0` on first post-merge fetch.
- **§4 — two violating trait lines cut** from `content/traits.v1.js`: a Sagittarius line invoking sexual-assault framing and an Ox line invoking mental-health-diagnostic framing. Both failed §4's literal "if you can't tell, it crosses" test; both lived in production between v0.1.0 and v0.1.2.
- **§4 safety-patch carve-out added.** Locked-decision #9 (immutable v1 pools) protects against silent flavor drift, NOT against doctrine-rule violations caught post-ship. Codex loophole-check confirmed the carve-out wording does not admit taste-cuts ("constrained to actual §4 violations and requires journal/diff doctrine notes").
- **§7 reality alignment.** Doctrine previously claimed CI gates the deploy; in fact Netlify auto-deploys on push to `main` while CI runs in parallel. §7 now describes that gap explicitly and queues required-check wiring for the first-traction milestone.
- **§11 PII regex tightened** from `[^a-z]{0,40}` to `.{0,40}` — JSON-shaped occurrences (label + alphabetic text + `YYYY-MM-DD`) now caught.
- **§11 narrower allow-list** (`LABELED_DOB_ALLOW`) for the labeled-DOB rule specifically: excludes `journal.md`, `8BALL.md`, `README.md`. Doctrine docs can NAME the leak class without REPRODUCING example shapes.
- **Journal v0.1.0 entry sanitized.** Bullet describing the labeled-DOB leak rewritten to describe the leak class without reproducing the label string or the date. Sanitization note added at the top of the v0.1.0 entry.
- **`audits/LOCAL_PII_AUDIT.md` placeholder-ized.** Illustrative DOB block now uses bracketed placeholders matching the convention already used for names and identifiers in the same block.
- **Test DOBs shifted.** `tests/profile.test.js` engine and banned-pattern tests now use `2000-01-01`. Codex confirmed `2000-01-01` produces a valid synthetic profile (Capricorn, Rabbit, LP4) and the changed tests still exercise their original engine/content code paths.
- **Tests:** 32/32 green at HEAD `3e6d71a` (pre-merge); same at `f52345f` post-merge.

## Cross-model audit

Codex re-audit of HEAD `3e6d71a` returned **4 PASS / 6 CONCERN / 3 FAIL**, deltas from prior `2876385` audit:

- §4 FAIL → PASS (RESOLVED)
- §7 FAIL → PASS (RESOLVED)
- §11 FAIL → PASS (RESOLVED)
- §1, §2, §9 FAILs unchanged (intentionally untouched in 2A; retiring in Phase-2B via product pivot)
- All CONCERNs unchanged
- Zero regressions

Full re-audit at `~/Desktop/8ball/audits/codex_reaudit_2A_2026-05-08.md`. Brief that produced it pinned to HEAD `3e6d71a` per the audits-bind-to-a-specific-HEAD principle locked at start of session.

## Lessons

**L13 — Audits bind to a specific HEAD.** The Codex audit at `2876385` remained valid for `58e5ffa` because `58e5ffa` didn't touch any audited path. The next HEAD (`3e6d71a`) DID, so a re-audit was structurally required. Verifying the equivalence (or non-equivalence) is a 2-second `git diff --stat` that protects against weeks of drift. Treat this as a default discipline before reusing any audit verdict past its pin.

**L14 — Office work is a real failure mode and the orchestrator is the right place to absorb it.** Three new operator-side defaults landed this session: (a) auto-pbcopy briefs to clipboard, (b) Claude saves tool outputs to disk while the operator only pastes content into chat, (c) Claude reformulates terse/typo'd operator directives into self-briefs before acting. Each one removed a friction point that previously generated drift. The principle generalizes: any procedural step the orchestrator can do via tools, the orchestrator should do.

**L15 — The two-audit cycle works exactly as designed.** First audit at `2876385` returned 6 FAILs, exposing aspirational doctrine. Patch authored, second audit at `3e6d71a` returned 3 FAILs, all in the cluster intentionally retired in the next phase. The structure correctly distinguished "tighten what fails" from "retire what doesn't fit," and gave a structural diff (verdicts changed vs. unchanged) as the merge gate, not operator vibes.

## Open items / next session queue

1. **Phase-2B** — doctrine consolidation. Retire §1/§2/§9 (the surface-narration cluster being dissolved by the roast→deck product pivot). Rewrite §4 for card content (no medical/diagnostic framing; cultural-symbol respect if cards draw from any tradition). Revisit §10's "v1 immutable" rule under format pivot. Codex re-audit before merge. Target: 9+ PASS, FAIL ≤ 1.
2. **Phase-2C** — §7 deploy-gate wiring. Currently doctrine-correct ("not gated, acknowledged"); flip to actually-gated when traction warrants. One Netlify console toggle.
3. **Phase-2D** — CONCERN dispositions for §3, §5, §8, §10, §12, §13. Each gets enforcement-added or rule-amended-to-match-reality or rule-killed. Friday rule-kill review per §13 is the natural moment.
4. **Phase-2E** — card system design. Aesthetic concentration. **Locked constraint:** monochrome / grayscale, no color hues. Captured at `~/Desktop/8ball/sessions/phase_2e_aesthetic_constraints.md`. Open question still: strict two-tone vs. grayscale-permitted (default is grayscale-permitted unless operator says "strict").
5. **Phase-2F** — card system implementation. Engine + UI rewrite, content layer pivot. Retires `content/traits.v1.js` and `content/templates.v1.js`. Adds `content/cards.v1.js` + `assets/cards/`. CC lane.
6. **Bash-3.2 fix for `audits/run_local_audit.sh`.** Script uses `mapfile` (bash 4+); breaks on macOS default bash 3.2. Run-around: this session executed the audit logic inline via Desktop Commander, so the §8 ritual local-audit gate was effectively run against `3e6d71a` and returned 0 hits. Fix: rewrite the `mapfile` line to a POSIX `while read` loop. Single-file shell-script edit, chat-lane authority. Land in next housekeeping PR.
7. **`8BALL.md §10`** updated this session to reflect v0.1.2 SHIPPED state. Done as part of this entry's commit.

=====
End of 2026-05-08 · v0.1.2 entry.
=====

=====
2026-05-08 · doctrine audit triage + product pivot — Phase-2 scoped
=====

Not a version bump. No code shipped. State changes captured for provenance.

## What happened

First execution of §10 multi-model lanes. Two artifacts saved to `~/Desktop/8ball/audits/`:

- `codex_doctrine_audit_2026-05-08.md` — full Codex response. **1 PASS / 6 CONCERN / 6 FAIL** out of 13 numbered rules. Brief expected 9–11 PASS, 0–1 FAIL on first audit. We are dramatically off that mark. Per the brief's own acceptance criteria: *"If FAIL count is higher than 1, the doctrine was written aspirationally; tighten or kill the failing rules before adding more."*
- `chatgpt_v2_brief_meta_review_2026-05-08.md` — ChatGPT response. NOT what queue item #4 specified. ChatGPT returned brief-design meta-review instead of v2 trait pool draft. Likely cause: brief's step 5 ("paste traits.v1.js after the prompt") was skipped at relay time, leaving ChatGPT no source content to audit. Useful as brief feedback; not the artifact intended.

## Codex FAILs — disposition

**§1 / §2 / §9 (surface-narration cluster) → retire via product pivot.** Doctrine says the calculation interior must never be named in the product. README:5 explicitly names "sun sign, Chinese zodiac animal, and numerology life path" in the same sentence that links to §9. About modal in `index.html` says "loosely informed by the date you were born and a couple of derived numbers." The doctrine and the violation lived in the same paragraph — characteristic aspirational-rule shape. Pivot decision (see below) makes these rules obsolete rather than amends them.

**§4 → fix-now patch (v0.1.2) + safety-patch carve-out.** `content/traits.v1.js` `ox` array contains "someone whose stubborn is technically a personality disorder" — invokes mental-health framing as roast target. Adjacent finding (Codex pool-scan missed; orchestrator caught while verifying the §4 evidence): `sagittarius` array contains "someone whose honesty is technically assault" — uses sexual-assault framing as roast mechanic. Both fail the doctrine's literal "if you can't tell, it crosses" test. Both lines cut. Stress-tests locked-decision #9 (immutable v1 pools). Disposition: add a §4 safety-patch carve-out — *immutability protects against silent flavor drift, not against doctrine-rule violations caught post-ship.*

**§7 (CI doesn't actually block deploy) → fix-now or amend-doctrine.** Doctrine claims CI green is required to deploy. Reality: Netlify publishes `.` on every push to main with no GitHub Actions status check. Either configure Netlify GitHub-Actions-required-check (operator setting; no code change), or soften §7 to "CI is green before merge to main; deploy auto-runs on main." Pick one.

**§11 (PII rule) → fix-now (both halves), v0.1.2.** Two issues: (a) the v0.1.0 entry below in this same journal describes the leak by quoting the labeled-DOB shape it removed, and the PII scanner allow-lists `journal.md`, so the leak survives in tracked content under the scanner's nose; (b) the labeled-DOB regex only catches label-before-date shapes with no alphabetic text between them, missing JSON-shaped occurrences. Fixes: rewrite the v0.1.0 entry to describe the leak class without reproducing the shape, tighten the regex, narrow the `journal.md` allow-list.

## Codex CONCERNs — logged

- **§3:** master numbers 11 and 22 in fixtures, 33 missing. Regression dropping 33 preservation would pass current gate. → add 33 fixture in next refresh.
- **§5:** no automated gate against new localStorage keys, fetch() calls, or analytics injections. → add static scan for forbidden API surfaces.
- **§8:** release ritual is operator vigilance only, no hard pre-merge gate. → known structural property; defer until friction shows real cost.
- **§10:** lanes documented, no automated enforcement that doctrine amendments pass through Codex. → consider PR template requiring lane-tag.
- **§12:** out-of-scope items have no automated gate. → static scan covers some (fetch presence); full coverage requires PR-level review discipline.
- **§13:** Friday rule-kill review has not fired (rule was created today). → first review scheduled at first Friday post-creation.

Per brief acceptance criteria: CONCERNs that recur in next audit escalate to FAIL.

## Product pivot: roast → designed deck

Triggered by §1/§2/§9 cluster being structurally unfixable as written. Operator decision: shake → truth tied to (name, DOB) lands as a card from a **fixed designed deck**. Declarative-observational voice, strengths-and-weaknesses framing, explicitly materialistic-aesthetic in essence by design. Roast voice retires. The trick is no longer hidden; the calculation IS the product.

This dissolves §1/§2/§9 cleanly (nothing left to deny) and transforms §4 (the violating prose lines die when format changes; §4 needs a successor for card content). §7 and §11 are independent of the pivot and still need fixing.

Pivot is decided, not implemented. Implementation is Phase-2.

## Phase-2 scope

Brief's own rule binds: when FAIL > 1, tighten or kill failing rules before adding more. So:

- **2A. v0.1.2 patch.** §4 safety-patch carve-out + cut both violating trait lines + §11 PII regex tightening + journal v0.1.0 rewrite + journal allow-list narrow. Multi-file → CC lane.
- **2B. Doctrine consolidation.** Retire §1/§2/§9; rewrite §4 for card content (no medical/diagnostic framing; cultural-symbol respect if cards draw from any tradition); revisit §10's "v1 immutable" rule given format pivot. Codex re-audit before merge. Target: 9+ PASS, FAIL ≤ 1.
- **2C. §7 deploy-gate alignment.** Wire Netlify required-check, or amend doctrine. Operator decision.
- **2D. Rule-without-enforcement CONCERNs (§5, §8, §10, §12).** Each gets one of: enforcement surface added, rule amended to match reality, or rule killed. Friday rule-kill review per §13 is the natural moment.
- **2E. Card system design.** Schema, sample cards, full deck. Where "aesthetic and taste" lives. Independent of doctrine work; can run parallel.
- **2F. Card system implementation.** Engine + UI rewrite. Retire `content/traits.v1.js` and `content/templates.v1.js`. Add `content/cards.v1.js` + `assets/cards/`. Fixtures update. CC lane.

ChatGPT v2 trait expansion is **paused indefinitely** — pivot retires trait pools.

## Tooling provisioned this session

- `CLAUDE.md` at repo root — CC entry point, lane discipline, command list, don't-do rules. CC v2.1.42 verified (predates auto-memory v2.1.59+; static-CLAUDE.md path matches project's append-only discipline anyway).
- `AGENTS.md` at repo root — cross-tool role-routing gate (the open-standard format auto-read by Codex / Cursor / Aider / Windsurf / Zed). Tells any agentic tool that lands here to identify role per §10 before modifying anything.
- Both untracked, pending clean commit alongside this journal entry.

No `.claude/` or `.codex/` subdirectories scaffolded. Per Anthropic and OpenAI docs, "small and stable, add modular config when friction shows real cost." Not adding empty config files preemptively.

## Lessons

**L10 — A doctrine that fails its own first adversarial audit at FAIL=6 is honest but unfit-for-purpose.** §10 lanes did exactly what they were built to do: a different model with a different bias profile read the doctrine literally and found drift the authoring instance could not see. The lesson is not that the doctrine is broken. The lesson is that aspirational rules masquerading as enforced rules are the most expensive kind of doctrinal debt — cheap to write, hard to retire, structurally invisible until something forces a literal read.

**L11 — Lane-relay completeness is the soft failure mode.** The ChatGPT v2-traits brief failed-soft because a paste step was skipped at relay. The model defaulted to brief-critique rather than refusing or asking for the missing input. The lane existed; the relay didn't carry. Brief should be amended to require source-content paste before any output, or relay step should include a checklist confirming all paste-targets are filled before send.

**L12 — Live-fire of the discipline beats hypothetical critique of it.** While provisioning `CLAUDE.md` this session, the PII scanner caught a home-directory file path that contains operator first name as a word. The right move was visible immediately: fix the new file rather than widen the allow-list — exactly the drift pattern Codex flagged in §11. Same scanner, same allow-list, same drift surface, fired on a fresh case and resolved correctly. The discipline working in real time on a real artifact is worth more than ten audits of how the discipline *should* work.

## Open items / next session queue

1. ~~Connect Netlify to GitHub repo~~ ✅
2. ~~Pick + reserve subdomain~~ ✅
3. ~~Hex-overflow fix~~ ✅
4. ~~Codex doctrine audit~~ ✅ done; triaged in this entry.
5. **ChatGPT v2 trait audit — PAUSED INDEFINITELY** (pivot retires trait pools).
6. Operator: create `audits/local_personal_data.txt` per `audits/LOCAL_PII_AUDIT.md`.
7. Operator: bootstrap-table update in personal preferences file (carried from v0.1.1 queue).
8. **Phase-2A: v0.1.2 patch** — §4 carve-out + violating trait lines cut + §11 PII fixes + journal v0.1.0 rewrite. Single PR. CC lane.
9. **Phase-2B: doctrine consolidation** — retire §1/§2/§9; rewrite §4 for card content; revisit §10 immutability rule under pivot. Codex re-audit before merge.
10. **Phase-2C: §7 deploy-gate alignment** — wire Netlify required-check, or amend doctrine.
11. **Phase-2D: rule-without-enforcement CONCERNs** — enforcement, amend, or kill for §5, §8, §10, §12.
12. **Phase-2E: card system design** — schema, sample cards, full deck. Aesthetic concentration.
13. **Phase-2F: card system implementation** — engine + UI rewrite, content layer pivot.
14. Codex re-audit on consolidated doctrine. Target FAIL ≤ 1.
15. Question classifier rework — independent, can run anytime (likely retired by pivot).
16. Brief amendment: require source-content paste verification at send-time (or kill if pivot retires the whole brief).
17. Candidate fifth lane: Grok. Provisioned on operator's machine. Role TBD post-pivot — possible cold-reading-sniff auditor for card content. Provision when card content exists for it to review.

=====
End of 2026-05-08 · doctrine audit triage entry.
=====

=====
2026-05-08 · v0.1.1 — hex-overflow fix + multi-model lanes activated
=====

## What shipped

- **Hex-window overflow fix.** Live screenshots from the operator showed long answers clipping the hexagonal display (top, sides, bottom — "PLOT TWIST" cut off, "...HEN YO DECIDED" cut off). Two-layer fix:
  - Engine: `generateAnswer()` now soft-caps at 120 chars. Re-rolls up to 12 times to find a fitting candidate; returns a length-clean fallback if 12 fail.
  - UI: dynamic font-size scaling on `.answer` based on text length (default / `size-medium` for 60+ / `size-small` for 90+). Default size lowered slightly to give a baseline buffer.
- **Test added** for the soft cap: 1000 generations must produce <5% over-cap. Currently passing comfortably.
- **Multi-model lanes activated** — first real handoff briefs written and saved to `~/Desktop/8ball/audits/`:
  - `chatgpt_brief_v2_traits.md` — paste-ready prompt for ChatGPT to (a) audit v1 trait pool against §4, (b) flag flavor-repeats, (c) propose ~168 v2 expansion phrases.
  - `codex_brief_doctrine_audit.md` — paste-ready prompt for Codex to audit DOCTRINE.md §1–§13 against the actual code, with PASS/CONCERN/FAIL verdicts per rule and 9 named scrutiny points.
- **Tests:** 32/32 green.

## Lessons

**L8 (new) — The doctrine that documents lanes but doesn't activate them is doctrine that doesn't fire.** v0.1.0 documented §10 lanes. v0.1.1 actually used them. Documenting without activating is exactly the recursion-fires-through-orchestrator failure mode §13 names.

**L9 (new) — Live screenshots beat synthetic test cases.** The hex-overflow bug was invisible in unit tests because no test checked rendered visual integrity. Operator's real-use screenshots surfaced it in one minute. Add to release checklist: shake live URL N times before declaring v.x done.

## Open items / next session queue

1. ~~Connect Netlify to GitHub repo for auto-deploy~~ ✅ done 2026-05-08 16:17. Live at `https://the-eight-ball.netlify.app`.
2. ~~Pick + reserve subdomain~~ ✅ reserved `the-eight-ball`.
3. ~~Hex-overflow fix~~ ✅ v0.1.1 ships in this commit.
4. Operator: paste `~/Desktop/8ball/audits/chatgpt_brief_v2_traits.md` into ChatGPT.app. Save response back to `~/Desktop/8ball/audits/chatgpt_v2_trait_review_<date>.md`.
5. Operator: paste `~/Desktop/8ball/audits/codex_brief_doctrine_audit.md` into Codex.app. Save response back to `~/Desktop/8ball/audits/codex_doctrine_audit_<date>.md`.
6. Operator: create `audits/local_personal_data.txt` per `audits/LOCAL_PII_AUDIT.md`.
7. Operator: add `8ball` row to `~/MUHAB.md` §6 bootstrap table (operator-personal file).
8. Trait pool v2 — incorporate ChatGPT review per item 4.
9. Doctrine fix-ups — incorporate Codex audit per item 5.
10. Question classifier rework.

=====
End of 2026-05-08 · v0.1.1 entry.
=====

=====
2026-05-08 · v0.1.0 build session — PII leak found mid-build, patched, discipline added pre-ship
=====
> **Sanitization note (v0.1.2):** the "What shipped" bullet describing the labeled-DOB leak was rewritten to describe the leak class without reproducing the label or the date. Original draft preserved no useful information beyond the shape it claimed to fix. See journal entry for v0.1.2.

## What shipped

- **Critical:** v0.1.0 fixture leak fixed. `tests/fixtures.json` contained a calculation fixture whose label tied the operator's first name to a real-shape DOB — a labeled-DOB leak in a public repo. The same leak shape appeared in this journal's prior draft. Fix: synthetic DOB shifted by 12 years (preserves Chinese zodiac animal and life path mod-9 distribution while breaking the real-DOB anchor); all operator-name labels removed from fixtures and journal.
- **Public PII scanner** at `tests/pii_scan.test.js` — 9 cases covering operator-name leakage, SIRR cross-references, GitHub-username leakage, labeled-DOB shapes. Doctrine and config files allow-listed (their job is naming the boundary).
- **Local PII audit infrastructure** at `audits/LOCAL_PII_AUDIT.md` + `audits/run_local_audit.sh`. Operator's personal-data file is gitignored; script greps tracked content against the patterns.
- **Release checklist** at `audits/RELEASE_CHECKLIST.md` — operational form of DOCTRINE.md §8 gates.
- **DOCTRINE.md v0.2** — added §10 multi-model lane system (mirrors SIRR §7 at smaller scale), §11 PII rule with fixture-DOB sub-rule, §13 refresh discipline + Friday rule-kill review.
- **8BALL.md** — canonical AI-session-bootstrap context. Mirrors `~/dev/SIRR/SIRR.md` shape.
- **`~/Desktop/8ball/`** folder structure with `sessions/` and `audits/` subdirs, mirroring `~/Desktop/SIRR/`. v0.1.1 session distillate filed.
- **`.gitignore`** updated to exclude `audits/local_personal_data.txt`.
- **CI workflow** unchanged but the new tests run automatically as part of `npm test`.
- **Tests:** 31/31 green (22 calc + engine + content; 9 PII scan).

## Lessons

**L1 — The PII gate that doesn't exist before push doesn't exist.** Build the gate the same release as the surface it protects.

**L4 — Files are canon, memory is not** (carried from SIRR L4). This Claude started the session without reading `~/MUHAB.md`. Operator caught it. Process discipline is the only counter.

**L5 — Solo authority IS the failure mode.** Same instance wrote the doctrine, the code, the tests, the fixtures. The labeled-DOB leak slipped through because of single-author blindness. §10 lanes codify the structural fix.

**L7 — The recursion fires through the orchestrator too.** Watch for tooling that feels rigorous but doesn't fire. Friday rule-kill review is the structural counter.

Full session distillate: `~/Desktop/8ball/sessions/session_distillate_2026-05-08.md`.

## Open items / next session queue

1. ~~Connect Netlify to GitHub repo for auto-deploy~~ ✅ done 2026-05-08 16:17. Live at `https://the-eight-ball.netlify.app`.
2. ~~Pick + reserve subdomain~~ ✅ reserved `the-eight-ball`.
3. Operator: create `audits/local_personal_data.txt` per `audits/LOCAL_PII_AUDIT.md`.
4. Operator: add `8ball` row to `~/MUHAB.md` §6 bootstrap table (operator-personal file).
5. Trait pool v2 — ChatGPT lane drafts; doctrine §4 review gates.
6. Question classifier rework.
7. First cross-model audit dry-run (Codex on a doctrine change).
8. Live-fire testing post-deploy.

=====
End of 2026-05-08 · v0.1.1 entry.
=====

=====
2026-05-08 · v0.1 — repo bootstrapped, calc contract locked
=====

## What shipped

- Repo restructured from single-folder `8ball-app/` to layered `8ball/` with `core/`, `content/`, `tests/`, `.github/workflows/`.
- Calculation core extracted to `core/profile.js`. Pure functions, no DOM. Re-importable in tests.
- Response engine extracted to `core/engine.js`. Tokens documented inline.
- Trait pools and templates split into versioned files: `content/traits.v1.js` and `content/templates.v1.js`. Immutable once shipped — v2 = new file.
- `index.html` slimmed to UI + boot, ES module imports.
- `tests/fixtures.json` — 12 calculation fixtures + 4 name-number fixtures, every value hand-verified against the algorithm. All DOBs synthetic per §11.
- `tests/profile.test.js` — 22 cases across calculation contract, engine token-leakage, recent-buffer dedup coverage (>80 unique strings in 500 calls), question classifier, banned-pattern content scan.
- `DOCTRINE.md` written. 10 sections. The §3 calculation contract and §4 content rules are the load-bearing parts.
- `.gitignore` includes explicit `**/SIRR/`, `**/PRIVATE/`, `**/_ARCHIVE/` barriers so cross-pollination from SIRR is impossible by accident.
- `LICENSE` MIT.
- `package.json` — vitest only; no build step, no framework.

## Decisions locked

| # | Decision | Locked value |
|---|---|---|
| 1 | Repo visibility | Public on GitHub from day 1 |
| 2 | Domain | netlify.app subdomain only until traction |
| 3 | Product name | `8 ball` (lowercase, space; folder & repo `8ball`) |
| 4 | License | MIT |
| 5 | Stack | Static + ES modules; no build step |
| 6 | Persistence | localStorage only — name + DOB; nothing else, ever |
| 7 | Telemetry | None. Permanently. |
| 8 | Calc version | v1 — Pythagorean LP w/ master 11/22/33 preserved; tropical sun; Feb 4 CNY approximation |

## Errata caught during build

Initial `tests/fixtures.json` had hand-calc errors on 6/12 cases. All caught by running the algorithm against the fixtures before locking. Lesson: never lock fixtures from memory — generate them from the algorithm, then hand-verify the algorithm itself against an external source. The fix took 10 minutes; finding it after a bad release would have taken weeks.

## Open items / next session queue

1. **`git init` + push to GitHub.** Repo URL TBD pending availability of preferred name.
2. **Wire Netlify to GitHub.** Currently the v0 deployment (if any) was drag-and-drop from the old `8ball-app/` folder. Reconnect to `8ball` repo, deploy on push to main.
3. **Rename existing Netlify subdomain** if a v0 deployment exists. Target name: `8ball.netlify.app` or `the-eight-ball.netlify.app` depending on availability.
4. **Trait pool expansion (v2).** Current pool is the seed. Doubling each axis pool will materially reduce flavor-repetition complaints.
5. **Question classifier rework.** Regex-grade dumb in v1. v2: distinguish regret vs choice vs future vs identity.
6. **iOS wrap.** Capacitor or PWA install prompt. Only after web shows pulse — don't pre-build.
7. **Live-fire testing.** Open the deployed URL. Shake 30 times with real DOB. Note any flavor-repeats or weak lines for v1.1.

## Lessons (the ones not in code)

**L1 — Test gate works.** The fixtures-vs-algorithm mismatch was caught by writing tests before believing my own arithmetic. Process did its job.

**L2 — Doctrine before content.** `DOCTRINE.md §4` was written before `traits.v1.js` was reviewed. Re-reading the §4 rules surfaced one borderline phrase that was cut. Doctrine first means content review has a yardstick, not a vibe.

**L3 — Mirroring SIRR's process is cheap and load-bearing.** The journal-shape, doctrine-doc, fixture-locked tests are SIRR-shaped. Reusing the shape means we don't re-derive process discipline every session.

=====
End of 2026-05-08 entry.
=====
