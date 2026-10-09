const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'unmute',
  description: 'Retire le mute d’un membre.',
  usage: '!unmute <@membre>',
  aliases: ['parle'],
  category: 'moderation',
  cooldown: 2,
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return message.reply('❌ Tu n’as pas la permission `Modérer les membres`.');
    }
    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    if (!member) return message.reply('❌ Membre introuvable.');

    await member.timeout(null, `Unmute par ${message.author.tag}`);

    const embed = new EmbedBuilder()
      .setColor(message.client.config.colors.dark)
      .setTitle('🔊 Mute retiré')
      .setDescription(`**${member.user.tag}** peut reparler maintenant.`)
      .setFooter({ text: `🚨 Par ${message.author.tag}` });
    await message.channel.send({ embeds: [embed] });
  },
};