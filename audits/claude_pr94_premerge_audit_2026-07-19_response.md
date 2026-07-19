# PR #94 pre-merge cross-model audit — response (Claude lane, auditor of record)

Dated 2026-07-19 (session ran past midnight into 07-20; the brief's date is
kept). Claude-lane adversarial audit of `feature/saved-readings-mvp` (Saved
Readings MVP, DOCTRINE §5.E, doctrine v0.50) per the audit-charter handoff
§5.E independence rule: Codex implemented this line under controller
override, so Codex is conflicted off first-audit and the Claude lane is
first auditor of record for the SR+RC pair. Brief:
`sessions/cc_brief_sr_rc_audit_2026-07-19.md`; riders from
`audit_laneA_repo_sweep_2026-07-19.md` §A4. Filed in-PR per L48 choreography
(feature/* heads sit outside the live claude/*-scoped CI step; the artifact
requirement here is charter choreography, not CI).

**Method — three passes.** ROUND 1 (this lane): post-renumber tip `e03aeb2`
(sole feature commit over `main` @ `0e49773` / #93; packet §3 S1–S7
applied) — full 13-file diff line-by-line, every §5.E claim traced to code
and test pin, suite re-run fresh, PII grep re-run. CONVERGENCE: the
parallel Codex spree cross-check (operator relay; artifacts on the RC
branch) independently returned the same SR-layer doc finding; its absorb
landed as `52b859d` — the current PR head — and this lane delta-verified
it. CROSS-CHECK: Grok reviewed the round-1 diff with this lane's verdict
inline (relay run `20260720-021249-sr-tip`, reconciled in-run), confirmed
every round-1 claim, and REFUTED the round-1 "zero runtime findings" with
one t3 sequence this lane had not exercised — accepted below after
independent re-verification.

**FINAL VERDICT: SAFE TO MERGE at head `014dacc`.** Round 1 (`e03aeb2`):
MERGE WITH FIXES — SR-M1 (doc MED) absorbed in `52b859d` and verified.
Cross-check round: Grok's SR-M2 (runtime MED) absorbed in `014dacc` on
explicit controller word and delta-verified by suite, static pin, and a
live browser run of the exact defect sequence. No findings remain open
above LOW; storage/privacy/§5.E surfaces fully conformant.

## Findings

**SR-M1 — MED — CLOSED (absorbed `52b859d`, verified).**
`agents/controller.md:89` cited "§5.E v0.49" — stale pre-renumber token;
the override record no longer matched the doctrine it authorizes (rider 4;
the packet's S7 sweep list never included `agents/`). Independently found
by Codex Lane 1 — line-identical convergence. Verified fix shape: a
bracketed "[renumbered §5.E v0.50 in the 2026-07-19 spree close-out; record
wording otherwise preserved]" annotation — better than a token swap for a
historical evidence record.

**SR-M2 — MED — CLOSED (absorbed `014dacc` on explicit controller word;
delta-verified) — archive-open at t3 rendered the written entry at the
PREVIOUS profile's rotation position, and the next funded flip debited
from it (Grok finding; this lane re-verified the sequence and accepted the
refutation of its round-1 "zero runtime" claim).** Mechanics: the
`openReading` host hook (`index.html`, readings wiring) calls
`profileFromPayload` → `saveProfile` → `showResult` but never
`ensureFacetIndex`; the t3 note renders via `getFacetSlot`, which prefers
the DEVICE-GLOBAL stored `eight_ball_facet_index_v1` and anchors only when
the key is absent. The form-submit and cold-boot paths both re-anchor with
`ensureFacetIndex(profile.lifePath, { reset: isNew })`; archive-open skips
it, so opening a DIFFERENT person's saved reading at t3 shows their entry
at the prior person's leftover position, and `consumeFacetShake` continues
(and debits) from that stale position. Round 1 checked the absent-key and
same-profile cases (both conformant — reload-class preserve per §5.E's own
"deterministic-rehydration" sentence) but did not run the cross-profile
sequence; Grok did. Severity MED per the in-run reconciler, concurred:
§5.E is silent on facet-at-reopen (the mandated render path IS honored);
no PII, crash, storage corruption, or data loss; t3-only; but it is a real
behavioral divergence on the paid surface with a debit continuing from a
position the user never established for that profile.
**Fix as absorbed (`014dacc`, submit-path parity):** `openReading` now
captures `const prev = loadSavedProfile()` BEFORE `saveProfile(...)`, then
`if (tier === 't3') ensureFacetIndex(profile.lifePath, { reset:
isNewPair(payload, prev) });` before `showResult`; +1 static pin in
`tests/readings.test.js` locking capture-before-save, the isNewPair-driven
reset, and ordering. Authority chain: finding by Grok, recipe by this lane
(reconciler-upheld), absorb worded explicitly by the controller in-session
— the auditor implemented its own recipe only on that word; finding origin
stays cross-model. **Delta verification:** suite 1280/1280 (35 files; +1 =
the pin); `index.html` 1495/1500; live-fired on the served fix tree —
boot A (LP 3) anchors slot 0 · funded flip 0→1 debits 3→2 · open B (LP 9)
re-anchors to B's slot 2 with credits UNCHANGED · reopen A resets to 0 ·
flip 0→1 debits 2→1 · SAME-pair reopen preserves slot 1, no debit · zero
console errors. Local PII audit clean (99 files).

**SR-L1 — LOW, OPEN (optional) —** explicit-action-only save is
code-enforced but not negatively pinned (`addSavedReading` reachable only
from the save button; `index.html` imports only `initReadingsUI` +
`clearAllSavedReadings`). Grok concurs and supplies the exact pin:
`expect(html).not.toMatch(/addSavedReading/)`. Non-blocking.

**SR-L2 — LOW / merge-time note, OPEN —** the SR journal entry still says
"Not pushed, no PR opened" (PR #94 is open) and its verification block
records the pre-rebase staging tree (1244/1244, 34 files; head truth:
1279/1279, 35 files, verified twice by this lane). Fold into the
merge-time STAGED→SHIPPED flip per house pattern.

**Nit (both lanes):** the save-failure copy for the unreachable `invalid`
status reads as a storage error. Cosmetic.

**Adjudicated non-findings** (checked, conform): S6 footer demotion
preserves the FULL v0.49 entry + explicit SHIPPED correction — richer than
the packet's short-bullet spec, L17-consistent; DOCTRINE §1.H-head STAGED
staleness was out-of-scope for this PR and has since been flipped to
"SHIPPED #93" by the Codex absorb on the RC branch (the surviving "remains
STAGED" at DOCTRINE.md:523 is inside the demoted v0.49 footer bullet — L17
lineage carrying its own SHIPPED correction, by design).

## Rider coverage (brief riders 1–7, SR half — state at `52b859d`)

1. **Privacy allow-list** — PASS. `LOCALSTORAGE_KEY_ALLOW` gains exactly
   `eight_ball_saved_readings_v1`, nothing else; §5 bullet, §5.E, and §7
   stage-2 v0.50 extension state the same single key.
2. **No-save-law amendment** — PASS. Payload hard-restricted in
   `compactReadingProfile` to `name`+`dob` + optional
   `time/city/cc/tz/country/lat/lng` (typed, finite-checked), derived and
   unknown fields dropped — pinned by exact persisted-key-set assertions.
   Save explicit-button-only. Reopen recomputes via `profileFromPayload` →
   `showResult`, tier/credits/tries read-only — no state-machine call, no
   try/credit movement (Grok: confirmed; the SR-M2 seam is display-position
   parity, not a counter or entitlement defect). Rename/delete/clear-all
   confirm; corrupt outer JSON fails closed, never overwritten by Save;
   partial archives read-only until clear-all (byte-length pinned);
   unavailable/quota storage degrades to status reporting; forget-device
   erases profile + archive + facet index (ordering pinned).
4. **Controller record** — PASS after absorb (SR-M1 closed).
5. **Network/account invariants** — PASS. Zero network tokens;
   `package.json`/lockfile/`netlify.toml` untouched; §12 PERMANENT account
   ban intact, re-affirmed by §2 v0.50.
6. **Suite + PII** — PASS. Fresh suites by this lane: `e03aeb2` 1279/1279
   (35 files) and head `52b859d` 1279/1279 — matching CI. `index.html`
   1489/1500; `git diff --check` clean. PII grep: fixture DOBs synthetic
   ladders (§11 sub-rule satisfied); `Dhahran` fixture pre-exists on main;
   zero operator identifiers/emails/secrets. Absorb delta (1 line) read in
   full, scanner-clean.
7. **Renumber fidelity (S7)** — PASS after absorb. Twelve `v0.49` hits
   adjudicated: eleven t3-owned, one stale (SR-M1, annotated). Zero
   `v0.7.1` doctrine-register tokens. Footer stack v0.50 → v0.49 → v0.48.

## Verification of record

Round-1 suite 1279/1279 on `e03aeb2` · head suite 1279/1279 on `52b859d` ·
CI green on PR #94 at audit time · diff +812/−44, 13 files · `core/`
`content/` `tests/fixtures.json` empty diff · repo-shape pins (9 ui / 35
tests) passing · absorb delta = exactly the SR-M1 annotation.

## Cross-model routing (charter §5.E)

- **Codex** (spree cross-check, operator relay; artifacts in-repo on the RC
  branch): convergent on the SR doc layer; absorb `52b859d`; its Lane 3
  left the Claude verdicts owed — this file closes that for #94.
- **Grok** (relay run `20260720-021249-sr-tip`, against round-1 tip
  `e03aeb2` with this lane's verdict inline): CONFIRMS payload law,
  explicit-save-only, fail-closed storage, no tries/credits movement,
  single-key allow-list, no network, SR-M1, both LOWs. REFUTES "zero
  runtime findings" with SR-M2 (upheld HIGH→MED by the in-run reconciler;
  independently re-verified and ACCEPTED by this lane — the cross-check
  working as designed).

**Disposition requested:** absorb SR-M2 (host-hook re-anchor + pin) in-PR —
or record an explicit controller waiver — then this lane has no objection
to the merge word for #94. SR-L1/nit optional; SR-L2 folds into the
merge-time journal flip. RC (#95) remains sequenced after this merge per
packet §1.

— Claude lane (Claude Code, worktree `sr-rc-audit-brief-b42e71`), 2026-07-19/20
