import React from 'react';
import { Shield, Swords, Heart } from 'lucide-react';
import { useGameState } from '../contexts/GameStateContext';
import { PrisonerBot } from '../types/prisoner';
import { Guard } from '../types/guard';
import { HealthStatusIndicator } from './HealthStatusIndicator';

interface UserListProps {
  users: (PrisonerBot | Guard)[];
  onAction: (action: string, userId: string) => void;
}

export const UserList: React.FC<UserListProps> = ({ users, onAction }) => {
  const { state } = useGameState();

  const isGuard = (user: PrisonerBot | Guard): user is Guard => {
    return 'weapon' in user;
  };

  // Fonction pour déterminer si un joueur peut voir un autre joueur en fonction de la tranche de niveau
  const canSee = (user: PrisonerBot | Guard) => {
    const userLevel = user.level;
    const userLevelRangeStart = Math.floor(state.stats.level / 6) * 6;
    const userLevelRangeEnd = userLevelRangeStart + 6;

    return userLevel >= userLevelRangeStart && userLevel < userLevelRangeEnd;
  };

  // Filtrer les utilisateurs qui peuvent être vus
  const filteredUsers = users.filter(user => canSee(user));

  return (
    <div className="space-y-4">
      {filteredUsers.map((user) => (
        <div
          key={user.id}
          className={`bg-gray-800 rounded-lg p-4 border transition-all ${
            canSee(user)
              ? 'border-gray-700 hover:bg-gray-700/50'
              : 'border-gray-800 opacity-50'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{isGuard(user) ? '👮' : '👤'}</div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="prison-font text-lg">{user.username}</h3>
                  <HealthStatusIndicator health={user.health} compact />
                </div>
                <span className="text-sm text-gray-400">
                  Niveau {user.level}
                </span>
              </div>
            </div>
          </div>

          {canSee(user) && (
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onAction('attack', user.id)}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-red-900/20 text-red-400 rounded hover:bg-red-900/30 transition-colors"
              >
                <Swords size={16} />
                <span className="text-sm">Attaquer</span>
              </button>
              {!isGuard(user) && (
                <button
                  onClick={() => onAction('steal', user.id)}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-purple-900/20 text-purple-400 rounded hover:bg-purple-900/30 transition-colors"
                >
                  <Shield size={16} />
                  <span className="text-sm">Voler</span>
                </button>
              )}
              <button
                onClick={() => onAction('heal', user.id)}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-green-900/20 text-green-400 rounded hover:bg-green-900/30 transition-colors"
              >
                <Heart size={16} />
                <span className="text-sm">Soigner</span>
              </button>
            </div>
          )}

          {!canSee(user) && (
            <div className="text-xs text-red-400 flex items-center gap-1">
              <Shield size={12} />
              <span>
                Niveau trop {user.level > state.stats.level ? 'élevé' : 'bas'} pour interagir
              </span>
            </div>
          )}
        </div>
      ))}

      {filteredUsers.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          Aucun utilisateur dans votre tranche de niveau
        </div>
      )}
    </div>
  );
};
