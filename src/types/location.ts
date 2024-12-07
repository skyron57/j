import { Guard } from './guard';
import { PrisonerBot } from './prisoner';

export interface LocationNPC {
  name: string;
  emoji: string;
  dialog: string[];
}

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
  npc?: LocationNPC;
}

export interface LocationState {
  guards: Guard[];
  prisoners: PrisonerBot[];
  loading: boolean;
  error: string | null;
}

export type ActionType = 'attack' | 'steal' | 'heal';

export interface ActionConfig {
  actionPoints: number;
  description: string;
}
