const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'banner',
  description: 'Affiche la bannière d’un membre.',
  usage: '!banner [@membre]',
  aliases: ['banniere'],
  category: 'utile',
  cooldown: 5,
  async execute(message, args) {
    const user = message.mentions.users.first() || message.author;
    await user.fetch();
    const banner = user.bannerURL({ size: 2048, dynamic: true });
    if (!banner) {
      return message.reply(`🖼️ **${user.tag}** n’a pas de bannière.`);
    }
    const embed = new EmbedBuilder()
      .setColor(message.client.config.colors.dark)
      .setTitle(`Bannière de ${user.tag}`)
      .setImage(banner);
    await message.reply({ embeds: [embed] });
  },
};