const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const TOKEN = process.env.DISCORD_TOKEN;

const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Bot Discord en ligne !'));
app.listen(process.env.PORT || 3000, () => console.log('Serveur Web prêt.'));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.MessageContent,
  ],
});

client.config = config;
client.commands = new Collection();
client.aliases = new Map();
client.cmdList = [];
client.afk = new Map();
client.cooldowns = new Map();

for (const dir of fs.readdirSync(path.join(__dirname, 'commands'))) {
  for (const file of fs.readdirSync(path.join(__dirname, 'commands', dir)).filter(f => f.endsWith('.js'))) {
    const cmd = require(path.join(__dirname, 'commands', dir, file));
    client.commands.set(cmd.name, cmd);
    client.cmdList.push(cmd);
    if (cmd.aliases) for (const a of cmd.aliases) client.aliases.set(a, cmd.name);
  }
}

client.once(Events.ClientReady, () => {
  console.log(`[Bot] Connecté en tant que ${client.user.tag}`);
  console.log(`[Bot] ${client.cmdList.length} commandes chargées`);
  require('./web/server')(client);
});

async function handleAfk(message) {
  if (message.mentions.users.size > 0) {
    for (const user of message.mentions.users.values()) {
      const reason = client.afk.get(user.id);
      if (reason) await message.reply(`💤 **${user.tag}** est AFK : ${reason}`).catch(() => {});
    }
  }
  if (client.afk.has(message.author.id) && !message.content.startsWith(config.prefix)) {
    client.afk.delete(message.author.id);
    await message.reply('👋 Content de te revoir ! Ton AFK est désactivé.').catch(() => {});
  }
}

client.on(Events.MessageCreate, async (message) => {
  if (!message.guild || message.author.bot) return;

  await handleAfk(message);

  if (!message.content.startsWith(config.prefix)) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/);
  const cmdName = args.shift().toLowerCase();
  const cmd = client.commands.get(cmdName) || client.commands.get(client.aliases.get(cmdName));
  if (!cmd) return;

  if (!client.cooldowns.has(cmd.name)) client.cooldowns.set(cmd.name, new Map());
  const now = Date.now();
  const timestamps = client.cooldowns.get(cmd.name);
  const cooldownAmount = (cmd.cooldown || 3) * 1000;
  const ref = message.author.id;

  if (timestamps.has(ref)) {
    const expiration = timestamps.get(ref) + cooldownAmount;
    if (now < expiration) {
      const rest = ((expiration - now) / 1000).toFixed(1);
      return message
        .reply(`⏳ Calme-toi ! Attends **${rest}s** avant de réutiliser \`${config.prefix}${cmd.name}\`.`)
        .catch(() => {});
    }
  }
  timestamps.set(ref, now);
  setTimeout(() => timestamps.delete(ref), cooldownAmount);

  try {
    await cmd.execute(message, args, client);
  } catch (err) {
    console.error(`Erreur sur !${cmd.name}:`, err);
    message.reply('❌ Une erreur est survenue pendant l’exécution de cette commande.').catch(() => {});
  }
});

client.login(config.token).catch((err) => {
  console.error('[Bot] Impossible de se connecter. Vérifie ton token dans config.json !');
  console.error(err.message);
  process.exit(1);
});