const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'roll',
  description: 'Lance un dé (par défaut 1-100, ou 1 à ton choix).',
  usage: '!roll [max]',
  aliases: ['dé', 'lance', 'random'],
  category: 'fun',
  cooldown: 3,
  async execute(message, args) {
    let max = parseInt(args[0], 10);
    if (!max || max < 2) max = 100;
    if (max > 1_000_000) max = 1_000_000;

    const result = Math.floor(Math.random() * max) + 1;
    const user = message.mentions.users.first() || message.author;

    const embed = new EmbedBuilder()
      .setColor(message.client.config.colors.dark)
      .setTitle('🎲 Dé lancé !')
      .setDescription(`**${user.tag}** a obtenu **${result}** (sur 1-${max.toLocaleString('fr-FR')}).`);
    await message.channel.send({ embeds: [embed] });
  },
};