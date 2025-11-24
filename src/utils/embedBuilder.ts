import { EmbedBuilder, ColorResolvable } from 'discord.js';
import { RollResult } from './dice';

export interface RollEmbedOptions {
  characterName: string;
  characterAvatar?: string;
  action: string;
  rollResult: RollResult;
  stat: string;
  dc: number;
  narrative: string;
  advantage?: boolean;
  disadvantage?: boolean;
}

const COLORS = {
  SUCCESS: '#57F287',
  FAILURE: '#ED4245',
  CRITICAL_SUCCESS: '#FEE75C',
  CRITICAL_FAILURE: '#992D22'
} as const;

export function createRollEmbed(options: RollEmbedOptions): EmbedBuilder {
  const { 
    characterName, 
    characterAvatar, 
    action, 
    rollResult, 
    stat, 
    dc, 
    narrative,
    advantage,
    disadvantage 
  } = options;

  let color: ColorResolvable;
  let resultText: string;

  if (rollResult.isCriticalSuccess) {
    color = COLORS.CRITICAL_SUCCESS as ColorResolvable;
    resultText = 'CRITICAL SUCCESS!';
  } else if (rollResult.isCriticalFailure) {
    color = COLORS.CRITICAL_FAILURE as ColorResolvable;
    resultText = 'CRITICAL FAILURE!';
  } else if (rollResult.total >= dc) {
    color = COLORS.SUCCESS as ColorResolvable;
    resultText = 'SUCCESS';
  } else {
    color = COLORS.FAILURE as ColorResolvable;
    resultText = 'FAILURE';
  }

  // Format roll breakdown
  let rollBreakdown = '';
  if (advantage) {
    rollBreakdown = `[${rollResult.rolls.join(', ')}] → ${rollResult.naturalRoll}`;
  } else if (disadvantage) {
    rollBreakdown = `[${rollResult.rolls.join(', ')}] → ${rollResult.naturalRoll}`;
  } else {
    rollBreakdown = `${rollResult.naturalRoll}`;
  }

  const modifierStr = rollResult.modifier >= 0 ? `+${rollResult.modifier}` : `${rollResult.modifier}`;
  const totalFormula = `${rollBreakdown} (d${rollResult.dieSize}) ${modifierStr} = **${rollResult.total}**`;

  const embed = new EmbedBuilder()
    .setColor(color)
    .setAuthor({ name: characterName, iconURL: characterAvatar })
    .setTitle(action.length > 256 ? action.substring(0, 253) + '...' : action)
    .setDescription(narrative)
    .addFields(
      { name: '🎲 Roll', value: totalFormula, inline: true },
      { name: 'Stat', value: `${stat.toUpperCase()} (${modifierStr})`, inline: true },
      { name: 'Result', value: `${resultText} (vs DC ${dc})`, inline: true }
    )
    .setFooter({ text: 'Discord Adventure Bot' })
    .setTimestamp();

  return embed;
}