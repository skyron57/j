import { db } from '../firebase';
import { ref, set, update, get } from 'firebase/database';

// Interface pour définir la structure du GameState
interface GameState {
  // Ajoutez vos propriétés de jeu ici
  score?: number;
  level?: number;
  // ... autres propriétés
}

// Interface pour le cache
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

class SyncManager {
  private static instance: SyncManager;
  private userId: string;
  private cache: Map<string, CacheItem<any>>;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private retryAttempts = 3;
  private retryDelay = 1000; // 1 seconde

  private constructor() {
    this.userId = '';
    this.cache = new Map();
  }

  public static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  public initialize(userId: string): void {
    this.userId = userId;
    this.cache.clear(); // Nettoyer le cache lors de l'initialisation
  }

  private async retry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * Math.pow(2, attempt)));
      }
    }
    
    throw new Error(`Operation failed after ${this.retryAttempts} attempts: ${lastError?.message}`);
  }

  private setCacheItem<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn: this.CACHE_DURATION
    });
  }

  private getCacheItem<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.expiresIn) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  public async updateGameState(update: Partial<GameState>): Promise<void> {
    if (!this.userId) throw new Error('User not initialized');

    await this.retry(async () => {
      const userRef = ref(db, `users/${this.userId}`);
      await update(userRef, update);
      
      // Mettre à jour le cache avec les nouvelles données
      const currentCache = this.getCacheItem<GameState>('gameState') || {};
      this.setCacheItem('gameState', { ...currentCache, ...update });
    });
  }

  public async getGameState(): Promise<GameState | null> {
    if (!this.userId) throw new Error('User not initialized');

    // Vérifier d'abord le cache
    const cachedState = this.getCacheItem<GameState>('gameState');
    if (cachedState) return cachedState;

    // Si pas dans le cache, récupérer depuis Firebase
    return await this.retry(async () => {
      const userRef = ref(db, `users/${this.userId}`);
      const snapshot = await get(userRef);
      const data = snapshot.val() as GameState;
      
      if (data) {
        this.setCacheItem('gameState', data);
      }
      
      return data;
    });
  }

  public async forceSync(): Promise<void> {
    if (!this.userId) throw new Error('User not initialized');

    await this.retry(async () => {
      const userRef = ref(db, `users/${this.userId}`);
      await set(userRef, { ...defaultGameState });
      this.setCacheItem('gameState', { ...defaultGameState });
    });
  }

  public cleanup(): void {
    this.userId = '';
    this.cache.clear();
  }
}

export { SyncManager, GameState };
