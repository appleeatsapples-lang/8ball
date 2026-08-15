// 8ball / core / rising.js
// Rising-sign (astronomical ascendant) math. Pure logic, no DOM, no I/O.
//
// v0.2.7.2 changes (DOCTRINE.md §1.A amended at v0.21):
//   • Primary public API is `computeRising({...tz...})` — DST-aware via
//     IANA timezone resolved through `Intl.DateTimeFormat`.
//   • Polar latitudes |lat| > 66.5° return `null`. The horizon-plane
//     geometry degenerates at the polar circle; rising sign is not
//     astrologically meaningful inside it.
//   • Legacy `getRisingSign(..., utcOffsetMinutes, ...)` kept as a
//     low-level fixed-offset helper for direct math tests. Stored
//     profile resolution routes through `computeRising`.

const SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'
];

import { normalizeDeg } from './math.js';

const DEG = Math.PI / 180;
const POLAR_LAT_LIMIT_DEG = 66.5;
const DAY_MS = 86400000;

function utcDateParts(year, month, day, utHours) {
  const dayDelta = Math.floor(utHours / 24);
  const hourInDay = utHours - dayDelta * 24;
  const dt = new Date(Date.UTC(year, month - 1, day + dayDelta));
  return {
    year: dt.getUTCFullYear(),
    month: dt.getUTCMonth() + 1,
    day: dt.getUTCDate(),
    utHours: hourInDay
  };
}

export function julianDay(year, month, day, utHours) {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716))
    + Math.floor(30.6001 * (m + 1))
    + day
    + B
    - 1524.5
    + utHours / 24;
}

export function gmstDeg(JD) {
  const T = (JD - 2451545.0) / 36525;
  const gmst = 280.46061837
    + 360.98564736629 * (JD - 2451545.0)
    + 0.000387933 * T * T
    - (T * T * T) / 38710000;
  return normalizeDeg(gmst);
}

export function obliquityDeg(JD) {
  const T = (JD - 2451545.0) / 36525;
  return 23.4392911
    - 0.0130042 * T
    - 0.00000164 * T * T
    + 0.000000503 * T * T * T;
}

export function ascendantDeg(year, month, day, hour, minute, utcOffsetMinutes, lat, lng) {
  let utHours = hour + minute / 60 - utcOffsetMinutes / 60;
  const utc = utcDateParts(year, month, day, utHours);
  utHours = utc.utHours;

  const JD = julianDay(utc.year, utc.month, utc.day, utHours);
  const LST = normalizeDeg(gmstDeg(JD) + lng);
  const eps = obliquityDeg(JD) * DEG;
  const theta = LST * DEG;
  const phi = lat * DEG;

  const yNum = -Math.cos(theta);
  const xDen = Math.sin(eps) * Math.tan(phi) + Math.cos(eps) * Math.sin(theta);
  let asc = normalizeDeg(Math.atan2(yNum, xDen) / DEG);

  // Quadrant correction. atan2 returns the ascendant modulo 180°; this
  // forces it into the 180° arc east of the meridian, where the rising
  // point actually is.
  //
  // Verified domain (2026-07-29, swept over |lat| <= 66.5 x LST [0,360)
  // with the obliquity this file's own obliquityDeg() yields per epoch):
  // for any birth year >= 1533 the condition is ALWAYS true — min diff is
  // 184.35° at year 2000, rising with epoch — so the correction is in
  // practice unconditional and the branch is a tautology for every input
  // the product can receive.
  //
  // That does NOT make the branch unpinned. A tautology only forces a
  // mutant to survive if the mutation PRESERVES it. Measured over 12
  // mutation operators: the tautology-preserving ones survive (condition
  // -> true; dropping `diff < 1`; widening either threshold to >180 /
  // >184 / >185; <=1; >=179; first-arm flip), while the ones that break
  // it are killed by 22 tests each (`||` -> `&&`; condition -> false;
  // dropping `|| diff > 179`; second-arm flip to `diff < 179`). Half this
  // guard is strongly pinned — do not read the survivors as licence to
  // delete an arm.
  //
  // It is NOT a tautology in the limit. As obliquity grows the correction
  // stops matching the geometry once |lat| >= 90 - eps(epoch); bisected
  // at a Jan-1 JD that threshold falls at birth year 1532 (breaks) /
  // 1533 (holds), the true eps = 23.5° crossing being mid-1532, so a
  // mid-year JD shifts the bisection one year earlier. The band reaches
  // below the polar cutoff at earlier epochs: Rovaniemi at 66.499 — the
  // highest non-polar latitude in assets/cities.json — breaks it for
  // birth years around 1520 and earlier. Nothing in the product reaches
  // that (the <input type="date"> carries no lower bound, but a 16th-
  // century birth is not a product input, and Intl's pre-1970 offsets are
  // disclosed as approximate in §1.A regardless). Recorded so the
  // tautology above is not mistaken for an unconditional truth if this
  // formula is ever reused.
  //
  // `asc + 180` (not `- 180`): astronomically identical under normalizeDeg,
  // but the two differ in the last bits — 16.6% of geometry-derived
  // ascendants (23.7% over a uniform sweep of [0,360), which is the
  // synthetic rate, not the reachable one), max 5.7e-14°, i.e. ~2e-10
  // arcsec. No test pins that difference — this routine computes MEAN
  // sidereal time, and the omitted equation of the equinoxes alone is up
  // to 0.0044° — so mutating the sign here survives by design rather than
  // by oversight. It is killable only in principle: an ascendant landing
  // 1 ulp below an exact 30° multiple returns a different sign under the
  // two forms, but zero of 360,000 geometry-derived ascendants land
  // there, and hunting an input that does would be pinning float noise.
  // Keep the `+` form for parity with the reference cases the anchors
  // were computed against.
  const diff = normalizeDeg(asc - LST);
  if (diff < 1 || diff > 179) {
    asc = normalizeDeg(asc + 180);
  }
  return asc;
}

// ── Polar-latitude check ─────────────────────────────────────────────
// |lat| > 66.5° returns null per DOCTRINE §1.A (v0.21). The 66.5°
// boundary stays valid; only strict-greater is degenerate.
export function isPolarLatitude(lat) {
  return Math.abs(lat) > POLAR_LAT_LIMIT_DEG;
}

// ── Tz → offset resolution via Intl.DateTimeFormat ───────────────────
// Returns the UTC offset (in minutes, signed) effective in `tz` at the
// given wall-clock moment. DST-aware via the browser's tz database.
// Pre-1970 dates: Intl falls back to LMT or to the earliest known offset
// in the tz, depending on the engine. Accepted and disclosed in DOCTRINE
// §1.A (v0.21); about-modal copy disclosure carries forward to v0.2.8.
//
// Strategy: probe, then round-trip.
//   probe     — read the offset in force a day either side of the wall
//               time, and at the wall time read as UTC. Those bracket any
//               single transition, so the offset the wall time was
//               actually on the clock under is among them.
//   round-trip — each candidate offset implies one instant; keep it only
//               if `tz` reports that same offset back at that instant.
// A wall time no candidate survives never happened (spring-forward gap);
// one both survive happened twice (fall-back fold). The old two-pass form
// could express neither: it returned the second guess unconditionally, so
// a gap got a definitive sign and a fold silently got the first of two.
function getOffsetAtInstant(date, tz) {
  let parts;
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'longOffset',
      hour12: false
    });
    parts = fmt.formatToParts(date);
  } catch (_) {
    return null;
  }
  const offPart = parts.find(p => p.type === 'timeZoneName');
  if (!offPart) return null;
  const s = offPart.value;
  if (s === 'GMT') return 0;
  // Accept GMT-05:00 / GMT+5 / GMT+5:30 / GMT-05 — engines vary
  const m = /^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/.exec(s);
  if (!m) return null;
  const sign = m[1] === '+' ? 1 : -1;
  return sign * (parseInt(m[2], 10) * 60 + (m[3] ? parseInt(m[3], 10) : 0));
}

// Every offset under which this wall time is on the clock in `tz`,
// earliest instant first. Length 0 = the wall time never happened;
// 1 = the ordinary case; 2 = a fold, the same clock reading an hour apart.
function offsetCandidatesForWallTime(year, month, day, hour, minute, tz) {
  if (typeof tz !== 'string' || tz.length === 0) return [];
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  if (isNaN(wall)) return [];
  const probed = [wall - DAY_MS, wall, wall + DAY_MS]
    .map(ms => getOffsetAtInstant(new Date(ms), tz))
    .filter(o => o !== null);
  // The instant is the wall time minus the offset, so descending offset is
  // ascending instant and a fold comes back in chronological order rather
  // than in probe order.
  const candidates = [...new Set(probed)].sort((a, b) => b - a);
  return candidates.filter(o => {
    const back = getOffsetAtInstant(new Date(wall - o * 60 * 1000), tz);
    // The round-trip can only DISPROVE a candidate. An unreadable answer
    // disproves nothing: pre-1970 zones report sub-minute offsets
    // (`GMT+05:21:10`) that the parse above declines, and the disclosed
    // historical approximation stands rather than a real wall time being
    // called nonexistent on a parse failure.
    return back === null || back === o;
  });
}

export function offsetMinutesForWallTime(year, month, day, hour, minute, tz) {
  const offsets = offsetCandidatesForWallTime(year, month, day, hour, minute, tz);
  // One offset by signature; on a fold that is the earlier instant's. A
  // caller that must not pick across the ambiguity — computeRising — reads
  // the candidates instead. computeMoonSign keeps this single value: the
  // Moon moves ~0.5°/hour against the ascendant's ~15°/hour, so a fold's
  // two instants are not the same risk there.
  return offsets.length === 0 ? null : offsets[0];
}

// ── Public API ───────────────────────────────────────────────────────
// computeRising({ year, month, day, hour, minute, tz, lat, lng }) →
//   string sign  on success
//   null         on polar latitude, unresolvable tz, a wall time that
//                never happened, or a fold whose two instants disagree
export function computeRising(opts) {
  if (!opts) return null;
  const { year, month, day, hour, minute, tz, lat, lng } = opts;
  // finite guard: rejects non-numbers AND NaN/±Infinity (typeof NaN==='number'
  // would slip through to SIGNS[NaN]=undefined, breaking the string|null contract).
  // No effect on valid inputs — buildProfile range-guards lat/lng.
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (isPolarLatitude(lat)) return null;
  const offsets = offsetCandidatesForWallTime(year, month, day, hour, minute, tz);
  if (offsets.length === 0) return null;
  // A fold's two instants are an hour apart and the ascendant moves
  // ~15°/hour, so they can straddle a sign boundary: 01:30 in New York on
  // a fall-back date is leo under the earlier instant and virgo under the
  // later one, with nothing in the birth data to choose between them.
  // Where the two agree the ambiguity never reaches the answer and the
  // sign is returned; where they disagree none is invented. null drops the
  // coordinate into the same absent path a reading with no birthplace
  // already takes (profile.js risingSign gates; ui/tiers.js 'unres').
  const signs = offsets.map(o => SIGNS[
    Math.floor(ascendantDeg(year, month, day, hour, minute, o, lat, lng) / 30) % 12
  ]);
  return signs.every(s => s === signs[0]) ? signs[0] : null;
}

// ── Legacy fallback ──────────────────────────────────────────────────
// getRisingSign(year, month, day, hour, minute, utcOffsetMinutes, lat, lng)
// Pre-v0.2.7.2 API. Retained for fixed-offset math parity tests and
// polar safety checks; buildProfile uses computeRising for both fresh
// city payloads and legacy country payloads.
export function getRisingSign(year, month, day, hour, minute, utcOffsetMinutes, lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;  // finite guard (see computeRising)
  if (isPolarLatitude(lat)) return null;
  const asc = ascendantDeg(year, month, day, hour, minute, utcOffsetMinutes, lat, lng);
  return SIGNS[Math.floor(asc / 30) % 12];
}
