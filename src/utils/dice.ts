export interface RollResult {
  total: number;
  rolls: number[];
  modifier: number;
  dieSize: number;
  naturalRoll: number; // The raw die roll (or the one kept after advantage/disadvantage)
  isCriticalSuccess: boolean;
  isCriticalFailure: boolean;
}

export function parseDice(notation: string): number {
  // Simple parser for "d20", "d6", etc.
  const match = notation.match(/^d(\d+)$/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  // Default to d20 if invalid or just a number provided
  const num = parseInt(notation, 10);
  return isNaN(num) ? 20 : num;
}

function random(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function rollDice(sides: number, modifier: number = 0, advantage: boolean = false, disadvantage: boolean = false): RollResult {
  let rolls: number[] = [];
  let naturalRoll: number;

  if (advantage && !disadvantage) {
    const r1 = random(1, sides);
    const r2 = random(1, sides);
    rolls = [r1, r2];
    naturalRoll = Math.max(r1, r2);
  } else if (disadvantage && !advantage) {
    const r1 = random(1, sides);
    const r2 = random(1, sides);
    rolls = [r1, r2];
    naturalRoll = Math.min(r1, r2);
  } else {
    const r1 = random(1, sides);
    rolls = [r1];
    naturalRoll = r1;
  }

  const total = naturalRoll + modifier;
  
  // Critical detection only applies to d20
  const isCriticalSuccess = sides === 20 && naturalRoll === 20;
  const isCriticalFailure = sides === 20 && naturalRoll === 1;

  return {
    total,
    rolls,
    modifier,
    dieSize: sides,
    naturalRoll,
    isCriticalSuccess,
    isCriticalFailure
  };
}

export function checkSuccess(rollResult: RollResult, dc: number): boolean {
  if (rollResult.isCriticalSuccess) return true;
  if (rollResult.isCriticalFailure) return false;
  return rollResult.total >= dc;
}