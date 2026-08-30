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
  LIFE_PATH_VALUES,
  MAJOR_ARCANA,
  MASTER_REDUCTION_LINKS,
  REGISTRY_SOURCES,
  SIGNS,
  SIGN_DISTANCE_RELATIONS,
} from '../content/concordance.v3.js';
import { isTier } from '../core/payments.js';

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

// The three filed master-reduction links, keyed both ways round so the axis
// reads the same whichever saved entry is on the left. Built from the
// immutable v1 inventory (via content/concordance.v3.js) rather than
// re-listed, so the active registry holds EXACTLY those three and cannot
// acquire a fourth by hand.
const MASTER_LINKS = new Map(
  MASTER_REDUCTION_LINKS.map(([master, base]) => [pairKey(master, base), { master, base }])
);

function compareLifePath(left, right) {
  if (!LIFE_PATH_VALUES.includes(left) || !LIFE_PATH_VALUES.includes(right)) {
    throw new TypeError('invalid life path');
  }
  // Same-value pairs are never filed: a value does not reduce to itself, so
  // there is no named relation and §1.I's register law says to say so. Every
  // other distinct pair outside the three links is likewise `unfiled` — no
  // compatibility claim is manufactured to fill the cell.
  const link = left === right ? undefined : MASTER_LINKS.get(pairKey(left, right));
  if (!link) {
    return unfiled('lifePath', 'life path', left, right, REGISTRY_SOURCES.lifePath);
  }
  return registered(
    'lifePath', 'life path', left, right,
    `${link.master} reduces to ${link.base}`,
    REGISTRY_SOURCES.lifePath,
    `filed as a master-number reduction link between ${link.master} and ${link.base}`,
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

/**
 * Intra-sheet filed relation for ONE coordinate against the rest of its own
 * sheet (§1.I registries applied within a single reading — PR #212 audit
 * follow-up, optimization item 3). Pure and total: takes the tapped
 * coordinate key plus the sheet's raw display values (the same dict
 * ui/meanings.js assembles from the card DOM), returns a
 * { label, left, right, relation, citation } record when a REGISTERED
 * relation exists for a defined pair, and null otherwise. Only registered
 * relations surface — the panel is not the compare screen, so an absent
 * section claims nothing and the §1.I no-manufactured-claim law holds by
 * omission. Sealed compartments render '' on the card, so a pair with a
 * sealed member never resolves and no paid value can leak through this
 * path. Values are display strings; anything unparseable resolves null,
 * never a throw into the render path.
 *
 * Defined pairs, fixed and few by design:
 *   sun ↔ rising            (western sign-distance registry)
 *   animal ↔ innerAnimal    (animal relation families)
 *   element ↔ dayPillar's element (wuxing sheng/ke, direction preserved)
 *   any numerology value ↔ another numerology value on the sheet
 *                           (the three master-reduction links only)
 */
const SHEET_NUMEROLOGY_KEYS = Object.freeze([
  'lifePath', 'nameNumber', 'soulUrge', 'personality', 'birthday', 'maturity',
]);
const SHEET_NUMEROLOGY_LABELS = Object.freeze({
  lifePath: 'life path', nameNumber: 'name number', soulUrge: 'soul urge',
  personality: 'personality', birthday: 'birthday', maturity: 'maturity',
});

// Adverse records, by registry vocabulary: the harmony algebra must not
// render above a filed opposition/harm/punishment/square/quincunx or a
// ke-cycle overcoming (pr213 audit, opus MED — the pr212 contradiction
// shape recurring across registries). Membership is derived from the
// relation strings the registries themselves emit, so a renamed family
// changes both sides together.
const ADVERSE_RELATION_RE = /chong|\bhai\b|xing|square|opposition|quincunx|\bke cycle\b/;

function sheetRecord(label, axis, left, right) {
  return {
    label,
    left: String(left),
    right: String(right),
    relation: axis.relation,
    registry: axis.registry,
    citation: axis.citation,
    qualifier: axis.qualifier,
    adverse: ADVERSE_RELATION_RE.test(axis.relation),
  };
}

function pillarElementOf(raw) {
  if (typeof raw !== 'string' || !raw.includes('\u00b7')) return null;
  const element = raw.split('\u00b7')[1].trim();
  return ELEMENTS.includes(element) ? element : null;
}

export function sheetRelationFor(key, values = {}) {
  const v = k => (typeof values[k] === 'string' ? values[k].trim() : '');
  try {
    if (key === 'sun' || key === 'rising') {
      const a = v('sun'); const b = v('rising');
      if (!a || !b || a === '\u2014' || b === '\u2014') return null;
      const axis = compareSun(a, b);
      if (axis.status !== 'registered') return null;
      return sheetRecord('sun and rising', axis, a, b);
    }
    if (key === 'animal' || key === 'innerAnimal') {
      const a = v('animal'); const b = v('innerAnimal');
      if (!a || !b || a === '\u2014' || b === '\u2014') return null;
      const axis = compareAnimal(a, b);
      if (axis.status !== 'registered') return null;
      return sheetRecord('public and private animal', axis, a, b);
    }
    if (key === 'element' || key === 'dayPillar') {
      const year = v('element');
      const day = pillarElementOf(v('dayPillar'));
      if (!year || !day || !ELEMENTS.includes(year)) return null;
      const axis = compareElement(year, day);
      if (axis.status !== 'registered') return null;
      return sheetRecord('year and day-pillar element', axis, year, day);
    }
    if (SHEET_NUMEROLOGY_KEYS.includes(key)) {
      const own = Number(v(key));
      if (!LIFE_PATH_VALUES.includes(own)) return null;
      for (const otherKey of SHEET_NUMEROLOGY_KEYS) {
        if (otherKey === key) continue;
        const other = Number(v(otherKey));
        if (!LIFE_PATH_VALUES.includes(other)) continue;
        const axis = compareLifePath(own, other);
        if (axis.status !== 'registered') continue;
        return sheetRecord(
          `${SHEET_NUMEROLOGY_LABELS[key]} and ${SHEET_NUMEROLOGY_LABELS[otherKey]}`,
          axis, own, other,
        );
      }
      return null;
    }
    return null;
  } catch (_) {
    return null;
  }
}

export function buildConcordance(left, right, options = {}) {
  if (!left || typeof left !== 'object' || !right || typeof right !== 'object') {
    throw new TypeError('two calculated profiles are required');
  }
  // Ladder-agnostic: an exhaustive-over-three-rungs literal silently
  // downgraded t4 to free when §1.D v0.58 appended a rung, dropping an axis
  // the device owns and labelling it "sealed at this device tier" — false.
  const tier = isTier(options.tier) ? options.tier : 'free';
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
