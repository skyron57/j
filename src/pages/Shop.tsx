import React, { useState } from 'react';
import { ShoppingCart, AlertCircle } from 'lucide-react';
import { useGameState } from '../contexts/GameStateContext';
import { SHOP_ITEMS } from '../data/shop';

export const Shop: React.FC = () => {
  const { state, dispatch } = useGameState();
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async (itemId: string) => {
    try {
      setError(null);
      const item = SHOP_ITEMS[itemId];
      
      if (!item) {
        throw new Error('Article introuvable');
      }

      if (state.money < item.price) {
        throw new Error('Fonds insuffisants');
      }

      // Check anabolic limits
      if (item.type === 'anabolic') {
        const today = new Date().toISOString().split('T')[0];
        const anabolicCount = state.consumedAnabolics[today] || 0;
        
        if (anabolicCount >= 5) {
          throw new Error('Limite quotidienne d\'anabolisants atteinte');
        }
      }

      // Process purchase
      dispatch({
        type: 'PURCHASE_ITEM',
        payload: {
          itemId,
          price: item.price
        }
      });

      if (item.type === 'anabolic') {
        dispatch({
          type: 'USE_ANABOLIC',
          payload: {
            date: new Date().toISOString().split('T')[0]
          }
        });
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <ShoppingCart className="text-green-500" size={32} />
        <h1 className="text-3xl prison-font text-white">BOUTIQUE</h1>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(SHOP_ITEMS).map(([id, item]) => (
          <div key={id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-2xl">{item.emoji}</div>
              <div className="flex-1">
                <h3 className="prison-font text-lg">{item.name}</h3>
                <p className="text-sm text-gray-400">{item.description}</p>
              </div>
            </div>

            {item.type === 'anabolic' && (
              <div className="mb-3 text-sm">
                <div className="text-yellow-400">
                  Effet: +20 PA pendant 30 minutes
                </div>
                <div className="text-red-400">
                  ⚠️ Max 5 par jour
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="text-green-400 font-bold">
                {item.price}€
              </div>
              <button
                onClick={() => handlePurchase(id)}
                disabled={state.money < item.price}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  state.money >= item.price
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                {state.money >= item.price ? 'Acheter' : 'Fonds insuffisants'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
