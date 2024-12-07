import { db } from '../firebase';
import { ref, get, update } from 'firebase/database';
import { GameEntity } from '../types/prisoner';
import { Weapon } from '../types/weapon';
import { GuardCombatService } from './guard/GuardCombatService';

export class CombatService {
  static async performAttack(
    attacker: any,
    defender: GameEntity,
    weapon: Weapon,
  ): Promise<{
    success: boolean;
    damage: number;
    isCritical: boolean;
    isDead: boolean;
    message?: string;
    counter?: {
      damage: number;
      message: string;
    };
  }> {
    try {
      if (attacker.actionPoints < 5) {
        throw new Error('Points d\'action insuffisants (5 PA requis)');
      }

      // Récupérer l'état actuel du garde
      const guardRef = ref(db, `guards/${defender.id}`);
      const guardSnapshot = await get(guardRef);
      
      if (!guardSnapshot.exists()) {
        throw new Error('Guard not found');
      }

      const currentGuardData = guardSnapshot.val();
      
      // Vérifier si le garde est déjà dans le coma
      if (currentGuardData.inComa) {
        throw new Error('Ce garde est déjà dans le coma');
      }

      // Calculer les dégâts
      const criticalChance = 0.1 + (attacker.stats.agility * 0.01);
      const isCritical = Math.random() < criticalChance;
      let damage = attacker.stats.strength + (weapon.stats?.attack || 0);
      
      if (isCritical) {
        damage = Math.floor(damage * 1.5);
      }

      // Réduire les dégâts en fonction de la défense
      const defenseReduction = (currentGuardData.stats?.defense || 0) * 0.5;
      damage = Math.max(1, Math.floor(damage - defenseReduction));

      // Mettre à jour la santé du garde
      const currentHealth = Number(currentGuardData.health);
      const newHealth = Math.max(0, currentHealth - damage);
      const isDead = newHealth <= 0;

      // Préparer les mises à jour
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
          ...currentGuardData.position,
          area: 'infirmary'
        };
      }

      // Appliquer les mises à jour atomiquement
      await update(guardRef, updates);

      // Générer une riposte si le garde n'est pas mort
      let counter;
      if (!isDead) {
        counter = GuardCombatService.generateCounterAttack(currentGuardData);
      }

      return {
        success: true,
        damage,
        isCritical,
        isDead,
        message: `${weapon.emoji} ${isCritical ? '⚡️ CRITIQUE! ' : ''}Vous avez infligé ${damage} dégâts à ${currentGuardData.name}`,
        counter
      };

    } catch (error: any) {
      console.error('Combat error:', error);
      throw new Error(error.message || 'Une erreur est survenue lors du combat');
    }
  }
}
