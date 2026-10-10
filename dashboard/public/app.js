const CATEGORY_META = {
  moderation: { emoji: '🛡️', label: 'Modération' },
  utile: { emoji: '🧰', label: 'Utile' },
  fun: { emoji: '🎉', label: 'Fun' },
  economie: { emoji: '💰', label: 'Économie' },
  social: { emoji: '👥', label: 'Social' },
};

const VIEW_TITLES = {
  overview: "Vue d'ensemble",
  servers: 'Serveurs',
  commands: 'Commandes',
  console: 'Console',
  economy: 'Économie',
  warnings: 'Avertissements',
};

const state = {
  status: null,
  commands: {},
  cmdCategory: 'all',
  cmdSearch: '',
  guilds: [],
  activeGuildId: null,
  guildDetail: null,
  memberTab: 'channels',
  memberQuery: '',
};

const $ = (id) => document.getElementById(id);

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function api(url, options) {
  const res = await fetch(url, options);
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  if (!res.ok) throw new Error((data && data.error) || `Erreur ${res.status}`);
  return data;
}

async function post(url, body) {
  return api(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
}

let toastTimer = null;
function toast(message, isError) {
  const el = $('toast');
  el.textContent = message;
  el.classList.toggle('err', !!isError);
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 3200);
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

function formatDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function initials(name) {
  return String(name || '?').trim().charAt(0).toUpperCase() || '?';
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  $('themeToggle').checked = theme === 'light';
}

function initTheme() {
  const saved = localStorage.getItem('pinky-dash-theme');
  setTheme(saved || 'dark');
  $('themeToggle').addEventListener('change', (e) => {
    const theme = e.target.checked ? 'light' : 'dark';
    localStorage.setItem('pinky-dash-theme', theme);
    setTheme(theme);
  });
}

function switchView(view) {
  document.querySelectorAll('.nav-item').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === `view-${view}`));
  $('viewTitle').textContent = VIEW_TITLES[view] || view;
  $('sidebar').classList.remove('open');
  if (view === 'servers') loadGuilds();
  if (view === 'economy') loadEconomy();
  if (view === 'warnings') loadWarnings();
}

function initNav() {
  document.querySelectorAll('.nav-item').forEach((b) => {
    b.addEventListener('click', () => switchView(b.dataset.view));
  });
  document.querySelectorAll('[data-go]').forEach((b) => {
    b.addEventListener('click', () => switchView(b.dataset.go));
  });
  $('menuToggle').addEventListener('click', () => $('sidebar').classList.toggle('open'));
}

async function loadStatus() {
  try {
    const data = await api('/api/status');
    state.status = data;
    $('statusDot').classList.toggle('online', data.online);
    $('statusText').textContent = data.online ? 'Connecté' : 'Hors ligne';
    $('botName').textContent = data.name;
    $('footerName').textContent = data.name;
    document.title = `${data.name} — Panneau de contrôle`;
    if (data.avatar) $('brandAvatar').innerHTML = `<img src="${data.avatar}" alt="" />`;
    $('statServers').textContent = data.servers;
    $('statMembers').textContent = data.members.toLocaleString('fr-FR');
    $('statChannels').textContent = data.channels.toLocaleString('fr-FR');
    $('statPing').textContent = data.online ? `${data.ping}ms` : '—';
    $('statUptime').textContent = data.uptimeText;
    $('statCmds').textContent = data.commands;
    $('topPing').textContent = data.online ? `🏓 ${data.ping}ms` : 'hors ligne';
    $('sidePrefix').textContent = `préfixe ${data.prefix}`;
  } catch (e) {
    $('statusText').textContent = 'API indisponible';
    $('topPing').textContent = 'API indisponible';
  }
}

async function loadCommands() {
  try {
    state.commands = await api('/api/commands');
    const total = Object.values(state.commands).reduce((t, arr) => t + arr.length, 0);
    $('countCommands').textContent = total;
    renderCmdTabs();
    renderCmdCards();
  } catch (e) {
    $('cmdCards').innerHTML = '<p class="empty">Impossible de charger les commandes.</p>';
  }
}

function renderCmdTabs() {
  const el = $('cmdTabs');
  el.innerHTML = '';
  const keys = ['all', ...Object.keys(state.commands)];
  for (const key of keys) {
    const meta = key === 'all' ? { emoji: '✨', label: 'Toutes' } : CATEGORY_META[key] || { emoji: '📁', label: key };
    const btn = document.createElement('button');
    btn.className = 'tab' + (key === state.cmdCategory ? ' active' : '');
    btn.textContent = `${meta.emoji} ${meta.label}`;
    btn.addEventListener('click', () => {
      state.cmdCategory = key;
      renderCmdTabs();
      renderCmdCards();
    });
    el.appendChild(btn);
  }
}

function renderCmdCards() {
  const el = $('cmdCards');
  el.innerHTML = '';
  let list = state.cmdCategory === 'all'
    ? Object.entries(state.commands).flatMap(([cat, cmds]) => cmds.map((c) => ({ ...c, category: cat })))
    : (state.commands[state.cmdCategory] || []).map((c) => ({ ...c, category: state.cmdCategory }));

  if (state.cmdSearch) {
    const q = state.cmdSearch.toLowerCase();
    list = list.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      (c.aliases || []).some((a) => a.toLowerCase().includes(q))
    );
  }
  list.sort((a, b) => a.name.localeCompare(b.name));
  $('cmdEmpty').hidden = list.length > 0;

  for (const cmd of list) {
    const meta = CATEGORY_META[cmd.category] || { emoji: '📁', label: cmd.category };
    const aliases = cmd.aliases && cmd.aliases.length ? `Alias : ${cmd.aliases.map((a) => `<code>${escapeHtml(a)}</code>`).join(' ')}` : '';
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-top">
        <h4>${meta.emoji} <span class="card-name">${escapeHtml(state.status ? state.status.prefix : '!')}${escapeHtml(cmd.name)}</span></h4>
        <span class="badge ${cmd.category}">${meta.label}</span>
      </div>
      <p>${escapeHtml(cmd.description)}${aliases ? '<br>' + aliases : ''}</p>
      <code class="usage">${escapeHtml(cmd.usage)}</code>
      <div class="card-foot">
        <small class="hint">⏳ ${cmd.cooldown}s</small>
        <button class="icon-btn">▶ Tester</button>
      </div>`;
    card.querySelector('button').addEventListener('click', () => {
      switchView('console');
      $('execCommand').value = cmd.name;
      $('execArgs').value = '';
      $('execCommand').focus();
    });
    el.appendChild(card);
  }
}

async function loadGuilds() {
  try {
    state.guilds = await api('/api/guilds');
    renderGuildList();
    if (state.activeGuildId && !state.guilds.some((g) => g.id === state.activeGuildId)) {
      state.activeGuildId = null;
      state.guildDetail = null;
      $('guildDetail').innerHTML = '<p class="empty">Sélectionne un serveur pour le gérer.</p>';
    }
    populateExecGuilds();
  } catch (e) {
    $('guildList').innerHTML = `<p class="empty">${escapeHtml(e.message)}</p>`;
  }
}

function renderGuildList() {
  const el = $('guildList');
  el.innerHTML = '';
  if (!state.guilds.length) {
    el.innerHTML = '<p class="empty">Aucun serveur.</p>';
    return;
  }
  for (const g of state.guilds) {
    const item = document.createElement('div');
    item.className = 'guild-item' + (g.id === state.activeGuildId ? ' active' : '');
    const icon = g.icon
      ? `<span class="guild-icon"><img src="${g.icon}" alt="" /></span>`
      : `<span class="guild-icon">${initials(g.name)}</span>`;
    item.innerHTML = `${icon}
      <div class="guild-meta">
        <strong>${escapeHtml(g.name)}</strong>
        <span>${g.memberCount.toLocaleString('fr-FR')} membres · ${g.channels} salons</span>
      </div>`;
    item.addEventListener('click', () => openGuild(g.id));
    el.appendChild(item);
  }
}

async function openGuild(id) {
  state.activeGuildId = id;
  state.memberTab = 'channels';
  state.memberQuery = '';
  renderGuildList();
  $('guildDetail').innerHTML = '<p class="empty">Chargement…</p>';
  try {
    state.guildDetail = await api(`/api/guilds/${id}`);
    renderGuildDetail();
  } catch (e) {
    $('guildDetail').innerHTML = `<p class="empty">${escapeHtml(e.message)}</p>`;
  }
}

function renderGuildDetail() {
  const g = state.guildDetail;
  const el = $('guildDetail');
  const icon = g.icon ? `<span class="guild-icon"><img src="${g.icon}" alt="" /></span>` : `<span class="guild-icon">${initials(g.name)}</span>`;
  el.innerHTML = `
    <div class="detail-head">
      ${icon}
      <div>
        <h3>${escapeHtml(g.name)}</h3>
        <span class="hint">🆔 <code>${g.id}</code> · Créé le ${formatDate(g.createdTimestamp)}</span>
      </div>
    </div>
    <div class="mini-stats">
      <div class="mini-stat"><strong>${g.memberCount.toLocaleString('fr-FR')}</strong><span>Membres</span></div>
      <div class="mini-stat"><strong>${g.channels.length}</strong><span>Salons</span></div>
      <div class="mini-stat"><strong>${g.roles.length}</strong><span>Rôles</span></div>
      <div class="mini-stat"><strong>Niv. ${g.boostTier}</strong><span>${g.boosts} boost(s)</span></div>
    </div>
    <div class="subtabs">
      <button class="tab ${state.memberTab === 'channels' ? 'active' : ''}" data-tab="channels">💬 Salons</button>
      <button class="tab ${state.memberTab === 'members' ? 'active' : ''}" data-tab="members">👥 Membres</button>
      <button class="tab ${state.memberTab === 'roles' ? 'active' : ''}" data-tab="roles">🎭 Rôles</button>
      <button class="tab ${state.memberTab === 'bans' ? 'active' : ''}" data-tab="bans">🔨 Bannis</button>
    </div>
    <div id="guildTabContent"></div>`;

  el.querySelectorAll('.subtabs .tab').forEach((b) => {
    b.addEventListener('click', () => {
      state.memberTab = b.dataset.tab;
      renderGuildDetail();
    });
  });

  const content = $('guildTabContent');
  if (state.memberTab === 'channels') renderChannels(content, g);
  else if (state.memberTab === 'members') renderMembers(content, g);
  else if (state.memberTab === 'roles') renderRoles(content, g);
  else if (state.memberTab === 'bans') renderBans(content, g);
}

function renderChannels(content, g) {
  const textChannels = g.channels.filter((c) => c.isText);
  content.innerHTML = `<div class="channel-rows"></div>`;
  const wrap = content.querySelector('.channel-rows');
  if (!textChannels.length) wrap.innerHTML = '<p class="empty">Aucun salon texte.</p>';
  for (const c of textChannels) {
    const row = document.createElement('div');
    row.className = 'channel-row';
    row.innerHTML = `
      <span>${c.isVoice ? '🔊' : '#'}</span>
      <div class="grow"><strong>${escapeHtml(c.name)}</strong><br><small>${c.rateLimit ? `mode lent ${c.rateLimit}s` : 'pas de mode lent'}</small></div>
      <div class="actions">
        <button class="icon-btn" data-act="msg">💬 Message</button>
        <button class="icon-btn" data-act="lock">🔒 Verrou</button>
        <button class="icon-btn" data-act="slow">⏱️ Lent</button>
        <button class="icon-btn danger" data-act="purge">🧹 Purge</button>
      </div>`;
    row.querySelector('[data-act="msg"]').addEventListener('click', () => channelMessage(g, c));
    row.querySelector('[data-act="lock"]').addEventListener('click', () => channelLock(g, c));
    row.querySelector('[data-act="slow"]').addEventListener('click', () => channelSlow(g, c));
    row.querySelector('[data-act="purge"]').addEventListener('click', () => channelPurge(g, c));
    wrap.appendChild(row);
  }
}

function renderRoles(content, g) {
  content.innerHTML = `<div class="chip-list"></div>`;
  const wrap = content.querySelector('.chip-list');
  for (const r of g.roles) {
    const chip = document.createElement('span');
    chip.className = 'chip role';
    chip.style.borderLeftColor = r.color && r.color !== '#000000' ? r.color : '#ff5da2';
    chip.textContent = `${r.name} · ${r.members}`;
    wrap.appendChild(chip);
  }
  if (!g.roles.length) wrap.innerHTML = '<p class="empty">Aucun rôle.</p>';
}

async function renderMembers(content, g) {
  content.innerHTML = `
    <div class="panel-head" style="margin-bottom:12px">
      <input type="search" class="search" id="memberSearch" placeholder="Rechercher un membre…" value="${escapeHtml(state.memberQuery)}" />
      <span class="hint" id="memberCount">…</span>
    </div>
    <div class="member-rows" id="memberRows"><p class="empty">Chargement…</p></div>`;
  const input = $('memberSearch');
  let timer = null;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      state.memberQuery = input.value.trim();
      fetchMembers(g);
    }, 350);
  });
  fetchMembers(g);
}

async function fetchMembers(g) {
  const rows = $('memberRows');
  if (!rows) return;
  rows.innerHTML = '<p class="empty">Chargement…</p>';
  try {
    const data = await api(`/api/guilds/${g.id}/members?q=${encodeURIComponent(state.memberQuery)}`);
    $('memberCount').textContent = `${data.returned} / ${data.total}`;
    rows.innerHTML = '';
    if (!data.members.length) rows.innerHTML = '<p class="empty">Aucun membre trouvé.</p>';
    for (const m of data.members) {
      const row = document.createElement('div');
      row.className = 'row';
      const roleChip = m.highestRole ? `<span class="chip" style="border-left:3px solid ${m.highestRole.color !== '#000000' ? m.highestRole.color : '#ff5da2'};padding:2px 8px;font-size:11px">${escapeHtml(m.highestRole.name)}</span>` : '';
      row.innerHTML = `
        <img class="avatar" src="${m.avatar}" alt="" />
        <div class="grow">
          <strong>${escapeHtml(m.displayName)} ${m.bot ? '🤖' : ''} ${m.timedOutUntil > Date.now() ? '🔇' : ''}</strong>
          <span>${escapeHtml(m.tag)} · <code>${m.id}</code></span>
        </div>
        ${roleChip}
        <div class="actions">
          <button class="icon-btn" data-a="warn">⚠️ Warn</button>
          <button class="icon-btn" data-a="timeout">🔇 Mute</button>
          <button class="icon-btn" data-a="kick">👢 Kick</button>
          <button class="icon-btn danger" data-a="ban">🔨 Ban</button>
        </div>`;
      row.querySelector('[data-a="warn"]').addEventListener('click', () => memberAction(g, m, 'warn'));
      row.querySelector('[data-a="timeout"]').addEventListener('click', () => memberAction(g, m, 'timeout'));
      row.querySelector('[data-a="kick"]').addEventListener('click', () => memberAction(g, m, 'kick'));
      row.querySelector('[data-a="ban"]').addEventListener('click', () => memberAction(g, m, 'ban'));
      rows.appendChild(row);
    }
  } catch (e) {
    rows.innerHTML = `<p class="empty">${escapeHtml(e.message)}</p>`;
  }
}

async function renderBans(content, g) {
  content.innerHTML = `<div class="ban-rows"><p class="empty">Chargement…</p></div>`;
  const wrap = content.querySelector('.ban-rows');
  try {
    const bans = await api(`/api/guilds/${g.id}/bans`);
    wrap.innerHTML = '';
    if (!bans.length) wrap.innerHTML = '<p class="empty">Aucun utilisateur banni.</p>';
    for (const b of bans) {
      const row = document.createElement('div');
      row.className = 'row';
      row.innerHTML = `
        <span class="avatar placeholder">🚫</span>
        <div class="grow"><strong>${escapeHtml(b.tag)}</strong><span><code>${b.id}</code>${b.reason ? ' · ' + escapeHtml(b.reason) : ''}</span></div>
        <div class="actions"><button class="icon-btn" data-a="unban">↩️ Débannir</button></div>`;
      row.querySelector('[data-a="unban"]').addEventListener('click', async () => {
        const ok = await openModal({ title: 'Débannir', desc: `${b.tag} pourra revenir sur le serveur.`, reason: true, confirm: 'Débannir' });
        if (!ok) return;
        try {
          const r = await post(`/api/guilds/${g.id}/members/${b.id}/action`, { action: 'unban', reason: ok.reason });
          toast(r.message);
          renderBans(content, g);
        } catch (e) { toast(e.message, true); }
      });
      wrap.appendChild(row);
    }
  } catch (e) {
    wrap.innerHTML = `<p class="empty">${escapeHtml(e.message)}</p>`;
  }
}

async function memberAction(g, m, action) {
  const titles = { warn: 'Avertir', timeout: 'Rendre muet', kick: 'Expulser', ban: 'Bannir' };
  const ok = await openModal({
    title: `${titles[action]} — ${m.tag}`,
    desc: `Cette action sera appliquée sur **${g.name}** (live).`,
    reason: true,
    duration: action === 'timeout',
    confirm: titles[action],
  });
  if (!ok) return;
  try {
    const r = await post(`/api/guilds/${g.id}/members/${m.id}/action`, {
      action,
      reason: ok.reason,
      duration: ok.duration,
    });
    toast(r.message);
    if (action === 'kick' || action === 'ban') fetchMembers(g);
  } catch (e) {
    toast(e.message, true);
  }
}

async function channelMessage(g, c) {
  const content = await openTextModal({
    title: `Message dans #${c.name}`,
    desc: 'Le message sera envoyé par le bot (live).',
    placeholder: 'Ton message…',
    multiline: true,
    confirm: 'Envoyer',
  });
  if (content == null) return;
  try {
    const r = await post(`/api/guilds/${g.id}/channels/${c.id}/message`, { content });
    toast(r.message);
  } catch (e) { toast(e.message, true); }
}

async function channelLock(g, c) {
  const choice = await openModal({
    title: `Verrouillage #${c.name}`,
    desc: 'Choisis : verrouiller ou déverrouiller le salon.',
    reason: false,
    duration: false,
    confirm: 'Verrouiller',
    extra: [{ value: 'unlock', label: 'Déverrouiller' }],
  });
  if (!choice) return;
  const locked = choice.choice !== 'unlock';
  try {
    const r = await post(`/api/guilds/${g.id}/channels/${c.id}/lock`, { locked });
    toast(r.message);
    openGuild(g.id);
  } catch (e) { toast(e.message, true); }
}

async function channelSlow(g, c) {
  const seconds = await openTextModal({
    title: `Mode lent #${c.name}`,
    desc: 'Secondes entre 0 (désactivé) et 21600.',
    placeholder: '5',
    confirm: 'Appliquer',
  });
  if (seconds == null) return;
  try {
    const r = await post(`/api/guilds/${g.id}/channels/${c.id}/slowmode`, { seconds: parseInt(seconds, 10) });
    toast(r.message);
    openGuild(g.id);
  } catch (e) { toast(e.message, true); }
}

async function channelPurge(g, c) {
  const amount = await openTextModal({
    title: `Purger #${c.name}`,
    desc: 'Nombre de messages à supprimer (1 à 100).',
    placeholder: '10',
    confirm: 'Supprimer',
  });
  if (amount == null) return;
  try {
    const r = await post(`/api/guilds/${g.id}/channels/${c.id}/purge`, { amount: parseInt(amount, 10) });
    toast(r.message);
  } catch (e) { toast(e.message, true); }
}

function openModal(opts) {
  return new Promise((resolve) => {
    const modal = $('modal');
    $('modalTitle').textContent = opts.title || 'Action';
    $('modalDesc').innerHTML = opts.desc || '';
    $('modalReason').value = '';
    $('modalDuration').value = '';
    $('modalDurationWrap').hidden = !opts.duration;
    $('modalReason').placeholder = opts.reasonPlaceholder || 'Raison…';
    const reasonWrap = $('modalReason').parentElement;
    reasonWrap.hidden = opts.reason === false;
    $('modalConfirm').textContent = opts.confirm || 'Confirmer';
    modal.hidden = false;

    const buttons = $('modalCancel').parentElement;
    const existingExtra = buttons.querySelector('.btn.extra');
    if (existingExtra) existingExtra.remove();

    const cleanup = () => { modal.hidden = true; };

    if (opts.extra && opts.extra.length) {
      const extraBtn = document.createElement('button');
      extraBtn.className = 'btn ghost extra';
      extraBtn.textContent = opts.extra[0].label;
      extraBtn.onclick = () => {
        cleanup();
        resolve({ reason: $('modalReason').value.trim(), duration: $('modalDuration').value.trim(), choice: opts.extra[0].value });
      };
      buttons.insertBefore(extraBtn, $('modalConfirm'));
    }

    $('modalConfirm').onclick = () => {
      cleanup();
      resolve({ reason: $('modalReason').value.trim(), duration: $('modalDuration').value.trim() });
    };
    $('modalCancel').onclick = () => { cleanup(); resolve(null); };
    setTimeout(() => ($('modalReason').hidden ? $('modalDuration').focus() : $('modalReason').focus()), 50);
  });
}

function openTextModal(opts) {
  return new Promise((resolve) => {
    const modal = $('modal');
    $('modalTitle').textContent = opts.title || 'Saisie';
    $('modalDesc').innerHTML = opts.desc || '';
    $('modalDurationWrap').hidden = true;
    $('modalReason').parentElement.hidden = false;
    $('modalReason').value = '';
    $('modalReason').placeholder = opts.placeholder || '';
    $('modalConfirm').textContent = opts.confirm || 'Valider';
    modal.hidden = false;
    const extra = $('modalCancel').parentElement.querySelector('.btn.extra');
    if (extra) extra.remove();

    const cleanup = () => { modal.hidden = true; };
    $('modalConfirm').onclick = () => { const v = $('modalReason').value; cleanup(); resolve(v); };
    $('modalCancel').onclick = () => { cleanup(); resolve(null); };
    setTimeout(() => $('modalReason').focus(), 50);
  });
}

function populateExecGuilds() {
  const sel = $('execGuild');
  const current = sel.value;
  sel.innerHTML = '';
  for (const g of state.guilds) {
    const opt = document.createElement('option');
    opt.value = g.id;
    opt.textContent = g.name;
    sel.appendChild(opt);
  }
  if (current && state.guilds.some((g) => g.id === current)) sel.value = current;
  populateExecChannels();
}

async function populateExecChannels() {
  const guildId = $('execGuild').value;
  const sel = $('execChannel');
  sel.innerHTML = '';
  if (!guildId) return;
  try {
    const g = await api(`/api/guilds/${guildId}`);
    for (const c of g.channels.filter((c) => c.isText)) {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `#${c.name}`;
      sel.appendChild(opt);
    }
  } catch (e) { /* ignore */ }
}

async function runExec() {
  const btn = $('execRun');
  const out = $('execOutput');
  const command = $('execCommand').value.trim();
  if (!command) return toast('Écris une commande.', true);
  const mode = document.querySelector('input[name="execMode"]:checked').value;
  btn.disabled = true;
  btn.textContent = '…';
  out.hidden = false;
  out.innerHTML = '<div class="msg-out">Exécution…</div>';
  try {
    const data = await post('/api/exec', {
      guildId: $('execGuild').value,
      channelId: $('execChannel').value,
      command,
      args: $('execArgs').value,
      dryRun: mode === 'dry',
    });
    renderExecOutput(out, data);
  } catch (e) {
    out.innerHTML = `<div class="msg-out error-box"><strong>❌ Erreur</strong><br>${escapeHtml(e.message)}</div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Exécuter';
  }
}

function renderExecOutput(out, data) {
  const parts = [];
  const mode = data.dryRun ? '🧪 Test' : '🔴 Live';
  parts.push(`<div class="msg-out" style="border-left-width:3px"><strong>${mode}</strong> · <code>${escapeHtml(data.command)}</code></div>`);
  if (!data.output || !data.output.length) {
    parts.push('<div class="msg-out">Aucune réponse capturée (action effectuée).</div>');
  } else {
    for (const payload of data.output) {
      let html = '<div class="msg-out">';
      if (payload.content) html += escapeHtml(payload.content);
      for (const embed of payload.embeds || []) {
        html += renderEmbed(embed);
      }
      html += '</div>';
      parts.push(html);
    }
  }
  out.innerHTML = parts.join('');
}

function renderEmbed(embed) {
  const color = embed.color ? `#${Number(embed.color).toString(16).padStart(6, '0')}` : 'var(--pink)';
  let html = `<div class="embed" style="border-left-color:${color}">`;
  if (embed.author && embed.author.name) html += `<small>${escapeHtml(embed.author.name)}</small>`;
  if (embed.title) html += `<h5>${escapeHtml(embed.title)}</h5>`;
  if (embed.description) html += `<div>${escapeHtml(embed.description)}</div>`;
  if (embed.fields && embed.fields.length) {
    html += '<div class="fields">';
    for (const f of embed.fields) {
      html += `<div class="field"><strong>${escapeHtml(f.name)}</strong><span>${escapeHtml(f.value)}</span></div>`;
    }
    html += '</div>';
  }
  if (embed.footer && embed.footer.text) html += `<small>${escapeHtml(embed.footer.text)}</small>`;
  html += '</div>';
  return html;
}

async function loadEconomy() {
  const box = $('ecoTable');
  box.innerHTML = '<p class="empty">Chargement…</p>';
  try {
    const data = await api('/api/economy');
    $('ecoSummary').textContent = `${data.total} compte(s) · ${data.totalCoins.toLocaleString('fr-FR')} pièces`;
    if (!data.rows.length) {
      box.innerHTML = '<p class="empty">Aucune donnée d’économie pour le moment.</p>';
      return;
    }
    const medals = ['🥇', '🥈', '🥉'];
    let html = '<table><thead><tr><th>#</th><th>Utilisateur</th><th>Solde</th></tr></thead><tbody>';
    data.rows.forEach((r, i) => {
      html += `<tr><td class="rank">${medals[i] || i + 1}</td><td><code>${r.id}</code></td><td>${r.balance.toLocaleString('fr-FR')} 💰</td></tr>`;
    });
    html += '</tbody></table>';
    box.innerHTML = html;
  } catch (e) {
    box.innerHTML = `<p class="empty">${escapeHtml(e.message)}</p>`;
  }
}

async function loadWarnings() {
  const box = $('warnList');
  box.innerHTML = '<p class="empty">Chargement…</p>';
  try {
    const data = await api('/api/warnings');
    $('warnSummary').textContent = `${data.users} membre(s) · ${data.total} avertissement(s)`;
    if (!data.rows.length) {
      box.innerHTML = '<p class="empty">Aucun avertissement enregistré. 🎉</p>';
      return;
    }
    box.innerHTML = '';
    for (const u of data.rows) {
      const card = document.createElement('div');
      card.className = 'warn-card';
      let items = '';
      u.items.forEach((w, i) => {
        items += `<div class="warn-item"><strong>#${i + 1}</strong> — ${escapeHtml(w.reason)} <em>(${escapeHtml(w.mod || 'inconnu')}, ${formatDate(w.date)})</em></div>`;
      });
      card.innerHTML = `
        <div class="warn-head">
          <strong><code>${u.id}</code></strong>
          <div class="actions">
            <span class="badge moderation">${u.count} warn(s)</span>
            <button class="icon-btn danger">🗑️ Réinitialiser</button>
          </div>
        </div>
        ${items}`;
      card.querySelector('button').addEventListener('click', async () => {
        try {
          await post(`/api/warnings/${u.id}/reset`, {});
          toast('Avertissements réinitialisés.');
          loadWarnings();
        } catch (e) { toast(e.message, true); }
      });
      box.appendChild(card);
    }
  } catch (e) {
    box.innerHTML = `<p class="empty">${escapeHtml(e.message)}</p>`;
  }
}

function renderFunQuick() {
  const el = $('funQuick');
  const funs = [
    { label: '🎲 roll 100', cmd: 'roll', args: '100' },
    { label: '🎱 8ball', cmd: '8ball', args: 'Est-ce que ça va marcher ?' },
    { label: '🪙 flip', cmd: 'flip', args: '' },
    { label: '✊ rps pierre', cmd: 'rps', args: 'pierre' },
    { label: '😂 blague', cmd: 'blague', args: '' },
    { label: '💬 say', cmd: 'say', args: 'Bonjour depuis le dashboard !' },
  ];
  el.innerHTML = '';
  for (const f of funs) {
    const btn = document.createElement('button');
    btn.className = 'quick-btn';
    btn.innerHTML = `<span></span> ${escapeHtml(f.label)}`;
    btn.addEventListener('click', async () => {
      if (!$('execGuild').value) await populateExecGuilds();
      $('execCommand').value = f.cmd;
      $('execArgs').value = f.args;
      document.querySelector('input[name="execMode"][value="dry"]').checked = true;
      runExec();
    });
    el.appendChild(btn);
  }
}

function init() {
  initTheme();
  initNav();
  renderFunQuick();
  loadStatus();
  loadCommands();
  loadGuilds();

  $('cmdSearch').addEventListener('input', (e) => {
    state.cmdSearch = e.target.value.trim();
    renderCmdCards();
  });
  $('execGuild').addEventListener('change', populateExecChannels);
  $('execRun').addEventListener('click', runExec);
  $('execArgs').addEventListener('keydown', (e) => { if (e.key === 'Enter') runExec(); });
  $('execCommand').addEventListener('keydown', (e) => { if (e.key === 'Enter') runExec(); });

  setInterval(loadStatus, 20000);
}

document.addEventListener('DOMContentLoaded', init);
