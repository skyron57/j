import { GameEntity, ALL_ENTITIES } from '../types/prisoner';  // Assure-toi que le chemin est correct
import { Guard, GUARDS } from '../types/guard';
import { calculateTotalLevel } from '../utils/levelGap';

export class GuardManager {
  private static instance: GuardManager | null = null;
  private readonly GUARD_LEVELS = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20];
  private readonly GUARD_AREAS = ['cell', 'yard', 'gym', 'infirmary', 'kitchen', 'guard', 'workshop', 'showers'];
  private guardCache: Map<string, Guard> = new Map();
  private readonly MAX_HEALTH = 100;

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
      const guardsRef = ref(db, 'guards');
      const snapshot = await get(guardsRef);

      if (!snapshot.exists()) {
        const initialGuards = this.generateInitialGuards();
        await set(guardsRef, initialGuards);
        Object.values(initialGuards).forEach(guard => {
          this.guardCache.set(guard.id, guard);
        });
      } else {
        const guards = snapshot.val();
        const seenIds = new Set<string>();
        Object.values(guards).forEach((guard: Guard) => {
          if (guard && guard.id) {
            if (seenIds.has(guard.id)) {
              console.error('Duplicate ID detected during initialization:', guard.id);
            }
            seenIds.add(guard.id);
            this.guardCache.set(guard.id, guard);
            GuardIdGenerator.isIdUsed(guard.id); // Register existing IDs
          }
        });
      }
    } catch (error) {
      console.error('Error initializing guards:', error);
    }
  }

  private generateInitialGuards(): Record<string, Guard> {
    const guards: Record<string, Guard> = {};
    const usedNames = new Set<string>();
    const guardNames = [
      'Gardien Marcus', 'Gardien Viktor', 'Gardien Bruno', 'Gardien Sergei', 'Gardien Ivan',
      'Gardien Klaus', 'Gardien Hans', 'Gardien Boris', 'Gardien Dimitri', 'Gardien Gustav',
      'Gardien Igor', 'Gardien Yuri', 'Gardien Nikolai', 'Gardien Vladimir', 'Gardien Alexei',
      'Gardien Maxim', 'Gardien Anton', 'Gardien Pavel', 'Gardien Oleg', 'Gardien Roman'
    ];

    // Create 20 guards with different levels and behaviors
    for (let i = 0; i < 20; i++) {
      const points = Math.floor(Math.random() * 20) + 1; // 1-20 points
      const guardName = guardNames[i % guardNames.length];
      usedNames.add(guardName);

      const guardId = GuardIdGenerator.generateId();
      const maxHealth = 100 + (points * 50); // Scale health with points

      // Calculate base stats with stronger defense scaling
      const baseDefense = 15 + (points * 3);
      const baseStrength = 10 + Math.floor(points * 2);
      const baseAgility = 5 + points;
      const baseDodge = 5 + points;

      guards[guardId] = {
        id: guardId,
        name: guardName,
        level: points, // Use points instead of level
        emoji: '👮',
        health: maxHealth,
        maxHealth,
        money: 0,
        createdAt: new Date().toISOString(),
        active: true,
        inComa: false,
        lastRespawn: null,
        behavior: this.getRandomBehavior(),
        stats: {
          strength: baseStrength,
          defense: baseDefense,
          agility: baseAgility,
          dodge: baseDodge,
          points: points,
          damageDealt: 0,
          damageTaken: 0
        },
        weapon: this.generateWeapon(points, guardId),
        position: {
          area: this.GUARD_AREAS[Math.floor(Math.random() * this.GUARD_AREAS.length)],
          lastMove: Date.now(),
          isStatic: false
        }
      };
    }

    return guards;
  }

  private generateWeapon(level: number, guardId: string) {
    return {
      id: `baton-${guardId}`,
      name: 'Matraque de gardien',
      type: 'weapon',
      damage: 10 + (level * 2),
      defense: 5 + level,
      stats: {
        attack: 10 + (level * 2),
        defense: 5 + level,
        agility: level,
        dodge: level
      },
      emoji: '🏏',
      description: 'Une matraque standard de gardien',
      deathMessage: '{killer} vous a neutralisé avec une matraque de gardien!'
    };
  }

  private getRandomBehavior() {
    const behaviorTypes = Object.keys(GUARD_BEHAVIORS);
    return behaviorTypes[Math.floor(Math.random() * behaviorTypes.length)];
  }

  public async getActiveGuardsInArea(area: string): Promise<Guard[]> {
    try {
      const guardsRef = ref(db, 'guards');
      const snapshot = await get(guardsRef);

      if (!snapshot.exists()) {
        return [];
      }

      const guards = snapshot.val();
      const seenIds = new Set<string>();

      return Object.values(guards)
        .filter((guard: Guard) => 
          guard && 
          guard.id && 
          guard.active && 
          !guard.inComa && 
          guard.position.area === area
        )
        .map((guard: Guard) => {
          if (seenIds.has(guard.id)) {
            console.error('Duplicate ID detected in active guards:', guard.id);
          }
          seenIds.add(guard.id);
          return { ...guard, uniqueKey: guard.id }; // Use guard.id as unique key
        });
    } catch (error) {
      console.error('Error getting guards in area:', error);
      return [];
    }
  }

  public async updateGuardPositions() {
    try {
      const guardsRef = ref(db, 'guards');
      const snapshot = await get(guardsRef);

      if (!snapshot.exists()) return;

      const guards = snapshot.val();
      const updates: Record<string, any> = {};

      Object.values(guards).forEach((guard: Guard) => {
        if (guard && guard.id && guard.active && !guard.inComa && !guard.position.isStatic) {
          const newArea = this.GUARD_AREAS[Math.floor(Math.random() * this.GUARD_AREAS.length)];

          // Sélection aléatoire du comportement à chaque déplacement
          const randomBehavior = this.getRandomBehavior();

          updates[`${guard.id}/position`] = {
            ...guard.position,
            area: newArea,
            lastMove: Date.now()
          };
          updates[`${guard.id}/behavior`] = randomBehavior;

          if (this.guardCache.has(guard.id)) {
            const cachedGuard = this.guardCache.get(guard.id)!;
            cachedGuard.position.area = newArea;
            cachedGuard.position.lastMove = Date.now();
            cachedGuard.behavior = randomBehavior; // Mise à jour du cache local
          }
        }
      });

      if (Object.keys(updates).length > 0) {
        await update(guardsRef, updates);
      }
    } catch (error) {
      console.error('Error updating guard positions:', error);
    }
  }

  public async removeGuard(guardId: string): Promise<void> {
    try {
      const guardRef = ref(db, `guards/${guardId}`);
      const snapshot = await get(guardRef);
      
      if (!snapshot.exists()) return;

      const guard = snapshot.val();
      if (!guard || !guard.id) return;

      await update(guardRef, {
        active: false,
        inComa: true,
        comaStartTime: new Date().toISOString()
      });
      
      if (this.guardCache.has(guardId)) {
        const cachedGuard = this.guardCache.get(guardId)!;
        cachedGuard.active = false;
        cachedGuard.inComa = true;
      }

      GuardIdGenerator.releaseId(guardId);
    } catch (error) {
      console.error('Error removing guard:', error);
    }
  }

  public async updateGuard(guardId: string, updates: Partial<Guard>): Promise<void> {
    try {
      const guardRef = ref(db, `guards/${guardId}`);
      const snapshot = await get(guardRef);
      
      if (!snapshot.exists()) {
        throw new Error('Guard not found');
      }

      const currentGuard = snapshot.val();
      const maxHealth = 100 + (updates.stats?.points || currentGuard.stats.points) * 50;

      const updatedGuard = {
        ...currentGuard,
        ...updates,
        maxHealth,
        health: Math.min(updates.health || currentGuard.health, maxHealth),
        lastUpdate: new Date().toISOString()
      };

      await update(guardRef, updatedGuard);
      
      // Update cache
      if (this.guardCache.has(guardId)) {
        this.guardCache.set(guardId, updatedGuard);
      }
    } catch (error) {
      console.error('Error updating guard:', error);
      throw error;
    }
  }

  public clearCache() {
    this.guardCache.clear();
    GuardIdGenerator.clearUsedIds();
  }
}

export default GuardManager.getInstance();

const MOVEMENT_INTERVAL = 30000; // 30 seconds
const AREAS = ['cell', 'yard', 'gym', 'infirmary', 'kitchen', 'guard', 'director', 'workshop', 'showers'];

class PrisonerService {
  private static instance: PrisonerService | null = null;
  private entities: GameEntity[] = ALL_ENTITIES;
  private lastUpdate: number = Date.now();

  private constructor() {
    this.initializePositions();
  }

  static getInstance(): PrisonerService {
    if (!this.instance) {
      this.instance = new PrisonerService();
    }
    return this.instance;
  }

  private initializePositions(): void {
    this.entities = this.entities.map(entity => ({
      ...entity,
      position: {
        ...entity.position,
        area: entity.position.isStatic ? entity.position.area : this.getRandomArea(),
        lastMove: Date.now()
      }
    }));
  }

  private getRandomArea(): string {
    return AREAS[Math.floor(Math.random() * AREAS.length)];
  }

  private getNextArea(currentArea: string): string {
    const availableAreas = AREAS.filter(area => area !== currentArea);
    return availableAreas[Math.floor(Math.random() * availableAreas.length)];
  }

  updatePositions(): void {
    const now = Date.now();
    if (now - this.lastUpdate < MOVEMENT_INTERVAL) return;

    this.entities = this.entities.map(entity => {
      // Ne déplace pas les entités statiques (comme Le Taulier et Nurse)
      if (entity.position.isStatic) return entity;

      return {
        ...entity,
        position: {
          ...entity.position,
          area: this.getNextArea(entity.position.area),
          lastMove: now
        }
      };
    });

    this.lastUpdate = now;
  }

  getEntitiesInArea(area: string): GameEntity[] {
    this.updatePositions();
    return this.entities.filter(entity => entity.position.area === area);
  }

  getPrisonersInArea(area: string): GameEntity[] {
    return this.getEntitiesInArea(area).filter(entity => 
      entity.type === 'prisoner' || entity.type === 'dealer' || entity.type === 'nurse'
    );
  }

  getAllEntities(): GameEntity[] {
    this.updatePositions();
    return this.entities;
  }

  // Retourner toujours true pour permettre l'interaction avec toutes les entités
  canInteractWithEntity(): boolean {
    return true;
  }

  getBehaviorColor(behavior: GameEntity['behavior']): string {
    switch (behavior) {
      case 'dealer':
        return 'text-yellow-400';
      case 'nurse':
        return 'text-green-400';
      case 'test':
        return 'text-green-400';
      case 'aggressive':
        return 'text-red-400';
      case 'defensive':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  }

  getEntityById(id: string): GameEntity | undefined {
    return this.entities.find(entity => entity.id === id);
  }

  getDealerEntity(): GameEntity | undefined {
    return this.entities.find(entity => entity.type === 'dealer');
  }

  getNurseEntity(): GameEntity | undefined {
    return this.entities.find(entity => entity.type === 'nurse');
  }
}

export default PrisonerService.getInstance();
