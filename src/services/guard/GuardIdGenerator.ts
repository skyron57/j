import { v4 as uuidv4 } from 'uuid';
import { ref, get, set, remove } from 'firebase/database';
import { db } from '../../firebase';

export class GuardIdGenerator {
  private static usedIds = new Set<string>();

  static async generateId(): Promise<string> {
    let guardId: string;
    do {
      guardId = `guard-${uuidv4()}`;
    } while (await this.isIdUsed(guardId));

    this.usedIds.add(guardId);
    await this.storeId(guardId);
    return guardId;
  }

  static async isIdUsed(id: string): Promise<boolean> {
    if (this.usedIds.has(id)) {
      return true;
    }

    try {
      const idRef = ref(db, `usedIds/${id}`);
      const snapshot = await get(idRef);
      return snapshot.exists();
    } catch (error) {
      console.error('Error checking ID:', error);
      return false;
    }
  }

  private static async storeId(id: string): Promise<void> {
    try {
      const idRef = ref(db, `usedIds/${id}`);
      await set(idRef, true);
    } catch (error) {
      console.error('Error storing ID:', error);
    }
  }

  static async releaseId(id: string): Promise<void> {
    this.usedIds.delete(id);
    try {
      const idRef = ref(db, `usedIds/${id}`);
      await remove(idRef);
    } catch (error) {
      console.error('Error releasing ID:', error);
    }
  }

  static async clearUsedIds(): Promise<void> {
    this.usedIds.clear();
    try {
      const idsRef = ref(db, 'usedIds');
      await remove(idsRef);
    } catch (error) {
      console.error('Error clearing IDs:', error);
    }
  }
}
