const { EmbedBuilder } = require('discord.js');
const { formatUptime } = require('../../utils/parse');

const badgeMap = {
  DiscordEmployee: 'Discord Staff',
  Partner: 'Partenariat',
  Hypesquad: 'HypeSquad',
  HypeSquadOnlineHouse1: 'HS Bravery',
  HypeSquadOnlineHouse2: 'HS Brillance',
  HypeSquadOnlineHouse3: 'HS Balance',
  BugHunterLevel1: 'Chasseur de bugs',
  BugHunterLevel2: 'Chasseur de bugs ⭐',
  VerifiedDeveloper: 'Dev vérifié',
  EarlySupporter: 'Early Supporter',
  ActiveDeveloper: 'Dev actif',
};

module.exports = {
  name: 'userinfo',
  description: 'Montre les informations d’un membre.',
  usage: '!userinfo [@membre]',
  aliases: ['user', 'profil'],
  category: 'utile',
  cooldown: 5,
  async execute(message, args) {
    const member = message.mentions.members.first() || message.member;
    const user = member.user;
    await user.fetch();

    const badges = user.flags ? user.flags.toArray().map(f => badgeMap[f] || f).join(', ') : 'Aucun';

    const embed = new EmbedBuilder()
      .setColor(message.client.config.colors.dark)
      .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL({ dynamic: true }) })
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        {
          name: '👾 Identifiant',
          value: `\`${user.id}\``,
          inline: true,
        },
        {
          name: '📅 Compte créé le',
          value: `<t:${Math.floor(user.createdTimestamp / 1000)}:D>`,
          inline: true,
        },
        {
          name: '📥 Rejoint le serveur',
          value: member.joinedAt ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>` : 'Inconnu',
          inline: true,
        },
        {
          name: '🏅 Badges',
          value: badges,
          inline: true,
        },
        {
          name: '🚀 Bot ?',
          value: user.bot ? 'Oui 🤖' : 'Non 🧑',
          inline: true,
        },
        {
          name: '💤 AFK',
          value: message.client.afk.has(user.id) ? 'Oui' : 'Non',
          inline: true,
        }
      );
    await message.reply({ embeds: [embed] });
  },
};