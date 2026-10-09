const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'ban',
  description: 'Bannit un membre du serveur.',
  usage: '!ban <@membre> [raison]',
  aliases: ['bannir'],
  category: 'moderation',
  cooldown: 2,
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return message.reply('❌ Tu n’as pas la permission `Bannir des membres`.');
    }
    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    if (!member) return message.reply('❌ Membre introuvable (il doit être sur le serveur).');
    if (member.id === message.author.id) return message.reply('❌ Tu ne peux pas te bannir toi-même ! 😅');
    if (!member.bannable) return message.reply('❌ Je ne peux pas bannir ce membre.');

    const reason = args.slice(1).join(' ') || 'Aucune raison fournie';
    await member.ban({ reason });

    const embed = new EmbedBuilder()
      .setColor(message.client.config.colors.dark)
      .setTitle('🔨 Membre banni')
      .setDescription(`**${member.user.tag}** a été banni du serveur.`)
      .addFields({ name: 'Raison', value: reason })
      .setFooter({ text: `🚨 Par ${message.author.tag}` });
    await message.channel.send({ embeds: [embed] });
  },
};