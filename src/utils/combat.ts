export function calculateDamage(
  attackerStats: {
    strength: number;
    attack: number;
    weaponBonus?: number;
  },
  defenderStats: {
    defense: number;
    dodge: number;
  }
): {
  damage: number;
  isCritical: boolean;
  isDodged: boolean;
} {
  // Define base chances
  const BASE_DODGE_CHANCE = 0.05;
  const BASE_CRITICAL_CHANCE = 0.05;

  // Calculate dodge chance and check if attack is dodged
  const dodgeChance = Math.min(BASE_DODGE_CHANCE + defenderStats.dodge * 0.01, 0.5);
  if (Math.random() < dodgeChance) {
    return { damage: 0, isCritical: false, isDodged: true };
  }

  // Calculate critical hit chance
  const criticalChance = Math.min(BASE_CRITICAL_CHANCE + attackerStats.attack * 0.01, 0.5);
  const isCritical = Math.random() < criticalChance;

  // Calculate base damage
  const baseDamage = attackerStats.strength + (attackerStats.weaponBonus || 0);

  // Calculate defense reduction
  const defenseReductionFactor = 0.25 + Math.random() * 0.5;
  const defenseReduction = defenderStats.defense * defenseReductionFactor;

  // Calculate damage variability factor
  const variabilityFactor = 0.85 + Math.random() * 0.3;

  // Calculate final damage
  let finalDamage = Math.max(1, Math.floor((baseDamage - defenseReduction) * variabilityFactor));

  // Apply critical hit multiplier
  if (isCritical) {
    const criticalMultiplier = 1.5 + Math.random() * 0.5;
    finalDamage = Math.floor(finalDamage * criticalMultiplier);
  }

  // Return the result
  return {
    damage: finalDamage,
    isCritical,
    isDodged: false
  };
}
