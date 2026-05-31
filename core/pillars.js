// 8ball / core / pillars.js — day-pillar + hour-pillar coordinates (calc, build A)
//
// Pure functions. No DOM, no globals, no I/O. Computes the day and hour
// pillars of the Chinese sexagenary (干支) system: a heavenly stem (天干)
// + earthly branch (地支) pair for each. These are NEW coordinates that
// the engine did not compute before — additive content, gate-light, no
// surface change this cycle (the fields are inert on the free card; see
// brief cc_brief_pillars_module_2026-05-31 §7 and DOCTRINE §1.D-future).
//
// SCOPE (v1): day pillar + hour pillar ONLY. Year/month rigorous stems,
// moon sign, extra tarot, derived numbers are explicit follow-on modules
// (brief §8). This module does NOT touch the free simplified year-element
// (getChineseElement) nor the year/month animals (getAnimal / getInnerAnimal),
// and never enters the catalog driver (getCard / resolveBracket) — pillars
// are data/surface-only per DOCTRINE §1.
//
// Catalog driver remains (sunSign, animal). Like §1.A rising and §1.C tarot,
// these pillars add coordinates, they do not branch the card layer.
//
// ── Reuse: the 12 earthly branches map 1:1 to the 12 zodiac animals, anchored
// branch index 0 = 子 (Rat). We REUSE the canonical ANIMALS array from
// profile.js rather than redefine it, so branch 0 resolves to the exact same
// 'rat' string the rest of the engine uses (brief §1). STEMS / STEM_ELEMENTS
// are new and live here.
//
// Circular-import note: profile.js imports getDayPillar/getHourPillar from
// here, and we import ANIMALS from profile.js. This is safe because (a) the
// pillar functions are hoisted function declarations, and (b) ANIMALS is only
// read inside function bodies (call time), never at module-evaluation time —
// so whichever module loads first, the live binding is initialized before any
// pillar function is actually invoked.

import { ANIMALS } from './profile.js';

// Heavenly stems 天干, index 0–9.
export const STEMS = [
  'jia', 'yi', 'bing', 'ding', 'wu', 'ji', 'geng', 'xin', 'ren', 'gui'
];

// Stem → five-element (wuxing). Each element holds two consecutive stems,
// so STEM_ELEMENTS[i] === ['wood','fire','earth','metal','water'][floor(i/2)]:
//   jia/yi → wood, bing/ding → fire, wu/ji → earth, geng/xin → metal, ren/gui → water.
export const STEM_ELEMENTS = [
  'wood', 'wood', 'fire', 'fire', 'earth', 'earth', 'metal', 'metal', 'water', 'water'
];

// ── Day-pillar calibration (LOCKED) ─────────────────────────────────────────
// dayStemIndex  = (JDN + KS_DAY_STEM)  mod 10
// dayBranchIndex = (JDN + KB_DAY_BRANCH) mod 12
// where JDN is the standard integer (Fliegel–Van Flandern) Gregorian Julian
// Day Number. These two offsets are the chronological-JDN sexagenary
// alignment sex60 = (JDN + 49) mod 60 with 0 = 甲子 (jia-rat); 49 mod 10 = 9,
// 49 mod 12 = 1. CALIBRATED, not guessed — verified against three authoritative
// 万年历 day pillars spanning 58 years (all exact, single offset pair):
//   1966-01-21 → 庚辰 geng-dragon (stem 6, branch 4)   [JDN 2439147]
//   2000-01-01 → 戊午 wu-horse    (stem 4, branch 6)   [JDN 2451545]
//   2024-02-10 → 甲辰 jia-dragon  (stem 0, branch 4)   [JDN 2460351]
// Source: buyiju.com 万年历 (今日干支). A wrong noon-vs-midnight epoch would
// break at least one of the three; all three match, so the JDN + offsets are
// correct. Fixtures lock these in tests/pillars.test.js.
const KS_DAY_STEM = 9;
const KB_DAY_BRANCH = 1;

// Standard integer Julian Day Number for a Gregorian (proleptic) date.
// Fliegel & Van Flandern (1968). Returns the integer that increments by
// exactly 1 per civil day — the property the sexagenary day cycle rides on.
// (calendar.js's Meeus gregorianToJD is a private astronomical JD at .5/midnight
// for solar-term math; it is NOT this integer and is not reused here — calendar.js
// is reserved for the later moon module per the brief.)
function julianDayNumber(year, month, day) {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day
    + Math.floor((153 * m + 2) / 5)
    + 365 * y
    + Math.floor(y / 4)
    - Math.floor(y / 100)
    + Math.floor(y / 400)
    - 32045;
}

const mod = (n, k) => ((n % k) + k) % k;

// Day pillar from a civil Gregorian date.
//
// CONVENTION (locked, brief §2/§4): the day pillar uses the entered civil
// date directly — no timezone conversion, no 23:00 rollover. 23:00–23:59 is
// the 子 (Rat) hour of that SAME civil day. (The 晚子时 school rolls 23:00+
// onto the next day's day-pillar; that is DEFERRED, intentionally not done here.)
// Day pillar is date-only and ALWAYS computes (never null).
export function getDayPillar(year, month, day) {
  const jdn = julianDayNumber(year, month, day);
  const stemIndex = mod(jdn + KS_DAY_STEM, 10);
  const branchIndex = mod(jdn + KB_DAY_BRANCH, 12);
  return {
    stemIndex,
    branchIndex,
    stemElement: STEM_ELEMENTS[stemIndex],
    animal: ANIMALS[branchIndex]
  };
}

// Hour-branch index from a 0–23 birth hour. Each branch spans two civil hours;
// the 子 (Rat) hour is special-cased to 23:00–00:59 (the +1 shift folds 23 → 0):
//   h=23 → 0 子 (Rat, 23:00–00:59),  h=0 → 0,  h=1 → 1 丑 (Ox),  h=2 → 1,
//   h=3 → 2 寅 (Tiger),  h=11 → 6,  h=12 → 6 午 (Horse, noon).
function hourBranchFromHour(hour) {
  return Math.floor(((hour + 1) % 24) / 2) % 12;
}

// Hour pillar from a civil date + birth hour (0–23).
//
// The hour STEM depends on the day stem (五鼠遁 / Five Rats rule): for a given
// day stem, the 子-hour stem is fixed and stems advance with the hour branch.
//   hourStemIndex = (dayStemIndex * 2 + hourBranchIndex) mod 10
// Classic mnemonic 五鼠遁日起时诀: 甲己还加甲 (jia/ji day → 甲子),
// 乙庚丙作初 (yi/geng → 丙子), 丙辛从戊起 (bing/xin → 戊子),
// 丁壬庚子居 (ding/ren → 庚子), 戊癸壬子居 (wu/gui → 壬子).
// The day stem is computed internally — the hour pillar depends on it.
//
// CONVENTION (locked, brief §4): missing/invalid hour → null (graceful, mirrors
// how rising returns a falsy value). A valid hour is an integer in [0, 23].
export function getHourPillar(year, month, day, hour) {
  if (typeof hour !== 'number' || !Number.isInteger(hour) || hour < 0 || hour > 23) {
    return null;
  }
  const branchIndex = hourBranchFromHour(hour);
  const dayStemIndex = getDayPillar(year, month, day).stemIndex;
  const stemIndex = mod(dayStemIndex * 2 + branchIndex, 10);
  return {
    stemIndex,
    branchIndex,
    stemElement: STEM_ELEMENTS[stemIndex],
    animal: ANIMALS[branchIndex]
  };
}
