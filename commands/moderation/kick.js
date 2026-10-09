const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'kick',
  description: 'Expulse un membre du serveur.',
  usage: '!kick <@membre> [raison]',
  aliases: ['expulser', 'eject'],
  category: 'moderation',
  cooldown: 2,
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
      return message.reply('❌ Tu n’as pas la permission `Expulser des membres`.');
    }
    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    if (!member) return message.reply('❌ Membre introuvable.');
    if (member.id === message.author.id) return message.reply('❌ Tu ne peux pas t’expulser toi-même ! 😅');
    if (!member.kickable) return message.reply('❌ Je ne peux pas expulser ce membre.');

    const reason = args.slice(1).join(' ') || 'Aucune raison fournie';
    await member.kick(reason);

    const embed = new EmbedBuilder()
      .setColor(message.client.config.colors.dark)
      .setTitle('👢 Membre expulsé')
      .setDescription(`**${member.user.tag}** a été expulsé du serveur.`)
      .addFields({ name: 'Raison', value: reason })
      .setFooter({ text: `🚨 Par ${message.author.tag}` });
    await message.channel.send({ embeds: [embed] });
  },
};