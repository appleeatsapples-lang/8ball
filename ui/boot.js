// boot orchestration — the one ordered sequence that runs on page load.
//
// Owns:
//   - the ORDER of the boot steps, which is load-bearing in three places
//     (the unseal baseline, the paid return, and the corrupt-payload reset —
//     each documented inline below)
//
// Does NOT own:
//   - any DOM, any storage, any calculation. Every step arrives as an
//     injected function, so this module is pure sequencing and runs under
//     the suite's hand-rolled mocks with no jsdom.
//
// Extracted from index.html so the sequence itself could be tested. Each
// individual step already had unit tests; their order — the thing that had
// actually broken before, per the corrupt-payload comment below — was only
// ever pinned by regex scans of the host file, which cannot catch a
// reordering that leaves both statements present. Those scans now read this
// module, and tests/boot.test.js asserts the order behaviorally.
//
// Not a DOM controller, so like ui/concordance.js it takes hooks alone
// rather than the init*UI({refs},{hooks}) shape of §6 v0.23.

export function runBoot({
  applyLabelsState,
  isLabelsRevealed,
  primeUnsealBaseline,
  getRenderTier,
  handlePaidReturn,
  saveProfile,
  loadSavedProfile,
  populateRisingFields,
  profileFromPayload,
  ensureFacetIndex,
  showResult,
  clearProfile,
  clearFacetIndex,
  resetFormDisplay,
}) {
  applyLabelsState(isLabelsRevealed());
  // v0.7.0 unseal baseline: capture the tier BEFORE the paid return so a
  // paid-return boot unseals exactly the delta; rehydrate unseals nothing.
  primeUnsealBaseline(getRenderTier());
  // §6.6 paid-return runs before rehydration so the monotonic tier and
  // any pending-consumed profile are persisted before loadSavedProfile()
  // reads them. R1: a paid-return boot is not special — it just sets the
  // tier and falls into the same render path as any rehydration;
  // density resolves from storage via getRenderTier().
  const consumedPending = handlePaidReturn(p => saveProfile(p.name, p.dob, p));
  const existing = loadSavedProfile();
  if (existing) {
    try {
      populateRisingFields(existing);
      const profile = profileFromPayload(existing);
      const tier = getRenderTier();
      if (tier === 't3') ensureFacetIndex(profile.lifePath, { reset: consumedPending });
      showResult(profile, { tier });
    } catch (_) {
      // Corrupted stored profile — a malformed DOB, or (since the calc core
      // now rejects them) an impossible-date DOB from a hand-edited payload.
      // buildProfile throws AFTER populateRisingFields above may have already
      // set the module-level selectedCity from the bad payload's birthplace, so
      // reset BOTH: drop the payload from storage (clearProfile) AND reset the
      // form (resetFormDisplay nulls selectedCity + clears the stale time/city
      // fields). Without the reset, the next submission would silently inherit
      // the discarded city's tz/lat/lng — a wrong rising sign baked into a new
      // person's profile. #onboarding has no `hidden` class in the static
      // markup, so it's already visible — nothing else to do here.
      clearProfile();
      clearFacetIndex();
      resetFormDisplay();
    }
  }
}
