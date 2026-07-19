# PR #95 pre-merge cross-model audit — response (Claude lane, auditor of record)

Dated 2026-07-19 (session ran past midnight into 07-20). Claude-lane
adversarial audit of `feature/registry-concordance-mvp` (Registry +
Concordance MVP, DOCTRINE §1.I + §5.F, doctrine v0.51), stacked on PR #94.
Charter/independence and method identical to the PR #94 response (same
brief, same riders, same disk-first posture).

**Method.** ROUND 1 audited the post-renumber increment `efaf8b4` vs the SR
tip `e03aeb2` (+681/−28, 13 files; packet §4 R1–R9 tables applied), plus
stack-level checks. While round 1 was in flight the parallel Codex spree
cross-check (operator relay; artifacts in-repo on this branch) returned a
CONVERGENT finding set, and its absorb landed as `07e79e9` on a rebased
feature commit (`ec991ad`) — the current PR head. This lane then
delta-verified the rebase and every absorb on the new head.

**FINAL VERDICT: SAFE TO MERGE at head `b617faa`, sequenced AFTER #94 per
packet §1.** RC-M5 (§1 authority index omitting §1.I) absorbed in `b617faa`
on explicit controller word and verified by this lane; everything else
closed or non-blocking. Round 1 on
`efaf8b4`: MERGE WITH FIXES — 4 MED (all doc-register renumber misses),
2 LOW; all four absorbed in `07e79e9` with two further Codex governance
items, every absorb verified closed by this lane. RC-M5 arrived via the
Grok cross-check and survives at the head (verified there by this lane).
Zero runtime findings at any stage — Grok concurs ("no runtime/privacy
NO-GO"); the anti-oracle boundary holds at every layer probed: content,
module, host wiring, screen copy, and test pins. (The SR-side t3 facet
re-anchor finding SR-M2 lives in PR #94's diff and response; this stacked
branch inherits its fix through the SR merge.)

## Round-1 findings (increment `efaf8b4`) and their state

Round-1 context: the PR body's "renumber tables R1–R9 applied" was
contradicted at that tip on R5/R6, and the R9 sweep left survivors inside
its own file list. `8BALL.md` had renumbered fully clean. The Codex
cross-check (Lane 1) independently returned the identical set — two-lane
convergence, line-for-line. Root cause per the absorb record: the rename
tables ran on rebase conflict-hunk sides only, so cleanly-applied regions
escaped the sweep.

**RC-M1 — MED — `DOCTRINE.md:315` §5.F head read "(v0.50)" (packet R5
unapplied); v0.50 is SR's number.** ABSORBED in `07e79e9`, VERIFIED: now
`(v0.51)`. CLOSED.

**RC-M2 — MED — `DOCTRINE.md:319` claimed "key allow-list is unchanged
from v0.49" (packet R6 unapplied) — false baseline: the list equals SR's
v0.50 list (one key added vs v0.49).** The rider-1 code truth always held:
RC leaves `tests/privacy_scan.test.js` untouched, and
`tests/concordance.test.js` pins `ui/readings.js` key references to exactly
`['eight_ball_saved_readings_v1']`. ABSORBED, VERIFIED: now "unchanged from
v0.50". CLOSED.

**RC-M3 — MED — three stale "§1.H (concordance)" cross-references:
`DOCTRINE.md:326` (§6 layout — DOCTRINE.md was never in R9's sweep list),
`CLAUDE.md:54` and `README.md:62` (both "§1.H v0.50"; CLAUDE.md WAS in the
R9 list).** ABSORBED, VERIFIED: all three now §1.I (the CLAUDE/README sites
also v0.51); tip-wide sweep for `§1.H`-concordance / `Concordance (v0.50)` /
`unchanged from v0.49` tokens returns zero. CLOSED.

**RC-M4 — MED — `journal.md:28` stale duplicate empty header "…Saved
Readings MVP… doctrine v0.49 — STAGED" directly above the real v0.50
entry — union-merge artifact of the §4a rebase (the SR tip itself is clean
of it).** An empty header re-asserting the v0.49 double-claim in the truth
ledger is precisely what the renumber existed to clear. ABSORBED, VERIFIED:
line deleted, v0.50 entry intact. CLOSED. (Removing a merge artifact, not
editing an append-only historical entry.)

**Codex-lane additions, verified by this lane on the head:**
- **L2.1 — MED (Codex Lane 2; this lane read past it in round 1 —
  credited to Codex).** §1.I said entitlement state "is not an input to
  relation lookup" while conditioning the element axis on tier in the same
  paragraph — a real internal contradiction with the code truth
  (`buildConcordance` reads `options.tier`). ABSORBED, VERIFIED: the
  not-inputs list drops entitlement and a carve-out states the tier "is
  read once, solely to decide whether the five-element axis is included at
  all (§1.D entitlement), and never alters any axis's status or output" —
  exactly what `ui/concordance.js` does. CLOSED.
- **L2.2 — LOW (Codex Lane 2; round-1 this lane flagged the same item as
  out-of-scope main-side staleness).** DOCTRINE §1.H head still said
  STAGED post-#93. ABSORBED, VERIFIED: head now "(v0.49, controller
  override, SHIPPED #93)". The surviving "remains STAGED" at
  `DOCTRINE.md:523` sits inside the demoted v0.49 FOOTER bullet — L17
  lineage that carries its own explicit SHIPPED correction; by design.

**RC-M5 — MED — CLOSED (absorbed `b617faa` on explicit controller word;
verified) — `DOCTRINE.md:11`: §1's own authority index omitted
§1.I (Grok finding, relay run `20260720-021259-rc-tip`; verified by this
lane at head `07e79e9`).** The "Current free/paid composition
(authoritative)" paragraph enumerates "the §1.x clause family — §1.A
rising · … · §1.H t3 written-entry rotation" and its supremacy sentence
reads "where they disagree with §1.A–§1.H, the clauses win" — both end at
§1.H, so the newest clause sits outside its own section's authority list.
Same renumber class as RC-M3; the packet's R-tables never covered line 11
(as S7 never covered `agents/`) — Codex Lane 1 and this lane's round 1
both missed it; the third model caught it. **Fix as absorbed (`b617faa`):** the
clause-family enumeration now ends "· §1.H t3 written-entry rotation ·
§1.I registry + concordance." and the supremacy sentence reads "where they
disagree with §1.A–§1.I, the clauses win" — both spans verified in-tree;
suite 1290/1290; local PII audit clean; no test pins the range.

**RC-L1 — LOW, OPEN — `agents/controller.md`'s RC override line embeds the
operator's absolute home path (the `/Users/<login>/dev/8ball` form of
`~/dev/8ball`).** CI-legal — the PII scanner carries an exact
operator-handle pattern for that username, but `agents/controller.md` is in
`DOCTRINE_ALLOW` — and low-severity (LICENSE carries the operator's full
name deliberately; repo private; §11's boundary is tracked content
regardless). House style in tracked docs is the tilde form. Fix is one
word; non-blocking. Still present at head `07e79e9`. (This response
deliberately does not reproduce the literal path — this file is not in the
scanner's allow-list, by design.)

**RC-L2 — LOW, OPEN — `content/concordance.v1.js` strings sit under no
voice-register scan.** §7 stage-1 runs `BANNED_VOICE_REGISTER` over the
deck (v0.22) and meanings (v0.44); the registry is scanned by neither and
the §7 v0.51 test extension doesn't claim it. Today's strings are
register-clean (classical relation names with citations). Named follow-up:
extend the scan so `concordance.v2.js` inherits the gate.

**Merge-time notes (not defects at this head):** (a) the DOCTRINE footer
v0.50 bullet correctly says SR is "STAGED … requires the normal cross-model
doctrine audit before any merge" — true until #94 merges, stale after; flip
to SHIPPED per the v0.48/v0.49 stacking precedent when RC follows. (b) The
RC journal entry's verification block records the pre-rebase staging tree
(1255/1255, 35 files; head truth: 1290/1290, 36 files, verified twice by
this lane) — fold into the merge-time STAGED→SHIPPED flip.

## Rebase + absorb delta audit (`efaf8b4` → `ec991ad` → `07e79e9`)

The rebased feature commit `ec991ad` differs from the audited `efaf8b4` by
EXACTLY the inherited SR-M1 annotation line in `agents/controller.md` —
zero feature drift (tree-diff verified). The absorb `07e79e9` touches
DOCTRINE/CLAUDE/README/journal at precisely the finding sites plus the two
in-repo Codex artifacts; both artifacts grep scanner-clean (zero operator
tokens, zero labeled-DOB shapes). Full absorb diff read line-by-line; no
new stale tokens introduced (sweeps re-run at the head); no code, key,
network, or dependency surface touched at any point.

## Rider coverage (brief riders, RC half — final state at `07e79e9`)

1. **Allow-list unchanged in code** — PASS (see RC-M2; prose now names the
   correct v0.50 baseline).
3. **Anti-oracle boundary** — PASS at every layer. Comparators emit only
   `registered|unfiled` (never fabricate `adjacent`; the word appears only
   inside a registered trump-sequence citation and the status legend);
   every axis carries values + relation + named registry + citation +
   `recorded, not certified.`; same-value pairs unfiled — all pinned,
   including the anti-oracle regex pin
   (`/percent|score|forecast|advice|soulmate/i` banned from the serialized
   result). Element axis strictly tier-gated; free tier omits it AND
   discloses the omission. Screen shows saved titles only — no DOB anywhere
   on the concordance surface; no share control on that screen and
   `ui/share.js` untouched; selection is an in-memory `Set` pruned against
   valid ids; nothing in the compare path touches storage; failure catches
   to "saved entries were not changed." Full-increment grep for
   compatibility/score/rank/predict/forecast/advice/soulmate/% tokens:
   disclaimers and negative pins only. Registry inventory verified beyond
   the pins: 66 = C(12,2) sign pairs at distances 1–6; 33 registered animal
   pairs from liuhe(6)+chong(6)+sanhe(12)+hai(6)+xing(7) with overlap
   labels merged (snake+monkey pinned); 10 = C(5,2) element pairs each
   exactly one of sheng/ke with direction; 3 master links; 21 trump
   adjacencies (210 non-adjacent pinned unfiled). Tables frozen; §4
   versioned-not-edited honored (revisions require `concordance.v2.js`,
   stated in-file and in doctrine).
2. **§5.F retention** — PASS. No new key, schema field, pair history,
   cache, or share artifact; reload discards selection + result (pinned:
   `retention: 'transient'`, no-mutation, storage/network negative pins).
4. **Controller record** — PASS. RC override line version-token-free,
   scope-matches the footer (implement/verify/branch/local-commit only,
   expiry named). Style item RC-L1 only.
5. **Network/account invariants** — PASS. Zero network tokens;
   `package.json`/lockfile/`netlify.toml` untouched; §12 PERMANENT account
   ban literal, re-affirmed by §2 v0.51.
6. **Suite + PII** — PASS. Fresh suites by this lane: `efaf8b4` 1290/1290
   (36 files) AND head `07e79e9` 1290/1290 — matching CI. `index.html`
   1494/1500; `git diff --check` clean. PII grep over increment + absorb:
   RC-L1 is the only operator-linkable token (lane-A's "all
   domain-vocabulary" staging expectation otherwise confirmed); zero real
   identifiers, DOBs, emails, secrets.
7. **Renumber fidelity (R-tables + R9)** — round-1 FAIL → RC-M1…M4;
   PASS after absorb, verified at the head. Applied correctly from the
   start: R1–R4, R7, R8 (both halves), §1.I/§2/§7/content-version tokens,
   full 8BALL.md renumber.

## Verification of record

Round-1 suite 1290/1290 (36 files) on `efaf8b4` · head suite 1290/1290 on
`07e79e9` · CI green on PR #95 at audit time · increment +681/−28, 13
files · `core/` and `tests/fixtures.json` empty diff across the whole
stack · repo-shape pins (10 ui / 36 tests) passing.

## Cross-model routing (charter §5.E)

- **Codex** (spree cross-check, operator relay, artifacts in-repo on this
  branch): convergent finding set, absorb `07e79e9`, no dispute — its
  Lane 3 explicitly left the Claude-lane verdicts owed; this file closes
  that for #95.
- **Grok** (relay run `20260720-021259-rc-tip`, against the round-1
  increment with this lane's verdict inline; reconciled in-run, zero
  hallucinated findings): CONFIRMS RC-M1…M4 "at exact lines", both LOWs,
  and the zero-runtime claim (registered/unfiled only, no fabricated
  adjacent, qualifier always set, element omitted+disclosed at free,
  titles-only/no-DOB, no compare share, in-memory selection, fail-closed
  host catch, 66/33/10/3/21 pinned). ADDS RC-M5 (§1 authority index) and
  the journal-numbers detail folded into merge-time note (b). Its
  concurrence: MERGE WITH FIXES — "not SAFE TO MERGE until the
  renumber/version baseline is honest"; with M1–M4 absorbed in `07e79e9`
  and RC-M5 absorbed in `b617faa`, that set is now closed in full.

**Disposition:** RC-M5 absorbed and verified; this lane has no objection
to the merge word for #95 AFTER #94 merges (packet §1 order). Still open
and non-blocking: RC-L1 (one-word tilde-path fix, not worded), RC-L2
(named follow-up: voice-register scan over the registry strings);
merge-time notes (a)/(b) belong to the STAGED→SHIPPED flip at the
post-#94 rebase.

— Claude lane (Claude Code, worktree `sr-rc-audit-brief-b42e71`), 2026-07-19/20
