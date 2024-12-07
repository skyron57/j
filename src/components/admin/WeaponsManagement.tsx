import React, { useState, useEffect } from 'react';
import { Sword, Shield, Package, Edit2, Trash2, Plus, Save, X, AlertCircle, Users, Target, Zap, BarChart2 } from 'lucide-react';
import { db } from '../../firebase';
import { ref, get, update } from 'firebase/database';
import { generateUniqueId } from '../../utils/ids';
import { PRISON_WEAPONS } from '../../types/weapon';
import { PRISON_ITEMS } from '../../types/inventory';
import { WEAPONS } from '../../types/combat';

interface WeaponItem {
  id: string;
  name: string;
  category: 'weapon' | 'defense' | 'consumable';
  description: string;
  stats?: {
    attack: number;
    defense: number;
    agility: number;
    dodge: number;
  };
  durability?: {
    current: number;
    max: number;
  };
  effect?: {
    type: string;
    value: number;
  };
  emoji: string;
  rarity: number;
  price: number;
  lastModified: string;
  active: boolean;
}

interface WeaponStats {
  id: string;
  name: string;
  type: string;
  stats: {
    attack: number;
    defense: number;
    agility: number;
    dodge: number;
  };
  emoji: string;
}

export const WeaponsManagement: React.FC = () => {
  const [items, setItems] = useState<WeaponItem[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<WeaponItem | null>(null);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedGiveItem, setSelectedGiveItem] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [weaponStats, setWeaponStats] = useState<WeaponStats[]>([]);

  useEffect(() => {
    loadItems();
    loadUsers();
    loadWeaponStats();
  }, []);

  const loadWeaponStats = () => {
    const prisonWeapons = Object.entries(PRISON_WEAPONS).map(([id, weapon]) => ({
      id: `prison_${id}`,
      name: weapon.name,
      type: 'Prison',
      stats: {
        attack: weapon.stats.attack,
        defense: weapon.stats.defense,
        agility: weapon.stats.skill,
        dodge: weapon.stats.dodge
      },
      emoji: weapon.emoji
    }));

    const combatWeapons = Object.entries(WEAPONS).map(([id, weapon]) => ({
      id: `combat_${id}`,
      name: weapon.name,
      type: 'Combat',
      stats: weapon.stats,
      emoji: weapon.emoji
    }));

    setWeaponStats([...prisonWeapons, ...combatWeapons]);
  };

  const handleEditStats = (weapon: WeaponStats) => {
    setSelectedWeapon(weapon);
    setShowStatsModal(true);
  };

  const handleSaveStats = async () => {
    if (!selectedWeapon) return;

    try {
      // Mise à jour des stats dans la base de données
      const weaponRef = ref(db, `weapons/${selectedWeapon.id}`);
      await update(weaponRef, {
        stats: selectedWeapon.stats
      });

      // Mise à jour locale
      setWeaponStats(prevStats =>
        prevStats.map(weapon =>
          weapon.id === selectedWeapon.id ? selectedWeapon : weapon
        )
      );

      setShowStatsModal(false);
      setSelectedWeapon(null);
    } catch (error) {
      console.error('Error updating weapon stats:', error);
      setError('Erreur lors de la mise à jour des statistiques');
    }
  };

  const loadItems = async () => {
    try {
      setLoading(true);
      const itemsRef = ref(db, 'items');
      const snapshot = await get(itemsRef);
      if (snapshot.exists()) {
        const itemsData = Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
          id,
          ...data
        }));
        setItems(itemsData);
      }
    } catch (error) {
      console.error('Error loading items:', error);
      setError('Error loading items');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(query(usersRef));
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        username: doc.data().username
      }));
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleGiveItem = async () => {
    if (!selectedUser || !selectedGiveItem) {
      setError('Please select both a user and an item');
      return;
    }

    try {
      setError(null);
      const userRef = doc(db, 'users', selectedUser);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      const inventory = userData.inventory || [];

      // Create the new item
      let itemToGive;
      if (selectedGiveItem in PRISON_WEAPONS) {
        const weaponId = generateUniqueId();
        itemToGive = {
          ...PRISON_WEAPONS[selectedGiveItem],
          id: weaponId,
          quantity: 1,
          durability: {
            current: 100,
            max: 100
          }
        };
      } else if (selectedGiveItem in WEAPONS) {
        const weaponId = generateUniqueId();
        itemToGive = {
          ...WEAPONS[selectedGiveItem],
          id: weaponId,
          quantity: 1,
          durability: {
            current: 100,
            max: 100
          }
        };
      } else if (selectedGiveItem in PRISON_ITEMS) {
        const itemId = generateUniqueId();
        itemToGive = {
          ...PRISON_ITEMS[selectedGiveItem],
          id: itemId,
          quantity: 1
        };
      }

      if (!itemToGive) {
        throw new Error('Invalid item selected');
      }

      // Check if item already exists in inventory
      const existingItemIndex = inventory.findIndex(item => 
        item.name === itemToGive.name && 
        item.category === itemToGive.category
      );

      let updatedInventory;
      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        updatedInventory = inventory.map((item, index) => 
          index === existingItemIndex
            ? { ...item, quantity: (item.quantity || 1) + 1 }
            : item
        );
      } else {
        // Add new item
        updatedInventory = [...inventory, itemToGive];
      }

      // Update user's inventory
      await updateDoc(userRef, {
        inventory: updatedInventory,
        lastUpdate: new Date().toISOString()
      });

      // Add to action history
      await updateDoc(userRef, {
        history: [{
          type: 'admin_give',
          description: `Admin gave you ${itemToGive.name}`,
          timestamp: new Date().toISOString()
        }, ...(userData.history || []).slice(0, 49)]
      });

      setSelectedGiveItem('');
      setSelectedUser('');
      setError(null);

    } catch (error: any) {
      console.error('Error giving item:', error);
      setError(error.message || 'Error giving item to user');
    }
  };

  return (
    <div className="space-y-6">
      {/* Weapon Stats Section */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg prison-font mb-6 flex items-center gap-2">
          <BarChart2 className="text-yellow-500" />
          Statistiques des armes
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-700">
                <th className="px-4 py-3 text-gray-400">Arme</th>
                <th className="px-4 py-3 text-gray-400">Type</th>
                <th className="px-4 py-3 text-gray-400">ATT</th>
                <th className="px-4 py-3 text-gray-400">DEF</th>
                <th className="px-4 py-3 text-gray-400">AGI</th>
                <th className="px-4 py-3 text-gray-400">ESQ</th>
                <th className="px-4 py-3 text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {weaponStats.map((weapon) => (
                <tr key={weapon.id} className="border-b border-gray-700/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{weapon.emoji}</span>
                      <span>{weapon.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      weapon.type === 'Prison'
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      {weapon.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-red-400">{weapon.stats.attack}</td>
                  <td className="px-4 py-3 text-blue-400">{weapon.stats.defense}</td>
                  <td className="px-4 py-3 text-yellow-400">{weapon.stats.agility}</td>
                  <td className="px-4 py-3 text-green-400">{weapon.stats.dodge}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleEditStats(weapon)}
                      className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Give Item Section */}
      <div className="bg-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          <Package className="text-yellow-500" />
          Give Item to User
        </h3>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Select User</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:border-yellow-500"
            >
              <option value="">Select a user...</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.username}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Select Item</label>
            <select
              value={selectedGiveItem}
              onChange={(e) => setSelectedGiveItem(e.target.value)}
              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:border-yellow-500"
            >
              <option value="">Select an item...</option>
              <optgroup label="Prison Weapons">
                {Object.entries(PRISON_WEAPONS).map(([id, weapon]) => (
                  <option key={id} value={id}>{weapon.name}</option>
                ))}
              </optgroup>
              <optgroup label="Combat Weapons">
                {Object.entries(WEAPONS).map(([id, weapon]) => (
                  <option key={id} value={id}>{weapon.name}</option>
                ))}
              </optgroup>
              <optgroup label="Items">
                {Object.entries(PRISON_ITEMS).map(([id, item]) => (
                  <option key={id} value={id}>{item.name}</option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        <button
          onClick={handleGiveItem}
          disabled={!selectedUser || !selectedGiveItem}
          className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Give Item
        </button>
      </div>

      {/* Stats Editor Modal */}
      {showStatsModal && selectedWeapon && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedWeapon.emoji}</span>
                <h3 className="text-xl font-medium">{selectedWeapon.name}</h3>
              </div>
              <button
                onClick={() => {
                  setShowStatsModal(false);
                  setSelectedWeapon(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                  <Sword size={16} className="text-red-400" />
                  Attaque
                </label>
                <input
                  type="number"
                  value={selectedWeapon.stats.attack}
                  onChange={(e) => setSelectedWeapon({
                    ...selectedWeapon,
                    stats: { ...selectedWeapon.stats, attack: Number(e.target.value) }
                  })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                  <Shield size={16} className="text-blue-400" />
                  Défense
                </label>
                <input
                  type="number"
                  value={selectedWeapon.stats.defense}
                  onChange={(e) => setSelectedWeapon({
                    ...selectedWeapon,
                    stats: { ...selectedWeapon.stats, defense: Number(e.target.value) }
                  })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                  <Zap size={16} className="text-yellow-400" />
                  Agilité
                </label>
                <input
                  type="number"
                  value={selectedWeapon.stats.agility}
                  onChange={(e) => setSelectedWeapon({
                    ...selectedWeapon,
                    stats: { ...selectedWeapon.stats, agility: Number(e.target.value) }
                  })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                  <Target size={16} className="text-green-400" />
                  Esquive
                </label>
                <input
                  type="number"
                  value={selectedWeapon.stats.dodge}
                  onChange={(e) => setSelectedWeapon({
                    ...selectedWeapon,
                    stats: { ...selectedWeapon.stats, dodge: Number(e.target.value) }
                  })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowStatsModal(false);
                  setSelectedWeapon(null);
                }}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveStats}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2"
              >
                <Save size={20} />
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="bg-gray-700 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-600 flex justify-between items-center">
          <h3 className="text-lg font-medium">Weapons & Items</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedItem({} as WeaponItem)}
              className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              <Plus size={16} />
              Add Item
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-600">
                <th className="px-4 py-3 text-gray-400">Item</th>
                <th className="px-4 py-3 text-gray-400">Category</th>
                <th className="px-4 py-3 text-gray-400">Stats</th>
                <th className="px-4 py-3 text-gray-400">Rarity</th>
                <th className="px-4 py-3 text-gray-400">Price</th>
                <th className="px-4 py-3 text-gray-400">Status</th>
                <th className="px-4 py-3 text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="border-b border-gray-600/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.emoji}</span>
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-400">{item.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.category === 'weapon'
                        ? 'bg-red-500/10 text-red-400'
                        : item.category === 'defense'
                        ? 'bg-blue-500/10 text-blue-400'
                        : 'bg-green-500/10 text-green-400'
                    }`}>
                      {item.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {item.stats && (
                      <div className="space-y-1 text-sm">
                        {Object.entries(item.stats).map(([stat, value]) => (
                          <div key={stat} className="flex items-center gap-1">
                            <span className="text-gray-400 capitalize">{stat}:</span>
                            <span>{value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex">
                      {Array.from({ length: item.rarity }).map((_, i) => (
                        <span key={i} className="text-yellow-400">★</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-yellow-400">{item.price}€</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.active
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      {item.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setEditMode(true);
                        }}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => {/* Handle delete */}}
                        className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
