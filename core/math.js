// 8ball / core / math.js
// Shared arithmetic primitives (2026-07-05 standards pass).
//
// Before this file, the euclidean-mod idiom ((x % n) + n) % n was
// reimplemented in four modules — rising.js normalizeDeg and calendar.js
// normalizeAngle were byte-identical functions under different names —
// and sumDigits was duplicated verbatim in profile.js and birthcard.js.
// Identical-but-independent copies are drift risk: a fix in one silently
// misses the others. The reduction RULES built on these legitimately
// differ per module (profile.js reduces into the numerology range 1..9;
// birthcard.js reduces into the 0..21 arcana range) and stay where the
// tradition that defines them is documented.
//
// Pure functions only, leaf module — importable from anywhere in core/
// without cycle risk.

// Euclidean modulo: result carries the sign of k (always >= 0 for k > 0),
// unlike JS's remainder operator which carries the sign of n.
//
// The trailing `% k` is LOAD-BEARING, not a redundant second reduction —
// do not "simplify" this to `const r = n % k; return r < 0 ? r + k : r`.
// For a tiny negative n (|n| below about 2.8e-14 at k = 360), `r + k`
// rounds up to exactly k in float64, so the shortened form returns 360 —
// outside the [0, 360) range every caller assumes. The final `% k` folds
// that k back to 0. Verified 2026-07-29: the shortened form breaks the
// range invariant for 276 of the 320 magnitudes -2^-1 .. -2^-320, while
// this form holds for all of them. `normalizeDeg(asc - LST)` in
// rising.js is a real call site that can produce such a tiny negative
// (it does so when the ascendant converges on the local sidereal time,
// the degenerate case at the polar-circle boundary), so this is a
// reachable hazard, not a theoretical one. tests/math.test.js pins it.
export const mod = (n, k) => ((n % k) + k) % k;

// Sum of decimal digits of |n|.
export const sumDigits = n =>
  String(Math.abs(n)).split('').reduce((a, c) => a + parseInt(c, 10), 0);

// Normalize an angle in degrees to [0, 360).
export const normalizeDeg = deg => mod(deg, 360);
