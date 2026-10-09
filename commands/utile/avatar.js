const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'avatar',
  description: 'Affiche la photo de profil d’un membre.',
  usage: '!avatar [@membre]',
  aliases: ['pp', 'pfp'],
  category: 'utile',
  cooldown: 5,
  async execute(message, args) {
    const user = message.mentions.users.first() || message.author;
    const embed = new EmbedBuilder()
      .setColor(message.client.config.colors.dark)
      .setTitle(`Avatar de ${user.tag}`)
      .setImage(user.displayAvatarURL({ size: 2048, dynamic: true }))
      .setURL(user.displayAvatarURL({ size: 2048, dynamic: true }))
      .setFooter({ text: `${user.id}` });
    await message.reply({ embeds: [embed] });
  },
};