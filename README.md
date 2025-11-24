# Discord Adventure Bot 🎲🐉

A Discord bot acting as a DnD Dungeon Master using Node.js, TypeScript, discord.js, and Google's Gemini 2.0 Flash Lite API.

## Features

- **Dice Rolling**: `d20` rolls with automatic stat modifiers.
- **AI Narrator**: Gemini 2.0 Flash Lite generates immersive outcomes based on your rolls.
- **Character Stats**: Persistent stats (STR, DEX, CON, INT, WIS, CHA) for each user.
- **Auto-Detection**: The bot infers which stat to use based on your action description.
- **Admin Controls**: Manage rate limits and backups.
- **Rate Limiting**: Prevents spam (5 actions/minute).

## Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/discord-adventure.git
    cd discord-adventure
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment**:
    Copy `.env.example` to `.env` and fill in your keys:
    ```env
    DISCORD_TOKEN=your_bot_token
    DISCORD_CLIENT_ID=your_client_id
    GEMINI_API_KEY=your_gemini_key
    ADMIN_USER_ID=your_discord_id
    ```

4.  **Deploy Commands**:
    Register the slash commands with Discord:
    ```bash
    npm run deploy
    ```

5.  **Run the Bot**:
    ```bash
    npm run build
    npm start
    ```

## Commands

### Player Commands
- `/roll [action] [stat?] [dc?] [advantage?]` - Attempt an action.
  - Example: `/roll action:"I swing my sword at the goblin"`
  - Example: `/roll action:"I sneak past the guard" stat:dex advantage:true`
- `/stats` - View your character sheet.
- `/setstat [stat] [value]` - Update a specific stat (1-30).

### Admin Commands
- `/admin ratelimit view [user]` - Check a user's rate limit status.
- `/admin ratelimit clear [user]` - Reset a user's rate limit.
- `/admin backup trigger` - Manually save a backup of player data.
- `/admin backup list` - List recent backups.

## Configuration Guide

### Finding Your Environment Variables

| Variable | Where to find it |
|----------|------------------|
| `DISCORD_TOKEN` | **Discord Developer Portal** -> Select App -> **Bot** -> Reset Token / Copy Token. |
| `DISCORD_CLIENT_ID` | **Discord Developer Portal** -> Select App -> **General Information** -> Application ID. |
| `GEMINI_API_KEY` | **Google AI Studio** (aistudio.google.com) -> **Get API key** -> Create API key. |
| `ADMIN_USER_ID` | **Discord App** -> Settings -> Advanced -> Enable Developer Mode. Then right-click your profile -> **Copy User ID**. |

### Inviting the Bot

1.  Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2.  Select your application.
3.  Go to **OAuth2** -> **URL Generator**.
4.  Under **Scopes**, check: `bot` and `applications.commands`.
5.  Under **Bot Permissions**, check:
    -   `Send Messages`
    -   `Embed Links`
    -   `Attach Files`
    -   `Use External Emojis` (optional but good for custom UI)
6.  Copy the generated URL at the bottom and paste it into your browser to invite the bot to your server.

## Deployment (Railway)

This project is ready for Railway.app.

### Crucial: Persistent Storage Setup
**If you skip this, all player stats will be lost every time the bot restarts or redeploys.**

1.  In your Railway project, go to the **Settings** tab of your service.
2.  Scroll down to the **Volumes** section.
3.  Click **Add Volume**.
4.  For the **Mount Path**, enter exactly: `/app/data`
5.  Railway will restart your service. Now your `players.json` and backups are safe!

### General Deployment Steps
1.  Connect your GitHub repo to Railway.
2.  Go to the **Variables** tab.
3.  Add all 4 environment variables listed above.
4.  Railway will automatically build and start the bot using the `Procfile`.

## License

MIT
