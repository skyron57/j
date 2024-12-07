import React, { useState } from 'react';
import { Swords, Shield, Zap, Move, Target, Heart, Plus } from 'lucide-react';
import { useGameState } from '../contexts/GameStateContext';
import { GuardCombatService } from '../services/guard/GuardCombatService';

export const StatsPanel: React.FC = () => {
  const { state } = useGameState();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const equippedWeapon = state.inventory.find(
    item => (item.type === 'weapon' || item.type === 'crafted') && item.equipped
  );

  const totalStats = {
    strength: state.stats.strength + (equippedWeapon?.stats.attack || 0),
    defense: state.stats.defense + (equippedWeapon?.stats.defense || 0),
    agility: state.stats.agility + (equippedWeapon?.stats.agility || 0),
    dodge: state.stats.dodge + (equippedWeapon?.stats.dodge || 0)
  };

  const handleDistributeXP = async (statType: 'strength' | 'defense' | 'agility' | 'dodge') => {
    if (!state.id) return;
    
    try {
      setError(null);
      setLoading(true);
      await GuardCombatService.distributeXP(state.id, statType, 1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg">
          {error}
        </div>
      )}

      {state.stats.undistributedXP > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500 text-yellow-500 px-4 py-2 rounded-lg">
          {state.stats.undistributedXP} points d'XP à distribuer
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Swords className="text-red-500 w-6" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm">Force</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{state.stats.strength}</span>
                {equippedWeapon?.stats.attack && (
                  <span className="text-sm text-green-400">+{equippedWeapon.stats.attack}</span>
                )}
                {equippedWeapon?.stats.attack && (
                  <span className="text-sm text-gray-500">= {totalStats.strength}</span>
                )}
                {state.stats.undistributedXP > 0 && (
                  <button
                    onClick={() => handleDistributeXP('strength')}
                    disabled={loading}
                    className="p-1 bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30 transition-colors disabled:opacity-50"
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${equippedWeapon?.stats.attack > 0 ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(100, (totalStats.strength / 100) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Shield className="text-blue-500 w-6" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm">Défense</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{state.stats.defense}</span>
                {equippedWeapon?.stats.defense && (
                  <span className="text-sm text-blue-400">+{equippedWeapon.stats.defense}</span>
                )}
                {equippedWeapon?.stats.defense && (
                  <span className="text-sm text-gray-500">= {totalStats.defense}</span>
                )}
                {state.stats.undistributedXP > 0 && (
                  <button
                    onClick={() => handleDistributeXP('defense')}
                    disabled={loading}
                    className="p-1 bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30 transition-colors disabled:opacity-50"
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${equippedWeapon?.stats.defense > 0 ? 'bg-blue-500' : 'bg-gray-500'}`}
                style={{ width: `${Math.min(100, (totalStats.defense / 100) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Zap className="text-yellow-500 w-6" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm">Agilité</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{state.stats.agility}</span>
                {equippedWeapon?.stats.agility && (
                  <span className="text-sm text-yellow-400">+{equippedWeapon.stats.agility}</span>
                )}
                {equippedWeapon?.stats.agility && (
                  <span className="text-sm text-gray-500">= {totalStats.agility}</span>
                )}
                {state.stats.undistributedXP > 0 && (
                  <button
                    onClick={() => handleDistributeXP('agility')}
                    disabled={loading}
                    className="p-1 bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30 transition-colors disabled:opacity-50"
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${equippedWeapon?.stats.agility > 0 ? 'bg-yellow-500' : 'bg-gray-500'}`}
                style={{ width: `${Math.min(100, (totalStats.agility / 100) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Move className="text-green-500 w-6" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm">Esquive</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{state.stats.dodge}</span>
                {equippedWeapon?.stats.dodge && (
                  <span className="text-sm text-green-400">+{equippedWeapon.stats.dodge}</span>
                )}
                {equippedWeapon?.stats.dodge && (
                  <span className="text-sm text-gray-500">= {totalStats.dodge}</span>
                )}
                {state.stats.undistributedXP > 0 && (
                  <button
                    onClick={() => handleDistributeXP('dodge')}
                    disabled={loading}
                    className="p-1 bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30 transition-colors disabled:opacity-50"
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${equippedWeapon?.stats.dodge > 0 ? 'bg-green-500' : 'bg-gray-500'}`}
                style={{ width: `${Math.min(100, (totalStats.dodge / 100) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {equippedWeapon && (
          <div className="mt-2 px-3 py-2 bg-gray-800/50 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Arme équipée</div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{equippedWeapon.emoji}</span>
              <div>
                <span className="text-sm">{equippedWeapon.name}</span>
                {equippedWeapon.type === 'crafted' && (
                  <span className="ml-2 text-xs text-yellow-400">(Craftée)</span>
                )}
              </div>
            </div>
            {equippedWeapon.durability && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Durabilité</span>
                  <span>{equippedWeapon.durability.current}/{equippedWeapon.durability.max}</span>
                </div>
                <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      equippedWeapon.durability.current < 30 ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${(equippedWeapon.durability.current / equippedWeapon.durability.max) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-gray-700 pt-4">
        <h3 className="text-sm font-medium text-gray-400 mb-3">Statistiques de combat</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-red-400" />
            <span>
              Dégâts infligés: <span className="text-red-400">{state.stats?.damageDealt || 0}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Heart size={16} className="text-blue-400" />
            <span>
              Dégâts reçus: <span className="text-blue-400">{state.stats?.damageTaken || 0}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-yellow-400" />
            <span>
              Attaques ratées: <span className="text-yellow-400">{state.stats.missedAttacks}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Move size={16} className="text-green-400" />
            <span>
              Esquives: <span className="text-green-400">{state.stats.dodgedAttacks}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
