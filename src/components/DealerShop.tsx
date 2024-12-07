import React, { useState, useEffect } from 'react';
import { ShoppingCart, AlertCircle, Swords, Shield, Target, Move } from 'lucide-react';
import { useGameState } from '../contexts/GameStateContext';
import { DealerService, DealerError } from '../services/dealer';
import { WeaponStock, PrisonWeapon, PRISON_WEAPONS } from '../types/dealer';
import { LOCATIONS } from '../data/locations';
import { createWeapon } from '../services/inventory/items';

export const DealerShop: React.FC = () => {
  const { state, dispatch } = useGameState();
  const [stock, setStock] = useState<WeaponStock[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dealerLocation, setDealerLocation] = useState<string | null>(null);

  useEffect(() => {
    checkDealerLocation();
  }, [state.location]);

  const checkDealerLocation = async () => {
    try {
      const location = await DealerService.getCurrentLocation();
      setDealerLocation(location);

      if (location === state.location) {
        await loadStock();
      }
    } catch (err) {
      console.error('Error checking dealer location:', err);
      setError('Erreur lors de la vérification de la position du Taulier');
    } finally {
      setLoading(false);
    }
  };

  const loadStock = async () => {
    try {
      setError(null);
      const currentStock = await DealerService.refreshStock();
      setStock(currentStock);
    } catch (err) {
      if (err instanceof DealerError) {
        setError(err.message);
      } else {
        setError('Une erreur est survenue lors du chargement du stock');
      }
    }
  };

  const handlePurchase = async (stockItem: WeaponStock) => {
    if (!state.id) return;

    try {
      setLoading(true);
      setError(null);
      await DealerService.purchaseWeapon(state.id, stockItem.id);
      await loadStock();

      // Update local state
      dispatch({
        type: 'UPDATE_MONEY',
        payload: -stockItem.price
      });

      // Add to action history
      dispatch({
        type: 'ADD_ACTION',
        payload: {
          type: 'purchase',
          description: `💰 Achat d'arme: ${PRISON_WEAPONS[stockItem.weaponId].name}`,
          timestamp: new Date()
        }
      });

    } catch (err) {
      if (err instanceof DealerError) {
        setError(err.message);
      } else {
        setError('Une erreur est survenue lors de l\'achat');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderWeaponStats = (weapon: PrisonWeapon) => (
    <div className="grid grid-cols-4 gap-2 mb-4 text-sm">
      <div className="flex items-center gap-1">
        <Swords size={16} className="text-red-400" />
        <span>ATT: {weapon.stats.attack}</span>
      </div>
      <div className="flex items-center gap-1">
        <Shield size={16} className="text-blue-400" />
        <span>DEF: {weapon.stats.defense}</span>
      </div>
      <div className="flex items-center gap-1">
        <Target size={16} className="text-yellow-400" />
        <span>HAB: {weapon.stats.skill}</span>
      </div>
      <div className="flex items-center gap-1">
        <Move size={16} className="text-green-400" />
        <span>ESQ: {weapon.stats.dodge}</span>
      </div>
    </div>
  );

  if (dealerLocation !== state.location) {
    return (
      <div className="text-center py-12">
        <ShoppingCart size={48} className="mx-auto mb-4 text-gray-600 opacity-50" />
        <h2 className="text-xl prison-font text-gray-400 mb-2">Le Taulier n'est pas ici</h2>
        {dealerLocation && (
          <p className="text-sm text-gray-500">
            Dernière position connue: {LOCATIONS[dealerLocation].title}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ShoppingCart className="text-yellow-500" size={32} />
          <div>
            <h2 className="text-3xl prison-font">LE TAULIER</h2>
            <p className="text-sm text-gray-400">Armes et équipements spéciaux</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 rounded-full">
          <ShoppingCart className="text-yellow-500" size={16} />
          <span className="text-yellow-500 font-bold">{state.money}€</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {stock.map((item) => {
          const weapon = PRISON_WEAPONS[item.weaponId];
          if (!weapon) return null;

          return (
            <div
              key={item.id}
              className="bg-gray-800 rounded-lg p-4 border border-gray-700"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="text-2xl">{weapon.emoji}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold">{weapon.name}</h3>
                  <p className="text-sm text-gray-400">{weapon.description}</p>
                </div>
                <div className="text-yellow-400 font-bold">{item.price}€</div>
              </div>

              {renderWeaponStats(weapon)}

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  Stock: {item.quantity}/{weapon.maxQuantity}
                </div>
                <button
                  onClick={() => handlePurchase(item)}
                  disabled={loading || item.quantity === 0 || state.money < item.price}
                  className={`px-4 py-2 rounded transition-colors ${
                    loading || item.quantity === 0 || state.money < item.price
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-yellow-600 hover:bg-yellow-700 text-black'
                  }`}
                >
                  {item.quantity === 0
                    ? 'Épuisé'
                    : state.money < item.price
                    ? 'Fonds insuffisants'
                    : 'Acheter'}
                </button>
              </div>
            </div>
          );
        })}

        {stock.length === 0 && !error && (
          <div className="text-center text-gray-500 py-8">
            <ShoppingCart size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg prison-font">Aucune arme disponible</p>
          </div>
        )}
      </div>
    </div>
  );
};
