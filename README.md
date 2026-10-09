# 🌸 Pinky — Bot Discord multi-tâches + Dashboard web

Un bot Discord complet pour un serveur de potes : **34 commandes** (modération, utilité, fun, économie, social) + un **dashboard web** noir/rose basculable en blanc/rose.

---

## 🚀 Installation

### 1. Créer le bot sur le portail Discord
1. Va sur https://discord.com/developers/applications
2. **New Application** → donne-lui un nom → **Create**
3. Onglet **Bot** → **Reset Token** → copie le token
4. Active les **3 intents** (Privileged Gateway Intents) :
   - `PRESENCE INTENT`
   - `SERVER MEMBERS INTENT`
   - `MESSAGE CONTENT INTENT`

### 2. Inviter le bot sur ton serveur
- Rubrique **OAuth2 → URL Generator**
- Coche `bot` puis les permissions : `Administrator` (le plus simple) ou au minimum `Ban members`, `Kick members`, `Manage messages`, `Moderate Members`, `Manage Channels`
- Ouvre l'URL générée et choisis ton serveur

### 3. Configurer le projet
Dans le dossier du projet :

```powershell
npm.cmd install
```

Puis ouvre `config.json` et colle ton token :

```json
{
  "token": "TON-TOKEN-ICI",
  "prefix": "!",
  "botName": "Pinky",
  "suggestionChannelId": "",
  "webPort": 3000,
  "colors": { "dark": "#FF5DA2", "light": "#FF5DA2" }
}
```

> `suggestionChannelId` : optionnel — mets l'ID d'un salon pour que `!suggest` y envoie les propositions.

> Si ta commande `npm` est bloquée par PowerShell, utilise `npm.cmd install` (le `.ps1` est parfois bloqué par la politique d'exécution).

### 4. Lancer

```powershell
npm.cmd start
```

Le bot se connecte et le dashboard est disponible sur **http://localhost:3000**.

> ⚠️ Le dashboard fonctionne seulement si le bot tourne.

---

## ✨ Commandes

### 🛡️ Modération
| Commande | Description |
|---|---|
| `!kick @membre [raison]` | Expulse un membre |
| `!ban @membre [raison]` | Bannit un membre |
| `!unban <ID/tag>` | Débannit un utilisateur |
| `!clear <2-100>` | Supprime des messages |
| `!mute @membre <durée> [raison]` | Timeout (10m, 2h, 3d…) |
| `!unmute @membre` | Retire le timeout |
| `!warn @membre [raison]` | Avertissement |
| `!warnings [@membre]` | Liste des avertissements |
| `!lock` / `!unlock` | Verrouille / déverrouille le salon |
| `!slowmode <secondes>` | Mode lent du salon |

### 🧰 Utile
`!help [commande]` · `!ping` · `!avatar [@membre]` · `!banner [@membre]` · `!userinfo [@membre]` · `!serverinfo` · `!botinfo` · `!uptime`

### 🎉 Fun
`!8ball <question>` · `!roll [max]` · `!flip` · `!rps <pierre|feuille|ciseaux>` · `!blague` · `!say <message>` (modération)

### 💰 Économie
`!balance` · `!daily` (500 pièces/jour) · `!work` · `!gamble <mise>` · `!transfer @membre <montant>` · `!leaderboard`

### 👥 Social
`!afk [raison]` · `!poll <question>` · `!suggest <idée>` · `!remindme <durée> <message>`

---

## 🎛️ Dashboard web

- **Thèmes** : bouton en haut à droite pour passer du mode **noir/rose 🌑** au mode **blanc/rose ☀️** (mémorisé dans le navigateur)
- **Stats** : serveurs, membres, latence, uptime
- **Explorateur de commandes** : onglets par catégorie + recherche
- **Console fun** : teste `roll`, `8ball`, `flip`, `rps` directement depuis la page

API disponible : `GET /api/status`, `GET /api/commands`, `POST /api/fun`.

---

## 📁 Structure

```
discord-bot/
├── index.js              ← cœur du bot
├── config.json           ← token, préfixe, port
├── commands/             ← toutes les commandes (par catégorie)
├── web/
│   ├── server.js         ← serveur Express + API
│   └── public/           ← dashboard (HTML/CSS/JS)
└── utils/                ← base de données éco, warnings, parseurs
```

Les données (économie, avertissements) sont sauvegardées dans des fichiers JSON locaux.

---

Fait avec 💗 — bonne modération !