import { Message, TextChannel } from 'discord.js';
import { rollDice, RollResult } from '../utils/dice';
import { detectStat } from '../utils/statDetector';
import { createRollEmbed } from '../utils/embedBuilder';
import { checkRateLimit } from '../utils/rateLimiter';
import { getPlayer, updatePlayerStats } from '../data/playerManager';
import { generateNarrative } from '../services/gemini';
import { addToHistory } from '../state/sessionManager';

export async function handleRollCommand(message: Message, args: string[]) {
  const userId = message.author.id;
  const channelId = message.channelId;
  const username = message.author.username;
  const avatarUrl = message.author.displayAvatarURL();

  // 1. Rate Limit Check
  if (!checkRateLimit(userId)) {
    await message.reply("You are doing that too much! Take a breath (Rate limit exceeded).");
    return;
  }

  // 2. Parse Input
  // Expected format: !roll [action description] OR !roll [stat] [action]
  // For MVP, we'll assume the whole string is the action, and we auto-detect the stat.
  const actionDescription = args.join(' ');
  
  if (!actionDescription) {
    await message.reply("What are you trying to do? Usage: `!roll I try to jump over the chasm`");
    return;
  }

  // 3. Get Player Data
  const player = getPlayer(userId, username);

  // 4. Detect Stat
  const statKey = detectStat(actionDescription);
  const modifier = player.modifiers[statKey];

  // 5. Roll Dice
  const rollResult = rollDice(20, modifier);
  const defaultDC = 12; // Default difficulty

  // 6. Generate AI Narrative
  const loadingMsg = await message.reply("Rolling dice and consulting the spirits...");
  
  const narrative = await generateNarrative({
    player,
    action: actionDescription,
    roll: rollResult,
    statUsed: statKey.toUpperCase(),
    difficultyClass: defaultDC
  });

  // 7. Send Result
  const embed = createRollEmbed({
    characterName: username,
    characterAvatar: avatarUrl,
    action: actionDescription,
    rollResult,
    stat: statKey,
    dc: defaultDC,
    narrative
  });

  await loadingMsg.edit({ content: null, embeds: [embed] });

  // 8. Update Session History
  addToHistory(channelId, `Player ${username} attempted: "${actionDescription}". Rolled ${rollResult.total} (${statKey}). Result: ${narrative}`);
}

export async function handleStatsCommand(message: Message) {
    const player = getPlayer(message.author.id, message.author.username);
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
    await message.reply(content);
}

export async function handleSetStatCommand(message: Message, args: string[]) {
    // Usage: !setstat str 15
    if (args.length !== 2) {
        await message.reply("Usage: `!setstat <stat> <value>` (e.g., `!setstat str 16`)");
        return;
    }

    const statName = args[0].toLowerCase();
    const value = parseInt(args[1]);

    if (isNaN(value)) {
        await message.reply("Value must be a number.");
        return;
    }

    const validStats = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    if (!validStats.includes(statName)) {
        await message.reply(`Invalid stat. Choose from: ${validStats.join(', ')}`);
        return;
    }

    // @ts-ignore - we validated statName is a key
    updatePlayerStats(message.author.id, { [statName]: value });
    await message.reply(`Updated ${statName.toUpperCase()} to ${value}.`);
}