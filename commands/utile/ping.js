const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'ping',
  description: 'Affiche la latence du bot et de l’API Discord.',
  usage: '!ping',
  aliases: ['latence'],
  category: 'utile',
  cooldown: 5,
  async execute(message) {
    const sent = await message.reply({ content: 'Pong ! 🏓' });
    const roundtrip = sent.createdTimestamp - message.createdTimestamp;
    const embed = new EmbedBuilder()
      .setColor(message.client.config.colors.dark)
      .setTitle('🏓 Pong !')
      .addFields(
        { name: 'Latence', value: `\`${roundtrip}ms\``, inline: true },
        { name: 'API Discord', value: `\`${Math.round(message.client.ws.ping)}ms\``, inline: true }
      );
    await sent.edit({ content: null, embeds: [embed] });
  },
};