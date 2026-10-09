const express = require('express');
const path = require('path');
const config = require('../config.json');

const MAGIC_8BALL = [
  'Oui, sans aucun doute ! 🟢',
  'C’est certain ! 🟢',
  'Probablement. 🟢',
  'Demande à nouveau plus tard. 🔮',
  'Je ne suis pas sûr. 🔮',
  'Plutôt non. 🔴',
  'Sources disent non. 🔴',
  'Jamais. 🔴',
];

const EMOTIONS = {
  roll: '🎲',
  '8ball': '🎱',
  flip: '🪙',
  rps: '✊✋✌️',
};

function runFun(command, rawArgs) {
  const args = String(rawArgs || '').trim().split(/\s+/).filter(Boolean);
  switch (command) {
    case 'roll': {
      let max = parseInt(args[0], 10);
      if (!max || max < 2) max = 100;
      if (max > 1000000) max = 1000000;
      return { emoji: EMOTIONS.roll, title: 'Lancer de dé', result: `Tu as obtenu **${Math.floor(Math.random() * max) + 1}** (sur 1-${max.toLocaleString('fr-FR')}).` };
    }
    case '8ball': {
      const question = args.join(' ') || 'Question mystère';
      return { emoji: EMOTIONS['8ball'], title: 'Boule magique', result: `❓ ${question}\n\n✨ **${MAGIC_8BALL[Math.floor(Math.random() * MAGIC_8BALL.length)]}**` };
    }
    case 'flip': {
      const side = Math.random() < 0.5 ? '**Pile** 💀' : '**Face** 🦅';
      return { emoji: EMOTIONS.flip, title: 'Pile ou face', result: `Résultat : ${side}` };
    }
    case 'rps': {
      const choices = { pierre: '🪨', feuille: '📄', ciseaux: '✂️' };
      let user = (args[0] || '').toLowerCase();
      if (!choices[user]) {
        return { error: 'Choisis `pierre`, `feuille` ou `ciseaux`.', emoji: '❌' };
      }
      const keys = Object.keys(choices);
      const bot = keys[Math.floor(Math.random() * 3)];
      const beats = { pierre: 'ciseaux', ciseaux: 'feuille', feuille: 'pierre' };
      let outcome;
      if (user === bot) outcome = 'Égalité ! 🤝';
      else if (beats[user] === bot) outcome = '**Tu gagnes !** 🎉';
      else outcome = 'Le bot gagne ! 🤖';
      return {
        emoji: EMOTIONS.rps,
        title: 'Pierre-Feuille-Ciseaux',
        result: `Toi : ${choices[user]} ${user} — Bot : ${choices[bot]} ${bot}\n\n${outcome}`,
      };
    }
    default:
      return { error: 'Commande inconnue.' };
  }
}

module.exports = function startWeb(client) {
  const app = express();
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.json());

  app.get('/api/status', (req, res) => {
    const guilds = [...client.guilds.cache.values()];
    const members = guilds.reduce((t, g) => t + (g.memberCount || 0), 0);
    const channels = guilds.reduce((t, g) => t + g.channels.cache.size, 0);
    res.json({
      online: client.isReady(),
      name: client.user ? client.user.username : config.botName,
      avatar: client.user ? client.user.displayAvatarURL({ size: 256 }) : '',
      ping: client.ws.ping,
      uptime: client.uptime || 0,
      servers: guilds.length,
      members,
      channels,
      prefix: config.prefix,
      commands: client.cmdList.length,
      color: config.colors.dark,
      startTime: Date.now() - (client.uptime || 0),
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

  app.post('/api/fun', (req, res) => {
    const { command, args } = req.body || {};
    const result = runFun(command, args);
    if (result.error) return res.status(400).json(result);
    res.json(result);
  });

  const port = config.webPort || 3000;
  app.listen(port, () => {
    console.log(`[Web] Dashboard disponible sur http://localhost:${port}`);
  });
};