# Discord DnD Bot - Project Plan

## Project Overview

A Discord bot acting as a DnD Dungeon Master using Node.js, TypeScript, discord.js, and Google's Gemini 2.0 Flash Lite API. Players roll dice with action descriptions, the bot auto-detects and applies stored character stats (with button-based override UI and advantage/disadvantage mechanics), determines success/failure using DnD 5e rules with natural 20/1 critical mechanics against configurable DCs, generates AI narrative responses with rich embed formatting, implements per-user rate limiting, and includes admin controls for bot owner. Hosted on Railway.app for 24/7 availability.

---

## Core Features

### Player Features
- **Dice Rolling System**: Support for d4, d6, d8, d10, d12, d20, d100
- **Character Stats**: STR, DEX, CON, INT, WIS, CHA with automatic modifier calculation
- **Intelligent Stat Detection**: Auto-detect relevant stat based on action keywords
- **Stat Override UI**: Interactive button interface to manually select stat
- **Advantage/Disadvantage**: DnD 5e mechanics (roll twice, keep higher/lower)
- **Critical Hits/Fails**: Natural 20 (auto-success) and Natural 1 (auto-fail)
- **Configurable Difficulty**: User-specified DC or default DC 15
- **AI-Powered DM Responses**: Contextual, dramatic narrative from Gemini
- **Session Memory**: Bot remembers last 5 actions per channel for continuity
- **Persistent Character Data**: Stats saved to JSON file, survives restarts

### Admin Features
- **Rate Limit Management**: View and clear user rate limits
- **Session Management**: Clear channel session history
- **Backup Management**: Manual backup triggers and backup listing
- **Admin Bypass**: No rate limits for bot owner

### Technical Features
- **Rate Limiting**: 5 API calls per 60 seconds per user
- **Automatic Backups**: Timestamped backups on every data save
- **Rich Embeds**: Color-coded, formatted responses with roll breakdowns
- **Error Handling**: User-friendly error messages for API failures
- **24/7 Hosting**: Railway.app deployment with persistent storage

---

## Implementation Steps

### Step 1: Initialize Project Structure with Railway Configuration

**Files to Create:**
- `package.json` with dependencies:
  - `discord.js`
  - `typescript`
  - `@google/generative-ai`
  - `dotenv`
  - `@types/node`
- `tsconfig.json` with `outDir: "dist"`
- `.env.example` template
- `.gitignore`
- `railway.json` or `nixpacks.toml` (if needed)

**Scripts in package.json:**
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/bot.js",
    "dev": "ts-node src/bot.ts"
  },
  "engines": {
    "node": ">=18.x"
  }
}
```

**Directory Structure:**
```
discord-adventure/
├── src/
│   ├── commands/
│   ├── utils/
│   ├── services/
│   ├── data/
│   ├── state/
│   └── bot.ts
├── data/
│   ├── backups/
│   └── .gitkeep
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
└── README.md
```

**Environment Variables (.env.example):**
```
DISCORD_BOT_TOKEN=your_discord_bot_token
GEMINI_API_KEY=your_gemini_api_key
ADMIN_USER_ID=your_discord_user_id
```

---

### Step 2: Build Discord Bot Core with Command Handlers

**File: `src/bot.ts`**
- Initialize Discord client with required intents
- Set up slash command registration
- Implement button interaction handlers
- Graceful startup logging for Railway monitoring

**Player Commands:**
- `/roll` - Roll dice with action
  - Required: `dice` (string, e.g., "d20"), `action` (string)
  - Optional: `stat` (choice: STR/DEX/CON/INT/WIS/CHA), `dc` (integer 1-30), `advantage` (boolean), `disadvantage` (boolean)
  - Validation: Prevent both advantage and disadvantage being true
- `/stats` - Set/update character stats
  - Parameters: `str`, `dex`, `con`, `int`, `wis`, `cha` (integers 1-30)
- `/character` - View character sheet
  - Shows all stats and calculated modifiers

**Admin Commands:**
- `/admin ratelimit` - View/clear user rate limits
  - Optional: `user` (user mention), `action` (choice: view/clear)
- `/admin session` - Clear channel sessions
  - Optional: `channel` (channel mention)
- `/admin backup` - Backup management
  - Optional: `action` (choice: trigger/list)

**Permission Check:**
```typescript
const isAdmin = interaction.user.id === process.env.ADMIN_USER_ID;
```

---

### Step 3: Implement Player Data Persistence with Validation and Backups

**File: `src/data/playerManager.ts`**

**Data Structure:**
```typescript
interface PlayerData {
  userId: string;
  characterName: string;
  stats: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  modifiers: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  createdAt: string;
  updatedAt: string;
}
```

**Functions:**
- `loadPlayers()`: Read from `data/players.json`
- `savePlayers()`: Write to `data/players.json` and create backup
- `getPlayer(userId)`: Get player data, auto-create with defaults if not exists
- `updatePlayer(userId, stats)`: Update stats and recalculate modifiers
- `createBackup()`: Save timestamped backup to `data/backups/`
- `listBackups()`: Return array of backup filenames

**Default Stats:**
```typescript
const DEFAULT_STATS = {
  str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10
};
```

**Modifier Calculation (DnD 5e):**
```typescript
const calculateModifier = (stat: number): number => {
  return Math.floor((stat - 10) / 2);
};
```

**Validation:**
- Stats must be between 1-30
- Show feedback: "STR: 10 → 14 (+0 → +2)"

**Backup Format:**
- `data/backups/players_YYYY-MM-DD_HH-mm-ss.json`
- Unlimited retention

---

### Step 4: Create Dice Rolling System with Advantage/Disadvantage and Criticals

**File: `src/utils/dice.ts`**

**Functions:**
- `parseDice(notation: string)`: Parse "d20", "d4", etc.
- `rollDice(sides: number, advantage?: boolean, disadvantage?: boolean)`: Roll with mechanics
- `calculateTotal(roll: number, modifier: number)`: Add stat modifier
- `checkSuccess(total: number, dc: number, naturalRoll: number)`: Determine pass/fail

**Advantage/Disadvantage Logic:**
```typescript
if (advantage) {
  const roll1 = random(1, sides);
  const roll2 = random(1, sides);
  return { result: Math.max(roll1, roll2), rolls: [roll1, roll2] };
}
if (disadvantage) {
  const roll1 = random(1, sides);
  const roll2 = random(1, sides);
  return { result: Math.min(roll1, roll2), rolls: [roll1, roll2] };
}
```

**Critical Detection:**
- Natural 20: Automatic success regardless of DC
- Natural 1: Automatic failure regardless of total

**File: `src/utils/statDetector.ts`**

**Keyword Mapping:**
```typescript
const STAT_KEYWORDS = {
  str: ['lift', 'push', 'break', 'force', 'smash', 'shove', 'carry'],
  dex: ['dodge', 'climb', 'sneak', 'acrobat', 'balance', 'hide', 'stealth'],
  con: ['endure', 'resist', 'survive', 'withstand', 'tough'],
  int: ['recall', 'analyze', 'investigate', 'decipher', 'study', 'research'],
  wis: ['perceive', 'insight', 'sense', 'notice', 'track', 'survival'],
  cha: ['persuade', 'intimidate', 'deceive', 'perform', 'charm', 'bluff']
};
```

**Function:**
```typescript
detectStat(action: string): 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
```

---

### Step 5: Build Interactive Stat Detection with Button Override UI

**File: `src/commands/rollHandler.ts`**

**Flow:**
1. User executes `/roll d20 "I climb the wall"`
2. Bot detects stat: "Detecting DEX for climbing..."
3. Show button row: [STR] [DEX] [CON] [INT] [WIS] [CHA] [✓ Confirm]
4. Wait 15 seconds for user interaction
5. On button click: Update selected stat, disable buttons
6. On timeout or confirm: Silently proceed with chosen stat
7. Execute roll calculation
8. Send embed response with AI narrative

**Button Row:**
```typescript
const row = new ActionRowBuilder()
  .addComponents(
    new ButtonBuilder().setCustomId('stat_str').setLabel('STR').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('stat_dex').setLabel('DEX').setStyle(ButtonStyle.Primary),
    // ... etc
    new ButtonBuilder().setCustomId('stat_confirm').setLabel('✓ Confirm').setStyle(ButtonStyle.Success)
  );
```

**Collector:**
```typescript
const collector = message.createMessageComponentCollector({
  time: 15000
});

collector.on('collect', interaction => {
  // Handle stat selection
});

collector.on('end', collected => {
  // Proceed with roll
});
```

---

### Step 6: Create Rich Embed Formatting System

**File: `src/utils/embedBuilder.ts`**

**Embed Colors:**
- Success: `#57F287` (green)
- Failure: `#ED4245` (red)
- Critical Success: `#FEE75C` (gold)
- Critical Failure: `#992D22` (dark red)

**Embed Structure:**
```typescript
const embed = new EmbedBuilder()
  .setAuthor({ name: characterName, iconURL: userAvatar })
  .setColor(color)
  .setDescription(aiNarrative) // From Gemini
  .addFields(
    { name: '🎲 Roll', value: rollBreakdown, inline: true },
    { name: 'Stat', value: `${stat.toUpperCase()} ${modifier >= 0 ? '+' : ''}${modifier}`, inline: true },
    { name: 'Result', value: `${total} vs DC ${dc}`, inline: true }
  )
  .setTimestamp();
```

**Roll Breakdown Examples:**
- Normal: `d20: 15 + 3 = 18`
- Advantage: `d20: [18, 12] → 18 + 3 = 21`
- Disadvantage: `d20: [8, 14] → 8 + 3 = 11`
- Critical Success: `🌟 Natural 20! 20 + 3 = 23`
- Critical Failure: `💀 Natural 1! 1 + 3 = 4`

---

### Step 7: Implement Rate Limiting System with Admin Bypass

**File: `src/utils/rateLimiter.ts`**

**Data Structure:**
```typescript
const userCalls = new Map<string, number[]>(); // userId -> timestamps
```

**Configuration:**
- Limit: 5 calls per 60 seconds
- Admin bypass: Check against `ADMIN_USER_ID`

**Functions:**
- `checkRateLimit(userId: string): { allowed: boolean, remaining: number, resetIn: number }`
- `recordCall(userId: string): void`
- `clearUserLimit(userId: string): void`
- `getUserStatus(userId: string): { calls: number, oldestCall: number }`
- `cleanup()`: Remove timestamps older than 60 seconds

**Cleanup Logic:**
```typescript
setInterval(() => {
  const now = Date.now();
  for (const [userId, timestamps] of userCalls.entries()) {
    const validTimestamps = timestamps.filter(t => now - t < 60000);
    if (validTimestamps.length === 0) {
      userCalls.delete(userId);
    } else {
      userCalls.set(userId, validTimestamps);
    }
  }
}, 30000); // Every 30 seconds
```

**Rate Limit Response:**
```typescript
const embed = new EmbedBuilder()
  .setColor('#ED4245')
  .setTitle('⏱️ Rate Limit Exceeded')
  .setDescription(`You can make ${resetIn} more rolls in ${secondsRemaining} seconds.`);
```

---

### Step 8: Integrate Gemini 2.0 Flash Lite for DM Responses

**File: `src/services/gemini.ts`**

**Setup:**
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
```

**System Prompts by Scenario:**

1. **Critical Success:**
```
You are an experienced Dungeon Master narrating a CRITICAL SUCCESS (natural 20). 
The player's action: "{action}"
Their roll: Natural 20 + {modifier} = {total} vs DC {dc}

Create a dramatic, triumphant narrative (2-3 sentences) describing their spectacular success. 
Be creative, vivid, and emphasize how exceptionally well they performed.
```

2. **Critical Failure:**
```
You are an experienced Dungeon Master narrating a CRITICAL FAILURE (natural 1).
The player's action: "{action}"
Their roll: Natural 1 + {modifier} = {total} vs DC {dc}

Create a dramatic, unfortunate narrative (2-3 sentences) describing their spectacular failure.
Be creative, vivid, but not overly cruel. Add humor if appropriate.
```

3. **Success:**
```
You are an experienced Dungeon Master narrating a SUCCESS.
The player's action: "{action}"
Their roll: {roll} + {modifier} = {total} vs DC {dc}

Create a narrative (2-3 sentences) describing how they successfully complete the action.
Include relevant details about their approach and the outcome.
```

4. **Failure:**
```
You are an experienced Dungeon Master narrating a FAILURE.
The player's action: "{action}"
Their roll: {roll} + {modifier} = {total} vs DC {dc}

Create a narrative (2-3 sentences) describing why they failed and what happens.
Be descriptive but fair. The failure should make sense given the difficulty.
```

**Context Inclusion:**
```typescript
const prompt = `
${systemPrompt}

Recent session history:
${sessionHistory.map(h => `- ${h.username}: ${h.action} (${h.outcome})`).join('\n')}

Character: ${characterName}
Stat used: ${stat.toUpperCase()} (${modifier >= 0 ? '+' : ''}${modifier})
${advantage ? 'Rolled with ADVANTAGE' : ''}
${disadvantage ? 'Rolled with DISADVANTAGE' : ''}
`;
```

**Error Handling:**
```typescript
try {
  const result = await model.generateContent(prompt);
  const narrative = result.response.text();
  return narrative;
} catch (error) {
  if (error.status === 429) {
    return "The DM is overwhelmed with requests. Try again in a moment.";
  }
  return "The DM seems distracted and cannot respond right now.";
}
```

**TODO Comment:**
```typescript
// TODO: Implement token counting and truncation for session history
// to optimize API costs and stay within context window limits
```

---

### Step 9: Add Session Context Management

**File: `src/state/sessionManager.ts`**

**Data Structure:**
```typescript
interface SessionAction {
  username: string;
  characterName: string;
  action: string;
  roll: number;
  modifier: number;
  total: number;
  dc: number;
  stat: string;
  advantage?: boolean;
  disadvantage?: boolean;
  outcome: 'critical_success' | 'success' | 'failure' | 'critical_failure';
  narrative: string; // Full AI response
  timestamp: number;
}

const sessions = new Map<string, SessionAction[]>(); // channelId -> actions
```

**Functions:**
- `addAction(channelId: string, action: SessionAction): void`
- `getSessionHistory(channelId: string): SessionAction[]`
- `clearSession(channelId: string): void`
- `formatHistoryForPrompt(channelId: string): string`
- `cleanupInactiveSessions(): void`

**Storage:**
- Keep last 5 actions per channel
- Include full AI narrative responses for context continuity

**Cleanup:**
```typescript
setInterval(() => {
  const now = Date.now();
  const TWO_HOURS = 2 * 60 * 60 * 1000;
  
  for (const [channelId, actions] of sessions.entries()) {
    const lastAction = actions[actions.length - 1];
    if (now - lastAction.timestamp > TWO_HOURS) {
      sessions.delete(channelId);
    }
  }
}, 30 * 60 * 1000); // Every 30 minutes
```

**Admin Functions:**
- `getAllSessions()`: Return summary of all active sessions
- `getSessionSummary(channelId: string)`: Get action count and latest timestamp

---

### Step 10: Set Up GitHub Repository for Deployment

**Tasks:**
1. Initialize Git: `git init`
2. Create `.gitignore`:
```
node_modules/
.env
dist/
data/*.json
!data/.gitkeep
```

3. Commit all source code:
```bash
git add .
git commit -m "Initial commit: Discord DnD bot setup"
```

4. Create GitHub repository
5. Push to remote:
```bash
git remote add origin https://github.com/yourusername/discord-adventure.git
git branch -M main
git push -u origin main
```

6. Verify `package.json` engines:
```json
"engines": {
  "node": ">=18.x"
}
```

---

### Step 11: Deploy to Railway.app with Persistent Storage

**Deployment Steps:**

1. **Create Railway Account**
   - Sign up at railway.app
   - Verify email

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Authorize Railway to access GitHub
   - Select `discord-adventure` repository

3. **Configure Environment Variables**
   - Go to project settings
   - Add variables:
     - `DISCORD_BOT_TOKEN`
     - `GEMINI_API_KEY`
     - `ADMIN_USER_ID`

4. **Add Persistent Volume**
   - Go to "Settings" → "Volumes"
   - Click "Add Volume"
   - Mount path: `/app/data`
   - This preserves `players.json` and backups across deploys

5. **Configure Build Settings** (if needed)
   - Build command: `npm run build`
   - Start command: `npm start`
   - Root directory: `/`

6. **Deploy**
   - Railway auto-deploys on push to main branch
   - Monitor logs in Railway dashboard
   - Verify bot shows online in Discord

7. **Enable Auto-Deploy**
   - Railway automatically redeploys on git push
   - Can also trigger manual deploys in dashboard

**Volume Path Structure:**
```
/app/data/
├── players.json
└── backups/
    ├── players_2025-11-24_10-30-00.json
    ├── players_2025-11-24_11-15-30.json
    └── ...
```

**Monitoring:**
- Check Railway logs for startup messages
- Verify Discord bot online status
- Test commands in Discord server

---

### Step 12: Write Comprehensive Setup and Deployment Documentation

**File: `README.md`**

**Sections:**

1. **Project Overview**
   - Description of bot functionality
   - Key features list
   - Technology stack

2. **Prerequisites**
   - Node.js 18 or higher
   - Discord Developer account
   - Google Gemini API access
   - GitHub account
   - Railway account

3. **Discord Bot Setup**
   - Create application in Discord Developer Portal
   - Enable bot user
   - Copy bot token
   - Set OAuth2 permissions:
     - `applications.commands`
     - `Send Messages`
     - `Embed Links`
     - `Add Reactions`
   - Generate invite URL and add bot to server

4. **Gemini API Setup**
   - Visit ai.google.dev
   - Create API key
   - Copy key for environment variables

5. **Local Development Setup**
   ```bash
   # Clone repository
   git clone https://github.com/yourusername/discord-adventure.git
   cd discord-adventure
   
   # Install dependencies
   npm install
   
   # Configure environment
   cp .env.example .env
   # Edit .env with your tokens
   
   # Run in development mode
   npm run dev
   ```

6. **Railway Deployment Guide**
   - Step-by-step deployment instructions
   - Environment variable configuration
   - Volume setup for persistent storage
   - Monitoring and logs
   - Updating the bot (git push workflow)

7. **Commands Reference**
   
   **Player Commands:**
   - `/roll` - Detailed parameter descriptions and examples
   - `/stats` - How to set character stats
   - `/character` - View character sheet
   
   **Admin Commands:**
   - `/admin ratelimit` - Manage rate limits
   - `/admin session` - Clear sessions
   - `/admin backup` - Backup management

8. **Character Creation Workflow**
   - Use `/stats` to set initial stats (or use defaults)
   - Examples of setting stats
   - Understanding modifiers

9. **DnD 5e Mechanics Explanation**
   - Stat system (STR, DEX, CON, INT, WIS, CHA)
   - Modifier calculation formula
   - Advantage/Disadvantage rules
   - Critical success (natural 20)
   - Critical failure (natural 1)
   - Difficulty Classes (DC)

10. **Rate Limiting Policy**
    - 5 API calls per 60 seconds per user
    - Admin bypass
    - Cooldown messages

11. **Backup System**
    - Automatic backups on every save
    - Timestamp format
    - Unlimited retention
    - Manual backup triggers

12. **Troubleshooting**
    - Common issues and solutions
    - Railway logs access
    - Volume persistence verification
    - API error messages
    - Discord permission issues

13. **Updating the Deployed Bot**
    ```bash
    # Make changes locally
    git add .
    git commit -m "Description of changes"
    git push origin main
    
    # Railway auto-deploys
    # Monitor logs in Railway dashboard
    ```

14. **Future Enhancements**
    - Token counting optimization
    - Additional DnD mechanics
    - Multi-server support improvements
    - Analytics and statistics

---

## Technical Specifications

### Technology Stack
- **Runtime:** Node.js 18+
- **Language:** TypeScript
- **Discord Library:** discord.js
- **AI Service:** Google Gemini 2.0 Flash Lite
- **Hosting:** Railway.app
- **Data Storage:** JSON files with persistent volume

### API Costs (Gemini 2.0 Flash Lite)
- **Input:** $0.075 per 1M tokens
- **Output:** $0.30 per 1M tokens
- **Free Tier:** Available with rate limits
- **Estimated Cost:** Minimal for small friend group usage

### Data Persistence
- **Player Data:** `data/players.json`
- **Backups:** `data/backups/players_YYYY-MM-DD_HH-mm-ss.json`
- **Session Data:** In-memory (not persisted)
- **Railway Volume:** Mounted at `/app/data`

### Rate Limiting
- **Per User:** 5 calls per 60 seconds
- **Admin Bypass:** Yes
- **Enforcement:** Pre-API call check
- **Cleanup:** Every 30 seconds

### Session Management
- **History Length:** Last 5 actions per channel
- **Cleanup:** Every 30 minutes
- **Inactive Threshold:** 2 hours
- **Storage:** In-memory Map

---

## DnD 5e Mechanics Reference

### Stats and Modifiers
| Stat | Modifier Calculation |
|------|---------------------|
| 1    | -5                  |
| 8-9  | -1                  |
| 10-11| +0                  |
| 12-13| +1                  |
| 16-17| +3                  |
| 20   | +5                  |

Formula: `Math.floor((stat - 10) / 2)`

### Difficulty Classes
- **Very Easy:** DC 5
- **Easy:** DC 10
- **Medium:** DC 15 (default)
- **Hard:** DC 20
- **Very Hard:** DC 25
- **Nearly Impossible:** DC 30

### Advantage/Disadvantage
- **Advantage:** Roll 2d20, keep higher
- **Disadvantage:** Roll 2d20, keep lower
- **Cannot have both simultaneously**

### Critical Results
- **Natural 20:** Automatic success, dramatic positive outcome
- **Natural 1:** Automatic failure, dramatic negative outcome

---

## File Structure Reference

```
discord-adventure/
├── src/
│   ├── bot.ts                    # Main bot initialization
│   ├── commands/
│   │   └── rollHandler.ts        # Roll command with stat detection UI
│   ├── utils/
│   │   ├── dice.ts               # Dice rolling logic
│   │   ├── statDetector.ts       # Keyword-to-stat mapping
│   │   ├── embedBuilder.ts       # Discord embed formatting
│   │   └── rateLimiter.ts        # Rate limiting system
│   ├── services/
│   │   └── gemini.ts             # Gemini API integration
│   ├── data/
│   │   └── playerManager.ts      # Player data persistence
│   └── state/
│       └── sessionManager.ts     # Session history management
├── data/
│   ├── players.json              # Player character data
│   ├── backups/                  # Timestamped backups
│   └── .gitkeep                  # Preserve directory in git
├── dist/                         # Compiled TypeScript output
├── node_modules/                 # Dependencies
├── .env                          # Environment variables (not in git)
├── .env.example                  # Environment template
├── .gitignore                    # Git ignore rules
├── package.json                  # Project dependencies
├── tsconfig.json                 # TypeScript configuration
├── railway.json                  # Railway configuration (optional)
└── README.md                     # Setup and usage documentation
```

---

## Admin Controls Reference

### Rate Limit Management
```
/admin ratelimit
  - view [user]: Show user's current rate limit status
  - clear [user]: Reset user's rate limit counter
  - view-all: Show all users with active rate limits
```

### Session Management
```
/admin session
  - clear [channel]: Clear specific channel's session history
  - clear-all: Clear all channel sessions
  - view [channel]: View session summary
```

### Backup Management
```
/admin backup
  - trigger: Manually create backup now
  - list: Show all available backups with timestamps
```

---

## Command Examples

### Player Commands

**Basic Roll:**
```
/roll d20 "I try to climb the stone wall"
```

**Roll with Stat Override:**
```
/roll d20 "I try to intimidate the guard" stat:cha
```

**Roll with Custom DC:**
```
/roll d20 "I attempt a backflip" dc:20
```

**Roll with Advantage:**
```
/roll d20 "I sneak past the sleeping dragon" advantage:true
```

**Roll with Disadvantage:**
```
/roll d20 "I try to balance on one foot while drunk" disadvantage:true
```

**Complex Roll:**
```
/roll d20 "I leap across the chasm" stat:dex dc:18 advantage:true
```

**Set Stats:**
```
/stats str:16 dex:14 con:13 int:10 wis:12 cha:8
```

**View Character:**
```
/character
```

### Admin Commands

**View User Rate Limit:**
```
/admin ratelimit action:view user:@username
```

**Clear User Rate Limit:**
```
/admin ratelimit action:clear user:@username
```

**Clear Channel Session:**
```
/admin session channel:#general
```

**Trigger Backup:**
```
/admin backup action:trigger
```

**List Backups:**
```
/admin backup action:list
```

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DISCORD_BOT_TOKEN` | Bot token from Discord Developer Portal | `MTIzNDU2Nzg5MDEyMzQ1Njc4OQ.GhIjKl.MnOpQrStUvWxYz...` |
| `GEMINI_API_KEY` | API key from ai.google.dev | `AIzaSyAbc123...` |
| `ADMIN_USER_ID` | Your Discord user ID | `123456789012345678` |

---

## Development Workflow

### Local Development
1. Make code changes
2. Test with `npm run dev`
3. Verify functionality in Discord test server
4. Commit changes

### Deployment
1. Push to GitHub: `git push origin main`
2. Railway auto-deploys
3. Monitor deployment logs
4. Test in production Discord server

### Rollback
1. Revert commit: `git revert HEAD`
2. Push: `git push origin main`
3. Railway redeploys previous version

---

## Troubleshooting Guide

### Bot Not Responding
- Check Railway logs for errors
- Verify environment variables are set
- Ensure bot has correct permissions in Discord
- Check bot token is valid

### Data Not Persisting
- Verify Railway volume is mounted at `/app/data`
- Check volume size in Railway dashboard
- Review backup files to confirm saves are working

### Rate Limit Issues
- Use admin commands to check user limits
- Verify rate limiter logic in code
- Check timestamp cleanup is running

### API Errors
- Verify Gemini API key is valid
- Check API quota/limits at ai.google.dev
- Review error messages in bot responses

### Commands Not Appearing
- Re-register commands by restarting bot
- Check bot has `applications.commands` permission
- Verify slash commands are enabled in Discord server

---

## Future Enhancement Ideas

1. **Token Optimization**
   - Implement token counting for session history
   - Truncate or summarize old actions
   - Monitor API costs

2. **Additional DnD Mechanics**
   - Spell casting system
   - Inventory management
   - Combat initiative tracking
   - HP/damage tracking

3. **Enhanced Characters**
   - Character classes and races
   - Skill proficiencies
   - Background and personality traits

4. **Multi-Server Support**
   - Server-specific configurations
   - Campaign management
   - DM role permissions

5. **Analytics**
   - Roll statistics
   - Most used stats
   - Success/failure rates
   - Player activity tracking

6. **Quality of Life**
   - Dice roll history per user
   - Reroll command
   - Saved character presets
   - Custom dice notation (2d6, 3d8+5, etc.)

---

## Support and Contribution

### Getting Help
- Check troubleshooting section
- Review Railway logs
- Test commands in development environment
- Verify environment variables

### Contributing
- Fork repository
- Create feature branch
- Make changes with tests
- Submit pull request

### Reporting Issues
- Describe the problem clearly
- Include error messages
- Provide steps to reproduce
- Mention environment (local/Railway)

---

## License

This project is for personal use with friends. Modify and extend as needed.

---

## Acknowledgments

- **discord.js** - Discord API library
- **Google Gemini** - AI narrative generation
- **Railway.app** - Hosting platform
- **DnD 5e** - Game mechanics inspiration

---

**Project Version:** 1.0.0  
**Last Updated:** November 24, 2025  
**Author:** Ian (Bot Owner/Admin)
