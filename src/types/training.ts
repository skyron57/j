export interface Exercise {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: TrainingCategory;
  actionPoints: number;
  minXp: number;
  maxXp: number;
}

export type TrainingCategory = 'attack' | 'defense' | 'dodge' | 'skill';

export interface CategoryProgress {
  clicks: number;
  xp: number;
  clicksRequired: number;
  limitReached: boolean;
  lastUpdated: string;
}

export interface TrainingProgress {
  attack: CategoryProgress;
  defense: CategoryProgress;
  dodge: CategoryProgress;
  skill: CategoryProgress;
}

export const TRAINING_EXERCISES: Exercise[] = [
  {
    id: 'weightlifting',
    name: 'Musculation',
    description: 'Augmente la puissance de frappe',
    emoji: '🏋️',
    category: 'attack',
    actionPoints: 2,
    minXp: 1,
    maxXp: 3
  },
  {
    id: 'boxing',
    name: 'Boxe',
    description: 'Améliore la précision des coups',
    emoji: '🥊',
    category: 'attack',
    actionPoints: 3,
    minXp: 2,
    maxXp: 4
  },
  {
    id: 'punching-bag',
    name: 'Sac de frappe',
    description: 'Renforce les frappes',
    emoji: '🎯',
    category: 'attack',
    actionPoints: 4,
    minXp: 3,
    maxXp: 5
  },
  {
    id: 'pushups',
    name: 'Pompes',
    description: 'Améliore la défense',
    emoji: '💪',
    category: 'defense',
    actionPoints: 2,
    minXp: 1,
    maxXp: 3
  },
  {
    id: 'blocking',
    name: 'Blocage',
    description: 'Techniques de défense',
    emoji: '🛡️',
    category: 'defense',
    actionPoints: 3,
    minXp: 2,
    maxXp: 4
  },
  {
    id: 'agility',
    name: 'Agilité',
    description: 'Améliore l\'esquive',
    emoji: '🏃',
    category: 'dodge',
    actionPoints: 2,
    minXp: 1,
    maxXp: 3
  },
  {
    id: 'footwork',
    name: 'Jeu de jambes',
    description: 'Techniques d\'esquive',
    emoji: '👣',
    category: 'dodge',
    actionPoints: 3,
    minXp: 2,
    maxXp: 4
  },
  {
    id: 'technique',
    name: 'Technique',
    description: 'Améliore les compétences',
    emoji: '🎯',
    category: 'skill',
    actionPoints: 2,
    minXp: 1,
    maxXp: 3
  }
];
