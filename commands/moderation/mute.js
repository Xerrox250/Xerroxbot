const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { parseDuration } = require('../../utils/parse');

module.exports = {
  name: 'mute',
  description: 'Rend un membre muet temporairement (timeout).',
  usage: '!mute <@membre> <durée ex: 10m, 1h, 2d> [raison]',
  aliases: ['tais'],
  category: 'moderation',
  cooldown: 2,
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return message.reply('❌ Tu n’as pas la permission `Modérer les membres`.');
    }
    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    if (!member) return message.reply('❌ Membre introuvable.');

    const ms = parseDuration(args[1]);
    if (!ms || ms < 60000 || ms > 28 * 86400000) {
      return message.reply('❌ Durée invalide. Format : `10m`, `2h`, `3d`... (entre 1 min et 28 jours).');
    }
    const reason = args.slice(2).join(' ') || 'Aucune raison fournie';

    await member.timeout(ms, reason);

    const embed = new EmbedBuilder()
      .setColor(message.client.config.colors.dark)
      .setTitle('🔇 Membre muté')
      .setDescription(`**${member.user.tag}** est muet jusqu’à <t:${Math.floor(Date.now() / 1000 + ms / 1000)}:R>.`)
      .addFields({ name: 'Raison', value: reason })
      .setFooter({ text: `🚨 Par ${message.author.tag}` });
    await message.channel.send({ embeds: [embed] });
  },
};