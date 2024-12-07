import { db } from '../../firebase';
import { ref, set, get, update } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';
import { PRISON_WEAPONS } from '../../types/weapon';
import { PRISON_ITEMS } from '../../types/inventory';
import { WEAPONS } from '../../types/combat';
import { CRAFTING_MATERIALS, CRAFTING_RECIPES } from '../../types/crafting';

// Unified item type
export type ItemType = 'weapon' | 'defense' | 'material' | 'consumable' | 'crafted';

export interface ItemBase {
  id: string;
  name: string;
  description: string;
  emoji: string;
  type: ItemType;
  quantity: number;
  rarity: number;
}

export interface WeaponItem extends ItemBase {
  type: 'weapon' | 'crafted';
  stats: {
    attack: number;
    defense: number;
    agility: number;
    dodge: number;
  };
  durability: {
    current: number;
    max: number;
  };
  equipped?: boolean;
  craftable?: boolean;
  deathMessage?: string;
}

export interface ConsumableEffect {
  type: 'health' | 'actionPoints' | 'anabolic' | 'revive';
  value: number;
}

export interface ConsumableItem extends ItemBase {
  type: 'consumable';
  effect: ConsumableEffect;
}

export interface MaterialItem extends ItemBase {
  type: 'material';
  locations: string[];
}

export type InventoryItem = WeaponItem | ConsumableItem | MaterialItem;

// Helper functions
const fetchInventory = async (userId: string): Promise<InventoryItem[]> => {
  const userRef = ref(db, `users/${userId}/inventory`);
  const snapshot = await get(userRef);
  return snapshot.exists() ? snapshot.val() : [];
};

// Item creation functions
export const createWeapon = (
  baseWeapon: typeof PRISON_WEAPONS[keyof typeof PRISON_WEAPONS] | typeof WEAPONS[keyof typeof WEAPONS],
  isCrafted = false
): WeaponItem => ({
  id: uuidv4(),
  ...baseWeapon,
  type: isCrafted ? 'crafted' : 'weapon',
  quantity: 1,
  durability: {
    current: 100,
    max: 100,
  },
  equipped: false,
  craftable: isCrafted,
});

export const createConsumable = (
  baseItem: typeof PRISON_ITEMS[keyof typeof PRISON_ITEMS]
): ConsumableItem => ({
  id: uuidv4(),
  ...baseItem,
  type: 'consumable',
  quantity: 1,
});

export const createMaterial = (
  baseMaterial: typeof CRAFTING_MATERIALS[keyof typeof CRAFTING_MATERIALS]
): MaterialItem => ({
  id: uuidv4(),
  ...baseMaterial,
  type: 'material',
  quantity: 1,
});

// Inventory management functions
export const addItemToInventory = async (
  userId: string,
  newItem: InventoryItem
): Promise<void> => {
  try {
    const inventory = await fetchInventory(userId);

    // Check if item can be stacked
    const existingIndex = inventory.findIndex((item) => canStackItems(item, newItem));
    if (existingIndex >= 0) {
      inventory[existingIndex] = stackItems(inventory[existingIndex], newItem);
    } else {
      inventory.push(newItem);
    }

    // Save updated inventory
    const userRef = ref(db, `users/${userId}/inventory`);
    await set(userRef, inventory);
  } catch (error) {
    console.error('Error adding item to inventory:', error);
    throw error;
  }
};

export const removeItemFromInventory = async (
  userId: string,
  itemId: string,
  amount = 1
): Promise<void> => {
  try {
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      throw new Error('User not found');
    }

    const userData = snapshot.val();
    const inventory = userData.inventory || [];

    // Find item and reduce quantity
    const itemIndex = inventory.findIndex((item: InventoryItem) => item.id === itemId);
    if (itemIndex < 0) {
      throw new Error('Item not found');
    }

    const item = inventory[itemIndex];
    if (item.quantity <= amount) {
      inventory.splice(itemIndex, 1);
    } else {
      inventory[itemIndex] = { ...item, quantity: item.quantity - amount };
    }

    // Update inventory and user data
    await update(userRef, {
      inventory,
      lastUpdate: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error removing item from inventory:', error);
    throw error;
  }
};

// Helper: Check if items can be stacked
export const canStackItems = (item1: InventoryItem, item2: InventoryItem): boolean => {
  return (
    item1.type === item2.type &&
    item1.type !== 'weapon' &&
    item1.name === item2.name
  );
};

// Helper: Stack items
export const stackItems = (item1: InventoryItem, item2: InventoryItem): InventoryItem => {
  if (!canStackItems(item1, item2)) {
    throw new Error('Cannot stack these items');
  }
  return {
    ...item1,
    quantity: item1.quantity + item2.quantity,
  };
};
