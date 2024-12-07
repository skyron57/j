import React, { useState } from 'react';
import { Package } from 'lucide-react';
import { useGameState } from '../contexts/GameStateContext';
import { InventoryItemDisplay } from '../components/InventoryItem';
import { InventoryItem } from '../services/inventory/globalInventory';

type ItemCategory = 'weapon' | 'defense' | 'material' | 'consumable' | 'crafted';

export const Inventory: React.FC = () => {
  const { state } = useGameState();
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | 'all'>('all');

  // Filter and sort inventory items
  const sortedInventory = [...state.inventory].sort((a, b) => {
    const categoryOrder = {
      'weapon': 1,
      'crafted': 1,
      'defense': 2,
      'material': 3,
      'consumable': 4
    };
    return (categoryOrder[a.type] || 99) - (categoryOrder[b.type] || 99);
  });

  // Logic to ensure items with the same id are combined (quantity is updated)
  const updatedInventory = sortedInventory.reduce((acc: InventoryItem[], item: InventoryItem) => {
    const existingItemIndex = acc.findIndex(existingItem => existingItem.id === item.id);

    if (existingItemIndex >= 0) {
      // Item exists, increase quantity
      acc[existingItemIndex].quantity += item.quantity;
    } else {
      // Item doesn't exist, add to the inventory
      acc.push(item);
    }

    return acc;
  }, []);

  const filteredItems = updatedInventory.filter(item => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'weapon') return item.type === 'weapon' || item.type === 'crafted';
    return item.type === selectedCategory;
  });

  const categories = [
    { id: 'all', label: 'Tout' },
    { id: 'weapon', label: 'Armes' },
    { id: 'defense', label: 'Défense' },
    { id: 'material', label: 'Matériaux' },
    { id: 'consumable', label: 'Consommables' }
  ];

  // Debug log to check inventory contents
  console.log('Current inventory:', updatedInventory);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Package className="text-blue-500" size={32} />
        <h1 className="text-3xl prison-font text-white">INVENTAIRE</h1>
      </div>

      <div className="flex gap-2 mb-6">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id as ItemCategory | 'all')}
            className={`px-4 py-2 rounded-lg text-sm prison-font tracking-wider transition-colors ${
              selectedCategory === category.id
                ? 'bg-gray-700 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map((item: InventoryItem, index) => (
          <InventoryItemDisplay key={`${item.id}-${index}`} item={item} />
        ))}

        {filteredItems.length === 0 && (
          <div className="col-span-2 text-center text-gray-500 py-12">
            <Package size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-xl prison-font">
              {selectedCategory === 'all'
                ? 'Inventaire vide'
                : `Aucun objet de type ${
                    selectedCategory === 'weapon' ? 'arme' :
                    selectedCategory === 'defense' ? 'défense' :
                    selectedCategory === 'material' ? 'matériau' : 'consommable'
                  }`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
