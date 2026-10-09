const { EmbedBuilder } = require('discord.js');

const CHOIX = {
  pierre: '🪨',
  feuille: '📄',
  ciseaux: '✂️',
};

module.exports = {
  name: 'rps',
  description: 'Joue à Pierre-Feuille-Ciseaux contre le bot.',
  usage: '!rps <pierre|feuille|ciseaux>',
  aliases: ['pfc', 'shifumi', 'pierre', 'chifoumi'],
  category: 'fun',
  cooldown: 3,
  async execute(message, args) {
    const userChoice = (args[0] || '').toLowerCase();
    if (!CHOIX[userChoice]) {
      return message.reply('❌ Choisis `pierre`, `feuille` ou `ciseaux`.');
    }

    const keys = Object.keys(CHOIX);
    const botChoice = keys[Math.floor(Math.random() * 3)];

    const beats = { pierre: 'ciseaux', ciseaux: 'feuille', feuille: 'pierre' };
    let result;
    if (userChoice === botChoice) result = 'Égalité ! 🤝';
    else if (beats[userChoice] === botChoice) result = `${message.author.username} gagne ! 🎉`;
    else result = 'Le bot gagne ! 🤖';

    const embed = new EmbedBuilder()
      .setColor(message.client.config.colors.dark)
      .setTitle('✊✋✌️ Pierre-Feuille-Ciseaux')
      .addFields(
        { name: '🧑 Toi', value: `${CHOIX[userChoice]} ${userChoice}`, inline: true },
        { name: '🤖 Bot', value: `${CHOIX[botChoice]} ${botChoice}`, inline: true },
        { name: 'Résultat', value: result }
      );
    await message.reply({ embeds: [embed] });
  },
};