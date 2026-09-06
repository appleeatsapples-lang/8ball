// 8ball / ui / example.js — the complete example before checkout (DOCTRINE §1.J v0.91)
//
// One fixed synthetic pair, rendered by the REAL paired-reading modules on a
// separate static page (/example), so a person can judge the $3 dyad before
// buying it. This module is the whole of that page's behaviour, and it is
// deliberately small enough to read in one sitting:
//
//   - the pair is two constants below — never a form, never a query
//     parameter, never storage — so the page can render exactly one pair;
//   - `getTier` answers 't5' HERE ONLY, as a page-local hook handed to
//     initDyadUI; the host's render-density resolver is never imported, no
//     token is read or verified, and nothing is written anywhere;
//   - the share surface is not wired (no share-controller import) and its
//     controls are removed from the DOM after render — an Imprint of a
//     synthetic pair must not leave the page as if it were someone's;
//   - the second-person form is REMOVED after the pair renders, so there is
//     nothing to type into;
//   - the offer anchor is shown by the same syncDyadEntry('t3', url) the
//     sheet uses, so the page carries the real price, href and disclosure.
//
// Synthetic per §11: two names and two dates chosen for the calculation
// paths they show (a controlling element relation; two master life paths
// that combine to a master), anchored to no real person.
import { profileFromPayload, validateBirthInput } from './profile.js';
import { publicReadFor } from './public.js';
import { initDyadUI, open, submitSecond, syncDyadEntry, DYAD_EXAMPLE_PATH } from './dyad.js';
import { DYAD_PRODUCT_URL } from '../core/entitlement.js';

/** The fixed pair. Synthetic; changing it is a content decision, not a bug. */
export const EXAMPLE_PAIR = Object.freeze({
  a: Object.freeze({ name: 'Mara', dob: '1990-05-14' }),
  b: Object.freeze({ name: 'Teo', dob: '1987-11-02' }),
});

/** Fixed copy. The registry register: no urgency, no score, no verdict. */
export const EXAMPLE_LABEL = 'example · a fixed pair, not yours · your own pair opens after purchase';
export const EXAMPLE_TITLE = 'a complete example of the paired reading';

/** Every injected control the example must NOT expose, by id. Removed, not hidden. */
export const EXAMPLE_REMOVED_IDS = Object.freeze([
  'dyad-form', 'dyad-intro',
  'dyad-share-btn', 'dyad-share-disclosure', 'dyad-share-status',
  'dyad-compare-btn', 'dyad-back', 'dyad-open-btn', 'dyad-relation-retry', 'dyad-submit',
]);
/** …and by kind: any form field the module injects, whatever its id (pr248 grok lane). */
export const EXAMPLE_REMOVED_SELECTOR = 'form, input, textarea, select';
/** The controls that STAY: navigation between the two sheets and the panel's close. */
export const EXAMPLE_KEPT_BUTTON_IDS = Object.freeze(['dyad-side-a', 'dyad-side-b', 'dyad-meaning-close']);

const $ = id => (typeof document === 'undefined' ? null : document.getElementById(id));

/**
 * Take away every way to change or export the pair. Runs in `finally`, so a
 * render that throws still leaves no form behind (pr248 grok lane, P1).
 * Returns the ids it removed so a test can see the sweep.
 */
export function stripExampleControls(doc = (typeof document === 'undefined' ? null : document)) {
  if (!doc) return [];
  const removed = [];
  for (const id of EXAMPLE_REMOVED_IDS) { const el = doc.getElementById(id); if (el && el.remove) { el.remove(); removed.push(id); } }
  const nodes = typeof doc.querySelectorAll === 'function' ? doc.querySelectorAll(EXAMPLE_REMOVED_SELECTOR) : [];
  for (const el of Array.from(nodes)) { if (el && el.remove) { el.remove(); removed.push(el.id || el.tagName); } }
  const line = doc.getElementById('dyad-example-line'); if (line && line.remove) { line.remove(); removed.push('dyad-example-line'); }
  return removed;
}

/**
 * Boot the example page. Returns what it rendered so a test can assert on
 * it without a DOM of its own. Idempotent: a second call is a no-op. The
 * dyad functions are injectable so a test can make any step throw and
 * prove the sweep still runs.
 */
export function initExamplePage({ stage, controls } = {}, deps = {}) {
  const d = { initDyadUI, open, submitSecond, syncDyadEntry, doc: (typeof document === 'undefined' ? null : document), ...deps };
  if (!d.doc || !stage) return null;
  if (d.doc.getElementById('dyad-screen')) return null;
  let rendered = false; let removed = [];
  try {
    const a = profileFromPayload(EXAMPLE_PAIR.a);
    d.initDyadUI({ stage, controls }, {
      getProfile: () => a,
      getTier: () => 't5',            // page-local: this page IS the example
      validateEntry: validateBirthInput,
      buildSecond: profileFromPayload,
      getNoteSlot: () => 'mid',       // no facet storage on this page
      getPublicRead: publicReadFor,
      onOpen: () => {},
      onExit: () => {},
      onRelationChange: () => {},     // no share controller exists here
    });
    const opened = d.open();
    const nameEl = d.doc.getElementById('dyad-name-input'); const dobEl = d.doc.getElementById('dyad-dob-input');
    if (nameEl) nameEl.value = EXAMPLE_PAIR.b.name;
    if (dobEl) dobEl.value = EXAMPLE_PAIR.b.dob;
    rendered = !!(opened && d.submitSecond());
  } catch (_) {
    rendered = false;
  } finally {
    // The pair is on screen, or it is not. Either way: no form, no export.
    removed = stripExampleControls(d.doc);
    // The real offer — same copy, same href, same disclosure — for a t3 reader.
    try { d.syncDyadEntry('t3', DYAD_PRODUCT_URL); } catch (_) { /* the offer is optional on a failed render */ }
    const line = d.doc.getElementById('dyad-example-line'); if (line && line.remove) line.remove();
  }
  return { rendered, removed, a: EXAMPLE_PAIR.a.name, b: EXAMPLE_PAIR.b.name, path: DYAD_EXAMPLE_PATH };
}
