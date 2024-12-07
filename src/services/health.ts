import { db } from '../firebase'; // Assurez-vous que la configuration de Realtime Database est correcte
import { ref, update, get } from 'firebase/database';

export const HealthService = {
  async updateHealth(userId: string, newHealth: number): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      const userRef = ref(db, `users/${userId}`);
      const userSnapshot = await get(userRef);
      
      if (!userSnapshot.exists()) {
        throw new Error('User not found');
      }

      const health = Math.max(0, Math.min(100, newHealth));
      const inComa = health <= 0;

      await update(userRef, {
        health,
        inComa,
        comaStartTime: inComa ? new Date().toISOString() : null,
        location: inComa ? 'infirmary' : userSnapshot.val().location,
        lastSync: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating health:', error);
      throw error;
    }
  },

  async checkComaStatus(userId: string): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      const userRef = ref(db, `users/${userId}`);
      const userSnapshot = await get(userRef);
      
      if (!userSnapshot.exists()) {
        throw new Error('User not found');
      }

      const userData = userSnapshot.val();
      if (!userData.inComa || !userData.comaStartTime) return;

      const comaStart = new Date(userData.comaStartTime).getTime();
      const now = Date.now();
      const elapsed = now - comaStart;
      const comaDuration = userData.hasRevive ? 30 * 60 * 1000 : 2 * 60 * 60 * 1000;

      if (elapsed >= comaDuration) {
        await update(userRef, {
          health: 20,
          inComa: false,
          comaStartTime: null,
          hasRevive: false,
          location: 'infirmary',
          lastSync: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error checking coma status:', error);
      throw error;
    }
  }
};
