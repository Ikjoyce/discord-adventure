# XP System Implementation Plan

## Overview
Add an experience point (XP) and leveling system that rewards players for successful rolls during scenarios.

## 1. Update `src/data/playerManager.ts`

### Add to PlayerData interface:
```typescript
export interface PlayerData {
  userId: string;
  characterName: string;
  stats: PlayerStats;
  modifiers: PlayerStats;
  xp: number;          // ADD THIS
  level: number;       // ADD THIS
  createdAt: string;
  updatedAt: string;
}
```

### Add XP constants after imports:
```typescript
const XP_PER_LEVEL = 100; // XP needed per level
const XP_FOR_SUCCESS = 10;
const XP_FOR_CRIT_SUCCESS = 25;
```

### Update the newPlayer creation in `getPlayer` function:
```typescript
const newPlayer: PlayerData = {
  userId,
  characterName: username,
  stats: { ...DEFAULT_STATS },
  modifiers: calculateModifiers(DEFAULT_STATS),
  xp: 0,              // ADD THIS
  level: 1,           // ADD THIS
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};
```

### Add new functions at the end of the file:
```typescript
export function awardXP(userId: string, amount: number): { player: PlayerData, leveledUp: boolean, newLevel?: number } {
  if (!isLoaded) loadPlayers();
  
  const player = playersCache.get(userId);
  if (!player) {
    throw new Error('Player not found');
  }
  
  const oldLevel = player.level;
  player.xp += amount;
  
  // Check for level up
  const xpNeeded = XP_PER_LEVEL * player.level;
  if (player.xp >= xpNeeded) {
    player.level += 1;
    player.xp -= xpNeeded; // Carry over excess XP
    player.updatedAt = new Date().toISOString();
    playersCache.set(userId, player);
    savePlayers();
    return { player, leveledUp: true, newLevel: player.level };
  }
  
  player.updatedAt = new Date().toISOString();
  playersCache.set(userId, player);
  savePlayers();
  
  return { player, leveledUp: false };
}

export function getXPForNextLevel(player: PlayerData): number {
  return XP_PER_LEVEL * player.level;
}

export { XP_FOR_SUCCESS, XP_FOR_CRIT_SUCCESS };
```

### Add migration function:
```typescript
export function migratePlayersToXP(): void {
  if (!isLoaded) loadPlayers();
  
  let migrated = false;
  for (const [userId, player] of playersCache.entries()) {
    // @ts-ignore - checking if old format
    if (player.xp === undefined) {
      // @ts-ignore
      player.xp = 0;
      // @ts-ignore
      player.level = 1;
      migrated = true;
    }
  }
  
  if (migrated) {
    savePlayers();
    console.log('Migrated players to XP system');
  }
}
```

## 2. Update `src/commands/rollHandler.ts`

### Add imports at the top:
```typescript
import { awardXP, XP_FOR_SUCCESS, XP_FOR_CRIT_SUCCESS } from '../data/playerManager';
```

### After generating the narrative and before sending the embed (around line 110), add:
```typescript
  // 7. Award XP if in a scenario and roll was successful
  let xpAwarded = 0;
  let levelUpMessage = '';
  
  if (scenario && rollResult.total >= dc) {
    const xpAmount = rollResult.isCriticalSuccess ? XP_FOR_CRIT_SUCCESS : XP_FOR_SUCCESS;
    const result = awardXP(userId, xpAmount);
    xpAwarded = xpAmount;
    
    if (result.leveledUp) {
      levelUpMessage = `\n🎉 **LEVEL UP!** You are now level ${result.newLevel}!`;
    }
  }

  // 8. Send Result (update the number)
  const embed = createRollEmbed({
    characterName: username,
    characterAvatar: avatarUrl,
    action: actionDescription,
    rollResult,
    stat: statKey,
    dc: dc,
    narrative: narrative + levelUpMessage,
    advantage,
    disadvantage
  });

  const replyContent = xpAwarded > 0 ? `+${xpAwarded} XP` : null;
  await interaction.editReply({ content: replyContent, embeds: [embed] });
```

### Replace the `handleStatsCommand` function:
```typescript
export async function handleStatsCommand(interaction: ChatInputCommandInteraction) {
    const player = getPlayer(interaction.user.id, interaction.user.username);
    const stats = player.stats;
    const mods = player.modifiers;
    
    const xpNeeded = 100 * player.level;
    const xpProgress = `${player.xp}/${xpNeeded} XP`;

    const content = `
**${player.characterName}'s Character Sheet**

**Level ${player.level}** | ${xpProgress}

**Stats:**
STR: ${stats.str} (${mods.str >= 0 ? '+' : ''}${mods.str})
DEX: ${stats.dex} (${mods.dex >= 0 ? '+' : ''}${mods.dex})
CON: ${stats.con} (${mods.con >= 0 ? '+' : ''}${mods.con})
INT: ${stats.int} (${mods.int >= 0 ? '+' : ''}${mods.int})
WIS: ${stats.wis} (${mods.wis >= 0 ? '+' : ''}${mods.wis})
CHA: ${stats.cha} (${mods.cha >= 0 ? '+' : ''}${mods.cha})
    `;
    await interaction.reply({ content, ephemeral: true });
}
```

## 3. Update `src/bot.ts`

### Call migration after loadPlayers():
```typescript
    loadPlayers();
    migratePlayersToXP(); // ADD THIS LINE
    console.log('Player data loaded.');
```

## 4. Update README.md

### Add to the "How to Play" section under "Scenario Mode":
```markdown
### XP and Leveling
- Earn **10 XP** for successful rolls during scenarios
- Earn **25 XP** for critical successes during scenarios
- Level up every **100 XP** (scales with level)
- View your level and XP progress with `/stats`
- XP is only awarded for scenario-based rolls, not free-form rolls
```

## Design Decisions

### XP Awards
- **10 XP** for normal success (meets or beats DC during scenario)
- **25 XP** for critical success (natural 20 during scenario)
- **0 XP** for failures or rolls outside scenarios

### Level Progression
- Linear: 100 XP per level (Level 1→2 = 100 XP, Level 2→3 = 200 XP, etc.)
- Excess XP carries over to next level
- No level cap

### Scenario-Only XP
- XP is only awarded during active scenarios
- Encourages use of the `/scenario` system
- Free-form rolls don't grant XP

## Alternative Considerations

### Exponential Progression (Not Implemented)
```typescript
const XP_PER_LEVEL = (level: number) => Math.floor(100 * Math.pow(1.5, level - 1));
```

### Stat Bonuses on Level Up (Future Feature)
- Could award +1 to a chosen stat every X levels
- Requires additional command for stat selection

### XP for Failures (Not Implemented)
- Could award 5 XP for attempts even on failure
- Encourages participation regardless of outcome
