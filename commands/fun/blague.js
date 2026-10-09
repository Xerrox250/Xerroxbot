const { EmbedBuilder } = require('discord.js');

const BLAGUES = [
  'Pourquoi les plongeurs plongent-ils toujours en arrière ? Parce que sinon ils tombent dans le bateau.',
  'Qu’est-ce qu’une vache dit à une autre vache ? ... On se voit ?',
  'Pourquoi les programmeurs confondent Halloween et Noël ? Parce que OCT 31 == DEC 25.',
  'Comment appelle-t-on un boomerang qui ne revient pas ? ... Un bâton.',
  'Quelle est la différence entre un canard ? ... Les deux pattes sont pareilles, même celle de gauche.',
  'Pourquoi ne faut-il jamais courir dans une cuisine ? Parce que les œufs s’y brisent.',
  'C’est l’histoire d’un pingouin qui respire par les fesses. Un jour il s’assoit... il meurt.',
  'Que dit un ordinateur à un autre ? ... T’as pensé à moi, j’ai pensé à toi, t’as pensé à moi, j’ai pensé à toi...',
  'Pourquoi le Marabout prenait-il toujours le train ? Parce que la valise était trop lourde.',
  'Que fait une fraise sur un cheval ? Il tag. … (elle fait tagada) 🍓',
];

module.exports = {
  name: 'blague',
  description: 'Le bot raconte une blague.',
  usage: '!blague',
  aliases: ['joke', 'haha'],
  category: 'fun',
  cooldown: 3,
  async execute(message) {
    const joke = BLAGUES[Math.floor(Math.random() * BLAGUES.length)];
    const embed = new EmbedBuilder()
      .setColor(message.client.config.colors.dark)
      .setTitle('😂 Blague du jour')
      .setDescription(joke)
      .setFooter({ text: '🥁 ba dum tss' });
    await message.reply({ embeds: [embed] });
  },
};