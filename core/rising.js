// 8ball / core / rising.js
// Rising-sign (astronomical ascendant) math. Pure logic, no DOM, no I/O.

const SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'
];

const DEG = Math.PI / 180;

function normalizeDeg(deg) {
  return ((deg % 360) + 360) % 360;
}

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

  const diff = normalizeDeg(asc - LST);
  if (diff < 1 || diff > 179) {
    asc = normalizeDeg(asc + 180);
  }
  return asc;
}

export function getRisingSign(year, month, day, hour, minute, utcOffsetMinutes, lat, lng) {
  const asc = ascendantDeg(year, month, day, hour, minute, utcOffsetMinutes, lat, lng);
  return SIGNS[Math.floor(asc / 30) % 12];
}
