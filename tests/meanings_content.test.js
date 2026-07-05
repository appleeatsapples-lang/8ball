// tests/meanings_content.test.js
// content/meanings.v1.js completeness + voice-register scan (DOCTRINE §2/§4).
// Imports the canonical BANNED_VOICE_REGISTER / BANNED_PATTERNS from the
// shared tests/helpers/voice-register.js rather than duplicating them — no
// drift possible by construction (contrast tests/lab_sun_order_drift.test.js's
// approach, which guarded a duplication that no longer exists post-lab-purge).

import { describe, it, expect } from 'vitest';
import { SUN_SIGNS, ANIMALS } from '../core/profile.js';
import { MAJOR_ARCANA } from '../core/birthcard.js';
import {
  ARCANA_MEANINGS,
  SUN_MEANINGS,
  ANIMAL_MEANINGS,
  LIFE_PATH_MEANINGS,
} from '../content/meanings.v1.js';
import { BANNED_VOICE_REGISTER, BANNED_PATTERNS } from './helpers/voice-register.js';

const LIFE_PATH_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '11', '22', '33'];

describe('content/meanings.v1.js — completeness against canonical value lists', () => {
  it('has an entry for every MAJOR_ARCANA name', () => {
    const missing = MAJOR_ARCANA.filter(name => !(name in ARCANA_MEANINGS));
    expect(missing, `missing arcana entries: ${missing.join(', ')}`).toEqual([]);
    expect(Object.keys(ARCANA_MEANINGS)).toHaveLength(MAJOR_ARCANA.length);
  });

  it('has an entry for every SUN_SIGNS name', () => {
    const names = SUN_SIGNS.map(s => s.name);
    const missing = names.filter(name => !(name in SUN_MEANINGS));
    expect(missing, `missing sun entries: ${missing.join(', ')}`).toEqual([]);
    expect(Object.keys(SUN_MEANINGS)).toHaveLength(names.length);
  });

  it('has an entry for every ANIMALS value', () => {
    const missing = ANIMALS.filter(a => !(a in ANIMAL_MEANINGS));
    expect(missing, `missing animal entries: ${missing.join(', ')}`).toEqual([]);
    expect(Object.keys(ANIMAL_MEANINGS)).toHaveLength(ANIMALS.length);
  });

  it('has an entry for every canonical life path value (1-9, 11, 22, 33)', () => {
    const missing = LIFE_PATH_KEYS.filter(k => !(k in LIFE_PATH_MEANINGS));
    expect(missing, `missing life path entries: ${missing.join(', ')}`).toEqual([]);
    expect(Object.keys(LIFE_PATH_MEANINGS)).toHaveLength(LIFE_PATH_KEYS.length);
  });

  it('every entry has non-empty register + body strings', () => {
    const tables = { ARCANA_MEANINGS, SUN_MEANINGS, ANIMAL_MEANINGS, LIFE_PATH_MEANINGS };
    const malformed = [];
    for (const [tableName, table] of Object.entries(tables)) {
      for (const [key, entry] of Object.entries(table)) {
        if (typeof entry?.register !== 'string' || !entry.register.trim()) {
          malformed.push(`${tableName}.${key}: missing/empty register`);
        }
        if (typeof entry?.body !== 'string' || !entry.body.trim()) {
          malformed.push(`${tableName}.${key}: missing/empty body`);
        }
      }
    }
    expect(malformed, malformed.join('\n')).toEqual([]);
  });
});

describe('content/meanings.v1.js — voice register + content policy (DOCTRINE §2/§4)', () => {
  function* meaningStrings() {
    const tables = { arcana: ARCANA_MEANINGS, sun: SUN_MEANINGS, animal: ANIMAL_MEANINGS, lifePath: LIFE_PATH_MEANINGS };
    for (const [tableName, table] of Object.entries(tables)) {
      for (const [key, entry] of Object.entries(table)) {
        yield { path: `${tableName}.${key}.register`, text: entry.register ?? '' };
        yield { path: `${tableName}.${key}.body`, text: entry.body ?? '' };
      }
    }
  }

  it('no BANNED_VOICE_REGISTER hits', () => {
    const hits = [];
    for (const { path, text } of meaningStrings()) {
      for (const term of BANNED_VOICE_REGISTER) {
        const re = new RegExp(`\\b${term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
        if (re.test(text)) hits.push(`${path}: matched "${term}" in "${text.slice(0, 80)}…"`);
      }
    }
    expect(hits, `Voice-register violations in meanings.v1.js:\n${hits.join('\n')}`).toEqual([]);
  });

  it('no BANNED_PATTERNS slur hits', () => {
    const hits = [];
    for (const { path, text } of meaningStrings()) {
      for (const re of BANNED_PATTERNS) {
        if (re.test(text)) hits.push(`${path}: matched ${re}`);
      }
    }
    expect(hits, hits.join('\n')).toEqual([]);
  });

  it('never addresses the reader directly ("you"/"your")', () => {
    const hits = [];
    for (const { path, text } of meaningStrings()) {
      if (/\byou\b|\byour\b|\byou're\b/i.test(text)) hits.push(path);
    }
    expect(hits, `Second-person address found in:\n${hits.join('\n')}`).toEqual([]);
  });

  it('no anti-diagnostic-framing terms (DOCTRINE §4)', () => {
    const hits = [];
    for (const { path, text } of meaningStrings()) {
      if (/\b(diagnos(is|e|ed)|disorder|syndrome)\b/i.test(text)) hits.push(path);
    }
    expect(hits, hits.join('\n')).toEqual([]);
  });
});
