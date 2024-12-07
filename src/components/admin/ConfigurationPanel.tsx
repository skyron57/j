import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Settings, Save } from 'lucide-react';

interface GameSettings {
  maintenance: boolean;
  maintenanceMessage: string;
  maxLevel: number;
  maxInventorySlots: number;
  maxQuickSlots: number;
  baseHealthRegen: number;
  baseActionPointsRegen: number;
  baseMovementPointsRegen: number;
  experienceMultiplier: number;
  moneyMultiplier: number;
  weaponDurabilityMultiplier: number;
}

export const ConfigurationPanel: React.FC = () => {
  const [settings, setSettings] = useState<GameSettings>({
    maintenance: false,
    maintenanceMessage: 'Le serveur est en maintenance...',
    maxLevel: 100,
    maxInventorySlots: 50,
    maxQuickSlots: 5,
    baseHealthRegen: 1,
    baseActionPointsRegen: 1,
    baseMovementPointsRegen: 2,
    experienceMultiplier: 1,
    moneyMultiplier: 1,
    weaponDurabilityMultiplier: 1
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settingsRef = doc(db, 'gameSettings', 'global');
      const settingsDoc = await getDoc(settingsRef);
      if (settingsDoc.exists()) {
        setSettings(settingsDoc.data() as GameSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const settingsRef = doc(db, 'gameSettings', 'global');
      await updateDoc(settingsRef, settings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-700 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="text-yellow-500" size={24} />
          <h3 className="text-xl font-medium">Configuration globale</h3>
        </div>

        <div className="space-y-6">
          {/* Maintenance Mode */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={settings.maintenance}
                onChange={(e) => setSettings({ ...settings, maintenance: e.target.checked })}
                className="rounded border-gray-600 text-yellow-500 focus:ring-yellow-500"
              />
              <label className="text-sm text-gray-400">Mode maintenance</label>
            </div>
            {settings.maintenance && (
              <input
                type="text"
                value={settings.maintenanceMessage}
                onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })}
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                placeholder="Message de maintenance..."
              />
            )}
          </div>

          {/* Game Limits */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Niveau maximum</label>
              <input
                type="number"
                value={settings.maxLevel}
                onChange={(e) => setSettings({ ...settings, maxLevel: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Slots d'inventaire</label>
              <input
                type="number"
                value={settings.maxInventorySlots}
                onChange={(e) => setSettings({ ...settings, maxInventorySlots: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Slots rapides</label>
              <input
                type="number"
                value={settings.maxQuickSlots}
                onChange={(e) => setSettings({ ...settings, maxQuickSlots: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:border-yellow-500"
              />
            </div>
          </div>

          {/* Regeneration Rates */}
          <div>
            <h4 className="text-sm text-gray-400 mb-2">Taux de régénération</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Santé (par minute)</label>
                <input
                  type="number"
                  value={settings.baseHealthRegen}
                  onChange={(e) => setSettings({ ...settings, baseHealthRegen: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                  step="0.1"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Points d'action</label>
                <input
                  type="number"
                  value={settings.baseActionPointsRegen}
                  onChange={(e) => setSettings({ ...settings, baseActionPointsRegen: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                  step="0.1"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Points de mouvement</label>
                <input
                  type="number"
                  value={settings.baseMovementPointsRegen}
                  onChange={(e) => setSettings({ ...settings, baseMovementPointsRegen: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                  step="0.1"
                />
              </div>
            </div>
          </div>

          {/* Game Multipliers */}
          <div>
            <h4 className="text-sm text-gray-400 mb-2">Multiplicateurs</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Expérience</label>
                <input
                  type="number"
                  value={settings.experienceMultiplier}
                  onChange={(e) => setSettings({ ...settings, experienceMultiplier: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                  step="0.1"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Argent</label>
                <input
                  type="number"
                  value={settings.moneyMultiplier}
                  onChange={(e) => setSettings({ ...settings, moneyMultiplier: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                  step="0.1"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Durabilité des armes</label>
                <input
                  type="number"
                  value={settings.weaponDurabilityMultiplier}
                  onChange={(e) => setSettings({ ...settings, weaponDurabilityMultiplier: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                  step="0.1"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Save size={20} />
              Sauvegarder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
