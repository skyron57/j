import { db } from '../../firebase';
import { ref, get, update, push } from 'firebase/database';
import { Guard } from '../../types/guard';
import { formatDeathMessage } from '../../types/murder';
import { WeaponService } from '../weapon';
import { GameState } from '../../types/game';

const COMA_DURATION = 30 * 60 * 1000; // 30 minutes
const XP_PER_KILL = 5; // XP gained per kill

interface CombatResult {
  isDead: boolean;
  newHealth: number;
  counter?: {
    damage: number;
    message: string;
  };
}

export class GuardCombatService {
  static async updateGuardHealth(
    guardId: string,
    damage: number,
    attackerId: string,
    attackerName: string,
    equippedWeapon?: any
  ): Promise<CombatResult> {
    try {
      // Check and damage weapon if equipped
      if (equippedWeapon) {
        const { broken } = await WeaponService.damageWeapon(attackerId, equippedWeapon.id);
        if (broken) {
          throw new Error('Votre arme s\'est cassée pendant l\'attaque !');
        }
      }

      const guardRef = ref(db, `guards/${guardId}`);
      const snapshot = await get(guardRef);

      if (!snapshot.exists()) {
        throw new Error('Garde introuvable');
      }

      const guard = snapshot.val();

      if (guard.inComa) {
        return { isDead: true, newHealth: 0 };
      }

      // Calcul des dégâts avec variation aléatoire
      const baseDamage = damage;
      const variation = Math.random() * 0.4 - 0.2; // -20% à +20% de variation
      const defenseReduction = guard.stats.defense * 0.5;
      const finalDamage = Math.max(1, Math.floor((baseDamage * (1 + variation)) - defenseReduction));

      const newHealth = Math.max(0, guard.health - finalDamage);
      const isDead = newHealth <= 0;

      // Format death message for history
      const historyMessage = `Tu as ${equippedWeapon?.deathMessage
        ?.replace('[killer] a ', '')
        ?.replace('[victim]', guard.name) || `mis ${guard.name} dans le coma!`}`;

      const updates: any = {
        health: newHealth,
        lastUpdate: new Date().toISOString()
      };

      if (isDead) {
        updates.inComa = true;
        updates.active = false;
        updates.comaStartTime = new Date().toISOString();
        updates.position = {
          ...guard.position,
          area: 'infirmary'
        };

        // Calcul du montant d'argent à distribuer
        const moneyDropped = this.calculateMoneyDrop();
        const moneyInEuros = Math.floor(moneyDropped / 100); // Conversion en euros

        // Update attacker stats
        const attackerRef = ref(db, `users/${attackerId}`);
        const attackerSnapshot = await get(attackerRef);
        
        if (attackerSnapshot.exists()) {
          const attackerData = attackerSnapshot.val();
          const currentStats = attackerData.stats || {};
          const history = attackerData.history || [];
          
          // Add XP, points, and money for the kill (5 XP + 2 points + money)
          const newStats = {
            ...currentStats,
            kills: (currentStats.kills || 0) + 1,
            undistributedXP: (currentStats.undistributedXP || 0) + XP_PER_KILL,
            points: (currentStats.points || 0) + 2,
            damageDealt: (currentStats.damageDealt || 0) + finalDamage
          };
          
          // Update user with new stats, and money from kill
          await update(attackerRef, {
            stats: newStats,
            money: (attackerData.money || 0) + moneyInEuros,
            history: [{
              type: 'kill',
              description: `Vous avez vaincu ${guard.name} et obtenu ${moneyInEuros}€!`,
              timestamp: new Date().toISOString()
            }, ...history.slice(0, 49)]
          });
        }

        // Ajouter l'entrée dans la collection des meurtres
        const murderRef = ref(db, 'murders');
        const murderEntry = {
          id: `murder-${Date.now()}`,
          killerId: attackerId,
          killerName: attackerName,
          victimId: guardId,
          victimName: guard.name,
          method: 'Mis dans le coma',
          deathMessage: equippedWeapon?.deathMessage
            ?.replace('[killer]', attackerName)
            ?.replace('[victim]', guard.name) || 
            `${attackerName} a mis ${guard.name} dans le coma!`,
          location: guard.position.area,
          moneyDropped: moneyInEuros,
          timestamp: new Date().toISOString()
        };

        await push(murderRef, murderEntry);
      }

      await update(guardRef, updates);

      // Générer une riposte si le garde n'est pas mort
      let counter = null;
      if (!isDead && !guard.inComa && guard.active) {
        counter = this.generateCounterAttack(guard);
      }

      return {
        isDead,
        newHealth: finalDamage,
        counter
      };

    } catch (error: any) {
      console.error('Combat error:', error);
      throw new Error(error.message || 'Erreur lors du combat');
    }
  }

  static calculateMoneyDrop(): number {
    const roll = Math.random();
    const dropRates = [
      { chance: 0.60, min: 50000, max: 200000 },    // 500€-2000€
      { chance: 0.30, min: 200100, max: 500000 },   // 2001€-5000€
      { chance: 0.08, min: 500100, max: 800000 },   // 5001€-8000€
      { chance: 0.02, min: 800100, max: 1000000 }   // 8001€-10000€
    ];

    let cumulative = 0;
    for (const drop of dropRates) {
      cumulative += drop.chance;
      if (Math.random() <= cumulative) {
        return Math.floor(Math.random() * (drop.max - drop.min + 1) + drop.min);
      }
    }

    return dropRates[0].min; // Default fallback
  }

  static async reviveGuard(guardId: string): Promise<void> {
    try {
      const guardRef = ref(db, `guards/${guardId}`);
      const snapshot = await get(guardRef);

      if (!snapshot.exists()) return;

      const guard = snapshot.val();
      const maxHealth = 100 + (guard.stats.points * 50);

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

  static generateCounterAttack(guard: Guard): { damage: number; message: string } | null {
    const counterChance = Math.min(0.7 + (guard.stats.agility * 0.01), 0.9); // Max 90% de chance

    if (Math.random() < counterChance) {
      const baseDamage = guard.stats.strength + (guard.weapon?.damage || 0);
      const variation = Math.random() * 0.4 - 0.2; // -20% à +20% de variation
      const damage = Math.floor(baseDamage * (1 + variation));

      const messages = [
        `${guard.name} riposte avec force et vous inflige ${damage} dégâts !`,
        `${guard.name} contre-attaque rapidement et vous blesse (${damage} dégâts) !`,
        `${guard.name} réagit instantanément et vous frappe (${damage} dégâts) !`,
        `Dans un mouvement vif, ${guard.name} vous inflige ${damage} dégâts !`
      ];

      return {
        damage,
        message: messages[Math.floor(Math.random() * messages.length)]
      };
    }
    return null;
  }

  static async distributeXP(userId: string, statType: keyof GameState['stats'], amount: number): Promise<void> {
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
      
      const newStats = {
        ...currentStats,
        [statType]: (currentStats[statType] || 0) + amount,
        undistributedXP: undistributedXP - amount
      };
      
      await update(userRef, {
        stats: newStats,
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
