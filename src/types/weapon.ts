import { v4 as uuidv4 } from 'uuid';

export interface Weapon {
  id: string;
  name: string;
  type: 'weapon';
  stats: {
    attack: number;
    defense: number;
    agility: number;
    dodge: number;
  };
  durability: {
    current: number;
    max: number;
  };
  rarity: number;
  locations: string[];
  deathMessage: string;
  emoji: string;
  description: string;
  equipped?: boolean;
}

export const PRISON_WEAPONS: Record<string, Omit<Weapon, 'id' | 'equipped'>> = {
  stick: {
    name: 'Bâton',
    type: 'weapon',
    stats: {
      attack: 4,
      defense: 2,
      agility: 1,
      dodge: -1
    },
    durability: {
      current: 100,
      max: 100
    },
    rarity: 30,
    locations: ['yard', 'workshop'],
    deathMessage: '[killer] a tabassé [victim] avec un bâton!',
    emoji: '🏏',
    description: 'Un bâton solide trouvé dans la cour'
  },
  shiv: {
    name: 'Couteau artisanal',
    type: 'weapon',
    stats: {
      attack: 6,
      defense: 0,
      agility: 2,
      dodge: -2
    },
    durability: {
      current: 50,
      max: 50
    },
    rarity: 45,
    locations: ['workshop', 'kitchen'],
    deathMessage: '[killer] a égorgé [victim] avec un couteau artisanal!',
    emoji: '🔪',
    description: 'Une lame rudimentaire mais mortelle'
  },
  chain: {
    name: 'Chaîne',
    type: 'weapon',
    stats: {
      attack: 5,
      defense: 3,
      agility: -1,
      dodge: -2
    },
    durability: {
      current: 150,
      max: 150
    },
    rarity: 35,
    locations: ['workshop', 'yard'],
    deathMessage: '[killer] a étranglé [victim] avec une chaîne!',
    emoji: '⛓️',
    description: 'Une chaîne en métal lourde'
  },
  dumbbell: {
    name: 'Haltère cassée',
    type: 'weapon',
    stats: {
      attack: 8,
      defense: 1,
      agility: -2,
      dodge: -3
    },
    durability: {
      current: 75,
      max: 75
    },
    rarity: 40,
    locations: ['gym'],
    deathMessage: '[killer] a écrasé le crâne de [victim] avec une haltère!',
    emoji: '🏋️',
    description: 'Une arme lourde et dévastatrice'
  },
  baton: {
    name: 'Matraque volée',
    type: 'weapon',
    stats: {
      attack: 7,
      defense: 4,
      agility: 1,
      dodge: -1
    },
    durability: {
      current: 200,
      max: 200
    },
    rarity: 50,
    locations: ['guard'],
    deathMessage: '[killer] a mis KO [victim] avec une matraque volée!',
    emoji: '🏏',
    description: 'Une matraque de garde "empruntée"'
  }
};

// Function to check if a weapon is broken
export function isWeaponBroken(weapon: Weapon): boolean {
  return weapon.durability.current <= 0;
}

// Function to damage a weapon
export function damageWeapon(weapon: Weapon, amount: number): Weapon {
  const newDurability = Math.max(0, weapon.durability.current - amount);
  
  return {
    ...weapon,
    durability: {
      ...weapon.durability,
      current: newDurability
    }
  };
}

// Function to repair a weapon
export function repairWeapon(weapon: Weapon, amount: number): Weapon {
  const newDurability = Math.min(
    weapon.durability.max,
    weapon.durability.current + amount
  );
  
  return {
    ...weapon,
    durability: {
      ...weapon.durability,
      current: newDurability
    }
  };
}
