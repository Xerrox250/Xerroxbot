const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/db');

const REWARD = 500;

module.exports = {
  name: 'daily',
  description: 'Récupère ta récompense quotidienne.',
  usage: '!daily',
  aliases: ['quotidien', 'bonus'],
  category: 'economie',
  cooldown: 3,
  async execute(message) {
    const data = db.get(message.author.id);
    const now = Date.now();

    if (now - data.lastDaily < 86400000) {
      const next = Math.ceil((86400000 - (now - data.lastDaily)) / 3600000);
      return message.reply(`⏳ Tu as déjà récupéré ta récompense aujourd’hui. Reviens dans **${next}h**.`);
    }

    data.balance += REWARD;
    data.lastDaily = now;
    db.save();

    const embed = new EmbedBuilder()
      .setColor(message.client.config.colors.dark)
      .setTitle('📅 Récompense quotidienne')
      .setDescription(`Tu as reçu **${REWARD} pièces** ! Nouveau solde : **${data.balance} pièces**.`)
      .setFooter({ text: 'Reviens demain pour recommencer !' });
    await message.reply({ embeds: [embed] });
  },
};