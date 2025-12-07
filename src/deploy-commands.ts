import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

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
        .addStringOption(option =>
          option.setName('win_condition')
            .setDescription('Optional win condition for the scenario')
        )
        .addStringOption(option =>
          option.setName('fail_condition')
            .setDescription('Optional fail condition for the scenario')
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

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    // Use applicationCommands for global commands (takes ~1 hour to update)
    // Or applicationGuildCommands for instant updates in a specific server
    // For now, we'll use global commands as it's simpler for the user to just run once
    // But for dev, guild commands are better. I'll assume global for production readiness.
    
    if (!process.env.DISCORD_CLIENT_ID) {
        console.error('Error: DISCORD_CLIENT_ID is missing in .env');
        process.exit(1);
    }

    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();