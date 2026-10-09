const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/db');

module.exports = {
  name: 'leaderboard',
  description: 'Affiche le classement des plus riches.',
  usage: '!leaderboard',
  aliases: ['classement', 'top', 'lb'],
  category: 'economie',
  cooldown: 5,
  async execute(message, client) {
    const entries = Object.entries(db.all())
      .map(([id, data]) => ({ id, balance: data.balance }))
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 10);

    if (entries.length === 0) {
      return message.reply('📊 Pas encore de classement. Utilise `!daily` pour commencer !');
    }

    const medals = ['🥇', '🥈', '🥉'];
    let description = '';
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const member = await client.users.fetch(entry.id).catch(() => null);
      const tag = member ? member.tag : 'Utilisateur inconnu';
      description += `${medals[i] || `${i + 1}.`} **${tag}** — ${entry.balance} pièces\n`;
    }

    const embed = new EmbedBuilder()
      .setColor(message.client.config.colors.dark)
      .setTitle('🏆 Classement des plus riches')
      .setDescription(description);
    await message.reply({ embeds: [embed] });
  },
};