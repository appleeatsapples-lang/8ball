// 8ball / core / profile.js
// Pure functions. No DOM, no globals, no I/O.
// Breaking algorithm changes (modifying existing outputs) MUST update
// tests/fixtures.json in lockstep. Additive changes (new exports, new
// buildProfile fields) require direct unit tests; existing fixtures
// stay byte-identical. v0.2.2 additively extends the numerology surface
// with personality, birthday, and maturity fields.
// See DOCTRINE.md §3 for the calculation contract.

import { getCountryByCode } from './countries.js';
import { getRisingSign } from './rising.js';

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

// Approximation: Chinese New Year falls between Jan 21 and Feb 21.
// We use Feb 4 as the cutoff. Accurate within ~2 weeks for any given year.
// Real lunar tables = v2 work.
const CNY_CUTOFF_MONTH = 2;
const CNY_CUTOFF_DAY = 4;

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

export function getAnimal(year, month, day) {
  let y = year;
  if (month === 1 || (month === CNY_CUTOFF_MONTH && day < CNY_CUTOFF_DAY)) {
    y = year - 1;
  }
  // Anchor: 2020 = rat (index 0)
  const idx = ((y - 2020) % 12 + 12) % 12;
  return ANIMALS[idx];
}

export function getChineseElement(year, month, day) {
  let y = year;
  if (month === 1 || (month === CNY_CUTOFF_MONTH && day < CNY_CUTOFF_DAY)) {
    y = year - 1;
  }
  // Anchor: 1924 = wood (start of 60-year sexagenary cycle).
  // Each element holds for 2 consecutive years.
  const idx = ((Math.floor((y - 1924) / 2) % 5) + 5) % 5;
  return ELEMENTS[idx];
}

// Month-pillar animal (the "inner" or "private" animal in Chinese
// astrology). Year-pillar animal is what people commonly identify
// with publicly; month-pillar animal is the inner self, calculated
// from the birth month via solar-term cutoffs (节气 jiéqì). Each
// month-animal window starts at a specific solar term:
//   tiger:   立春 lichun     ~Feb 4
//   rabbit:  惊蛰 jingzhe    ~Mar 6
//   dragon:  清明 qingming   ~Apr 5
//   snake:   立夏 lixia      ~May 6
//   horse:   芒种 mangzhong  ~Jun 6
//   goat:    小暑 xiaoshu    ~Jul 7
//   monkey:  立秋 liqiu      ~Aug 8
//   rooster: 白露 bailu      ~Sep 8
//   dog:     寒露 hanlu      ~Oct 8
//   pig:     立冬 lidong     ~Nov 7
//   rat:     大雪 daxue      ~Dec 7
//   ox:      小寒 xiaohan    ~Jan 6
// Real solar-term tables (which drift by ~1 day across decades) are
// v2 work; v1 uses these fixed-date approximations consistent with
// the Feb 4 CNY approximation in getAnimal/getChineseElement.
const MONTH_ANIMAL_CUTOFFS = [
  { from: [1, 6],   animal: 'ox' },
  { from: [2, 4],   animal: 'tiger' },
  { from: [3, 6],   animal: 'rabbit' },
  { from: [4, 5],   animal: 'dragon' },
  { from: [5, 6],   animal: 'snake' },
  { from: [6, 6],   animal: 'horse' },
  { from: [7, 7],   animal: 'goat' },
  { from: [8, 8],   animal: 'monkey' },
  { from: [9, 8],   animal: 'rooster' },
  { from: [10, 8],  animal: 'dog' },
  { from: [11, 7],  animal: 'pig' },
  { from: [12, 7],  animal: 'rat' },
];

export function getInnerAnimal(month, day) {
  const date = month * 100 + day;
  // Walk cutoffs in reverse: the most recent cutoff that the date
  // is at-or-after wins. Dates before Jan 6 fall into the previous
  // year's December rat-window.
  for (let i = MONTH_ANIMAL_CUTOFFS.length - 1; i >= 0; i--) {
    const [m, d] = MONTH_ANIMAL_CUTOFFS[i].from;
    const cutoff = m * 100 + d;
    if (date >= cutoff) return MONTH_ANIMAL_CUTOFFS[i].animal;
  }
  // Jan 1 - Jan 5: previous year's Dec 7+ rat
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
  let risingSign;
  if (opts && opts.time && opts.country && typeof opts.lat === 'number' && typeof opts.lng === 'number') {
    const tm = /^(\d{1,2}):(\d{2})$/.exec(opts.time);
    if (tm) {
      const hour = parseInt(tm[1], 10);
      const minute = parseInt(tm[2], 10);
      const country = getCountryByCode(opts.country);
      if (country
          && hour >= 0 && hour <= 23
          && minute >= 0 && minute <= 59
          && opts.lat >= -90 && opts.lat <= 90
          && opts.lng >= -180 && opts.lng <= 180) {
        risingSign = getRisingSign(
          y, m, d, hour, minute,
          country.utcOffsetMinutes,
          opts.lat, opts.lng
        );
      }
    }
  }
  return {
    name: cleanName,
    firstName: cleanName.split(/\s+/)[0] || '',
    sunSign: getSunSign(m, d),
    chineseElement: getChineseElement(y, m, d),
    animal: getAnimal(y, m, d),
    innerAnimal: getInnerAnimal(m, d),
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
    risingSign
  };
}
