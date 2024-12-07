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
  deathMessage: string;
  emoji: string;
  description: string;
}

export const WEAPONS: Record<string, Omit<Weapon, 'id'>> = {
  stick: {
    name: 'Bâton',
    type: 'weapon',
    stats: {
      attack: 5,
      defense: 2,
      agility: 2,
      dodge: -1
    },
    deathMessage: '[killer] a défoncé [victim] avec un bâton!',
    emoji: '🏏',
    description: 'Un bâton solide et polyvalent'
  },
  screwdriver: {
    name: 'Tournevis',
    type: 'weapon',
    stats: {
      attack: 10,
      defense: 0,
      agility: 2,
      dodge: -2
    },
    deathMessage: '[killer] a planté [victim] avec un tournevis!',
    emoji: '🪛',
    description: 'Une arme perforante improvisée'
  },
  shiv: {
    name: 'Couteau artisanal',
    type: 'weapon',
    stats: {
      attack: 15,
      defense: 5,
      agility: 5,
      dodge: 0
    },
    deathMessage: '[killer] a égorgé [victim] avec un couteau artisanal!',
    emoji: '🔪',
    description: 'Une lame rudimentaire mais mortelle'
  },
  chain: {
    name: 'Chaîne',
    type: 'weapon',
    stats: {
      attack: 10,
      defense: 3,
      agility: 5,
      dodge: -2
    },
    deathMessage: '[killer] a étranglé [victim] avec une chaîne!',
    emoji: '⛓️',
    description: 'Une chaîne en métal lourde'
  },
  baton: {
    name: 'Matraque volée',
    type: 'weapon',
    stats: {
      attack: 8,
      defense: 4,
      agility: 1,
      dodge: -1
    },
    deathMessage: '[killer] a mis KO [victim] avec une matraque volée!',
    emoji: '🏏',
    description: 'Une matraque de garde "empruntée"'
  },
  brassKnuckles: {
    name: 'Poing américain',
    type: 'weapon',
    stats: {
      attack: 5,
      defense: 0,
      agility: 2,
      dodge: -2
    },
    deathMessage: '[killer] a explosé le visage de [victim] avec un poing américain!',
    emoji: '🥊',
    description: 'Une arme de corps à corps brutale'
  },
  spike: {
    name: 'Pic artisanal',
    type: 'weapon',
    stats: {
      attack: 6,
      defense: 0,
      agility: 0,
      dodge: -3
    },
    deathMessage: '[killer] a transpercé [victim] avec un pic artisanal!',
    emoji: '📌',
    description: 'Une arme perforante mortelle'
  },
  dumbbell: {
    name: 'Haltère cassée',
    type: 'weapon',
    stats: {
      attack: 10,
      defense: 2,
      agility: -2,
      dodge: -2
    },
    deathMessage: '[killer] a écrasé le crâne de [victim] avec une haltère cassée!',
    emoji: '🏋️',
    description: 'Une arme lourde et dévastatrice'
  },
  weightedRope: {
    name: 'Corde avec poids',
    type: 'weapon',
    stats: {
      attack: 10,
      defense: 0,
      agility: -5,
      dodge: -1
    },
    deathMessage: '[killer] a étranglé [victim] avec une corde et un poids!',
    emoji: '🪢',
    description: 'Une arme d\'étranglement efficace'
  },
  clipperBlade: {
    name: 'Lame de tondeuse',
    type: 'weapon',
    stats: {
      attack: 12,
      defense: 0,
      agility: 0,
      dodge: 0
    },
    deathMessage: '[killer] a découpé [victim] en morceaux avec une lame de tondeuse!',
    emoji: '✂️',
    description: 'Une lame affûtée et meurtrière'
  }
};
