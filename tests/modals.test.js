// 8ball / tests / modals.test.js
// ui/modals.js DI shape + boot wiring (DOCTRINE §6 v0.23 split, §4.A gate).
// The about / forget / 18+ age-gate controllers were extracted from
// index.html during the Coordinate Legibility Pack cycle to free the line
// budget. These pins lock the locked init*UI({refs},{hooks}) shape, the
// no-new-key invariant, and the index.html boot wiring.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8');
const modalsJs = readFileSync(join(__dirname, '..', 'ui', 'modals.js'), 'utf-8');

describe('ui/modals.js DI shape (DOCTRINE §6 v0.23)', () => {
  it('exports initModalsUI with (refs, hooks) arity', () => {
    expect(modalsJs).toMatch(/export function initModalsUI\s*\(\s*refs\s*,\s*hooks\s*\)/);
  });

  it('exports the pure isAgeAcknowledged helper', () => {
    expect(modalsJs).toMatch(/export function isAgeAcknowledged\s*\(/);
  });

  it('owns the canonical age-ack key as a bare const (privacy_scan resolvable)', () => {
    expect(modalsJs).toMatch(/const AGE_ACK_KEY = 'eight_ball_age_ack_v1'/);
  });

  it('introduces no new localStorage key — age-ack is the only key string', () => {
    const keys = modalsJs.match(/'eight_ball_[a-z0-9_]+'/g) || [];
    expect([...new Set(keys)]).toEqual(["'eight_ball_age_ack_v1'"]);
  });

  it('index.html boots the modal surface via initModalsUI', () => {
    expect(html).toMatch(/import\s*\{[^}]*initModalsUI[^}]*\}\s*from\s*['"]\.\/ui\/modals\.js['"]/);
    expect(html).toMatch(/initModalsUI\(/);
    expect(html).toMatch(/modalsUI\.showAgeGate\(\)/);
  });

  it('index.html no longer defines the inline modal handlers', () => {
    expect(html).not.toMatch(/function showAgeGate\s*\(/);
    expect(html).not.toMatch(/function acknowledgeAge\s*\(/);
    expect(html).not.toMatch(/function openAbout\s*\(/);
  });

  it('escape-to-close reaches the paywall via injected hooks, not a cross-module import', () => {
    expect(modalsJs).toMatch(/isPaywallOpen/);
    expect(modalsJs).toMatch(/closePaywall/);
    // modals.js must NOT import payments.js — the paywall arrives via hooks.
    expect(modalsJs).not.toMatch(/from ['"]\.\/payments\.js['"]/);
  });
});
