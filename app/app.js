// Leonida Trophy Guide: checklist tracker for the 55 GTA VI trophies.
// Progress and settings live in localStorage; the trophy data comes from
// data/trophies.json, a file inside this app, so the guide works offline.
const EARNED_KEY = 'gta6-trophy-guide-v1-earned';
const SETTINGS_KEY = 'gta6-trophy-guide-v1-settings';
const DATA_URL = 'data/trophies.json';

const listEl = document.getElementById('trophyList');
const detailEl = document.getElementById('detailBody');
const statusEl = document.getElementById('statusLine');
const countEl = document.getElementById('countLine');
const searchEl = document.getElementById('search');
const gradeEl = document.getElementById('gradeFilter');
const missableEl = document.getElementById('missableOnly');
const earnedOnlyEl = document.getElementById('earnedOnly');
const spoilerEl = document.getElementById('spoilerToggle');
const chipsEl = document.getElementById('kindChips');

let trophies = [];
let roadmapStages = [];
let earned = new Set(readStoredSet(EARNED_KEY));
let settings = readStoredSettings();
let selectedId = 28;

function readStoredSet(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((name) => typeof name === 'string') : [];
  } catch {
    return [];
  }
}

function readStoredSettings() {
  const defaults = { kind: 'all', grade: 'all', missableOnly: false, earnedOnly: false, spoilers: true, search: '' };
  try {
    const parsed = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}');
    return { ...defaults, ...(parsed && typeof parsed === 'object' ? parsed : {}) };
  } catch {
    return defaults;
  }
}

function saveEarned() {
  localStorage.setItem(EARNED_KEY, JSON.stringify([...earned].sort()));
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function kindLabel(kind) {
  if (kind === 'story') return 'Story';
  if (kind === 'activities') return 'Activities';
  if (kind === 'collectibles') return 'Collectibles';
  if (kind === 'platinum') return 'Platinum';
  return 'Online';
}

function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function isSpoilerHidden(trophy) {
  return settings.spoilers && trophy.kind === 'story' && !earned.has(trophy.name);
}

function trophyMatches(trophy) {
  if (settings.kind !== 'all' && trophy.kind !== settings.kind) return false;
  if (settings.grade !== 'all' && trophy.grade !== settings.grade) return false;
  if (settings.missableOnly && !trophy.missable) return false;
  if (settings.earnedOnly && !earned.has(trophy.name)) return false;
  if (settings.search) {
    const hay = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
    if (!hay.includes(settings.search.toLowerCase())) return false;
  }
  return true;
}

function badge(text, cls) {
  const span = document.createElement('span');
  span.className = `badge ${cls}`;
  span.textContent = text;
  return span;
}

function renderRoadmap() {
  const stagesEl = document.getElementById('roadmapStages');
  stagesEl.replaceChildren();
  for (const stage of roadmapStages) {
    const count = trophies.filter((t) => t.roadmap === stage.stage).length;
    const earnedCount = trophies.filter((t) => t.roadmap === stage.stage && earned.has(t.name)).length;
    const li = document.createElement('li');
    const h3 = document.createElement('h3');
    h3.textContent = stage.title;
    const p = document.createElement('p');
    p.textContent = stage.text;
    const meta = document.createElement('p');
    meta.className = 'stage-count';
    meta.textContent = `${earnedCount} of ${count} trophies in this stage`;
    li.append(h3, p, meta);
    stagesEl.append(li);
  }
}

function renderProgress() {
  const total = trophies.length;
  const done = trophies.filter((t) => earned.has(t.name)).length;
  document.getElementById('progressCount').textContent = `${done} of ${total} earned`;
  const fill = document.getElementById('progressFill');
  fill.style.width = total ? `${Math.round((done / total) * 100)}%` : '0%';
  document.getElementById('miniProgressCount').textContent = `${done} of ${total} earned`;
  document.getElementById('miniProgressFill').style.width = total ? `${Math.round((done / total) * 100)}%` : '0%';
  const bar = document.getElementById('progressBar');
  bar.setAttribute('aria-valuenow', String(done));
  const byGrade = (grade) => trophies.filter((t) => t.grade === grade && earned.has(t.name)).length;
  const gradeTotal = (grade) => trophies.filter((t) => t.grade === grade).length;
  document.getElementById('progressDetail').textContent =
    `Platinum ${byGrade('platinum')}/${gradeTotal('platinum')} · Gold ${byGrade('gold')}/${gradeTotal('gold')} · Silver ${byGrade('silver')}/${gradeTotal('silver')} · Bronze ${byGrade('bronze')}/${gradeTotal('bronze')}`;
  const byKind = (kind) => trophies.filter((t) => t.kind === kind && earned.has(t.name)).length;
  const kindTotal = (kind) => trophies.filter((t) => t.kind === kind).length;
  document.getElementById('progressKind').textContent =
    `Story ${byKind('story')}/${kindTotal('story')} · Activities ${byKind('activities')}/${kindTotal('activities')} · Collectibles ${byKind('collectibles')}/${kindTotal('collectibles')}`;
}

function renderChips() {
  for (const chip of chipsEl.querySelectorAll('.chip')) {
    const kind = chip.dataset.kind;
    const count = kind === 'all' ? trophies.length : trophies.filter((t) => t.kind === kind).length;
    const label = kind === 'all' ? 'All kinds' : kindLabel(kind);
    chip.textContent = `${label} (${count})`;
    chip.classList.toggle('active', settings.kind === kind);
  }
}

function renderList() {
  const shown = trophies.filter(trophyMatches);
  listEl.replaceChildren();
  for (const trophy of shown) {
    const hidden = isSpoilerHidden(trophy);
    const li = document.createElement('li');
    li.className = 'trophy-card' + (earned.has(trophy.name) ? ' earned' : '') + (selectedId === trophy.id ? ' selected' : '');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(trophy.name);
    box.setAttribute('aria-label', `Earned: ${hidden ? 'hidden story trophy' : trophy.name}`);
    box.addEventListener('change', () => {
      if (box.checked) earned.add(trophy.name);
      else earned.delete(trophy.name);
      saveEarned();
      renderAll();
    });
    const body = document.createElement('div');
    const title = document.createElement('h3');
    title.textContent = hidden ? 'Hidden story trophy' : trophy.name;
    const desc = document.createElement('p');
    desc.className = 'desc';
    desc.textContent = hidden ? 'Hidden until earned — tick it off to reveal its name and description.' : trophy.description;
    const badges = document.createElement('div');
    badges.className = 'badges';
    badges.append(badge(gradeLabel(trophy.grade), trophy.grade));
    badges.append(badge(kindLabel(trophy.kind), 'kind'));
    badges.append(badge(`Roadmap step ${trophy.roadmap}`, 'stage'));
    if (trophy.missable) badges.append(badge('⚠ Missable', 'missable'));
    if (earned.has(trophy.name)) badges.append(badge('✓ Earned', 'kind'));
    body.append(title, desc, badges);
    if (hidden) {
      const note = document.createElement('p');
      note.className = 'spoiler-note';
      note.textContent = 'Spoiler-safe mode is on. Earn this trophy to reveal its guide.';
      body.append(note);
    } else {
      const guide = document.createElement('p');
      guide.className = 'guide';
      guide.textContent = trophy.guide;
      const source = document.createElement('p');
      source.className = 'source-line';
      const strong = document.createElement('strong');
      strong.textContent = 'Source: ';
      source.append(strong, document.createTextNode(trophy.source));
      body.append(guide, source);
    }
    li.append(box, body);
    li.addEventListener('click', (event) => {
      if (event.target === box) return;
      selectedId = trophy.id;
      renderAll();
    });
    listEl.append(li);
  }
  document.getElementById('emptyNote').hidden = shown.length !== 0;
  countEl.textContent = `Showing ${shown.length} of ${trophies.length} trophies`;
}

function renderDetail() {
  const trophy = trophies.find((t) => t.id === selectedId) ?? trophies[0];
  detailEl.replaceChildren();
  if (!trophy) return;
  const wrap = document.createElement('div');
  wrap.className = 'detail-body';
  const hidden = isSpoilerHidden(trophy);
  const title = document.createElement('h3');
  title.textContent = hidden ? 'Hidden story trophy' : trophy.name;
  const desc = document.createElement('p');
  desc.className = 'desc';
  desc.textContent = hidden ? 'Hidden until earned.' : trophy.description;
  const badges = document.createElement('div');
  badges.className = 'badges';
  badges.append(badge(gradeLabel(trophy.grade), trophy.grade));
  badges.append(badge(kindLabel(trophy.kind), 'kind'));
  if (trophy.missable) badges.append(badge('⚠ Missable', 'missable'));
  wrap.append(title, desc, badges);
  if (hidden) {
    const note = document.createElement('p');
    note.className = 'spoiler-note';
    note.textContent = 'Spoiler-safe mode is on. Earn this trophy to reveal its guide and source.';
    wrap.append(note);
  } else {
    const guide = document.createElement('p');
    guide.className = 'guide';
    guide.textContent = trophy.guide;
    const source = document.createElement('p');
    source.className = 'source-line';
    const strong = document.createElement('strong');
    strong.textContent = 'Source: ';
    source.append(strong, document.createTextNode(trophy.source));
    const stage = roadmapStages.find((s) => s.stage === trophy.roadmap);
    const stageLine = document.createElement('p');
    stageLine.className = 'roadmap-line';
    stageLine.textContent = stage ? stage.title : `Roadmap step ${trophy.roadmap}`;
    wrap.append(guide, source, stageLine);
  }
  const state = document.createElement('p');
  state.className = 'source-line';
  state.textContent = earned.has(trophy.name) ? 'Status: earned ✓' : 'Status: not earned yet — tick the box in the list when you unlock it.';
  wrap.append(state);
  detailEl.append(wrap);
}

function renderAll() {
  renderRoadmap();
  renderProgress();
  renderChips();
  renderList();
  renderDetail();
}

function downloadFile(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportProgress() {
  const payload = {
    app: 'gta6-trophy-guide',
    game: 'Grand Theft Auto VI',
    exportedAt: new Date().toISOString(),
    earned: [...earned].sort(),
  };
  downloadFile('gta6-trophy-progress.json', JSON.stringify(payload, null, 2));
  statusEl.textContent = `Exported ${earned.size} earned trophies.`;
}

async function importProgress(file) {
  try {
    const parsed = JSON.parse(await file.text());
    const names = Array.isArray(parsed) ? parsed : parsed.earned;
    if (!Array.isArray(names)) throw new Error('no earned list');
    const known = new Set(trophies.map((t) => t.name));
    const kept = names.filter((name) => typeof name === 'string' && known.has(name));
    earned = new Set(kept);
    saveEarned();
    renderAll();
    statusEl.textContent = `Imported ${kept.length} earned trophies (${names.length - kept.length} unknown names ignored).`;
  } catch {
    statusEl.textContent = 'Import failed: that file is not a trophy progress export.';
  }
}

searchEl.value = settings.search;
gradeEl.value = settings.grade;
missableEl.checked = settings.missableOnly;
earnedOnlyEl.checked = settings.earnedOnly;
spoilerEl.checked = settings.spoilers;

searchEl.addEventListener('input', () => { settings.search = searchEl.value; saveSettings(); renderList(); });
gradeEl.addEventListener('change', () => { settings.grade = gradeEl.value; saveSettings(); renderList(); });
missableEl.addEventListener('change', () => { settings.missableOnly = missableEl.checked; saveSettings(); renderList(); });
earnedOnlyEl.addEventListener('change', () => { settings.earnedOnly = earnedOnlyEl.checked; saveSettings(); renderList(); });
spoilerEl.addEventListener('change', () => { settings.spoilers = spoilerEl.checked; saveSettings(); renderAll(); });
chipsEl.addEventListener('click', (event) => {
  const chip = event.target.closest('.chip');
  if (!chip) return;
  settings.kind = chip.dataset.kind;
  saveSettings();
  renderChips();
  renderList();
});
document.getElementById('exportBtn').addEventListener('click', exportProgress);
document.getElementById('importFile').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) importProgress(file);
  event.target.value = '';
});
document.getElementById('resetBtn').addEventListener('click', () => {
  if (window.confirm('Clear all earned trophies? This cannot be undone.')) {
    earned = new Set();
    saveEarned();
    renderAll();
    statusEl.textContent = 'Progress cleared.';
  }
});

const data = await (await fetch(DATA_URL)).json();
trophies = data.trophies;
roadmapStages = data.roadmap ?? [];
if (!trophies.some((t) => t.id === selectedId)) selectedId = trophies[0]?.id;
renderAll();
