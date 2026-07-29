// 8ball / tests / helpers / source.js
//
// Shared source-text helpers for the scans that assert things about CODE
// rather than about behaviour. A plain module — NO describe/it — so
// importing it never re-runs a suite (same rule as helpers/voice-register.js).
//
// WHY THIS EXISTS. Several guards ban an identifier from a module: "no
// `expression:` in live code", "no anti-fit identifier in the share path",
// "no localStorage in ui/public.js". Every one of them fired on its own
// explanatory COMMENT the first time it was written, because the comment is
// where the retired vocabulary gets named and the reason recorded (L17:
// supersede, don't erase). That happened three separate times on
// 2026-07-29 before the helper was extracted.
//
// The fix each time was the same three lines, which is the definition of a
// fork worth de-forking per §7 — a rule fixed in one copy and missed in the
// others is exactly the drift `core/math.js`'s header warns about.

/**
 * Source with `//` comment lines dropped, so an identifier ban applies to
 * live code and not to the prose explaining why the ban exists.
 *
 * Deliberately line-based and dumb: it does not parse JS, so a `//` inside a
 * string literal would be treated as a comment. That is acceptable for the
 * bans that use it (they scan for identifiers, not for string contents) and
 * it keeps the helper from needing a parser this repo does not vendor (§12).
 */
export const codeOnly = src =>
  String(src).split('\n').filter(line => !line.trim().startsWith('//')).join('\n');
