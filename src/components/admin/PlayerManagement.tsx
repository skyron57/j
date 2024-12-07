import React, { useState, useEffect } from 'react';
import { Users, Activity, Settings, AlertCircle, Package, Sword, Shield, Heart, Zap, Infinity } from 'lucide-react';
import { db } from '../../firebase';
import { ref, get, update } from 'firebase/database';
import { Edit2, Trash2, Ban, Eye, Save, X } from 'lucide-react';
import { PRISON_WEAPONS } from '../../types/weapon';
import { PRISON_ITEMS } from '../../types/inventory';
import { WEAPONS } from '../../types/combat';
import { CRAFTING_MATERIALS } from '../../types/crafting';
import { v4 as uuidv4 } from 'uuid';


interface PlayerManagementProps {
  searchQuery: string;
}

interface PlayerStats {
  level: number;
  strength: number;
  defense: number;
  agility: number;
  dodge: number;
  damageDealt: number;
  damageTaken: number;
  missedAttacks: number;
  dodgedAttacks: number;
}

export const PlayerManagement: React.FC<PlayerManagementProps> = ({ searchQuery }) => {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [editedStats, setEditedStats] = useState<PlayerStats | null>(null);
  const [selectedItem, setSelectedItem] = useState('');
  const [selectedItemType, setSelectedItemType] = useState<'prison_weapons' | 'weapons' | 'items' | 'materials' | 'crafted'>('prison_weapons');
  const [error, setError] = useState<string | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [unlimitedPoints, setUnlimitedPoints] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    loadPlayers();
  }, []);

  const toggleUnlimitedPoints = async (playerId: string, type: 'action' | 'movement') => {
    try {
      const userRef = ref(db, `users/${playerId}`);
      const newValue = !unlimitedPoints[`${playerId}_${type}`];
      
      // Update local state
      setUnlimitedPoints(prev => ({
        ...prev,
        [`${playerId}_${type}`]: newValue
      }));

      // Update database
      if (newValue) {
        // Set to very high number for "unlimited"
        await update(userRef, {
          [`${type}Points`]: 999999,
          lastUpdate: new Date().toISOString()
        });
      } else {
        // Reset to default
        await update(userRef, {
          [`${type}Points`]: type === 'action' ? 20 : 10,
          lastUpdate: new Date().toISOString()
        });
      }

      // Add to action history
      const history = [{
        type: 'admin_action',
        description: `⚡️ Points de ${type === 'action' ? 'action' : 'mouvement'} ${newValue ? 'illimités activés' : 'remis à la normale'}`,
        timestamp: new Date().toISOString()
      }];

      await update(userRef, {
        history: history
      });

    } catch (error) {
      console.error('Error toggling unlimited points:', error);
      setError('Erreur lors de la modification des points');
    }
  };

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const usersRef = ref(db, 'users');
      const snapshot = await get(usersRef);
      if (snapshot.exists()) {
        const playersData = Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
          id,
          ...data,
          inventory: data.inventory || []
        }));
        setPlayers(playersData);
      }
    } catch (error) {
      console.error('Error loading players:', error);
      setError('Failed to load players');
    } finally {
      setLoading(false);
    }
  };

  const handleBanPlayer = async (playerId: string) => {
    try {
      const playerRef = ref(db, `users/${playerId}`);
      await update(playerRef, {
        banned: true,
        banReason: 'Administrative action',
        banDate: new Date().toISOString()
      });
      await loadPlayers();
    } catch (error) {
      console.error('Error banning player:', error);
      setError('Failed to ban player');
    }
  };

  const handleUpdateStats = async () => {
    if (!selectedPlayer || !editedStats) return;

    try {
      const userRef = ref(db, `users/${selectedPlayer.id}`);
      await update(userRef, {
        stats: editedStats,
        lastUpdate: new Date().toISOString()
      });
      
      await loadPlayers();
      setError(null);
    } catch (error) {
      console.error('Error updating stats:', error);
      setError('Failed to update player stats');
    }
  };

  const handleGiveItem = async () => {
    if (!selectedPlayer || !selectedItem) {
      setError('Please select a user and an item');
      return;
    }

    const userRef = ref(db, `users/${selectedPlayer.id}`);
    const userSnapshot = await get(userRef);
    if (!userSnapshot.exists()) {
      throw new Error('User not found');
    }

    const userData = userSnapshot.val();

    try {
      let itemData;
      switch (selectedItemType) {
        case 'prison_weapons':
          itemData = PRISON_WEAPONS[selectedItem];
          break;
        case 'weapons':
          itemData = WEAPONS[selectedItem];
          break;
        case 'items':
          itemData = PRISON_ITEMS[selectedItem];
          break;
        case 'materials':
          itemData = CRAFTING_MATERIALS[selectedItem];
          break;
        case 'crafted':
          itemData = CRAFTING_RECIPES.find(r => r.id === selectedItem);
          break;
      }

      if (!itemData) throw new Error('Item not found');

      const newItem = {
        id: `${selectedItemType}_${uuidv4()}`,
        ...itemData,
        quantity: 1,
        ...((selectedItemType.includes('weapons') || selectedItemType === 'crafted') && {
          durability: itemData.durability || { current: 100, max: 100 },
          equipped: false
        })
      };

      const inventory = userData.inventory || [];

      await update(userRef, {
        inventory: [...inventory, newItem],
        lastUpdate: new Date().toISOString(),
        history: [{
          type: 'admin_action',
          description: `📦 Admin gave ${itemData.name}`,
          timestamp: new Date().toISOString()
        }, ...(userData.history || []).slice(0, 49)]
      });

      setError(null);
      setSelectedItem('');
      setShowItemModal(false);
      await loadPlayers(); // Refresh player data

    } catch (error) {
      console.error('Error giving item:', error);
      setError('Failed to give item: ' + (error as Error).message);
    }
  };

  const filteredPlayers = players.filter(player => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      player.username?.toLowerCase().includes(searchLower) ||
      player.email?.toLowerCase().includes(searchLower)
    );
  });

  const handleRemoveItem = async (playerId: string, itemId: string) => {
    try {
      const userRef = ref(db, `users/${playerId}`);
      const snapshot = await get(userRef);
      
      if (!snapshot.exists()) {
        throw new Error('User not found');
      }

      const userData = snapshot.val();
      const updatedInventory = userData.inventory.filter((item: any) => item.id !== itemId);

      await update(userRef, {
        inventory: updatedInventory,
        lastUpdate: new Date().toISOString()
      });

      // Refresh player data
      await loadPlayers();
      setError(null);
    } catch (error) {
      console.error('Error removing item:', error);
      setError('Failed to remove item');
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="text-sm text-gray-400">Total Joueurs</div>
          <div className="text-2xl font-bold text-white">{players.length}</div>
        </div>
        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="text-sm text-gray-400">Actifs (24h)</div>
          <div className="text-2xl font-bold text-green-400">
            {players.filter(p => {
              const lastActive = new Date(p.lastActive);
              const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
              return lastActive > dayAgo;
            }).length}
          </div>
        </div>
        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="text-sm text-gray-400">Bannis</div>
          <div className="text-2xl font-bold text-red-400">
            {players.filter(p => p.banned).length}
          </div>
        </div>
        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="text-sm text-gray-400">Niveau Moyen</div>
          <div className="text-2xl font-bold text-blue-400">
            {Math.round(players.reduce((acc, p) => acc + (p.stats?.level || 1), 0) / (players.length || 1))}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Players Table */}
      <div className="bg-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-600">
                <th className="px-4 py-3 text-gray-400">Joueur</th>
                <th className="px-4 py-3 text-gray-400">Niveau</th>
                <th className="px-4 py-3 text-gray-400">Argent</th>
                <th className="px-4 py-3 text-gray-400">Points</th>
                <th className="px-4 py-3 text-gray-400">Dernière Connexion</th>
                <th className="px-4 py-3 text-gray-400">Status</th>
                <th className="px-4 py-3 text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.map(player => (
                <tr key={player.id} className="border-b border-gray-700/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {player.avatar ? (
                        <img 
                          src={player.avatar} 
                          alt={player.username} 
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                          <span className="text-gray-400">{player.username?.[0]}</span>
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{player.username}</div>
                        <div className="text-sm text-gray-400">{player.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-blue-400">{player.stats?.level || 1}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-yellow-400">{player.money}€</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleUnlimitedPoints(player.id, 'action')}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                          unlimitedPoints[`${player.id}_action`]
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-gray-700 text-gray-400'
                        }`}
                        title="Points d'action illimités"
                      >
                        <Infinity size={14} /> PA
                      </button>
                      <button
                        onClick={() => toggleUnlimitedPoints(player.id, 'movement')}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                          unlimitedPoints[`${player.id}_movement`]
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-700 text-gray-400'
                        }`}
                        title="Points de mouvement illimités"
                      >
                        <Infinity size={14} /> PM
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-400">
                      {new Date(player.lastActive).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {player.banned ? (
                      <span className="px-2 py-1 text-xs bg-red-500/10 text-red-400 rounded-full">
                        Banni
                      </span>
                    ) : player.admin ? (
                      <span className="px-2 py-1 text-xs bg-yellow-500/10 text-yellow-400 rounded-full">
                        Admin
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs bg-green-500/10 text-green-400 rounded-full">
                        Actif
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedPlayer(player);
                          setEditedStats(player.stats);
                          setShowStatsModal(true);
                        }}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                        title="Modifier les stats"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPlayer(player);
                          setShowInventoryModal(true);
                        }}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                        title="Voir l'inventaire"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPlayer(player);
                          setShowItemModal(true);
                        }}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                        title="Donner un objet"
                      >
                        <Package size={18} />
                      </button>
                      <button
                        onClick={() => handleBanPlayer(player.id)}
                        className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                        title="Bannir"
                      >
                        <Ban size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Editor Modal */}
      {showStatsModal && selectedPlayer && editedStats && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-medium">Modifier les statistiques de {selectedPlayer.username}</h3>
              <button
                onClick={() => {
                  setShowStatsModal(false);
                  setEditedStats(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Niveau</label>
                <input
                  type="number"
                  value={editedStats.level}
                  onChange={(e) => setEditedStats({
                    ...editedStats,
                    level: parseInt(e.target.value)
                  })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Force</label>
                <input
                  type="number"
                  value={editedStats.strength}
                  onChange={(e) => setEditedStats({
                    ...editedStats,
                    strength: parseInt(e.target.value)
                  })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Défense</label>
                <input
                  type="number"
                  value={editedStats.defense}
                  onChange={(e) => setEditedStats({
                    ...editedStats,
                    defense: parseInt(e.target.value)
                  })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Agilité</label>
                <input
                  type="number"
                  value={editedStats.agility}
                  onChange={(e) => setEditedStats({
                    ...editedStats,
                    agility: parseInt(e.target.value)
                  })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Esquive</label>
                <input
                  type="number"
                  value={editedStats.dodge}
                  onChange={(e) => setEditedStats({
                    ...editedStats,
                    dodge: parseInt(e.target.value)
                  })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowStatsModal(false);
                  setEditedStats(null);
                }}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleUpdateStats}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Save size={20} />
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Give Item Modal */}
      {showItemModal && selectedPlayer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-medium">Donner un objet à {selectedPlayer.username}</h3>
              <button
                onClick={() => {
                  setShowItemModal(false);
                  setSelectedItem('');
                }}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex gap-4 mb-4">
                <select
                  value={selectedItemType}
                  onChange={(e) => setSelectedItemType(e.target.value as any)}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                >
                  <option value="prison_weapons">Armes de prison</option>
                  <option value="weapons">Armes de combat</option>
                  <option value="items">Objets consommables</option>
                  <option value="materials">Matériaux</option>
                  <option value="crafted">Objets craftés</option>
                </select>
              </div>
              <label className="text-sm text-gray-400 mb-1 block">Sélectionner l'objet</label>
              <select
                value={selectedItem}
                onChange={(e) => setSelectedItem(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
              >
                <option value="">Sélectionner un objet...</option>
                {selectedItemType === 'prison_weapons' && 
                  Object.entries(PRISON_WEAPONS).map(([id, weapon]) => (
                    <option key={id} value={id}>{weapon.name} ({weapon.emoji})</option>
                  ))
                }
                {selectedItemType === 'weapons' && 
                  Object.entries(WEAPONS).map(([id, weapon]) => (
                    <option key={id} value={id}>{weapon.name} ({weapon.emoji})</option>
                  ))
                }
                {selectedItemType === 'items' && 
                  Object.entries(PRISON_ITEMS).map(([id, item]) => (
                    <option key={id} value={id}>{item.name} ({item.emoji})</option>
                  ))
                }
                {selectedItemType === 'materials' && 
                  Object.entries(CRAFTING_MATERIALS).map(([id, material]) => (
                    <option key={id} value={id}>{material.name} ({material.emoji})</option>
                  ))
                }
                {selectedItemType === 'crafted' && 
                  Object.entries(CRAFTING_RECIPES).map(([id, recipe]) => (
                    <option key={id} value={id}>{recipe.name} ({recipe.emoji})</option>
                  ))
                }
              </select>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowItemModal(false);
                  setSelectedItem('');
                }}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleGiveItem}
                disabled={!selectedItem}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Package size={20} />
                Donner l'objet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Modal */}
      {showInventoryModal && selectedPlayer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-medium">
                Inventaire de {selectedPlayer.username}
              </h3>
              <button
                onClick={() => setShowInventoryModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedPlayer.inventory.map((item: any) => (
                <div key={item.id} className="bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{item.emoji}</span>
                    <div className="flex-1">
                      <h4 className="font-bold">{item.name}</h4>
                      <p className="text-sm text-gray-400">{item.description}</p>
                    </div>
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

                  {item.durability && (
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Durabilité</span>
                        <span>{item.durability.current}/{item.durability.max}</span>
                      </div>
                      <div className="h-1 bg-gray-600 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            item.durability.current < 30 ? 'bg-red-500' : 'bg-blue-500'
                          }`}
                          style={{
                            width: `${(item.durability.current / item.durability.max) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleRemoveItem(selectedPlayer.id, item.id)}
                    className="w-full mt-2 px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                  >
                    Retirer
                  </button>
                </div>
              ))}

              {selectedPlayer.inventory.length === 0 && (
                <div className="col-span-2 text-center py-8 text-gray-500">
                  Inventaire vide
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
