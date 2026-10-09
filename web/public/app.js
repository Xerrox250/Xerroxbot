const CATEGORY_META = {
  moderation: { emoji: '🛡️', label: 'Modération' },
  utile: { emoji: '🧰', label: 'Utile' },
  fun: { emoji: '🎉', label: 'Fun' },
  economie: { emoji: '💰', label: 'Économie' },
  social: { emoji: '👥', label: 'Social' },
};

let allCommands = {};
let activeCategory = 'all';
let activeSearch = '';

const $ = (id) => document.getElementById(id);

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  $('themeToggle').checked = theme === 'light';
}

function initTheme() {
  const saved = localStorage.getItem('pinky-theme');
  setTheme(saved || 'dark');
  $('themeToggle').addEventListener('change', (e) => {
    const theme = e.target.checked ? 'light' : 'dark';
    localStorage.setItem('pinky-theme', theme);
    setTheme(theme);
  });
}

function formatUptime(ms) {
  if (!ms) return '—';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const parts = [];
  if (d) parts.push(`${d}j`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  parts.push(`${s % 60}s`);
  return parts.join(' ');
}

function renderStatus(data) {
  const dot = $('statusDot');
  dot.classList.toggle('online', data.online);
  $('statusText').textContent = data.online ? 'Connecté' : 'Hors ligne';
  $('botName').textContent = data.name;
  $('footerName').textContent = data.name;
  document.title = `${data.name} — Dashboard`;
  if (data.avatar) $('brandAvatar').innerHTML = `<img src="${data.avatar}" alt="" />`;
  $('statServers').textContent = data.servers;
  $('statMembers').textContent = data.members.toLocaleString('fr-FR');
  $('statPing').textContent = data.online ? `${data.ping}ms` : '—';
  $('statUptime').textContent = formatUptime(data.uptime);
}

function renderTabs() {
  const tabsEl = $('tabs');
  tabsEl.innerHTML = '';

  const keys = ['all', ...Object.keys(allCommands)];
  for (const key of keys) {
    const meta = key === 'all'
      ? { emoji: '✨', label: 'Toutes' }
      : CATEGORY_META[key] || { emoji: '📁', label: key };
    const count = key === 'all'
      ? Object.values(allCommands).reduce((t, arr) => t + arr.length, 0)
      : allCommands[key].length;

    const btn = document.createElement('button');
    btn.className = 'tab' + (key === activeCategory ? ' active' : '');
    btn.textContent = `${meta.emoji} ${meta.label}`;
    btn.title = `${count} commande(s)`;
    btn.addEventListener('click', () => {
      activeCategory = key;
      renderTabs();
      renderCards();
    });
    tabsEl.appendChild(btn);
  }
}

function renderCards() {
  const cardsEl = $('cards');
  const emptyEl = $('emptySearch');
  cardsEl.innerHTML = '';

  let list = activeCategory === 'all'
    ? Object.entries(allCommands).flatMap(([cat, cmds]) => cmds.map(c => ({ ...c, category: cat })))
    : (allCommands[activeCategory] || []).map(c => ({ ...c, category: activeCategory }));

  if (activeSearch) {
    const q = activeSearch.toLowerCase();
    list = list.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      (c.aliases || []).some(a => a.toLowerCase().includes(q))
    );
  }

  list.sort((a, b) => a.name.localeCompare(b.name));

  emptyEl.hidden = list.length > 0;

  for (const cmd of list) {
    const meta = CATEGORY_META[cmd.category] || { emoji: '📁', label: cmd.category };
    const card = document.createElement('article');
    card.className = 'card';

    const aliases = cmd.aliases?.length
      ? ` — Alias : ${cmd.aliases.map(a => `!${a}`).join(', ')}`
      : '';

    card.innerHTML = `
      <div class="card-top">
        <h4>${meta.emoji} <span class="card-name">!${cmd.name}</span></h4>
        <span class="badge ${cmd.category}">${meta.label}</span>
      </div>
      <p>${cmd.description}${aliases}</p>
      <code class="usage">${cmd.usage}</code>
    `;
    cardsEl.appendChild(card);
  }
}

async function loadStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    renderStatus(data);
  } catch (e) {
    $('statusText').textContent = 'API indisponible';
  }
}

async function loadCommands() {
  try {
    const res = await fetch('/api/commands');
    allCommands = await res.json();
    $('countCommands').textContent = Object.values(allCommands).reduce((t, arr) => t + arr.length, 0);
    renderTabs();
    renderCards();
  } catch (e) {
    $('cards').innerHTML = '<p class="empty">Impossible de charger les commandes.</p>';
  }
}

async function runFun() {
  const command = $('funCmd').value;
  const args = $('funArgs').value;
  const box = $('funResult');

  const btn = $('funGo');
  btn.disabled = true;
  btn.textContent = '…';

  try {
    const res = await fetch('/api/fun', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, args }),
    });
    const data = await res.json();
    box.hidden = false;

    if (!res.ok) {
      box.className = 'fun-result error';
      box.innerHTML = `<span class="fr-title">${data.emoji || '❌'} Erreur</span>${data.error}`;
    } else {
      box.className = 'fun-result';
      box.innerHTML = `<span class="fr-title">${data.emoji || ''} ${data.title}</span>${data.result}`;
    }
  } catch (e) {
    box.hidden = false;
    box.className = 'fun-result error';
    box.innerHTML = '<span class="fr-title">❌ Erreur réseau</span>Le bot doit être connecté pour répondre.';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Lancer';
  }
}

function init() {
  initTheme();
  loadStatus();
  loadCommands();

  $('search').addEventListener('input', (e) => {
    activeSearch = e.target.value.trim();
    renderCards();
  });

  $('funGo').addEventListener('click', runFun);
  $('funArgs').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') runFun();
  });

  setInterval(loadStatus, 20000);
}

document.addEventListener('DOMContentLoaded', init);