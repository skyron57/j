import { db } from '../firebase';
import { ref, set, update, get } from 'firebase/database';
import { sanitizeDataForFirebase, validateFirebaseData } from '../utils/firebaseUtils';

export class FirebaseError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'FirebaseError';
  }
}

export class FirebaseService {
  static async saveData(path: string, userId: string, data: any): Promise<void> {
    try {
      // Validate data
      if (!validateFirebaseData(data)) {
        throw new FirebaseError('Invalid data structure', 'invalid-data');
      }

      // Clean data
      const sanitizedData = sanitizeDataForFirebase(data);

      // Add timestamp
      const dataWithTimestamp = {
        ...sanitizedData,
        lastUpdate: new Date().toISOString()  // Firebase Realtime Database doesn't have serverTimestamp directly
      };

      // Create reference
      const userRef = ref(db, `${path}/${userId}`);

      // Set or update data
      await set(userRef, dataWithTimestamp);
    } catch (error: any) {
      console.error('Firebase save error:', error);

      if (error instanceof FirebaseError) {
        throw error;
      }

      throw new FirebaseError(
        error.message || 'Error saving data',
        error.code
      );
    }
  }

  static async getData(path: string, userId: string): Promise<any> {
    try {
      const userRef = ref(db, `${path}/${userId}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        return null;
      }

      return snapshot.val();
    } catch (error: any) {
      console.error('Firebase get error:', error);

      if (error instanceof FirebaseError) {
        throw error;
      }

      throw new FirebaseError(
        error.message || 'Error retrieving data',
        error.code
      );
    }
  }

  static async updateData(path: string, userId: string, data: any): Promise<void> {
    try {
      const userRef = ref(db, `${path}/${userId}`);
      const snapshot = await get(userRef);

      // Create document if it doesn't exist
      if (!snapshot.exists()) {
        await set(userRef, {
          ...data,
          createdAt: new Date().toISOString(),
          lastUpdate: new Date().toISOString()
        });
        return;
      }

      // Merge with existing data
      const existingData = snapshot.val();
      const mergedData = {
        ...existingData,
        ...data,
        lastUpdate: new Date().toISOString()
      };

      // Validate and clean
      if (!validateFirebaseData(mergedData)) {
        const cleanedData = this.cleanInvalidData(mergedData);
        await update(userRef, cleanedData);
        return;
      }

      const sanitizedData = sanitizeDataForFirebase(mergedData);
      await update(userRef, sanitizedData);
    } catch (error: any) {
      console.error('Firebase update error:', error);

      if (error instanceof FirebaseError) {
        throw error;
      }

      throw new FirebaseError(
        error.message || 'Error updating data',
        error.code
      );
    }
  }

  private static cleanInvalidData(data: any): any {
    if (!data) return {};

    const clean = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(item => clean(item)).filter(Boolean);
      }

      if (typeof obj === 'object' && obj !== null) {
        const cleaned: any = {};
        for (const [key, value] of Object.entries(obj)) {
          if (value === undefined || value === null) continue;
          if (typeof value === 'function') continue;
          if (Number.isNaN(value)) continue;

          cleaned[key] = clean(value);
        }
        return cleaned;
      }

      return obj;
    };

    return clean(data);
  }
}
