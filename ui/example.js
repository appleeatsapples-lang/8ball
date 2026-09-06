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

/** Every injected control the example must NOT expose. Removed, not hidden. */
export const EXAMPLE_REMOVED_IDS = Object.freeze([
  'dyad-form', 'dyad-intro',
  'dyad-share-btn', 'dyad-share-disclosure', 'dyad-share-status',
  'dyad-compare-btn', 'dyad-back', 'dyad-open-btn',
]);

const $ = id => (typeof document === 'undefined' ? null : document.getElementById(id));

/**
 * Boot the example page. Returns what it rendered so a test can assert on
 * it without a DOM of its own. Idempotent: a second call is a no-op.
 */
export function initExamplePage({ stage, controls } = {}) {
  if (typeof document === 'undefined' || !stage) return null;
  if (document.getElementById('dyad-screen')) return null;
  const a = profileFromPayload(EXAMPLE_PAIR.a);
  initDyadUI({ stage, controls }, {
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
  const opened = open();
  const nameEl = $('dyad-name-input'); const dobEl = $('dyad-dob-input');
  if (nameEl) nameEl.value = EXAMPLE_PAIR.b.name;
  if (dobEl) dobEl.value = EXAMPLE_PAIR.b.dob;
  const rendered = opened && submitSecond();
  // The pair is on screen. Now take away every way to change or export it.
  for (const id of EXAMPLE_REMOVED_IDS) { const el = $(id); if (el && el.remove) el.remove(); }
  // The real offer — same copy, same href, same disclosure — for a t3 reader.
  syncDyadEntry('t3', DYAD_PRODUCT_URL);
  const exampleLine = $('dyad-example-line'); if (exampleLine && exampleLine.remove) exampleLine.remove();
  return { rendered: !!rendered, a: a.firstName, b: EXAMPLE_PAIR.b.name, path: DYAD_EXAMPLE_PATH };
}
