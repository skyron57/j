import { getDatabase, ref, set, update, child, push, get } from 'firebase/database';
import { PRISON_WEAPONS } from '../../types/weapon';
import { PRISON_ITEMS } from '../../types/inventory';
import { WEAPONS } from '../../types/combat';
import { CRAFTING_MATERIALS, CRAFTING_RECIPES } from '../../types/crafting';
import { app } from '../../firebase/config'; // Assure-toi que Firebase est bien initialisé

// Obtenir la référence de la base de données
const db = getDatabase(app);

// Interface des éléments
export interface BaseItem {
  id: string;
  name: string;
  description: string;
  emoji: string;
  type: ItemType;
  rarity: number;
  quantity: number;
}

export type ItemType = 'weapon' | 'defense' | 'material' | 'consumable' | 'crafted';

// Item spécifique pour une arme
export interface WeaponItem extends BaseItem {
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
  deathMessage?: string;
}

// Fonction pour ajouter un élément dans l'inventaire d'un joueur
const addItemToInventory = async (userId: string, newItem: BaseItem) => {
  const inventoryRef = ref(db, 'users/' + userId + '/inventory');

  // Récupérer l'inventaire existant
  const snapshot = await get(inventoryRef);
  const inventory = snapshot.exists() ? snapshot.val() : {};

  // Ajouter l'élément à l'inventaire
  const newItemRef = push(inventoryRef); // Crée une nouvelle entrée avec une ID générée par Firebase
  await set(newItemRef, {
    ...newItem,
    id: newItemRef.key,
  });
};

// Fonction pour enlever un élément de l'inventaire
const removeItemFromInventory = async (userId: string, itemId: string) => {
  const itemRef = ref(db, 'users/' + userId + '/inventory/' + itemId);
  await set(itemRef, null); // Enlève l'élément en mettant sa valeur à null
};

// Fonction pour endommager une arme
const damageWeapon = async (userId: string, weaponId: string, amount: number) => {
  const weaponRef = ref(db, 'users/' + userId + '/inventory/' + weaponId);

  const snapshot = await get(weaponRef);
  if (snapshot.exists()) {
    const weapon = snapshot.val();
    const updatedDurability = Math.max(0, weapon.durability.current - amount);

    // Mettre à jour la durabilité de l'arme dans la base de données
    await update(weaponRef, {
      'durability/current': updatedDurability
    });
  } else {
    console.error('Arme non trouvée');
  }
};

// Fonction pour réparer une arme
const repairWeapon = async (userId: string, weaponId: string, amount: number) => {
  const weaponRef = ref(db, 'users/' + userId + '/inventory/' + weaponId);

  const snapshot = await get(weaponRef);
  if (snapshot.exists()) {
    const weapon = snapshot.val();
    const updatedDurability = Math.min(weapon.durability.max, weapon.durability.current + amount);

    // Mettre à jour la durabilité de l'arme
    await update(weaponRef, {
      'durability/current': updatedDurability
    });
  } else {
    console.error('Arme non trouvée');
  }
};

// Fonction pour vérifier si une arme est cassée
const isWeaponBroken = (weapon: WeaponItem): boolean => {
  return weapon.durability.current <= 0;
};

// Initialisation des objets de l'inventaire
const initializeWeapon = (baseWeapon: any): WeaponItem => ({
  id: uuidv4(),
  ...baseWeapon,
  type: 'weapon',
  quantity: 1,
  durability: { current: 100, max: 100 },
  equipped: false,
  rarity: baseWeapon.rarity || 1
});

const initializeConsumable = (baseItem: any): ConsumableItem => ({
  id: uuidv4(),
  ...baseItem,
  type: 'consumable',
  quantity: 1,
  rarity: baseItem.rarity || 1
});

const initializeMaterial = (baseMaterial: any): MaterialItem => ({
  id: uuidv4(),
  ...baseMaterial,
  type: 'material',
  quantity: 1,
  rarity: baseMaterial.rarity || 1
});

// Fonction d'initialisation de l'inventaire global
const initializeGlobalInventory = () => {
  return {
    weapons: Object.entries(PRISON_WEAPONS).map(([_, weapon]) => 
      initializeWeapon({
        ...weapon,
        stats: {
          attack: weapon.stats.attack || 0,
          defense: weapon.stats.defense || 0,
          agility: weapon.stats.agility || 0,
          dodge: weapon.stats.dodge || 0
        }
      })
    ),
    combatWeapons: Object.entries(WEAPONS).map(([_, weapon]) => 
      initializeWeapon({
        ...weapon,
        stats: {
          attack: weapon.stats.attack || 0,
          defense: weapon.stats.defense || 0,
          agility: weapon.stats.agility || 0,
          dodge: weapon.stats.dodge || 0
        }
      })
    ),
    consumables: Object.entries(PRISON_ITEMS).map(([_, item]) => 
      initializeConsumable({
        ...item,
        effect: {
          type: item.effect?.type || 'health',
          value: item.effect?.value || 0
        }
      })
    ),
    materials: Object.entries(CRAFTING_MATERIALS).map(([_, material]) => 
      initializeMaterial({
        ...material,
        locations: material.locations || []
      })
    ),
    recipes: CRAFTING_RECIPES
  };
};
