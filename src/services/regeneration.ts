import { db } from '../firebase';
import { ref, update, get } from 'firebase/database';

const HEALTH_REGEN_PER_MINUTE = 1;
const AP_REGEN_PER_MINUTE = 1; // Augmenté à 2 PA par minute
const MP_REGEN_PER_MINUTE = 2;

export class RegenerationService {
  // Méthode pour calculer la régénération en cas de déconnexion
  static async calculateOfflineRegeneration(userId: string): Promise<{
    health: number;
    actionPoints: number;
    movementPoints: number;
    lastUpdate: string;
  }> {
    try {
      const userRef = ref(db, 'users/' + userId);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        throw new Error('User not found');
      }

      const userData = snapshot.val();
      const lastUpdate = new Date(userData.lastUpdate || userData.createdAt);
      const now = new Date();
      const minutesOffline = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60));

      // Ne pas régénérer les PA si en cellule
      const shouldRegenAP = userData.location !== 'cell';

      // Vérification de l'état de l'anabolique
      let maxAP = 20;
      if (userData.activeAnabolic?.endTime) {
        const anabolicEndTime = new Date(userData.activeAnabolic.endTime);
        if (now < anabolicEndTime) {
          maxAP = 30; // Anabolique encore actif
        } else {
          // Si l'anabolique est terminé, le retirer
          await update(userRef, { activeAnabolic: null });
        }
      }

      // Calcul des nouvelles valeurs
      const newHealth = Math.min(100, userData.health + (minutesOffline * HEALTH_REGEN_PER_MINUTE));
      const newAP = shouldRegenAP ? Math.min(maxAP, userData.actionPoints + (minutesOffline * AP_REGEN_PER_MINUTE)) : userData.actionPoints;
      const newMP = Math.min(10, userData.movementPoints + (minutesOffline * MP_REGEN_PER_MINUTE));

      // Mise à jour des valeurs dans la base de données
      await update(userRef, {
        health: newHealth,
        actionPoints: newAP,
        movementPoints: newMP,
        lastUpdate: now.toISOString()
      });

      return {
        health: newHealth,
        actionPoints: newAP,
        movementPoints: newMP,
        lastUpdate: now.toISOString() // Retourne la dernière mise à jour
      };
    } catch (error) {
      console.error('Error calculating offline regeneration:', error);
      throw error;
    }
  }

  // Méthode pour mettre à jour l'heure de la dernière synchronisation
  static async updateLastSyncTime(userId: string): Promise<void> {
    try {
      const userRef = ref(db, 'users/' + userId);
      await update(userRef, {
        lastUpdate: new Date().toISOString() // Mise à jour de l'heure de la dernière synchronisation
      });
    } catch (error) {
      console.error('Error updating last sync time:', error);
      throw error;
    }
  }
}
