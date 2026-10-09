const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'slowmode',
  description: 'Active un mode lent sur le salon.',
  usage: '!slowmode <secondes>',
  aliases: ['mod-lent'],
  category: 'moderation',
  cooldown: 2,
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return message.reply('❌ Tu n’as pas la permission `Gérer les salons`.');
    }
    const seconds = parseInt(args[0], 10);
    if (isNaN(seconds) || seconds < 0 || seconds > 21600) {
      return message.reply('❌ Choisis un nombre de secondes entre **0** et **21600** (0 désactive).');
    }
    await message.channel.setRateLimitPerUser(seconds, `Slowmode modifié par ${message.author.tag}`);

    const embed = new EmbedBuilder()
      .setColor(message.client.config.colors.dark)
      .setTitle(seconds === 0 ? '⏱️ Mode lent désactivé' : `⏱️ Mode lent : ${seconds}s`)
      .setDescription(seconds === 0
        ? 'Les membres peuvent écrire sans limite.'
        : 'Chaque membre doit attendre avant d’écrire à nouveau.');
    await message.reply({ embeds: [embed] });
  },
};