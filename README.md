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

## Deployment (Railway)

This project is ready for Railway.app.

1.  Connect your GitHub repo to Railway.
2.  Set the environment variables in Railway.
3.  Add a **Volume** mounted at `/app/data` to persist player data.
4.  Railway will automatically build and start the bot using the `Procfile`.

## License

MIT
