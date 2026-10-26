'use strict';

const STORE_KEY = 'claude-apps.items.v1';
const $ = (sel) => document.querySelector(sel);

const grid = $('#grid');
const empty = $('#empty');
const editor = $('#editor');
const form = $('#editor-form');
const menu = $('#menu');
const viewer = $('#viewer');
const frame = $('#viewer-frame');

let items = load();
let editingId = null;

// ---------- Speicher ----------

function load() {
  try {
    const data = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
    return Array.isArray(data) ? data.filter(isValidItem) : [];
  } catch {
    return [];
  }
}

function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(items));
    return true;
  } catch (err) {
    toast(err && err.name === 'QuotaExceededError'
      ? 'Speicher voll. Lösche große HTML-Kopien oder nutze Links.'
      : 'Speichern fehlgeschlagen.');
    return false;
  }
}

function isValidItem(it) {
  return it && typeof it.id === 'string' && typeof it.name === 'string' &&
    ((it.kind === 'link' && typeof it.url === 'string') ||
     (it.kind === 'html' && typeof it.html === 'string'));
}

// Android soll den Speicher dieser App nicht von selbst aufräumen.
if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().catch(() => {});
}

// ---------- Anzeige ----------

function render() {
  grid.replaceChildren();
  empty.hidden = items.length > 0;
  for (const it of items) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tile';
    btn.dataset.id = it.id;

    const emoji = document.createElement('span');
    emoji.className = 'emoji';
    emoji.textContent = it.emoji || (it.kind === 'html' ? '📄' : '🔗');

    const text = document.createElement('span');
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = it.name;
    const kind = document.createElement('span');
    kind.className = 'kind';
    kind.textContent = it.kind === 'html' ? 'HTML-Kopie · offline' : hostOf(it.url);
    text.append(name, document.createElement('br'), kind);

    btn.append(emoji, text);
    li.append(btn);
    grid.append(li);
  }
}

function hostOf(url) {
  try { return new URL(url).host; } catch { return 'Link'; }
}

grid.addEventListener('click', (e) => {
  const tile = e.target.closest('.tile');
  if (!tile) return;
  const it = items.find((x) => x.id === tile.dataset.id);
  if (!it) return;
  if (document.body.classList.contains('editing')) openEditor(it);
  else openItem(it);
});

function openItem(it) {
  if (it.kind === 'link') {
    window.open(it.url, '_blank', 'noopener');
    return;
  }
  $('#viewer-title').textContent = it.name;
  frame.srcdoc = it.html;
  viewer.hidden = false;
  history.pushState({ viewer: true }, '');
}

function closeViewer() {
  viewer.hidden = true;
  frame.removeAttribute('srcdoc');
  frame.src = 'about:blank';
}

$('#btn-close-viewer').addEventListener('click', () => history.back());
window.addEventListener('popstate', () => { if (!viewer.hidden) closeViewer(); });

// ---------- Bearbeiten ----------

$('#btn-edit').addEventListener('click', (e) => {
  const on = document.body.classList.toggle('editing');
  e.currentTarget.setAttribute('aria-pressed', String(on));
  if (on) toast('Tippe auf eine Kachel, um sie zu bearbeiten.');
});

$('#btn-add').addEventListener('click', () => openEditor(null));

function setKind(kind) {
  form.elements.kind.value = kind;
  for (const el of form.querySelectorAll('[data-kind]')) el.hidden = el.dataset.kind !== kind;
}
form.addEventListener('change', (e) => { if (e.target.name === 'kind') setKind(e.target.value); });

function openEditor(it, prefill = {}) {
  editingId = it ? it.id : null;
  form.reset();
  $('#editor-error').hidden = true;
  $('#editor-title').textContent = it ? 'Artefakt bearbeiten' : 'Artefakt hinzufügen';
  $('#btn-delete').hidden = !it;
  const src = it || prefill;
  form.elements.name.value = src.name || '';
  form.elements.emoji.value = src.emoji || '';
  form.elements.url.value = src.url || '';
  form.elements.html.value = src.html || '';
  setKind(src.kind || 'link');
  editor.showModal();
}

form.addEventListener('submit', (e) => {
  if (e.submitter && e.submitter.value !== 'save') return;
  const err = validateAndSave();
  if (err) {
    e.preventDefault();
    const box = $('#editor-error');
    box.textContent = err;
    box.hidden = false;
  }
});

function validateAndSave() {
  const f = form.elements;
  const kind = f.kind.value;
  const name = f.name.value.trim();
  if (!name) return 'Bitte einen Namen eingeben.';

  const it = { id: editingId || newId(), name, emoji: f.emoji.value.trim(), kind };
  if (kind === 'link') {
    const url = f.url.value.trim();
    let parsed;
    try { parsed = new URL(url); } catch { return 'Bitte eine gültige Adresse eingeben.'; }
    if (parsed.protocol !== 'https:') return 'Die Adresse muss mit https:// beginnen.';
    it.url = parsed.href;
  } else {
    const html = f.html.value;
    if (!html.trim()) return 'Bitte HTML-Code einfügen oder eine Datei wählen.';
    it.html = html;
  }

  const before = items;
  const idx = items.findIndex((x) => x.id === it.id);
  items = idx >= 0 ? items.map((x, i) => (i === idx ? it : x)) : [...items, it];
  if (!save()) { items = before; return 'Konnte nicht speichern (Speicher voll?).'; }
  render();
  return null;
}

$('#btn-delete').addEventListener('click', () => {
  const it = items.find((x) => x.id === editingId);
  if (!it || !confirm(`„${it.name}“ löschen?`)) return;
  items = items.filter((x) => x.id !== editingId);
  save();
  render();
  editor.close();
});

$('#btn-html-file').addEventListener('click', () => $('#html-file').click());
$('#html-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  form.elements.html.value = await file.text();
  if (!form.elements.name.value) form.elements.name.value = file.name.replace(/\.html?$/i, '');
  e.target.value = '';
});

function newId() {
  return (crypto.randomUUID && crypto.randomUUID()) || String(Date.now()) + Math.random().toString(16).slice(2);
}

// ---------- Sicherung ----------

$('#btn-menu').addEventListener('click', () => menu.showModal());

$('#btn-export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ app: 'claude-apps', version: 1, items }, null, 2)],
    { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `claude-apps-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

$('#btn-import').addEventListener('click', () => $('#import-file').click());
$('#import-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  let incoming;
  try {
    const data = JSON.parse(await file.text());
    incoming = (Array.isArray(data) ? data : data.items || []).filter(isValidItem);
  } catch {
    toast('Datei ist keine gültige Sicherung.');
    return;
  }
  if (!incoming.length) { toast('Keine Einträge in der Datei.'); return; }
  // Zusammenführen: gleiche IDs werden durch die Sicherung ersetzt.
  const byId = new Map(items.map((x) => [x.id, x]));
  for (const it of incoming) byId.set(it.id, it);
  const before = items;
  items = [...byId.values()];
  if (!save()) { items = before; return; }
  render();
  menu.close();
  toast(`${incoming.length} Einträge importiert.`);
});

// ---------- Teilen aus anderen Apps (Android-Teilen-Menü) ----------

function handleShare() {
  const params = new URLSearchParams(location.search);
  if (!['url', 'text', 'title'].some((k) => params.has(k))) return;
  const text = `${params.get('url') || ''} ${params.get('text') || ''}`;
  const match = text.match(/https:\/\/\S+/);
  history.replaceState(null, '', location.pathname);
  openEditor(null, {
    kind: 'link',
    url: match ? match[0] : '',
    name: (params.get('title') || '').trim().slice(0, 60),
  });
}

// ---------- Kleinkram ----------

let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 3000);
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

render();
handleShare();
