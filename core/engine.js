// 8ball / core / engine.js
// Catalog computation. Pure logic, no DOM.
//
// Current surface: the engine computes only the catalog index of the
// resolved card. The (sun, animal) -> catalog mapping is positional
// (sun-row x 12 + animal-col + 1), so the pure engine remains
// content-agnostic while the UI unlock path reads deck content from
// content/cards.v1.full.js.
//
// Pipeline (DOCTRINE §1):
//   profile (from buildProfile) -> getCard(profile) -> { catalog }
//   The card content fields (name, type, habit, note) intentionally
//   return empty strings here; callers use catalog/profile coordinates
//   to resolve deck content outside the pure engine.

// Sun-row order in the 144-card catalog. Astrological year, starting
// from Aries. This is positional only — no card content is loaded.
const SUN_ORDER = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'
];

// Animal-column order in the 144-card catalog. Standard Chinese
// zodiac order, starting from Rat.
const ANIMAL_ORDER = [
  'rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake',
  'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig'
];

// Roman numeral conversion for catalog indices 1..144. Lowercase per
// the existing catalog format ("i", "ii", ..., "cxliv").
function toRoman(n) {
  if (!Number.isInteger(n) || n < 1 || n > 3999) {
    throw new Error(`toRoman: out of range integer ${n}`);
  }
  const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const numerals = ['m', 'cm', 'd', 'cd', 'c', 'xc', 'l', 'xl', 'x', 'ix', 'v', 'iv', 'i'];
  let out = '';
  let rem = n;
  for (let i = 0; i < values.length; i++) {
    while (rem >= values[i]) {
      out += numerals[i];
      rem -= values[i];
    }
  }
  return out;
}

export class MissingCardError extends Error {
  constructor(sunSign, animal) {
    super(
      `No catalog defined for sun="${sunSign}" animal="${animal}". ` +
      `Sun must be one of [${SUN_ORDER.join(', ')}]; animal must be one of [${ANIMAL_ORDER.join(', ')}].`
    );
    this.name = 'MissingCardError';
    this.sunSign = sunSign;
    this.animal = animal;
  }
}

const LOW = new Set([1, 2, 3]);
const MID = new Set([4, 5, 6]);
const HIGH = new Set([7, 8, 9, 11, 22, 33]);

export function resolveBracket(lifePath) {
  if (LOW.has(lifePath)) return 'low';
  if (MID.has(lifePath)) return 'mid';
  if (HIGH.has(lifePath)) return 'high';
  throw new Error(`Unknown life path value: ${lifePath}`);
}

export function getCard(profile) {
  const { sunSign, animal } = profile;
  const sunIdx = SUN_ORDER.indexOf(sunSign);
  const animalIdx = ANIMAL_ORDER.indexOf(animal);
  if (sunIdx < 0 || animalIdx < 0) {
    throw new MissingCardError(sunSign, animal);
  }
  const catalogArabic = sunIdx * 12 + animalIdx + 1;
  return {
    name: '',
    type: '',
    habit: '',
    note: '',
    catalog: toRoman(catalogArabic)
  };
}
