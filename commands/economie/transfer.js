const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/db');

module.exports = {
  name: 'transfer',
  description: 'Envoie des pièces à un membre.',
  usage: '!transfer <@membre> <montant>',
  aliases: ['pay', 'donner', 'envoyer'],
  category: 'economie',
  cooldown: 5,
  async execute(message, args) {
    const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    const amount = parseInt(args[1], 10);
    if (!target || !amount || amount < 1) {
      return message.reply('❌ Utilisation : `!transfer <@membre> <montant>`');
    }
    if (target.id === message.author.id) return message.reply('❌ Tu ne peux pas te transférer à toi-même.');

    const data = db.get(message.author.id);
    if (amount > data.balance) return message.reply(`❌ Tu n’as que **${data.balance} pièces**.`);

    data.balance -= amount;
    db.get(target.id).balance += amount;
    db.save();

    const embed = new EmbedBuilder()
      .setColor(message.client.config.colors.dark)
      .setTitle('💸 Transfert effectué')
      .setDescription(`**${message.author.username}** a envoyé **${amount} pièces** à **${target.user.username}**.`)
      .addFields(
        { name: 'Ton solde', value: `${data.balance} pièces`, inline: true },
        { name: 'Son solde', value: `${db.get(target.id).balance} pièces`, inline: true }
      );
    await message.reply({ embeds: [embed] });
  },
};