import { db } from '../firebase';
import { ref, get, update, set } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';
import { CRAFTING_MATERIALS, Material } from '../types/crafting';

export class DiscoveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DiscoveryError';
  }
}

export const DiscoveryService = {
  DISCOVERY_CHANCES: {
    workshop: 0.80,
    kitchen: 0.70,
    yard: 0.60,
    cell: 0.50,
    gym: 0.60,
    showers: 0.50,
    infirmary: 0.40,
    guard: 0.30,
    director: 0.40
  },

  COOLDOWN_TIME: 3000,

  // Fonction d'ajustement des chances de découverte en fonction des attributs du joueur
  adjustDiscoveryChance(userStats: any, baseChance: number, location: string): number {
    // Exemple d'ajustement basé sur un attribut fictif de chance (à ajouter dans les stats du joueur)
    let adjustedChance = baseChance;

    // Si l'utilisateur a une compétence qui améliore la découverte, on ajuste
    if (userStats.discoveryBoost) {
      adjustedChance += userStats.discoveryBoost;
    }

    // Vous pouvez aussi appliquer des ajustements spécifiques à des lieux (exemple : un bonus pour la cuisine)
    if (location === 'kitchen' && userStats.hasCookBook) {
      adjustedChance += 0.10; // Exemple d'amélioration pour un objet spécifique
    }

    return Math.min(adjustedChance, 1); // La probabilité ne peut pas dépasser 100%
  },

  async checkLocationDiscovery(userId: string, location: string, dispatch: any): Promise<{
    found: boolean;
    itemName?: string;
    itemEmoji?: string;
  }> {
    try {
      const now = Date.now();
      const lastCheckRef = ref(db, `users/${userId}/lastCheck`);
      const lastCheckSnapshot = await get(lastCheckRef);
      const lastCheck = lastCheckSnapshot.val();

      if (lastCheck && now - lastCheck < this.COOLDOWN_TIME) {
        return { found: false };
      }

      await set(lastCheckRef, now);

      const userRef = ref(db, `users/${userId}`);
      const userSnapshot = await get(userRef);

      if (!userSnapshot.exists()) throw new DiscoveryError('Utilisateur non trouvé');

      const userData = userSnapshot.val();
      const userStats = userData.stats || {};
      const discoveryChance = this.DISCOVERY_CHANCES[location] || 0.2;

      // Ajustement de la chance de découverte
      const adjustedChance = this.adjustDiscoveryChance(userStats, discoveryChance, location);

      if (Math.random() < (adjustedChance * 1.5)) {  // Chance augmentée pour plus de fun
        const availableMaterials = Object.entries(CRAFTING_MATERIALS)
          .filter(([_, material]) => material.locations.includes(location))
          .map(([id, material]) => ({
            id,
            ...material
          }));

        if (availableMaterials.length === 0) return { found: false };

        // Sélection d'un matériel en fonction de son poids ajusté
        const totalWeight = availableMaterials.reduce((sum, mat) => sum + (100 - mat.rarity), 0);
        let randomValue = Math.random() * totalWeight;
        let selectedMaterial = null;

        for (const material of availableMaterials) {
          randomValue -= (100 - material.rarity);
          if (randomValue <= 0) {
            selectedMaterial = material;
            break;
          }
        }

        if (!selectedMaterial) selectedMaterial = availableMaterials[0];

        const inventory = userData.inventory || [];
        const history = userData.history || [];

        const newItem = {
          id: uuidv4(),
          ...selectedMaterial,
          type: 'material',
          quantity: 1
        };

        const existingItemIndex = inventory.findIndex(item => 
          item.type === 'material' && item.name === selectedMaterial.name
        );

        let updatedInventory;
        if (existingItemIndex >= 0) {
          updatedInventory = inventory.map((item, index) =>
            index === existingItemIndex
              ? { ...item, quantity: (item.quantity || 1) + 1 }
              : item
          );
        } else {
          updatedInventory = [...inventory, newItem];
        }

        await update(userRef, {
          inventory: updatedInventory,
          history: [{
            type: 'discovery',
            description: `${selectedMaterial.emoji} Vous avez trouvé ${selectedMaterial.name}!`,
            timestamp: new Date().toISOString()
          }, ...history.slice(0, 49)],
          lastUpdate: new Date().toISOString()
        });

        dispatch({ type: 'UPDATE_INVENTORY', payload: updatedInventory });

        return { found: true, itemName: selectedMaterial.name, itemEmoji: selectedMaterial.emoji };
      } else {
        // Optionnel : ajouter un message ou des notifications quand rien n'a été trouvé
        return { found: false };
      }
    } catch (error) {
      console.error('Error in discovery service:', error);
      throw error instanceof DiscoveryError ? error : new DiscoveryError('Erreur lors de la découverte');
    }
  }
};
