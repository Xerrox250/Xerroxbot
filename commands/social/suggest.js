const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'suggest',
  description: 'Propose une idée au serveur.',
  usage: '!suggest <suggestion>',
  aliases: ['proposition', 'idée'],
  category: 'social',
  cooldown: 10,
  async execute(message, args, client) {
    const suggestion = args.join(' ');
    if (!suggestion) return message.reply('❌ Écris ta suggestion : `!suggest <idée>`');

    const embed = new EmbedBuilder()
      .setColor(client.config.colors.dark)
      .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
      .setTitle('💡 Suggestion')
      .setDescription(suggestion)
      .setFooter({ text: `Salon : ${message.channel.name}` })
      .setTimestamp();

    const channelId = client.config.suggestionChannelId;
    if (channelId) {
      const channel = message.guild.channels.cache.get(channelId);
      if (channel) {
        const sent = await channel.send({ embeds: [embed] });
        await sent.react('👍');
        await sent.react('👎');
        return message.reply('✅ Suggestion envoyée ! Merci pour ta contribution.');
      }
    }

    const sent = await message.reply({ embeds: [embed] });
    await sent.react('👍');
    await sent.react('👎');
  },
};