export type StatType = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

const STAT_KEYWORDS: Record<StatType, string[]> = {
  str: ['lift', 'push', 'break', 'force', 'smash', 'shove', 'carry', 'throw', 'grapple', 'strength', 'str'],
  dex: ['dodge', 'climb', 'sneak', 'acrobat', 'balance', 'hide', 'stealth', 'pick', 'sleight', 'dexterity', 'dex'],
  con: ['endure', 'resist', 'survive', 'withstand', 'tough', 'hold breath', 'constitution', 'con'],
  int: ['recall', 'analyze', 'investigate', 'decipher', 'study', 'research', 'history', 'arcana', 'nature', 'religion', 'intelligence', 'int'],
  wis: ['perceive', 'insight', 'sense', 'notice', 'track', 'survival', 'medicine', 'animal', 'perception', 'wisdom', 'wis'],
  cha: ['persuade', 'intimidate', 'deceive', 'perform', 'charm', 'bluff', 'lie', 'convince', 'charisma', 'cha']
};

export function detectStat(action: string): StatType {
  const lowerAction = action.toLowerCase();
  
  // Check for explicit stat mentions first or strong keywords
  for (const [stat, keywords] of Object.entries(STAT_KEYWORDS)) {
    for (const keyword of keywords) {
      // Simple inclusion check
      if (lowerAction.includes(keyword)) {
        return stat as StatType;
      }
    }
  }
  
  // Default to DEX if ambiguous (common for "doing stuff") or maybe just random? 
  // Let's default to DEX as it's a safe bet for physical actions, or maybe just return a default.
  // For now, defaulting to DEX.
  return 'dex';
}