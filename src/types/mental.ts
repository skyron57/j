export type MentalState = 'stable' | 'stressed' | 'unstable' | 'breaking' | 'hallucinating';

export interface MentalStatus {
  state: MentalState;
  stress: number;
  fatigue: number;
  sanity: number;
  trauma: number;
  lastRest: string;
  effects: {
    combatPenalty: number;
    socialPenalty: number;
    perceptionBonus: number;
    hallucinationChance: number;
  };
}

export interface MentalEvent {
  id: string;
  type: 'stress' | 'trauma' | 'recovery' | 'hallucination';
  description: string;
  impact: number;
  duration: number;
  createdAt: string;
}
