const express = require('express');
const path = require('path');
const fs = require('fs');
const {
  Client,
  GatewayIntentBits,
  Collection,
  ChannelType,
} = require('discord.js');
const { parseDuration } = require('../utils/parse');

function loadFileConfig() {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config.json'), 'utf8'));
  } catch (e) {
    return {};
  }
}

const fileConfig = loadFileConfig();
const TOKEN = process.env.DISCORD_TOKEN || fileConfig.token;
const PREFIX = process.env.PREFIX || fileConfig.prefix || '!';
const PORT = process.env.DASHBOARD_PORT || 3001;
const COLORS = fileConfig.colors || { dark: '#FF5DA2', light: '#FF5DA2' };

if (!TOKEN) {
  console.error('[Dashboard] Aucun token trouvé. Définis la variable DISCORD_TOKEN ou un config.json avec "token".');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

client.config = {
  token: TOKEN,
  prefix: PREFIX,
  colors: COLORS,
  suggestionChannelId: fileConfig.suggestionChannelId || '',
};
client.commands = new Collection();
client.aliases = new Map();
client.cmdList = [];
client.afk = new Map();
client.cooldowns = new Map();

for (const dir of fs.readdirSync(path.join(__dirname, '..', 'commands'))) {
  const dirPath = path.join(__dirname, '..', 'commands', dir);
  if (!fs.statSync(dirPath).isDirectory()) continue;
  for (const file of fs.readdirSync(dirPath).filter((f) => f.endsWith('.js'))) {
    try {
      const cmd = require(path.join(dirPath, file));
      if (cmd.name) {
        client.commands.set(cmd.name, cmd);
        client.cmdList.push(cmd);
        if (cmd.aliases) for (const a of cmd.aliases) client.aliases.set(a, cmd.name);
      }
    } catch (e) {
      console.error(`[Dashboard] Commande non chargée (${file}): ${e.message}`);
    }
  }
}

function readJson(name, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, '..', name), 'utf8'));
  } catch (e) {
    return fallback;
  }
}

function humanDuration(ms) {
  if (!ms || ms <= 0) return '—';
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

function serializePayload(payload) {
  if (typeof payload === 'string') return { content: payload };
  if (!payload || typeof payload !== 'object') return { content: String(payload || '') };
  const out = { content: payload.content || '' };
  if (payload.embeds && payload.embeds.length) {
    out.embeds = payload.embeds.map((e) => (e && e.toJSON ? e.toJSON() : e && e.data ? e.data : e));
  }
  return out;
}

function guildSummary(g) {
  return {
    id: g.id,
    name: g.name,
    icon: g.iconURL({ size: 128, extension: 'png' }) || '',
    memberCount: g.memberCount || 0,
    ownerId: g.ownerId,
    channels: g.channels.cache.size,
    roles: g.roles.cache.size,
    boostTier: g.premiumTier,
    boosts: g.premiumSubscriptionCount || 0,
    createdTimestamp: g.createdTimestamp,
  };
}

function memberSummary(m) {
  return {
    id: m.id,
    tag: m.user.tag,
    username: m.user.username,
    avatar: m.user.displayAvatarURL({ size: 128, extension: 'png' }),
    bot: m.user.bot,
    joinedTimestamp: m.joinedTimestamp,
    roles: m.roles.cache.filter((r) => r.id !== m.guild.id).map((r) => ({ id: r.id, name: r.name, color: r.hexColor })),
    highestRole: m.roles.highest ? { id: m.roles.highest.id, name: m.roles.highest.name, color: m.roles.highest.hexColor } : null,
    timedOutUntil: m.communicationDisabledUntilTimestamp || 0,
    displayName: m.displayName,
  };
}

function getGuild(req, res) {
  const g = client.guilds.cache.get(req.params.gid);
  if (!g) {
    res.status(404).json({ error: 'Serveur introuvable' });
    return null;
  }
  return g;
}

async function resolveMentions(guild, text) {
  const mentions = {
    users: new Collection(),
    members: new Collection(),
    channels: new Collection(),
    roles: new Collection(),
    everyone: false,
  };
  for (const m of String(text).matchAll(/<@!?(\d+)>/g)) {
    const id = m[1];
    const mem = guild.members.cache.get(id) || (await guild.members.fetch(id).catch(() => null));
    if (mem) {
      mentions.members.set(id, mem);
      mentions.users.set(id, mem.user);
    }
  }
  for (const m of String(text).matchAll(/<#(\d+)>/g)) {
    const ch = guild.channels.cache.get(m[1]);
    if (ch) mentions.channels.set(ch.id, ch);
  }
  for (const m of String(text).matchAll(/<@&(\d+)>/g)) {
    const r = guild.roles.cache.get(m[1]);
    if (r) mentions.roles.set(r.id, r);
  }
  return mentions;
}

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/status', (req, res) => {
  const guilds = [...client.guilds.cache.values()];
  const members = guilds.reduce((t, g) => t + (g.memberCount || 0), 0);
  const channels = guilds.reduce((t, g) => t + g.channels.cache.size, 0);
  res.json({
    online: client.isReady(),
    name: client.user ? client.user.username : 'Bot',
    tag: client.user ? client.user.tag : '—',
    avatar: client.user ? client.user.displayAvatarURL({ size: 256 }) : '',
    ping: Math.round(client.ws.ping),
    uptime: client.uptime || 0,
    uptimeText: humanDuration(client.uptime || 0),
    servers: guilds.length,
    members,
    channels,
    prefix: PREFIX,
    commands: client.cmdList.length,
    color: COLORS.dark,
    botId: client.user ? client.user.id : '',
  });
});

app.get('/api/commands', (req, res) => {
  const categories = {};
  for (const cmd of client.cmdList) {
    (categories[cmd.category] = categories[cmd.category] || []).push({
      name: cmd.name,
      description: cmd.description,
      usage: cmd.usage,
      aliases: cmd.aliases || [],
      cooldown: cmd.cooldown || 3,
    });
  }
  res.json(categories);
});

app.get('/api/guilds', (req, res) => {
  res.json([...client.guilds.cache.values()].map(guildSummary).sort((a, b) => b.memberCount - a.memberCount));
});

app.get('/api/guilds/:gid', (req, res) => {
  const g = getGuild(req, res);
  if (!g) return;
  const channels = [...g.channels.cache.values()]
    .map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      typeLabel: ChannelType[c.type] || String(c.type),
      parentId: c.parentId,
      position: c.rawPosition,
      isText: c.isTextBased ? c.isTextBased() : false,
      isVoice: c.isVoiceBased ? c.isVoiceBased() : false,
      rateLimit: c.rateLimitPerUser || 0,
    }))
    .sort((a, b) => a.position - b.position);
  const roles = [...g.roles.cache.values()]
    .filter((r) => r.id !== g.id)
    .sort((a, b) => b.position - a.position)
    .map((r) => ({ id: r.id, name: r.name, color: r.hexColor, members: r.members.size, position: r.position }));
  res.json({
    ...guildSummary(g),
    ownerTag: g.members.cache.get(g.ownerId)?.user.tag || g.ownerId,
    channels,
    roles,
  });
});

app.get('/api/guilds/:gid/members', async (req, res) => {
  const g = getGuild(req, res);
  if (!g) return;
  const query = (req.query.q || '').trim();
  try {
    let fetched;
    if (query) fetched = await g.members.fetch({ query, limit: 50 });
    else fetched = await g.members.fetch({ limit: 100 });
    const arr = [...fetched.values()].map(memberSummary);
    arr.sort((a, b) => a.tag.localeCompare(b.tag));
    res.json({ total: g.memberCount || arr.length, returned: arr.length, members: arr });
  } catch (e) {
    const arr = [...g.members.cache.values()].slice(0, 100).map(memberSummary);
    res.json({ total: g.memberCount || arr.length, returned: arr.length, members: arr, warning: 'Liste partielle (cache) : ' + e.message });
  }
});

app.get('/api/guilds/:gid/bans', async (req, res) => {
  const g = getGuild(req, res);
  if (!g) return;
  try {
    const bans = await g.bans.fetch();
    res.json([...bans.values()].map((b) => ({ id: b.user.id, tag: b.user.tag, reason: b.reason || '' })));
  } catch (e) {
    res.status(400).json({ error: 'Impossible de récupérer les bannissements : ' + e.message });
  }
});

app.post('/api/guilds/:gid/members/:uid/action', async (req, res) => {
  const g = getGuild(req, res);
  if (!g) return;
  const uid = req.params.uid;
  const { action, reason = 'Action via dashboard', duration = '' } = req.body || {};
  try {
    if (action === 'unban') {
      await g.members.unban(uid, reason);
      return res.json({ ok: true, message: `Utilisateur ${uid} débanni.` });
    }
    const member = g.members.cache.get(uid) || (await g.members.fetch(uid).catch(() => null));
    if (!member) return res.status(404).json({ error: 'Membre introuvable sur ce serveur.' });

    switch (action) {
      case 'kick':
        if (!member.kickable) return res.status(400).json({ error: 'Le bot ne peut pas expulser ce membre.' });
        await member.kick(reason);
        return res.json({ ok: true, message: `${member.user.tag} expulsé.` });
      case 'ban':
        if (!member.bannable) return res.status(400).json({ error: 'Le bot ne peut pas bannir ce membre.' });
        await member.ban({ reason });
        return res.json({ ok: true, message: `${member.user.tag} banni.` });
      case 'timeout': {
        const ms = parseDuration(duration);
        if (!ms || ms < 1000 || ms > 28 * 86400000) return res.status(400).json({ error: 'Durée invalide (ex: 10m, 2h, 3d).' });
        await member.timeout(ms, reason);
        return res.json({ ok: true, message: `${member.user.tag} muté pour ${duration}.` });
      }
      case 'untimeout':
        await member.timeout(null, reason);
        return res.json({ ok: true, message: `Mute retiré à ${member.user.tag}.` });
      case 'warn': {
        const warnStore = require('../utils/warnStore');
        warnStore.add(member.id, reason, 'Dashboard', Date.now());
        return res.json({ ok: true, message: `${member.user.tag} averti.` });
      }
      default:
        return res.status(400).json({ error: 'Action inconnue.' });
    }
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/guilds/:gid/channels/:cid/message', async (req, res) => {
  const g = getGuild(req, res);
  if (!g) return;
  const channel = g.channels.cache.get(req.params.cid);
  if (!channel || !channel.isTextBased || !channel.isTextBased()) {
    return res.status(404).json({ error: 'Salon texte introuvable.' });
  }
  const { content = '', title = '', description = '' } = req.body || {};
  try {
    if (title || description) {
      const { EmbedBuilder } = require('discord.js');
      const embed = new EmbedBuilder().setColor(COLORS.dark);
      if (title) embed.setTitle(title);
      if (description) embed.setDescription(description);
      await channel.send({ content: content || undefined, embeds: [embed] });
    } else {
      if (!content.trim()) return res.status(400).json({ error: 'Message vide.' });
      await channel.send(content);
    }
    res.json({ ok: true, message: `Message envoyé dans #${channel.name}.` });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/guilds/:gid/channels/:cid/lock', async (req, res) => {
  const g = getGuild(req, res);
  if (!g) return;
  const channel = g.channels.cache.get(req.params.cid);
  if (!channel) return res.status(404).json({ error: 'Salon introuvable.' });
  const { locked } = req.body || {};
  try {
    await channel.permissionOverwrites.edit(g.roles.everyone, { SendMessages: locked ? false : null });
    res.json({ ok: true, message: locked ? `#${channel.name} verrouillé.` : `#${channel.name} déverrouillé.` });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/guilds/:gid/channels/:cid/slowmode', async (req, res) => {
  const g = getGuild(req, res);
  if (!g) return;
  const channel = g.channels.cache.get(req.params.cid);
  if (!channel) return res.status(404).json({ error: 'Salon introuvable.' });
  const seconds = parseInt(req.body?.seconds, 10);
  if (isNaN(seconds) || seconds < 0 || seconds > 21600) return res.status(400).json({ error: 'Secondes invalides (0-21600).' });
  try {
    await channel.setRateLimitPerUser(seconds, 'Dashboard');
    res.json({ ok: true, message: seconds ? `Mode lent de #${channel.name} réglé sur ${seconds}s.` : `Mode lent désactivé sur #${channel.name}.` });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/guilds/:gid/channels/:cid/purge', async (req, res) => {
  const g = getGuild(req, res);
  if (!g) return;
  const channel = g.channels.cache.get(req.params.cid);
  if (!channel || !channel.bulkDelete) return res.status(404).json({ error: 'Salon invalide.' });
  const amount = parseInt(req.body?.amount, 10);
  if (!amount || amount < 1 || amount > 100) return res.status(400).json({ error: 'Nombre entre 1 et 100.' });
  try {
    const messages = await channel.messages.fetch({ limit: amount });
    const toDelete = messages.filter((m) => Date.now() - m.createdTimestamp < 14 * 24 * 3600 * 1000);
    await channel.bulkDelete(toDelete);
    res.json({ ok: true, message: `${toDelete.size} message(s) supprimé(s) dans #${channel.name}.` });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/economy', (req, res) => {
  const data = readJson('economy.json', {});
  const rows = Object.entries(data)
    .map(([id, d]) => ({ id, balance: d.balance || 0, lastDaily: d.lastDaily || 0, lastWork: d.lastWork || 0 }))
    .sort((a, b) => b.balance - a.balance);
  res.json({ total: rows.length, totalCoins: rows.reduce((t, r) => t + r.balance, 0), rows: rows.slice(0, 50) });
});

app.get('/api/warnings', (req, res) => {
  const data = readJson('warnings.json', {});
  const list = Object.entries(data)
    .filter(([, arr]) => Array.isArray(arr) && arr.length)
    .map(([id, arr]) => ({ id, count: arr.length, items: arr }))
    .sort((a, b) => b.count - a.count);
  res.json({ users: list.length, total: list.reduce((t, u) => t + u.count, 0), rows: list });
});

app.post('/api/warnings/:uid/reset', (req, res) => {
  const warnStore = require('../utils/warnStore');
  warnStore.reset(req.params.uid);
  res.json({ ok: true });
});

function applyDryRunGuard(captured) {
  const djs = require('discord.js');
  const { GuildMember, GuildMemberManager, PermissionOverwriteManager } = djs;
  const channelClasses = [djs.TextChannel, djs.VoiceChannel, djs.NewsChannel, djs.StageChannel, djs.ThreadChannel, djs.ForumChannel];
  const restored = [];
  const record = (label, target) => {
    const name = target && target.user && target.user.tag
      ? `${target.user.tag} (${target.id})`
      : target && target.name
        ? target.name
        : target && target.id
          ? `${target.id}`
          : '';
    captured.push({ content: `⛔ [mode Test] Action bloquée : ${label} ${name}`.trim() });
    return target;
  };
  const patch = (obj, key, label) => {
    if (!obj || typeof obj[key] !== 'function') return;
    restored.push([obj, key, obj[key]]);
    obj[key] = (target) => Promise.resolve(record(label, target));
  };
patch(GuildMember.prototype, 'kick', 'kick');
  patch(GuildMember.prototype, 'ban', 'ban');
  patch(GuildMember.prototype, 'timeout', 'mute/untimeout');
  patch(GuildMember.prototype, 'send', 'message privé');
  patch(djs.User.prototype, 'send', 'message privé');
  patch(GuildMemberManager.prototype, 'unban', 'unban');
  patch(PermissionOverwriteManager.prototype, 'edit', 'verrouillage de salon');
  for (const c of channelClasses) {
    patch(c && c.prototype, 'bulkDelete', 'suppression de messages');
    patch(c && c.prototype, 'setRateLimitPerUser', 'mode lent');
  }

  const db = require('../utils/db');
  const warnStore = require('../utils/warnStore');
  const origSave = db.save;
  const origWarnAdd = warnStore.add;
  restored.push([db, 'save', origSave]);
  restored.push([warnStore, 'add', origWarnAdd]);
  db.save = () => {
    captured.push({ content: '⛔ [mode Test] Économie non modifiée (sauvegarde bloquée).' });
  };
  warnStore.add = (uid, reason, mod, date) => {
    captured.push({ content: `⛔ [mode Test] Avertissement non enregistré (${uid}).` });
  };

  return () => {
    for (const [obj, key, fn] of restored) obj[key] = fn;
  };
}

app.post('/api/exec', async (req, res) => {
  const { guildId, channelId, command, args = '', dryRun = true } = req.body || {};
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return res.status(404).json({ error: 'Serveur introuvable.' });
  const cmd = client.commands.get(String(command).toLowerCase()) || client.commands.get(client.aliases.get(String(command).toLowerCase()));
  if (!cmd) return res.status(404).json({ error: `Commande inconnue : ${command}` });

  let channel = channelId ? guild.channels.cache.get(channelId) : null;
  if (!channel || (channel.isTextBased && !channel.isTextBased())) {
    channel = guild.channels.cache.find((c) => c.isTextBased && c.isTextBased());
  }
  if (!channel) return res.status(400).json({ error: 'Aucun salon texte disponible.' });

  const botMember = guild.members.me || (await guild.members.fetch(client.user.id).catch(() => null));
  if (!botMember) return res.status(400).json({ error: 'Le bot n’est pas membre de ce serveur.' });

  const argsText = String(args || '').trim();
  const mentions = await resolveMentions(guild, argsText);
  const captured = [];
  const fakeSent = () => ({
    id: 'web-' + Date.now(),
    channel,
    createdTimestamp: Date.now(),
    async edit() { return this; },
    async react() { return this; },
    async delete() { return this; },
    async pin() { return this; },
  });

  const originalSend = channel.send;
  channel.send = async (payload) => {
    captured.push(serializePayload(payload));
    if (dryRun) return fakeSent();
    return originalSend.call(channel, payload);
  };

  const message = {
    id: 'web',
    client,
    guild,
    channel,
    author: client.user,
    member: botMember,
    content: `${PREFIX}${command} ${argsText}`.trim(),
    createdTimestamp: Date.now(),
    mentions,
    async reply(payload) { return channel.send(payload); },
    async send(payload) { return channel.send(payload); },
    async delete() {},
    async react() { return fakeSent(); },
  };

  const restoreGuard = dryRun ? applyDryRunGuard(captured) : null;
  if (dryRun) captured.push({ content: '🧪 Mode Test — aucune action réelle n’est envoyée à Discord.' });

  try {
    const argsArr = argsText ? argsText.split(/\s+/) : [];
    await cmd.execute(message, argsArr, client);
    res.json({ ok: true, command: cmd.name, dryRun: !!dryRun, output: captured });
  } catch (e) {
    res.status(400).json({ error: e.message, output: captured });
  } finally {
    channel.send = originalSend;
    if (restoreGuard) restoreGuard();
  }
});

client.once('ready', () => {
  console.log(`[Dashboard] Connecté en tant que ${client.user.tag}`);
  console.log(`[Dashboard] ${client.cmdList.length} commandes chargées · ${client.guilds.cache.size} serveur(s)`);
  app.listen(PORT, () => {
    console.log(`[Dashboard] Interface disponible sur http://localhost:${PORT}`);
  });
});

client.login(TOKEN).catch(async (err) => {
  console.error('[Dashboard] Connexion impossible. Vérifie le token.');
  console.error(err.message);
  process.exitCode = 1;
  try {
    await client.destroy();
  } catch (e) {
    process.exit(1);
  }
});
