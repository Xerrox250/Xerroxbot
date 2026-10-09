const { EmbedBuilder, ChannelType } = require('discord.js');
const { formatUptime } = require('../../utils/parse');

module.exports = {
  name: 'serverinfo',
  description: 'Montre les informations du serveur.',
  usage: '!serverinfo',
  aliases: ['serveur', 'guildinfo'],
  category: 'utile',
  cooldown: 5,
  async execute(message) {
    const { guild } = message;
    await guild.fetch();
    const members = guild.members.cache;
    const bots = members.filter(m => m.user.bot).size;
    const humans = members.filter(m => !m.user.bot).size;
    const online = members.filter(m => m.presence?.status === 'online').size;

    const embed = new EmbedBuilder()
      .setColor(message.client.config.colors.dark)
      .setAuthor({ name: guild.name, iconURL: guild.iconURL({ dynamic: true }) })
      .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }))
      .addFields(
        { name: '👤 Membre', value: `**${members.size}** au total\n${humans} humains · ${bots} bots`, inline: true },
        { name: '🟢 En ligne', value: `${online} membres`, inline: true },
        { name: '🚀 Boost', value: `Niveau **${guild.premiumTier}**\n${guild.premiumSubscriptionCount || 0} boosts`, inline: true },
        { name: '👑 Propriétaire', value: `<@${guild.ownerId}>`, inline: true },
        { name: '📅 Créé le', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
        { name: '💬 Salons', value: `${guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size} textes · ${guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size} vocaux`, inline: true },
        { name: '🆔 Identifiant', value: `\`${guild.id}\``, inline: true }
      );
    await message.reply({ embeds: [embed] });
  },
};