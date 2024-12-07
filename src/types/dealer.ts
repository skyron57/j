export interface WeaponStock {
  id: string;
  weaponId: string;
  quantity: number;
  price: number;
  expiresAt: string;
}

export interface Dealer {
  id: string;
  name: string;
  currentLocation: string;
  lastMove: string;
  stock: WeaponStock[];
}

export interface PrisonWeapon {
  id: string;
  name: string;
  description: string;
  stats: {
    attack: number;
    defense: number;
    skill: number;
    dodge: number;
  };
  price: {
    min: number;
    max: number;
  };
  maxQuantity: number;
  deathMessage: string;
  emoji: string;
}

export const PRISON_WEAPONS: Record<string, PrisonWeapon> = {
  fryingPan: {
    id: 'fryingPan',
    name: 'Poêle en Fer',
    description: 'Solide et lourde, idéale pour assommer.',
    stats: {
      attack: 7,
      defense: 3,
      skill: 2,
      dodge: 1
    },
    price: {
      min: 700,
      max: 900
    },
    maxQuantity: 15,
    deathMessage: '{killer} t\'a assommé avec une poêle en fer!',
    emoji: '🍳'
  },
  metalBrush: {
    id: 'metalBrush',
    name: 'Brosse Métallique',
    description: 'Parfaite pour gratter... ou infliger des dégâts.',
    stats: {
      attack: 6,
      defense: 4,
      skill: 3,
      dodge: 0
    },
    price: {
      min: 500,
      max: 700
    },
    maxQuantity: 20,
    deathMessage: '{killer} t\'a lacéré avec une brosse métallique!',
    emoji: '🧹'
  },
  showerBar: {
    id: 'showerBar',
    name: 'Barre de Douche',
    description: 'Discrète mais redoutable au corps à corps.',
    stats: {
      attack: 8,
      defense: 2,
      skill: 1,
      dodge: 2
    },
    price: {
      min: 900,
      max: 1100
    },
    maxQuantity: 10,
    deathMessage: '{killer} t\'a frappé avec une barre de douche!',
    emoji: '🚿'
  },
  reinforcedBelt: {
    id: 'reinforcedBelt',
    name: 'Ceinture Renforcée',
    description: 'Peut aussi servir de fouet improvisé.',
    stats: {
      attack: 5,
      defense: 6,
      skill: 2,
      dodge: 3
    },
    price: {
      min: 1000,
      max: 1400
    },
    maxQuantity: 10,
    deathMessage: '{killer} t\'a fouetté avec une ceinture renforcée!',
    emoji: '👔'
  },
  gymBook: {
    id: 'gymBook',
    name: 'Livre de Musculation',
    description: 'Épais et lourd, idéal pour cogner.',
    stats: {
      attack: 9,
      defense: 3,
      skill: 0,
      dodge: 1
    },
    price: {
      min: 1300,
      max: 1700
    },
    maxQuantity: 5,
    deathMessage: '{killer} t\'a assommé avec un livre de musculation!',
    emoji: '📚'
  }
};
