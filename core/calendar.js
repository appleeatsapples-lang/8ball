// 8ball / core / calendar.js
// Lunar new year + solar-term tables for Chinese-astrology cusp resolution.
// Computed via Meeus astronomical algorithms (Chapter 25 solar position,
// Chapter 49 lunar phases). Evaluated at date-precision in canonical
// Asia/Shanghai timezone (UTC+8). Range: 1900–2100.
//
// Used by core/profile.js for calc v2 cusp resolution per DOCTRINE.md §3:
// year-pillar (getAnimal, getChineseElement) cuts at lunar new year;
// month-pillar (getInnerAnimal) cuts at the 12 jieqi that start animal
// months (lichun → tiger, jingzhe → rabbit, …, xiaohan → ox).

const SHANGHAI_OFFSET_HOURS = 8;
const RANGE_MIN = 1900;
const RANGE_MAX = 2100;

const D2R = Math.PI / 180;

function normalizeAngle(deg) {
  return ((deg % 360) + 360) % 360;
}

// Meeus ch 25 — apparent geocentric solar longitude (degrees).
// "Low accuracy" formula; better than ~0.01° for 1900–2100.
function solarLongitude(jde) {
  const T = (jde - 2451545.0) / 36525;
  const T2 = T * T;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T2;
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T2;
  const Mr = M * D2R;
  const C = (1.914602 - 0.004817 * T - 0.000014 * T2) * Math.sin(Mr)
          + (0.019993 - 0.000101 * T) * Math.sin(2 * Mr)
          + 0.000289 * Math.sin(3 * Mr);
  const trueLon = L0 + C;
  const omega = (125.04 - 1934.136 * T) * D2R;
  const apparent = trueLon - 0.00569 - 0.00478 * Math.sin(omega);
  return normalizeAngle(apparent);
}

// Meeus ch 49 — true new-moon JDE for lunation index k.
// k = 0 corresponds to the new moon of 2000 January 6 (approx).
function newMoonJDE(k) {
  const T = k / 1236.85;
  const T2 = T * T, T3 = T2 * T, T4 = T3 * T;

  let jde = 2451550.09766
          + 29.530588861 * k
          + 0.00015437 * T2
          - 0.000000150 * T3
          + 0.00000000073 * T4;

  const E = 1 - 0.002516 * T - 0.0000074 * T2;
  const M  = (2.5534 + 29.10535670 * k - 0.0000014 * T2 - 0.00000011 * T3) * D2R;
  const Mp = (201.5643 + 385.81693528 * k + 0.0107582 * T2 + 0.00001238 * T3 - 0.000000058 * T4) * D2R;
  const F  = (160.7108 + 390.67050284 * k - 0.0016118 * T2 - 0.00000227 * T3 + 0.000000011 * T4) * D2R;
  const Om = (124.7746 - 1.56375588 * k + 0.0020672 * T2 + 0.00000215 * T3) * D2R;

  // Periodic corrections (Table 49.A, new moon column).
  let corr = 0;
  corr += -0.40720 * Math.sin(Mp);
  corr +=  0.17241 * E * Math.sin(M);
  corr +=  0.01608 * Math.sin(2 * Mp);
  corr +=  0.01039 * Math.sin(2 * F);
  corr +=  0.00739 * E * Math.sin(Mp - M);
  corr += -0.00514 * E * Math.sin(Mp + M);
  corr +=  0.00208 * E * E * Math.sin(2 * M);
  corr += -0.00111 * Math.sin(Mp - 2 * F);
  corr += -0.00057 * Math.sin(Mp + 2 * F);
  corr +=  0.00056 * E * Math.sin(2 * Mp + M);
  corr += -0.00042 * Math.sin(3 * Mp);
  corr +=  0.00042 * E * Math.sin(M + 2 * F);
  corr +=  0.00038 * E * Math.sin(M - 2 * F);
  corr += -0.00024 * E * Math.sin(2 * Mp - M);
  corr += -0.00017 * Math.sin(Om);
  corr += -0.00007 * Math.sin(Mp + 2 * M);
  corr +=  0.00004 * Math.sin(2 * Mp - 2 * F);
  corr +=  0.00004 * Math.sin(3 * M);
  corr +=  0.00003 * Math.sin(Mp + M - 2 * F);
  corr +=  0.00003 * Math.sin(2 * Mp + 2 * F);
  corr += -0.00003 * Math.sin(Mp + M + 2 * F);
  corr +=  0.00003 * Math.sin(Mp - M + 2 * F);
  corr += -0.00002 * Math.sin(Mp - M - 2 * F);
  corr += -0.00002 * Math.sin(3 * Mp + M);
  corr +=  0.00002 * Math.sin(4 * Mp);

  // 14 planetary additional corrections.
  const A = [
    299.77 + 0.107408 * k - 0.009173 * T2,
    251.88 + 0.016321 * k,
    251.83 + 26.651886 * k,
    349.42 + 36.412478 * k,
     84.66 + 18.206239 * k,
    141.74 + 53.303771 * k,
    207.14 +  2.453732 * k,
    154.84 +  7.306860 * k,
     34.52 + 27.261239 * k,
    207.19 +  0.121824 * k,
    291.34 +  1.844379 * k,
    161.72 + 24.198154 * k,
    239.56 + 25.513099 * k,
    331.55 +  3.592518 * k
  ];
  const W = [0.000325, 0.000165, 0.000164, 0.000126, 0.000110,
             0.000062, 0.000060, 0.000056, 0.000047, 0.000042,
             0.000040, 0.000037, 0.000035, 0.000023];
  let extra = 0;
  for (let i = 0; i < A.length; i++) {
    extra += W[i] * Math.sin(A[i] * D2R);
  }

  return jde + corr + extra;
}

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
function jdeToShanghaiDate(jde) {
  const jdShanghai = jde + SHANGHAI_OFFSET_HOURS / 24;
  const Z = Math.floor(jdShanghai + 0.5);
  let A;
  if (Z < 2299161) {
    A = Z;
  } else {
    const alpha = Math.floor((Z - 1867216.25) / 36524.25);
    A = Z + 1 + alpha - Math.floor(alpha / 4);
  }
  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const Em = Math.floor((B - D) / 30.6001);
  const day = B - D - Math.floor(30.6001 * Em);
  const month = Em < 14 ? Em - 1 : Em - 13;
  const year = month > 2 ? C - 4716 : C - 4715;
  return { year, month, day };
}

function compareDates(a, b) {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
}

// Find JDE when apparent solar longitude reaches `target` degrees, near
// `roughJDE`. Bisection in a 60-day window centered on rough; the sun
// advances ~0.9856°/day so the window safely brackets one crossing.
function solarLongitudeCrossingJDE(target, roughJDE) {
  let lo = roughJDE - 30;
  let hi = roughJDE + 30;
  function diff(jde) {
    let d = solarLongitude(jde) - target;
    while (d > 180) d -= 360;
    while (d <= -180) d += 360;
    return d;
  }
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (hi - lo < 1e-6) return mid;
    if (diff(mid) < 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

// 12 jieqi that start animal months. Animal index 0..11 → solar longitude.
// Index 0 = lichun (315°, ~Feb 4) starts tiger month.
// Index 11 = xiaohan (285°, ~Jan 6) starts ox month — note xiaohan returns a
// January date in the SAME `year` argument despite preceding lichun.
const ANIMAL_TERM_LONGITUDES = [
  315, // 0  lichun    → tiger
  345, // 1  jingzhe   → rabbit
   15, // 2  qingming  → dragon
   45, // 3  lixia     → snake
   75, // 4  mangzhong → horse
  105, // 5  xiaoshu   → goat
  135, // 6  liqiu     → monkey
  165, // 7  bailu     → rooster
  195, // 8  hanlu     → dog
  225, // 9  lidong    → pig
  255, // 10 daxue     → rat
  285  // 11 xiaohan   → ox  (January date in `year`)
];

const ROUGH_TERM_DATES = [
  [2, 4], [3, 6], [4, 5], [5, 6], [6, 6], [7, 7],
  [8, 8], [9, 8], [10, 8], [11, 7], [12, 7], [1, 6]
];

function checkRange(year) {
  if (year < RANGE_MIN || year > RANGE_MAX) {
    throw new Error(`year out of range [${RANGE_MIN}, ${RANGE_MAX}]: ${year}`);
  }
}

// Returns [month, day] (1-indexed Gregorian) of the start of the given
// animal's month in `year`, evaluated as Asia/Shanghai civil date.
export function monthAnimalSolarTerm(year, animalIndex) {
  checkRange(year);
  if (animalIndex < 0 || animalIndex > 11) {
    throw new Error(`animalIndex out of range [0, 11]: ${animalIndex}`);
  }
  const target = ANIMAL_TERM_LONGITUDES[animalIndex];
  const [rm, rd] = ROUGH_TERM_DATES[animalIndex];
  const roughJDE = gregorianToJD(year, rm, rd) + 0.5; // noon UT
  const jde = solarLongitudeCrossingJDE(target, roughJDE);
  const { month, day } = jdeToShanghaiDate(jde);
  return [month, day];
}

// Find the lunation k whose new-moon Shanghai-date is on or before `target`
// Shanghai-date AND the next new moon is strictly after.
function newMoonContaining(targetDate) {
  const targetJD = gregorianToJD(targetDate.year, targetDate.month, targetDate.day) + 0.5;
  let k = Math.round((targetJD - 2451550.09766) / 29.530588861);
  // Walk down while current new-moon date is after target.
  while (compareDates(jdeToShanghaiDate(newMoonJDE(k)), targetDate) > 0) k--;
  // Walk up while next new-moon date is at-or-before target.
  while (compareDates(jdeToShanghaiDate(newMoonJDE(k + 1)), targetDate) <= 0) k++;
  return k;
}

// True if the lunar month spanning [monthStartDate, nextMonthStartDate)
// contains a zhongqi (mid-month solar term: longitude 270°, 300°, 330°,
// 0°, 30°, 60°, …, 240°). Used for leap-month detection.
function monthHasZhongqi(monthStartDate, nextMonthStartDate) {
  const monthStartJDE = gregorianToJD(monthStartDate.year, monthStartDate.month, monthStartDate.day) + 0.5;
  const lon = solarLongitude(monthStartJDE);
  // Next zhongqi longitude: smallest multiple of 30° strictly greater than `lon`.
  // (Strict greater so the previous zhongqi — which belongs to the previous
  // lunar month — isn't double-counted.)
  const nextZhongqiLon = (Math.floor(lon / 30) + 1) * 30;
  // Bisect for that crossing within the next ~30 days.
  const zhongqiJDE = solarLongitudeCrossingJDE(nextZhongqiLon % 360, monthStartJDE + 15);
  const zhongqiDate = jdeToShanghaiDate(zhongqiJDE);
  return compareDates(zhongqiDate, nextMonthStartDate) < 0;
}

// Returns [month, day] (1-indexed Gregorian) of Lunar New Year in
// Asia/Shanghai date for the given Gregorian year. Uses the standard
// modern Chinese-calendar rule (1645 reform, in effect for 1900–2100):
//  1. m11 of suì-Y is the lunar month containing dongzhi(Y-1).
//  2. If 12 lunations between m11(suì-Y) and m11(suì-Y+1): regular suì,
//     LNY(Y) = m11 + 2 lunations.
//  3. If 13 lunations: leap suì. The leap month is the first month after
//     m11 that has no zhongqi. If the leap is at offset 1 or 2 from m11,
//     LNY = m11 + 3 lunations; otherwise LNY = m11 + 2.
// In 1900–2100 the only leap-shifts-LNY case is suì 2033/2034 (run shiyi
// yue): LNY 2034 = Feb 19 not Jan 20. The simple "+2" rule alone misses it.
export function lunarNewYearDate(year) {
  checkRange(year);

  const dongzhiPrevJDE = solarLongitudeCrossingJDE(270, gregorianToJD(year - 1, 12, 22) + 0.5);
  const dongzhiPrevDate = jdeToShanghaiDate(dongzhiPrevJDE);
  const dongzhiCurrJDE = solarLongitudeCrossingJDE(270, gregorianToJD(year, 12, 22) + 0.5);
  const dongzhiCurrDate = jdeToShanghaiDate(dongzhiCurrJDE);

  const k11 = newMoonContaining(dongzhiPrevDate);
  const k11next = newMoonContaining(dongzhiCurrDate);
  const lunations = k11next - k11;

  let lnyOffset;
  if (lunations === 12) {
    lnyOffset = 2;
  } else {
    // Leap suì. Find first month (offset 1..12) with no zhongqi.
    let leapOffset = -1;
    for (let i = 1; i <= 12; i++) {
      const monthStart = jdeToShanghaiDate(newMoonJDE(k11 + i));
      const nextStart = jdeToShanghaiDate(newMoonJDE(k11 + i + 1));
      if (!monthHasZhongqi(monthStart, nextStart)) {
        leapOffset = i;
        break;
      }
    }
    lnyOffset = (leapOffset === 1 || leapOffset === 2) ? 3 : 2;
  }

  const lnyDate = jdeToShanghaiDate(newMoonJDE(k11 + lnyOffset));
  return [lnyDate.month, lnyDate.day];
}
