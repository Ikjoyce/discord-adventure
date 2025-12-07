import { ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ActionRow, MessageActionRowComponent } from 'discord.js';
import { generateScenario } from '../services/gemini';
import { createScenario, getScenario, endScenario, addScenarioMessage } from '../state/scenarioManager';

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

function createScenarioButtons(channelId: string, actions: string[]): ActionRowBuilder<ButtonBuilder>[] {
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  let currentRow = new ActionRowBuilder<ButtonBuilder>();

  actions.forEach((action, index) => {
    if (currentRow.components.length >= 5) {
      rows.push(currentRow);
      currentRow = new ActionRowBuilder<ButtonBuilder>();
    }
    currentRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`scenario_${channelId}_${index}`)
        .setLabel(action.length > 80 ? action.substring(0, 77) + '...' : action)
        .setStyle(ButtonStyle.Secondary)
    );
  });

  // Add Custom Action button
  if (currentRow.components.length >= 5) {
    rows.push(currentRow);
    currentRow = new ActionRowBuilder<ButtonBuilder>();
  }
  currentRow.addComponents(
    new ButtonBuilder()
      .setCustomId(`scenario_custom_${channelId}`)
      .setLabel('Custom Action')
      .setStyle(ButtonStyle.Primary)
  );
  
  rows.push(currentRow);
  return rows;
}

async function handleStartScenario(interaction: ChatInputCommandInteraction, channelId: string) {
  await interaction.deferReply();
  
  const theme = interaction.options.getString('theme') || 'fantasy adventure';
  const winCondition = interaction.options.getString('win_condition') || undefined;
  const failCondition = interaction.options.getString('fail_condition') || undefined;
  
  try {
    const aiResult = await generateScenario(theme, winCondition, failCondition);
    const scenario = createScenario(channelId, aiResult.description, aiResult.suggestedActions, winCondition, failCondition);
    
    const expiresTimestamp = Math.floor(scenario.expiresAt / 1000);

    const embed = new EmbedBuilder()
      .setColor('#9B59B6')
      .setTitle('🎲 New Scenario Started!')
      .setDescription(scenario.description)
      .addFields(
        { 
          name: 'Suggested Actions', 
          value: scenario.suggestedActions.map(action => `• ${action}`).join('\n') 
        },
        {
          name: 'Time Remaining',
          value: `Ends <t:${expiresTimestamp}:R>`,
          inline: false
        }
      );

    if (winCondition) {
      embed.addFields({ name: 'Win Condition', value: winCondition, inline: true });
    }
    if (failCondition) {
      embed.addFields({ name: 'Fail Condition', value: failCondition, inline: true });
    }

    embed.setFooter({ text: 'Use /roll or click a button to take action!' });

    const components = createScenarioButtons(channelId, scenario.suggestedActions);
    const message = await interaction.editReply({ embeds: [embed], components });
    addScenarioMessage(channelId, message.id);

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

  const expiresTimestamp = Math.floor(scenario.expiresAt / 1000);

  const embed = new EmbedBuilder()
    .setColor('#9B59B6')
    .setTitle('📜 Current Scenario')
    .setDescription(scenario.description)
    .addFields(
      { 
        name: 'Suggested Actions', 
        value: scenario.suggestedActions.map(action => `• ${action}`).join('\n') 
      },
      {
        name: 'Time Remaining',
        value: `Ends <t:${expiresTimestamp}:R>`,
        inline: false
      }
    );

  if (scenario.winCondition) {
    embed.addFields({ name: 'Win Condition', value: scenario.winCondition, inline: true });
  }
  if (scenario.failCondition) {
    embed.addFields({ name: 'Fail Condition', value: scenario.failCondition, inline: true });
  }

  const components = createScenarioButtons(channelId, scenario.suggestedActions);
  const message = await interaction.reply({ embeds: [embed], components, fetchReply: true });
  addScenarioMessage(channelId, message.id);
}

async function handleEndScenario(interaction: ChatInputCommandInteraction, channelId: string) {
  const scenario = getScenario(channelId);
  
  if (scenario) {
    // Disable buttons on all tracked messages
    const channel = interaction.channel;
    const failedMessages: string[] = [];

    if (channel && channel.isTextBased()) {
        for (const messageId of scenario.messageIds) {
            try {
                const message = await channel.messages.fetch(messageId);
                if (message) {
                    const disabledRows = message.components.map(row => {
                        const newRow = new ActionRowBuilder<ButtonBuilder>();
                        (row as ActionRow<MessageActionRowComponent>).components.forEach(component => {
                            if (component.type === ComponentType.Button) {
                                const button = ButtonBuilder.from(component);
                                button.setDisabled(true);
                                newRow.addComponents(button);
                            }
                        });
                        return newRow;
                    });
                    await message.edit({ components: disabledRows });
                }
            } catch (e) {
                console.log(`Failed to disable buttons for message ${messageId}:`, e);
                failedMessages.push(messageId);
            }
        }
    }

    endScenario(channelId);
    
    let replyContent = "Scenario ended. The adventure is paused.";
    if (failedMessages.length > 0) {
        replyContent += ` (Note: Could not disable buttons on ${failedMessages.length} message(s). They might have been deleted.)`;
    }
    
    await interaction.reply(replyContent);
  } else {
    await interaction.reply({ content: "No active scenario to end.", ephemeral: true });
  }
}
