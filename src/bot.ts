import { Client, GatewayIntentBits, Events } from 'discord.js';
import dotenv from 'dotenv';
import { handleRollCommand, handleStatsCommand, handleSetStatCommand } from './commands/rollHandler';
import { loadPlayers } from './data/playerManager';
import { initGemini } from './services/gemini';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ]
});

const PREFIX = '!';

client.once(Events.ClientReady, c => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
  
  // Initialize services
  try {
    loadPlayers();
    console.log('Player data loaded.');
    
    initGemini();
    console.log('Gemini AI initialized.');
  } catch (error) {
    console.error('Initialization error:', error);
  }
});

client.on(Events.MessageCreate, async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift()?.toLowerCase();

  try {
    switch (command) {
      case 'roll':
      case 'r':
      case 'action':
        await handleRollCommand(message, args);
        break;
        
      case 'stats':
      case 'sheet':
        await handleStatsCommand(message);
        break;
        
      case 'setstat':
        await handleSetStatCommand(message, args);
        break;
        
      case 'help':
        await message.reply(`
**Discord Adventure Bot Commands**
\`!roll <action>\` - Attempt an action (e.g., "!roll I attack the goblin")
\`!stats\` - View your character stats
\`!setstat <stat> <value>\` - Set a stat (e.g., "!setstat str 16")
        `);
        break;
    }
  } catch (error) {
    console.error('Command execution error:', error);
    await message.reply('An error occurred while executing that command.');
  }
});

client.login(process.env.DISCORD_TOKEN);