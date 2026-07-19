// Static relation registries for the Registry + Concordance MVP.
//
// These tables describe named relations only. They do not score, predict,
// advise, or synthesize two readings. Versioned per DOCTRINE §4: revisions
// ship as a new file rather than silently changing this registry.

export const REGISTRY_SOURCES = Object.freeze({
  sun: 'western zodiac · sign-distance relations',
  animal: 'earthly branches · classical branch relations',
  element: 'wuxing · the five phases',
  lifePath: 'pythagorean numerology · master reduction',
  birthCard: 'major arcana · project trump-number sequence',
});

export const SIGNS = Object.freeze([
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
]);

export const SIGN_DISTANCE_RELATIONS = Object.freeze({
  1: Object.freeze({ distance: 'one sign apart', relation: 'adjacent / semisextile' }),
  2: Object.freeze({ distance: 'two signs apart', relation: 'sextile' }),
  3: Object.freeze({ distance: 'three signs apart', relation: 'square' }),
  4: Object.freeze({ distance: 'four signs apart', relation: 'trine' }),
  5: Object.freeze({ distance: 'five signs apart', relation: 'quincunx / inconjunct / aversion' }),
  6: Object.freeze({ distance: 'six signs apart', relation: 'opposition' }),
});

export const ANIMAL_RELATION_FAMILIES = Object.freeze([
  Object.freeze({
    key: 'liuhe', label: 'liuhe · harmony', note: 'one of the six harmony pairs',
    pairs: Object.freeze([
      ['rat', 'ox'], ['tiger', 'pig'], ['rabbit', 'dog'],
      ['dragon', 'rooster'], ['snake', 'monkey'], ['horse', 'goat'],
    ]),
  }),
  Object.freeze({
    key: 'chong', label: 'chong · opposition', note: 'one of the six oppositions · branches six apart',
    pairs: Object.freeze([
      ['rat', 'horse'], ['ox', 'goat'], ['tiger', 'monkey'],
      ['rabbit', 'rooster'], ['dragon', 'dog'], ['snake', 'pig'],
    ]),
  }),
  Object.freeze({
    key: 'sanhe', label: 'sanhe · trine', note: 'two members of a named three-branch group',
    groups: Object.freeze([
      ['rat', 'dragon', 'monkey'], ['ox', 'snake', 'rooster'],
      ['tiger', 'horse', 'dog'], ['rabbit', 'goat', 'pig'],
    ]),
  }),
  Object.freeze({
    key: 'hai', label: 'hai · harm', note: 'one of the six harms',
    pairs: Object.freeze([
      ['rat', 'goat'], ['ox', 'horse'], ['tiger', 'snake'],
      ['rabbit', 'dragon'], ['monkey', 'pig'], ['rooster', 'dog'],
    ]),
  }),
  Object.freeze({
    key: 'xing', label: 'xing · punishment', note: 'part of a cyclic or mutual punishment relation',
    groups: Object.freeze([
      ['tiger', 'snake', 'monkey'], ['ox', 'dog', 'goat'],
    ]),
    pairs: Object.freeze([['rat', 'rabbit']]),
  }),
]);

export const ELEMENTS = Object.freeze(['wood', 'fire', 'earth', 'metal', 'water']);
export const ELEMENT_SHENG = Object.freeze({
  wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood',
});
export const ELEMENT_KE = Object.freeze({
  wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood',
});

export const MASTER_REDUCTION_LINKS = Object.freeze([
  Object.freeze([11, 2]), Object.freeze([22, 4]), Object.freeze([33, 6]),
]);

export const MAJOR_ARCANA = Object.freeze([
  'the fool', 'the magician', 'the high priestess', 'the empress',
  'the emperor', 'the hierophant', 'the lovers', 'the chariot',
  'strength', 'the hermit', 'wheel of fortune', 'justice',
  'the hanged man', 'death', 'temperance', 'the devil',
  'the tower', 'the star', 'the moon', 'the sun', 'judgement', 'the world',
]);

export const CONCORDANCE_QUALIFIER = 'recorded, not certified.';
