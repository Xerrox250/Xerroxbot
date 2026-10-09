const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const warnStore = require('../../utils/warnStore');

module.exports = {
  name: 'warn',
  description: 'Donne un avertissement à un membre.',
  usage: '!warn <@membre> [raison]',
  aliases: ['avertir'],
  category: 'moderation',
  cooldown: 2,
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return message.reply('❌ Tu n’as pas la permission `Modérer les membres`.');
    }
    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    if (!member) return message.reply('❌ Membre introuvable.');

    const reason = args.slice(1).join(' ') || 'Aucune raison fournie';
    warnStore.add(member.id, reason, message.author.tag, Date.now());

    await member.send(`⚠️ Tu as reçu un avertissement sur **${message.guild.name}** : *${reason}*`).catch(() => {});

    const embed = new EmbedBuilder()
      .setColor(message.client.config.colors.dark)
      .setTitle('⚠️ Avertissement')
      .setDescription(`**${member.user.tag}** a été averti.`)
      .addFields(
        { name: 'Raison', value: reason },
        { name: 'Total', value: `${warnStore.list(member.id).length} avertissement(s)` }
      )
      .setFooter({ text: `🚨 Par ${message.author.tag}` });
    await message.channel.send({ embeds: [embed] });
  },
};