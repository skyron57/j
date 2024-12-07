import { v4 as uuidv4 } from 'uuid';
import { WEAPONS } from './combat';
import { PRISON_WEAPONS } from './weapon';
import { Guard } from './guard';
import { GUARD_BEHAVIORS } from './guardBehavior';
import { Guard, GUARDS } from '../types/guard';
import { calculateTotalLevel } from '../utils/levelGap';
import { GuardManager } from '../services/guard/GuardManager';


export type HealthStatus = 'Excellente' | 'Bonne' | 'Satisfaisante' | 'Mauvaise' | 'Critique';
export type EntityType = 'player' | 'guard' | 'prisoner' | 'dealer' | 'nurse';
export type EntityBehavior = 'aggressive' | 'defensive' | 'patroller' | 'investigator' | 'sentinel' | 'nurse' | 'dealer';

export interface GameEntity {
  id: string;
  type: EntityType;
  username: string;
  level: number;
  health: number;
  stats: {
    attack: number;
    defense: number;
    agility: number;
    dodge: number;
  };
  behavior?: EntityBehavior;
  position: {
    area: string;
    lastMove: number;
    isStatic?: boolean;
  };
  weapon?: typeof WEAPONS[keyof typeof WEAPONS] | typeof PRISON_WEAPONS[keyof typeof PRISON_WEAPONS];
  killMessage?: string;
  defeatMessage?: string;
  isBot: boolean;
  shopItems?: any[];
}

// Static guards with predefined positions
const STATIC_GUARDS: GameEntity[] = [
  {
    id: 'guard-patrol-1',
    type: 'guard',
    username: 'Gardien Mike',
    level: 2,
    health: 300,
    stats: {
      attack: 15,
      defense: 15,
      agility: 10,
      dodge: 10
    },
    behavior: 'patroller',
    position: {
      area: 'yard',
      lastMove: Date.now()
    },
    isBot: true
  },
  {
    id: 'guard-aggressive-1',
    type: 'guard',
    username: 'Gardien John',
    level: 3,
    health: 400,
    stats: {
      attack: 20,
      defense: 20,
      agility: 15,
      dodge: 15
    },
    behavior: 'aggressive',
    position: {
      area: 'cell',
      lastMove: Date.now()
    },
    isBot: true
  },
  {
    id: 'guard-sentinel-1',
    type: 'guard',
    username: 'Gardien Frank',
    level: 4,
    health: 500,
    stats: {
      attack: 25,
      defense: 25,
      agility: 20,
      dodge: 20
    },
    behavior: 'sentinel',
    position: {
      area: 'guard',
      lastMove: Date.now(),
      isStatic: true
    },
    isBot: true
  }
];

// Static entities that are always present
export const STATIC_ENTITIES: GameEntity[] = [
  {
    id: 'le-taulier',
    type: 'dealer',
    username: 'Le Taulier',
    level: 100,
    health: 1000,
    emoji: '🎩',
    stats: { 
      attack: 100, 
      defense: 100, 
      agility: 100, 
      dodge: 100 
    },
    behavior: 'dealer',
    position: { 
      area: 'guard',
      lastMove: Date.now(),
      isStatic: true
    },
    killMessage: 'Le Taulier vous a éliminé avec une arme illégale !',
    defeatMessage: 'Le Taulier : "Tu n\'aurais jamais dû essayer..."',
    isBot: true,
    shopItems: Object.values(PRISON_WEAPONS)
  },
  {
    id: 'nurse-bot',
    type: 'nurse',
    username: 'Infirmière Sarah',
    level: 1,
    health: 200,
    stats: { 
      attack: 2, 
      defense: 8, 
      agility: 5, 
      dodge: 5 
    },
    behavior: 'nurse',
    position: {
      area: 'infirmary',
      lastMove: Date.now(),
      isStatic: true
    },
    killMessage: 'L\'infirmière Sarah vous a mis K.O. avec une seringue tranquillisante !',
    defeatMessage: 'Infirmière Sarah : "La violence ne résout rien, laissez-moi vous soigner."',
    isBot: true
  }
];

// Include static guards and dealer in the prison guards array
export const PRISON_GUARDS: GameEntity[] = STATIC_GUARDS;

// Update ALL_ENTITIES to only include static entities
export const ALL_ENTITIES = [...STATIC_ENTITIES, ...PRISON_GUARDS];

// Export guards for use in GuardManager
export const getGuards = (): GameEntity[] => PRISON_GUARDS;
