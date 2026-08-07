// core/storage.js
// Versioned localStorage helper with multi-tab awareness.
//
// Addresses audit findings F1/F2 (multi-tab RMW races on readings, facet,
// and pending profile). Provides optimistic concurrency via a generation
// token and cross-tab notification via BroadcastChannel.
//
// Pure: no DOM. Safe to import from both core and ui modules.
// Supports migration from the previous plain-JSON shape so existing
// devices continue to work without a one-shot wipe.
//
// Status codes mirror the existing read-verify style used elsewhere
// in the product (ok / unavailable / quota / conflict / corrupt).

const CHANNEL_NAME = '8ball-storage-v1';

const channel = (typeof BroadcastChannel !== 'undefined')
  ? new BroadcastChannel(CHANNEL_NAME)
  : null;

/**
 * Normalize any stored value into { value, generation }.
 * Supports both legacy plain JSON and the new versioned shape { g, v }.
 */
function parseStored(raw) {
  if (raw == null) return { value: null, generation: 0 };
  try {
    const parsed = JSON.parse(raw);
    // New shape: { g: number, v: any }
    if (parsed && typeof parsed === 'object' && 'g' in parsed && 'v' in parsed) {
      return {
        value: parsed.v,
        generation: Number(parsed.g) || 0
      };
    }
    // Legacy plain value
    return { value: parsed, generation: 0 };
  } catch {
    return { value: null, generation: 0 };
  }
}

/**
 * Read a versioned key.
 * Always returns { value, generation, status }
 * status: 'ok' | 'unavailable' | 'corrupt'
 */
export function getVersioned(key, storage = (typeof localStorage !== 'undefined' ? localStorage : null)) {
  if (!storage) return { value: null, generation: 0, status: 'unavailable' };
  try {
    const raw = storage.getItem(key);
    const { value, generation } = parseStored(raw);
    return { value, generation, status: 'ok' };
  } catch {
    // QuotaExceededError, SecurityError (private mode), etc.
    return { value: null, generation: 0, status: 'unavailable' };
  }
}

/**
 * Write with optimistic concurrency.
 * expectedGeneration = undefined → force write (overwrite)
 * expectedGeneration = number → only succeed if generation still matches
 *
 * Returns { ok, generation, status, current? }
 * status: 'ok' | 'unavailable' | 'quota' | 'conflict'
 */
export function setVersioned(key, value, expectedGeneration, storage = (typeof localStorage !== 'undefined' ? localStorage : null)) {
  if (!storage) return { ok: false, status: 'unavailable' };

  const current = getVersioned(key, storage);
  if (current.status !== 'ok') {
    return { ok: false, status: current.status, current };
  }

  if (expectedGeneration !== undefined && current.generation !== expectedGeneration) {
    // Concurrent writer won
    return {
      ok: false,
      status: 'conflict',
      generation: current.generation,
      current
    };
  }

  const nextGen = current.generation + 1;
  const payload = JSON.stringify({ g: nextGen, v: value });

  try {
    storage.setItem(key, payload);
    // Notify other tabs
    if (channel) {
      try {
        channel.postMessage({ type: 'changed', key, generation: nextGen });
      } catch {
        // BroadcastChannel failures are non-fatal
      }
    }
    return { ok: true, generation: nextGen, status: 'ok' };
  } catch (err) {
    const status = (err && err.name === 'QuotaExceededError')
      ? 'quota'
      : 'unavailable';
    return { ok: false, status, current };
  }
}

/**
 * Remove a key and broadcast the removal.
 * Returns { ok, status }
 */
export function removeVersioned(key, storage = (typeof localStorage !== 'undefined' ? localStorage : null)) {
  if (!storage) return { ok: false, status: 'unavailable' };
  try {
    storage.removeItem(key);
    if (channel) {
      try {
        channel.postMessage({ type: 'removed', key });
      } catch {
        // non-fatal
      }
    }
    // Verify
    if (storage.getItem(key) !== null) {
      return { ok: false, status: 'unavailable' };
    }
    return { ok: true, status: 'ok' };
  } catch {
    return { ok: false, status: 'unavailable' };
  }
}

/**
 * Subscribe to changes from other tabs.
 * Returns an unsubscribe function.
 */
export function onStorageChange(callback) {
  if (!channel) return () => {};
  const handler = (ev) => {
    if (ev.data && (ev.data.type === 'changed' || ev.data.type === 'removed')) {
      callback(ev.data);
    }
  };
  channel.addEventListener('message', handler);
  return () => channel.removeEventListener('message', handler);
}

/**
 * Convenience constants for the keys that benefit from versioning.
 * Tier is intentionally omitted — it is already monotonic and lower risk.
 */
export const KEYS = Object.freeze({
  READINGS: 'eight_ball_saved_readings_v1',
  FACET:    'eight_ball_facet_index_v3',
  PENDING:  'eight_ball_pending_profile_v1',
});
