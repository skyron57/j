import React, { useRef } from 'react';
import { useGameState } from '../contexts/GameStateContext';
import { Heart, Activity, Brain, Trophy, Upload } from 'lucide-react';
import { StatsPanel } from './StatsPanel';
import { QuickInventory } from './QuickInventory';
import { HealthDisplay } from './HealthDisplay';
import { Minimap } from './Minimap';
import { storage, db } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ref as dbRef, update, get } from 'firebase/database';

export const PlayerPanel: React.FC = () => {
  const { state, dispatch } = useGameState();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = React.useState<'profile' | 'equipment' | 'stats'>('profile');
  const username = localStorage.getItem('username') || state.username || 'Détenu';

  // Fonction de mise à jour de l'avatar
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Créer une référence pour le stockage de l'avatar
      const avatarRef = ref(storage, `avatars/${state.id}/${file.name}`);
      
      // Télécharger le fichier
      await uploadBytes(avatarRef, file);
      
      // Obtenir l'URL de téléchargement
      const downloadURL = await getDownloadURL(avatarRef);

      // Mettre à jour l'avatar dans la base de données Realtime
      const userRef = dbRef(db, `users/${state.id}`);
      await update(userRef, { avatar: downloadURL });

      // Mettre à jour l'état local
      dispatch({
        type: 'UPDATE_AVATAR',
        payload: downloadURL
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
    }
  };

  // Fonction de mise à jour de la santé du joueur
  const updateHealth = async (newHealth: number) => {
    const userRef = dbRef(db, `users/${state.id}`);
    await update(userRef, { health: newHealth });
  };

  // Fonction de mise à jour des points d'action
  const updateActionPoints = async (newActionPoints: number) => {
    const userRef = dbRef(db, `users/${state.id}`);
    await update(userRef, { actionPoints: newActionPoints });
  };

  // Fonction pour récupérer les données du joueur
  const fetchPlayerData = async () => {
    try {
      const userRef = dbRef(db, `users/${state.id}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const playerData = snapshot.val();
        // Mettre à jour l'état avec les données récupérées
        dispatch({
          type: 'UPDATE_PLAYER_DATA',
          payload: playerData
        });
      }
    } catch (error) {
      console.error('Error fetching player data:', error);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 px-4 py-3 text-sm prison-font tracking-wider ${activeTab === 'profile' ? 'bg-red-900/30 text-red-400' : 'hover:bg-gray-700/50'}`}
        >
          PROFIL
        </button>
        <button
          onClick={() => setActiveTab('equipment')}
          className={`flex-1 px-4 py-3 text-sm prison-font tracking-wider ${activeTab === 'equipment' ? 'bg-red-900/30 text-red-400' : 'hover:bg-gray-700/50'}`}
        >
          ÉQUIPEMENT
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 px-4 py-3 text-sm prison-font tracking-wider ${activeTab === 'stats' ? 'bg-red-900/30 text-red-400' : 'hover:bg-gray-700/50'}`}
        >
          STATS
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gray-700 overflow-hidden">
              {state.avatar ? (
                <img 
                  src={state.avatar} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  <Trophy size={24} />
                </div>
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-1 bg-gray-900 rounded-full hover:bg-gray-800 transition-colors"
            >
              <Upload size={14} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="prison-font text-xl">{username}</h3>
              <HealthDisplay />
            </div>
            <div className="text-sm text-gray-400 mt-1">{state.stats?.points || 0} points ({state.stats?.undistributedXP || 0} XP)</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Heart className="text-red-500" size={20} />
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-500 transition-all duration-300"
                style={{ width: `${state.health}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Activity className="text-blue-500" size={20} />
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${(state.actionPoints / (state.activeAnabolic.endTime ? 30 : 20)) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Brain className="text-yellow-500" size={20} />
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-yellow-500 transition-all duration-300"
                style={{ width: `${state.morale}%` }}
              />
            </div>
          </div>
        </div>

        {activeTab === 'profile' && <Minimap />}
        {activeTab === 'equipment' && <QuickInventory />}
        {activeTab === 'stats' && <StatsPanel />}
      </div>
    </div>
  );
};
