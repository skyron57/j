import localforage from 'localforage';
import { z } from 'zod';
import { GameState } from '../../types/game';

// Initialize localforage instances
const gameStateStore = localforage.createInstance({
  name: 'perpette',
  storeName: 'gameState'
});

const syncMetaStore = localforage.createInstance({
  name: 'perpette',
  storeName: 'syncMeta'
});

// Schema validation
const syncMetaSchema = z.object({
  lastSync: z.string(),
  version: z.number(),
  pendingWrites: z.array(z.object({
    id: z.string(),
    type: z.string(),
    data: z.any(),
    timestamp: z.string(),
    priority: z.enum(['high', 'medium', 'low'])
  }))
});

export class LocalStorage {
  static async saveGameState(userId: string, state: GameState): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      
      // Save to IndexedDB
      await gameStateStore.setItem(`gameState_${userId}`, {
        ...state,
        lastUpdate: timestamp
      });

      // Backup to localStorage for emergency recovery
      localStorage.setItem(`gameState_${userId}_backup`, JSON.stringify({
        ...state,
        lastUpdate: timestamp
      }));
    } catch (error) {
      console.error('Error saving game state:', error);
      throw error;
    }
  }

  static async getGameState(userId: string): Promise<GameState | null> {
    try {
      // Try IndexedDB first
      let state = await gameStateStore.getItem(`gameState_${userId}`);
      
      // Fall back to localStorage backup if needed
      if (!state) {
        const backup = localStorage.getItem(`gameState_${userId}_backup`);
        if (backup) {
          state = JSON.parse(backup);
          // Restore to IndexedDB
          await this.saveGameState(userId, state as GameState);
        }
      }
      
      return state;
    } catch (error) {
      console.error('Error getting game state:', error);
      throw error;
    }
  }

  static async addPendingWrite(write: { 
    type: string; 
    data: any;
    priority: 'high' | 'medium' | 'low';
  }): Promise<void> {
    try {
      const meta = await syncMetaStore.getItem('syncMeta') || {
        lastSync: new Date().toISOString(),
        version: 1,
        pendingWrites: []
      };

      // Add write with unique ID
      meta.pendingWrites.push({
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...write,
        timestamp: new Date().toISOString()
      });

      // Sort by priority
      meta.pendingWrites.sort((a, b) => {
        const priorities = { high: 0, medium: 1, low: 2 };
        return priorities[a.priority] - priorities[b.priority];
      });

      await syncMetaStore.setItem('syncMeta', meta);
    } catch (error) {
      console.error('Error adding pending write:', error);
      throw error;
    }
  }

  static async getPendingWrites(): Promise<any[]> {
    try {
      const meta = await syncMetaStore.getItem('syncMeta');
      return meta?.pendingWrites || [];
    } catch (error) {
      console.error('Error getting pending writes:', error);
      throw error;
    }
  }

  static async setPendingWrites(writes: any[]): Promise<void> {
    try {
      const meta = await syncMetaStore.getItem('syncMeta');
      if (meta) {
        meta.pendingWrites = writes;
        await syncMetaStore.setItem('syncMeta', meta);
      }
    } catch (error) {
      console.error('Error setting pending writes:', error);
      throw error;
    }
  }

  static async clearPendingWrites(): Promise<void> {
    try {
      const meta = await syncMetaStore.getItem('syncMeta');
      if (meta) {
        meta.pendingWrites = [];
        await syncMetaStore.setItem('syncMeta', meta);
      }
    } catch (error) {
      console.error('Error clearing pending writes:', error);
      throw error;
    }
  }

  static async updateSyncMeta(updates: Partial<z.infer<typeof syncMetaSchema>>): Promise<void> {
    try {
      const meta = await syncMetaStore.getItem('syncMeta') || {
        lastSync: new Date().toISOString(),
        version: 1,
        pendingWrites: []
      };

      await syncMetaStore.setItem('syncMeta', {
        ...meta,
        ...updates
      });
    } catch (error) {
      console.error('Error updating sync meta:', error);
      throw error;
    }
  }

  static async getSyncMeta(): Promise<z.infer<typeof syncMetaSchema> | null> {
    try {
      return await syncMetaStore.getItem('syncMeta');
    } catch (error) {
      console.error('Error getting sync meta:', error);
      throw error;
    }
  }
}
