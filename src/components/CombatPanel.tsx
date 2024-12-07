import React, { useState, useEffect } from 'react';
import { useGameState } from '../contexts/GameStateContext'; // Assurez-vous que ce chemin est correct
import { db } from '../firebase'; // Assurez-vous que ce chemin est correct
import { ref, update } from 'firebase/database'; // Importations de Firebase
import { Weapon, calculateWeaponStats } from '../types/weapon'; // Assurez-vous que le chemin et les types sont corrects
import { Activity, CheckCircle, XCircle } from 'lucide-react';

const CombatPanel = () => {
  const { state, dispatch } = useGameState();
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const equippedWeapon = state.inventory.find(
    item => (item.type === 'weapon' || item.type === 'crafted') && item.equipped
  ) as Weapon | undefined;

  const weaponStats = equippedWeapon ? calculateWeaponStats(equippedWeapon) : {
    totalAttack: 0,
    totalDefense: 0,
    totalAgility: 0,
    totalDodge: 0
  };

  const totalStats = {
    strength: Math.max(state.stats.strength + weaponStats.totalAttack, 0),
    defense: Math.max(state.stats.defense + weaponStats.totalDefense, 0),
    agility: Math.max(state.stats.agility + weaponStats.totalAgility, 0),
    dodge: Math.max(state.stats.dodge + weaponStats.totalDodge, 0)
  };

  const updateInventory = async (inventory: typeof state.inventory, weapon: Weapon | null) => {
    try {
      const userRef = ref(db, `users/${state.id}`);
      await update(userRef, {
        inventory,
        lastUpdate: new Date().toISOString()
      });
      dispatch({ type: 'UPDATE_INVENTORY', payload: inventory });

      if (weapon) {
        setSelectedWeapon(weapon);
        setSuccessMessage(`L'arme ${weapon.name} a été équipée avec succès !`);
      } else {
        setSelectedWeapon(null);
        setSuccessMessage(`L'arme a été déséquipée avec succès !`);
      }
    } catch (err: any) {
      setError(`Erreur lors de la mise à jour de l'inventaire : ${err.message}`);
    }
  };

  const handleEquipWeapon = (weapon: Weapon) => {
    if (equippedWeapon?.id === weapon.id) {
      setError('Cette arme est déjà équipée.');
      return;
    }

    const updatedInventory = state.inventory.map(item => ({
      ...item,
      equipped: item.id === weapon.id
    }));

    updateInventory(updatedInventory, weapon);
  };

  const handleUnequipWeapon = () => {
    if (!equippedWeapon) {
      setError('Aucune arme n’est actuellement équipée.');
      return;
    }

    const updatedInventory = state.inventory.map(item => ({
      ...item,
      equipped: false
    }));

    updateInventory(updatedInventory, null);
  };

  useEffect(() => {
    if (equippedWeapon) {
      dispatch({
        type: 'UPDATE_COMBAT_STATS',
        payload: totalStats
      });
    }
  }, [equippedWeapon, totalStats, dispatch]);

  const calculateRiposte = (damage: number) => Math.max(damage, 2);

  return (
    <div className="combat-panel p-4 bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold text-gray-200">Combat Panel</h2>

      {error && <div className="error-message bg-red-600 text-white p-2 rounded-md mb-4 animate-fade-in-out"><XCircle className="inline mr-2" />{error}</div>}
      {successMessage && <div className="success-message bg-green-600 text-white p-2 rounded-md mb-4 animate-fade-in-out"><CheckCircle className="inline mr-2" />{successMessage}</div>}

      <div className="weapon-info mt-4">
        <h3 className="text-lg font-medium text-gray-300">
          Arme Équipée: {equippedWeapon ? equippedWeapon.name : 'Aucune'}
        </h3>

        {equippedWeapon ? (
          <button
            onClick={handleUnequipWeapon}
            className="btn btn-danger mt-2"
          >
            Déséquiper
          </button>
        ) : (
          <button
            onClick={() => {
              if (selectedWeapon) handleEquipWeapon(selectedWeapon);
            }}
            className="btn btn-primary mt-2"
            disabled={!selectedWeapon}
          >
            Équiper
          </button>
        )}
      </div>

      <div className="player-stats mt-6 space-y-4">
        <div className="stat-item flex justify-between">
          <span className="text-sm text-gray-400">Force</span>
          <span className="stat-value">{totalStats.strength}</span>
        </div>
        <div className="stat-item flex justify-between">
          <span className="text-sm text-gray-400">Défense</span>
          <span className="stat-value">{totalStats.defense}</span>
        </div>
        <div className="stat-item flex justify-between">
          <span className="text-sm text-gray-400">Agilité</span>
          <span className="stat-value">{totalStats.agility}</span>
        </div>
        <div className="stat-item flex justify-between">
          <span className="text-sm text-gray-400">Esquive</span>
          <span className="stat-value">{totalStats.dodge}</span>
        </div>
      </div>
    </div>
  );
};

export default CombatPanel;
