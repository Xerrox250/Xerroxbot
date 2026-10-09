const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'poll',
  description: 'Crée un sondage avec réactions ✅ / ❌.',
  usage: '!poll <question>',
  aliases: ['sondage', 'vote'],
  category: 'social',
  cooldown: 5,
  async execute(message, args) {
    const question = args.join(' ');
    if (!question) return message.reply('❌ Pose une question : `!poll <question>`');

    await message.delete().catch(() => {});

    const embed = new EmbedBuilder()
      .setColor(message.client.config.colors.dark)
      .setTitle('📊 Sondage')
      .setDescription(question)
      .setFooter({ text: `Proposé par ${message.author.tag}` })
      .setTimestamp();

    const poll = await message.channel.send({ embeds: [embed] });
    await poll.react('✅');
    await poll.react('❌');
  },
};