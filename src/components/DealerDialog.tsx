import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, AlertCircle } from 'lucide-react';
import { useGameState } from '../contexts/GameStateContext';
import { PRISON_WEAPONS } from '../types/dealer';
import { db } from '../firebase';
import { ref, get, update } from 'firebase/database';

interface DealerDialogProps {
  onClose: () => void;
}

export const DealerDialog: React.FC<DealerDialogProps> = ({ onClose }) => {
  const { state, dispatch } = useGameState();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dailyWeapon, setDailyWeapon] = useState<any>(null);
  const [remainingStock, setRemainingStock] = useState(0);

  useEffect(() => {
    loadDailyWeapon();
  }, []);

  const loadDailyWeapon = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const dealerRef = ref(db, 'dealer');
      const snapshot = await get(dealerRef);
      
      if (snapshot.exists()) {
        const dealerData = snapshot.val();
        if (dealerData.lastUpdate?.split('T')[0] === today) {
          setDailyWeapon(dealerData.dailyWeapon);
          setRemainingStock(dealerData.remainingStock);
        } else {
          // Générer une nouvelle arme pour aujourd'hui
          await generateNewDailyWeapon();
        }
      } else {
        await generateNewDailyWeapon();
      }
    } catch (error) {
      console.error('Error loading daily weapon:', error);
      setError('Erreur lors du chargement de l\'arme du jour');
    }
  };

  const generateNewDailyWeapon = async () => {
    const weaponIds = Object.keys(PRISON_WEAPONS);
    const randomWeaponId = weaponIds[Math.floor(Math.random() * weaponIds.length)];
    const weapon = PRISON_WEAPONS[randomWeaponId];
    
    const newDailyWeapon = {
      ...weapon,
      id: randomWeaponId,
      price: Math.floor(Math.random() * (weapon.price.max - weapon.price.min + 1) + weapon.price.min)
    };

    const dealerRef = ref(db, 'dealer');
    await update(dealerRef, {
      dailyWeapon: newDailyWeapon,
      remainingStock: 10,
      lastUpdate: new Date().toISOString()
    });

    setDailyWeapon(newDailyWeapon);
    setRemainingStock(10);
  };

  const handlePurchase = async () => {
    if (!dailyWeapon) return;

    try {
      setLoading(true);
      setError(null);

      if (state.money < dailyWeapon.price) {
        throw new Error('Fonds insuffisants');
      }

      if (remainingStock <= 0) {
        throw new Error('Stock épuisé');
      }

      // Vérifier si le joueur a déjà acheté aujourd'hui
      const today = new Date().toISOString().split('T')[0];
      const purchaseHistoryRef = ref(db, `users/${state.id}/purchaseHistory/${today}`);
      const purchaseSnapshot = await get(purchaseHistoryRef);

      if (purchaseSnapshot.exists()) {
        throw new Error('Vous avez déjà acheté une arme aujourd\'hui');
      }

      // Créer l'arme pour l'inventaire
      const weaponItem = {
        id: crypto.randomUUID(),
        ...dailyWeapon,
        type: 'weapon',
        durability: {
          current: 100,
          max: 100
        },
        equipped: false
      };

      // Mettre à jour l'inventaire et l'argent du joueur
      const userRef = ref(db, `users/${state.id}`);
      await update(userRef, {
        money: state.money - dailyWeapon.price,
        inventory: [...state.inventory, weaponItem],
        [`purchaseHistory/${today}`]: true
      });

      // Mettre à jour le stock
      const dealerRef = ref(db, 'dealer');
      await update(dealerRef, {
        remainingStock: remainingStock - 1
      });

      setRemainingStock(prev => prev - 1);

      // Ajouter à l'historique des actions
      dispatch({
        type: 'ADD_ACTION',
        payload: {
          type: 'purchase',
          description: `${dailyWeapon.emoji} Vous avez acheté ${dailyWeapon.name} pour ${dailyWeapon.price}€`,
          timestamp: new Date().toISOString()
        }
      });

      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎩</span>
            <h3 className="text-xl prison-font">Le Taulier</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="mb-4">
          <div className="text-sm text-gray-400">Solde disponible</div>
          <div className="flex items-center gap-2 text-yellow-400 font-bold">
            <ShoppingCart size={16} />
            {state.money}€
          </div>
        </div>

        {dailyWeapon ? (
          <div className="bg-gray-700 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{dailyWeapon.emoji}</span>
              <div className="flex-1">
                <h4 className="font-bold">{dailyWeapon.name}</h4>
                <p className="text-sm text-gray-400">{dailyWeapon.description}</p>
              </div>
              <div className="text-yellow-400 font-bold">{dailyWeapon.price}€</div>
            </div>

            <div className="grid grid-cols-4 gap-2 text-sm mb-3">
              <div className="text-red-400">ATT: {dailyWeapon.stats.attack}</div>
              <div className="text-blue-400">DEF: {dailyWeapon.stats.defense}</div>
              <div className="text-yellow-400">HAB: {dailyWeapon.stats.skill}</div>
              <div className="text-green-400">ESQ: {dailyWeapon.stats.dodge}</div>
            </div>

            <div className="text-sm text-gray-400 mb-3">
              Stock restant: {remainingStock}/10
            </div>

            <button
              onClick={handlePurchase}
              disabled={loading || remainingStock === 0 || state.money < dailyWeapon.price}
              className={`w-full py-2 rounded transition-colors ${
                loading || remainingStock === 0 || state.money < dailyWeapon.price
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-yellow-600 hover:bg-yellow-700 text-white'
              }`}
            >
              {remainingStock === 0 
                ? 'Stock épuisé'
                : state.money < dailyWeapon.price
                ? 'Fonds insuffisants'
                : 'Acheter'}
            </button>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-4">
            Aucune arme disponible aujourd'hui
          </div>
        )}
      </div>
    </div>
  );
};
