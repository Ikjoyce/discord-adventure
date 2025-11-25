import { Client, GatewayIntentBits, Events, Interaction, REST, Routes, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';
import { handleRollCommand, handleStatsCommand, handleSetStatCommand } from './commands/rollHandler';
import { handleAdminCommand } from './commands/adminHandler';
import { handleScenarioCommand } from './commands/scenarioHandler';
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

async function registerCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName('roll')
      .setDescription('Roll dice and perform an action')
      .addStringOption(option =>
        option.setName('action')
          .setDescription('Describe what you want to do')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('stat')
          .setDescription('Manually select the stat to use')
          .addChoices(
            { name: 'Strength', value: 'str' },
            { name: 'Dexterity', value: 'dex' },
            { name: 'Constitution', value: 'con' },
            { name: 'Intelligence', value: 'int' },
            { name: 'Wisdom', value: 'wis' },
            { name: 'Charisma', value: 'cha' }
          ))
      .addIntegerOption(option =>
        option.setName('dc')
          .setDescription('Difficulty Class (DC) for the check')
          .setMinValue(1)
          .setMaxValue(30))
      .addBooleanOption(option =>
        option.setName('advantage')
          .setDescription('Roll with advantage'))
      .addBooleanOption(option =>
        option.setName('disadvantage')
          .setDescription('Roll with disadvantage')),

    new SlashCommandBuilder()
      .setName('stats')
      .setDescription('View your character stats'),

    new SlashCommandBuilder()
      .setName('setstat')
      .setDescription('Set a character stat')
      .addStringOption(option =>
        option.setName('stat')
          .setDescription('The stat to update')
          .setRequired(true)
          .addChoices(
            { name: 'Strength', value: 'str' },
            { name: 'Dexterity', value: 'dex' },
            { name: 'Constitution', value: 'con' },
            { name: 'Intelligence', value: 'int' },
            { name: 'Wisdom', value: 'wis' },
            { name: 'Charisma', value: 'cha' }
          ))
      .addIntegerOption(option =>
        option.setName('value')
          .setDescription('The new value (1-30)')
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(30)),

    new SlashCommandBuilder()
      .setName('admin')
      .setDescription('Admin commands')
      .addSubcommand(subcommand =>
        subcommand
          .setName('ratelimit')
          .setDescription('Manage rate limits')
          .addStringOption(option =>
            option.setName('action')
              .setDescription('Action to perform')
              .setRequired(true)
              .addChoices(
                { name: 'View', value: 'view' },
                { name: 'Clear', value: 'clear' }
              ))
          .addUserOption(option =>
            option.setName('user')
              .setDescription('Target user')
              .setRequired(true)))
      .addSubcommand(subcommand =>
        subcommand
          .setName('backup')
          .setDescription('Manage backups')
          .addStringOption(option =>
            option.setName('action')
              .setDescription('Action to perform')
              .setRequired(true)
              .addChoices(
                { name: 'Trigger', value: 'trigger' },
                { name: 'List', value: 'list' }
              ))),

    new SlashCommandBuilder()
      .setName('scenario')
      .setDescription('Adventure scenario commands')
      .addSubcommand(subcommand =>
        subcommand
          .setName('start')
          .setDescription('Start a new adventure scenario')
          .addStringOption(option =>
            option.setName('theme')
              .setDescription('Optional theme for the scenario (e.g., "dungeon", "tavern", "wilderness")')
          )
      )
      .addSubcommand(subcommand =>
        subcommand
          .setName('view')
          .setDescription('View the current active scenario')
      )
      .addSubcommand(subcommand =>
        subcommand
          .setName('end')
          .setDescription('End the current scenario')
      )
  ].map(command => command.toJSON());

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

  try {
    console.log('Started refreshing application (/) commands.');
    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!),
      { body: commands },
    );
    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
}

client.once(Events.ClientReady, async c => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
  
  // Register commands automatically on startup
  await registerCommands();
  
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

      case 'scenario':
        await handleScenarioCommand(interaction);
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