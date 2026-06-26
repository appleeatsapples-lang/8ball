// lab/interrogate.js — interrogation-layer prototype UI (not live surface)

import { buildProfile } from '../core/profile.js';
import { getCard } from '../core/engine.js';
import { buildFreeTraces } from './derive-traces.js';

const $ = id => document.getElementById(id);

const entryScreen = $('entry-screen');
const resultScreen = $('result-screen');
const form = $('profile-form');
const clerkPanel = $('clerk-panel');
const clerkTitle = $('clerk-title');
const clerkNarration = $('clerk-narration');
const clerkStatus = $('clerk-status');
const clerkTrace = $('clerk-trace');

const FUNCTION_URL = '/.netlify/functions/interrogate';

let traces = null;
let activeKey = null;

function renderCard(profile) {
  traces = buildFreeTraces(profile);
  const card = getCard(profile);

  $('card-catalog').textContent = `no. ${card.catalog}`;
  $('val-arcana').textContent = profile.birthCard.label;
  $('val-sun').textContent = profile.sunSign;
  $('val-animal').textContent = profile.animal;
  $('val-lifePath').textContent = String(profile.lifePath);
  $('val-catalog').textContent = card.catalog;
}

function setActiveCell(key) {
  document.querySelectorAll('.coord-cell').forEach(el => {
    el.classList.toggle('active', el.dataset.key === key);
  });
  activeKey = key;
}

function showClerk(trace, narration, status, showRaw) {
  clerkPanel.hidden = false;
  clerkTitle.textContent = `${trace.label.toLowerCase()} · derivation`;
  clerkNarration.textContent = narration || '';
  clerkStatus.textContent = status || '';
  clerkTrace.textContent = showRaw ? JSON.stringify(trace.steps, null, 2) : '';
  clerkTrace.classList.toggle('hidden', !showRaw);
}

async function interrogate(key) {
  if (!traces || !traces[key]) return;
  const trace = traces[key];
  setActiveCell(key);
  showClerk(trace, '', 'requesting clerk narration…', false);

  try {
    const res = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coordinate: trace.coordinate,
        label: trace.label,
        value: trace.value,
        steps: trace.steps,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `http ${res.status}`);
    }

    const data = await res.json();
    showClerk(trace, data.narration, 'clerk narration · online', false);
  } catch (e) {
    showClerk(
      trace,
      '',
      `interrogation offline — ${e.message}. showing raw trace below.`,
      true,
    );
  }
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const name = $('name-input').value.trim();
  const dob = $('dob-input').value;
  if (!name || !dob) return;

  try {
    const profile = buildProfile(name, dob);
    renderCard(profile);
    entryScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    clerkPanel.hidden = true;
    activeKey = null;
    document.querySelectorAll('.coord-cell').forEach(el => el.classList.remove('active'));
  } catch (err) {
    alert(err.message || 'could not file specimen');
  }
});

document.querySelectorAll('.coord-cell').forEach(cell => {
  cell.addEventListener('click', () => interrogate(cell.dataset.key));
});

$('reset-btn').addEventListener('click', () => {
  traces = null;
  resultScreen.classList.add('hidden');
  entryScreen.classList.remove('hidden');
  clerkPanel.hidden = true;
  form.reset();
});