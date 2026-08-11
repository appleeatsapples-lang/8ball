# Cross-model pre-merge audit — REACH-CAPTION-UPGRADE-01

**PR:** #204 (this PR — the artifact only; the audited change is not in this repo)
**Filed:** 2026-08-12
**Authority:** controller word, dated 2026-08-11 and refined 2026-08-12 — *"standard
pre-merge review, file the verdict into audits/"*. Packet:
`~/8ball/sessions/packet_reach_caption_upgrade_2026-08-11.md`.
**Lanes:** codex (gpt-5.6-sol) + grok, independent, reconciled by the implementing seat.
**Outcome:** both lanes found real defects. All confirmed findings fixed and pinned with
tests before this artifact was filed. **Not a merge authorisation** — the reach/ change
stays gated, and arming is a separate tap after merge.

---

## 0. What was audited, and the one thing this artifact cannot claim

The change lives in `~/8ball/reach/`, which is **not under Git**. There is no branch,
no PR and no CI for it. To produce a reviewable diff, the implementing seat built a
scratch repo with a reconstructed before-state and the current after-state.

That reconstruction was **verified, not assumed**: the complete pre-change test suite
passes on the baseline commit, including `test_caption_rail`'s *original* union
assertion — which fails outright if the new caption files are present. The diff is
exactly the 16 touched files (+2556 / −74).

What this artifact cannot claim: that the reviewers saw the live vault tree. They saw a
faithful copy. One codex finding (C1 below) is an artifact of that copy.

---

## 1. Verdicts as returned

| Lane | Verdict | Findings |
|---|---|---|
| grok | APPROVE WITH FIXES | 1 HIGH, 1 MEDIUM, 2 LOW |
| codex | BLOCK | 4 HIGH, 5 MEDIUM, 1 LOW |

The two lanes overlapped on almost nothing. grok's HIGH was invisible to codex; codex's
four HIGHs were invisible to grok. That divergence is the argument for running both.

Both lanes independently cleared the same two categories, in the same terms:

- **Caption rail and budget — no defect.** 623/623 rows in each file pass the exact
  final-line card-link contract; X peaks at weighted 280, the shared file peaks at 480
  linked characters against a 500 cap. No forbidden token, second link, bare domain,
  non-ASCII letter or U+00D7 in either file. grok additionally measured that 476/623
  rows of the wider file would fail X's budget — i.e. the cross-wiring guard is not
  decorative.
- **Random draw — no runtime defect.** Fired exclusion, finite permutation, dedupe,
  skip-without-burning, one claim per slot, and PENDING-before-network ordering all
  preserved. X's new skip-and-redraw does not touch the PENDING duplicate-safety
  machinery: selection is side-effect free and the claim still happens in `main()`
  after a code is chosen.
- Both lanes judged the `test_caption_rail.py` rewrite (union-vs-X → per-reader-vs-own-cap)
  a **genuine improvement, not a weakening**. codex noted the old form only ran its
  500-cap check when `len <= 500`, so it skipped exactly the overlength captions it
  appeared to cover.

---

## 2. Findings, dispositions, fixes

### CONFIRMED AND FIXED

**F1 · grok HIGH — all twelve animal cards published as private-only on X.**
`gen_captions_interpretation.py`. The budget fill takes rows in priority order and skips
any that will not fit. The public-animal clause is the longer of the pair, so on X's
tighter budget it was dropped and the private clause behind it was kept — filing every
year animal as a month animal, on one surface only. Verified on disk before fixing: 12/12
X rows private-only, 12/12 wider rows correct.
*Fix:* one dual-role clause, ahead of the branch row, so the pair cannot be split.
*Pinned by:* `test_no_animal_card_is_published_as_private_only`,
`test_every_animal_card_states_the_year_role_first`.

**F2 · grok MEDIUM — bare sign cards asserted as rising signs.**
Every `s*` card carried the rising gloss ("eastern horizon at the exact birth time and
place"). A bare sign card is the sign; the sheet carries a sign in two roles, and
`coordinate_invariant()` does not run on catalog cards, so nothing caught the overclaim.
*Fix:* replaced with a neutral line naming both roles without asserting either.
*Pinned by:* `test_no_bare_sign_card_is_asserted_as_a_rising_sign`.

**F3 · codex HIGH — master numbers called reduced digits.**
11, 22 and 33 carry ", master" in their own canonical label, and the generated caption
called each "a reduced digit" immediately before printing that label — a caption
contradicting itself, already queued for all four surfaces.
*Fix:* master numbers titled as such; the reduce-clause reworded for them.
*Pinned by:* `test_master_numbers_are_not_called_reduced_digits` plus a companion test
that non-masters still read as reduced digits.

**F4 · codex HIGH — the extended-specimen guard ignored dates that exist on disk.**
The guard accepted a specimen's year animal *or* the preceding year's, unconditionally,
to allow for the lunar new year. codex found that exact dates are recoverable: the
manifest's `source` field carries the render's origin filename, and the staged batch
directories carry the same shape. 85 extended specimens have a real date.
*Fix:* where a date is known and the month is March or later — past any possible lunar
new year — the year animal is now pinned exactly. January and February stay honestly
ambiguous, because no new-year table exists here and this file will not invent one.
*Measured effect:* the previous-year animal is now **rejected on 71** specimens where it
was formerly accepted; 14 remain ambiguous by nature.
*Pinned by:* `test_an_exact_recorded_date_pins_the_year_animal_exactly`,
`test_a_january_birth_stays_honestly_ambiguous`.

**F5 · codex HIGH — the guard never inspected sun, rising or private at all.**
For extended specimens only the public animal was checked, so a reversed arrow pair
would publish reversed sun/rising claims and pass.
*Fix:* where the date is known, the stated sun sign is checked against the product's own
`SUN_SIGNS` table (transcribed from `core/profile.js`, guard-only — nothing derived from
it is ever published), with a one-day cusp tolerance.
*Measured effect:* an arrow-pair reversal is now caught on **71 of 84** dated specimens
with distinct sun and rising.
*Pinned by:* `test_an_exact_recorded_date_catches_a_reversed_arrow_pair`.

**F6 · codex MEDIUM — the pair-reversal test was not a reversal.**
Its fixture was dragon⇄dragon, where swapping is a no-op; it then injected an unrelated
wrong animal, proving only that a wrong first animal breaks the numeral.
*Fix:* rewritten on no. cxii (capricorn, rabbit/rat), where 9×12+3+1 = 112 holds only if
the rabbit is read as the public animal. Both directions asserted.

**F7 · codex MEDIUM — the newline test was tautological.**
`parse()` splits the file into physical lines, so a caption it returns can never contain
a newline. The assertion could not fail. Worse, the generator had no newline guard at
all — the shared rail permits `\n`, so nothing anywhere would have caught a wrapped
caption, which every line-based reader silently truncates.
*Fix:* the assertion now runs on the raw file and rejects continuation lines; the
generator refuses to compose a multiline caption at all.
*Pinned by:* `test_the_generator_refuses_to_emit_a_multiline_caption`.

**F8 · codex MEDIUM — the fallback test was tautological.**
It asserted every old code is served, but the new source covers all 623, so a reader
that dropped every fallback file would pass.
*Fix:* each reader is now driven with the new source hidden and must return the old
captions. Verified by mutation: dropping the fallback files from either reader fails.

**F9 · codex MEDIUM — no test enforced copy law.**
The rail refuses links, offer tokens, the product name and non-ASCII *letters*. It says
nothing about U+00D7, second person, prediction or CTA — so "copy law honored" was an
unenforced comment.
*Fix:* new `CopyLawTests` covering ASCII-x, second person, prediction/advice verbs, CTA
vocabulary and lowercase register. The second-person check allows exactly one documented
reading — `you` is also the pinyin for the rooster branch, which arrives from concordance
card data (grok's LOW finding, independently useful here).

**F10 · codex LOW — `unittest.main()` sat above the newly appended test classes.**
Confirmed: direct execution ran 56 tests, `-m unittest` ran 65. Nine new tests silently
skipped on direct run.
*Fix:* guard moved to end of file. Both invocations now run 65.

**F11 · codex MEDIUM — "skipped code is not consumed" overclaimed.**
It calls a stateless selector twice; it cannot speak to ledger or PENDING behaviour.
*Fix:* renamed and re-scoped to what it actually proves, pointing at the tests that do
cover the claim path.

### NOT A DEFECT

**C1 · codex HIGH — "`share_assets/.../concordance_data.py` is absent; regeneration
fails and six tests error."**
An artifact of the review corpus, not of the tree. The scratch repo contained `reach/`
only, and that module lives one level up at `~/8ball/share_assets/`. It is present in
the live vault (20,532 bytes) and the generator runs clean against it.
**Kept as a real observation:** the generator and its coordinate tests depend on a path
*outside* `reach/`, so the suite is not self-contained and would break if `reach/` were
relocated. Recorded, not fixed — fixing it means moving or vendoring product data, which
is outside this packet's scope.

### RESIDUAL, ACCEPTED

- 243 of 328 extended specimens still have no recoverable date, so their guard remains
  the ±1-animal form and their arrow pair is unpinned. Mitigated: numbered specimens
  pin the coordinate order by numeral arithmetic, dated extended specimens now pin it by
  date, and all three shapes share one parser — a systematic reversal would fail the
  pinned ones loudly.
- January/February dated births stay ambiguous by design (no lunar-new-year table).
- Instagram and TikTok (2200) read the file budgeted to Threads' 500 and could carry
  richer copy. Deliberate: two tiers and one composer, versus three tiers and more drift
  surface. Reversible.

---

## 3. Verification recorded at write time

Run by the implementing seat on the live vault tree, this date. Recorded here because a
reviewing lane cannot execute this repo's tests, so its verdict carries a live-green-run
pre-condition that these runs satisfy.

- **Full reach suite green** after clearing `__pycache__`: `test_caption_rail` (46),
  `test_postpeer_catalog` (50), `test_postpeer_recovery`, `test_queue_draw` (13),
  `test_captions_interpretation` (38), `test_drift_check`,
  `test_post_tiktok_postpeer` (48), `test_stage_tiktok`, `test_post_x` (65).
- **Every new assertion was run against deliberately broken code.** 27 mutations across
  two rounds, all caught by the intended test: draw without shuffle, draw ignoring its
  rng, fired filter dropped, dedupe dropped, each of X's four pre-flight skips made
  fatal again, X wired to the wrong budget file, the source dropped or layered first in
  each reader, generator emitting title-only copy, and — after the fixes above — each
  repaired claim reverted one at a time.
- **Two mutation results were initially wrong, and are recorded because they change how
  much the rest is worth:**
  1. A size-identical mutation (moving one line within a list) read as caught-then-restored
     while a stale `.pyc` was still loading — bytecode validation is (mtime, size) and the
     restore landed in the same second. Every result was re-taken with `__pycache__`
     cleared between runs.
  2. `test_an_exact_recorded_date_pins_the_year_animal_exactly` initially **passed for
     the wrong reason**: its fixture's sun sign disagreed with the recorded date, so the
     new sun check fired before the animal check ran. Only the mutation exposed it. The
     fixture now matches the date, and removing the date guard fails the test.
- **Read-only end-to-end on live queues and ledgers**, no lock taken, nothing written:
  X 89 unfired / 80 distinct first-draws over 200 runs / 0 pre-flight skips / captions
  268 of 280 weighted; Threads 453 of 500; Instagram 454 of 2200. A sequential walk
  returns 1 distinct first-draw.

---

## 4. Standing

Build and verification complete. **Merge of the reach/ change is not authorised by this
artifact**, and arming — moving the new captions and selection into the live queues —
remains a separate tap after merge.
