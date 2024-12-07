import { ref, update, get, set, serverTimestamp } from "firebase/database"; // Importation de la Realtime Database
import { db } from '../firebase'; // Import de la configuration Firebase
import { LocalStorage } from './LocalStorage';
import { GameState } from '../../types/game';
import { debounce } from '../../utils/performance';

const SYNC_INTERVAL = 5000; // 5 secondes
const BATCH_SIZE = 500;
const MAX_RETRIES = 3;
const CRITICAL_UPDATES = ['health', 'inComa', 'location'];

export class FirebaseSync {
  private static syncTimeout: NodeJS.Timeout | null = null;
  private static isSyncing = false;
  private static writeQueue: Map<string, any> = new Map();

  // Débouncer pour les mises à jour non critiques
  private static debouncedSync = debounce(async (userId: string) => {
    await FirebaseSync.processBatchWrites(userId);
  }, 2000);

  // Démarre la synchronisation
  static async startSync(userId: string): Promise<void> {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }

    const sync = async () => {
      if (!this.isSyncing) {
        try {
          this.isSyncing = true;
          await this.syncWithFirebase(userId);
        } catch (error) {
          console.error('Erreur de synchronisation :', error);
        } finally {
          this.isSyncing = false;
          this.syncTimeout = setTimeout(sync, SYNC_INTERVAL);
        }
      }
    };

    sync();
  }

  // Arrête la synchronisation
  static stopSync(): void {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
      this.syncTimeout = null;
    }
  }

  // Synchronisation principale avec Firebase
  private static async syncWithFirebase(userId: string): Promise<void> {
    const pendingWrites = await LocalStorage.getPendingWrites();
    if (pendingWrites.length === 0) return;

    // Sépare les mises à jour critiques et non critiques
    const criticalUpdates = pendingWrites.filter(write =>
      CRITICAL_UPDATES.some(key => write.type.toLowerCase().includes(key))
    );
    const nonCriticalUpdates = pendingWrites.filter(write =>
      !CRITICAL_UPDATES.some(key => write.type.toLowerCase().includes(key))
    );

    // Traite immédiatement les mises à jour critiques
    if (criticalUpdates.length > 0) {
      await this.processUpdates(userId, criticalUpdates, true);
    }

    // File d'attente pour les mises à jour non critiques
    if (nonCriticalUpdates.length > 0) {
      nonCriticalUpdates.forEach(update => {
        this.writeQueue.set(`${update.type}_${Date.now()}`, update);
      });
      this.debouncedSync(userId);
    }
  }

  // Traite les mises à jour dans Firebase
  private static async processUpdates(userId: string, updates: any[], isCritical: boolean): Promise<void> {
    const userRef = ref(db, `users/${userId}`);
    let retryCount = 0;

    while (retryCount < MAX_RETRIES) {
      try {
        const snapshot = await get(userRef);
        if (!snapshot.exists()) throw new Error('Document utilisateur introuvable');

        const serverState = snapshot.val() as GameState;
        const localState = await LocalStorage.getGameState(userId);

        if (!localState) throw new Error('État local introuvable');

        // Applique les mises à jour
        const updatedState = this.applyWrites(serverState, updates);

        if (isCritical) {
          updatedState.lastCriticalUpdate = serverTimestamp();
        }

        await update(userRef, updatedState);

        // Supprime les écritures traitées du stockage local
        const remainingWrites = await LocalStorage.getPendingWrites();
        const processedIds = updates.map(u => u.id);
        const filteredWrites = remainingWrites.filter(w => !processedIds.includes(w.id));
        await LocalStorage.setPendingWrites(filteredWrites);

        break;
      } catch (error) {
        retryCount++;
        if (retryCount === MAX_RETRIES) {
          console.error('Nombre maximal de tentatives atteint pour la synchronisation :', error);
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      }
    }
  }

  // Traite les écritures en file d'attente
  private static async processBatchWrites(userId: string): Promise<void> {
    if (this.writeQueue.size === 0) return;

    const batchedWrites = Array.from(this.writeQueue.values());
    this.writeQueue.clear();

    for (let i = 0; i < batchedWrites.length; i += BATCH_SIZE) {
      const batch = batchedWrites.slice(i, i + BATCH_SIZE);
      await this.processUpdates(userId, batch, false);
    }
  }

  // Applique les écritures à l'état du jeu
  private static applyWrites(state: GameState, writes: any[]): GameState {
    let updatedState = { ...state };

    for (const write of writes) {
      switch (write.type) {
        case 'UPDATE_HEALTH':
        case 'UPDATE_COMA_STATUS':
        case 'CHANGE_LOCATION':
          updatedState = { ...updatedState, ...write.data };
          break;

        case 'UPDATE_INVENTORY':
        case 'UPDATE_STATS':
        case 'UPDATE_TRAINING':
          updatedState = this.mergeDeep(updatedState, write.data);
          break;

        case 'UPDATE_ACTION_POINTS':
        case 'UPDATE_MOVEMENT_POINTS':
          const key = write.type.toLowerCase().replace('update_', '');
          updatedState[key] = (updatedState[key] || 0) + write.data.value;
          break;

        default:
          updatedState = { ...updatedState, ...write.data };
      }
    }

    return updatedState;
  }

  // Fusionne les objets de manière récursive
  private static mergeDeep(target: any, source: any): any {
    if (!source) return target;

    const output = { ...target };

    Object.keys(source).forEach(key => {
      if (source[key] instanceof Object && key in target) {
        output[key] = this.mergeDeep(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    });

    return output;
  }

  static async forceSync(userId: string): Promise<void> {
    this.isSyncing = false;
    await this.processBatchWrites(userId);
    await this.syncWithFirebase(userId);
  }
}
