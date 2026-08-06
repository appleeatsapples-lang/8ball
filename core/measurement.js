// 8ball / core/measurement.js
// The measurement CONTRACT (DOCTRINE §5 v0.70 / §7 gate 7).
//
// What this is: the closed list of the only four things the product may ever
// count, the only payload shape a count may carry, and one injectable local
// sink so the contract is exercised by real render paths instead of asserted
// in the abstract.
//
// What this is NOT: a tracker, and not a client for any measurement service.
// No collector exists and none is proposed here. The default sink is null,
// so every call is a no-op that returns its record and does nothing with it.
// This module makes no network call of any kind (§5 bans those primitives in
// tracked source and `tests/privacy_scan.test.js` enforces the ban), names no
// localStorage key, reads none and writes none, and forms NO identity — no
// id, no session token, no counter, no timestamp, nothing that could join two
// records into a person.
//
// The payload is BUILT from a two-field whitelist rather than filtered down
// from the caller's object. That is the load-bearing choice: a filter can be
// widened by a later edit and nobody notices, whereas an object literal with
// exactly two keys cannot carry a name, a DOB, a gender, a city, a coordinate
// value or a card string even if a call site passes one in.
//
// Adopting an actual collector requires a §5 amendment first. The operator
// plan at `audits/measurement_plan_2026-08-06.md` is the document that argues
// for or against one — not this file.

/** The four events. This list is CLOSED — a fifth needs a doctrine amendment. */
export const MEASUREMENT_EVENTS = Object.freeze([
  'reading_completed',
  'paid_t3_cta_clicked',
  'comparative_opened',
  'share_completed',
]);

/**
 * The only field a record may carry beside its own name: the render tier,
 * from the §1.D closed vocabulary. It is device density, never a person — it
 * says which rung this browser owns, which is exactly the question the four
 * events exist to answer, and it is already the whole of what
 * `eight_ball_tier_v1` stores.
 */
export const MEASUREMENT_TIERS = Object.freeze(['free', 't1', 't2', 't3']);

export function isMeasurementEvent(name) {
  return MEASUREMENT_EVENTS.includes(name);
}

/**
 * Build the frozen record for (event, tier), or null if either is outside its
 * vocabulary. Total and pure — it never throws, so a bad call at a render
 * seam cannot take the render down with it.
 *
 * @returns {{event: string, tier: string} | null}
 */
export function buildMeasurementRecord(event, tier) {
  if (!isMeasurementEvent(event)) return null;
  if (!MEASUREMENT_TIERS.includes(tier)) return null;
  // Two keys, written out. Nothing from the caller reaches this object except
  // two values that have each been checked against a closed list.
  return Object.freeze({ event, tier });
}

// ── the local seam ────────────────────────────────────────────────
// One module-local sink, null by default. Nothing in the product sets it;
// the tests do, which is how the four call sites are proven to fire with the
// right event at the right moment rather than merely to exist.

let _sink = null;

/** Install (or clear, with null) the local sink. */
export function setMeasurementSink(sink) {
  _sink = typeof sink === 'function' ? sink : null;
}

/**
 * Record one event. Returns the record that was emitted, or null if the
 * arguments failed the vocabulary check — in which case NOTHING is emitted.
 *
 * A throwing sink is swallowed: measurement is an observer and must never be
 * able to break a reading, a checkout tap, or a share.
 */
export function recordMeasurement(event, tier) {
  const record = buildMeasurementRecord(event, tier);
  if (!record) return null;
  if (_sink) {
    try { _sink(record); } catch (_) {}
  }
  return record;
}
