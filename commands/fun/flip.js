const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'flip',
  description: 'Lance une pièce : pile ou face.',
  usage: '!flip',
  aliases: ['piece', 'coin', 'coinflip'],
  category: 'fun',
  cooldown: 3,
  async execute(message) {
    const result = Math.random() < 0.5 ? 'Pile 💀' : 'Face 🦅';
    const embed = new EmbedBuilder()
      .setColor(message.client.config.colors.dark)
      .setTitle('🪙 Pile ou face')
      .setDescription(`**${message.author.username}** a obtenu : **${result}**`);
    await message.reply({ embeds: [embed] });
  },
};