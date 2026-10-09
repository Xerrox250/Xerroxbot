const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'unban',
  description: 'Débannit un utilisateur.',
  usage: '!unban <ID | tag>',
  aliases: ['deban'],
  category: 'moderation',
  cooldown: 2,
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return message.reply('❌ Tu n’as pas la permission `Bannir des membres`.');
    }
    if (!args[0]) return message.reply('❌ Utilisation : `!unban <ID | tag>`');

    const input = args[0];
    let target;
    try {
      const bans = await message.guild.bans.fetch();
      target = bans.find(b => b.user.id === input || b.user.tag === input);
    } catch (e) {
      return message.reply('❌ Impossible de récupérer la liste des bannissements.');
    }

    if (!target) return message.reply('❌ Aucun utilisateur banni trouvé avec ce critère.');
    await message.guild.members.unban(target.user.id);

    const embed = new EmbedBuilder()
      .setColor(message.client.config.colors.dark)
      .setTitle('✅ Utilisateur débanni')
      .setDescription(`**${target.user.tag}** peut revenir sur le serveur.`)
      .setFooter({ text: `🚨 Par ${message.author.tag}` });
    await message.channel.send({ embeds: [embed] });
  },
};