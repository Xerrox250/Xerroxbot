const { EmbedBuilder } = require('discord.js');
const { formatUptime } = require('../../utils/parse');

module.exports = {
  name: 'botinfo',
  description: 'Affiche les informations du bot.',
  usage: '!botinfo',
  aliases: ['infos', 'stats'],
  category: 'utile',
  cooldown: 5,
  async execute(message, client) {
    const servers = client.guilds.cache.size;
    const members = [...client.guilds.cache.values()].reduce((t, g) => t + (g.memberCount || 0), 0);
    const channels = [...client.guilds.cache.values()].reduce((t, g) => t + g.channels.cache.size, 0);

    const embed = new EmbedBuilder()
      .setColor(client.config.colors.dark)
      .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL() })
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: '🖥️ Serveurs', value: `\`${servers}\``, inline: true },
        { name: '👥 Membres', value: `\`${members}\``, inline: true },
        { name: '📚 Salons', value: `\`${channels}\``, inline: true },
        { name: '⏱️ Uptime', value: `\`${formatUptime(client.uptime)}\``, inline: true },
        { name: '🏓 Ping', value: `\`${Math.round(client.ws.ping)}ms\``, inline: true },
        { name: '⚙️ Commandes', value: `\`${client.cmdList.length}\``, inline: true },
        { name: '🔧 Version', value: `\`Node ${process.version}\``, inline: true },
        { name: '📦 Discord.js', value: `\`v${require('discord.js').version}\``, inline: true }
      )
      .setFooter({ text: `Prefix : ${client.config.prefix}` });
    await message.reply({ embeds: [embed] });
  },
};