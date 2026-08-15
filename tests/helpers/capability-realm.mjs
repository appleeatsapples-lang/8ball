// 8ball / tests / helpers / capability-realm.mjs
//
// A CAPABILITY-FREE REALM for the privacy gate, run as a child process because
// `vm.SourceTextModule` needs `--experimental-vm-modules`.
//
// WHY THIS EXISTS. `tests/privacy_scan.test.js` guarded §5 with a literal token
// list ('sessionStorage', 'fetch(', 'XMLHttpRequest') plus a
// `localStorage.setItem\(` regex. A name scan cannot see `window['fet'+'ch']`,
// `localStorage[k]` or `obj[computed]`, and the class has been fought and lost
// four times in this repo by adding more names. So this stops reading source
// and starts WITHDRAWING CAPABILITY: the real modules are evaluated and driven
// inside a fresh `vm` context that has NO storage and NO network in it at all.
//
// A fresh context's global carries only ECMAScript intrinsics plus `console`,
// `eval`, `globalThis` and `WebAssembly` — no `fetch`, no `XMLHttpRequest`, no
// `localStorage`, no `navigator`, no `process`, no `require`. Everything the
// product can reach for is therefore either something WE hand it, or a name we
// record. Nothing is banned and no spelling is enumerated: the guard reports
// what the code REACHED FOR, and the reviewed reach set is asserted whole.
//
// THE RECORDING TRICK. A `Proxy` used directly as the sandbox owns every global
// lookup, so the context's own intrinsics disappear (`Math` becomes undefined).
// Instead the context is created with a PLAIN sandbox — intrinsics resolve
// normally — a snapshot of the context's own globals is taken through it, and
// only THEN is a recording proxy installed as the sandbox's PROTOTYPE. Global
// lookups walk that chain, so every name the source resolves is recorded,
// including names that exist nowhere: `XMLHttpRequest` is recorded rather than
// throwing ReferenceError, which is what makes a reach visible instead of
// merely impossible.
//
// TWO SHAPES, both driven by the caller:
//   'bare' — nothing but a recording `localStorage`. Every other global read is
//            recorded and yields undefined. This is the ASSERTION shape: the
//            reach set is small, exact and positive.
//   'page' — plus recording `window`/`self`/`top`/`parent`/`frames`/`document`/
//            `location`/`navigator` stubs, so an exfiltration actually RUNS and
//            its arguments are captured. This is the EVIDENCE shape: it is how
//            a counter-case shows data escaping rather than merely being
//            reached for.
//
// Protocol: a JSON job on stdin, a JSON result on stdout. Errors are returned
// in the result rather than thrown, so the caller reports a defect instead of a
// broken harness.

import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

/** JSON with a fallback, so a vm-realm value can never break the report. */
function describe(value) {
  try { return JSON.parse(JSON.stringify(value ?? null)); }
  catch (_) { return String(value); }
}

function buildRealm(shape) {
  const reach = new Set();          // every global name the source resolved
  const storage = [];               // the localStorage transcript, in order
  const capabilityCalls = [];       // what a supplied stub was CALLED with

  const sandbox = {};
  const ctx = vm.createContext(sandbox);
  // Taken while the sandbox is still a plain object, so these are the CONTEXT'S
  // OWN intrinsics — same realm, so `[] instanceof Array` stays true after the
  // proxy is installed. Snapshotting from a second context would not.
  const snap = vm.runInContext(
    'const o = Object.create(null);'
    + 'for (const n of Object.getOwnPropertyNames(globalThis)) { try { o[n] = globalThis[n]; } catch (_) {} }'
    + 'o;', ctx);

  // A Storage that records rather than stores-and-forgets. Backed by a real
  // map so `setItem` followed by the product's own read-back verification
  // returns true, exactly as a browser would.
  const backing = new Map();
  const store = {
    get length() { return backing.size; },
    key(i) { return [...backing.keys()][i] ?? null; },
    getItem(k) { storage.push(['getItem', String(k)]); return backing.has(String(k)) ? backing.get(String(k)) : null; },
    setItem(k, v) { storage.push(['setItem', String(k), String(v)]); backing.set(String(k), String(v)); },
    removeItem(k) { storage.push(['removeItem', String(k)]); backing.delete(String(k)); },
    clear() { storage.push(['clear']); backing.clear(); },
  };
  // The WebIDL `Storage` interface, whole. Everything else touched on the
  // storage object is recorded — including `constructor`, which is a doorway:
  // `localStorage.constructor.constructor` reaches `Function` without naming it.
  const STORAGE_MEMBERS = new Set(['length', 'key', 'getItem', 'setItem', 'removeItem', 'clear']);

  // EVERY mutating trap, not just the method calls. `Storage` is a legacy
  // platform object with a named-property setter, so `localStorage[k] = v`,
  // `Reflect.set(localStorage, k, v)` and `Object.defineProperty(localStorage, k,
  // …)` all persist in a real browser while calling no method at all. A first
  // draft of this realm recorded only the method calls, and probing it with
  // those three shapes showed the transcript byte-identical to a clean run —
  // which is why the traps below are the complete mutation surface of an object
  // rather than the API names of one.
  const localStorage = new Proxy(store, {
    get(t, k, r) {
      if (typeof k === 'string' && !STORAGE_MEMBERS.has(k)) storage.push(['get', k]);
      return Reflect.get(t, k, r);
    },
    has(t, k) {
      if (typeof k === 'string' && !STORAGE_MEMBERS.has(k)) storage.push(['has', k]);
      return Reflect.has(t, k);
    },
    set(t, k, v, r) { storage.push(['set', String(k), String(v)]); return Reflect.set(t, k, v, r); },
    defineProperty(t, k, d) {
      storage.push(['defineProperty', String(k), String(d && 'value' in d ? d.value : '')]);
      return Reflect.defineProperty(t, k, d);
    },
    deleteProperty(t, k) { storage.push(['deleteProperty', String(k)]); return Reflect.deleteProperty(t, k); },
    ownKeys(t) { storage.push(['ownKeys']); return Reflect.ownKeys(t); },
    // `getPrototypeOf` is deliberately NOT trapped: ordinary property lookup
    // misses invoke it, so it would fire on clean code. Only the mutation is.
    setPrototypeOf(t, p) { storage.push(['setPrototypeOf']); return Reflect.setPrototypeOf(t, p); },
  });

  /**
   * A callable recording stub. Every property read extends the path, every call
   * is captured with its arguments. Symbol keys fall through to the underlying
   * function so ordinary coercion (`String(x)`, `x + ''`) still works.
   */
  const stub = path => new Proxy(function stubbed() {}, {
    get(t, k, r) {
      if (typeof k === 'symbol') return Reflect.get(t, k, r);
      reach.add(`${path}.${k}`);
      return stub(`${path}.${k}`);
    },
    set(t, k) { if (typeof k === 'string') reach.add(`${path}.${k}=`); return true; },
    apply(t, thisArg, args) {
      capabilityCalls.push({ path, args: args.map(describe) });
      return stub(`${path}()`);
    },
    construct(t, args) {
      capabilityCalls.push({ path: `new ${path}`, args: args.map(describe) });
      return stub(`new ${path}()`);
    },
  });

  /** A recording view over concrete values, falling back to a stub. */
  const recordingObject = (path, real) => new Proxy(real, {
    get(t, k, r) {
      if (typeof k === 'symbol') return Reflect.get(t, k, r);
      reach.add(`${path}.${k}`);
      return hasOwn(real, k) ? Reflect.get(t, k, r) : stub(`${path}.${k}`);
    },
    set(t, k, v, r) { if (typeof k === 'string') reach.add(`${path}.${k}=`); return Reflect.set(t, k, v, r); },
    has() { return true; },
  });

  const supplied = Object.create(null);
  supplied.localStorage = localStorage;
  if (shape === 'page') {
    const documentReal = {
      title: '', localStorage,
      getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
      createElement: tag => stub(`document.createElement(${tag})`),
      addEventListener: () => {}, removeEventListener: () => {},
    };
    const document = recordingObject('document', documentReal);
    const navigator = recordingObject('navigator', { userAgent: 'capability-realm', language: 'en' });
    const location = recordingObject('location', {
      href: 'https://the-eight-ball.netlify.app/', origin: 'https://the-eight-ball.netlify.app',
      protocol: 'https:', host: 'the-eight-ball.netlify.app', hostname: 'the-eight-ball.netlify.app',
      pathname: '/', search: '', hash: '',
    });
    const windowReal = { localStorage, document, navigator, location };
    const win = recordingObject('window', windowReal);
    documentReal.defaultView = win;
    windowReal.window = win; windowReal.self = win; windowReal.top = win;
    windowReal.parent = win; windowReal.frames = win; windowReal.globalThis = win;
    for (const alias of ['window', 'self', 'top', 'parent', 'frames']) supplied[alias] = win;
    supplied.document = document;
    supplied.navigator = navigator;
    supplied.location = location;
  }

  const proto = new Proxy(Object.create(null), {
    // `true` for every name, so a reach for something that exists nowhere —
    // `XMLHttpRequest` in a realm that has none — is RECORDED instead of
    // throwing a ReferenceError the product's own try/catch would swallow.
    has(t, k) { if (typeof k === 'string') reach.add(k); return true; },
    get(t, k) {
      if (typeof k !== 'string') return undefined;
      reach.add(k);
      if (hasOwn(supplied, k)) return supplied[k];
      return hasOwn(snap, k) ? snap[k] : undefined;
    },
  });
  Object.setPrototypeOf(sandbox, proto);

  return { ctx, reach, storage, capabilityCalls, backing };
}

async function main() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const job = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
  const { root, shape = 'bare', entries = [], drives = [], overrides = {}, seed = {} } = job;

  const realm = buildRealm(shape);
  for (const [k, v] of Object.entries(seed)) realm.backing.set(k, v);

  const modules = new Map();
  const load = abs => {
    if (modules.has(abs)) return modules.get(abs);
    const rel = relative(root, abs);
    const source = hasOwn(overrides, rel) ? overrides[rel] : readFileSync(abs, 'utf-8');
    const mod = new vm.SourceTextModule(source, { context: realm.ctx, identifier: abs });
    modules.set(abs, mod);
    return mod;
  };
  const linker = (spec, referencing) => load(resolve(dirname(referencing.identifier), spec));

  const namespaces = new Map();
  const calls = [];
  try {
    for (const entry of entries) {
      const mod = load(join(root, entry));
      await mod.link(linker);
      await mod.evaluate();
      namespaces.set(entry, mod.namespace);
    }
    for (const drive of drives) {
      const ns = namespaces.get(drive.module);
      const fn = ns && ns[drive.fn];
      if (typeof fn !== 'function') {
        calls.push({ ...drive, error: `not an exported function: ${drive.module}#${drive.fn}` });
        continue;
      }
      try { calls.push({ module: drive.module, fn: drive.fn, returned: describe(fn(...(drive.args || []))) }); }
      catch (err) { calls.push({ module: drive.module, fn: drive.fn, threw: String(err && err.message || err) }); }
    }
    // Drain the microtask and immediate queues before the transcript is read.
    // A `Promise.resolve().then(...)` exfiltration returns from its drive with
    // nothing recorded yet, and capturing at that instant would report a clean
    // run for work that has merely not happened.
    await new Promise(resolve => setImmediate(resolve));
  } catch (err) {
    process.stdout.write(JSON.stringify({ ok: false, error: String(err && err.stack || err) }));
    return;
  }

  process.stdout.write(JSON.stringify({
    ok: true,
    shape,
    loaded: [...modules.keys()].map(p => relative(root, p)).sort(),
    // The EXPORT SURFACE of every module in the closure, not just the entries.
    // Evaluating a module runs its top level and driving a listed export runs
    // that function — but an export NOBODY DRIVES runs neither, and an audit
    // proved the gap live: an exfiltration parked in an uncalled export left
    // this guard 30/30 green, and reddened only once moved to module load.
    // Reporting the names lets the test pin them, so a new export is a review
    // event that must be driven or declared inert. A namespace can throw if a
    // module failed to evaluate; that reads as null rather than crashing the
    // transcript, and the pin then fails on the shape.
    exports: Object.fromEntries([...modules.entries()].map(([abs, mod]) => {
      let names = null;
      try { names = Object.keys(mod.namespace).sort(); } catch (_) { /* null */ }
      return [relative(root, abs), names];
    }).sort((a, b) => a[0].localeCompare(b[0]))),
    reach: [...realm.reach].sort(),
    storage: realm.storage,
    capabilityCalls: realm.capabilityCalls,
    calls,
  }));
}

main().catch(err => {
  process.stdout.write(JSON.stringify({ ok: false, error: String(err && err.stack || err) }));
});
