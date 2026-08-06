// 8ball / tests / helpers / js-lex.js
//
// A single-pass lexical classifier for JavaScript source: every character is
// CODE, COMMENT or STRING, with a template literal's `${...}` interpolations
// classified as CODE because they execute.
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

export const CODE = 0, COMMENT = 1, STRING = 2;

export function classify(src) {
  const kind = new Uint8Array(src.length);
  // stack entries: {t:'tpl'} for a template literal, {t:'sub', depth:n} for a
  // `${...}` interpolation (so its closing `}` returns us to the template).
  const stack = [];
  let i = 0, prevSig = '';
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

    // regex literal, by the standard prev-significant-token heuristic
    if (c === '/' && /^$|[=(,:[!&|?{};+\-*%~^<>]|return|typeof|case|in|of|do|else/.test(prevSig)) {
      kind[i++] = CODE;
      let cls = false;
      while (i < src.length) {
        const d = src[i];
        if (d === '\\') { kind[i++] = CODE; kind[i++] = CODE; continue; }
        if (d === '[') cls = true;
        else if (d === ']') cls = false;
        else if (d === '/' && !cls) { kind[i++] = CODE; break; }
        else if (d === '\n') break;
        kind[i++] = CODE;
      }
      while (i < src.length && /[a-z]/.test(src[i])) kind[i++] = CODE;  // flags
      prevSig = '/'; continue;
    }

    // ordinary code
    kind[i] = CODE;
    if (c === '{' && stack.length && stack[stack.length - 1].t === 'sub') {
      stack[stack.length - 1].depth++;
    } else if (c === '}' && stack.length && stack[stack.length - 1].t === 'sub') {
      if (--stack[stack.length - 1].depth === 0) stack.pop();   // back into the template
    }
    if (!/\s/.test(c)) {
      prevSig = /[A-Za-z0-9_$]/.test(c)
        ? (/[A-Za-z0-9_$]/.test(prevSig) ? prevSig + c : c).slice(-7)
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
  return out.match(/\bgender\b/gi) || [];
}
