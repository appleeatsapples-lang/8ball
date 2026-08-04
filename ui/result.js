// 8ball / ui/result.js
// Result-screen arrival and card-flip controller.
//
// Owns only transition state, face accessibility, arrival focus/announcement,
// and the shake-again interaction. Profile construction, tier resolution,
// facet persistence, and card rendering stay host-owned and arrive as hooks.
// No storage, profile schema, network capability, or entitlement table lives
// here. This split creates durable index.html headroom under DOCTRINE §6 while
// keeping the product rules explicit at the composition boundary.

export function initResultUI(refs, hooks = {}) {
  const flipInner = refs.flipInner;
  const flipSideBack = flipInner.querySelector('.flip-side.back');
  const flipSideFront = flipInner.querySelector('.flip-side.front');
  let flipLocked = false;
  let transitionGeneration = 0;
  let arrivalTimer = null;
  let shakeTimer = null;

  // Both faces coexist in the DOM. backface-visibility hides pixels only;
  // inert + aria-hidden keep the rotated-away controls out of the input and
  // accessibility trees.
  function setFaceUp(up) {
    flipInner.classList.toggle('face-up', up);
    flipSideBack.inert = !up;
    flipSideBack.setAttribute('aria-hidden', String(!up));
    flipSideFront.inert = up;
    flipSideFront.setAttribute('aria-hidden', String(up));
  }

  // Arrival and shake both own the same physical card faces. Invalidate the
  // previous owner before starting either transition so a queued callback can
  // never render, announce, or flip over newer UI state. clearTimeout handles
  // the normal path; the generation guard also covers a callback that was
  // already queued when invalidation happened.
  function invalidateTransitions() {
    transitionGeneration += 1;
    if (arrivalTimer !== null) clearTimeout(arrivalTimer);
    if (shakeTimer !== null) clearTimeout(shakeTimer);
    arrivalTimer = null;
    shakeTimer = null;
    flipLocked = false;
    return transitionGeneration;
  }

  function reset() {
    invalidateTransitions();
    refs.announce.textContent = '';
    setFaceUp(false);
  }

  function showResult(profile, opts) {
    const generation = invalidateTransitions();
    refs.announce.textContent = '';
    hooks.setCurrentProfile(profile);
    refs.onboarding.classList.add('hidden');
    refs.result.classList.remove('hidden');
    refs.result.classList.add('reveal');
    setFaceUp(true);
    hooks.renderCard(profile, opts);

    // An explicit arrival moves the newly revealed result into view and
    // announces it once the face lands. Boot rehydration skips both so page
    // load never steals focus or scroll position.
    const arrive = opts && opts.arrive;
    if (arrive) {
      refs.result.scrollIntoView({ block: 'start' });
      refs.result.focus({ preventScroll: true });
    }
    // renderCard is host-owned. If it synchronously starts another result,
    // leave that newer transition as the sole owner of the faces and timer.
    if (generation !== transitionGeneration) return;
    arrivalTimer = setTimeout(() => {
      if (generation !== transitionGeneration) return;
      arrivalTimer = null;
      setFaceUp(false);
      if (arrive) refs.announce.textContent = 'specimen sheet ready';
    }, 300);
  }

  function shakeAgain() {
    const currentProfile = hooks.getCurrentProfile();
    if (flipLocked || !currentProfile) return;
    const generation = invalidateTransitions();
    const tier = hooks.getTier();
    const facetState = hooks.ownsCardEntry(tier)
      ? hooks.advanceFacet(currentProfile)
      : null;
    if (generation !== transitionGeneration) return;
    refs.announce.textContent = '';
    flipLocked = true;
    setFaceUp(true);
    shakeTimer = setTimeout(() => {
      if (generation !== transitionGeneration) return;
      shakeTimer = null;
      hooks.renderCard(currentProfile, { tier });
      if (generation !== transitionGeneration) return;
      setFaceUp(false);
      if (facetState) {
        refs.announce.textContent = `written entry changed · ${facetState.facetIndex + 1} of 3`;
      }
      flipLocked = false;
    }, 320);
  }

  refs.shakeAgainBtn.addEventListener('click', shakeAgain);
  refs.cardBack.addEventListener('click', shakeAgain);
  refs.cardBack.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      shakeAgain();
    }
  });

  return { showResult, reset };
}
