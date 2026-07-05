// 8ball / core / math.js
// Shared arithmetic primitives (2026-07-05 standards pass).
//
// Before this file, the euclidean-mod idiom ((x % n) + n) % n was
// reimplemented in four modules — rising.js normalizeDeg and calendar.js
// normalizeAngle were byte-identical functions under different names —
// and sumDigits was duplicated verbatim in profile.js and birthcard.js.
// Identical-but-independent copies are drift risk: a fix in one silently
// misses the others. The reduction RULES built on these legitimately
// differ per module (profile.js preserves master numbers 11/22/33;
// birthcard.js reduces into the 0..21 arcana range) and stay where the
// tradition that defines them is documented.
//
// Pure functions only, leaf module — importable from anywhere in core/
// without cycle risk.

// Euclidean modulo: result carries the sign of k (always >= 0 for k > 0),
// unlike JS's remainder operator which carries the sign of n.
export const mod = (n, k) => ((n % k) + k) % k;

// Sum of decimal digits of |n|.
export const sumDigits = n =>
  String(Math.abs(n)).split('').reduce((a, c) => a + parseInt(c, 10), 0);

// Normalize an angle in degrees to [0, 360).
export const normalizeDeg = deg => mod(deg, 360);
