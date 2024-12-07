import { db } from '../../firebase';
import { ref, get, update } from 'firebase/database';
import { ConsumableItem } from './items';

export const useConsumableItem = async (userId: string, itemId: string): Promise<void> => {
  try {
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      throw new Error('User not found');
    }

    const userData = snapshot.val();
    const inventory = userData.inventory || [];
    
    // Find the consumable item
    const itemIndex = inventory.findIndex((item: any) => item.id === itemId);
    if (itemIndex === -1) {
      throw new Error('Item not found');
    }

    const item = inventory[itemIndex] as ConsumableItem;
    if (item.type !== 'consumable') {
      throw new Error('Item is not consumable');
    }

    // Check if health is already full for health items
    if (item.effect.type === 'health' && userData.health >= 100) {
      throw new Error('Points de vie déjà au maximum');
    }

    // Apply item effect
    const updates: any = {};
    switch (item.effect.type) {
      case 'health':
        updates.health = Math.min(100, userData.health + item.effect.value);
        break;
      case 'actionPoints':
        const maxAP = userData.activeAnabolic?.endTime ? 30 : 20;
        updates.actionPoints = Math.min(maxAP, userData.actionPoints + item.effect.value);
        break;
      case 'anabolic':
        updates.activeAnabolic = {
          endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          bonusAP: 20
        };
        break;
      case 'revive':
        updates.hasRevive = true;
        break;
    }

    // Remove item if quantity is 1, otherwise decrease quantity
    if (item.quantity <= 1) {
      inventory.splice(itemIndex, 1);
    } else {
      inventory[itemIndex] = { ...item, quantity: item.quantity - 1 };
    }

    // Update database
    await update(userRef, {
      ...updates,
      inventory,
      lastUpdate: new Date().toISOString(),
      history: [{
        type: 'use_item',
        description: `${item.emoji} Vous avez utilisé ${item.name}`,
        timestamp: new Date().toISOString()
      }, ...(userData.history || []).slice(0, 49)]
    });

  } catch (error) {
    console.error('Error using consumable:', error);
    throw error;
  }
};
