// tests/lab_sun_order_drift.test.js — lab SUN_ORDER must track core/engine.js

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function extractSunOrderLiteral(filePath) {
  const src = readFileSync(filePath, 'utf-8');
  const match = src.match(/const SUN_ORDER = \[([\s\S]*?)\];/);
  if (!match) throw new Error(`SUN_ORDER literal not found in ${filePath}`);
  return [...match[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
}

const ENGINE_SUN_ORDER = extractSunOrderLiteral(join(__dirname, '../core/engine.js'));
const LAB_SUN_ORDER = extractSunOrderLiteral(join(__dirname, '../lab/interrogate-shared.js'));

describe('lab SUN_ORDER drift guard', () => {
  it('lab/interrogate-shared.js SUN_ORDER matches core/engine.js', () => {
    expect(LAB_SUN_ORDER).toEqual(ENGINE_SUN_ORDER);
  });

  it('would fail on simulated divergence', () => {
    const diverged = [...ENGINE_SUN_ORDER];
    diverged[0] = 'bogus';
    expect(LAB_SUN_ORDER).not.toEqual(diverged);
  });
});