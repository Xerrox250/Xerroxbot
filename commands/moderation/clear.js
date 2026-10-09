const { PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'clear',
  description: 'Supprime un certain nombre de messages.',
  usage: '!clear <2-100>',
  aliases: ['purge', 'clean', 'suppr'],
  category: 'moderation',
  cooldown: 2,
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return message.reply('❌ Tu n’as pas la permission `Gérer les messages`.');
    }
    const amount = parseInt(args[0], 10);
    if (!amount || amount < 1 || amount > 100) {
      return message.reply('❌ Choisis un nombre entre **2** et **100**.');
    }

    const messages = await message.channel.messages.fetch({ limit: Math.min(amount + 1, 100) });
    const toDelete = messages.filter(m => Date.now() - m.createdTimestamp < 14 * 24 * 3600 * 1000);
    await message.channel.bulkDelete(toDelete);

    const confirm = await message.channel.send(`🧹 \`${toDelete.size}\` message(s) supprimé(s).`);
    setTimeout(() => confirm.delete().catch(() => {}), 3000);
  },
};