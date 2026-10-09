const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'unlock',
  description: 'Déverrouille le salon.',
  usage: '!unlock [salon]',
  aliases: ['deverrouiller'],
  category: 'moderation',
  cooldown: 2,
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return message.reply('❌ Tu n’as pas la permission `Gérer les salons`.');
    }
    const channel = message.mentions.channels.first() || message.channel;
    await channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: null });

    const embed = new EmbedBuilder()
      .setColor(message.client.config.colors.dark)
      .setTitle('🔓 Salon déverrouillé')
      .setDescription(`Tout le monde peut écrire dans <#${channel.id}> à nouveau.`);
    await message.channel.send({ embeds: [embed] });
  },
};