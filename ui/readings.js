// Saved Readings MVP — browser-local archive + DOM controller.
//
// The archive stores only the user-entered profile payload needed to
// deterministically rebuild a reading, plus local archive metadata (id,
// title, savedAt). It never stores derived coordinates or card prose; the
// existing profile/engine/render pipeline remains the sole output authority.

import { openModal, closeModal, trapTab } from './modals.js';

export const READINGS_KEY = 'eight_ball_saved_readings_v1';
export const MAX_READING_TITLE = 80;

const STRING_PROFILE_FIELDS = ['time', 'city', 'cc', 'tz', 'country'];
const NUMBER_PROFILE_FIELDS = ['lat', 'lng'];

function defaultStorage() {
  try { return typeof localStorage === 'undefined' ? null : localStorage; }
  catch (_) { return null; }
}

export function compactReadingProfile(input) {
  if (!input || typeof input !== 'object') return null;
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const dob = typeof input.dob === 'string' ? input.dob : '';
  if (!name || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) return null;
  const profile = { name, dob };
  for (const key of STRING_PROFILE_FIELDS) {
    if (typeof input[key] === 'string' && input[key]) profile[key] = input[key];
  }
  for (const key of NUMBER_PROFILE_FIELDS) {
    if (typeof input[key] === 'number' && Number.isFinite(input[key])) profile[key] = input[key];
  }
  return profile;
}

export function normalizeReadingTitle(value) {
  return typeof value === 'string' ? value.trim().slice(0, MAX_READING_TITLE) : '';
}

function normalizeReading(entry) {
  if (!entry || typeof entry !== 'object') return null;
  const id = typeof entry.id === 'string' ? entry.id.trim() : '';
  const title = normalizeReadingTitle(entry.title);
  const profile = compactReadingProfile(entry.profile);
  const savedAt = typeof entry.savedAt === 'string' ? entry.savedAt : '';
  if (!/^[a-zA-Z0-9-]+$/.test(id) || !title || !profile || !Number.isFinite(Date.parse(savedAt))) return null;
  return { id, title, savedAt: new Date(savedAt).toISOString(), profile };
}

function sortNewestFirst(readings) {
  return [...readings].sort((a, b) =>
    b.savedAt.localeCompare(a.savedAt) || b.id.localeCompare(a.id));
}

export function loadSavedReadings(storage = defaultStorage()) {
  if (!storage) return { status: 'unavailable', readings: [] };
  let raw;
  try { raw = storage.getItem(READINGS_KEY); }
  catch (_) { return { status: 'unavailable', readings: [] }; }
  if (!raw) return { status: 'ok', readings: [] };
  let parsed;
  try { parsed = JSON.parse(raw); }
  catch (_) { return { status: 'corrupt', readings: [] }; }
  if (!Array.isArray(parsed)) return { status: 'corrupt', readings: [] };
  const readings = parsed.map(normalizeReading).filter(Boolean);
  return {
    status: readings.length === parsed.length ? 'ok' : 'partial',
    readings: sortNewestFirst(readings),
  };
}

function writeSavedReadings(readings, storage) {
  if (!storage) return { ok: false, status: 'unavailable' };
  try {
    storage.setItem(READINGS_KEY, JSON.stringify(sortNewestFirst(readings)));
    return { ok: true, status: 'ok' };
  } catch (_) {
    return { ok: false, status: 'unavailable' };
  }
}

function makeReadingId(savedAt, readings) {
  const base = `reading-${savedAt.replace(/\D/g, '').slice(0, 17)}`;
  let id = base;
  let suffix = 2;
  const ids = new Set(readings.map(reading => reading.id));
  while (ids.has(id)) id = `${base}-${suffix++}`;
  return id;
}

export function addSavedReading(input, options = {}) {
  const storage = options.storage === undefined ? defaultStorage() : options.storage;
  const loaded = loadSavedReadings(storage);
  if (loaded.status !== 'ok') {
    return { ok: false, status: loaded.status, readings: loaded.readings };
  }
  const profile = compactReadingProfile(input);
  if (!profile) return { ok: false, status: 'invalid', readings: loaded.readings };
  const signature = JSON.stringify(profile);
  const existing = loaded.readings.find(reading => JSON.stringify(reading.profile) === signature);
  if (existing) {
    return { ok: true, status: loaded.status, created: false, reading: existing, readings: loaded.readings };
  }
  const instant = options.now === undefined ? new Date() : new Date(options.now);
  if (!Number.isFinite(instant.getTime())) {
    return { ok: false, status: 'invalid', readings: loaded.readings };
  }
  const savedAt = instant.toISOString();
  const reading = {
    id: makeReadingId(savedAt, loaded.readings),
    title: normalizeReadingTitle(profile.name),
    savedAt,
    profile,
  };
  const readings = sortNewestFirst([reading, ...loaded.readings]);
  const written = writeSavedReadings(readings, storage);
  return written.ok
    ? { ok: true, status: loaded.status, created: true, reading, readings }
    : { ...written, readings: loaded.readings };
}

export function renameSavedReading(id, title, options = {}) {
  const storage = options.storage === undefined ? defaultStorage() : options.storage;
  const loaded = loadSavedReadings(storage);
  if (loaded.status !== 'ok') {
    return { ok: false, status: loaded.status, readings: loaded.readings };
  }
  const nextTitle = normalizeReadingTitle(title);
  if (!nextTitle) return { ok: false, status: 'invalid', readings: loaded.readings };
  const index = loaded.readings.findIndex(reading => reading.id === id);
  if (index < 0) return { ok: false, status: 'not-found', readings: loaded.readings };
  const readings = loaded.readings.map((reading, i) =>
    i === index ? { ...reading, title: nextTitle } : reading);
  const written = writeSavedReadings(readings, storage);
  return written.ok
    ? { ok: true, status: loaded.status, reading: readings[index], readings }
    : { ...written, readings: loaded.readings };
}

export function deleteSavedReading(id, options = {}) {
  const storage = options.storage === undefined ? defaultStorage() : options.storage;
  const loaded = loadSavedReadings(storage);
  if (loaded.status !== 'ok') {
    return { ok: false, status: loaded.status, readings: loaded.readings };
  }
  if (!loaded.readings.some(reading => reading.id === id)) {
    return { ok: false, status: 'not-found', readings: loaded.readings };
  }
  const readings = loaded.readings.filter(reading => reading.id !== id);
  const written = writeSavedReadings(readings, storage);
  return written.ok
    ? { ok: true, status: loaded.status, readings }
    : { ...written, readings: loaded.readings };
}

export function clearAllSavedReadings(storage = defaultStorage()) {
  if (!storage) return { ok: false, status: 'unavailable' };
  try {
    storage.removeItem(READINGS_KEY);
    return { ok: true, status: 'ok', readings: [] };
  } catch (_) {
    return { ok: false, status: 'unavailable' };
  }
}

const STYLE = `
.topbar-actions { display: flex; align-items: center; gap: 12px; }
.readings-nav { min-height: 44px; padding: 0 4px; }
.saved-readings-screen button, #readings-confirm-modal .btn,
.result-controls #save-reading-btn { min-height: 44px; }
.saved-readings-screen { max-width: 620px; align-self: center; }
.readings-page-head { display: flex; align-items: center; justify-content: space-between;
  gap: 16px; margin: 10px 0 12px; }
.readings-page-head h1 { color: var(--paper); font-size: 22px; font-weight: 400;
  letter-spacing: -0.02em; text-transform: lowercase; }
.readings-local-note { color: var(--label-on-dark); font-size: 11px; line-height: 1.65;
  max-width: 62ch; margin-bottom: 20px; }
.readings-page-status { color: var(--rule); font-size: 11px; line-height: 1.5;
  min-height: 18px; margin-bottom: 8px; }
.reading-save-status { color: var(--rule); font-size: 10px; line-height: 1.5;
  min-height: 18px; margin-top: 10px; text-align: center; }
.readings-list { list-style: none; display: grid; gap: 12px; }
.reading-row { border: 1px solid var(--rule); padding: 16px; display: grid; gap: 12px; }
.reading-title { min-width: 0; }
.reading-open { width: 100%; background: none; border: 0; color: var(--paper);
  font: inherit; font-size: 15px; line-height: 1.4; text-align: left; cursor: pointer;
  overflow-wrap: anywhere; }
.reading-open:hover, .reading-open:focus { color: var(--paper); outline: none;
  text-decoration: underline; text-underline-offset: 4px; }
.reading-open:focus-visible { outline: 1px solid var(--paper); outline-offset: 4px; }
.reading-date { color: var(--label-on-dark); font-size: 10px; line-height: 1.5;
  letter-spacing: 0.12em; text-transform: uppercase; display: block; margin-top: 6px; }
.reading-actions { display: flex; flex-wrap: wrap; gap: 8px 20px; }
.reading-actions .text-link { min-height: 44px; text-align: left; }
.reading-delete { color: var(--label-on-dark); }
.reading-rename-form { display: grid; gap: 10px; }
.reading-rename-form input { width: 100%; min-height: 44px; border: 1px solid var(--rule);
  background: transparent; color: var(--paper); font: inherit; padding: 10px 12px; }
.reading-rename-form input:focus-visible { outline: 1px solid var(--paper); outline-offset: 2px; }
.readings-empty { border-top: 1px solid var(--rule); border-bottom: 1px solid var(--rule);
  padding: 28px 0; color: var(--label-on-dark); font-size: 12px; line-height: 1.6; }
.readings-clear { margin-top: 20px; }
.saved-readings-screen [hidden], .reading-save-status[hidden] { display: none; }
@media (min-width: 720px) {
  .reading-row { grid-template-columns: minmax(0, 1fr) auto; align-items: center; }
  .reading-actions { justify-content: flex-end; }
}
@media (max-width: 380px) {
  .topbar-actions { gap: 8px; }
  .readings-nav { font-size: 9px; letter-spacing: 0.12em; }
}
`;

function injectStyle() {
  if (document.getElementById('readings-style')) return;
  const style = document.createElement('style');
  style.id = 'readings-style';
  style.textContent = STYLE;
  document.head.appendChild(style);
}

function formatSavedAt(value) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium', timeStyle: 'short',
    }).format(new Date(value));
  } catch (_) {
    return value;
  }
}

function buildPage(stage) {
  const page = document.createElement('section');
  page.className = 'screen hidden saved-readings-screen';
  page.id = 'previous-readings';
  page.tabIndex = -1;
  page.setAttribute('aria-labelledby', 'readings-title');
  page.innerHTML =
    '<div class="registry-header">specimen registry · saved entries</div>' +
    '<div class="readings-page-head"><h1 id="readings-title" tabindex="-1">previous readings</h1>' +
    '<button class="text-link" id="readings-back" type="button">back</button></div>' +
    '<p class="readings-local-note">saved in this browser only. no account, sync, or remote copy. open a reading to recompute it through the same calculation pipeline.</p>' +
    '<p class="readings-page-status" id="readings-page-status" role="status" aria-live="polite"></p>' +
    '<ul class="readings-list" id="readings-list"></ul>' +
    '<p class="readings-empty" id="readings-empty">save a completed reading and it will appear here.</p>' +
    '<button class="btn btn-block btn-secondary readings-clear" id="readings-clear" type="button">clear all saved readings</button>';
  stage.appendChild(page);
  return page;
}

function buildConfirmModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-bg';
  modal.id = 'readings-confirm-modal';
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML =
    '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="readings-confirm-title" aria-describedby="readings-confirm-copy">' +
    '<h2 id="readings-confirm-title">delete reading?</h2><div class="modal-rule"></div>' +
    '<p id="readings-confirm-copy">this removes the saved entry from this browser.</p>' +
    '<div class="modal-actions"><button class="btn" id="readings-confirm-cancel" type="button">keep it</button>' +
    '<button class="btn" id="readings-confirm-do" type="button">delete reading</button></div></div>';
  document.body.appendChild(modal);
  return modal;
}

export function initReadingsUI(refs, hooks = {}) {
  const { openBtn, saveBtn, saveStatus, onboarding, result, stage } = refs || {};
  if (!openBtn || !saveBtn || !saveStatus || !onboarding || !result || !stage) return null;
  injectStyle();
  const page = buildPage(stage);
  const confirmModal = buildConfirmModal();
  const heading = page.querySelector('#readings-title');
  const backBtn = page.querySelector('#readings-back');
  const status = page.querySelector('#readings-page-status');
  const list = page.querySelector('#readings-list');
  const empty = page.querySelector('#readings-empty');
  const clearBtn = page.querySelector('#readings-clear');
  const confirmTitle = confirmModal.querySelector('#readings-confirm-title');
  const confirmCopy = confirmModal.querySelector('#readings-confirm-copy');
  const confirmCancel = confirmModal.querySelector('#readings-confirm-cancel');
  const confirmDo = confirmModal.querySelector('#readings-confirm-do');
  let origin = onboarding;
  let activeId = null;
  let currentReadings = [];
  let pendingAction = null;

  function setStatus(message) { status.textContent = message || ''; }
  function setSaveStatus(message) {
    saveStatus.textContent = message || '';
    saveStatus.hidden = !message;
  }
  function updateSaveButton() {
    saveBtn.disabled = Boolean(activeId);
    saveBtn.textContent = activeId ? 'reading saved' : 'save reading';
  }

  function makeAction(label, action, reading) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `text-link reading-${action}`;
    button.dataset.action = action;
    button.dataset.readingId = reading.id;
    button.textContent = label;
    button.setAttribute('aria-label', `${label} ${reading.title}`);
    return button;
  }

  function makeRow(reading) {
    const item = document.createElement('li');
    const article = document.createElement('article');
    article.className = 'reading-row';
    article.dataset.readingId = reading.id;
    const title = document.createElement('div');
    title.className = 'reading-title';
    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'reading-open';
    open.dataset.action = 'open';
    open.dataset.readingId = reading.id;
    open.textContent = reading.title;
    const time = document.createElement('time');
    time.className = 'reading-date';
    time.dateTime = reading.savedAt;
    time.textContent = formatSavedAt(reading.savedAt);
    title.append(open, time);
    const actions = document.createElement('div');
    actions.className = 'reading-actions';
    actions.append(makeAction('rename', 'rename', reading), makeAction('delete', 'delete', reading));
    article.append(title, actions);
    item.appendChild(article);
    return item;
  }

  function renderList(message = '') {
    const loaded = loadSavedReadings();
    currentReadings = loaded.readings;
    list.replaceChildren(...currentReadings.map(makeRow));
    empty.hidden = currentReadings.length > 0;
    clearBtn.hidden = currentReadings.length === 0 && loaded.status === 'ok';
    if (message) setStatus(message);
    else if (loaded.status === 'unavailable') setStatus('previous readings are unavailable because browser storage is blocked.');
    else if (loaded.status === 'corrupt') setStatus('saved reading data could not be read. clear it to reset this browser.');
    else if (loaded.status === 'partial') setStatus('some saved entries could not be read; valid readings are shown.');
    else setStatus(currentReadings.length ? `${currentReadings.length} saved ${currentReadings.length === 1 ? 'reading' : 'readings'}.` : '');
  }

  function openPage() {
    origin = result.classList.contains('hidden') ? onboarding : result;
    onboarding.classList.add('hidden');
    result.classList.add('hidden');
    page.classList.remove('hidden');
    renderList();
    heading.focus();
  }

  function closePage() {
    page.classList.add('hidden');
    origin.classList.remove('hidden');
    openBtn.focus();
  }

  function closeConfirm() {
    pendingAction = null;
    closeModal(confirmModal);
  }

  function askToDelete(reading) {
    pendingAction = { type: 'delete', id: reading.id };
    confirmTitle.textContent = 'delete reading?';
    confirmCopy.textContent = `“${reading.title}” will be removed from this browser. this cannot be undone.`;
    confirmDo.textContent = 'delete reading';
    openModal(confirmModal, confirmCancel);
  }

  function askToClear() {
    pendingAction = { type: 'clear' };
    confirmTitle.textContent = 'clear all readings?';
    confirmCopy.textContent = 'every saved reading will be removed from this browser. this cannot be undone.';
    confirmDo.textContent = 'clear all readings';
    openModal(confirmModal, confirmCancel);
  }

  function beginRename(reading) {
    const row = list.querySelector(`[data-reading-id="${reading.id}"]`);
    const title = row && row.querySelector('.reading-title');
    if (!title) return;
    const form = document.createElement('form');
    form.className = 'reading-rename-form';
    form.dataset.readingId = reading.id;
    const label = document.createElement('label');
    label.className = 'sr-only';
    label.textContent = 'reading name';
    const input = document.createElement('input');
    input.name = 'reading-title';
    input.maxLength = MAX_READING_TITLE;
    input.required = true;
    input.value = reading.title;
    label.appendChild(input);
    const actions = document.createElement('div');
    actions.className = 'reading-actions';
    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.className = 'text-link';
    submit.textContent = 'save name';
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'text-link';
    cancel.dataset.action = 'cancel-rename';
    cancel.dataset.readingId = reading.id;
    cancel.textContent = 'cancel';
    actions.append(submit, cancel);
    form.append(label, actions);
    title.replaceChildren(form);
    input.focus();
    input.select();
  }

  openBtn.addEventListener('click', openPage);
  backBtn.addEventListener('click', closePage);
  saveBtn.addEventListener('click', () => {
    const profile = typeof hooks.getCurrentProfile === 'function' ? hooks.getCurrentProfile() : null;
    const outcome = addSavedReading(profile);
    if (!outcome.ok) {
      const copy = outcome.status === 'corrupt' || outcome.status === 'partial'
        ? 'could not save — clear unreadable saved data from previous readings first.'
        : 'could not save — browser storage may be blocked or full.';
      setSaveStatus(copy);
      return;
    }
    activeId = outcome.reading.id;
    updateSaveButton();
    setSaveStatus(outcome.created ? 'reading saved on this device.' : 'this reading is already saved on this device.');
  });
  list.addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const reading = currentReadings.find(item => item.id === button.dataset.readingId);
    if (!reading) return;
    if (button.dataset.action === 'open') {
      try {
        const opened = typeof hooks.openReading === 'function' ? hooks.openReading(reading) : false;
        if (opened === false) { setStatus('this reading could not be opened.'); return; }
        activeId = reading.id;
        updateSaveButton();
        setSaveStatus('reading loaded from this device.');
        page.classList.add('hidden');
      } catch (_) { setStatus('this reading could not be opened.'); }
    } else if (button.dataset.action === 'rename') beginRename(reading);
    else if (button.dataset.action === 'delete') askToDelete(reading);
    else if (button.dataset.action === 'cancel-rename') renderList();
  });
  list.addEventListener('submit', event => {
    const form = event.target.closest('.reading-rename-form');
    if (!form) return;
    event.preventDefault();
    const input = form.querySelector('input[name="reading-title"]');
    const outcome = renameSavedReading(form.dataset.readingId, input.value);
    if (!outcome.ok) {
      setStatus(outcome.status === 'partial'
        ? 'saved data is partly unreadable; clear all before changing it.'
        : 'the reading name could not be saved.');
      return;
    }
    renderList('reading renamed.');
    const renamed = list.querySelector(`[data-reading-id="${form.dataset.readingId}"] .reading-rename`);
    if (renamed) renamed.focus();
  });
  clearBtn.addEventListener('click', askToClear);
  confirmCancel.addEventListener('click', closeConfirm);
  confirmDo.addEventListener('click', () => {
    if (!pendingAction) return;
    const action = pendingAction.type;
    let outcome;
    if (action === 'delete') {
      const id = pendingAction.id;
      outcome = deleteSavedReading(id);
      if (outcome.ok && activeId === id) {
        activeId = null;
        updateSaveButton();
        setSaveStatus('');
      }
    } else {
      outcome = clearAllSavedReadings();
      if (outcome.ok) {
        activeId = null;
        updateSaveButton();
        setSaveStatus('');
      }
    }
    closeConfirm();
    const success = action === 'delete' ? 'reading deleted.' : 'all saved readings cleared from this browser.';
    const failure = action === 'delete' ? 'the reading could not be deleted.' : 'saved readings could not be cleared.';
    renderList(outcome && outcome.ok ? success : failure);
  });
  confirmModal.addEventListener('click', event => {
    if (event.target === confirmModal) closeConfirm();
  });
  confirmModal.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeConfirm();
  });
  trapTab(confirmModal);
  updateSaveButton();

  return {
    openPage,
    closePage,
    refresh: renderList,
    setActiveReading(id) {
      activeId = typeof id === 'string' && id ? id : null;
      updateSaveButton();
      if (!activeId) setSaveStatus('');
    },
  };
}
