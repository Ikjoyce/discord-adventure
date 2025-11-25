import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { generateScenario } from '../services/gemini';
import { createScenario, getScenario, endScenario } from '../state/scenarioManager';

export async function handleScenarioCommand(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.getSubcommand();
  const channelId = interaction.channelId;

  if (!channelId) {
    await interaction.reply({ content: "This command must be used in a channel.", ephemeral: true });
    return;
  }

  switch (subcommand) {
    case 'start':
      await handleStartScenario(interaction, channelId);
      break;
    case 'view':
      await handleViewScenario(interaction, channelId);
      break;
    case 'end':
      await handleEndScenario(interaction, channelId);
      break;
  }
}

async function handleStartScenario(interaction: ChatInputCommandInteraction, channelId: string) {
  await interaction.deferReply();
  
  const theme = interaction.options.getString('theme') || 'fantasy adventure';
  
  try {
    const aiResult = await generateScenario(theme);
    const scenario = createScenario(channelId, aiResult.description, aiResult.suggestedActions);
    
    const embed = new EmbedBuilder()
      .setColor('#9B59B6')
      .setTitle('🎲 New Scenario Started!')
      .setDescription(scenario.description)
      .addFields({ 
        name: 'Suggested Actions', 
        value: scenario.suggestedActions.map(action => `• ${action}`).join('\n') 
      })
      .setFooter({ text: 'Use /roll to take action!' });

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error starting scenario:', error);
    await interaction.editReply("Failed to generate a scenario. The AI might be busy.");
  }
}

async function handleViewScenario(interaction: ChatInputCommandInteraction, channelId: string) {
  const scenario = getScenario(channelId);
  
  if (!scenario) {
    await interaction.reply({ content: "No active scenario in this channel. Start one with `/scenario start`.", ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor('#9B59B6')
    .setTitle('📜 Current Scenario')
    .setDescription(scenario.description)
    .addFields({ 
      name: 'Suggested Actions', 
      value: scenario.suggestedActions.map(action => `• ${action}`).join('\n') 
    });

  await interaction.reply({ embeds: [embed] });
}

async function handleEndScenario(interaction: ChatInputCommandInteraction, channelId: string) {
  if (endScenario(channelId)) {
    await interaction.reply("Scenario ended. The adventure is paused.");
  } else {
    await interaction.reply({ content: "No active scenario to end.", ephemeral: true });
  }
}
