import { GuardManager } from './GuardManager';
import { GameEntity } from '../../types/prisoner';
import { calculateDamage } from '../../utils/combat';
import { ref, update, get } from 'firebase/database';
import { db } from '../../firebase';

export class GuardInteractionService {
  private static instance: GuardInteractionService;
  private guardManager: GuardManager;
  
  private readonly DROP_CHANCES = {
    COMMON: 0.6,    // 60% chance for 500-2000
    UNCOMMON: 0.3,  // 30% chance for 2001-5000
    RARE: 0.08,     // 8% chance for 5001-8000
    EPIC: 0.02      // 2% chance for 8001-10000
  };

  private constructor() {
    this.guardManager = GuardManager.getInstance();
  }

  public static getInstance(): GuardInteractionService {
    if (!GuardInteractionService.instance) {
      GuardInteractionService.instance = new GuardInteractionService();
    }
    return GuardInteractionService.instance;
  }

  public async handleAttack(
    player: GameEntity,
    guardId: string
  ): Promise<{
    success: boolean;
    damage?: number;
    xpGained?: number;
    killMessage?: string;
    counterDamage?: number;
    moneyDropped?: number;
    playerRemainingHealth?: number;
  }> {
    try {
      const guardData = this.guardManager.getGuardById(guardId);
      if (!guardData) {
        return { success: false };
      }

      const { entity: guard, ai } = guardData;

      // Calcul des dégâts infligés par le joueur
      const damageResult = calculateDamage(
        {
          strength: player.stats.attack,
          attack: player.stats.attack,
          weaponBonus: player.weapon?.stats.attack || 0
        },
        {
          defense: guard.stats.defense,
          dodge: guard.stats.dodge
        }
      );

      if (damageResult.isDodged) {
        return {
          success: true,
          damage: 0,
          xpGained: 1 // XP minimal pour une tentative d'attaque
        };
      }

      // Appliquer les dégâts au garde
      guard.health -= damageResult.damage;

      // Mise à jour de la santé du garde dans Firebase
      const guardRef = ref(db, `guards/${guardId}`);
      await update(guardRef, { health: guard.health });

      // Vérifier si le garde est mort
      if (guard.health <= 0) {
        const xpGained = 5; // XP fixe par kill
        const moneyDropped = this.calculateMoneyDrop();
        await this.guardManager.removeGuard(guardId); // Retirer le garde après la mort

        // Enregistrer le meurtre
        const murderRef = ref(db, 'murders');
        const murderEntry = {
          id: `murder-${Date.now()}`,
          killerId: player.id,
          killerName: player.username,
          victimId: guardId,
          victimName: guard.name,
          method: 'Mis dans le coma',
          deathMessage: `${player.username} a mis ${guard.name} dans le coma!`,
          location: guard.position.area,
          timestamp: new Date().toISOString()
        };

        await push(murderRef, murderEntry);

        return {
          success: true,
          damage: damageResult.damage,
          xpGained,
          killMessage: `${player.username} a tué ${guard.name} !`,
          moneyDropped
        };
      }

      // Si le garde est vivant, il peut riposter
      const counterDamage = this.handleCounterAttack(guard, player);

      return {
        success: true,
        damage: damageResult.damage,
        xpGained: Math.ceil(damageResult.damage / 10), // XP basé sur les dégâts infligés
        counterDamage,
        playerRemainingHealth: player.health - counterDamage
      };
    } catch (error: any) {
      console.error('Combat error:', error);
      throw new Error(error.message || 'Erreur lors du combat');
    }
  }

  private calculateMoneyDrop(): number {
    const rand = Math.random();
    if (rand < this.DROP_CHANCES.EPIC) {
      return Math.floor(Math.random() * (10000 - 8001) + 8001);
    } else if (rand < this.DROP_CHANCES.EPIC + this.DROP_CHANCES.RARE) {
      return Math.floor(Math.random() * (8000 - 5001) + 5001);
    } else if (rand < this.DROP_CHANCES.EPIC + this.DROP_CHANCES.RARE + this.DROP_CHANCES.UNCOMMON) {
      return Math.floor(Math.random() * (5000 - 2001) + 2001);
    } else {
      return Math.floor(Math.random() * (2000 - 500) + 500);
    }
  }

  private handleCounterAttack(guard: GameEntity, player: GameEntity): number {
    // Le garde riposte si l'attaque n'est pas esquivée
    const counterResult = calculateDamage(
      {
        strength: guard.stats.attack,
        attack: guard.stats.attack,
        weaponBonus: guard.weapon?.stats.attack || 0
      },
      {
        defense: player.stats.defense,
        dodge: player.stats.dodge
      }
    );

    // Si l'attaque du garde est esquivée, il n'y a pas de riposte
    return counterResult.isDodged ? 0 : counterResult.damage;
  }

  public getGuardStatus(guardId: string): {
    isAlive: boolean;
    health?: number;
    suspicionLevel?: number;
  } {
    const guardData = this.guardManager.getGuardById(guardId);
    if (!guardData) {
      return { isAlive: false };
    }

    return {
      isAlive: guardData.entity.health > 0,  // Vérifier si le garde est en vie
      health: guardData.entity.health,
      suspicionLevel: guardData.ai.getSuspicionLevel()
    };
  }
}
