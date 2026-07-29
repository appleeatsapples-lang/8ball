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
  // the product can receive. That is why mutating this condition (or
  // either arm) survives the suite: those are equivalent mutants over the
  // reachable domain, not coverage gaps.
  //
  // It is NOT a tautology in the limit. At year <= 1532 the obliquity has
  // grown enough that diff collapses toward 0 at exactly |lat| = 66.5,
  // and the correction stops matching the geometry (threshold bisected to
  // 1532 breaks / 1533 holds). Nothing in the product reaches that: the
  // <input type="date"> carries no lower bound, but the polar rule
  // already excludes |lat| > 66.5, the failure needs the boundary value
  // itself, and Intl's pre-1970 offsets are disclosed as approximate in
  // §1.A regardless. Recorded so the tautology above is not mistaken for
  // an unconditional truth if this formula is ever reused.
  //
  // `asc + 180` (not `- 180`): astronomically identical under normalizeDeg,
  // but the two differ in the last bits for ~24% of inputs (max 5.7e-14°,
  // i.e. ~2e-10 arcsec). No test pins that difference — the ephemeris
  // itself is only good to ~0.003° — so mutating the sign here also
  // survives by design. Keep the `+` form for parity with the reference
  // cases the anchors were computed against.
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
// Strategy: two-pass.
//   pass 1 — treat wall time as UTC; ask Intl what offset applies in tz
//            at that UTC instant. This is an initial guess.
//   pass 2 — subtract the guess offset to estimate the real UTC moment;
//            re-ask. The second answer is correct except on DST
//            transition wall-times (which are physically ambiguous).
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

export function offsetMinutesForWallTime(year, month, day, hour, minute, tz) {
  if (typeof tz !== 'string' || tz.length === 0) return null;
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  if (isNaN(guess.getTime())) return null;
  const o1 = getOffsetAtInstant(guess, tz);
  if (o1 === null) return null;
  const adjusted = new Date(guess.getTime() - o1 * 60 * 1000);
  const o2 = getOffsetAtInstant(adjusted, tz);
  return o2 === null ? o1 : o2;
}

// ── Public API ───────────────────────────────────────────────────────
// computeRising({ year, month, day, hour, minute, tz, lat, lng }) →
//   string sign  on success
//   null         on polar latitude or unresolvable tz
export function computeRising(opts) {
  if (!opts) return null;
  const { year, month, day, hour, minute, tz, lat, lng } = opts;
  // finite guard: rejects non-numbers AND NaN/±Infinity (typeof NaN==='number'
  // would slip through to SIGNS[NaN]=undefined, breaking the string|null contract).
  // No effect on valid inputs — buildProfile range-guards lat/lng.
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (isPolarLatitude(lat)) return null;
  const offset = offsetMinutesForWallTime(year, month, day, hour, minute, tz);
  if (offset === null) return null;
  const asc = ascendantDeg(year, month, day, hour, minute, offset, lat, lng);
  return SIGNS[Math.floor(asc / 30) % 12];
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
