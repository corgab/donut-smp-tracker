# 🎯 Donut SMP Player Tracker

A modern Discord bot for real-time player statistics tracking on the **Donut SMP** server. Monitor online status, money, shards, and more with automatic updates!

---

## ✨ Features

- ✅ **Real-time Tracking**: Monitor players' online/offline status
- 💰 **Economic Stats**: Money, shop spending, and sell earnings
- 🔮 **Shard Monitoring**: Track shard balances
- ⚡ **Auto-Refresh**: Configurable automatic updates (default 15s)
- 📊 **Multiple Players**: Track unlimited players simultaneously
- 🎨 **Beautiful Embeds**: Clean and informative Discord embeds
- 🔧 **Slash Commands**: Modern Discord integration

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Discord Bot Token
- Donut SMP API Key

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/corgab/donut-smp-tracker.git
cd donut-smp-tracker
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

```bash
cp .env.example .env
# Edit .env with your credentials
```

4. **Start the bot**

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

---

## ⚙️ Configuration

Example `.env`:

```env
# Required
DISCORD_TOKEN=your_discord_bot_token_here
DONUT_API_KEY=your_donut_api_key_here

# Optional (defaults)
API_BASE=https://api.donutsmp.net/v1
TRACK_FILE=tracked_players.json
REFRESH_INTERVAL_MINUTES=0.25  # 15 seconds
```

---

## 🎮 Commands

- `/trackplayer <username>` → Start tracking a player's stats with live updates
- `/listtracked` → Show all currently tracked players
- `/removetrack <username>` → Stop tracking a player

---

## 📊 Example Output

_Live-updating embed showing player statistics._

---

## 🏗️ Architecture & Technical Details

- **ES6+ Modern JavaScript**: Async/await, arrow functions, destructuring
- **Discord.js v14**: Full support for the latest Discord API
- **Environment Variables**: Secure configuration management
- **Error Handling**: Robust recovery and logging
- **JSON Storage**: Persistent tracking data

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the project
2. Create your feature branch:

```bash
git checkout -b feature/AmazingFeature
```

3. Commit your changes:

```bash
git commit -m 'Add some AmazingFeature'
```

4. Push to the branch:

```bash
git push origin feature/AmazingFeature
```

5. Open a Pull Request

---

## 📝 License

This project is licensed under the **MIT License** – see the [LICENSE](LICENSE) file for details.

---

## 🛡️ Privacy

The bot only stores:

- Player usernames for tracking
- Discord message IDs for updates

_No personal user data is collected._

---

## ⚠️ Disclaimer

This project is **not affiliated** with Donut SMP or Discord Inc.
Use at your own responsibility.

---

## ❤️ Author

Coded with ❤️ by **[corgab](https://github.com/corgab)**
If you enjoy this project, give it a ⭐ on GitHub!

---

## 📁 Additional File: `.env.example`

```env
# Discord Bot Token - https://discord.com/developers/applications
DISCORD_TOKEN=your_discord_bot_token_here

# Donut SMP API Key
DONUT_API_KEY=your_donut_api_key_here

# API Base URL (do not change unless needed)
API_BASE=https://api.donutsmp.net/v1

# Storage file for tracked players
TRACK_FILE=tracked_players.json

# Refresh interval in minutes (0.25 = 15s)
REFRESH_INTERVAL_MINUTES=0.25
```

---

## 📦 Recommended Package.json Scripts

```json
{
  "scripts": {
    "start": "node index.js",
    "dev": "node --watch index.js",
    "setup": "cp .env.example .env && npm install"
  }
}
```
