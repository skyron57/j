import React, { useState } from 'react';
import { useGameState } from '../contexts/GameStateContext';
import { useConsumableItem } from '../services/inventory/consumables';
import { WeaponService } from '../services/weapon';
import { db } from '../firebase';
import { ref, get } from 'firebase/database';
import { Sword, Shield, Heart, Zap } from 'lucide-react';

interface InventoryItemProps {
  item: any;
}

export const InventoryItemDisplay: React.FC<InventoryItemProps> = ({ item }) => {
  const { state, dispatch } = useGameState();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUseItem = async () => {
    if (!item || item.type !== 'consumable') return;

    try {
      setError(null);
      setLoading(true);

      await useConsumableItem(state.id, item.id);

      // Rafraîchir l'état local
      const userRef = ref(db, `users/${state.id}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const userData = snapshot.val();
        dispatch({
          type: 'UPDATE_INVENTORY_AND_STATS',
          payload: {
            inventory: userData.inventory || [],
            stats: userData.stats,
          },
        });
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de l\'utilisation de l\'objet.');
    } finally {
      setLoading(false);
    }
  };

  const handleEquipWeapon = async () => {
    if (!item || (item.type !== 'weapon' && item.type !== 'crafted')) return;

    try {
      setError(null);
      setLoading(true);

      if (item.equipped) {
        await WeaponService.unequipWeapon(state.id, item.id);
      } else {
        await WeaponService.equipWeapon(state.id, item.id);
      }

      // Rafraîchir l'état depuis Firebase
      const userRef = ref(db, `users/${state.id}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const userData = snapshot.val();
        
        // Mettre à jour l'état local
        dispatch({
          type: 'UPDATE_INVENTORY_AND_STATS',
          payload: {
            inventory: userData.inventory || [],
            stats: userData.stats || {
              strength: 5,
              defense: 5,
              agility: 5,
              dodge: 5,
            },
          },
        });

        // Ajouter l'action à l'historique
        dispatch({
          type: 'ADD_ACTION',
          payload: {
            type: item.equipped ? 'unequip' : 'equip',
            description: `${item.emoji} ${item.equipped ? 'Retrait de' : 'Équipement de'} ${item.name}`,
            timestamp: new Date().toISOString(),
          },
        });
      }
    } catch (err: any) {
      console.error('Erreur lors du traitement de l\'arme:', err);
      setError(err.message || 'Une erreur est survenue lors de l\'équipement de l\'arme.');
    } finally {
      setLoading(false);
    }
  };

  const handleDiscardWeapon = async (weaponId: string) => {
    try {
      setError(null);
      setLoading(true);

      await WeaponService.discardWeapon(state.id, weaponId);

      // Rafraîchir l'état depuis Firebase
      const userRef = ref(db, `users/${state.id}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const userData = snapshot.val();
        
        // Mettre à jour l'état local
        dispatch({
          type: 'UPDATE_INVENTORY_AND_STATS',
          payload: {
            inventory: userData.inventory || [],
            stats: userData.stats || {
              strength: 5,
              defense: 5,
              agility: 5,
              dodge: 5,
            },
          },
        });

        // Ajouter l'action à l'historique
        dispatch({
          type: 'ADD_ACTION',
          payload: {
            type: 'discard',
            description: `${item.emoji} Suppression de ${item.name}`,
            timestamp: new Date().toISOString(),
          },
        });
      }
    } catch (err: any) {
      console.error('Erreur lors de la suppression de l\'arme:', err);
      setError(err.message || 'Une erreur est survenue lors de la suppression de l\'arme.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{item.emoji}</span>
        <div className="flex-1">
          <h4 className="font-bold">{item.name}</h4>
          <p className="text-sm text-gray-400">{item.description}</p>
        </div>
        {item.quantity > 1 && (
          <span className="text-sm text-gray-400">x{item.quantity}</span>
        )}
      </div>

      {(item.type === 'weapon' || item.type === 'crafted') && item.stats && (
        <div className="grid grid-cols-4 gap-2 text-sm mb-3">
          <div className="flex items-center gap-1">
            <Sword size={14} className="text-red-400" />
            <span>ATT: {item.stats.attack}</span>
          </div>
          <div className="flex items-center gap-1">
            <Shield size={14} className="text-blue-400" />
            <span>DEF: {item.stats.defense}</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap size={14} className="text-yellow-400" />
            <span>AGI: {item.stats.agility}</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart size={14} className="text-green-400" />
            <span>ESQ: {item.stats.dodge}</span>
          </div>
        </div>
      )}

      {(item.type === 'weapon' || item.type === 'crafted') && item.durability && (
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Durabilité</span>
            <span className={item.durability.current < 30 ? 'text-red-400' : 'text-blue-400'}>
              {item.durability.current}/{item.durability.max}
            </span>
          </div>
          <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                item.durability.current < 30 ? 'bg-red-500' : 'bg-blue-500'
              }`}
              style={{ width: `${(item.durability.current / item.durability.max) * 100}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="text-sm text-red-400 mb-3">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <div className="flex items-center gap-2">
          {(item.type === 'weapon' || item.type === 'crafted') && (
            <>
              <button
                onClick={handleEquipWeapon}
                disabled={loading}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  item.equipped
                    ? 'bg-red-900/20 text-red-400 hover:bg-red-900/30'
                    : 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/30'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {item.equipped ? 'Retirer' : 'Équiper'}
              </button>
              <button
                onClick={() => handleDiscardWeapon(item.id)}
                disabled={loading}
                className="px-2 py-1 rounded text-xs font-medium bg-red-900/20 text-red-400 hover:bg-red-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Jeter l'arme"
              >
                Jeter
              </button>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((num) => (
                  <div
                    key={num}
                    onClick={() => {
                      const updatedQuickInventory = [...state.quickInventory];
                      updatedQuickInventory[num - 1] = item.id;
                      dispatch({
                        type: 'UPDATE_QUICK_INVENTORY',
                        payload: updatedQuickInventory
                      });

                      // Ajouter l'action à l'historique
                      dispatch({
                        type: 'ADD_ACTION',
                        payload: {
                          type: 'equip_quick',
                          description: `${item.emoji} ${item.name} équipé dans le slot ${num}`,
                          timestamp: new Date().toISOString(),
                        },
                      });
                    }}
                    className="w-6 h-6 flex items-center justify-center bg-gray-700/50 text-gray-400 rounded text-xs cursor-pointer hover:bg-gray-700 transition-colors"
                    title={`Glisser vers le slot ${num}`}
                  >
                    {num}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        {item.type === 'consumable' && (
          <button
            onClick={handleUseItem}
            disabled={loading}
            className="px-2 py-1 rounded text-xs font-medium bg-green-900/20 text-green-400 hover:bg-green-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Utiliser
          </button>
        )}
      </div>
    </div>
  );
};
