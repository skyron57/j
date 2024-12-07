import { v4 as uuidv4 } from 'uuid';
import { PRISON_WEAPONS } from './weapon';

export interface CraftingRecipe {
  id: string;
  name: string;
  description: string;
  emoji: string;
  stats: {
    attack: number;
    defense: number;
    agility: number;
    dodge: number;
  };
  materials: Array<{
    itemId: string;
    name: string;
    quantity: number;
    emoji: string;
  }>;
  result: {
    weaponId: keyof typeof PRISON_WEAPONS;
    quantity: number;
  };
  location: string;
}

export interface Material {
  id: string;
  name: string;
  description: string;
  emoji: string;
  rarity: number;
  locations: string[];
}

export const CRAFTING_MATERIALS: Record<string, Material> = {
  ferBlanc: {
    id: 'ferBlanc',
    name: 'Fer-blanc',
    description: 'Métal récupéré sur des objets usagés, idéal pour renforcer les armes.',
    emoji: '🛠',
    rarity: 30,
    locations: ['kitchen', 'workshop', 'cell']
  },
  cle: {
    id: 'cle',
    name: 'Clé',
    description: 'Une vieille clé rouillée, souvent abandonnée.',
    emoji: '🔩',
    rarity: 40,
    locations: ['director', 'gym']
  },
  hache: {
    id: 'hache',
    name: 'Hache',
    description: 'Hache abandonnée, parfait pour être modifiée.',
    emoji: '🪓',
    rarity: 50,
    locations: ['gym', 'yard']
  },
  marteau: {
    id: 'marteau',
    name: 'Marteau',
    description: 'Marteau trouvé dans les ateliers.',
    emoji: '🔨',
    rarity: 45,
    locations: ['workshop', 'director']
  },
  cleAMolette: {
    id: 'cleAMolette',
    name: 'Clé à molette',
    description: 'Clé métallique pouvant être utilisée comme massue.',
    emoji: '🔧',
    rarity: 35,
    locations: ['gym', 'kitchen']
  },
  scie: {
    id: 'scie',
    name: 'Scie',
    description: 'Scie à main cassée mais encore utile pour fabriquer des armes.',
    emoji: '🪚',
    rarity: 45,
    locations: ['workshop', 'cell']
  },
  couteau: {
    id: 'couteau',
    name: 'Couteau de cuisine',
    description: 'Couteau trouvé dans la cuisine.',
    emoji: '🔪',
    rarity: 50,
    locations: ['kitchen', 'director']
  },
  fourchette: {
    id: 'fourchette',
    name: 'Fourchette',
    description: 'Fourchette cassée ou tordue, idéale pour les modifications.',
    emoji: '🍴',
    rarity: 25,
    locations: ['kitchen', 'cell']
  },
  cleMetal: {
    id: 'cleMetal',
    name: 'Clé en métal',
    description: 'Clé métallique robuste, utile pour forger des armes.',
    emoji: '🦷',
    rarity: 40,
    locations: ['director', 'cell']
  },
  cuillere: {
    id: 'cuillere',
    name: 'Cuillère',
    description: 'Cuillère à soupe inutilisable mais pouvant être modifiée.',
    emoji: '🥄',
    rarity: 20,
    locations: ['kitchen', 'gym']
  },
  corde: {
    id: 'corde',
    name: 'Corde',
    description: 'Bout de corde solide, utile pour les modifications d\'armes.',
    emoji: '🪢',
    rarity: 30,
    locations: ['yard', 'gym', 'workshop']
  }
};

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    id: 'fourchetteModifiee',
    name: 'Fourchette modifiée',
    description: 'Fourchette tordue en lame tranchante.',
    emoji: '🍴',
    stats: {
      attack: 10,
      defense: 0,
      agility: 3,
      dodge: 0
    },
    materials: [
      { itemId: 'fourchette', name: 'Fourchette', quantity: 1, emoji: '🍴' },
      { itemId: 'ferBlanc', name: 'Fer-blanc', quantity: 1, emoji: '🛠' },
      { itemId: 'corde', name: 'Corde', quantity: 1, emoji: '🪢' }
    ],
    result: {
      weaponId: 'fourchetteModifiee',
      quantity: 1
    },
    location: 'kitchen'
  },
  {
    id: 'couteauCuisine',
    name: 'Couteau de cuisine',
    description: 'Couteau aiguisé volé dans la cuisine.',
    emoji: '🔪',
    stats: {
      attack: 7,
      defense: 0,
      agility: 3,
      dodge: -1
    },
    materials: [
      { itemId: 'couteau', name: 'Couteau', quantity: 1, emoji: '🔪' },
      { itemId: 'ferBlanc', name: 'Fer-blanc', quantity: 1, emoji: '🛠' }
    ],
    result: {
      weaponId: 'couteauCuisine',
      quantity: 1
    },
    location: 'kitchen'
  },
  {
    id: 'cleMetal',
    name: 'Clé en métal',
    description: 'Clé usée transformée en couteau.',
    emoji: '🦷',
    stats: {
      attack: 9,
      defense: 1,
      agility: 4,
      dodge: 0
    },
    materials: [
      { itemId: 'cleMetal', name: 'Clé en métal', quantity: 1, emoji: '🦷' },
      { itemId: 'ferBlanc', name: 'Fer-blanc', quantity: 1, emoji: '🛠' }
    ],
    result: {
      weaponId: 'cleMetal',
      quantity: 1
    },
    location: 'kitchen'
  },
  {
    id: 'scieMain',
    name: 'Scie à main',
    description: 'Scie usagée modifiée pour couper rapidement.',
    emoji: '🪚',
    stats: {
      attack: 10,
      defense: 1,
      agility: 1,
      dodge: 1
    },
    materials: [
      { itemId: 'scie', name: 'Scie', quantity: 1, emoji: '🪚' },
      { itemId: 'ferBlanc', name: 'Fer-blanc', quantity: 1, emoji: '🛠' },
      { itemId: 'corde', name: 'Corde', quantity: 1, emoji: '🪢' }
    ],
    result: {
      weaponId: 'scieMain',
      quantity: 1
    },
    location: 'kitchen'
  },
  {
    id: 'hachetteDefortune',
    name: 'Hachette de fortune',
    description: 'Hachette trouvée et améliorée.',
    emoji: '🪓',
    stats: {
      attack: 15,
      defense: 0,
      agility: 2,
      dodge: -2
    },
    materials: [
      { itemId: 'hache', name: 'Hache', quantity: 1, emoji: '🪓' },
      { itemId: 'corde', name: 'Corde', quantity: 2, emoji: '🪢' }
    ],
    result: {
      weaponId: 'hachetteDefortune',
      quantity: 1
    },
    location: 'kitchen'
  }
];
