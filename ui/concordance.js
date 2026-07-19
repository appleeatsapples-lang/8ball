// Registry + Concordance MVP — pure post-calculation relation lookup.
//
// Callers supply two profiles already produced by the existing calculation
// pipeline. This module neither imports nor changes the calculation engine,
// and it has no DOM, storage, network, account, or analytics capability.

import {
  ANIMAL_RELATION_FAMILIES,
  CONCORDANCE_QUALIFIER,
  ELEMENT_KE,
  ELEMENT_SHENG,
  ELEMENTS,
  MAJOR_ARCANA,
  MASTER_REDUCTION_LINKS,
  REGISTRY_SOURCES,
  SIGNS,
  SIGN_DISTANCE_RELATIONS,
} from '../content/concordance.v1.js';

export const CONCORDANCE_STATUSES = Object.freeze({
  registered: 'a named registry attests the relation',
  adjacent: 'both records can be shown together, but no shared registry is claimed',
  unfiled: 'the checked registry contains no named relation for this pair',
});

const pairKey = (a, b) => [String(a), String(b)].sort().join('|');

function expandPairs(family) {
  const pairs = [...(family.pairs || [])];
  for (const group of family.groups || []) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) pairs.push([group[i], group[j]]);
    }
  }
  return pairs;
}

const ANIMAL_RELATIONS = (() => {
  const map = new Map();
  for (const family of ANIMAL_RELATION_FAMILIES) {
    for (const [a, b] of expandPairs(family)) {
      const key = pairKey(a, b);
      const relations = map.get(key) || [];
      relations.push({ label: family.label, note: family.note });
      map.set(key, relations);
    }
  }
  return map;
})();

function unfiled(key, label, left, right, registry) {
  return {
    key, label, left: String(left), right: String(right), status: 'unfiled',
    relation: 'no named relation is filed for this pair.',
    registry,
    citation: `registry checked: ${registry}`,
    qualifier: CONCORDANCE_QUALIFIER,
  };
}

function registered(key, label, left, right, relation, registry, citation) {
  return {
    key, label, left: String(left), right: String(right), status: 'registered',
    relation, registry, citation, qualifier: CONCORDANCE_QUALIFIER,
  };
}

function compareSun(left, right) {
  const a = SIGNS.indexOf(left);
  const b = SIGNS.indexOf(right);
  if (a < 0 || b < 0) throw new TypeError('invalid sun sign');
  if (a === b) return unfiled('sun', 'sun sign', left, right, REGISTRY_SOURCES.sun);
  const distance = Math.min(Math.abs(a - b), 12 - Math.abs(a - b));
  const record = SIGN_DISTANCE_RELATIONS[distance];
  return registered(
    'sun', 'sun sign', left, right,
    `${record.distance} · ${record.relation}`,
    REGISTRY_SOURCES.sun,
    `filed under western sign-distance relations at distance ${distance}`,
  );
}

function compareAnimal(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') throw new TypeError('invalid public animal');
  const relations = ANIMAL_RELATIONS.get(pairKey(left, right));
  if (!relations || left === right) {
    return unfiled('animal', 'public animal', left, right, REGISTRY_SOURCES.animal);
  }
  return registered(
    'animal', 'public animal', left, right,
    relations.map(item => item.label).join(' + '),
    REGISTRY_SOURCES.animal,
    relations.map(item => item.note).join('; '),
  );
}

function elementRelation(left, right) {
  if (ELEMENT_SHENG[left] === right) return { cycle: 'sheng', relation: `${left} generates ${right}` };
  if (ELEMENT_SHENG[right] === left) return { cycle: 'sheng', relation: `${right} generates ${left}` };
  if (ELEMENT_KE[left] === right) return { cycle: 'ke', relation: `${left} overcomes ${right}` };
  if (ELEMENT_KE[right] === left) return { cycle: 'ke', relation: `${right} overcomes ${left}` };
  return null;
}

function compareElement(left, right) {
  if (!ELEMENTS.includes(left) || !ELEMENTS.includes(right)) throw new TypeError('invalid element');
  const relation = left === right ? null : elementRelation(left, right);
  if (!relation) return unfiled('element', 'five-element', left, right, REGISTRY_SOURCES.element);
  return registered(
    'element', 'five-element', left, right,
    `${relation.relation} · ${relation.cycle} cycle`,
    REGISTRY_SOURCES.element,
    `filed under wuxing ${relation.cycle} cycle; direction is part of the record`,
  );
}

function compareLifePath(left, right) {
  if (!Number.isInteger(left) || !Number.isInteger(right)) throw new TypeError('invalid life path');
  const record = MASTER_REDUCTION_LINKS.find(([master, base]) =>
    pairKey(master, base) === pairKey(left, right));
  if (!record || left === right) {
    return unfiled('lifePath', 'life path', left, right, REGISTRY_SOURCES.lifePath);
  }
  const [master, base] = record;
  return registered(
    'lifePath', 'life path', left, right,
    `${master} reduces to ${base}`,
    REGISTRY_SOURCES.lifePath,
    'the sheet keeps the master unreduced; the reduction is the filed link',
  );
}

function compareBirthCard(left, right) {
  const a = left && left.number;
  const b = right && right.number;
  if (!Number.isInteger(a) || !Number.isInteger(b)
      || a < 0 || b < 0 || a >= MAJOR_ARCANA.length || b >= MAJOR_ARCANA.length) {
    throw new TypeError('invalid birth card');
  }
  const leftLabel = left.label || MAJOR_ARCANA[a];
  const rightLabel = right.label || MAJOR_ARCANA[b];
  if (Math.abs(a - b) !== 1) {
    return unfiled('birthCard', 'birth card', leftLabel, rightLabel, REGISTRY_SOURCES.birthCard);
  }
  const first = Math.min(a, b);
  const second = Math.max(a, b);
  return registered(
    'birthCard', 'birth card', leftLabel, rightLabel,
    `${MAJOR_ARCANA[first]} precedes ${MAJOR_ARCANA[second]}`,
    REGISTRY_SOURCES.birthCard,
    'filed as sequence adjacency in rws-golden-dawn numbering',
  );
}

export function buildConcordance(left, right, options = {}) {
  if (!left || typeof left !== 'object' || !right || typeof right !== 'object') {
    throw new TypeError('two calculated profiles are required');
  }
  const tier = ['t1', 't2', 't3'].includes(options.tier) ? options.tier : 'free';
  const axes = [
    compareSun(left.sunSign, right.sunSign),
    compareAnimal(left.animal, right.animal),
  ];
  if (tier !== 'free') axes.push(compareElement(left.chineseElement, right.chineseElement));
  axes.push(
    compareLifePath(left.lifePath, right.lifePath),
    compareBirthCard(left.birthCard, right.birthCard),
  );
  return {
    tier,
    axes,
    omitted: tier === 'free' ? ['element'] : [],
    retention: 'transient',
  };
}
