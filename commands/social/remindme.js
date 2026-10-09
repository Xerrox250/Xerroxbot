const { parseDuration } = require('../../utils/parse');

module.exports = {
  name: 'remindme',
  description: 'Le bot te rappelle quelque chose en MP.',
  usage: '!remindme <durée ex: 1m, 2h> <message>',
  aliases: ['rappel', 'reminder'],
  category: 'social',
  cooldown: 10,
  async execute(message, args) {
    const ms = parseDuration(args[0]);
    if (!ms || ms < 60000) {
      return message.reply('❌ Durée invalide. Minimum **1 minute**. Format : `!remindme 30m Prendre l’apéro`');
    }
    const text = args.slice(1).join(' ');
    if (!text) return message.reply('❌ Écris le message à te rappeler.');

    await message.reply(`⏰ C’est noté ! Je te rappelerai dans **${args[0]}** : *${text}*`);

    setTimeout(async () => {
      await message.author.send(`⏰ **Rappel** : ${text}`).catch(() => {});
    }, ms);
  },
};