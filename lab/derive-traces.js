// lab/derive-traces.js
// Builds machine-readable derivation traces for free-tier coordinates.
// Imports core/* read-only — does not modify calc modules or tier logic.

import {
  SUN_SIGNS,
  ANIMALS,
  getSunSign,
  getAnimal,
  getLifePath,
  getLifePathSum,
} from '../core/profile.js';
import { getBirthCard, getBirthCardNumber } from '../core/birthcard.js';
import { getCard } from '../core/engine.js';
import { lunarNewYearDate } from '../core/calendar.js';

const SUN_ORDER = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
];

const ANIMAL_ORDER = [
  'rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake',
  'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig',
];

function pad2(n) {
  return String(n).padStart(2, '0');
}

function digitSumSteps(field, n) {
  const digits = String(Math.abs(n));
  const sum = [...digits].reduce((a, c) => a + parseInt(c, 10), 0);
  return { op: 'digit_sum', field, digits, sum };
}

function lunarYearSteps(year, month, day) {
  const [lnyMonth, lnyDay] = lunarNewYearDate(year);
  const beforeLny = month < lnyMonth || (month === lnyMonth && day < lnyDay);
  const lunarYear = beforeLny ? year - 1 : year;
  return {
    steps: [
      {
        op: 'lunar_new_year_lookup',
        gregorianYear: year,
        lnyDate: `${year}-${pad2(lnyMonth)}-${pad2(lnyDay)}`,
        timezone: 'Asia/Shanghai (date-precision)',
      },
      {
        op: 'lunar_year_resolve',
        dob: `${year}-${pad2(month)}-${pad2(day)}`,
        beforeLny,
        lunarYear,
      },
    ],
    lunarYear,
  };
}

function pythagoreanReduceSteps(from, result, masters = [11, 22, 33]) {
  const steps = [{ op: 'reduce_pythagorean', from, masters, result }];
  let n = from;
  while (n > 9 && !masters.includes(n) && n !== result) {
    const next = String(n).split('').reduce((a, c) => a + parseInt(c, 10), 0);
    steps.push({ op: 'digit_sum_reduce', from: n, result: next });
    n = next;
  }
  return steps;
}

export function traceArcana(y, m, d) {
  const card = getBirthCard(y, m, d);
  const number = getBirthCardNumber(y, m, d);
  const yearStep = digitSumSteps('year', y);
  const monthStep = digitSumSteps('month', m);
  const dayStep = digitSumSteps('day', d);
  let n = yearStep.sum + monthStep.sum + dayStep.sum;
  const steps = [
    yearStep,
    monthStep,
    dayStep,
    { op: 'add', values: [yearStep.sum, monthStep.sum, dayStep.sum], result: n },
  ];
  while (n > 22) {
    const next = String(n).split('').reduce((a, c) => a + parseInt(c, 10), 0);
    steps.push({ op: 'digit_sum_reduce_to_22', from: n, result: next });
    n = next;
  }
  if (n === 22) {
    steps.push({ op: 'fool_mapping', input: 22, majorArcanaIndex: 0, name: 'the fool' });
  }
  steps.push({
    op: 'major_arcana_map',
    index: number,
    roman: card.roman,
    name: card.name,
    label: card.label,
  });
  return {
    coordinate: 'arcana',
    label: 'ARCANA',
    value: card.label,
    inputsUsed: ['dob'],
    steps,
  };
}

export function traceSun(y, m, d) {
  const sign = getSunSign(m, d);
  const match = SUN_SIGNS.find(s => s.name === sign);
  const steps = [
    {
      op: 'tropical_cusp_lookup',
      dob: `${y}-${pad2(m)}-${pad2(d)}`,
      system: 'western tropical zodiac',
    },
  ];
  if (match) {
    const [sm, sd] = match.start;
    const [em, ed] = match.end;
    steps.push({
      op: 'cusp_match',
      sign,
      start: `${pad2(sm)}-${pad2(sd)}`,
      end: `${pad2(em)}-${pad2(ed)}`,
      wrapsYear: sm > em,
    });
  }
  steps.push({ op: 'result', field: 'sunSign', value: sign });
  return {
    coordinate: 'sun',
    label: 'SUN',
    value: sign,
    inputsUsed: ['dob'],
    steps,
  };
}

export function traceAnimal(y, m, d) {
  const { steps: lnySteps, lunarYear } = lunarYearSteps(y, m, d);
  const idx = ((lunarYear - 2020) % 12 + 12) % 12;
  const animal = getAnimal(y, m, d);
  return {
    coordinate: 'animal',
    label: 'PUBLIC',
    value: animal,
    inputsUsed: ['dob'],
    steps: [
      ...lnySteps,
      { op: 'zodiac_cycle', anchorYear: 2020, anchorAnimal: 'rat', lunarYear, index: idx },
      { op: 'animal_lookup', index: idx, animal, animalList: ANIMALS },
      { op: 'result', field: 'publicAnimal', value: animal, pillar: 'year-pillar' },
    ],
  };
}

export function traceLifePath(y, m, d) {
  const yearStep = digitSumSteps('year', y);
  const monthStep = digitSumSteps('month', m);
  const dayStep = digitSumSteps('day', d);
  const sum = getLifePathSum(y, m, d);
  const lifePath = getLifePath(y, m, d);
  return {
    coordinate: 'lifePath',
    label: 'LIFE PATH',
    value: String(lifePath),
    inputsUsed: ['dob'],
    steps: [
      yearStep,
      monthStep,
      dayStep,
      { op: 'add', values: [yearStep.sum, monthStep.sum, dayStep.sum], result: sum },
      ...pythagoreanReduceSteps(sum, lifePath),
      { op: 'result', field: 'lifePath', value: lifePath },
    ],
  };
}

export function traceCatalog(profile) {
  const { sunSign, animal } = profile;
  const sunIdx = SUN_ORDER.indexOf(sunSign);
  const animalIdx = ANIMAL_ORDER.indexOf(animal);
  const arabic = sunIdx * 12 + animalIdx + 1;
  const card = getCard(profile);
  return {
    coordinate: 'catalog',
    label: 'CATALOG',
    value: card.catalog,
    inputsUsed: ['sunSign', 'publicAnimal'],
    steps: [
      {
        op: 'catalog_driver',
        note: 'catalog index derives from (sunSign, publicAnimal) only',
        sunSign,
        publicAnimal: animal,
      },
      { op: 'sun_row_index', sunSign, index: sunIdx, sunOrder: SUN_ORDER },
      { op: 'animal_col_index', publicAnimal: animal, index: animalIdx, animalOrder: ANIMAL_ORDER },
      { op: 'positional_index', formula: 'sunIdx * 12 + animalIdx + 1', arabic },
      { op: 'roman_numeral', arabic, roman: card.catalog },
      { op: 'result', field: 'catalog', value: card.catalog },
    ],
  };
}

/** Build traces for all five free-tier coordinates from a profile + DOB parts. */
export function buildFreeTraces(profile) {
  const { yyyy: y, mm: m, dd: d } = profile;
  return {
    arcana: traceArcana(y, m, d),
    sun: traceSun(y, m, d),
    animal: traceAnimal(y, m, d),
    lifePath: traceLifePath(y, m, d),
    catalog: traceCatalog(profile),
  };
}