export interface WorkshopTask {
  id: string;
  name: string;
  description: string;
  requiredClicks: number;
  minReward: number;
  maxReward: number;
  icon: string;
  unlockedByDefault?: boolean;
}

export interface TaskProgress {
  clicks: number;
  completed: boolean;
  lastUpdate?: string;
  percentage?: number;
}

export const WORKSHOP_TASKS: WorkshopTask[] = [
  {
    id: 'cleaning',
    name: 'Nettoyage des couloirs',
    description: 'Balayer et nettoyer les couloirs de la prison.',
    requiredClicks: 20,
    minReward: 3,
    maxReward: 7,
    icon: '🧹',
    unlockedByDefault: true
  },
  {
    id: 'assembly',
    name: 'Assemblage d\'objets',
    description: 'Assembler des objets simples (jouets, stylos).',
    requiredClicks: 40,
    minReward: 5,
    maxReward: 10,
    icon: '🔧'
  },
  {
    id: 'furniture',
    name: 'Réparation de meubles',
    description: 'Réparer des chaises, tables ou lits dans les cellules.',
    requiredClicks: 60,
    minReward: 8,
    maxReward: 15,
    icon: '🪑'
  },
  {
    id: 'kitchen',
    name: 'Cuisine',
    description: 'Aider à préparer les repas pour les autres détenus.',
    requiredClicks: 80,
    minReward: 12,
    maxReward: 20,
    icon: '🍳'
  },
  {
    id: 'recycling',
    name: 'Tri des déchets',
    description: 'Trier les déchets recyclables pour l\'environnement.',
    requiredClicks: 100,
    minReward: 20,
    maxReward: 30,
    icon: '♻️'
  }
];
