const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'help',
  description: 'Affiche la liste de toutes les commandes.',
  usage: '!help [commande]',
  category: 'utile',
  async execute(message, args, client) {
    const prefix = client.config.prefix;

    if (args[0]) {
      const cmdName = args[0].toLowerCase().replace(prefix, '');
      const cmd = client.commands.get(cmdName) || client.commands.get(client.aliases.get(cmdName));
      if (!cmd) {
        return message.reply('❌ Commande inconnue. Fais `!help` pour voir toutes les commandes.');
      }
      const embed = new EmbedBuilder()
        .setColor(client.config.colors.dark)
        .setTitle(`Commande : ${cmd.name}`)
        .setDescription(cmd.description)
        .addFields(
          { name: 'Utilisation', value: `\`${cmd.usage}\`` },
          { name: 'Alias', value: cmd.aliases ? cmd.aliases.map(a => `\`${a}\``).join(' ') : 'Aucun', inline: true },
          { name: 'Catégorie', value: `\`${cmd.category}\``, inline: true },
          { name: 'Cooldown', value: `\`${cmd.cooldown || 3}s\``, inline: true }
        );
      return message.reply({ embeds: [embed] });
    }

    const categories = {};
    for (const cmd of client.cmdList) {
      (categories[cmd.category] = categories[cmd.category] || []).push(cmd);
    }
    const emojis = { utile: '🧰', moderation: '🛡️', fun: '🎉', economie: '💰', social: '👥' };

    const embed = new EmbedBuilder()
      .setColor(client.config.colors.dark)
      .setAuthor({ name: `${client.user.username} — Aide`, iconURL: client.user.displayAvatarURL() })
      .setDescription(
        `Voici toutes mes commandes. Préfixe : \`${prefix}\`\n\nFais ` +
        `\`${prefix}help <commande>\` pour les détails d’une commande.`
      )
      .setFooter({ text: `${client.cmdList.length} commandes disponibles` });

    for (const [cat, cmds] of Object.entries(categories)) {
      const value = cmds
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(c => `\`${prefix}${c.name}\``)
        .join(' ');
      embed.addFields({ name: `${emojis[cat] || '📁'} ${cat.toUpperCase()}`, value: value || '—' });
    }

    await message.reply({ embeds: [embed] });
  },
};