import { db } from '../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { MentalState, MentalStatus, MentalEvent } from '../types/mental';
import { v4 as uuidv4 } from 'uuid';

export const MentalService = {
  calculateMentalState(status: MentalStatus): MentalState {
    const { stress, fatigue, sanity } = status;
    
    if (sanity < 20) return 'hallucinating';
    if (stress > 80) return 'breaking';
    if (stress > 60 || fatigue > 80) return 'unstable';
    if (stress > 40 || fatigue > 60) return 'stressed';
    return 'stable';
  },

  calculateEffects(state: MentalState): MentalStatus['effects'] {
    switch (state) {
      case 'hallucinating':
        return {
          combatPenalty: -50,
          socialPenalty: -50,
          perceptionBonus: 20,
          hallucinationChance: 80
        };
      case 'breaking':
        return {
          combatPenalty: -30,
          socialPenalty: -40,
          perceptionBonus: 10,
          hallucinationChance: 40
        };
      case 'unstable':
        return {
          combatPenalty: -20,
          socialPenalty: -20,
          perceptionBonus: 5,
          hallucinationChance: 20
        };
      case 'stressed':
        return {
          combatPenalty: -10,
          socialPenalty: -10,
          perceptionBonus: 0,
          hallucinationChance: 5
        };
      default:
        return {
          combatPenalty: 0,
          socialPenalty: 0,
          perceptionBonus: 0,
          hallucinationChance: 0
        };
    }
  },

  async updateMentalStatus(userId: string, changes: Partial<MentalStatus>): Promise<void> {
    const userRef = doc(db, 'users', userId);
    const userData = (await getDoc(userRef)).data();
    
    const currentStatus = userData.mentalStatus as MentalStatus;
    const newStatus: MentalStatus = {
      ...currentStatus,
      ...changes,
      state: this.calculateMentalState({ ...currentStatus, ...changes }),
      effects: this.calculateEffects(this.calculateMentalState({ ...currentStatus, ...changes }))
    };

    await updateDoc(userRef, { mentalStatus: newStatus });
  },

  async addMentalEvent(userId: string, event: Omit<MentalEvent, 'id' | 'createdAt'>): Promise<void> {
    const userRef = doc(db, 'users', userId);
    
    const mentalEvent: MentalEvent = {
      id: uuidv4(),
      ...event,
      createdAt: new Date().toISOString()
    };

    await updateDoc(userRef, {
      mentalEvents: [{
        ...mentalEvent,
        expiresAt: new Date(Date.now() + event.duration * 1000).toISOString()
      }]
    });

    // Update mental status based on event
    await this.updateMentalStatus(userId, {
      stress: event.type === 'stress' ? event.impact : 0,
      trauma: event.type === 'trauma' ? event.impact : 0,
      sanity: event.type === 'hallucination' ? -event.impact : 0
    });
  }
};
