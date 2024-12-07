import { ref, get, update, set, child } from 'firebase/database';
import { db } from '../firebase';
import { CRAFTING_RECIPES, CraftingRecipe } from '../types/crafting';
import { v4 as uuidv4 } from 'uuid';

export class CraftingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CraftingError';
  }
}

export const CraftingService = {
  async craftItem(userId: string, recipeId: string, dispatch: any): Promise<void> {
    try {
      const recipe = CRAFTING_RECIPES.find(r => r.id === recipeId);
      if (!recipe) {
        throw new CraftingError('Recette invalide');
      }

      const userRef = ref(db, `users/${userId}`);
      const userSnapshot = await get(userRef);
        
      if (!userSnapshot.exists()) {
        throw new CraftingError('Utilisateur non trouvé');
      }

      const userData = userSnapshot.val();
      const inventory = userData.inventory || [];

      // Vérifier les matériaux
      for (const material of recipe.materials) {
        const inventoryItem = inventory.find(item => item.id === material.itemId);
        if (!inventoryItem || inventoryItem.quantity < material.quantity) {
          throw new CraftingError(`Matériaux insuffisants: ${material.name}`);
        }
      }

      // Retirer les matériaux utilisés
      const updatedInventory = inventory.map(item => {
        const material = recipe.materials.find(m => m.itemId === item.id);
        if (material) {
          return {
            ...item,
            quantity: item.quantity - material.quantity
          };
        }
        return item;
      }).filter(item => item.quantity > 0);

      // Créer l'arme fabriquée
      const craftedWeapon = {
        id: uuidv4(),
        name: recipe.name,
        description: recipe.description,
        emoji: recipe.emoji,
        type: 'crafted',
        category: 'weapon',
        stats: recipe.stats,
        durability: {
          current: 100,
          max: 100
        },
        equipped: false,
        craftable: true,
        deathMessage: `{killer} vous a tué avec ${recipe.name} !`
      };

      // Ajouter l'arme à l'inventaire
      updatedInventory.push(craftedWeapon);

      // Mettre à jour l'inventaire et l'historique
      const updateData: any = {
        inventory: updatedInventory,
        lastUpdate: new Date().toISOString(),
        history: [
          {
            type: 'craft',
            description: `${recipe.emoji} Vous avez fabriqué ${recipe.name}`,
            timestamp: new Date().toISOString()
          },
          ...(userData.history || []).slice(0, 49)
        ]
      };

      // Vérifier et nettoyer les données avant la sauvegarde
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      await update(userRef, updateData);

      // Enregistrer l'action de fabrication
      const actionRef = ref(db, `users/${userId}/actions`);
      const newAction = {
        type: 'craft',
        description: `${recipe.emoji} Vous avez fabriqué ${recipe.name}`,
        timestamp: new Date().toISOString()
      };
      await set(child(actionRef, `${new Date().getTime()}`), newAction);

      // Mettre à jour le state local
      dispatch({
        type: 'UPDATE_INVENTORY',
        payload: updatedInventory
      });

      dispatch({
        type: 'ADD_ACTION',
        payload: newAction
      });
    } catch (error) {
      console.error('Error crafting item:', error);
      if (error instanceof CraftingError) {
        throw error;
      }
      throw new CraftingError('Erreur lors de la fabrication');
    }
  },

  getAvailableRecipes(location: string, inventory: any[]): CraftingRecipe[] {
    // Filtrer les recettes disponibles dans la location actuelle
    const recipesInLocation = CRAFTING_RECIPES.filter(recipe => 
      recipe.location === location || recipe.location === 'all'
    );

    // Vérifier les matériaux disponibles pour chaque recette
    return recipesInLocation.filter(recipe => {
      const hasAllMaterials = recipe.materials.every(material => {
        const inventoryItem = inventory.find(item => 
          item.type === 'material' &&
          item.id === material.itemId &&
          item.quantity >= material.quantity
        );
        return !!inventoryItem;
      });
      return hasAllMaterials;
    });
  },

  getMaterialsInInventory(inventory: any[]) {
    return inventory.filter(item => item.type === 'material');
  }
};
