const { EmbedBuilder } = require('discord.js');
const { formatUptime } = require('../../utils/parse');

module.exports = {
  name: 'uptime',
  description: 'Depuis combien de temps le bot est allumé.',
  usage: '!uptime',
  aliases: ['temps'],
  category: 'utile',
  cooldown: 5,
  async execute(message, client) {
    const embed = new EmbedBuilder()
      .setColor(client.config.colors.dark)
      .setTitle('⏱️ Uptime')
      .setDescription(`Le bot tourne depuis **${formatUptime(client.uptime)}** (démarré <t:${Math.floor(Date.now() / 1000 - client.uptime / 1000)}:R>).`);
    await message.reply({ embeds: [embed] });
  },
};