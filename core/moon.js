// 8ball / core / moon.js — the moon sign (§1.K).
//
// Geocentric ecliptic longitude of the Moon per Meeus, Astronomical
// Algorithms (2nd ed.), chapter 47: the mean longitude L′ plus the
// periodic series Σl — the 59 non-zero longitude rows of the 60-row Table
// 47.A (its 60th row carries only a distance term), with the E-factor on the
// terms in M, plus the three additive A1 / L′−F / A2 terms — then the tropical sign
// by 30° sector. Authority pin: Meeus's own worked example 47.a — 1992
// April 12, 0h TD → λ = 133.162655° — is reproduced to six decimals in
// tests/moon.test.js, every intermediate included.
//
// TWO STATED APPROXIMATIONS, both boundary-irrelevant:
//   1. MEAN longitude, not apparent: nutation in longitude (≤ ~0.005°) is
//      not added. The Moon moves ~0.55°/hour, so 0.005° is ~30 seconds
//      of clock time — below the minute resolution of the birth-time input.
//   2. JD(UT) is used where the series wants JDE (dynamical time) — the same
//      treatment core/calendar.js takes for the jieqi. ΔT was about −3 s in
//      1900, is ~70 s now, and is projected near 200 s by 2100; at the
//      Moon's 0.49–0.63°/hour that is ≈ 0.01° today and ≈ 0.03° at the far
//      end of the range (pr232 audit: an earlier draft claimed < 0.001°,
//      the SUN's order of magnitude, not the Moon's).
//   A birth within ~2 minutes of a sign cusp is therefore the only case
//   either could flip, and no input here resolves a minute to that
//   certainty anyway.
//
// INPUTS follow rising's contract, minus the place: the Moon's sign does
// not depend on the observer, but converting a WALL-CLOCK birth time to UT
// does need the timezone, and the product only learns the timezone from a
// selected city. So: time + tz → a sign; anything less → undefined (the
// unresolved dash), never a guess — the Moon crosses a sign every ~2.5
// days, so a date-only reading would be wrong on a material fraction of
// birthdays (§1.B v0.62 anti-silent-substitution).

import { julianDay, offsetMinutesForWallTime } from './rising.js';

const SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
];

const rad = d => (d * Math.PI) / 180;
const norm = d => ((d % 360) + 360) % 360;

// Meeus table 47.A — longitude terms: [D, M, M′, F, Σl coefficient ×1e-6°].
const LONGITUDE_TERMS = Object.freeze([
  [0, 0, 1, 0, 6288774], [2, 0, -1, 0, 1274027], [2, 0, 0, 0, 658314], [0, 0, 2, 0, 213618],
  [0, 1, 0, 0, -185116], [0, 0, 0, 2, -114332], [2, 0, -2, 0, 58793], [2, -1, -1, 0, 57066],
  [2, 0, 1, 0, 53322], [2, -1, 0, 0, 45758], [0, 1, -1, 0, -40923], [1, 0, 0, 0, -34720],
  [0, 1, 1, 0, -30383], [2, 0, 0, -2, 15327], [0, 0, 1, 2, -12528], [0, 0, 1, -2, 10980],
  [4, 0, -1, 0, 10675], [0, 0, 3, 0, 10034], [4, 0, -2, 0, 8548], [2, 1, -1, 0, -7888],
  [2, 1, 0, 0, -6766], [1, 0, -1, 0, -5163], [1, 1, 0, 0, 4987], [2, -1, 1, 0, 4036],
  [2, 0, 2, 0, 3994], [4, 0, 0, 0, 3861], [2, 0, -3, 0, 3665], [0, 1, -2, 0, -2689],
  [2, 0, -1, 2, -2602], [2, -1, -2, 0, 2390], [1, 0, 1, 0, -2348], [2, -2, 0, 0, 2236],
  [0, 1, 2, 0, -2120], [0, 2, 0, 0, -2069], [2, -2, -1, 0, 2048], [2, 0, 1, -2, -1773],
  [2, 0, 0, 2, -1595], [4, -1, -1, 0, 1215], [0, 0, 2, 2, -1110], [3, 0, -1, 0, -892],
  [2, 1, 1, 0, -810], [4, -1, -2, 0, 759], [0, 2, -1, 0, -713], [2, 2, -1, 0, -700],
  [2, 1, -2, 0, 691], [2, -1, 0, -2, 596], [4, 0, 1, 0, 549], [0, 0, 4, 0, 537],
  [4, -1, 0, 0, 520], [1, 0, -2, 0, -487], [2, 1, 0, -2, -399], [0, 0, 2, -2, -381],
  [1, 1, 1, 0, 351], [3, 0, -2, 0, -340], [4, 0, -3, 0, 330], [2, -1, 2, 0, 327],
  [0, 2, 1, 0, -323], [1, 1, -1, 0, 299], [2, 0, 3, 0, 294],
]);

/**
 * Meeus ch. 47: the Moon's geocentric ecliptic longitude at Julian day
 * `jd` (treated as JDE — see the ΔT note above). Returns every
 * intermediate so the authority test can pin the whole worked example,
 * not only the final angle.
 */
export function moonLongitude(jd) {
  const T = (jd - 2451545.0) / 36525;
  const T2 = T * T, T3 = T2 * T, T4 = T3 * T;
  const Lp = norm(218.3164477 + 481267.88123421 * T - 0.0015786 * T2 + T3 / 538841 - T4 / 65194000);
  const D = norm(297.8501921 + 445267.1114034 * T - 0.0018819 * T2 + T3 / 545868 - T4 / 113065000);
  const M = norm(357.5291092 + 35999.0502909 * T - 0.0001536 * T2 + T3 / 24490000);
  const Mp = norm(134.9633964 + 477198.8675055 * T + 0.0087414 * T2 + T3 / 69699 - T4 / 14712000);
  const F = norm(93.2720950 + 483202.0175233 * T - 0.0036539 * T2 - T3 / 3526000 + T4 / 863310000);
  const A1 = norm(119.75 + 131.849 * T);
  const A2 = norm(53.09 + 479264.290 * T);
  const E = 1 - 0.002516 * T - 0.0000074 * T2;
  let sigmaL = 0;
  for (const [d, m, mp, f, coef] of LONGITUDE_TERMS) {
    const scale = Math.abs(m) === 2 ? E * E : Math.abs(m) === 1 ? E : 1;
    sigmaL += coef * scale * Math.sin(rad(d * D + m * M + mp * Mp + f * F));
  }
  sigmaL += 3958 * Math.sin(rad(A1)) + 1962 * Math.sin(rad(Lp - F)) + 318 * Math.sin(rad(A2));
  return { T, Lp, D, M, Mp, F, E, sigmaL, lambda: norm(Lp + sigmaL / 1e6) };
}

/** Tropical sign for an ecliptic longitude in degrees. */
export function signOfLongitude(lambdaDeg) {
  if (!Number.isFinite(lambdaDeg)) return undefined;
  return SIGNS[Math.floor(norm(lambdaDeg) / 30) % 12];
}

/**
 * computeMoon({ year, month, day, hour, minute, tz }) →
 *   string sign  when the wall-clock time resolves through `tz` to UT
 *   undefined    when the time or the timezone is missing or invalid
 *
 * No place is needed beyond the timezone; no polar rule applies (the
 * Moon's sign is geocentric). Mirrors computeRising's finite/parse
 * discipline so the two time-derived coordinates fail closed the same way.
 */
export function moonLongitudeFor(opts) {
  if (!opts) return undefined;
  const { year, month, day, hour, minute, tz } = opts;
  for (const n of [year, month, day, hour, minute]) {
    if (!Number.isInteger(n)) return undefined;
  }
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return undefined;
  const offset = offsetMinutesForWallTime(year, month, day, hour, minute, tz);
  if (offset === null) return undefined;
  // wall-clock → UT: local = UT + offset, so UT = local − offset.
  const utMinutes = hour * 60 + minute - offset;
  const jd = julianDay(year, month, day, 0) + utMinutes / 1440;
  return moonLongitude(jd).lambda;
}

/**
 * The sign for a wall-clock birth instant, or undefined. The fixtures pin
 * the ANGLE through moonLongitudeFor — the same parse, the same offset,
 * the same JD — so a wrong minute or a wrong offset sign fails as a
 * longitude before it is visible as a sign (pr232 audit M2: an earlier
 * draft pinned the angle on the bare series only, and a mutant that
 * dropped the birth minutes rode the suite green).
 */
export function computeMoon(opts) {
  const lambda = moonLongitudeFor(opts);
  return lambda === undefined ? undefined : signOfLongitude(lambda);
}
