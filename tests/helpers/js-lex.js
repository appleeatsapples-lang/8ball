// 8ball / tests / helpers / js-lex.js
//
// A single-pass lexical classifier for JavaScript source: every character is
// CODE, COMMENT, STRING or REGEX, with a template literal's `${...}`
// interpolations classified as CODE because they execute, and regex literals
// given their own kind so their characters can never be counted as structure.
//
// SECONDARY, NOT PRIMARY. The absolute "no spelled read exists" invariant is
// carried by the raw allowlist in tests/profile.test.js, which parses nothing.
// A hand lexer cannot carry that claim: a regex may legally begin in more ES
// positions than any heuristic enumerates, and four audit rounds each found a
// new one. This file's job is to say WHERE a read is, not to promise none.
//
// WHY THIS EXISTS. The gender render-path guard in tests/profile.test.js used
// regexes, and a re-audit broke it twice over — both times because the ORDER
// of stripping and matching was wrong:
//
//   1. It stripped string literals BEFORE matching the identifier, so
//      `profile["gender"]` became `profile[""]` and the read vanished. An
//      entire template literal went the same way, its `${...}` included.
//   2. It brace-matched the function body BEFORE stripping comments, so a
//      `// }}}}` comment truncated extraction from 3348 characters to 4 —
//      after which any reader below it sat outside the scanned region.
//
// Lexing first fixes both by construction: braces are counted only where they
// are code, and the identifier scan keeps string text (where a computed
// property key lives) while dropping comment text — the only place the word is
// genuinely harmless.
//
// Deliberately NOT a parser dependency: §7 stage 4 caps devDependencies and
// this repo vendors no toolchain. Handles line and block comments, all three
// string forms with escapes, nested template interpolation, and regex literals
// via the standard previous-significant-token heuristic.

// REGEX is its own kind, not CODE. A regex literal's characters must never be
// counted as structure: `replace(/\}/g, '')` is ordinary code, and while its
// `}` was classified CODE it closed renderCard's block 198 characters early
// and everything below went unscanned. Regex TEXT is still scanned for the
// identifier (fail closed), it just cannot move a brace counter.
export const CODE = 0, COMMENT = 1, STRING = 2, REGEX = 3;

// Does a `/` here open a regex literal, judged from the previous significant
// token? Both halves are ANCHORED, and that is the whole point: an earlier
// version tested the alternation `…|in|of|do|…` against the whole token, so
// the `in` inside `plain` matched and `plain / 2 /* } */` lexed as a regex —
// truncating an extracted body from 90 characters to 43 with a live reader
// below it. Keywords must match the END of the token on an identifier
// boundary; punctuation is judged on the last character only.
const REGEX_AFTER_KEYWORD =
  /(^|[^A-Za-z0-9_$])(return|typeof|instanceof|case|in|of|do|else|await|void|throw|delete|yield|new)$/;
const REGEX_AFTER_PUNCT = /[=(,:[!&|?{};+\-*%~^<>]/;

export function startsRegex(prevSig) {
  if (prevSig === '') return true;                       // start of source
  if (REGEX_AFTER_PUNCT.test(prevSig.slice(-1))) return true;
  return REGEX_AFTER_KEYWORD.test(prevSig);
}

export function classify(src) {
  const kind = new Uint8Array(src.length);
  // stack entries: {t:'tpl'} for a template literal, {t:'sub', depth:n} for a
  // `${...}` interpolation (so its closing `}` returns us to the template).
  const stack = [];
  let i = 0, prevSig = '';
  // Paren bookkeeping so the `)` of a control head can be told from the `)`
  // of an expression — the difference between a regex and a division.
  let parenDepth = 0, afterControlParen = false;
  const controlHeads = new Set();
  const inTemplate = () => stack.length && stack[stack.length - 1].t === 'tpl';

  while (i < src.length) {
    const c = src[i], c2 = src[i + 1];

    if (inTemplate()) {
      if (c === '\\') { kind[i] = STRING; kind[i + 1] = STRING; i += 2; continue; }
      if (c === '`') { kind[i] = STRING; stack.pop(); i++; prevSig = '`'; continue; }
      if (c === '$' && c2 === '{') {
        kind[i] = STRING; kind[i + 1] = CODE;      // the `${` opens executable code
        stack.push({ t: 'sub', depth: 1 });
        i += 2; prevSig = '{'; continue;
      }
      kind[i] = STRING; i++; continue;
    }

    // line comment
    if (c === '/' && c2 === '/') {
      while (i < src.length && src[i] !== '\n') kind[i++] = COMMENT;
      continue;
    }
    // block comment
    if (c === '/' && c2 === '*') {
      kind[i++] = COMMENT; kind[i++] = COMMENT;
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) kind[i++] = COMMENT;
      if (i < src.length) { kind[i++] = COMMENT; kind[i++] = COMMENT; }
      continue;
    }
    // strings
    if (c === '"' || c === "'") {
      const q = c; kind[i++] = STRING;
      while (i < src.length) {
        if (src[i] === '\\') { kind[i++] = STRING; kind[i++] = STRING; continue; }
        if (src[i] === q) { kind[i++] = STRING; break; }
        if (src[i] === '\n') break;                 // unterminated — bail out
        kind[i++] = STRING;
      }
      prevSig = q; continue;
    }
    if (c === '`') { kind[i++] = STRING; stack.push({ t: 'tpl' }); continue; }

    // Regex literal, by the standard prev-significant-token heuristic PLUS the
    // control-head case: ES permits a regex immediately after the `)` of
    // `if (...)` / `while (...)` / `for (...)`, where a bare `)` would
    // otherwise read as division. Missing that let `if (x) /[//]/.test(x)` be
    // lexed as division-then-line-comment, blanking every live statement to
    // the end of the line; the `[/*]` form blanked five lines.
    if (c === '/' && (afterControlParen || startsRegex(prevSig))) {
      kind[i++] = REGEX;
      let cls = false;
      while (i < src.length) {
        const d = src[i];
        if (d === '\\') { kind[i++] = REGEX; kind[i++] = REGEX; continue; }
        if (d === '[') cls = true;
        else if (d === ']') cls = false;
        else if (d === '/' && !cls) { kind[i++] = REGEX; break; }
        else if (d === '\n') break;
        kind[i++] = REGEX;
      }
      while (i < src.length && /[a-z]/.test(src[i])) kind[i++] = REGEX;  // flags
      prevSig = '/'; afterControlParen = false; continue;
    }

    // ordinary code
    kind[i] = CODE;
    if (c === '(') {
      parenDepth++;
      if (/(^|[^A-Za-z0-9_$])(if|while|for|switch|catch|with)$/.test(prevSig)) controlHeads.add(parenDepth);
      afterControlParen = false;
    } else if (c === ')') {
      afterControlParen = controlHeads.delete(parenDepth);
      parenDepth--;
    } else if (!/\s/.test(c)) {
      afterControlParen = false;
    }
    if (c === '{' && stack.length && stack[stack.length - 1].t === 'sub') {
      stack[stack.length - 1].depth++;
    } else if (c === '}' && stack.length && stack[stack.length - 1].t === 'sub') {
      if (--stack[stack.length - 1].depth === 0) stack.pop();   // back into the template
    }
    if (!/\s/.test(c)) {
      // 12, not 7: `instanceof` is ten characters and must survive intact
      // for the anchored keyword test above to see it.
      prevSig = /[A-Za-z0-9_$]/.test(c)
        ? (/[A-Za-z0-9_$]/.test(prevSig) ? prevSig + c : c).slice(-12)
        : c;
    }
    i++;
  }
  return kind;
}

/**
 * The body of `name(...)`'s block, brace-matched over CODE braces only.
 *
 * The signature is located in CODE as well: quoting it inside a comment or a
 * string used to hijack the extraction to an earlier, unrelated brace (a
 * red-team found this — the "body" collapsed to a 66-character argument list
 * and a live reader below it was never scanned).
 */
export function functionBody(src, signature) {
  const kind = classify(src);
  let start = -1;
  for (let at = src.indexOf(signature); at !== -1; at = src.indexOf(signature, at + 1)) {
    if (kind[at] === CODE) { start = at; break; }
  }
  if (start === -1) throw new Error(`not found in code: ${signature}`);
  let open = src.indexOf('{', start);
  while (open !== -1 && kind[open] !== CODE) open = src.indexOf('{', open + 1);
  if (open === -1) throw new Error('no opening brace');
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (kind[i] !== CODE) continue;
    if (src[i] === '{') depth++;
    else if (src[i] === '}' && --depth === 0) {
      return { body: src.slice(open + 1, i), kind: kind.slice(open + 1, i) };
    }
  }
  throw new Error('unbalanced');
}

/**
 * Every mention of the identifier, scanning CODE and STRING but not COMMENT.
 * String text is scanned on purpose: `profile["gender"]` puts the key in a
 * literal, and a template's interpolation is code anyway. Comments are the
 * only place the word is harmless.
 */
export function genderTokens({ body, kind }) {
  let out = '';
  for (let i = 0; i < body.length; i++) out += kind[i] === COMMENT ? ' ' : body[i];
  // NO word boundary: `getGenderInput()` reads the live control and changes
  // the card while naming no property, and `\bgender\b` could not see it.
  return out.match(/gender/gi) || [];
}

// ── free-identifier extraction (a POSITIVE policy, not a deny-list) ──
//
// Every deny-list this repo wrote was defeated by the name that was not on it:
// a browser-globals shim listed seven and a raw ban eleven, and `history` and
// `HTMLElement` walked past both. Enumerating what a page exposes is not a
// finite job, so the guards that matter pin what a scope IS allowed to
// reference and reject everything else — `history` fails not because it is
// listed but because it is new.
//
// Deliberately conservative: object-literal keys and a few shorthand forms are
// reported as free. That over-reports, which fails CLOSED — a spurious name
// makes the pin red and a human resolves it — whereas under-reporting would be
// a hole. Comments, strings and regex bodies are stripped first, so a name in
// prose never registers.
const JS_KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
  'do', 'break', 'continue', 'new', 'typeof', 'instanceof', 'in', 'of',
  'delete', 'void', 'try', 'catch', 'finally', 'throw', 'switch', 'case',
  'default', 'this', 'null', 'true', 'false', 'undefined', 'async', 'await',
  'yield', 'class', 'extends', 'super', 'import', 'export', 'from', 'as',
  'static', 'get', 'set',
]);

/** Source with comments, strings and regex literals blanked to spaces. */
export function codeOnly(src) {
  const kind = classify(src);
  let out = '';
  for (let i = 0; i < src.length; i++) out += kind[i] === CODE ? src[i] : ' ';
  return out;
}

/**
 * Identifiers a body references without declaring — its dependency surface.
 * Property accesses (`x.foo`) are excluded; local declarations are subtracted.
 */
export function freeIdentifiers(body) {
  const code = codeOnly(body);
  const locals = new Set();
  for (const m of code.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g)) locals.add(m[1]);
  for (const m of code.matchAll(/\b(?:const|let|var)\s*\{([^}]*)\}/g)) {
    for (const part of m[1].split(',')) {
      const name = part.split(':').pop().trim();
      if (name) locals.add(name);
    }
  }
  for (const m of code.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)/g)) locals.add(m[1]);
  const free = new Set();
  for (const m of code.matchAll(/(\.?)\b([A-Za-z_$][\w$]*)\b/g)) {
    if (m[1] === '.') continue;
    const name = m[2];
    if (JS_KEYWORDS.has(name) || locals.has(name)) continue;
    free.add(name);
  }
  return [...free].sort();
}
