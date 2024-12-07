import { db } from '../firebase';
import { ref, set, get, update } from 'firebase/database';

export class FirebaseService {
  static async updateData(path: string, userId: string, data: any) {
    try {
      const userRef = ref(db, `${path}/${userId}`);
      await update(userRef, data);
    } catch (error) {
      console.error('Error updating data in Firebase:', error);
      throw error;
    }
  }

  static async getData(path: string, userId: string) {
    try {
      const userRef = ref(db, `${path}/${userId}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        return snapshot.val();
      }
      return null;
    } catch (error) {
      console.error('Error getting data from Firebase:', error);
      throw error;
    }
  }
}
