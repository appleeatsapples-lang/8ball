// 8ball / core / profile.js
// Pure functions. No DOM, no globals, no I/O.
// Breaking algorithm changes (modifying existing outputs) MUST update
// tests/fixtures.json in lockstep. Additive changes (new exports, new
// buildProfile fields) require direct unit tests; existing fixtures
// stay byte-identical. v0.2.2 additively extends the numerology surface
// with personality, birthday, and maturity fields. v0.2.7.1 (calc v2)
// replaces v1 fixed-date Chinese-astrology cusps with real lunar new
// year + solar-term tables (see core/calendar.js); date-precision in
// canonical Asia/Shanghai timezone (UTC+8). See DOCTRINE.md §3.
// v0.2.7.2 routes rising-sign through IANA-tz-aware computeRising when
// opts.tz is provided; legacy v0.2.1+ profiles with opts.country (and
// no opts.tz) still use the country fixed-offset fallback. See
// DOCTRINE.md §1.A (v0.21 amendment).

import { getCountryByCode } from './countries.js';
import { computeRising, getRisingSign } from './rising.js';
import { lunarNewYearDate, monthAnimalSolarTerm } from './calendar.js';
import { getBirthCard } from './birthcard.js';
import { getDayPillar, getHourPillar } from './pillars.js';

export const SUN_SIGNS = [
  { name: 'capricorn',   start: [12, 22], end: [1, 19]  },
  { name: 'aquarius',    start: [1, 20],  end: [2, 18]  },
  { name: 'pisces',      start: [2, 19],  end: [3, 20]  },
  { name: 'aries',       start: [3, 21],  end: [4, 19]  },
  { name: 'taurus',      start: [4, 20],  end: [5, 20]  },
  { name: 'gemini',      start: [5, 21],  end: [6, 20]  },
  { name: 'cancer',      start: [6, 21],  end: [7, 22]  },
  { name: 'leo',         start: [7, 23],  end: [8, 22]  },
  { name: 'virgo',       start: [8, 23],  end: [9, 22]  },
  { name: 'libra',       start: [9, 23],  end: [10, 22] },
  { name: 'scorpio',     start: [10, 23], end: [11, 21] },
  { name: 'sagittarius', start: [11, 22], end: [12, 21] }
];

export const ANIMALS = [
  'rat','ox','tiger','rabbit','dragon','snake',
  'horse','goat','monkey','rooster','dog','pig'
];

// Five-element cycle (wuxing). Each element holds for 2 consecutive
// Chinese years; full cycle = 10 years; combined with 12 animals = 60-year sexagenary cycle.
// Anchor: 1924 was wood-rat (start of the 60-year cycle).
export const ELEMENTS = ['wood', 'fire', 'earth', 'metal', 'water'];

export function getSunSign(month, day) {
  for (const s of SUN_SIGNS) {
    const [sm, sd] = s.start;
    const [em, ed] = s.end;
    if (sm === em) {
      if (month === sm && day >= sd && day <= ed) return s.name;
    } else if (sm > em) {
      // wraps year boundary (capricorn)
      if ((month === sm && day >= sd) || (month === em && day <= ed)) return s.name;
    } else {
      if ((month === sm && day >= sd) ||
          (month === em && day <= ed) ||
          (month > sm && month < em)) return s.name;
    }
  }
  return 'aries';
}

// Resolve which lunar year a Gregorian date belongs to. If the date is
// strictly before lunar new year of `year` (Asia/Shanghai), it's in the
// previous lunar year. Calc v2 — lookup is real LNY, not Feb 4.
function lunarYearOf(year, month, day) {
  const [lnyMonth, lnyDay] = lunarNewYearDate(year);
  if (month < lnyMonth || (month === lnyMonth && day < lnyDay)) {
    return year - 1;
  }
  return year;
}

export function getAnimal(year, month, day) {
  const y = lunarYearOf(year, month, day);
  // Anchor: 2020 = rat (index 0)
  const idx = ((y - 2020) % 12 + 12) % 12;
  return ANIMALS[idx];
}

export function getChineseElement(year, month, day) {
  const y = lunarYearOf(year, month, day);
  // Anchor: 1924 = wood (start of 60-year sexagenary cycle).
  // Each element holds for 2 consecutive years.
  const idx = ((Math.floor((y - 1924) / 2) % 5) + 5) % 5;
  return ELEMENTS[idx];
}

// Month-pillar animal (the "inner" or "private" animal in Chinese
// astrology). Year-pillar animal is what people commonly identify
// with publicly; month-pillar animal is the inner self, calculated
// from the birth month via solar-term cutoffs (节气 jiéqì). Each
// month-animal window starts at a specific jieqi:
//   tiger:   立春 lichun     ~Feb 4
//   rabbit:  惊蛰 jingzhe    ~Mar 5–6
//   dragon:  清明 qingming   ~Apr 4–5
//   snake:   立夏 lixia      ~May 5–6
//   horse:   芒种 mangzhong  ~Jun 5–6
//   goat:    小暑 xiaoshu    ~Jul 6–7
//   monkey:  立秋 liqiu      ~Aug 7–8
//   rooster: 白露 bailu      ~Sep 7–8
//   dog:     寒露 hanlu      ~Oct 8–9
//   pig:     立冬 lidong     ~Nov 7–8
//   rat:     大雪 daxue      ~Dec 6–7
//   ox:      小寒 xiaohan    ~Jan 5–6
// Calc v2 — date-precision Asia/Shanghai jieqi lookup via
// monthAnimalSolarTerm; replaces v1 fixed-date approximations.
// MONTH_ANIMAL_ORDER index matches calendar.js animalIndex:
//   0 tiger   (lichun,    ~Feb 4)
//   1 rabbit  (jingzhe,   ~Mar 5)
//   2 dragon  (qingming,  ~Apr 5)
//   3 snake   (lixia,     ~May 5)
//   4 horse   (mangzhong, ~Jun 6)
//   5 goat    (xiaoshu,   ~Jul 7)
//   6 monkey  (liqiu,     ~Aug 7)
//   7 rooster (bailu,     ~Sep 8)
//   8 dog     (hanlu,     ~Oct 8)
//   9 pig     (lidong,    ~Nov 7)
//  10 rat     (daxue,     ~Dec 7)
//  11 ox      (xiaohan,   ~Jan 5 — earliest jieqi within `year`)
const MONTH_ANIMAL_ORDER = [
  'tiger', 'rabbit', 'dragon', 'snake', 'horse', 'goat',
  'monkey', 'rooster', 'dog', 'pig', 'rat', 'ox'
];

// Walk animals in reverse-chronological order within `year`:
// rat (Dec) → pig (Nov) → ... → tiger (Feb) → ox (Jan).
const INNER_ANIMAL_REV_CHRONO = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 11];

export function getInnerAnimal(year, month, day) {
  // The most recent jieqi the date is at-or-after wins. Iterating in
  // reverse-chronological order ensures we pick the correct animal
  // even though MONTH_ANIMAL_ORDER's index 11 (ox/xiaohan) lands at
  // the EARLIEST date of `year`, not the latest.
  for (const i of INNER_ANIMAL_REV_CHRONO) {
    const [m, d] = monthAnimalSolarTerm(year, i);
    if (month > m || (month === m && day >= d)) {
      return MONTH_ANIMAL_ORDER[i];
    }
  }
  // Date is Jan 1 through (xiaohan(year) - 1). That window belongs to
  // the previous year's rat window (rat starts daxue ~Dec 7 of year-1
  // and extends until xiaohan of year). Same animal regardless of which
  // Gregorian year the window straddles.
  return 'rat';
}

const sumDigits = n =>
  String(Math.abs(n)).split('').reduce((a, c) => a + parseInt(c, 10), 0);

const reduce = n => {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = sumDigits(n);
  }
  return n;
};

export function getLifePathSum(year, month, day) {
  return sumDigits(year) + sumDigits(month) + sumDigits(day);
}

export function getLifePath(year, month, day) {
  return reduce(getLifePathSum(year, month, day));
}

// Pythagorean letter values: a=1..i=9, j=1..r=9, s=1..z=8
export function getNameNumberSum(name) {
  if (!name) return 0;
  let total = 0;
  for (const c of name) {
    const code = c.toLowerCase().charCodeAt(0);
    if (code < 97 || code > 122) continue;
    total += ((code - 97) % 9) + 1;
  }
  return total;
}

export function getNameNumber(name) {
  return reduce(getNameNumberSum(name));
}

// Standard numerology vowels: a, e, i, o, u. Y is variable in tradition;
// excluded here for simplicity and reproducibility.
const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

// Personality (outer self): sum of consonants only, Pythagorean values.
// Standard numerology consonants: all letters minus a, e, i, o, u.
// Mirror of getSoulUrge with the vowel-set logic inverted.
export function getPersonalitySum(name) {
  if (!name) return 0;
  let total = 0;
  for (const c of name) {
    const lower = c.toLowerCase();
    const code = lower.charCodeAt(0);
    if (code < 97 || code > 122) continue;
    if (VOWELS.has(lower)) continue;
    total += ((code - 97) % 9) + 1;
  }
  return total;
}

export function getPersonality(name) {
  return reduce(getPersonalitySum(name));
}

// Soul urge (heart's desire): sum of vowels only, Pythagorean values.
export function getSoulUrgeSum(name) {
  if (!name) return 0;
  let total = 0;
  for (const c of name) {
    const lower = c.toLowerCase();
    if (!VOWELS.has(lower)) continue;
    const code = lower.charCodeAt(0);
    total += ((code - 97) % 9) + 1;
  }
  return total;
}

export function getSoulUrge(name) {
  return reduce(getSoulUrgeSum(name));
}

// Birthday: day-of-month from DOB, reduced with master-number rule preserved.
export function getBirthday(day) {
  return reduce(day);
}

// Maturity: life-path sum plus expression/name-number sum, then reduced.
export function getMaturitySum(year, month, day, name) {
  return getLifePathSum(year, month, day) + getNameNumberSum(name);
}

export function getMaturity(year, month, day, name) {
  return reduce(getMaturitySum(year, month, day, name));
}

export function buildProfile(name, dobIso, opts) {
  if (!dobIso || !/^\d{4}-\d{2}-\d{2}$/.test(dobIso)) {
    throw new Error('DOB must be YYYY-MM-DD');
  }
  const [y, m, d] = dobIso.split('-').map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) {
    throw new Error('DOB out of range');
  }
  const cleanName = (name || '').trim();
  // ── Rising sign resolution (v0.2.7.2: IANA-tz primary, country-offset legacy)
  //
  // Result legend:
  //   undefined  → required inputs missing or invalid; line-2 falls back to bare sun
  //   string     → astrologically resolved sign
  //   null       → polar latitude (|lat| > 66.5°); UI surfaces "rising unavailable"
  //
  // Two code paths:
  //   1. v0.2.7.2+ profiles supply `opts.tz` (IANA timezone) → DST-aware
  //      via computeRising / Intl.DateTimeFormat.
  //   2. v0.2.1–v0.2.7.1 profiles supply `opts.country` (no tz) → fixed
  //      UTC offset from core/countries.js, preserved so legacy users
  //      don't see broken state. UI surfaces a non-blocking "update your
  //      birthplace for accuracy" hint when rising <details> opens
  //      (see DOCTRINE.md §1.A v0.21 amendment, brief §2.4).
  let risingSign;
  if (opts && opts.time
      && typeof opts.lat === 'number' && typeof opts.lng === 'number') {
    const tm = /^(\d{1,2}):(\d{2})$/.exec(opts.time);
    if (tm) {
      const hour = parseInt(tm[1], 10);
      const minute = parseInt(tm[2], 10);
      if (hour >= 0 && hour <= 23
          && minute >= 0 && minute <= 59
          && opts.lat >= -90 && opts.lat <= 90
          && opts.lng >= -180 && opts.lng <= 180) {
        if (typeof opts.tz === 'string' && opts.tz.length > 0) {
          risingSign = computeRising({
            year: y, month: m, day: d, hour, minute,
            tz: opts.tz, lat: opts.lat, lng: opts.lng
          });
        } else if (opts.country) {
          const country = getCountryByCode(opts.country);
          if (country) {
            risingSign = getRisingSign(
              y, m, d, hour, minute,
              country.utcOffsetMinutes,
              opts.lat, opts.lng
            );
          }
        }
      }
    }
  }
  // ── Hour pillar (additive, build A). Needs ONLY the birth hour — no lat/lng/tz
  // — so it resolves whenever a valid HH:MM birth time is present, even without
  // a city (brief §5). Reuses the same HH:MM parse shape as the rising block above.
  // Missing/invalid time → null; the day pillar (date-only) always computes.
  let hourPillar = null;
  if (opts && opts.time) {
    const hp = /^(\d{1,2}):(\d{2})$/.exec(opts.time);
    if (hp) {
      const hpHour = parseInt(hp[1], 10);
      const hpMinute = parseInt(hp[2], 10);
      if (hpHour >= 0 && hpHour <= 23 && hpMinute >= 0 && hpMinute <= 59) {
        hourPillar = getHourPillar(y, m, d, hpHour);
      }
    }
  }
  return {
    name: cleanName,
    firstName: cleanName.split(/\s+/)[0] || '',
    sunSign: getSunSign(m, d),
    chineseElement: getChineseElement(y, m, d),
    animal: getAnimal(y, m, d),
    innerAnimal: getInnerAnimal(y, m, d),
    lifePath: getLifePath(y, m, d),
    lifePathSum: getLifePathSum(y, m, d),
    nameNumber: getNameNumber(cleanName),
    nameNumberSum: getNameNumberSum(cleanName),
    soulUrge: getSoulUrge(cleanName),
    soulUrgeSum: getSoulUrgeSum(cleanName),
    personality: getPersonality(cleanName),
    personalitySum: getPersonalitySum(cleanName),
    birthday: getBirthday(d),
    maturity: getMaturity(y, m, d, cleanName),
    maturitySum: getMaturitySum(y, m, d, cleanName),
    yyyy: y, mm: m, dd: d,
    risingSign,
    birthCard: getBirthCard(y, m, d),
    dayPillar: getDayPillar(y, m, d),
    hourPillar
  };
}
