const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/db');

const COOLDOWN = 3600000;

module.exports = {
  name: 'work',
  description: 'Travaille pour gagner des pièces.',
  usage: '!work',
  aliases: ['travail', 'boulot'],
  category: 'economie',
  cooldown: 3,
  async execute(message) {
    const data = db.get(message.author.id);
    const now = Date.now();

    if (now - data.lastWork < COOLDOWN) {
      const rest = Math.ceil((COOLDOWN - (now - data.lastWork)) / 60000);
      return message.reply(`😴 Tu es fatigué... Repose-toi **${rest}min** avant de retravailler.`);
    }

    const gains = Math.floor(Math.random() * 150) + 50;
    data.balance += gains;
    data.lastWork = now;
    db.save();

    const taches = [
      'Tu as livré des colis 🚚',
      'Tu as encadré des devoirs de CM1 📚',
      'Tu as manucuré un pouf 🐈',
      'Tu as fait du babysitting 👶',
      'Tu as arrosé les plantes d’un patron 🌱',
      'Tu as stream séché 🌙',
      'Tu as fait le DJ au mariage 🎧',
      'Tu as promené 12 chiens 🐕',
    ];
    const tache = taches[Math.floor(Math.random() * taches.length)];

    const embed = new EmbedBuilder()
      .setColor(message.client.config.colors.dark)
      .setTitle('💼 Travail terminé !')
      .setDescription(`${tache}.\n\nTu as gagné **${gains} pièces** ! Solde : **${data.balance} pièces**.`);
    await message.reply({ embeds: [embed] });
  },
};