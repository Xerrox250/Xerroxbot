const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/db');

module.exports = {
  name: 'gamble',
  description: 'Parie des pièces : 50% de chance de doubler ta mise.',
  usage: '!gamble <montant>',
  aliases: ['parier', 'bet', 'coinflip-cash'],
  category: 'economie',
  cooldown: 3,
  async execute(message, args) {
    const data = db.get(message.author.id);
    const bet = parseInt(args[0], 10);
    if (!bet || bet < 10) return message.reply('❌ Mise minimale : **10 pièces**.');
    if (bet > data.balance) return message.reply(`❌ Tu n’as que **${data.balance} pièces**.`);

    const win = Math.random() < 0.5;
    if (win) {
      data.balance += bet;
      db.save();
      const embed = new EmbedBuilder()
        .setColor(message.client.config.colors.dark)
        .setTitle('🎰 Tu as gagné !')
        .setDescription(`Tu as doublé ta mise de **${bet} pièces** ! 🎉\n\nSolde : **${data.balance} pièces**.`);
      return message.reply({ embeds: [embed] });
    }

    data.balance -= bet;
    db.save();
    const embed = new EmbedBuilder()
      .setColor(message.client.config.colors.dark)
      .setTitle('💸 Tu as perdu...')
      .setDescription(`Tu as perdu **${bet} pièces**.\n\nSolde : **${data.balance} pièces**.`);
    await message.reply({ embeds: [embed] });
  },
};