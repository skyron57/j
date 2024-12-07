import React, { useState } from 'react';
import { Wrench, AlertCircle, Package } from 'lucide-react';
import { useGameState } from '../contexts/GameStateContext';
import { CraftingService } from '../services/crafting';
import { CraftingRecipe } from '../types/crafting';

export const CraftingPanel: React.FC = () => {
  const { state, dispatch } = useGameState();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const availableRecipes = CraftingService.getAvailableRecipes(state.location, state.inventory);
  const materialsInInventory = CraftingService.getMaterialsInInventory(state.inventory);

  const handleCraft = async (recipe: CraftingRecipe) => {
    try {
      setError(null);
      setLoading(true);
      await CraftingService.craftItem(state.id, recipe.id, dispatch);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Matériaux disponibles */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg prison-font mb-4 flex items-center gap-2">
          <Package size={20} className="text-blue-400" />
          Matériaux disponibles
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {materialsInInventory.map(material => (
            <div key={material.id} className="bg-gray-700 rounded-lg p-3 flex items-center gap-3">
              <span className="text-2xl">{material.emoji}</span>
              <div>
                <div className="font-medium">{material.name}</div>
                <div className="text-sm text-gray-400">Quantité: {material.quantity}</div>
              </div>
            </div>
          ))}
          {materialsInInventory.length === 0 && (
            <div className="col-span-full text-center text-gray-500 py-4">
              Aucun matériau disponible
            </div>
          )}
        </div>
      </div>

      {/* Recettes disponibles */}
      <div className="grid grid-cols-1 gap-4">
        <h3 className="text-lg prison-font flex items-center gap-2">
          <Wrench size={20} className="text-yellow-400" />
          Recettes disponibles
        </h3>

        {availableRecipes.map(recipe => (
          <div
            key={recipe.id}
            className="bg-gray-800/50 p-4 rounded-lg border border-gray-700"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{recipe.emoji}</span>
              <div>
                <h3 className="font-bold">{recipe.name}</h3>
                <p className="text-sm text-gray-400">{recipe.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 text-sm mb-3">
              <div className="text-red-400">ATT: +{recipe.stats.attack}</div>
              <div className="text-blue-400">DEF: +{recipe.stats.defense}</div>
              <div className="text-yellow-400">AGI: +{recipe.stats.agility}</div>
              <div className="text-green-400">ESQ: {recipe.stats.dodge}</div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {recipe.materials.map((material, index) => {
                const inventoryItem = state.inventory.find(item => 
                  item.type === 'material' && 
                  item.name === material.name
                );
                const hasEnough = inventoryItem && inventoryItem.quantity >= material.quantity;

                return (
                  <div
                    key={index}
                    className={`px-2 py-1 text-sm rounded-lg flex items-center gap-1 ${
                      hasEnough 
                        ? 'bg-green-900/20 text-green-400' 
                        : 'bg-red-900/20 text-red-400'
                    }`}
                  >
                    <span>{material.emoji}</span>
                    <span>
                      {material.quantity}x {material.name}
                      {inventoryItem && ` (${inventoryItem.quantity})`}
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => handleCraft(recipe)}
              disabled={loading}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Wrench size={20} />
              {loading ? 'Fabrication...' : 'Fabriquer'}
            </button>
          </div>
        ))}

        {availableRecipes.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <Wrench size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg prison-font">Aucune recette disponible</p>
            <p className="text-sm">Trouvez des matériaux pour débloquer des recettes</p>
          </div>
        )}
      </div>
    </div>
  );
};
