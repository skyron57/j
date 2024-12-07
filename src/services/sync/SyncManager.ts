import { FirebaseDatabaseSync } from './FirebaseDatabaseSync';  // Firebase DB sync logic
import { LocalStorage } from './LocalStorage';
import { GameState } from '../../types/game';
import firebase from 'firebase/app';
import 'firebase/database';

const SYNC_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
const RETRY_DELAY = 5 * 60 * 1000; // 5 minutes retry delay

export class SyncManager {
  private static instance: SyncManager | null = null;
  private userId: string | null = null;
  private isInitialized = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private lastSyncAttempt: number = 0;

  private constructor() {}

  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  async initialize(userId: string): Promise<void> {
    if (this.isInitialized && this.userId === userId) return;

    this.userId = userId;
    this.isInitialized = true;

    // Initialize local storage
    const localState = await LocalStorage.getGameState(userId);
    if (!localState) {
      await this.initializeLocalState(userId);
    }

    // Start periodic sync
    this.startPeriodicSync();

    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  private async initializeLocalState(userId: string): Promise<void> {
    const initialState: GameState = {
      id: userId,
      username: '',
      role: 'user',
      avatar: null,
      health: 100,
      actionPoints: 20,
      movementPoints: 10,
      money: 500,
      location: 'cell',
      inventory: [],
      quickInventory: [],
      stats: {
        level: 0,
        strength: 5,
        defense: 5,
        agility: 5,
        dodge: 5,
        damageDealt: 0,
        damageTaken: 0,
        missedAttacks: 0,
        dodgedAttacks: 0
      },
      trainingProgress: null,
      taskProgress: {
        cleaning: { clicks: 0, completed: false }
      },
      activeAnabolic: {
        endTime: null,
        bonusAP: 0
      },
      inComa: false,
      comaStartTime: null,
      comaEndTime: null,
      hasRevive: false,
      history: [],
      morale: 100
    };

    await LocalStorage.saveGameState(userId, initialState);
  }

  private startPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      await this.performSync();
    }, SYNC_INTERVAL);

    // Perform initial sync
    this.performSync();
  }

  private async performSync(): Promise<void> {
    if (!this.userId || !navigator.onLine) return;

    try {
      const now = Date.now();
      
      // Check if enough time has passed since last attempt
      if (now - this.lastSyncAttempt < RETRY_DELAY) return;
      
      this.lastSyncAttempt = now;

      // Get pending writes
      const pendingWrites = await LocalStorage.getPendingWrites();
      if (pendingWrites.length === 0) return;

      // Group writes by priority
      const criticalWrites = pendingWrites.filter(w => w.priority === 'high');
      const normalWrites = pendingWrites.filter(w => w.priority === 'medium');
      const lowPriorityWrites = pendingWrites.filter(w => w.priority === 'low');

      // Process writes in order of priority
      await FirebaseDatabaseSync.processBatchWrites(this.userId, criticalWrites);
      await FirebaseDatabaseSync.processBatchWrites(this.userId, normalWrites);
      await FirebaseDatabaseSync.processBatchWrites(this.userId, lowPriorityWrites);

      // Update last sync time
      await LocalStorage.updateSyncMeta({
        lastSync: new Date().toISOString(),
        version: (await LocalStorage.getSyncMeta())?.version || 1
      });

    } catch (error) {
      console.error('Sync error:', error);
      // Will retry on next interval
    }
  }

  private handleOnline = async (): Promise<void> => {
    if (this.userId) {
      await this.performSync();
    }
  };

  private handleOffline = (): void => {
    // Just log the offline state, local storage continues to work
    console.log('Device is offline, local storage active');
  };

  async updateGameState(update: Partial<GameState>): Promise<void> {
    if (!this.userId) throw new Error('SyncManager not initialized');

    try {
      // Update local state immediately
      const currentState = await LocalStorage.getGameState(this.userId);
      if (!currentState) throw new Error('Local state not found');

      const newState = { ...currentState, ...update };
      await LocalStorage.saveGameState(this.userId, newState);

      // Add to pending writes with appropriate priority
      const priority = this.determinePriority(update);
      await LocalStorage.addPendingWrite({
        type: 'UPDATE_STATE',
        data: update,
        priority
      });

      // If critical update, try to sync immediately
      if (priority === 'high' && navigator.onLine) {
        await this.performSync();
      }

    } catch (error) {
      console.error('Error updating game state:', error);
      // Store emergency backup
      localStorage.setItem(`gameState_${this.userId}_emergency`, JSON.stringify({
        ...update,
        timestamp: Date.now()
      }));
    }
  }

  private determinePriority(update: Partial<GameState>): 'high' | 'medium' | 'low' {
    // Critical updates that need immediate sync
    if (
      'health' in update ||
      'inComa' in update ||
      'location' in update ||
      'comaStartTime' in update ||
      'comaEndTime' in update
    ) {
      return 'high';
    }

    // Important but not critical updates
    if (
      'actionPoints' in update ||
      'movementPoints' in update ||
      'inventory' in update ||
      'money' in update
    ) {
      return 'medium';
    }

    // Everything else
    return 'low';
  }

  async getGameState(): Promise<GameState | null> {
    if (!this.userId) throw new Error('SyncManager not initialized');
    return LocalStorage.getGameState(this.userId);
  }

  async forceSync(): Promise<void> {
    if (!this.userId) throw new Error('SyncManager not initialized');
    await this.performSync();
  }

  cleanup(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    this.isInitialized = false;
    this.userId = null;
  }
}
