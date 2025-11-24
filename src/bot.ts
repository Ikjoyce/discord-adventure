import { Client, GatewayIntentBits, Events, Interaction } from 'discord.js';
import dotenv from 'dotenv';
import { handleRollCommand, handleStatsCommand, handleSetStatCommand } from './commands/rollHandler';
import { handleAdminCommand } from './commands/adminHandler';
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

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.commandName;

  try {
    switch (command) {
      case 'roll':
        await handleRollCommand(interaction);
        break;
        
      case 'stats':
        await handleStatsCommand(interaction);
        break;
        
      case 'setstat':
        await handleSetStatCommand(interaction);
        break;

      case 'admin':
        await handleAdminCommand(interaction);
        break;
    }
  } catch (error) {
    console.error('Command execution error:', error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
    } else {
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);