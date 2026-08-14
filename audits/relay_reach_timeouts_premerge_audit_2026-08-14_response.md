# Cross-model pre-merge audit — REACH-X-TIMEOUT-01 + REACH-POSTPEER-TIMEOUT-01

**PR:** none. The audited change lives in `~/8ball/reach/`, which is not under Git.
See §0 — this artifact is filed on the resolution REACH-CAPTION-UPGRADE-01 reached
(`relay_pr204_premerge_audit_2026-08-12_response.md`), minus the PR, because there is no
repo for one to exist in.
**Filed:** 2026-08-14
**Authority:** controller word, dated 2026-08-14, chat — "fix", refined the same day to
authorize REACH-POSTPEER-TIMEOUT-01 question 4 and a written-approach-first
REACH-X-TIMEOUT-01. Packets: `~/8ball/sessions/packet_x_timeout_2026-08-12.md`,
`~/8ball/sessions/packet_postpeer_timeout_2026-08-12.md`. Written diagnosis:
`~/8ball/sessions/diagnosis_x_timeout_2026-08-14.md`.
**Lanes:** codex (gpt-5.6-sol) + grok, independent, reconciled by claude.
Run: `~/ai-relay/runs/20260814-153915-repo/`.
**Outcome:** the lanes split — grok SAFE TO MERGE, codex DO NOT MERGE — and the
reconciler landed on **MERGE WITH FIXES** with four named blockers. **All four are
fixed**, plus four further findings the lanes raised below blocker level.
**Not a merge authorisation.** The reach/ change stays gated; arming is a separate tap
after merge. REACH-ALERT-DELIVERY-01 was not implemented and is not in this artifact.

---

## 0. What was audited, and the two things this artifact cannot claim

`~/8ball/reach/` has no branch, no PR and no CI. To produce a reviewable diff the
implementing seat built a scratch repo with a reconstructed before-state and the current
after-state (`main` → `claude/reach-timeouts`, +1617 / -79 across 8 files).

That reconstruction was **verified, not assumed**: the complete pre-change test suites
pass on the baseline commit with exactly their recorded counts — `test_post_x` 65,
`test_postpeer_catalog` 50, `test_post_tiktok_postpeer` 48, `test_postpeer_recovery` 17.
A reconstruction that had drifted would not land on all four.

**What this artifact cannot claim, stated plainly:**

1. The reviewers did not see the live vault tree. They saw a faithful copy.
2. **The lanes reviewed the code as it stood when they started, not as it stands now.**
   Four changes landed after the lanes were launched: two the implementing seat found in
   its own review (§4), and the fixes for everything in §2 and §3. Nothing in §2, §3 or
   §4 has been re-reviewed by codex or grok. That is a real gap and it is the reason this artifact is
   a record rather than a clearance.

---

## 1. Verdicts as returned

| Lane | Verdict | Findings |
|---|---|---|
| grok | SAFE TO MERGE | 3 MEDIUM, 2 LOW, 1 nit |
| codex | DO NOT MERGE | 3 HIGH, 3 MEDIUM |
| claude (reconciler) | **MERGE WITH FIXES** | 4 blockers, adjudicating the split |

The split is the argument for running both. codex's HIGH #1 — the one genuine
duplicate-post vector in the change — was **invisible to grok**, whose "fail closed" rails
table checked the zero-match, multi-match and profile-URL cases but not the
same-caption-stale-failure case. grok's test-coverage findings were sharper and more
specific than codex's. Neither lane alone would have produced the fix list below.

Both lanes independently cleared the same three things, in the same terms:

- **The re-poll is genuinely read-only.** `repoll_ambiguous_claim` never POSTs; the only
  call it makes is the same `GET /posts` the scheduled recovery uses.
- **The tweepy session swap is active, not inert, and does not leak.** Both traced it to
  `BaseClient.request`'s `self.session.request(...)` and confirmed the discarded session
  is closed.
- **`read=45` is defensible on the measured evidence** (68 fires, response latency never
  above 1.1 s — see the diagnosis §2).

---

## 2. The reconciler's four blockers — all fixed

### B1 (codex HIGH, missed by grok) — the immediate re-poll could clear a claim on a stale failed candidate, opening a duplicate post

The real one. `clear_definitive_failure` **deletes** the ledger row of a failed publish,
which returns that code to the draw pool — so a code can legitimately be fired twice in
one day. On the second fire, at T+15 s, PostPeer may not have indexed the in-flight job
yet, and the only candidate matching caption + date + window is the **earlier failed**
one. The re-poll would then delete the PENDING claim on that evidence, releasing the code
while our own publish was still in flight. If it then succeeded, the code was free to be
drawn and posted again — the exact double-post the PENDING machinery exists to prevent.

**Fixed** by the reconciler's option (b): the immediate re-poll now treats a `failed`
verdict as unresolved and returns, leaving the destructive clear to the scheduled path,
where both entries are indexed and "exactly one candidate" is a real constraint again.
Nothing is lost by waiting — a failed publish has nothing to close quickly, and this loop
exists only to close the *published* case fast.

`postpeer_catalog.py` · `tiktok_pipeline/post_tiktok_postpeer.py`.
Pinned by `test_a_failed_candidate_does_not_clear_the_claim_this_soon` and its counterpart
`test_the_scheduled_path_still_clears_a_failed_candidate`, which holds the restriction to
the re-poll so the out-of-scope scheduled path is not silently narrowed too.

### B2 (both lanes) — the unresolved end-to-end test did not pin the POST count

`test_ambiguous_post_that_stays_unresolved_keeps_the_old_behaviour` asserted PENDING and
the exit code but not that exactly one POST ever happened, so a regression that re-POSTed
on the empty-GET path would have gone green. **Fixed**: the test now asserts
`POST == 1` and `GET == AMBIGUOUS_REPOLL_ATTEMPTS`. (The TikTok counterpart already
pinned both.)

### B3 (both lanes) — the shared-probe parity test was false-green

`test_the_repoll_and_the_scheduled_path_share_one_probe` asserted
`probe.call_count >= 2` across both callers — but the re-poll alone makes four calls, so
the assertion passed even if `recover_claim` had stopped going through `probe_claim`
entirely, which is the exact fork the test exists to forbid. **Fixed**: counted per
caller, `recover_claim` exactly 1 and the re-poll exactly `AMBIGUOUS_REPOLL_ATTEMPTS`.
Mutation-checked — bypassing `probe_claim` in `recover_claim` now kills 10 tests.

### B4 (codex) — `LEGACY_RECOVERY` logged after the lookup it describes

The `probe_claim` extraction had moved that line into a returned `preamble` list emitted
after the GET, so a process killed inside a 45-second lookup would leave no record of what
it was doing — a small instance of exactly the forensic gap REACH-X-TIMEOUT-01 came from.
**Fixed** before codex's report arrived, independently, by the implementing seat's own
review (§4) — replacing the returned list with an `emit(line)` callback the probe calls at
the moment it happens. Recorded here because two reviewers and the seat converging on the
same line is worth more than any one of them.
Pinned by `test_the_legacy_narration_is_logged_before_the_lookup_it_describes`, which
records the log state *at lookup time* rather than after.

---

## 3. Findings below blocker level, and what was done with each

| # | Lane | Finding | Disposition |
|---|---|---|---|
| 1 | codex HIGH | `requests` defaults `allow_redirects=True`; a 307/308 re-sends the POST body | **FIXED** — see below |
| 2 | codex HIGH | read/connect are *inactivity* timeouts, not wall-clock deadlines | **PARTLY FIXED** — see below |
| 3 | codex MED | `connect=10` had no evidence under it | **FIXED** — raised to 30 |
| 4 | codex MED | the 402 "never re-polls" sentinel was swallowed | **FIXED** |
| 5 | codex note | the ceiling assertion was tautological | **FIXED** |
| 6 | grok LOW | tweepy retry knobs relied on tweepy's defaults | **FIXED** — passed explicitly |
| 7 | grok LOW | `setdefault` inert if tweepy ever passes `timeout=None` | Accepted; the tweepy pin fails first |
| 8 | grok nit | worst-case lock-hold comment said 240 s, real figure 285 s | **FIXED** — comment corrected |

**On #1, where this artifact disagrees with its own reconciler.** The reconciler
downgraded the redirect finding to "pre-existing, not introduced by this diff, out of
scope". The first half is correct. The conclusion was not accepted, for three reasons:
the packet's *hard constraint* is no retry of a publish at any layer, and a 307 that
re-sends the body is a second publish attempt that `max_retries=0` does not touch; the
fix is one line inside the very session object this change introduces; and it was
**confirmed empirically before being believed** — a local server returning 307 to a real
`_TimeoutSession` POST produced two `POST` requests, recorded in
`test_a_307_never_re_sends_the_publish_body`. `allow_redirects` is now **forced** False
rather than `setdefault`-ed, because a caller passing True would be re-arming the defect.
The cost — a genuine X redirect surfaces as a non-2xx and blocks instead of being followed
— is the correct side to fail on.

**On #2, the honest residual.** codex is right that `(connect, read)` bound *inactivity*,
not elapsed time: a remote dribbling one byte every 40 s never trips a 45 s read timeout,
and DNS resolution is not covered at all. Two different things follow:

- For the **PostPeer re-poll**, which is new code holding a process lock, this was closed:
  `AMBIGUOUS_REPOLL_DEADLINE_SECONDS = 300`, checked between attempts, so the loop can
  only be cut short, never extended. Pinned by
  `test_the_loop_stops_at_the_wall_clock_deadline` with an injected clock.
- For **X**, it stands as a named residual. The only construct that bounds *everything* —
  DNS, slow-drip, anything outside tweepy — is a process watchdog, and the written
  diagnosis (§1c) rejected that deliberately: a watchdog raises at an arbitrary
  instruction, and the definitive/ambiguous split this pipeline depends on is built on
  knowing *where* the process was when it failed. A SIGALRM inside `_ledger_swap` is worse
  than the hang it prevents. Flagged, not closed, and not closed under this packet.

---

## 4. What the seat found in its own review, before the lanes reported

Recorded because an audit artifact that only lists what reviewers caught overstates how
much the reviewers were carrying.

1. **The re-poll's "strictly additive" claim was false for unexpected errors.** Anything
   raising out of the probe would have aborted the run *before* the caller's ambiguous
   WARN and notify — making the re-poll worse than doing nothing, which is the failure
   mode it exists to remove. Now guarded, with the guard stopping at the probe
   deliberately: once the finalize starts writing, a swallowed error would let the caller
   log "PENDING claim kept" over a just-finalized ledger, and a wrong log is worse than a
   traceback.
2. **B4 above**, found independently and fixed before codex's report arrived.
3. **The packet's own premise was wrong in two places** (diagnosis §0): `tweepy.API`
   defaults `timeout=60`, so the v1 media path was never unbounded; and its retry knobs
   already default to off, so the hard constraint is a constraint to *preserve a default*.
   Both are corrections to the packet, and both narrow the fix.

---

## 5. Verification

**Method note — a trap worth recording.** Two mutation results in this session were
initially wrong because macOS system Python writes bytecode to a global
`sys.pycache_prefix` (`~/Library/Caches/com.apple.python/...`), **not** to a local
`__pycache__`. Clearing `reach/__pycache__` cleared nothing. A size-identical control
mutation (`return 1` → `return 0`) therefore survived its own restore and produced a
22-failure phantom regression. Every mutation and differential result below was re-run
with the real cache cleared between runs.

**Differential — is the `recover_claim` refactor behaviour-preserving?**
`recover_claim` was split into `probe_claim` (the evidence rules) plus reporting, so the
new re-poll could not fork those rules — the D4 shape `postpeer_recovery.py`'s header
warns about, in the one path whose entire job is to fail closed. grok's medium finding was
that the "byte-identical" claim was asserted by nothing.

`reach/evidence/recover_claim_differential_2026-08-14.py` runs the reconstructed baseline
module and the current module side by side over 12 scenarios covering every branch, on
identical fixtures, comparing return value, the **interleaved** log/notify event stream,
and the resulting ledger and sidecar bytes. Result, recorded in
`recover_claim_differential_2026-08-14.out`: **12 scenarios, 0 behavioural differences.**

Its own negative controls were run first, and one of them earned its keep: recording logs
and notifies as two separate lists made a *reordering* of the two channels invisible. The
differential was rebuilt around one interleaved stream, after which all five controls were
caught:

| control | detected |
|---|---|
| drop the notify on an unresolved verdict | 7 scenarios differ |
| notify where the original stayed silent | 2 differ |
| return 0 instead of 1 (size-identical) | 9 differ |
| reorder: notify before log | 7 differ |
| change one word of one log line | 5 differ |

**Simulated hang, per the packet's gate** ("a timeout that is never exercised is not
evidence"). `reach/evidence/x_timeout_hang_demo.py` runs a server that completes the
handshake, reads the request and then never writes a byte — the 2026-08-09 incident
reduced — and drives both sides through it. Recorded output in
`x_timeout_hang_demo_2026-08-14.out`:

- **control** (stock `requests.Session`, what tweepy builds for itself): still blocked
  after 20 s, no exception, no return. The demo fails loudly if the control does *not*
  hang, so it cannot pass vacuously.
- **candidate**: `ReadTimeout` at the configured ceiling.
- **candidate through `tweepy.Client.create_tweet`**, tweepy's real code path, not a mock:
  `ReadTimeout` at the ceiling.

**Mutation testing.** Every assertion written in this change was run against code
deliberately broken in the way that assertion exists to catch. All killed:

| mutation | killed by |
|---|---|
| drop the session swap | `test_publish_client_session_is_bounded_before_create_tweet` |
| drop the explicit `tweepy.API` timeout | `test_media_api_is_constructed_with_the_explicit_ceiling` |
| `setdefault` → no timeout at all | `test_session_supplies_the_ceiling_when_the_caller_passes_none` |
| `setdefault` → forced override | `test_session_defers_to_an_explicit_timeout` |
| enable a tweepy retry | `test_media_api_enables_no_tweepy_retries` |
| allow redirects again (307 double-POST) | `test_a_307_never_re_sends_the_publish_body` |
| unbounded read ceiling (`= None`) | the independent-bounds assertion |
| drop the publish-duration log | `test_success_line_records_the_publish_call_duration` |
| re-poll clears on a failed candidate | `test_a_failed_candidate_does_not_clear_the_claim_this_soon` (both pipelines) |
| remove the wall-clock deadline | `test_the_loop_stops_at_the_wall_clock_deadline` (both) |
| re-poll always gives up | 10 tests |
| re-poll re-sends the publish | 9 tests |
| loosen fail-closed (`!= 1` → `< 1`) | `test_two_matches_stay_blocked` + re-poll counterpart |
| drop the `SELF-RECONCILED` token | `test_the_success_line_still_counts_as_a_completed_publish` |
| one attempt instead of the configured count | 3-4 tests |
| cadence drifts between the two pipelines | `test_the_two_pipelines_repoll_on_the_same_cadence` |
| re-poll a definitive 402 | `test_a_402_rejection_is_definitive_and_never_repolls` |
| `recover_claim` bypasses `probe_claim` | 10 tests |
| remove the unexpected-error guard | `test_an_unexpected_probe_error_falls_back_instead_of_aborting` |
| defer the `LEGACY_RECOVERY` line | `test_the_legacy_narration_is_logged_before_the_lookup_it_describes` |

**Suites**, all green on cleared bytecode:

| suite | before | after |
|---|---|---|
| `x_pipeline/test_post_x` | 65 | **92** |
| `test_postpeer_catalog` | 50 | **93** |
| `tiktok_pipeline/test_post_tiktok_postpeer` | 48 | **88** |
| `test_postpeer_recovery` | 17 | 17 |
| `test_drift_check` | 42 | 42 |
| `test_caption_rail` | 46 | 46 |
| `test_queue_draw` | 13 | 13 |
| `test_captions_interpretation` | 38 | 38 |
| `tiktok_pipeline/test_stage_tiktok` | 16 | 16 |

**Live surface, end to end.** `post_x.py --dry-run` against the real queue, captions and
assets: exit 0, no network call, ledger untouched, `pending_claims.json` still absent, and
the pre-existing `pipeline.log` intact as a byte-exact prefix with only DRY-RUN lines
appended.

**Cross-module pin.** `drift_check.check_freshness` anchors on the last line matching its
own `_SUCCESS_LINE` regex. Both new success lines — X's `FIRED … publish call N.NNs` and
the re-poll's `SELF-RECONCILED … (immediate re-poll, attempt N of M)` — are asserted
against that live regex, so neither is a completed publish the freshness check cannot see.

---

## 6. Scope — including where this change went outside its packet

Changed: `x_pipeline/post_x.py` (client construction, one success-path log line),
`postpeer_catalog.py` and `tiktok_pipeline/post_tiktok_postpeer.py` (the `probe_claim`
extraction and the immediate re-poll), their three test suites, and two new files under
`reach/evidence/`.

Untouched, per the packets: the PENDING claim machinery, `PENDING_VERIFY`, the
claim-before-network ordering, `caption_rail.py` and the caption sources, `board.json`,
ledger row 90, and any API-tier decision.

**One scope tension, surfaced rather than buried.** REACH-POSTPEER-TIMEOUT-01's
out-of-scope list says: *"The recovery/reconcile machinery itself. It is working: 12 of 12
recovered. Do not 'improve' a mechanism whose only demonstrated behaviour in this window
is success."* The `probe_claim` extraction touches that machinery. Both lanes flagged it;
codex asked for a scope lift.

The case for it: the alternative was a second copy of the evidence rules for the re-poll
to use, which is the fork `postpeer_recovery.py` was written to end, in the one path whose
job is to fail closed. It is an extraction, not an improvement — no rule was tightened,
loosened or added — and §5's differential demonstrates zero behavioural change across
every branch.

**RESOLVED — controller word, 2026-08-14, chat: "merge the probe_claim scope call —
extraction is right, go ahead."** The scope lift codex asked for is granted. The extraction
stands, and this is the record of the grant rather than of an assumption.

---

## 7. Standing

Two authorized items implemented, reviewed by two independent models, reconciled, and
every blocker closed. The one reserved scope question is now resolved (§6).
REACH-ALERT-DELIVERY-01 was not implemented; its channel question is still open and
unanswered from disk.

**On "merge" and "arming" for this change — a correction to the packets' own gate.** Both
packets say arming is a separate tap after merge. For `~/8ball/reach/` that separation does
not mechanically exist. There is no repo, so there is nothing to merge; and the launchd
agents execute these files **in place**, so writing them to disk is what arms them. The
gate between an edited file and a live autonomous publisher is not a merge — it is the
per-surface `HOLD` file, and no `HOLD` was set. This is a property of reach/ having no
version control, not a decision taken here, and it should be read as amending the "arming
is separate" clause in both packets rather than as having satisfied it.

Unreviewed by the lanes, and therefore the first thing a next pass should look at: every
fix in §2 and §3, and the two self-found items in §4.
