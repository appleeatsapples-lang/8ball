# CODEX RETROACTIVE AUDIT PACKET — PR #140 (calc v3.1: era-correct cusp offset) — 2026-07-29
#
# Fire line (from any terminal):
#   cd ~/dev/8ball && git checkout main && git pull && \
#   ~/ai-relay/relay --models codex --base 8b51c38^ \
#     "$(cat audits/codex_pr140_retroactive_audit_2026-07-29_brief.md)"
#
# NOTE — the base is `8b51c38^`, NOT `origin/main`. This is a RETROACTIVE audit:
# #140 is already merged, so `--base origin/main` yields an empty diff and the
# auditor sees nothing under review. `8b51c38` is #140's squash and its parent is
# `521b19a`, so the range isolates exactly this change with no unrelated work in
# it. Equivalent without the relay: `git show 8b51c38`.
#
# The verdict files as
# audits/codex_pr140_retroactive_audit_2026-07-29_response.md — the
# `retroactive_audit` shape, deliberately outside the l48-gate predicate so it
# cannot green any gate. Save it verbatim per agents/auditor.md procedure 1.
#
# The packet below is self-contained and does not require the diff. The base is
# given so the auditor can re-derive rather than trust the inlined copy.

## Why this is `retroactive_audit` and not `premerge_audit`

**PR #140 is already merged and live on production** (squash-merged to `main`
as `8b51c38`, 2026-07-29). It shipped on an explicit controller override
(`audits/L48_override_pr140_2026-07-29.md`, L48 sighting #12) with **no
cross-model read**, on a change that touches both the calculation core and
`DOCTRINE.md` — the case DOCTRINE §10 and the CLAUDE.md don't-do list name as
requiring one. That override recommended commissioning the read after merge if
it was not run before. This packet is that commission.

The filename deliberately uses `retroactive_audit`, matching the #103
precedent, **not** the `premerge_audit` shape. That is not cosmetic: the
`l48-gate` predicate accepts only `<model>_pr<N>_premerge_audit_<date>_response.md`
or an override, so a response filed against this brief **cannot** retroactively
green any gate. It has no power to launder the merge that already happened. Its
only product is a verdict on whether the shipped calculation is correct.

**This means your verdict cannot block a merge. It can only tell the controller
whether something already serving users is wrong.** Revert is two lines. Say so
plainly if it is warranted.

## Who you are and what this is

You are an independent auditor for PR #140 of the 8ball repository. Everything
you need is inlined below — assume no filesystem access and re-derive every
claim yourself. Rules that bind this audit:

- READ-ONLY. No edits, commits, pushes, or fixes. Verdicts, not patches.
- Do not soften severity to be polite. Adversarial is the value.
- The implementing lane wrote the change, its evidence packet, its clearance,
  **and this brief**. Treat the framing below as an interested party's account.
  The numbers are reproducible; the emphasis is not neutral.

## Context — the defect that was fixed

`core/calendar.js` computes lunar-new-year and solar-term (jieqi) cusps via
Meeus astronomical algorithms, then converts the resulting instant to a
Gregorian date in Chinese civil time. It used a flat `UTC+8` for the whole
1900–2100 table.

China kept **Beijing local mean time (UTC+7:45:40, from 116°25′E)** until China
Standard Time was adopted in **1929**, and the Chinese calendar is reckoned in
the civil time of its own era. A cusp landing in the first ~14 minutes after
midnight UTC+8 was therefore filed one day late.

The user-visible defect: a **1916-02-03 birth was filed as rabbit**; it should
be **dragon**.

## How it surfaced

`tests/calendar.test.js` (shipped earlier, in #132) cross-checks
`lunarNewYearDate` against ICU's Chinese calendar (`en-u-ca-chinese`) for all
201 years and *records* disagreements rather than smoothing them. Four were on
record unresolved: **1916, 1954, 2027, 2030**. Resolving them found the bug.

## THE DIFF — `core/calendar.js` (the only source file changed)

```diff
 const SHANGHAI_OFFSET_HOURS = 8;
+// China kept Beijing local mean time (UTC+7:45:40, from 116°25′E) until China
+// Standard Time was adopted in 1929, and the Chinese calendar is computed in
+// the civil time of its own era. Evaluating every year at UTC+8 places a new
+// moon or solar term landing in the first ~14 minutes after midnight one day
+// late. Across 1900–2100 that is four dates: lunar new year 1916 (the visible
+// defect — a 1916-02-03 birth was filed under the previous year's animal) and
+// three pre-1929 solar terms (1911 lixia, 1912 xiaohan, 1927 bailu).
+const BEIJING_LMT_HOURS = 7 + 45 / 60 + 40 / 3600;
 const RANGE_MIN = 1900;
 const RANGE_MAX = 2100;
```

```diff
 function jdeToShanghaiDate(jde) {
-  const jdShanghai = jde + SHANGHAI_OFFSET_HOURS / 24;
+  // The era's own civil offset, not a constant — see BEIJING_LMT_HOURS. The
+  // threshold is compared in JD so it cannot recurse through this function,
+  // and 1929-01-01 is nowhere near a boundary case in either regime.
+  const offsetHours = jde < gregorianToJD(1929, 1, 1)
+    ? BEIJING_LMT_HOURS
+    : SHANGHAI_OFFSET_HOURS;
+  const jdShanghai = jde + offsetHours / 24;
   const Z = Math.floor(jdShanghai + 0.5);
```

That is the entire source change: one added constant, one conditional.

## Surrounding source you need (unchanged by this PR)

```js
// Gregorian date → JD at 00:00 UT (midnight). Meeus ch 7.
function gregorianToJD(year, month, day) {
  let Y = year, M = month;
  if (M <= 2) { Y -= 1; M += 12; }
  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (Y + 4716))
       + Math.floor(30.6001 * (M + 1))
       + day + B - 1524.5;
}

// JDE → calendar date in Asia/Shanghai (UTC+8). Meeus ch 7.
// For 1900–2100 the TT−UT delta is < 70 s; treating JDE as JD-UT only
// affects the date for events within ~minute of midnight Shanghai. The
// LNY and solar-term sanity-lock dates in DOCTRINE §3 are the calibration.
function jdeToShanghaiDate(jde) { /* ... as diffed above ... */ }
```

`newMoonJDE(k)` implements Meeus ch 49 (true new moon, periodic + 14 planetary
corrections) and returns a **JDE (TT-based)**. `solarLongitude(jde)` implements
Meeus ch 25 "low accuracy" (better than ~0.01° for 1900–2100).

**Every date-producing path funnels through `jdeToShanghaiDate`.** Call sites:

| line | caller | role |
|---|---|---|
| 228 | `monthAnimalSolarTerm` | the returned jieqi date |
| 238, 240 | `newMoonContaining` | walks lunations to bracket a date |
| 256 | `monthHasZhongqi` | **leap-month determination** |
| 275, 277 | `lunarNewYearDate` | winter-solstice anchors |
| 290, 291 | `lunarNewYearDate` | month-start scan for the leap rule |
| 300 | `lunarNewYearDate` | the returned LNY date |

This matters for hook 3 below: the offset does not merely round the final
answer, it feeds the **leap-month rule**, so in principle it could move lunar
new year by a whole month rather than a day.

## THE DIFF — tests and doctrine

`tests/fixtures.json` — two cases added (per DOCTRINE §3, fixtures move first):

```json
{ "label": "Pre-1929 LNY boundary: day before, previous lunar year animal",
  "dob": "1916-02-02", "expected": { "animal": "rabbit" } },
{ "label": "Pre-1929 LNY boundary: 1916 new year is Feb 3 under Beijing LMT, not Feb 4",
  "dob": "1916-02-03",
  "expected": { "sunSign": "aquarius", "animal": "dragon", "lifePath": 4 } }
```

`tests/calendar.test.js` — 1916 removed from `ICU_DIVERGENCES`, plus a pin:

```js
const ICU_DIVERGENCES = {
-  1916: { ours: [2, 4], icu: [2, 3] },
   1954: { ours: [2, 3], icu: [2, 4] },
   2027: { ours: [2, 6], icu: [2, 7] },
   2030: { ours: [2, 3], icu: [2, 2] },
 };

+it('1916 lands on Feb 3 — the pre-1929 Beijing-LMT correction', () => {
+  expect(lunarNewYearDate(1916)).toEqual([2, 3]);
+});
```

`DOCTRINE.md` — new §3 algorithm-version entry `calc v3.1`, version history
line, doctrine version header → v0.57. Full text of the calc v3.1 note:

> **calc v3.1** (v0.57, 2026-07-29) — Lunar-year and solar-term cusps are
> resolved in the civil time of their own era: Beijing local mean time
> (UTC+7:45:40) before China Standard Time was adopted in 1929, UTC+8 from 1929
> on. […] Across the 1900–2100 table range that is four dates: lunar new year
> **1916 (Feb 4 → Feb 3)**, and three solar terms — 1911 lixia, 1912 xiaohan,
> 1927 bailu — each moving one day earlier. […] Verified against three
> independent implementations — sxtwl (寿星万年历, astronomical) and the
> table-based lunardate and borax […] **The Hong Kong Observatory tables named
> under calc v2 could not be reached from the implementing environment (egress
> policy blocked `hko.gov.hk`); the three-library consensus stands in for them
> and should be re-confirmed against HKO when an operator can reach it.**

For reference, the **calc v2** note this supersedes described the old behavior
openly: *"evaluated at date-precision in canonical Asia/Shanghai timezone
(UTC+8)"*. The choice was documented; what was never measured is its cost.

## What the PR claims

1. **Oracles.** `sxtwl` (astronomical), `lunardate`, `borax` (both table-based),
   installed from PyPI in the authoring container, used only as oracles. They
   agree with **each other** on every year 1900–2050 — zero internal
   disagreements.

2. **Who was wrong, per those oracles:**

   | year | calc v2 (UTC+8) | ICU | sxtwl / lunardate / borax | wrong |
   |---|---|---|---|---|
   | 1916 | Feb 4 | Feb 3 | **Feb 3** | **ours** |
   | 1954 | Feb 3 | Feb 4 | **Feb 3** | ICU |
   | 2027 | Feb 6 | Feb 7 | **Feb 6** | ICU |
   | 2030 | Feb 3 | Feb 2 | **Feb 3** | ICU |

3. **Not a constant swap.** Across 1900–2100 only **two** years are
   offset-sensitive at all: 1916 and 2030. Flat UTC+8 gets 2030 right and 1916
   wrong; flat UTC+7:45:40 does the exact reverse. Neither constant works; the
   era-dependent rule is claimed to be documented history, not a fitted
   parameter.

4. **Post-change sweep.** 1900–2050 vs all three libraries: 0 mismatches.
   2051–2100 vs sxtwl: 0 mismatches. Before the change the same sweep reported
   exactly one mismatch (1916).

5. **Blast radius, claimed measured across all 201 years.**
   `lunarNewYearDate`: one change (1916 Feb 4 → Feb 3).
   `monthAnimalSolarTerm`: three changes, all pre-1929, each one day earlier
   (1911 lixia, 1912 xiaohan, 1927 bailu), all still inside the canonical jieqi
   windows the test file pins. Nothing at or after 1929 moves.

6. **Downstream:** only `animal` (year pillar), `chineseElement`, and
   `innerAnimal` (month pillar), for pre-1929 births. Numerology, sun sign,
   rising sign, birth card, day/hour pillars and the catalog index untouched.
   No stored reading needs migration — only reconstruction inputs persist and
   derived values recompute on open.

7. **Suite:** 43 files / 1500 tests green at the merge (1504 on `main` now,
   after two later unrelated PRs).

## Adversarial checklist

### 1. The 1929 threshold — asserted, not derived
The constant is `gregorianToJD(1929, 1, 1)`, stated on the implementing lane's
authority and **not checked against a primary source**. Some implementations
place China Standard Time adoption at **1928**. The PR argues this is immaterial
(no offset-sensitive date in 1900–2100 falls in 1928, so the output table is
identical either way). **Verify both halves**: that the historical date is what
the code says, and that the immateriality claim holds. If the true transition is
1928, is shipping 1929 acceptable, or is a correct-but-inert constant still a
defect?

### 2. The LMT value itself
`BEIJING_LMT_HOURS = 7 + 45/60 + 40/3600` = 7.76111h, from 116°25′E.
Check: (a) the arithmetic (116.4167° / 15 = 7.7611h — does it round to 45′40″?);
(b) whether 116°25′E is the right meridian for the *calendar* rather than for the
city; (c) whether the pre-1929 Chinese calendar was in fact reckoned at Beijing
LMT for the **whole** 1900–1928 window, given the 1912 republican transition and
the earlier Shixian system. A single flat pre-1929 constant may itself be an
era-flattening of the same kind the PR is fixing.

### 3. Leap-month determination — the whole-month risk
The offset feeds `monthHasZhongqi` (line 256), which decides leap months, and
the month-start scan in `lunarNewYearDate` (lines 290–291). A changed leap
determination would move lunar new year by a **month**, not a day. The measured
sweep reports only one LNY change in 201 years, which is empirical evidence
this did not happen — but confirm the reasoning holds in general, and that the
sweep would have detected it if it had.

### 4. ΔT (TT−UT) is not applied at all — **and this brief has a finding**
`newMoonJDE` and `solarLongitudeCrossingJDE` return **JDE (TT)**. Civil time is
UT = TT − ΔT. `jdeToShanghaiDate` adds the civil offset **without** subtracting
ΔT, so every cusp is placed ΔT *later* than truth — the same failure direction
as the bug this PR fixed, just smaller.

The in-source comment (unchanged by this PR, inherited from calc v2) asserts:
> *"For 1900–2100 the TT−UT delta is < 70 s"*

**That bound is wrong at the back of the range.** Using the standard
Espenak/Meeus ΔT fit: ~64 s at 2000, ~90 s at 2047, ~168 s at 2085, ~196 s at
2097. The stated 70 s holds only to roughly 2005.

The implementing lane measured the consequence and found:

- Of **2613** cusp instants in 1900–2100, **six** sit closer to local midnight
  than ΔT at their year: 2047 term1 (11.7 s), 2085 term11 (26.5 s), 2084 term4
  (37.8 s), 2055 term4 (44.3 s), 2097 term3 (47.5 s), 2045 term5 (50.1 s).
- Applying ΔT changes exactly **one** date: **2084 term4 (mangzhong), June 5 →
  June 4**.
- **Mitigation:** future DOBs are rejected (v0.3.0 fix B,
  `tests/dob_validation.test.js`), so 2084 is unreachable as a birth date today.

**Press on this.** Is the ΔT omission acceptable given it is currently
unreachable, or is a knowingly-wrong-in-2084 table a defect to fix now while the
surrounding code is fresh? Does the inaccurate `< 70 s` comment need correcting
regardless, since it is the stated basis a future reader would rely on? And
check the arithmetic above — the ΔT model used for 2050+ is an extrapolation,
and a different projection would shift which cusps are implicated. Note also
that the PR's clean 2051–2100 sweep against sxtwl does **not** clear this: with
margins this tight, a clean sweep is consistent with sxtwl making the same
simplification, or with luck.

### 5. Oracle independence is overstated
The PR says "three independent implementations." `sxtwl` is an astronomical
implementation and genuinely independent. `lunardate` and `borax` are both
table-based and **may share a table lineage**; the implementing lane did not
establish which, and recorded that caveat in the override. Their perfect
agreement is consistent with independence *or* common ancestry.

Consequence to check: **1916 (the year actually changed) has ICU agreeing too**,
giving three distinguishable lineages. The three years left **unchanged** (1954,
2027, 2030) rest on fewer, since ICU is the outlier there. **The change is better
evidenced than the decisions not to change.** Judge whether keeping 1954/2027/
2030 as recorded divergences is adequately supported.

### 6. The named authority was never consulted
DOCTRINE §3 names the **Hong Kong Observatory** tables as the calibration source
for exactly these values. `hko.gov.hk` was blocked by the implementing
environment's egress policy (403 on CONNECT at the proxy; its README forbids
retrying policy denials). Every number rests on substitutes. If you can reach
HKO, **re-confirm 1916, 1954, 2027 and 2030** — that is the single most valuable
thing this audit can produce.

### 7. Three solar-term changes are unpinned by fixtures
1911 lixia, 1912 xiaohan and 1927 bailu move, and **no fixture covers them**.
They are constrained only by the jieqi-window test, which passes under both the
old and new values. A future regression on those three would be silent. Judge
whether that is an acceptable gap or a fixture addition.

### 8. §3 breaking-change contract compliance
DOCTRINE §3 requires: fixtures first → algorithm → `npm test` → calc-version
note. Verify the diff is consistent with that order and that the two new
fixtures actually discriminate (i.e. `1916-02-02 → rabbit` and
`1916-02-03 → dragon` fail under the old code and pass under the new).

### 9. Doctrine parity
Does the calc v3.1 note describe what the code does? Check the four claimed
dates against the claim "nothing at or after 1929 moves", the version-history
line, and the version header → v0.57. Note the header text still contains
`STAGED on claude/calendar-pre1929-lmt-fix` and *"a cross-model audit is
REQUIRED before merge"* — that language shipped and is now stale relative to
the merge. Flag it if it is a doctrine-truth defect.

### 10. Migration claim
"No stored reading needs migration, because only reconstruction inputs persist
and derived values recompute on open." Verify that a reading persisted before
this change and reopened after it silently changes its displayed animal for a
pre-1929 DOB — and judge whether *silent* is the right behavior for a value a
user may have seen, screenshotted, or shared.

## Required output shape

- Line 1: `Verdict: CORRECT AS SHIPPED` | `CORRECT WITH FOLLOW-UPS` | `DEFECTIVE — REVERT` | `DEFECTIVE — FIX FORWARD`
- Findings table: # | High/Med/Low | finding | evidence
- Per hook 1–10: severity `PASS / P3 / P2 / P1 / P0`, evidence, reasoning,
  recommendation.
- Then: the exact commands or sources you used and what they returned.

Zero findings is acceptable only after you actually ran the checks. If you
cannot verify something (no network, no Python, no HKO access), **say which
hook you could not verify** rather than passing it.

## Disclosure

This brief was written by the same lane that wrote PR #140, its evidence packet
(`audits/calc_v3_1_pre1929_offset_evidence_2026-07-29.md`) and its override
(`audits/L48_override_pr140_2026-07-29.md`). No second model has read any of it.
The ΔT finding in hook 4 is that lane auditing its own merged work and is
offered as a starting point, not a settled result — verify it like everything
else here.
