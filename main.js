import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  REST,
  Routes,
} from 'discord.js';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const {
  DISCORD_TOKEN,
  DONUT_API_KEY,
  API_BASE,
  TRACK_FILE,
  REFRESH_INTERVAL_MINUTES = 0.3,
} = process.env;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REFRESH_INTERVAL_MS = Math.max(
  5000,
  Math.floor(parseFloat(REFRESH_INTERVAL_MINUTES) * 60 * 1000)
);

// Setup del client Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Comandi slash
const commands = [
  {
    name: 'trackplayer',
    description: "Track player's live status and stats",
    options: [
      {
        name: 'username',
        type: 3, // STRING
        description: 'In-game player name',
        required: true,
      },
    ],
  },
  {
    name: 'listtracked',
    description: 'List all tracked players',
  },
  {
    name: 'removetrack',
    description: 'Stop tracking a player',
    options: [
      {
        name: 'username',
        type: 3, // STRING
        description: 'In-game player name to remove',
        required: true,
      },
    ],
  },
];

// Helper functions
const fetchJson = async (method, endpoint, data = null) => {
  const headers = {
    Authorization: `Bearer ${DONUT_API_KEY}`,
    'Content-Type': 'application/json',
    accept: 'application/json',
  };

  const url = `${API_BASE}${endpoint}`;
  const options = {
    method,
    headers,
    body: data ? JSON.stringify(data) : null,
  };

  try {
    const response = await fetch(url, options);
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return { http_status: response.status, error: text };
    }
  } catch (error) {
    return { http_status: 0, error: error.message };
  }
};

const toNumber = (value) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    try {
      return parseFloat(value);
    } catch {
      return 0;
    }
  }
  return 0;
};

const formatThousands = (value) => {
  const n = Math.round(toNumber(value));
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const nowHms = () => {
  return new Date().toLocaleTimeString('it-IT');
};

const loadTracked = async () => {
  try {
    const data = await fs.readFile(TRACK_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
};

const saveTracked = async (data) => {
  await fs.writeFile(TRACK_FILE, JSON.stringify(data, null, 2));
};

// Refresher function
const startRefresher = async (username, msg) => {
  while (true) {
    try {
      const [lookup, stats] = await Promise.all([
        fetchJson('GET', `/lookup/${username}`),
        fetchJson('GET', `/stats/${username}`),
      ]);

      if (stats?.result) {
        let online = false;
        if (lookup?.result) {
          const loc = String(lookup.result.location || 'Offline').trim();
          online = loc.toLowerCase() !== 'offline';
        }

        const s = stats.result;
        const embed = new EmbedBuilder()
          .setTitle(`${online ? '🟢' : '🔴'} Player: ${username}`)
          .setColor(online ? 0x00ff00 : 0xff0000)
          .addFields(
            {
              name: 'Status',
              value: online ? 'ONLINE✔' : 'OFFLINE❌',
              inline: false,
            },
            { name: '💰 Money', value: formatThousands(s.money), inline: true },
            {
              name: '🛒 Shop Spent',
              value: formatThousands(s.money_spent_on_shop),
              inline: true,
            },
            {
              name: '📦 Sell Earnings',
              value: formatThousands(s.money_made_from_sell),
              inline: true,
            },
            {
              name: '🔮 Shards',
              value: formatThousands(s.shards),
              inline: true,
            }
          )
          .setFooter({ text: `Last updated ${nowHms()}` });

        await msg.edit({ embeds: [embed] });
      }
    } catch (error) {
      if (error.code === 10008) {
        // Unknown Message
        const tracked = await loadTracked();
        if (tracked[username]) {
          delete tracked[username];
          await saveTracked(tracked);
        }
        console.log(
          `[${nowHms()}] Message for ${username} not found. Removed from tracked.`
        );
        break;
      } else if (error.code === 50013) {
        // Missing Permissions
        const tracked = await loadTracked();
        if (tracked[username]) {
          delete tracked[username];
          await saveTracked(tracked);
        }
        console.log(
          `[${nowHms()}] Forbidden to edit ${username}'s message. Removed from tracked.`
        );
        break;
      } else {
        console.log(
          `[${nowHms()}] Error updating ${username}: ${error.message}`
        );
      }
    }

    // Wait 15 seconds
    await new Promise((resolve) => setTimeout(resolve, REFRESH_INTERVAL_MS));
  }
};

// Comandi slash
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  try {
    if (interaction.commandName === 'trackplayer') {
      await interaction.deferReply();
      const username = interaction.options.getString('username');

      const [lookup, stats] = await Promise.all([
        fetchJson('GET', `/lookup/${username}`),
        fetchJson('GET', `/stats/${username}`),
      ]);

      if (!stats?.result) {
        await interaction.editReply(
          `❌ API Error: stats not available — ${JSON.stringify(stats)}`
        );
        return;
      }

      let online = false;
      if (lookup?.result) {
        const loc = String(lookup.result.location || 'Offline').trim();
        online = loc.toLowerCase() !== 'offline';
      }

      const s = stats.result;
      const embed = new EmbedBuilder()
        .setTitle(`${online ? '🟢' : '🔴'} Player: ${username}`)
        .setColor(online ? 0x00ff00 : 0xff0000)
        .addFields(
          {
            name: 'Status',
            value: online ? 'ONLINE✔' : 'OFFLINE❌',
            inline: false,
          },
          { name: '💰 Money', value: formatThousands(s.money), inline: true },
          {
            name: '🛒 Shop Spent',
            value: formatThousands(s.money_spent_on_shop),
            inline: true,
          },
          {
            name: '📦 Sell Earnings',
            value: formatThousands(s.money_made_from_sell),
            inline: true,
          },
          { name: '🔮 Shards', value: formatThousands(s.shards), inline: true }
        )
        .setFooter({ text: `Last updated ${nowHms()}` });

      const msg = await interaction.editReply({ embeds: [embed] });

      const tracked = await loadTracked();
      tracked[username] = {
        channel_id: interaction.channelId,
        message_id: msg.id,
      };
      await saveTracked(tracked);

      startRefresher(username, msg);
    } else if (interaction.commandName === 'listtracked') {
      await interaction.deferReply();
      const tracked = await loadTracked();

      if (Object.keys(tracked).length === 0) {
        await interaction.editReply(
          '📭 No players are currently being tracked.'
        );
        return;
      }

      const lines = Object.keys(tracked).map((name) => `• \`${name}\``);
      await interaction.editReply('📋 Tracked players:\n' + lines.join('\n'));
    } else if (interaction.commandName === 'removetrack') {
      await interaction.deferReply();
      const username = interaction.options.getString('username');
      const tracked = await loadTracked();

      if (!tracked[username]) {
        await interaction.editReply(`❌ \`${username}\` is not being tracked.`);
        return;
      }

      delete tracked[username];
      await saveTracked(tracked);
      await interaction.editReply(`✅ Removed tracking for \`${username}\`.`);
    }
  } catch (error) {
    console.error('Error handling command:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply(
        '❌ An error occurred while processing the command.'
      );
    } else {
      await interaction.editReply(
        '❌ An error occurred while processing the command.'
      );
    }
  }
});

// Evento ready
client.once('clientReady', async () => {
  console.log(`✅ Bot ${client.user.tag} avviato con successo`);

  // Registra i comandi slash
  try {
    const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
    console.log('Started refreshing application (/) commands.');
    await rest.put(Routes.applicationCommands(client.user.id), {
      body: commands,
    });
    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Error registering commands:', error);
  }

  // Ripristina i player tracciati
  const tracked = await loadTracked();
  for (const [username, data] of Object.entries(tracked)) {
    try {
      const channel = await client.channels.fetch(data.channel_id);
      const msg = await channel.messages.fetch(data.message_id);
      startRefresher(username, msg);
    } catch (error) {
      console.log(
        `[${nowHms()}] Could not restore tracking for ${username}: ${
          error.message
        }`
      );
      delete tracked[username];
      await saveTracked(tracked);
    }
  }
});

// Gestione errori
client.on('error', (error) => {
  console.error('Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

// Avvia il bot
client.login(DISCORD_TOKEN);
