# calc v3.1 — pre-1929 civil-offset correction: evidence record

**This is NOT a verdict.** It is the implementer lane's evidence packet for the
cross-model audit that DOCTRINE §10 and the CLAUDE.md don't-do list require
before anything touching `DOCTRINE.md` — and this change touches both
`DOCTRINE.md` and the calculation core. It exists so a reviewer does not have
to re-derive the finding from scratch, and to satisfy §8's audit-artifact gate.
An L48 override would be the wrong instrument here.

## The defect

`core/calendar.js` resolved every lunar-year and solar-term cusp at a flat
UTC+8 (`SHANGHAI_OFFSET_HOURS = 8`) across the whole 1900–2100 table. China
kept Beijing local mean time — UTC+7:45:40, from 116°25′E — until China
Standard Time was adopted in 1929, and the Chinese calendar is reckoned in the
civil time of its own era. An event landing in the first ~14 minutes after
midnight UTC+8 therefore got filed one day late.

DOCTRINE §3's calc v2 note states the flat-UTC+8 choice openly ("evaluated at
date-precision in canonical Asia/Shanghai timezone (UTC+8)"). What was never
measured is what it costs. It costs four dates.

## How it surfaced

Not by inspection. `tests/calendar.test.js` (shipped in #132) cross-checks
`lunarNewYearDate` against ICU's Chinese calendar for all 201 years in range
and records the disagreements rather than smoothing them. That left four
recorded, unresolved: 1916, 1954, 2027, 2030. Resolving them is what found the
bug.

## Evidence

Three independent implementations, installed from PyPI in the authoring
container and used only as oracles:

| source | kind |
|---|---|
| `sxtwl` (寿星万年历) | independent astronomical implementation |
| `lunardate` | table-based |
| `borax` | table-based |

They agree with each other on **every year 1900–2050** — zero internal
disagreements. Against them:

| year | calc v2 (UTC+8) | ICU | sxtwl / lunardate / borax | who was wrong |
|---|---|---|---|---|
| 1916 | Feb 4 | Feb 3 | **Feb 3** | **ours** |
| 1954 | Feb 3 | Feb 4 | **Feb 3** | ICU |
| 2027 | Feb 6 | Feb 7 | **Feb 6** | ICU |
| 2030 | Feb 3 | Feb 2 | **Feb 3** | ICU |

Three of the four recorded divergences were ICU's error. The fourth was ours.

The offset is the mechanism, and the test is decisive: across 1900–2100 only
**two** years are offset-sensitive at all, 1916 and 2030. A flat UTC+8 gets
2030 right and 1916 wrong; a flat UTC+7:45:40 does the exact reverse. Neither
constant is correct — the era-dependent rule is, and it is not a fitted
parameter but the documented history.

Sweeping the corrected implementation against the oracles:

- 1900–2050 vs all three libraries: **0 mismatches**
- 2051–2100 vs `sxtwl`: **0 mismatches**

Before the change the same sweep reported exactly one mismatch (1916).

## Blast radius, measured not estimated

Both functions were run for every year 1900–2100, before and after:

- **`lunarNewYearDate`** — one change: **1916, Feb 4 → Feb 3**.
- **`monthAnimalSolarTerm`** — three changes, all pre-1929, each one day
  earlier: **1911 lixia** (May 7 → 6), **1912 xiaohan** (Jan 7 → 6),
  **1927 bailu** (Sep 9 → 8). All three remain inside the canonical jieqi
  windows the test file pins.
- Nothing at or after 1929 moves.

Downstream: only `animal` (year pillar), `chineseElement`, and `innerAnimal`
(month pillar) for pre-1929 births. The user-visible defect is that a
**1916-02-03 birth was filed as rabbit instead of dragon**. Numerology, sun
sign, rising sign, birth card, day/hour pillars and the catalog index are
untouched. No stored reading needs migration: only reconstruction inputs
persist, and derived values recompute on open.

## What changed

- `core/calendar.js` — `BEIJING_LMT_HOURS` added; `jdeToShanghaiDate` selects
  the era's offset by comparing the JDE against JD(1929-01-01). The comparison
  is in JD so it cannot recurse through the date conversion, and 1929-01-01 is
  nowhere near a boundary case under either offset.
- `tests/fixtures.json` — two pre-1929 boundary cases added per §3 step 1:
  `1916-02-02 → rabbit` (previous lunar year) and `1916-02-03 → dragon`
  (the corrected cusp). All 25 fixtures re-verified against `core/profile.js`.
- `tests/calendar.test.js` — 1916 leaves `ICU_DIVERGENCES` (it now agrees with
  ICU) and gains an explicit regression pin to `[2, 3]`, so a silent return to
  Feb 4 fails loudly. The remaining three entries are the years where ICU is
  the one in error.
- `DOCTRINE.md` — §3 calc v3.1 note, version history line, version header.

Suite: **43 files / 1500 tests green.**

## What a reviewer should press on

1. **The 1929 threshold.** Implementations differ on the exact transition;
   some use 1928. If the correct boundary is 1928, nothing in the 1900–2100
   range moves (no offset-sensitive date falls in 1928), so this change is
   robust to that disagreement — but the constant should still be right.
2. **The oracles are third-party libraries, not the named authority.** DOCTRINE
   §3 names the Hong Kong Observatory tables. `hko.gov.hk` is blocked by the
   implementing environment's egress policy (403 on CONNECT from the proxy;
   the proxy README forbids retrying policy denials). Three-library unanimity
   is a strong substitute and their agreement on 151 consecutive years is not
   plausibly coincidental — but it is a substitute. **Re-confirm 1916, 1954,
   2027 and 2030 against HKO from an environment that can reach it.**
3. **The solar-term changes are unpinned by fixtures.** 1911/1912/1927 move,
   and no fixture covers them; they are asserted only by the jieqi-window
   test, which is satisfied either way. If the reviewer wants them pinned,
   that is a fixture addition, not a code change.
4. **This lane wrote both the change and its evidence.** The oracles are
   independent; the framing is not.
