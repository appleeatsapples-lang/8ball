// content/meanings.v2.js
// Additive coordinate-context layer. The shipped v1 tables remain immutable
// and are reused byte-for-byte; v2 adds the five-element table plus the
// coordinate roles needed to read one value beside the rest of the sheet.

import {
  ARCANA_MEANINGS,
  SUN_MEANINGS,
  ANIMAL_MEANINGS,
  LIFE_PATH_MEANINGS,
} from './meanings.v1.js';

export { ARCANA_MEANINGS, SUN_MEANINGS, ANIMAL_MEANINGS, LIFE_PATH_MEANINGS };

// v1 remains an immutable record of the previously shipped 12-entry table.
// The active calculation contract is now exactly 1..9, so runtime consumers
// use this deliberately narrowed view rather than the historical v1 surface.
export const NUMEROLOGY_MEANINGS = Object.freeze(Object.fromEntries(
  Array.from({ length: 9 }, (_, index) => {
    const key = String(index + 1);
    return [key, LIFE_PATH_MEANINGS[key]];
  })
));

export const ELEMENT_MEANINGS = {
  wood: {
    register: 'growth · direction',
    theme: 'growth',
    body: 'in five-element tradition, wood marks expansion with a direction — movement that develops by extending rather than holding still.',
  },
  fire: {
    register: 'activation · visibility',
    theme: 'activation',
    body: 'in five-element tradition, fire marks activation made visible — energy that spreads by expression and contact.',
  },
  earth: {
    register: 'stability · mediation',
    theme: 'stability',
    body: 'in five-element tradition, earth marks containment and mediation — a center that receives pressure and gives it usable form.',
  },
  metal: {
    register: 'precision · boundary',
    theme: 'precision',
    body: 'in five-element tradition, metal marks definition and boundary — structure sharpened by selection and restraint.',
  },
  water: {
    register: 'adaptability · depth',
    theme: 'adaptability',
    body: 'in five-element tradition, water marks depth and adaptation — movement that changes shape without losing direction.',
  },
};

// The first term in most v1 registers already works as a harmony theme.
// Number registers are role nouns, so v2 supplies their process-language
// equivalents for grammatical synthesis.
export const HARMONY_THEME_ALIASES = {
  'the initiator': 'initiative',
  'the mediator': 'cooperation',
  'the communicator': 'expression',
  'the builder': 'structure',
  'the seeker': 'change',
  'the caretaker': 'care',
  'the analyst': 'analysis',
  'the executive': 'command',
  'the humanitarian': 'service',
};

// Each coordinate has one job in the combined reading and two preferred
// neighbors. ui/meanings.js falls back to the always-open anchors when a
// preferred neighbor is sealed or unresolved.
export const COORDINATE_CONTEXT = {
  arcana: { role: 'the frame of the full reading', partners: ['sun', 'lifePath'] },
  element: { role: 'the material tempo', partners: ['sun', 'animal'] },
  sun: { role: 'the outward agenda', partners: ['animal', 'lifePath'] },
  rising: { role: 'the visible entry', partners: ['sun', 'personality'] },
  animal: { role: 'the public instinct', partners: ['sun', 'innerAnimal'] },
  innerAnimal: { role: 'the private instinct', partners: ['animal', 'soulUrge'] },
  lifePath: { role: 'the long route', partners: ['nameNumber', 'soulUrge'] },
  nameNumber: { role: 'the full-name pattern', partners: ['lifePath', 'soulUrge'] },
  soulUrge: { role: 'the inward motive', partners: ['personality', 'nameNumber'] },
  personality: { role: 'the visible interface', partners: ['soulUrge', 'birthday'] },
  birthday: { role: 'the recurring skill', partners: ['lifePath', 'maturity'] },
  maturity: { role: 'the later synthesis', partners: ['lifePath', 'nameNumber'] },
  dayPillar: { role: 'the day register', partners: ['animal', 'element'] },
  hourPillar: { role: 'the hour register', partners: ['innerAnimal', 'rising'] },
};
