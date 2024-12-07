import React from 'react';
import { Package, X } from 'lucide-react';
import { useGameState } from '../contexts/GameStateContext';
import { InventoryItem } from '../services/inventory/globalInventory';
import { Weapon } from '../types/weapon';

const QUICK_SLOTS = 5;

export const QuickInventory: React.FC = () => {
  const { state, dispatch } = useGameState();
  
  const handleUseItem = async (item: InventoryItem | Weapon) => {
    if (item.type === 'weapon' || item.type === 'crafted') {
      // Handle weapon equip/unequip
      if (item.equipped) {
        dispatch({
          type: 'UNEQUIP_WEAPON',
          payload: { weaponId: item.id }
        });
        dispatch({
          type: 'ADD_ACTION',
          payload: {
            type: 'unequip',
            description: `Vous avez retiré ${item.name}`,
            timestamp: new Date()
          }
        });
      } else {
        dispatch({
          type: 'EQUIP_WEAPON',
          payload: { weaponId: item.id }
        });
        dispatch({
          type: 'ADD_ACTION',
          payload: {
            type: 'equip',
            description: `Vous avez équipé ${item.name}`,
            timestamp: new Date()
          }
        });
      }
      return;
    }

    if (item.type === 'consumable' && 'effect' in item) {
      dispatch({
        type: 'USE_ITEM',
        payload: { 
          itemId: item.id,
          effect: item.effect
        }
      });

      let message = '';
      switch (item.effect.type) {
        case 'health':
          message = `Vous avez utilisé ${item.name} (+${item.effect.value} PV)`;
          break;
        case 'actionPoints':
          message = `Vous avez utilisé ${item.name} (+${item.effect.value} PA)`;
          break;
        case 'anabolic':
          message = `Vous avez utilisé ${item.name} (+20 PA pendant 1 heure)`;
          break;
        case 'revive':
          message = `Vous avez utilisé ${item.name} (réduction du temps de coma)`;
          break;
        default:
          message = `Vous avez utilisé ${item.name}`;
      }

      dispatch({
        type: 'ADD_ACTION',
        payload: {
          type: 'use_item',
          description: message,
          timestamp: new Date()
        }
      });
    }
  };

  const handleRemoveFromQuickSlot = (slot: number) => {
    const updatedQuickInventory = [...state.quickInventory];
    updatedQuickInventory[slot] = null;

    dispatch({
      type: 'UPDATE_QUICK_INVENTORY',
      payload: updatedQuickInventory.filter(Boolean)
    });
  };

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    e.dataTransfer.setData('text/plain', itemId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, slot: number) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('text/plain');
    
    if (!itemId) return;

    const item = state.inventory.find((i) => i.id === itemId);
    if (!item) return;

    const updatedQuickInventory = [...state.quickInventory];
    updatedQuickInventory[slot] = itemId;

    dispatch({
      type: 'UPDATE_QUICK_INVENTORY',
      payload: updatedQuickInventory.filter(Boolean)
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg prison-font mb-4">Équipement rapide</h3>
      <div className="grid grid-cols-1 gap-3">
        {Array.from({ length: QUICK_SLOTS }).map((_, index) => {
          const equippedItemId = state.quickInventory[index];
          const item = equippedItemId ? state.inventory.find(i => i.id === equippedItemId) : null;
          const isWeapon = item?.type === 'weapon' || item?.type === 'crafted';
          
          return (
            <div
              key={index}
              className="bg-gray-900/50 p-3 rounded-lg border border-gray-700 flex items-center gap-3"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
            >
              <div className="p-2 bg-gray-800 rounded-lg">
                {item ? (
                  <span className="text-2xl">{item.emoji}</span>
                ) : (
                  <Package size={24} className="text-gray-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400">
                  {item ? item.name : `Slot ${index + 1}`}
                </div>
                {item && (
                  <div className="text-xs text-gray-500">
                    {item.description}
                  </div>
                )}
              </div>
              {item && (
                <div className="flex items-center gap-2">
                  {isWeapon ? (
                    <button
                      onClick={() => handleUseItem(item as Weapon)}
                      className={`px-2 py-1 text-sm rounded transition-colors ${
                        (item as Weapon).equipped
                          ? 'bg-red-900/20 text-red-400 hover:bg-red-900/30'
                          : 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/30'
                      }`}
                    >
                      {(item as Weapon).equipped ? 'Retirer' : 'Équiper'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUseItem(item)}
                      className="px-2 py-1 text-sm bg-green-900/20 text-green-400 rounded hover:bg-green-900/30 transition-colors"
                    >
                      Utiliser
                    </button>
                  )}
                  <button
                    onClick={() => handleRemoveFromQuickSlot(index)}
                    className="p-1 rounded bg-red-900/20 text-red-400 hover:bg-red-900/30 transition-colors"
                    title="Retirer de l'équipement rapide"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-sm text-gray-500">
        Glissez et déposez des objets depuis votre inventaire pour les ajouter aux slots rapides
      </div>
    </div>
  );
};
