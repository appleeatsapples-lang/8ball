// 8ball / tests / boot.test.js
// ui/boot.js — the ordered page-load sequence (§6 split).
//
// Until this file existed the boot sequence was the only part of the app
// with no execution coverage at all: it lived inside index.html's inline
// module, which the suite reads as text but never runs. Its individual
// steps each had unit tests; the ORDER did not, and the order is what had
// actually broken before (see the corrupt-payload comment in ui/boot.js).
//
// Three regex scans in tests/dob_validation.test.js and tests/tiers.test.js
// used to grep index.html for these sequences. They now read ui/boot.js,
// and the assertions below are the behavioral half they could never be: a
// scan proves two statements are present, not that one runs before the
// other.
//
// Pure hooks, no DOM — node env, no jsdom, same convention as the rest of
// the suite.

import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runBoot } from '../ui/boot.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8');
const bootJs = readFileSync(join(__dirname, '..', 'ui', 'boot.js'), 'utf-8');

// Every hook runBoot destructures, with a benign default. `impls` overrides
// the behavior; `calls` records the invocation order across all of them so
// sequencing can be asserted directly rather than inferred.
const HOOK_DEFAULTS = {
  applyLabelsState: () => {},
  isLabelsRevealed: () => true,
  primeUnsealBaseline: () => {},
  getRenderTier: () => 'free',
  handlePaidReturn: () => false,
  saveProfile: () => {},
  loadSavedProfile: () => null,
  populateRisingFields: () => {},
  profileFromPayload: () => ({ lifePath: 5 }),
  ensureFacetIndex: () => {},
  showResult: () => {},
  clearProfile: () => {},
  clearFacetIndex: () => {},
  resetFormDisplay: () => {},
};

function makeHooks(impls = {}) {
  const calls = [];
  const hooks = {};
  for (const [name, fallback] of Object.entries(HOOK_DEFAULTS)) {
    const impl = Object.prototype.hasOwnProperty.call(impls, name)
      ? impls[name]
      : fallback;
    hooks[name] = vi.fn((...args) => { calls.push(name); return impl(...args); });
  }
  return { hooks, calls };
}

const PAYLOAD = { name: 'Stored', dob: '1990-06-15' };

describe('ui/boot.js — step order', () => {
  it('primes the unseal baseline BEFORE the paid return applies the purchase', () => {
    // v0.7.0: the baseline has to be the tier as it was on arrival, so a
    // paid-return boot unseals exactly the delta. Reversed, the baseline
    // would already include the purchase and nothing would unseal.
    const { hooks, calls } = makeHooks();
    runBoot(hooks);
    expect(calls.indexOf('primeUnsealBaseline'))
      .toBeLessThan(calls.indexOf('handlePaidReturn'));
  });

  it('runs the paid return BEFORE rehydrating the stored profile (§6.6)', () => {
    // The tier write and any pending-profile consumption must be persisted
    // before loadSavedProfile reads storage, or a paid return renders at
    // the pre-purchase density.
    const { hooks, calls } = makeHooks({ loadSavedProfile: () => PAYLOAD });
    runBoot(hooks);
    expect(calls.indexOf('handlePaidReturn'))
      .toBeLessThan(calls.indexOf('loadSavedProfile'));
  });

  it('applies the saved labels state before anything else', () => {
    const { hooks, calls } = makeHooks();
    runBoot(hooks);
    expect(calls[0]).toBe('isLabelsRevealed');
    expect(calls[1]).toBe('applyLabelsState');
  });

  it('populates the rising fields BEFORE rebuilding the profile', () => {
    // Order matters for the failure path: profileFromPayload throwing after
    // populateRisingFields has already set selectedCity is exactly the case
    // the catch block has to undo.
    const { hooks, calls } = makeHooks({ loadSavedProfile: () => PAYLOAD });
    runBoot(hooks);
    expect(calls.indexOf('populateRisingFields'))
      .toBeLessThan(calls.indexOf('profileFromPayload'));
  });

  it('the whole happy-path sequence, in order', () => {
    const { hooks, calls } = makeHooks({
      loadSavedProfile: () => PAYLOAD,
      getRenderTier: () => 't3',
    });
    runBoot(hooks);
    // getRenderTier is consulted twice by design — once for the baseline,
    // once for the render density — so filter it out of the shape check.
    expect(calls.filter(c => c !== 'getRenderTier')).toEqual([
      'isLabelsRevealed',
      'applyLabelsState',
      'primeUnsealBaseline',
      'handlePaidReturn',
      'loadSavedProfile',
      'populateRisingFields',
      'profileFromPayload',
      'ensureFacetIndex',
      'showResult',
    ]);
  });
});

describe('ui/boot.js — labels and baseline', () => {
  it('passes the persisted reveal state straight through', () => {
    for (const revealed of [true, false]) {
      const { hooks } = makeHooks({ isLabelsRevealed: () => revealed });
      runBoot(hooks);
      expect(hooks.applyLabelsState).toHaveBeenCalledWith(revealed);
    }
  });

  it('primes the baseline with the tier read at arrival', () => {
    const { hooks } = makeHooks({ getRenderTier: () => 't2' });
    runBoot(hooks);
    expect(hooks.primeUnsealBaseline).toHaveBeenCalledWith('t2');
  });
});

describe('ui/boot.js — paid return', () => {
  it('persists a consumed pending profile through saveProfile', () => {
    const pending = { name: 'Paid Path', dob: '1999-09-09', birthplace: 'x' };
    const { hooks } = makeHooks({
      handlePaidReturn: onConsume => { onConsume(pending); return true; },
    });
    runBoot(hooks);
    // name and dob are passed positionally alongside the whole payload —
    // saveProfile owns the v0.2.7.2 city+tz shape.
    expect(hooks.saveProfile).toHaveBeenCalledWith(pending.name, pending.dob, pending);
  });

  it('a consumed pending profile resets the facet anchor; a plain boot does not', () => {
    for (const consumed of [true, false]) {
      const { hooks } = makeHooks({
        handlePaidReturn: () => consumed,
        loadSavedProfile: () => PAYLOAD,
        getRenderTier: () => 't3',
        profileFromPayload: () => ({ lifePath: 7 }),
      });
      runBoot(hooks);
      expect(hooks.ensureFacetIndex).toHaveBeenCalledWith(7, { reset: consumed });
    }
  });
});

describe('ui/boot.js — rehydration', () => {
  it('renders nothing when there is no stored profile', () => {
    const { hooks } = makeHooks({ loadSavedProfile: () => null });
    runBoot(hooks);
    expect(hooks.populateRisingFields).not.toHaveBeenCalled();
    expect(hooks.showResult).not.toHaveBeenCalled();
    // and it is not treated as corruption — nothing is cleared
    expect(hooks.clearProfile).not.toHaveBeenCalled();
    expect(hooks.resetFormDisplay).not.toHaveBeenCalled();
  });

  it('renders the rehydrated profile at the stored tier', () => {
    const profile = { lifePath: 3 };
    const { hooks } = makeHooks({
      loadSavedProfile: () => PAYLOAD,
      profileFromPayload: () => profile,
      getRenderTier: () => 't2',
    });
    runBoot(hooks);
    expect(hooks.populateRisingFields).toHaveBeenCalledWith(PAYLOAD);
    expect(hooks.showResult).toHaveBeenCalledWith(profile, { tier: 't2' });
  });

  it('anchors the facet index only at t3', () => {
    for (const tier of ['free', 't1', 't2']) {
      const { hooks } = makeHooks({
        loadSavedProfile: () => PAYLOAD,
        getRenderTier: () => tier,
      });
      runBoot(hooks);
      expect(hooks.ensureFacetIndex, tier).not.toHaveBeenCalled();
      expect(hooks.showResult, tier).toHaveBeenCalled();
    }
  });
});

describe('ui/boot.js — corrupt stored profile', () => {
  // The failure this guards, verbatim from the module comment: without the
  // form reset, "the next submission would silently inherit the discarded
  // city's tz/lat/lng — a wrong rising sign baked into a new person's
  // profile."
  const boom = () => { throw new Error('impossible date'); };

  it('does not crash boot', () => {
    const { hooks } = makeHooks({
      loadSavedProfile: () => PAYLOAD,
      profileFromPayload: boom,
    });
    expect(() => runBoot(hooks)).not.toThrow();
  });

  it('clears storage AND resets the form, and renders nothing', () => {
    const { hooks } = makeHooks({
      loadSavedProfile: () => PAYLOAD,
      profileFromPayload: boom,
    });
    runBoot(hooks);
    expect(hooks.clearProfile).toHaveBeenCalled();
    expect(hooks.clearFacetIndex).toHaveBeenCalled();
    expect(hooks.resetFormDisplay).toHaveBeenCalled();
    expect(hooks.showResult).not.toHaveBeenCalled();
  });

  it('resets the form even though populateRisingFields already ran', () => {
    // populateRisingFields sets the module-level selectedCity from the bad
    // payload's birthplace before the throw; resetFormDisplay nulls it.
    // A catch that only cleared storage would leave the stale city armed.
    const { hooks, calls } = makeHooks({
      loadSavedProfile: () => PAYLOAD,
      profileFromPayload: boom,
    });
    runBoot(hooks);
    expect(calls.indexOf('populateRisingFields'))
      .toBeLessThan(calls.indexOf('resetFormDisplay'));
  });

  it('a throw from showResult is caught by the same guard', () => {
    // The try wraps the render too, so a bad card lookup cannot leave the
    // page half-rendered with a live corrupt payload still in storage.
    const { hooks } = makeHooks({
      loadSavedProfile: () => PAYLOAD,
      showResult: boom,
    });
    expect(() => runBoot(hooks)).not.toThrow();
    expect(hooks.clearProfile).toHaveBeenCalled();
    expect(hooks.resetFormDisplay).toHaveBeenCalled();
  });
});

describe('ui/boot.js — host wiring', () => {
  it('index.html imports runBoot from ui/boot.js', () => {
    expect(html).toMatch(
      /import\s*\{\s*runBoot\s*\}\s*from\s*['"]\.\/ui\/boot\.js['"]/
    );
  });

  it('index.html no longer defines the boot sequence inline', () => {
    expect(html).not.toMatch(/function boot\s*\(/);
  });

  it('the host supplies exactly the hooks runBoot destructures', () => {
    // The one wiring failure this refactor introduces: add a hook to
    // ui/boot.js, forget it at the call site, and boot throws on the first
    // load with nothing in the suite to say so. Compares the destructured
    // parameter names against the keys of the runBoot({...}) literal.
    const declared = bootJs
      .match(/export function runBoot\(\{([\s\S]*?)\}\)/)[1]
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const wired = html
      .match(/runBoot\(\{([\s\S]*?)\n\}\);/)[1]
      .split('\n')
      .map(line => line.trim().replace(/:.*$/, '').replace(/,$/, ''))
      .filter(Boolean);

    expect(declared.length).toBeGreaterThan(0);
    expect(new Set(wired)).toEqual(new Set(declared));
  });
});
