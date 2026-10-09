const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/db');

module.exports = {
  name: 'balance',
  description: 'Affiche ton solde de pièces.',
  usage: '!balance [@membre]',
  aliases: ['solde', 'coins', 'wallet', 'argent'],
  category: 'economie',
  cooldown: 3,
  async execute(message, args) {
    const member = message.mentions.members.first() || message.member;
    const data = db.get(member.id);

    const embed = new EmbedBuilder()
      .setColor(message.client.config.colors.dark)
      .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
      .setDescription(`💰 **Balance :** ${data.balance} pièces`);
    await message.reply({ embeds: [embed] });
  },
};