import React, { useState } from 'react';
import { Heart, AlertCircle } from 'lucide-react';
import { useGameState } from '../contexts/GameStateContext';
import { db } from '../firebase';
import { ref, update, get } from 'firebase/database';
import { PRISON_ITEMS } from '../types/inventory';

export const NursePanel: React.FC = () => {
  const { state, dispatch } = useGameState();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleHeal = async (option: 'basic' | 'advanced' | 'steal') => {
    if (state.health >= 100 && option !== 'steal') {
      setError('Vos points de vie sont déjà au maximum');
      return;
    }

    const cost = option === 'basic' ? 20 : option === 'advanced' ? 50 : 3;
    
    if (state.actionPoints < cost) {
      setError(`Points d'action insuffisants (${cost} PA requis)`);
      return;
    }

    if (option !== 'steal' && state.money < cost) {
      setError('Fonds insuffisants');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (option === 'steal') {
        const success = Math.random() >= 0.5;
        
        // Déduire les PA avant l'action
        dispatch({
          type: 'UPDATE_ACTION_POINTS',
          payload: -3
        });

        if (success) {
          // Sélectionner aléatoirement un objet de soin parmi les options disponibles
          const stealableItems = ['bandage', 'compress', 'syringe'];
          const stolenItemId = stealableItems[Math.floor(Math.random() * stealableItems.length)];
          const stolenItem = PRISON_ITEMS[stolenItemId];

          const userRef = ref(db, `users/${state.id}`);
          // Chercher si l'item existe déjà dans l'inventaire du state
          const existingItemIndex = state.inventory.findIndex(item => 
            item.id === stolenItemId && 
            item.type === 'consumable'
          );

          let updatedInventory;
          if (existingItemIndex >= 0) {
            // Mettre à jour la quantité
            updatedInventory = state.inventory.map((item, index) => 
              index === existingItemIndex 
                ? { ...item, quantity: item.quantity + 1 }
                : item
            );
          } else {
            // Ajouter le nouvel item
            updatedInventory = [...state.inventory, {
              id: stolenItemId,
              ...stolenItem,
              type: 'consumable',
              quantity: 1
            }];
          }

          // Mettre à jour l'inventaire dans Firebase et le state local
          await update(userRef, {
            inventory: updatedInventory,
            lastUpdate: new Date().toISOString()
          });

          dispatch({
            type: 'UPDATE_INVENTORY',
            payload: updatedInventory
          });

          dispatch({
            type: 'ADD_ACTION',
            payload: {
              type: 'steal',
              description: `🦹 Vol de soins réussi! Vous avez obtenu ${stolenItem.name}`,
              timestamp: new Date()
            }
          });
        } else {
          dispatch({
            type: 'UPDATE_HEALTH',
            payload: Math.max(0, state.health - 10)
          });

          dispatch({
            type: 'ADD_ACTION',
            payload: {
              type: 'damage',
              description: '🚫 L\'infirmière vous a surpris! (-10 PV)',
              timestamp: new Date()
            }
          });
        }
      } else {
        const healAmount = option === 'basic' ? 20 : 50;

        dispatch({
          type: 'UPDATE_MONEY',
          payload: -cost
        });

        dispatch({
          type: 'UPDATE_ACTION_POINTS',
          payload: -cost
        });

        dispatch({
          type: 'UPDATE_HEALTH',
          payload: Math.min(100, state.health + healAmount)
        });

        dispatch({
          type: 'ADD_ACTION',
          payload: {
            type: 'heal',
            description: `${option === 'basic' ? '🩹' : '💊'} Vous avez reçu des soins (+${healAmount} PV)`,
            timestamp: new Date()
          }
        });
      }
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

      <div className="flex items-center gap-2 mb-4">
        <Heart className="text-red-400" />
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <span className="text-gray-300">Points de vie</span>
            <span className="text-red-400 font-bold">{state.health}/100</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-red-500 transition-all duration-300"
              style={{ width: `${state.health}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <button
          onClick={() => handleHeal('basic')}
          disabled={loading || state.health >= 100}
          className="w-full flex items-center justify-between p-3 rounded-lg transition-colors bg-green-900/20 hover:bg-green-900/30 text-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🩹</span>
            <div>
              <div className="font-medium">Soins</div>
              <div className="text-sm opacity-75">+20 PV</div>
            </div>
          </div>
          <div className="text-yellow-400 font-bold">20€</div>
        </button>

        <button
          onClick={() => handleHeal('advanced')}
          disabled={loading || state.health >= 100}
          className="w-full flex items-center justify-between p-3 rounded-lg transition-colors bg-green-900/20 hover:bg-green-900/30 text-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">💊</span>
            <div>
              <div className="font-medium">Grand soins</div>
              <div className="text-sm opacity-75">+50 PV</div>
            </div>
          </div>
          <div className="text-yellow-400 font-bold">50€</div>
        </button>

        <button
          onClick={() => handleHeal('steal')}
          disabled={loading}
          className="w-full flex items-center justify-between p-3 rounded-lg transition-colors bg-purple-900/20 hover:bg-purple-900/30 text-purple-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🦹</span>
            <div>
              <div className="font-medium">Voler des soins</div>
              <div className="text-sm opacity-75">50% de chance de réussite (3 PA)</div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
