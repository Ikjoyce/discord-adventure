# Discord Adventure Bot 🎲🐉

A Discord bot acting as a DnD Dungeon Master using Node.js, TypeScript, discord.js, and Google's Gemini 2.0 Flash Lite API.

## Features

- **Dice Rolling**: `d20` rolls with automatic stat modifiers and advantage/disadvantage.
- **AI Narrator**: Gemini 2.5 Flash Lite generates immersive outcomes based on your rolls.
- **Character Stats**: Persistent stats (STR, DEX, CON, INT, WIS, CHA) for each user.
- **Smart Stat Detection**: The bot automatically infers which stat to use based on your action description.
- **Interactive Scenarios**: DM-generated adventure scenarios that players can respond to with rolls.
- **Critical Roll Celebrations**: Automatic GIFs and special emojis for natural 20s and 1s.
- **Session History**: The AI remembers recent actions to create a cohesive narrative.
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
- `/roll [action] [stat?] [dc?] [advantage?] [disadvantage?]` - Attempt an action with a d20 roll.
  - Example: `/roll action:"I swing my sword at the goblin"`
  - Example: `/roll action:"I sneak past the guard" stat:dex advantage:true`
  - Example: `/roll action:"I climb the wall" dc:15`
- `/stats` - View your character sheet.
- `/setstat [stat] [value]` - Update a specific stat (1-30).
- `/scenario start [theme?]` - Generate a new AI-created adventure scenario.
  - Example: `/scenario start theme:"haunted mansion"`
  - Example: `/scenario start` (generates a random scenario)
- `/scenario view` - View the current active scenario in the channel.
- `/scenario end` - End the current scenario.

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
3.  **Important:** Go to **Bot** tab and scroll down to **Privileged Gateway Intents**. Enable **Message Content Intent**. (Required for the bot to function correctly).
4.  Go to **OAuth2** -> **URL Generator**.
5.  Under **Scopes**, check: `bot` and `applications.commands`.
6.  Under **Bot Permissions**, check:
    -   `Send Messages`
    -   `Embed Links`
    -   `View Channels`
7.  Copy the generated URL at the bottom and paste it into your browser to invite the bot to your server.

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

## How to Play

### Basic Gameplay
1. Use `/roll action:"description"` to attempt any action
2. The bot detects which stat applies (STR, DEX, CON, INT, WIS, CHA) or you can specify manually
3. View your character stats with `/stats` and adjust them with `/setstat`

### Scenario Mode
1. Start a scenario: `/scenario start theme:"dungeon exploration"`
2. The AI generates a scene with suggested actions
3. Players use `/roll` commands to respond - the AI remembers the scenario context
4. Use `/scenario view` anytime to see the current scene
5. End with `/scenario end` when done

### Special Features
- **Critical Success (Natural 20)**: Automatic celebration GIF + :partywizard: emoji
- **Critical Failure (Natural 1)**: Automatic failure GIF
- **Advantage/Disadvantage**: Roll twice, take higher/lower
- **Session Memory**: The AI remembers recent rolls in each channel for continuity

## License

MIT
