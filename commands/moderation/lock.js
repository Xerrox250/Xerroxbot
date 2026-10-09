const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'lock',
  description: 'Verrouille le salon (personne ne peut plus écrire).',
  usage: '!lock [salon]',
  aliases: ['verrouiller'],
  category: 'moderation',
  cooldown: 2,
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return message.reply('❌ Tu n’as pas la permission `Gérer les salons`.');
    }
    const channel = message.mentions.channels.first() || message.channel;
    await channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });

    const embed = new EmbedBuilder()
      .setColor(message.client.config.colors.dark)
      .setTitle('🔒 Salon verrouillé')
      .setDescription(`Plus personne ne peut écrire dans <#${channel.id}>.`);
    await message.channel.send({ embeds: [embed] });
  },
};