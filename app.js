'use strict';

// ─── Constants ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'wcc_profiles';
const PIN_KEY     = 'wcc_pin';
const DEFAULT_PIN = '1234';

const CULTURES = {
  G1: 'Racing',
  G2: 'Flying Dogs',
  G3: 'Train of Pain',
  G4: 'Intermediate',
  G5: 'Recreational',
};

const CULTURE_ORDER = ['G1', 'G2', 'G3', 'G4', 'G5'];

const DAY_NAMES   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── Default Profiles ────────────────────────────────────────────────────────
// Paces for G4/G5 road are estimates; admins can adjust.

const DEFAULT_PROFILES = [
  {
    id: 'road-g1',
    name: 'Road G1',
    category: 'Road',
    discipline: 'Road',
    cultures: ['G1'],
    startTime: '6:00 PM',
    finishTime: '8:00 PM',
    pace: '~40 kph',
    location: '',
    expectedDay: null,
  },
  {
    id: 'road-g1-g2',
    name: 'Road G1/G2',
    category: 'Road',
    discipline: 'Road',
    cultures: ['G1', 'G2'],
    startTime: '6:00 PM',
    finishTime: '8:00 PM',
    pace: '35+ kph',
    location: '',
    expectedDay: null,
  },
  {
    id: 'road-g2',
    name: 'Road G2',
    category: 'Road',
    discipline: 'Road',
    cultures: ['G2'],
    startTime: '6:00 PM',
    finishTime: '8:00 PM',
    pace: '35+ kph',
    location: '',
    expectedDay: null,
  },
  {
    id: 'road-g3',
    name: 'Road G3',
    category: 'Road',
    discipline: 'Road',
    cultures: ['G3'],
    startTime: '6:00 PM',
    finishTime: '8:00 PM',
    pace: '31 - 35 kph',
    location: '',
    expectedDay: null,
  },
  {
    id: 'road-g4',
    name: 'Road G4',
    category: 'Road',
    discipline: 'Road',
    cultures: ['G4'],
    startTime: '6:00 PM',
    finishTime: '8:00 PM',
    pace: '26 - 30 kph',
    location: '',
    expectedDay: null,
  },
  {
    id: 'road-g5',
    name: 'Road G5',
    category: 'Road',
    discipline: 'Road',
    cultures: ['G5'],
    startTime: '6:00 PM',
    finishTime: '8:00 PM',
    pace: '20 - 25 kph',
    location: '',
    expectedDay: null,
  },
  {
    id: 'gravel-g5',
    name: 'Gravel G5',
    category: 'Gravel',
    discipline: 'Gravel',
    cultures: ['G5'],
    startTime: '6:00 PM',
    finishTime: '7:45 PM',
    pace: '18 - 20 kph',
    location: '',
    expectedDay: null,
  },
  {
    id: 'gravel-g4-g5',
    name: 'Gravel G4/G5',
    category: 'Gravel',
    discipline: 'Gravel',
    cultures: ['G4', 'G5'],
    startTime: '6:00 PM',
    finishTime: '7:45 PM',
    pace: '20 - 24 kph',
    location: '',
    expectedDay: null,
  },
  {
    id: 'gravel-g3-g4',
    name: 'Gravel G3/G4',
    category: 'Gravel',
    discipline: 'Gravel',
    cultures: ['G3', 'G4'],
    startTime: '6:00 PM',
    finishTime: '7:45 PM',
    pace: '24 - 28 kph',
    location: '',
    expectedDay: null,
  },
  {
    id: 'mtb-g5',
    name: 'MTB G5',
    category: 'MTB',
    discipline: 'MTB',
    cultures: ['G5'],
    startTime: '6:00 PM',
    finishTime: '7:45 PM',
    pace: '',
    location: '',
    expectedDay: null,
  },
  {
    id: 'mtb-g4-g5',
    name: 'MTB G4/G5',
    category: 'MTB',
    discipline: 'MTB',
    cultures: ['G4', 'G5'],
    startTime: '6:00 PM',
    finishTime: '7:45 PM',
    pace: '',
    location: '',
    expectedDay: null,
  },
  {
    id: 'cx-g4-g5',
    name: 'CX G4/G5',
    category: 'CX',
    discipline: 'CX',
    cultures: ['G4', 'G5'],
    startTime: '6:00 PM',
    finishTime: '7:45 PM',
    pace: '',
    location: '',
    expectedDay: null,
  },
  {
    id: 'track-open',
    name: 'Track',
    category: 'Track',
    discipline: 'Track',
    cultures: [],
    startTime: '6:00 PM',
    finishTime: '8:00 PM',
    pace: '',
    location: '',
    expectedDay: null,
  },
];

// ─── Post Template ───────────────────────────────────────────────────────────
// {{token}} is replaced with the corresponding value.
// Sections with blank values will still appear — leaders should fill all fields.

const BODY_TEMPLATE =
`WCC Member Group Ride

Date: {{dayName}} {{dateFormatted}}
Start Time: {{startTime}}
Estimated Finish Time: {{finishTime}}
Discipline: {{discipline}}
Culture: {{cultureName}}
Approximate Distance: {{distance}}
Estimated Average Moving Pace: {{pace}}
Start Location: {{location}}

Route
--------

{{routeUrl}}

Description:

{{description}}

Notes (optional):

{{notes}}

If you have specific questions prior to your ride please ask here.
Thanks & enjoy your Ride!

[poll type=regular results=always public=true]
# Will you be joining?
* :white_check_mark: Going
* :thinking: Interested
* :cross_mark: Not going
[/poll]

WCC rides are open to members only. Guests are permitted provided they have an active OCA membership. All riders must follow the rules of the Highway Traffic Act and are responsible for riding in a safe manner`;

// ─── State ───────────────────────────────────────────────────────────────────

let profiles = [];
let selectedProfile = null;
let editingProfileId = null;
let pendingDeleteId = null;
let currentStep = 1;

// ─── Init ────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  loadProfiles();
  renderProfileGrid();
  setupEventListeners();
  updateStepIndicator(1);
});

// ─── Profile Storage ─────────────────────────────────────────────────────────

function loadProfiles() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    profiles = raw ? JSON.parse(raw) : DEFAULT_PROFILES;
  } catch {
    profiles = DEFAULT_PROFILES;
  }
  if (!profiles.length) {
    profiles = DEFAULT_PROFILES;
  }
  saveProfiles();
}

function saveProfiles() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

// ─── Date Utilities ───────────────────────────────────────────────────────────
// IMPORTANT: Use the local-date constructor to avoid UTC-offset day-of-week bugs.

function parseLocalDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function dayName(iso) {
  return DAY_NAMES[parseLocalDate(iso).getDay()];
}

function formatDate(iso) {
  const d = parseLocalDate(iso);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// "Apr 1, 2026" → "Apr 1" for compact display
function formatDateShort(iso) {
  const d = parseLocalDate(iso);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}

// ─── Culture Utilities ────────────────────────────────────────────────────────

// Sorts culture codes in G1→G5 order.
function sortCultures(codes) {
  return codes.slice().sort((a, b) => CULTURE_ORDER.indexOf(a) - CULTURE_ORDER.indexOf(b));
}

// For a single group: show name ("Recreational"). For multiple: show codes ("G1/G2").
function cultureName(codes) {
  if (!codes || codes.length === 0) return '';
  const sorted = sortCultures(codes);
  if (sorted.length === 1) return CULTURES[sorted[0]] || sorted[0];
  return sorted.join('/');
}

// Always return code notation ("G5", "G1/G2").
function cultureCode(codes) {
  if (!codes || codes.length === 0) return '';
  return sortCultures(codes).join('/');
}

// ─── Template Rendering ───────────────────────────────────────────────────────

function renderPost() {
  const dateVal    = el('rideDate').value;
  const discipline = el('disciplineGroup').querySelector('input:checked')?.value || '';
  const cultures   = selectedCultures();
  const distance   = el('distance').value.trim();
  const pace       = el('pace').value.trim();
  const location   = el('location').value.trim();
  const routeUrl   = el('routeUrl').value.trim();
  const description = el('description').value.trim();
  const notes      = el('notes').value.trim();
  const startTime  = el('startTime').value.trim();
  const finishTime = el('finishTime').value.trim();

  const tokens = {
    dayName:       dateVal ? dayName(dateVal) : '',
    dateFormatted: dateVal ? formatDate(dateVal) : '',
    discipline,
    cultureName:   cultureName(cultures),
    cultureCode:   cultureCode(cultures),
    distance:      distance ? `${distance} km` : '',
    pace:          pace || '',
    location:      location || '',
    routeUrl:      routeUrl || '',
    description:   description || '',
    notes:         notes || '',
    startTime:     startTime || '',
    finishTime:    finishTime || '',
  };

  const body = BODY_TEMPLATE.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    Object.prototype.hasOwnProperty.call(tokens, key) ? tokens[key] : `{{${key}}}`
  );

  const titleParts = [discipline, cultureCode(cultures), '–', dayName(dateVal) + ',', formatDate(dateVal)].filter(Boolean);
  const title = titleParts.join(' ');

  return { title, body };
}

// ─── Profile Grid ─────────────────────────────────────────────────────────────

function renderProfileGrid() {
  const grid = el('profileGrid');
  grid.innerHTML = '';

  const categories = {};
  profiles.forEach(p => {
    const cat = p.category || p.discipline || 'Other';
    (categories[cat] = categories[cat] || []).push(p);
  });

  Object.entries(categories).forEach(([cat, items]) => {
    const label = document.createElement('div');
    label.className = 'category-label';
    label.textContent = cat;
    grid.appendChild(label);

    items.forEach(profile => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'profile-card';
      btn.dataset.id = profile.id;

      const code = cultureCode(profile.cultures);
      const timeMeta = profile.startTime || '';

      btn.innerHTML = `
        <div class="card-badge">${escHtml(profile.discipline || cat)}</div>
        <div class="card-name">${escHtml(profile.name)}</div>
        <div class="card-meta">${code ? escHtml(code) + ' · ' : ''}${escHtml(timeMeta)}</div>
      `;

      btn.addEventListener('click', () => activateProfile(profile));
      grid.appendChild(btn);
    });
  });
}

// ─── Step Navigation ──────────────────────────────────────────────────────────

function goToStep(n) {
  currentStep = n;
  [1, 2, 3].forEach(i => el(`step${i}`).classList.toggle('hidden', i !== n));
  updateStepIndicator(n);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateStepIndicator(active) {
  document.querySelectorAll('.step-dot').forEach(dot => {
    const n = parseInt(dot.dataset.step);
    dot.classList.toggle('active', n === active);
    dot.classList.toggle('done', n < active);
  });
}

// ─── Profile Activation ───────────────────────────────────────────────────────

function activateProfile(profile) {
  selectedProfile = profile;

  document.querySelectorAll('.profile-card').forEach(c => c.classList.remove('selected'));
  const card = document.querySelector(`.profile-card[data-id="${profile.id}"]`);
  if (card) card.classList.add('selected');

  populateFormFromProfile(profile);
  el('step2Title').textContent = profile.name;
  goToStep(2);
}

function populateFormFromProfile(profile) {
  // Discipline radio
  document.querySelectorAll('input[name="discipline"]').forEach(r => {
    r.checked = r.value === (profile.discipline || '');
  });
  refreshChips('input[name="discipline"]');

  // Culture checkboxes
  document.querySelectorAll('input[name="culture"]').forEach(cb => {
    cb.checked = Array.isArray(profile.cultures) && profile.cultures.includes(cb.value);
  });
  refreshChips('input[name="culture"]');
  updateCulturePreview();

  // Pre-fill defaults; clear per-ride fields
  el('startTime').value   = profile.startTime  || '';
  el('finishTime').value  = profile.finishTime || '';
  el('pace').value        = profile.pace       || '';
  el('location').value    = profile.location   || '';

  el('rideDate').value    = '';
  el('distance').value    = '';
  el('routeUrl').value    = '';
  el('description').value = '';
  el('notes').value       = '';

  el('dayDisplay').textContent = '';
  el('dayWarning').classList.add('hidden');
}

function blankForm() {
  selectedProfile = null;
  document.querySelectorAll('input[name="discipline"], input[name="culture"]').forEach(i => i.checked = false);
  refreshChips('input[name="discipline"]');
  refreshChips('input[name="culture"]');
  updateCulturePreview();
  ['startTime','finishTime','pace','location','rideDate','distance','routeUrl','description','notes']
    .forEach(id => { el(id).value = ''; });
  el('dayDisplay').textContent = '';
  el('dayWarning').classList.add('hidden');
  el('step2Title').textContent = 'Ride Details';
  goToStep(2);
}

// ─── Date Handling ────────────────────────────────────────────────────────────

function onDateChange() {
  const val = el('rideDate').value;
  const display = el('dayDisplay');
  const warning = el('dayWarning');

  if (!val) {
    display.textContent = '';
    warning.classList.add('hidden');
    return;
  }

  const name = dayName(val);
  display.textContent = `This is a ${name.toUpperCase()}`;

  if (selectedProfile &&
      selectedProfile.expectedDay !== null &&
      selectedProfile.expectedDay !== undefined &&
      selectedProfile.expectedDay !== '') {
    const actual = parseLocalDate(val).getDay();
    if (actual !== parseInt(selectedProfile.expectedDay)) {
      warning.textContent =
        `Heads up: this profile usually runs on ${DAY_NAMES[selectedProfile.expectedDay]}s — you selected a ${name}.`;
      warning.classList.remove('hidden');
    } else {
      warning.classList.add('hidden');
    }
  } else {
    warning.classList.add('hidden');
  }
}

// ─── Culture Preview ──────────────────────────────────────────────────────────

function updateCulturePreview() {
  const codes = selectedCultures();
  const preview = el('culturePreview');
  if (!codes.length) { preview.textContent = ''; return; }
  preview.textContent = sortCultures(codes).map(c => `${c} – ${CULTURES[c] || c}`).join(', ');
}

function selectedCultures() {
  return Array.from(document.querySelectorAll('input[name="culture"]:checked')).map(cb => cb.value);
}

// ─── Chip Styling ─────────────────────────────────────────────────────────────

function refreshChips(selector) {
  document.querySelectorAll(selector).forEach(input => {
    input.closest('.chip')?.classList.toggle('is-checked', input.checked);
  });
}

// ─── Clipboard ────────────────────────────────────────────────────────────────

function copyText(text, btn) {
  const done = () => {
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    showToast('Copied to clipboard');
    setTimeout(() => {
      btn.textContent = 'Copy';
      btn.classList.remove('copied');
    }, 2200);
  };

  const fallback = () => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    try { document.execCommand('copy'); done(); } catch { showToast('Select text manually to copy'); }
    document.body.removeChild(ta);
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(done).catch(fallback);
  } else {
    fallback();
  }
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function showToast(msg) {
  const t = el('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.add('hidden'), 2500);
}

// ─── Admin: PIN ───────────────────────────────────────────────────────────────

function openAdmin() {
  el('adminModal').classList.remove('hidden');
  el('adminPin').classList.remove('hidden');
  el('adminContent').classList.add('hidden');
  el('pinInput').value = '';
  el('pinError').classList.add('hidden');
  setTimeout(() => el('pinInput').focus(), 50);
}

function closeAdmin() { el('adminModal').classList.add('hidden'); }

function checkPin() {
  const entered = el('pinInput').value;
  const stored  = localStorage.getItem(PIN_KEY) || DEFAULT_PIN;
  if (entered === stored) {
    el('adminPin').classList.add('hidden');
    el('adminContent').classList.remove('hidden');
    renderProfileList();
  } else {
    el('pinError').classList.remove('hidden');
    el('pinInput').value = '';
    el('pinInput').focus();
  }
}

function changePin() {
  const newPin = prompt('Enter a new admin PIN (4–8 digits):');
  if (newPin === null) return;
  if (!/^\d{4,8}$/.test(newPin)) { alert('PIN must be 4–8 digits.'); return; }
  localStorage.setItem(PIN_KEY, newPin);
  showToast('PIN updated');
}

// ─── Admin: Profile List ──────────────────────────────────────────────────────

function renderProfileList() {
  const list = el('profileList');
  list.innerHTML = '';
  if (!profiles.length) {
    list.innerHTML = '<p style="color:var(--text-muted);font-size:.875rem">No profiles yet.</p>';
    return;
  }
  profiles.forEach(p => {
    const item = document.createElement('div');
    item.className = 'profile-list-item';
    item.innerHTML = `
      <div class="profile-list-item-info">
        <div class="profile-list-item-name">${escHtml(p.name)}</div>
        <div class="profile-list-item-meta">${escHtml(p.discipline || '')} ${escHtml(cultureCode(p.cultures))} · ${escHtml(p.startTime || '')}</div>
      </div>
      <div class="profile-list-item-actions">
        <button class="btn-sm" data-action="edit" data-id="${p.id}">Edit</button>
        <button class="btn-sm" data-action="dup"  data-id="${p.id}">Dup</button>
        <button class="btn-sm btn-sm--danger" data-action="del" data-id="${p.id}">Delete</button>
      </div>
    `;
    list.appendChild(item);
  });

  list.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const { action, id } = btn.dataset;
      if (action === 'edit') openEditor(id);
      if (action === 'dup')  duplicateProfile(id);
      if (action === 'del')  promptDelete(id);
    });
  });
}

// ─── Admin: Profile Editor ────────────────────────────────────────────────────

function openEditor(profileId) {
  editingProfileId = profileId;
  el('editorTitle').textContent = profileId ? 'Edit Profile' : 'New Profile';
  el('profileForm').reset();

  document.querySelectorAll('input[name="pCulture"]').forEach(cb => cb.checked = false);
  refreshChips('input[name="pCulture"]');

  if (profileId) {
    const p = profiles.find(x => x.id === profileId);
    if (p) {
      el('pName').value        = p.name        || '';
      el('pCategory').value    = p.category    || '';
      el('pDiscipline').value  = p.discipline  || '';
      el('pStartTime').value   = p.startTime   || '';
      el('pFinishTime').value  = p.finishTime  || '';
      el('pPace').value        = p.pace        || '';
      el('pLocation').value    = p.location    || '';
      el('pExpectedDay').value = p.expectedDay !== null && p.expectedDay !== undefined ? String(p.expectedDay) : '';

      document.querySelectorAll('input[name="pCulture"]').forEach(cb => {
        cb.checked = Array.isArray(p.cultures) && p.cultures.includes(cb.value);
      });
      refreshChips('input[name="pCulture"]');
    }
  }

  el('editorModal').classList.remove('hidden');
  setTimeout(() => el('pName').focus(), 50);
}

function closeEditor() { el('editorModal').classList.add('hidden'); }

function saveProfile(e) {
  e.preventDefault();
  const name = el('pName').value.trim();
  if (!name) { el('pName').focus(); return; }

  const cultures = Array.from(document.querySelectorAll('input[name="pCulture"]:checked')).map(cb => cb.value);
  const expDay   = el('pExpectedDay').value;

  const data = {
    name,
    category:    el('pCategory').value.trim()   || el('pDiscipline').value || 'Other',
    discipline:  el('pDiscipline').value,
    cultures,
    startTime:   el('pStartTime').value.trim(),
    finishTime:  el('pFinishTime').value.trim(),
    pace:        el('pPace').value.trim(),
    location:    el('pLocation').value.trim(),
    expectedDay: expDay !== '' ? parseInt(expDay) : null,
  };

  if (editingProfileId) {
    const idx = profiles.findIndex(p => p.id === editingProfileId);
    if (idx !== -1) profiles[idx] = { ...profiles[idx], ...data };
  } else {
    data.id = `profile-${Date.now()}`;
    profiles.push(data);
  }

  saveProfiles();
  renderProfileGrid();
  renderProfileList();
  closeEditor();
  showToast('Profile saved');
}

function duplicateProfile(id) {
  const src = profiles.find(p => p.id === id);
  if (!src) return;
  const copy = { ...src, id: `profile-${Date.now()}`, name: `${src.name} (copy)` };
  profiles.push(copy);
  saveProfiles();
  renderProfileGrid();
  renderProfileList();
  showToast('Profile duplicated');
}

function promptDelete(id) {
  pendingDeleteId = id;
  const p = profiles.find(x => x.id === id);
  el('deleteMessage').textContent = `Delete "${p?.name}"? This cannot be undone.`;
  el('deleteModal').classList.remove('hidden');
}

function confirmDelete() {
  if (!pendingDeleteId) return;
  profiles = profiles.filter(p => p.id !== pendingDeleteId);
  pendingDeleteId = null;
  saveProfiles();
  renderProfileGrid();
  renderProfileList();
  el('deleteModal').classList.add('hidden');
  showToast('Profile deleted');
}

// ─── Export / Import ──────────────────────────────────────────────────────────

function exportProfiles() {
  const blob = new Blob([JSON.stringify(profiles, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'wcc-ride-profiles.json';
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importProfiles(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data)) throw new Error('Expected an array');

      const replace = confirm(
        `Import ${data.length} profiles.\n\nOK = Replace all existing profiles\nCancel = Merge (add new, keep existing)`
      );

      if (replace) {
        profiles = data;
      } else {
        const ids = new Set(profiles.map(p => p.id));
        data.forEach(p => { if (!ids.has(p.id)) profiles.push(p); });
      }

      saveProfiles();
      renderProfileGrid();
      renderProfileList();
      showToast(`Imported ${data.length} profiles`);
    } catch {
      alert('Could not parse the JSON file. Make sure it was exported from this app.');
    }
    e.target.value = '';
  };
  reader.readAsText(file);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function el(id) { return document.getElementById(id); }

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── Event Wiring ─────────────────────────────────────────────────────────────

function setupEventListeners() {
  // Step 1
  el('blankBtn').addEventListener('click', blankForm);

  // Step 2 navigation
  el('backBtn').addEventListener('click', () => goToStep(1));

  el('rideDate').addEventListener('input', onDateChange);

  document.querySelectorAll('input[name="discipline"]').forEach(r =>
    r.addEventListener('change', () => refreshChips('input[name="discipline"]'))
  );

  document.querySelectorAll('input[name="culture"]').forEach(cb =>
    cb.addEventListener('change', () => {
      refreshChips('input[name="culture"]');
      updateCulturePreview();
    })
  );

  el('testUrlBtn').addEventListener('click', () => {
    const url = el('routeUrl').value.trim();
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
    else showToast('Enter a URL first');
  });

  el('previewBtn').addEventListener('click', () => {
    if (!el('rideDate').value) {
      el('rideDate').focus();
      showToast('Please pick a date first');
      return;
    }
    const { title, body } = renderPost();
    el('titleOutput').textContent = title;
    el('bodyOutput').value        = body;
    // Auto-size the textarea to content
    el('bodyOutput').style.height = 'auto';
    el('bodyOutput').style.height = el('bodyOutput').scrollHeight + 'px';
    goToStep(3);
  });

  // Step 3 navigation
  el('editBtn').addEventListener('click', () => goToStep(2));
  el('restartBtn').addEventListener('click', () => {
    selectedProfile = null;
    goToStep(1);
  });

  // Copy buttons
  document.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = el(btn.dataset.target);
      const text = target.tagName === 'TEXTAREA' ? target.value : target.textContent;
      copyText(text, btn);
    });
  });

  // Admin modal
  el('adminBtn').addEventListener('click', openAdmin);
  el('closeAdmin').addEventListener('click', closeAdmin);
  el('adminModal').querySelector('.modal-backdrop').addEventListener('click', closeAdmin);

  el('pinInput').addEventListener('keydown', e => { if (e.key === 'Enter') checkPin(); });
  el('pinSubmit').addEventListener('click', checkPin);

  el('newProfileBtn').addEventListener('click', () => openEditor(null));
  el('exportBtn').addEventListener('click', exportProfiles);
  el('importFile').addEventListener('change', importProfiles);
  el('changePinBtn').addEventListener('click', changePin);

  // Profile editor modal
  el('closeEditor').addEventListener('click', closeEditor);
  el('cancelProfile').addEventListener('click', closeEditor);
  el('editorModal').querySelector('.modal-backdrop').addEventListener('click', closeEditor);
  el('profileForm').addEventListener('submit', saveProfile);

  document.querySelectorAll('input[name="pCulture"]').forEach(cb =>
    cb.addEventListener('change', () => refreshChips('input[name="pCulture"]'))
  );

  // Delete confirm modal
  el('cancelDelete').addEventListener('click', () => el('deleteModal').classList.add('hidden'));
  el('confirmDelete').addEventListener('click', confirmDelete);
  el('deleteModal').querySelector('.modal-backdrop').addEventListener('click', () =>
    el('deleteModal').classList.add('hidden')
  );

  // Close modals on Escape
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    el('adminModal').classList.add('hidden');
    el('editorModal').classList.add('hidden');
    el('deleteModal').classList.add('hidden');
  });
}
