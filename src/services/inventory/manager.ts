import { db } from '../firebase';
import { ref, set, get, update } from 'firebase/database';
import {
  InventoryItem,
  WeaponItem,
  ConsumableItem,
  addItemToInventory,
  removeItemFromInventory,
  damageWeapon,
  repairWeapon,
  isWeaponBroken
} from './items';

export class InventoryManager {
  private static instance: InventoryManager | null = null;
  
  private constructor() {}

  static getInstance(): InventoryManager {
    if (!this.instance) {
      this.instance = new InventoryManager();
    }
    return this.instance;
  }

  async addItem(userId: string, item: InventoryItem): Promise<void> {
    try {
      const userRef = ref(db, `users/${userId}`);
      const userSnapshot = await get(userRef);

      if (!userSnapshot.exists()) {
        throw new Error('User not found');
      }

      const userData = userSnapshot.val();
      const inventory = userData.inventory || [];
      
      const updatedInventory = addItemToInventory(inventory, item);

      // Met à jour l'inventaire de l'utilisateur dans la Realtime Database
      await update(userRef, {
        inventory: updatedInventory,
        lastUpdate: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error adding item:', error);
      throw error;
    }
  }

  async removeItem(userId: string, itemId: string, amount = 1): Promise<void> {
    try {
      const userRef = ref(db, `users/${userId}`);
      const userSnapshot = await get(userRef);
      
      if (!userSnapshot.exists()) {
        throw new Error('User not found');
      }

      const userData = userSnapshot.val();
      const inventory = userData.inventory || [];
      
      const updatedInventory = removeItemFromInventory(inventory, itemId, amount);

      // Met à jour l'inventaire de l'utilisateur dans la Realtime Database
      await update(userRef, {
        inventory: updatedInventory,
        lastUpdate: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error removing item:', error);
      throw error;
    }
  }

  async useConsumable(userId: string, item: ConsumableItem): Promise<void> {
    try {
      const userRef = ref(db, `users/${userId}`);
      const userSnapshot = await get(userRef);
      
      if (!userSnapshot.exists()) {
        throw new Error('User not found');
      }

      const userData = userSnapshot.val();

      // Appliquer l'effet de l'item
      switch (item.effect.type) {
        case 'health':
          await update(userRef, {
            health: Math.min(100, userData.health + item.effect.value)
          });
          break;
        case 'actionPoints':
          await update(userRef, {
            actionPoints: Math.min(30, userData.actionPoints + item.effect.value)
          });
          break;
        case 'anabolic':
          await update(userRef, {
            'activeAnabolic.endTime': new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            'activeAnabolic.bonusAP': 20
          });
          break;
        case 'revive':
          await update(userRef, {
            hasRevive: true
          });
          break;
      }

      // Supprimer l'item utilisé
      await this.removeItem(userId, item.id);

    } catch (error) {
      console.error('Error using consumable:', error);
      throw error;
    }
  }

  async damageEquippedWeapon(userId: string, amount: number): Promise<void> {
    try {
      const userRef = ref(db, `users/${userId}`);
      const userSnapshot = await get(userRef);
      
      if (!userSnapshot.exists()) {
        throw new Error('User not found');
      }

      const userData = userSnapshot.val();
      const inventory = userData.inventory || [];
      
      const equippedWeapon = inventory.find(
        (item: WeaponItem) => item.type === 'weapon' && item.equipped
      );

      if (!equippedWeapon) return;

      const damagedWeapon = damageWeapon(equippedWeapon, amount);
      
      if (isWeaponBroken(damagedWeapon)) {
        // Supprimer l'arme cassée
        await this.removeItem(userId, equippedWeapon.id);
      } else {
        // Mettre à jour la durabilité de l'arme
        const updatedInventory = inventory.map(item =>
          item.id === equippedWeapon.id ? damagedWeapon : item
        );

        // Met à jour l'inventaire dans la Realtime Database
        await update(userRef, {
          inventory: updatedInventory,
          lastUpdate: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('Error damaging weapon:', error);
      throw error;
    }
  }

  async repairWeapon(userId: string, weaponId: string, amount: number): Promise<void> {
    try {
      const userRef = ref(db, `users/${userId}`);
      const userSnapshot = await get(userRef);
      
      if (!userSnapshot.exists()) {
        throw new Error('User not found');
      }

      const userData = userSnapshot.val();
      const inventory = userData.inventory || [];
      
      const weapon = inventory.find(
        (item: WeaponItem) => item.id === weaponId && 
        (item.type === 'weapon' || item.type === 'crafted')
      );

      if (!weapon) {
        throw new Error('Weapon not found');
      }

      const repairedWeapon = repairWeapon(weapon, amount);
      const updatedInventory = inventory.map(item =>
        item.id === weaponId ? repairedWeapon : item
      );

      // Met à jour l'inventaire dans la Realtime Database
      await update(userRef, {
        inventory: updatedInventory,
        lastUpdate: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error repairing weapon:', error);
      throw error;
    }
  }
}

export default InventoryManager.getInstance();
