import { ChatInputCommandInteraction, ButtonInteraction, ModalSubmitInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { rollDice, RollResult } from '../utils/dice';
import { detectStat } from '../utils/statDetector';
import { createRollEmbed } from '../utils/embedBuilder';
import { checkRateLimit } from '../utils/rateLimiter';
import { getPlayer, updatePlayerStats } from '../data/playerManager';
import { generateNarrative } from '../services/gemini';
import { addToHistory, getHistory } from '../state/sessionManager';
import { getScenario } from '../state/scenarioManager';

export interface RollOptions {
  manualStat?: string | null;
  manualDC?: number | null;
  advantage?: boolean;
  disadvantage?: boolean;
}

export async function executeRoll(
  interaction: ChatInputCommandInteraction | ButtonInteraction | ModalSubmitInteraction,
  actionDescription: string,
  options: RollOptions = {}
) {
  const userId = interaction.user.id;
  const channelId = interaction.channelId;
  const username = interaction.user.username;
  const avatarUrl = interaction.user.displayAvatarURL();

  // 1. Rate Limit Check
  if (!checkRateLimit(userId)) {
    await interaction.editReply({ content: "You are doing that too much! Take a breath (Rate limit exceeded)." });
    return;
  }

  const { manualStat, manualDC, advantage = false, disadvantage = false } = options;

  if (advantage && disadvantage) {
      await interaction.editReply("You cannot have both advantage and disadvantage!");
      return;
  }

  // 3. Get Player Data
  const player = getPlayer(userId, username);

  // 4. Detect Stat (Interactive UI)
  let statKey = manualStat ? manualStat.toLowerCase() : detectStat(actionDescription);
  
  // If no manual stat was provided, give the user a chance to change it
  if (!manualStat) {
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder().setCustomId('str').setLabel('STR').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('dex').setLabel('DEX').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('con').setLabel('CON').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('int').setLabel('INT').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('wis').setLabel('WIS').setStyle(ButtonStyle.Secondary)
      );
      
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder().setCustomId('cha').setLabel('CHA').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('confirm').setLabel(`Confirm (${statKey.toUpperCase()})`).setStyle(ButtonStyle.Success)
      );

    const response = await interaction.editReply({
      content: `I detected **${statKey.toUpperCase()}** for this action. Is that correct?`,
      components: [row1, row2]
    });

    try {
      const confirmation = await response.awaitMessageComponent({ 
        filter: i => i.user.id === userId, 
        time: 15000,
        componentType: ComponentType.Button 
      });

      if (confirmation.customId !== 'confirm') {
        statKey = confirmation.customId;
        await confirmation.update({ content: `Switched to **${statKey.toUpperCase()}**. Rolling...`, components: [] });
      } else {
        await confirmation.update({ content: `Confirmed **${statKey.toUpperCase()}**. Rolling...`, components: [] });
      }
    } catch (e) {
      // Timeout - proceed with detected stat
      await interaction.editReply({ content: `Timed out. Proceeding with **${statKey.toUpperCase()}**...`, components: [] });
    }
  }

  // @ts-ignore
  const modifier = player.modifiers[statKey];

  // 5. Roll Dice
  const rollResult = rollDice(20, modifier, advantage, disadvantage);
  const dc = manualDC || 12; // Default difficulty

  // 6. Generate AI Narrative
  const history = channelId ? getHistory(channelId) : [];
  const scenario = channelId ? getScenario(channelId) : undefined;
  
  const narrative = await generateNarrative({
    player,
    action: actionDescription,
    roll: rollResult,
    statUsed: statKey.toUpperCase(),
    difficultyClass: dc,
    history,
    scenarioContext: scenario ? scenario.description : undefined,
    winCondition: scenario ? scenario.winCondition : undefined,
    failCondition: scenario ? scenario.failCondition : undefined
  });

  // 7. Send Result
  const embed = createRollEmbed({
    characterName: username,
    characterAvatar: avatarUrl,
    action: actionDescription,
    rollResult,
    stat: statKey,
    dc: dc,
    narrative,
    advantage,
    disadvantage
  });

  await interaction.editReply({ content: null, embeds: [embed] });

  // 8. Update Session History
  if (channelId) {
      addToHistory(channelId, `Player ${username} attempted: "${actionDescription}". Rolled ${rollResult.total} (${statKey}). Result: ${narrative}`);
  }
}

export async function handleRollCommand(interaction: ChatInputCommandInteraction) {
  const userId = interaction.user.id;

  // 1. Rate Limit Check
  if (!checkRateLimit(userId)) {
    await interaction.reply({ content: "You are doing that too much! Take a breath (Rate limit exceeded).", ephemeral: true });
    return;
  }

  await interaction.deferReply();

  // 2. Parse Input
  const actionDescription = interaction.options.getString('action', true);
  const manualStat = interaction.options.getString('stat');
  const manualDC = interaction.options.getInteger('dc');
  const advantage = interaction.options.getBoolean('advantage') || false;
  const disadvantage = interaction.options.getBoolean('disadvantage') || false;

  await executeRoll(interaction, actionDescription, {
    manualStat,
    manualDC,
    advantage,
    disadvantage
  });
}

export async function handleStatsCommand(interaction: ChatInputCommandInteraction) {
    const player = getPlayer(interaction.user.id, interaction.user.username);
    const stats = player.stats;
    const mods = player.modifiers;

    const content = `
**${player.characterName}'s Stats**
STR: ${stats.str} (${mods.str >= 0 ? '+' : ''}${mods.str})
DEX: ${stats.dex} (${mods.dex >= 0 ? '+' : ''}${mods.dex})
CON: ${stats.con} (${mods.con >= 0 ? '+' : ''}${mods.con})
INT: ${stats.int} (${mods.int >= 0 ? '+' : ''}${mods.int})
WIS: ${stats.wis} (${mods.wis >= 0 ? '+' : ''}${mods.wis})
CHA: ${stats.cha} (${mods.cha >= 0 ? '+' : ''}${mods.cha})
    `;
    await interaction.reply({ content, ephemeral: true });
}

export async function handleSetStatCommand(interaction: ChatInputCommandInteraction) {
    const statName = interaction.options.getString('stat', true).toLowerCase();
    const value = interaction.options.getInteger('value', true);

    // @ts-ignore - we validated statName is a key in the command definition
    updatePlayerStats(interaction.user.id, { [statName]: value });
    await interaction.reply({ content: `Updated ${statName.toUpperCase()} to ${value}.`, ephemeral: true });
}