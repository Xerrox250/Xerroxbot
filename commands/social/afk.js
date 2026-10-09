module.exports = {
  name: 'afk',
  description: 'Active ton mode AFK (notifie ceux qui te mentionnent).',
  usage: '!afk [raison]',
  aliases: ['absent'],
  category: 'social',
  cooldown: 5,
  async execute(message, args, client) {
    const reason = args.join(' ') || 'est actuellement absent(e)';
    client.afk.set(message.author.id, reason);
    await message.reply(`💤 **${message.author.username}** passe AFK : *${reason}*\n(écris à nouveau un message pour le retirer)`);
  },
};