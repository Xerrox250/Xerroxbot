const { EmbedBuilder } = require('discord.js');

const REPONSES = [
  'Oui, sans aucun doute. 🟢',
  'C’est certain ! 🟢',
  'Probablement. 🟢',
  'Plutôt oui. 🟢',
  'Demande à nouveau... 🔮',
  'Peut-être bien. 🔮',
  'Je ne suis pas sûr. 🔮',
  'Plutôt non. 🔴',
  'Ne compte pas là-dessus. 🔴',
  'Sources disent non. 🔴',
  'Hmm... peu probable. 🔴',
  'Jamais. 🔴',
];

module.exports = {
  name: '8ball',
  description: 'La boule magique répond à ta question.',
  usage: '!8ball <question>',
  aliases: ['boule', 'magic'],
  category: 'fun',
  cooldown: 5,
  async execute(message, args) {
    const question = args.join(' ');
    if (!question) return message.reply('❌ Pose une question : `!8ball <question>`');

    const embed = new EmbedBuilder()
      .setColor(message.client.config.colors.dark)
      .setTitle('🎱 Boule magique')
      .addFields(
        { name: '❓ Question', value: question },
        { name: '✨ Réponse', value: REPONSES[Math.floor(Math.random() * REPONSES.length)] }
      );
    await message.reply({ embeds: [embed] });
  },
};