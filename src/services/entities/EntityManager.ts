import { db } from '../../firebase';
import { ref, get, set } from 'firebase/database';
import { GameEntity } from '../../types/prisoner';
import { GuardManager } from '../guard/GuardManager';
import { STATIC_ENTITIES } from '../../types/prisoner';

export class EntityManager {
  private static instance: EntityManager;
  private readonly UPDATE_INTERVAL = 30000; // 30 seconds
  private lastUpdate: number = 0;
  private readonly FIREBASE_PATHS = {
    guards: 'guards', // Chemin pour les gardes, non statique
    staticEntities: 'staticEntities',
    locations: 'locations'
  };

  private constructor() {
    this.initializeStaticEntities();
  }

  public static getInstance(): EntityManager {
    if (!EntityManager.instance) {
      EntityManager.instance = new EntityManager();
    }
    return EntityManager.instance;
  }

  private async initializeStaticEntities(): Promise<void> {
    try {
      const staticEntitiesRef = ref(db, this.FIREBASE_PATHS.staticEntities);
      const snapshot = await get(staticEntitiesRef);

      if (!snapshot.exists()) {
        // Initialize static entities in Firebase if they don't exist
        await set(staticEntitiesRef, STATIC_ENTITIES.reduce((acc, entity) => {
          acc[entity.id] = {
            ...entity,
            lastUpdate: new Date().toISOString()
          };
          return acc;
        }, {}));

        console.log('Static entities initialized in Firebase');
      }
    } catch (error) {
      console.error('Error initializing static entities:', error);
    }
  }

  async getEntitiesInLocation(location: string, playerLevel: number): Promise<GameEntity[]> {
    try {
      const now = Date.now();

      // Update guard positions if needed
      if (now - this.lastUpdate >= this.UPDATE_INTERVAL) {
        await GuardManager.getInstance().updateGuardPositions();
        this.lastUpdate = now;
      }

      // Get active guards in the area (dynamically)
      const guards = await GuardManager.getInstance().getActiveGuardsInArea(location);

      // Get static entities in the location
      const staticEntitiesRef = ref(db, this.FIREBASE_PATHS.staticEntities);
      const snapshot = await get(staticEntitiesRef);

      let staticEntities: GameEntity[] = [];
      if (snapshot.exists()) {
        staticEntities = Object.values(snapshot.val())
          .filter((entity: GameEntity) =>
            entity.position.area === location &&
            (!entity.position.isStatic || entity.type === 'dealer' || entity.type === 'nurse')
          );
      }

      // Combine guards and static entities
      const allEntities = [...guards, ...staticEntities];

      // Log entity counts for debugging
      console.log(`Entities in ${location}:`, {
        guards: guards.length,
        staticEntities: staticEntities.length,
        total: allEntities.length
      });

      return allEntities;
    } catch (error) {
      console.error('Error getting entities in location:', error);
      return [];
    }
  }

  async updateEntityPosition(entityId: string, newLocation: string): Promise<void> {
    try {
      const entityRef = ref(db, `${this.FIREBASE_PATHS.staticEntities}/${entityId}`);
      const snapshot = await get(entityRef);

      if (snapshot.exists()) {
        const entity = snapshot.val();
        if (!entity.position.isStatic) {
          await set(entityRef, {
            ...entity,
            position: {
              ...entity.position,
              area: newLocation,
              lastMove: Date.now()
            },
            lastUpdate: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error('Error updating entity position:', error);
      throw error;
    }
  }

  async getEntityById(entityId: string): Promise<GameEntity | null> {
    try {
      // Check guards first
      const guard = await GuardManager.getInstance().getGuardById(entityId);
      if (guard) return guard;

      // Check static entities
      const entityRef = ref(db, `${this.FIREBASE_PATHS.staticEntities}/${entityId}`);
      const snapshot = await get(entityRef);

      if (snapshot.exists()) {
        return snapshot.val() as GameEntity;
      }

      return null;
    } catch (error) {
      console.error('Error getting entity by ID:', error);
      return null;
    }
  }

  clearCache(): void {
    this.lastUpdate = 0;
    GuardManager.getInstance().clearCache();
  }
}

// Export the singleton instance
export default EntityManager.getInstance();
