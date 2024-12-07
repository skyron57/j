import { WORKSHOP_JOBS } from '../types/jobs';
import { TRAINING_EXERCISES } from '../types/training';
import { useGameState } from '../contexts/GameStateContext';
import { LOCATIONS } from '../data/locations';
import { GuardService } from '../services/guard';
import { PrisonerService } from '../services/prisoner';
import { GuardDisplay } from './GuardDisplay';
import { PrisonerDisplay } from './PrisonerDisplay';
import { TrainingPanel } from './TrainingPanel';
import { WorkshopPanel } from './WorkshopPanel';
import { DealerShop } from './DealerShop';

export interface LocationAction {
  name: string;
  description: string;
  cost: number;
  type?: 'basic' | 'workshop' | 'training';
}

export interface Location {
  title: string;
  description: string;
  image: string;
  emoji: string;
  actions: LocationAction[];
  specialComponent?: 'workshop' | 'training' | 'dealer' | 'nurse';
  npc?: {
    name: string;
    emoji: string;
    dialog: string[];
  };
}

export const LOCATIONS: Record<string, Location> = {
  cell: {
    title: 'Cellule',
    description: 'Votre cellule personnelle, un espace restreint mais familier.',
    image: 'https://i.goopics.net/xefe24.png',
    emoji: '🔒',
    actions: [
      {
        name: 'Fouiller',
        description: 'Chercher des objets cachés',
        cost: 2,
        type: 'basic'
      },
      {
        name: 'Se reposer',
        description: 'Récupérer des points de vie',
        cost: 3,
        type: 'basic'
      }
    ]
  },
  yard: {
    title: 'Cour',
    description: 'La cour de la prison, où les détenus peuvent prendre l\'air.',
    image: 'https://i.goopics.net/rma7wg.png',
    emoji: '🏃',
    actions: [
      {
        name: 'Exercice',
        description: 'Améliorer sa condition physique',
        cost: 3,
        type: 'basic'
      },
      {
        name: 'Observer',
        description: 'Surveiller les autres détenus',
        cost: 1,
        type: 'basic'
      }
    ]
  },
  gym: {
    title: 'Salle de sport',
    description: 'L\'odeur de rouille et de sueur imprègne l\'air. Les poids s\'entrechoquent au rythme des respirations.',
    image: 'https://i.goopics.net/ujgrct.png',
    emoji: '🏋️',
    actions: TRAINING_EXERCISES.map(exercise => ({
      name: exercise.name,
      description: exercise.description,
      cost: exercise.actionPoints,
      type: 'training'
    })),
    specialComponent: 'training'
  },
  workshop: {
    title: 'Atelier',
    description: 'L\'atelier de la prison, où les détenus travaillent.',
    image: 'https://i.goopics.net/6pdv6p.png',
    emoji: '🔧',
    actions: WORKSHOP_JOBS.map(job => ({
      name: job.name,
      description: job.description,
      cost: job.actionPoints,
      type: 'workshop'
    })),
    specialComponent: 'workshop'
  },
  infirmary: {
    title: 'Infirmerie',
    description: 'L\'infirmerie de la prison, où les blessés sont soignés.',
    image: 'https://i.goopics.net/jl68nj.png',
    emoji: '🏥',
    actions: [
      {
        name: 'Se soigner',
        description: 'Récupérer des points de vie',
        cost: 5,
        type: 'basic'
      }
    ],
    specialComponent: 'nurse',
    npc: {
      name: 'Infirmière Sarah',
      emoji: '👩‍⚕️',
      dialog: [
        "Bonjour, je peux vous aider ?",
        "Laissez-moi examiner vos blessures.",
        "Le repos est le meilleur des remèdes.",
        "N'hésitez pas à venir me voir si vous êtes blessé."
      ]
    }
  },
  showers: {
    title: 'Douches',
    description: 'Les douches communes, un endroit dangereux.',
    image: 'https://i.goopics.net/3alrcx.png',
    emoji: '🚿',
    actions: [
      {
        name: 'Se laver',
        description: 'Améliorer son hygiène',
        cost: 2,
        type: 'basic'
      }
    ]
  },
  kitchen: {
    title: 'Cuisine',
    description: 'La cuisine de la prison, où sont préparés les repas.',
    image: 'https://i.goopics.net/qq9ax1.png',
    emoji: '🍳',
    actions: [
      {
        name: 'Travailler',
        description: 'Gagner de l\'argent',
        cost: 4,
        type: 'basic'
      }
    ]
  },
  guard: {
    title: 'Poste de garde',
    description: 'Le poste des gardiens, une zone à haut risque.',
    image: 'https://i.goopics.net/f14txf.png',
    emoji: '👮',
    actions: [],
    specialComponent: 'dealer'
  },
  director: {
    title: 'Bureau du directeur',
    description: 'Le bureau du directeur de la prison. Un endroit dangereux mais qui peut rapporter gros.',
    image: 'https://i.goopics.net/n7nih4.png',
    emoji: '👔',
    actions: [
      {
        name: 'Fouiller le bureau',
        description: 'Chercher des objets de valeur',
        cost: 10,
        type: 'basic'
      },
      {
        name: 'Voler des documents',
        description: 'Récupérer des informations compromettantes',
        cost: 15,
        type: 'basic'
      }
    ]
  }
};
