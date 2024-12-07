import React, { useState } from 'react';
import { Bot, Edit2, Trash2, Heart } from 'lucide-react';
import { useGuards } from '../../hooks/useGuards';
import { GuardManager } from '../../services/guard/GuardManager';
import { GuardCombatService } from '../../services/guard/GuardCombatService';
import { Guard } from '../../types/guard';

export const NPCManagement: React.FC = () => {
  const { guards, loading, error: guardsError } = useGuards();
  const [selectedGuard, setSelectedGuard] = useState<Guard | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedGuard, setEditedGuard] = useState<Partial<Guard>>({});
  const [error, setError] = useState<string | null>(null);

  const resetEditState = () => {
    setEditMode(false);
    setSelectedGuard(null);
    setEditedGuard({});
  };

  const handleEditGuard = (guard: Guard) => {
    setSelectedGuard(guard);
    setEditedGuard(guard);
    setEditMode(true);
  };

  const handleUpdateGuard = async () => {
    if (!selectedGuard) return;

    const points = editedGuard.stats?.points || selectedGuard.stats.points;
    if (isNaN(points) || points < 0) {
      setError('Points invalides. Veuillez entrer un nombre valide.');
      return;
    }

    const maxHealth = 100 + (points * 50);
    const stats = {
      ...selectedGuard.stats,
      ...editedGuard.stats,
      points,
      strength: Math.max(1, editedGuard.stats?.strength || selectedGuard.stats.strength),
      defense: Math.max(1, editedGuard.stats?.defense || selectedGuard.stats.defense),
      agility: Math.max(1, editedGuard.stats?.agility || selectedGuard.stats.agility),
      dodge: Math.max(1, editedGuard.stats?.dodge || selectedGuard.stats.dodge)
    };

    try {
      await GuardManager.getInstance().updateGuard(selectedGuard.id, {
        ...editedGuard,
        maxHealth,
        stats,
        health: maxHealth // Reset health to max when updating stats
      });
      
      resetEditState();
    } catch (err) {
      console.error('Error updating guard:', err);
      setError('Échec de la mise à jour du garde');
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="text-sm text-gray-400">Total Gardes</div>
          <div className="text-2xl font-bold text-white">{guards.length}</div>
        </div>
        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="text-sm text-gray-400">Gardes Actifs</div>
          <div className="text-2xl font-bold text-blue-400">
            {guards.filter(guard => guard.active && !guard.inComa).length}
          </div>
        </div>
        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="text-sm text-gray-400">Gardes en Coma</div>
          <div className="text-2xl font-bold text-red-400">
            {guards.filter(guard => guard.inComa).length}
          </div>
        </div>
        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="text-sm text-gray-400">Points Totaux</div>
          <div className="text-2xl font-bold text-yellow-400">
            {guards.reduce((acc, guard) => acc + (guard.stats?.points || 0), 0)}
          </div>
        </div>
      </div>

      {/* Guards List */}
      <div className="bg-gray-700 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-600">
          <h3 className="text-lg font-medium">Liste des Gardes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-600">
                <th className="px-4 py-3 text-gray-400">Nom</th>
                <th className="px-4 py-3 text-gray-400">Niveau</th>
                <th className="px-4 py-3 text-gray-400">Santé</th>
                <th className="px-4 py-3 text-gray-400">Stats</th>
                <th className="px-4 py-3 text-gray-400">Position</th>
                <th className="px-4 py-3 text-gray-400">Status</th>
                <th className="px-4 py-3 text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {guards.map((guard: Guard) => (
                <tr key={guard.id} className="border-b border-gray-600/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Bot size={20} className="text-gray-400" />
                      <span className="text-gray-200">{guard.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-blue-400">{guard.stats?.points || 0} points</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500"
                          style={{ width: `${(guard.health / guard.maxHealth) * 100}%` }}
                        />
                      </div>
                      <span className="text-red-400">{guard.health}/{guard.maxHealth}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 space-y-1">
                    <div className="flex flex-col gap-1 text-xs">
                      <div className="text-red-400">ATT: {guard.stats.strength}</div>
                      <div className="text-blue-400">DEF: {guard.stats.defense}</div>
                      <div className="text-yellow-400">AGI: {guard.stats.agility}</div>
                      <div className="text-green-400">ESQ: {guard.stats.dodge}</div>
                      <div className="text-yellow-400 font-bold">Points: {guard.stats.points}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-300">{guard.position.area}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      guard.active
                        ? guard.inComa
                          ? 'bg-orange-500/10 text-orange-400'
                          : 'bg-green-500/10 text-green-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      {guard.inComa ? 'En coma' : guard.active ? 'Actif' : 'Inactif'}
                    </span>
                    {guard.inComa && (
                      <button
                        onClick={() => GuardCombatService.reviveGuard(guard.id)}
                        className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-full transition-all"
                        title="Réanimer"
                      >
                        <Heart size={16} />
                      </button>
                    )}
                  </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditGuard(guard)}
                        className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-full transition-all"
                        title="Modifier"
                      >
                        <Edit2 size={16} />
                      </button>
                      {guard.inComa && (
                        <button
                          onClick={() => GuardCombatService.reviveGuard(guard.id)}
                          className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-full transition-all"
                          title="Réveiller"
                        >
                          <Heart size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => GuardManager.getInstance().removeGuard(guard.id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Guard Editing Modal */}
      {editMode && selectedGuard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-medium mb-4">Modifier {selectedGuard.name}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Points</label>
                <input
                  type="number"
                  value={editedGuard.stats?.points || ''}
                  onChange={(e) => setEditedGuard({
                    ...editedGuard,
                    stats: { ...editedGuard.stats, points: Number(e.target.value) }
                  })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Force</label>
                  <input
                    type="number"
                    value={editedGuard.stats?.strength || ''}
                    onChange={(e) => setEditedGuard({
                      ...editedGuard,
                      stats: { ...editedGuard.stats, strength: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Défense</label>
                  <input
                    type="number"
                    value={editedGuard.stats?.defense || ''}
                    onChange={(e) => setEditedGuard({
                      ...editedGuard,
                      stats: { ...editedGuard.stats, defense: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Agilité</label>
                  <input
                    type="number"
                    value={editedGuard.stats?.agility || ''}
                    onChange={(e) => setEditedGuard({
                      ...editedGuard,
                      stats: { ...editedGuard.stats, agility: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Esquive</label>
                  <input
                    type="number"
                    value={editedGuard.stats?.dodge || ''}
                    onChange={(e) => setEditedGuard({
                      ...editedGuard,
                      stats: { ...editedGuard.stats, dodge: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={resetEditState}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                >
                  Annuler
                </button>
                <button
                  onClick={handleUpdateGuard}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && <div className="error">{error}</div>}
    </div>
  );
};
