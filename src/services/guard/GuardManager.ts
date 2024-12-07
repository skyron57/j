import { db } from '../../firebase';
import { ref, get, set, update } from 'firebase/database';
import { Guard } from '../../types/guard';
import { GuardIdGenerator } from './GuardIdGenerator';
import { WEAPONS } from '../../types/combat';
import { v4 as uuidv4 } from 'uuid';
import { GUARD_BEHAVIORS } from '../../types/guardBehavior';

export class GuardManager {
  private static instance: GuardManager | null = null;
  private readonly GUARD_LEVELS = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20];
  private readonly GUARD_AREAS = ['cell', 'yard', 'gym', 'infirmary', 'kitchen', 'guard', 'workshop', 'showers'];
  private guardCache: Map<string, Guard> = new Map();
  private readonly FIREBASE_PATHS = {
    guards: 'guards',
    guardPositions: 'guardPositions'
  };

  private constructor() {
    this.initializeGuards();
  }

  public static getInstance(): GuardManager {
    if (!GuardManager.instance) {
      GuardManager.instance = new GuardManager();
    }
    return GuardManager.instance;
  }

  private async initializeGuards() {
    try {
      const guardsRef = ref(db, this.FIREBASE_PATHS.guards);
      const snapshot = await get(guardsRef);

      if (!snapshot.exists()) {
        console.log('No guards found, initializing default guards...');
        const initialGuards = this.generateInitialGuards();
        await set(guardsRef, initialGuards);
        
        Object.values(initialGuards).forEach(guard => {
          this.guardCache.set(guard.id, guard);
        });
        
        console.log('Default guards initialized:', Object.keys(initialGuards).length);
      } else {
        const guardsData = snapshot.val();
        Object.values(guardsData).forEach((guard: Guard) => {
          if (guard && guard.id) {
            this.guardCache.set(guard.id, guard);
          }
        });
        console.log('Guards loaded from Firebase:', this.guardCache.size);
      }
    } catch (error) {
      console.error('Error initializing guards:', error);
    }
  }

  private generateInitialGuards(): Record<string, Guard> {
    const guards: Record<string, Guard> = {};
    const guardNames = [
      'Gardien Marcus', 'Gardien Viktor', 'Gardien Bruno', 'Gardien Sergei',
      'Gardien Ivan', 'Gardien Klaus', 'Gardien Hans', 'Gardien Boris',
      'Gardien Dimitri', 'Gardien Gustav'
    ];

    guardNames.forEach((name, index) => {
      const id = uuidv4();
      const level = this.GUARD_LEVELS[index % this.GUARD_LEVELS.length];
      const maxHealth = 100 + (level * 50);

      guards[id] = {
        id,
        name,
        title: `Le ${['Vétéran', 'Brutal', 'Silencieux', 'Impitoyable', 'Stratège'][index % 5]}`,
        level,
        emoji: '👮',
        health: maxHealth,
        maxHealth,
        money: 0,
        createdAt: new Date().toISOString(),
        active: true,
        inComa: false,
        lastRespawn: null,
        stats: {
          strength: Math.floor(Math.random() * 10) + level,
          defense: Math.floor(Math.random() * 10) + level,
          agility: Math.floor(Math.random() * 10) + level,
          dodge: Math.floor(Math.random() * 10) + level,
          points: level,
          damageDealt: 0,
          damageTaken: 0
        },
        weapon: {
          id: `weapon-${id}`,
          name: 'Matraque de gardien',
          type: 'weapon',
          damage: 10 + level * 2,
          defense: 5 + level,
          stats: {
            attack: 10 + level * 2,
            defense: 5 + level,
            agility: level,
            dodge: level
          },
          emoji: '🏏',
          description: 'Une matraque standard de gardien',
          deathMessage: '{killer} vous a neutralisé avec une matraque de gardien!'
        },
        position: {
          area: this.GUARD_AREAS[Math.floor(Math.random() * this.GUARD_AREAS.length)],
          lastMove: Date.now(),
          isStatic: false
        },
        behavior: Object.keys(GUARD_BEHAVIORS)[Math.floor(Math.random() * Object.keys(GUARD_BEHAVIORS).length)],
        behaviorDescription: 'Patrouille et maintient l\'ordre'
      };
    });

    return guards;
  }

  public async getActiveGuardsInArea(area: string): Promise<Guard[]> {
    try {
      const guardsRef = ref(db, this.FIREBASE_PATHS.guards);
      const snapshot = await get(guardsRef);

      if (!snapshot.exists()) {
        return [];
      }

      return Object.values(snapshot.val())
        .filter((guard: Guard) => 
          guard.active && 
          !guard.inComa && 
          guard.position.area === area
        );
    } catch (error) {
      console.error('Error getting guards in area:', error);
      return [];
    }
  }

  public async updateGuardPositions() {
    try {
      const updates: Record<string, any> = {};
      
      this.guardCache.forEach((guard) => {
        if (guard.active && !guard.inComa && !guard.position.isStatic) {
          const newArea = this.GUARD_AREAS[Math.floor(Math.random() * this.GUARD_AREAS.length)];
          const behavior = Object.keys(GUARD_BEHAVIORS)[Math.floor(Math.random() * Object.keys(GUARD_BEHAVIORS).length)];

          updates[`${guard.id}/position`] = {
            area: newArea,
            lastMove: Date.now(),
            isStatic: false
          };
          updates[`${guard.id}/behavior`] = behavior;

          guard.position.area = newArea;
          guard.position.lastMove = Date.now();
          guard.behavior = behavior;
          this.guardCache.set(guard.id, guard);
        }
      });

      if (Object.keys(updates).length > 0) {
        const guardsRef = ref(db, this.FIREBASE_PATHS.guards);
        await update(guardsRef, updates);
        console.log('Guard positions updated:', Object.keys(updates).length);
      }
    } catch (error) {
      console.error('Error updating guard positions:', error);
    }
  }

  public getGuardById(id: string): Guard | undefined {
    return this.guardCache.get(id);
  }

  public async removeGuard(guardId: string): Promise<void> {
    try {
      const guardRef = ref(db, `${this.FIREBASE_PATHS.guards}/${guardId}`);
      await update(guardRef, {
        active: false,
        inComa: true,
        comaStartTime: new Date().toISOString()
      });

      const guard = this.guardCache.get(guardId);
      if (guard) {
        guard.active = false;
        guard.inComa = true;
        guard.comaStartTime = new Date().toISOString();
        this.guardCache.set(guardId, guard);
      }
    } catch (error) {
      console.error('Error removing guard:', error);
      throw error;
    }
  }

  public clearCache(): void {
    this.guardCache.clear();
  }
}

export default GuardManager.getInstance();
