const { PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'say',
  description: 'Fait parler le bot (réserver à la modération).',
  usage: '!say <message>',
  aliases: ['dire', 'echo'],
  category: 'fun',
  cooldown: 5,
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return message.reply('❌ Tu n’as pas la permission `Gérer les messages`.');
    }
    const text = args.join(' ');
    if (!text) return message.reply('❌ Écris un message : `!say <message>`');

    await message.delete().catch(() => {});
    await message.channel.send(text);
  },
};