export function calculateTotalLevel(stats: {
  strength: number;
  defense: number;
  agility: number;
  dodge: number;
}): number {
  return stats.strength + stats.defense + stats.agility + stats.dodge;
}

export function isWithinLevelRange(playerLevel: number, targetLevel: number): boolean {
  return Math.abs(playerLevel - targetLevel) <= 6;
}

export function getLevelRangeMessage(playerLevel: number): string {
  const minLevel = Math.max(0, playerLevel - 6);
  const maxLevel = playerLevel + 6;
  return `Vous pouvez interagir avec les niveaux ${minLevel} à ${maxLevel}`;
}
