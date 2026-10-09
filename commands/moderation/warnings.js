const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const warnStore = require('../../utils/warnStore');

module.exports = {
  name: 'warnings',
  description: 'Liste les avertissements d’un membre.',
  usage: '!warnings [@membre]',
  aliases: ['warns', 'avertissements'],
  category: 'moderation',
  cooldown: 3,
  async execute(message, args) {
    const user = message.mentions.users.first() || message.author;
    const warnings = warnStore.list(user.id);

    const embed = new EmbedBuilder()
      .setColor(message.client.config.colors.dark)
      .setTitle(`⚠️ Avertissements de ${user.tag}`);

    if (warnings.length === 0) {
      embed.setDescription('🎉 Aucun avertissement. Bonne conduite !');
    } else {
      embed.setDescription(warnings.length === 1 ? '1 avertissement :' : `${warnings.length} avertissements :`);
      warnings.forEach((w, i) => {
        embed.addFields({
          name: `#${i + 1} — ${new Date(w.date).toLocaleDateString('fr-FR')}`,
          value: `**Raison :** ${w.reason}\n**Par :** ${w.mod}`,
        });
      });
    }
    await message.reply({ embeds: [embed] });
  },
};