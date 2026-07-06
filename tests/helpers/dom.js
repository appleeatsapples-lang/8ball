// 8ball / tests / helpers / dom.js
//
// Shared hand-rolled DOM mocks for the node-env test files (vitest runs on the
// node env, no jsdom, per §12 minimal-tooling — so DOM globals are injected by
// hand). Consolidates the helpers that had genuinely drifted across the modal
// suites: makeClassList was copied verbatim in three files, and the modal
// makeEl/makeRefs pair had forked between modals.test.js and modal_a11y.test.js
// (a `name` field and a focusCount/activeElement mechanism existed in one copy
// but not the other).
//
// Deliberately NOT consolidated here — different idioms, kept separate on
// purpose so a merge doesn't quietly change behavior a test depends on:
//   - createElement-style tag nodes (makeNode) in citysearch/meanings_behavior:
//     their `innerHTML` setters carry module-specific semantics (citysearch
//     clears children on `= ''`; meanings parses an id→node map), which a single
//     shared node cannot express without conflicting.
//   - vi.fn-spy element/storage mocks in tiers/payments_markup: those assert
//     call spies (toHaveBeenCalledWith) rather than tracking handlers for _fire.

// classList mock — a Set behind the methods the UI modules touch. `toggle`
// follows real DOM semantics: no `force` flips, a `force` boolean forces, and
// it returns the resulting membership.
export function makeClassList() {
  const classes = new Set();
  return {
    add: c => classes.add(c),
    remove: c => classes.delete(c),
    contains: c => classes.has(c),
    toggle: (c, force) => {
      const on = force === undefined ? !classes.has(c) : !!force;
      if (on) classes.add(c); else classes.delete(c);
      return on;
    },
  };
}

// Handler-tracking element mock (the modal idiom). Superset of the two forks it
// replaces: carries an optional `name`, exposes BOTH a `focused` boolean and a
// `focusCount`, and mirrors focus into document.activeElement when a mock
// document is installed. `_fire(ev, arg)` invokes a registered listener.
export function makeEl(name) {
  const handlers = {};
  return {
    name,
    classList: makeClassList(),
    attrs: {},
    focused: false,
    focusCount: 0,
    addEventListener(ev, fn) { handlers[ev] = fn; },
    setAttribute(k, v) { this.attrs[k] = v; },
    focus() {
      this.focused = true;
      this.focusCount++;
      if (globalThis.document) globalThis.document.activeElement = this;
    },
    _fire(ev, arg) { return handlers[ev] && handlers[ev](arg); },
  };
}

// The seven refs initModalsUI wires: about / forget.
export function makeModalRefs() {
  return {
    aboutModal: makeEl('aboutModal'), aboutBtn: makeEl('aboutBtn'), aboutClose: makeEl('aboutClose'),
    forgetModal: makeEl('forgetModal'), forgetBtn: makeEl('forgetBtn'),
    forgetCancel: makeEl('forgetCancel'), forgetConfirm: makeEl('forgetConfirm'),
  };
}
