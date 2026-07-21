// Current relation registries for the strict nine-number numerology contract.
// The shipped v1 registry stays immutable as historical record; v2 reuses its
// non-numerology tables while retiring master-number reduction links.

import {
  REGISTRY_SOURCES as V1_REGISTRY_SOURCES,
  SIGNS,
  SIGN_DISTANCE_RELATIONS,
  ANIMAL_RELATION_FAMILIES,
  ELEMENTS,
  ELEMENT_SHENG,
  ELEMENT_KE,
  MAJOR_ARCANA,
  CONCORDANCE_QUALIFIER,
} from './concordance.v1.js';

export {
  SIGNS,
  SIGN_DISTANCE_RELATIONS,
  ANIMAL_RELATION_FAMILIES,
  ELEMENTS,
  ELEMENT_SHENG,
  ELEMENT_KE,
  MAJOR_ARCANA,
  CONCORDANCE_QUALIFIER,
};

export const LIFE_PATH_VALUES = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9]);

export const REGISTRY_SOURCES = Object.freeze({
  ...V1_REGISTRY_SOURCES,
  lifePath: 'pythagorean numerology · nine-number system',
});
