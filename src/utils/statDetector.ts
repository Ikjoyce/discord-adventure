export type StatType = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

const STAT_KEYWORDS: Record<StatType, string[]> = {
  str: ['lift', 'push', 'break', 'force', 'smash', 'shove', 'carry', 'throw', 'grapple', 'strength', 'str', 'athletics', 'jump', 'swim', 'climb', 'attack', 'hit', 'slash', 'crush', 'bash'],
  dex: ['dodge', 'sneak', 'acrobat', 'balance', 'hide', 'stealth', 'pick', 'sleight', 'dexterity', 'dex', 'initiative', 'bow', 'shoot', 'fire', 'finesse', 'reflex'],
  con: ['endure', 'resist', 'survive', 'withstand', 'tough', 'hold breath', 'constitution', 'con', 'concentration', 'stamina', 'drink'],
  int: ['recall', 'analyze', 'investigate', 'decipher', 'study', 'research', 'history', 'arcana', 'nature', 'religion', 'intelligence', 'int', 'know', 'reason', 'deduce'],
  wis: ['perceive', 'insight', 'sense', 'notice', 'track', 'survival', 'medicine', 'animal', 'perception', 'wisdom', 'wis', 'listen', 'spot', 'detect', 'heal'],
  cha: ['persuade', 'intimidate', 'deceive', 'perform', 'charm', 'bluff', 'lie', 'convince', 'charisma', 'cha', 'talk', 'speak', 'negotiate', 'sing', 'dance']
};

export function detectStat(action: string): StatType {
  const lowerAction = action.toLowerCase();
  
  // Check for explicit stat mentions first or strong keywords
  for (const [stat, keywords] of Object.entries(STAT_KEYWORDS)) {
    for (const keyword of keywords) {
      // Simple inclusion check
      if (lowerAction.includes(keyword)) {
        // Special case: "climb" is usually Str (Athletics), but "climb walls" might be spider climb? No, stick to 5e rules.
        // Special case: "attack" is Str, but "attack with bow" should be Dex.
        if (keyword === 'attack' || keyword === 'hit') {
            if (lowerAction.includes('bow') || lowerAction.includes('crossbow') || lowerAction.includes('dagger') || lowerAction.includes('finesse')) {
                return 'dex';
            }
        }
        return stat as StatType;
      }
    }
  }
  
  // Default to STR if ambiguous as it's the default for basic attacks/interactions
  return 'str';
}