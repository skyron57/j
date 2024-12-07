import { v4 as uuidv4 } from 'uuid';

export interface WorkshopJob {
  id: string;
  name: string;
  description: string;
  emoji: string;
  actionPoints: number;
  minReward: number;
  maxReward: number;
}

export const WORKSHOP_JOBS: WorkshopJob[] = [
  {
    id: 'cleaning',
    name: 'Nettoyage',
    description: 'Nettoyer les couloirs de la prison',
    emoji: '🧹',
    actionPoints: 2,
    minReward: 3,
    maxReward: 7
  },
  {
    id: 'assembly',
    name: 'Assemblage',
    description: 'Assembler des objets simples',
    emoji: '🔧',
    actionPoints: 4,
    minReward: 5,
    maxReward: 10
  },
  {
    id: 'furniture',
    name: 'Réparation',
    description: 'Réparer les meubles',
    emoji: '🪑',
    actionPoints: 6,
    minReward: 8,
    maxReward: 15
  },
  {
    id: 'kitchen',
    name: 'Cuisine',
    description: 'Préparer les repas',
    emoji: '🍳',
    actionPoints: 8,
    minReward: 12,
    maxReward: 20
  },
  {
    id: 'recycling',
    name: 'Recyclage',
    description: 'Trier les déchets',
    emoji: '♻️',
    actionPoints: 10,
    minReward: 15,
    maxReward: 25
  }
];
