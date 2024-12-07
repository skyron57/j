export interface InventoryItem {
  id: string;
  name: string;
  category: 'weapon' | 'defense' | 'material' | 'consumable';
  description: string;
  emoji: string;
  rarity: number;
  quantity: number;
  craftable: boolean;
  effect?: {
    type: 'health' | 'actionPoints' | 'anabolic' | 'revive';
    value: number;
  };
}

export const PRISON_ITEMS: Record<string, Omit<InventoryItem, 'id' | 'quantity'>> = {
  bandage: {
    name: 'Bandage',
    category: 'consumable',
    description: 'Un bandage stérile pour les blessures moyennes.',
    emoji: '🩹',
    rarity: 15,
    craftable: false,
    effect: {
      type: 'health',
      value: 10
    }
  },
  compress: {
    name: 'Compresse',
    category: 'consumable',
    description: 'Une compresse stérile pour les petites blessures.',
    emoji: '🩹',
    rarity: 10,
    craftable: false,
    effect: {
      type: 'health',
      value: 5
    }
  },
  syringe: {
    name: 'Seringue',
    category: 'consumable',
    description: 'Une seringue stérile pour les blessures graves.',
    emoji: '💉',
    rarity: 20,
    craftable: false,
    effect: {
      type: 'health',
      value: 15
    }
  },
  energyDrink: {
    name: 'Boisson énergisante',
    category: 'consumable',
    description: 'Restaure immédiatement des points d\'action.',
    emoji: '🥤',
    rarity: 15,
    craftable: false,
    effect: {
      type: 'actionPoints',
      value: 5
    }
  },
  anabolic: {
    name: 'Anabolisant',
    category: 'consumable',
    description: 'Augmente temporairement la limite de points d\'action.',
    emoji: '💉',
    rarity: 25,
    craftable: false,
    effect: {
      type: 'anabolic',
      value: 1
    }
  },
  revive: {
    name: 'Réveil',
    category: 'consumable',
    description: 'Permet de sortir du coma plus rapidement.',
    emoji: '⏰',
    rarity: 30,
    craftable: false,
    effect: {
      type: 'revive',
      value: 1
    }
  }
};
