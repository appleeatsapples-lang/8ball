// 8ball / core / moon.js
// Moon-sign (geocentric ecliptic longitude of the Moon) math. Pure logic,
// no DOM, no I/O.
//
// Built under operator word ASTRO-MOON-ADD-01 (DOCTRINE.md §1.K), reversing
// the v0.3.0-era deferral recorded in 8BALL.md ("may not return"). Surface
// coordinate, not a driver — never enters getCard/resolveBracket; the
// catalog stays (sunSign, animal) per DOCTRINE §1/§1.A.
//
// Meeus ch.47 ("Position of the Moon"), full Table 47.A longitude series:
// 59 of the table's 60 published terms — the 60th ([D,M,M',F]=[2,0,-1,-2])
// has a longitude coefficient of exactly 0 (it only contributes to the
// distance series, which this file doesn't need), so omitting it is exact,
// not a truncation. Constants cross-checked against Fabiz/MeeusJs (MIT),
// itself a direct transcription of Meeus's own tables.
//
// Geometric (not apparent) longitude: nutation would add at most ~0.005°
// here, three orders of magnitude below a 30° sign boundary, so — same
// call the project already makes for solarLongitude's documented "low
// accuracy, better than 0.01°" and calendar.js's JDE-as-JD-UT
// approximation (< 70s TT-UT delta across 1900-2100) — it's skipped.
// Verified against Meeus's own worked Example 47.a (1992-04-12.0 TT,
// JDE 2448724.5): this file's geocentricLongitudeDeg(2448724.5) agrees
// with the book's published 133.162655° to five decimal places.
//
// Unlike rising sign, moon-sign has no latitude dependency — it's the
// Moon's position in the sky, not an observer's local horizon — so there
// is no polar-latitude guard here. It DOES need the same birth-time → UT
// resolution rising uses, since the Moon moves ~0.5°/hour: reuses
// rising.js's julianDay/offsetMinutesForWallTime rather than
// reimplementing tz math a third time (math.js's own header explains why
// duplicate arithmetic primitives are a drift risk).

import { normalizeDeg } from './math.js';
import { julianDay, offsetMinutesForWallTime } from './rising.js';

const SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'
];

const D2R = Math.PI / 180;

// Meeus ch.47 Table 47.A — periodic terms for the longitude sum Σl.
// Columns: [D, M, M', F, coefficient] (coefficient in units of 1e-6°).
// D = mean elongation, M = Sun's mean anomaly, M' = Moon's mean anomaly,
// F = Moon's argument of latitude — see geocentricLongitudeDeg below.
const L_TERMS = [
  [0, 0, 1, 0, 6288774], [2, 0, -1, 0, 1274027], [2, 0, 0, 0, 658314],
  [0, 0, 2, 0, 213618], [0, 1, 0, 0, -185116], [0, 0, 0, 2, -114332],
  [2, 0, -2, 0, 58793], [2, -1, -1, 0, 57066], [2, 0, 1, 0, 53322],
  [2, -1, 0, 0, 45758], [0, 1, -1, 0, -40923], [1, 0, 0, 0, -34720],
  [0, 1, 1, 0, -30383], [2, 0, 0, -2, 15327], [0, 0, 1, 2, -12528],
  [0, 0, 1, -2, 10980], [4, 0, -1, 0, 10675], [0, 0, 3, 0, 10034],
  [4, 0, -2, 0, 8548], [2, 1, -1, 0, -7888], [2, 1, 0, 0, -6766],
  [1, 0, -1, 0, -5163], [1, 1, 0, 0, 4987], [2, -1, 1, 0, 4036],
  [2, 0, 2, 0, 3994], [4, 0, 0, 0, 3861], [2, 0, -3, 0, 3665],
  [0, 1, -2, 0, -2689], [2, 0, -1, 2, -2602], [2, -1, -2, 0, 2390],
  [1, 0, 1, 0, -2348], [2, -2, 0, 0, 2236], [0, 1, 2, 0, -2120],
  [0, 2, 0, 0, -2069], [2, -2, -1, 0, 2048], [2, 0, 1, -2, -1773],
  [2, 0, 0, 2, -1595], [4, -1, -1, 0, 1215], [0, 0, 2, 2, -1110],
  [3, 0, -1, 0, -892], [2, 1, 1, 0, -810], [4, -1, -2, 0, 759],
  [0, 2, -1, 0, -713], [2, 2, -1, 0, -700], [2, 1, -2, 0, 691],
  [2, -1, 0, -2, 596], [4, 0, 1, 0, 549], [0, 0, 4, 0, 537],
  [4, -1, 0, 0, 520], [1, 0, -2, 0, -487], [2, 1, 0, -2, -399],
  [0, 0, 2, -2, -381], [1, 1, 1, 0, 351], [3, 0, -2, 0, -340],
  [4, 0, -3, 0, 330], [2, -1, 2, 0, 327], [0, 2, 1, 0, -323],
  [1, 1, -1, 0, 299], [2, 0, 3, 0, 294]
];

// Geocentric ecliptic longitude of the Moon (degrees), mean equinox of
// date, referred to JD treated as JDE (see file header). Meeus ch.47.
export function geocentricLongitudeDeg(jd) {
  const T = (jd - 2451545.0) / 36525;
  const T2 = T * T, T3 = T2 * T, T4 = T3 * T;

  const Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T2
           + T3 / 538841 - T4 / 65194000;
  const D  = 297.8501921 + 445267.1114034 * T - 0.0018819 * T2
           + T3 / 545868 - T4 / 113065000;
  const M  = 357.5291092 + 35999.0502909 * T - 0.0001535 * T2
           + T3 / 24490000;
  const Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T2
           + T3 / 69699 - T4 / 14712000;
  const F  = 93.2720950 + 483202.0175233 * T - 0.0036539 * T2
           - T3 / 3526000 + T4 / 863310000;

  // Venus (A1) and Jupiter (A2) perturbation arguments; a third (A3,
  // flattening) only feeds the latitude series and isn't needed here.
  const A1 = 119.75 + 131.849 * T;
  const A2 = 53.09 + 479264.29 * T;

  // Earth orbital-eccentricity correction (Meeus p.338): terms whose M
  // multiplier is ±1 scale by E, ±2 by E².
  const E = 1 - 0.002516 * T - 0.0000074 * T2;

  let sumL = 3958 * Math.sin(A1 * D2R) + 1962 * Math.sin((Lp - F) * D2R)
           + 318 * Math.sin(A2 * D2R);

  for (const [d, m, mp, f, coeff] of L_TERMS) {
    const arg = (D * d + M * m + Mp * mp + F * f) * D2R;
    const eScale = m === 0 ? 1 : (Math.abs(m) === 1 ? E : E * E);
    sumL += coeff * eScale * Math.sin(arg);
  }

  return normalizeDeg(Lp + sumL * 1e-6);
}

// ── Public API ───────────────────────────────────────────────────────
// computeMoonSign({ year, month, day, hour, minute, tz }) →
//   string sign  on success
//   null         on unresolvable tz
// No lat/lng: unlike rising sign, the Moon's geocentric ecliptic longitude
// has no observer-location dependency, so there's no polar guard either.
export function computeMoonSign(opts) {
  if (!opts) return null;
  const { year, month, day, hour, minute, tz } = opts;
  const offset = offsetMinutesForWallTime(year, month, day, hour, minute, tz);
  if (offset === null) return null;
  // julianDay's arithmetic is linear in `day + utHours/24` with no
  // internal rollover, so an out-of-[0,24) utHours (any timezone offset
  // that pushes the UT instant onto an adjacent calendar day) still
  // yields the correct continuous JD without pre-normalizing the date —
  // unlike ascendantDeg, which rolls over first for its own LST-context
  // reasons.
  const utHours = hour + minute / 60 - offset / 60;
  const jd = julianDay(year, month, day, utHours);
  const lng = geocentricLongitudeDeg(jd);
  return SIGNS[Math.floor(lng / 30) % 12];
}
