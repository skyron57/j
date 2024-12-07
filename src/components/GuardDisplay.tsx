import { db } from '../../firebase';
import { ref, get, update, push } from 'firebase/database';
import { Guard } from '../../types/guard';

const COMA_DURATION = 30 * 60 * 1000; // 30 minutes
const XP_PER_KILL = 5;

export class GuardCombatService {
  static async updateGuardHealth(
    guardId: string, 
    damage: number, 
    attackerId: string,
    attackerName: string
  ): Promise<{
    isDead: boolean;
    newHealth: number;
    counter?: {
      damage: number;
      message: string;
    };
  }> {
    try {
      const guardRef = ref(db, `guards/${guardId}`);
      const snapshot = await get(guardRef);
      
      if (!snapshot.exists()) {
        throw new Error('Guard not found');
      }

      const guard = snapshot.val();
      
      if (guard.inComa) {
        return { isDead: true, newHealth: 0 };
      }

      const currentHealth = Number(guard.health);
      const newHealth = Math.max(0, currentHealth - damage); // Ne pas changer les dégâts en fonction de la santé restante
      const isDead = newHealth <= 0;

      const updates: any = {
        health: newHealth,
        lastUpdate: new Date().toISOString()
      };

      // Si le garde tombe à 0 PV, le mettre en coma
      if (isDead) {
        updates.inComa = true;
        updates.active = false;
        updates.comaStartTime = new Date().toISOString();
        updates.position = {
          ...guard.position,
          area: 'infirmary'
        };

        // Ajouter l'entrée dans la collection des meurtres
        const murderRef = ref(db, 'murders');
        const murderEntry = {
          id: `murder-${Date.now()}`,
          killerId: attackerId,
          killerName: attackerName,
          victimId: guardId,
          victimName: guard.name,
          method: 'Mis dans le coma',
          location: guard.position.area,
          timestamp: new Date().toISOString()
        };

        await push(murderRef, murderEntry);

        // Mettre à jour les stats de l'attaquant
        const attackerRef = ref(db, `users/${attackerId}`);
        const attackerSnapshot = await get(attackerRef);
        
        if (attackerSnapshot.exists()) {
          const attackerData = attackerSnapshot.val();
          const currentStats = attackerData.stats || {};
          const history = attackerData.history || [];

          // Ajouter les points d'XP non distribués et les points bonus pour le kill
          await update(attackerRef, {
            stats: {
              ...currentStats,
              kills: (currentStats.kills || 0) + 1,
              undistributedXP: (currentStats.undistributedXP || 0) + XP_PER_KILL + 2,
              points: (currentStats.points || 0) + 2,
              damageDealt: (currentStats.damageDealt || 0) + damage
            },
            history: [{
              type: 'kill',
              description: `☠️ Vous avez mis ${guard.name} dans le coma! (+${XP_PER_KILL} XP, +2 points)`,
              timestamp: new Date().toISOString()
            }, ...history.slice(0, 49)]
          });
        }

        // Planifier la réanimation après 30 minutes
        setTimeout(async () => {
          await this.reviveGuard(guardId);
        }, COMA_DURATION);
      }

      // Appliquer les mises à jour atomiquement
      await update(guardRef, updates);

      // Générer une riposte si le garde n'est pas mort et est actif
      let counter = null;
      if (!isDead && !guard.inComa && guard.active) {
        counter = this.generateCounterAttack(guard);
      }

      return {
        success: true,
        damage,
        isDead,
        newHealth,
        counter
      };

    } catch (error: any) {
      console.error('Combat error:', error);
      throw new Error(error.message || 'Une erreur est survenue lors du combat');
    }
  }

  static async reviveGuard(guardId: string): Promise<void> {
    try {
      const guardRef = ref(db, `guards/${guardId}`);
      const snapshot = await get(guardRef);
      
      if (!snapshot.exists()) return;

      const guard = snapshot.val();
      const maxHealth = 200 + (guard.level * 100);

      await update(guardRef, {
        inComa: false,
        active: true,
        health: maxHealth,
        comaStartTime: null,
        position: {
          ...guard.position,
          area: 'guard'
        }
      });
    } catch (error) {
      console.error('Error reviving guard:', error);
      throw error;
    }
  }

  static generateCounterAttack(guard: Guard): {
    damage: number;
    message: string;
  } | null {
    if (guard.inComa || !guard.active) return null;

    const baseDamage = guard.stats.strength;
    const weaponDamage = guard.weapon?.damage || 0;
    const randomFactor = Math.random() * 0.4 + 0.8; // 0.8 to 1.2 multiplier
    const damage = Math.floor((baseDamage + weaponDamage) * randomFactor);

    // Probabilité de riposte élevée
    if (Math.random() < 0.7) { // 70% chance de riposte à chaque attaque
      return {
        damage,
        message: `${guard.name} riposte avec force et vous inflige ${damage} dégâts!`
      };
    }

    return null;
  }

  static async distributeXP(userId: string, statType: 'strength' | 'defense' | 'agility' | 'dodge', amount: number): Promise<void> {
    try {
      const userRef = ref(db, `users/${userId}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        throw new Error('User not found');
      }

      const userData = snapshot.val();
      const currentStats = userData.stats || {};
      const undistributedXP = currentStats.undistributedXP || 0;

      if (undistributedXP < amount) {
        throw new Error('Not enough XP points');
      }

      await update(userRef, {
        stats: {
          ...currentStats,
          [statType]: (currentStats[statType] || 0) + amount,
          undistributedXP: undistributedXP - amount
        },
        history: [{
          type: 'xp_distribution',
          description: `💪 Vous avez augmenté votre ${statType} de ${amount} points`,
          timestamp: new Date().toISOString()
        }, ...(userData.history || []).slice(0, 49)]
      });
    } catch (error) {
      console.error('Error distributing XP:', error);
      throw error;
    }
  }
}
