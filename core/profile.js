// 8ball / core / profile.js
// Pure functions. No DOM, no globals, no I/O.
// Algorithm changes here MUST update tests/fixtures.json in lockstep.
// See DOCTRINE.md §3 for the calculation contract.

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

const sumDigits = n =>
  String(Math.abs(n)).split('').reduce((a, c) => a + parseInt(c, 10), 0);

const reduce = n => {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = sumDigits(n);
  }
  return n;
};

export function getLifePath(year, month, day) {
  return reduce(sumDigits(year) + sumDigits(month) + sumDigits(day));
}

// Pythagorean letter values: a=1..i=9, j=1..r=9, s=1..z=8
export function getNameNumber(name) {
  if (!name) return 0;
  let total = 0;
  for (const c of name) {
    const code = c.toLowerCase().charCodeAt(0);
    if (code < 97 || code > 122) continue;
    total += ((code - 97) % 9) + 1;
  }
  return reduce(total);
}

export function buildProfile(name, dobIso) {
  if (!dobIso || !/^\d{4}-\d{2}-\d{2}$/.test(dobIso)) {
    throw new Error('DOB must be YYYY-MM-DD');
  }
  const [y, m, d] = dobIso.split('-').map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) {
    throw new Error('DOB out of range');
  }
  const cleanName = (name || '').trim();
  return {
    name: cleanName,
    firstName: cleanName.split(/\s+/)[0] || '',
    sunSign: getSunSign(m, d),
    animal: getAnimal(y, m, d),
    lifePath: getLifePath(y, m, d),
    nameNumber: getNameNumber(cleanName),
    yyyy: y, mm: m, dd: d
  };
}
