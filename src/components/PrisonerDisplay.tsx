import React, { useState } from 'react';
import { useGameState } from '../contexts/GameStateContext';
import { PrisonerBot } from '../types/prisoner';
import { PrisonerService } from '../services/prisoner';
import { CombatService } from '../services/combat';
import { HealthStatusIndicator } from './HealthStatusIndicator';
import { InteractionMenu } from './InteractionMenu';
import { Swords, Shield, Heart } from 'lucide-react';

interface PrisonerDisplayProps {
  prisoner: PrisonerBot;
  isBot?: boolean;
}

export const PrisonerDisplay: React.FC<PrisonerDisplayProps> = ({ prisoner, isBot }) => {
  const { state, dispatch } = useGameState();
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const canInteract = PrisonerService.canInteractWithPrisoner(state.stats.level, prisoner);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isBot) {
      setMenuPosition({ x: e.clientX, y: e.clientY });
      setShowMenu(true);
    }
  };

  const handleAction = async (action: string) => {
    switch (action) {
      case 'message':
        // Navigate to messages with pre-filled recipient
        break;
      case 'report':
        // Open report dialog
        break;
      case 'profile':
        // Navigate to profile view
        break;
    }
  };

  const handleAttack = async () => {
    if (state.actionPoints < 5) {
      dispatch({
        type: 'ADD_ACTION',
        payload: {
          type: 'error',
          description: 'Points d\'action insuffisants (5 PA requis)',
          timestamp: new Date()
        }
      });
      return;
    }

    try {
      const equippedWeapon = state.inventory.find(item => 
        item.category === 'weapon' && item.equipped
      );

      const result = await CombatService.performAttack(
        {
          id: state.id,
          username: state.username,
          stats: state.stats,
          actionPoints: state.actionPoints,
          health: state.health
        },
        prisoner,
        equippedWeapon
      );

      if (result.success) {
        // Add attack action
        dispatch({
          type: 'ADD_ACTION',
          payload: {
            type: 'attack',
            description: `Vous attaquez ${prisoner.username} et infligez ${result.damage} points de dégâts`,
            timestamp: new Date(),
            damage: result.damage,
            weapon: equippedWeapon?.name
          }
        });

        // Add counter action
        if (result.counter) {
          dispatch({
            type: 'ADD_ACTION',
            payload: {
              type: 'counter',
              description: result.counter.message,
              timestamp: new Date(),
              damage: result.counter.damage
            }
          });
        }

        // Update AP
        dispatch({
          type: 'UPDATE_ACTION_POINTS',
          payload: -5
        });

        // Update health if counter-attacked
        if (result.counter) {
          dispatch({
            type: 'UPDATE_HEALTH',
            payload: state.health - result.counter.damage
          });
        }
      }
    } catch (error) {
      console.error('Attack error:', error);
    }
  };

  const handleSteal = () => {
    if (state.actionPoints < 3) {
      dispatch({
        type: 'ADD_ACTION',
        payload: {
          type: 'error',
          description: 'Points d\'action insuffisants (3 PA requis)',
          timestamp: new Date()
        }
      });
      return;
    }

    dispatch({
      type: 'UPDATE_ACTION_POINTS',
      payload: -3
    });

    dispatch({
      type: 'ADD_ACTION',
      payload: {
        type: 'steal',
        description: `Vous tentez de voler ${prisoner.username}...`,
        timestamp: new Date()
      }
    });
  };

  const handleHeal = () => {
    if (state.actionPoints < 4) {
      dispatch({
        type: 'ADD_ACTION',
        payload: {
          type: 'error',
          description: 'Points d\'action insuffisants (4 PA requis)',
          timestamp: new Date()
        }
      });
      return;
    }

    dispatch({
      type: 'UPDATE_ACTION_POINTS',
      payload: -4
    });

    dispatch({
      type: 'ADD_ACTION',
      payload: {
        type: 'heal',
        description: `Vous soignez ${prisoner.username}`,
        timestamp: new Date()
      }
    });
  };

  return (
    <div 
      className={`p-4 rounded-lg border transition-all ${
        canInteract
          ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800/70'
          : 'bg-gray-900/30 border-gray-800 opacity-50'
      }`}
      onContextMenu={handleContextMenu}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="text-2xl">👤</div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="prison-font text-lg">{prisoner.username}</h3>
              <HealthStatusIndicator health={prisoner.health} compact />
            </div>
            <span className="text-sm text-gray-400">Niveau {prisoner.level}</span>
          </div>
        </div>

        {canInteract && (
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleAttack}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-900/20 text-red-400 rounded hover:bg-red-900/30 transition-colors"
            >
              <Swords size={16} />
              <span className="text-sm">Attaquer (5 PA)</span>
            </button>
            <button
              onClick={handleSteal}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-900/20 text-purple-400 rounded hover:bg-purple-900/30 transition-colors"
            >
              <Shield size={16} />
              <span className="text-sm">Voler (3 PA)</span>
            </button>
            <button
              onClick={handleHeal}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-900/20 text-green-400 rounded hover:bg-green-900/30 transition-colors"
            >
              <Heart size={16} />
              <span className="text-sm">Soigner (4 PA)</span>
            </button>
          </div>
        )}

        {!canInteract && (
          <div className="text-xs text-red-400 flex items-center gap-1">
            <Shield size={12} />
            <span>Niveau trop {prisoner.level > state.stats.level ? 'élevé' : 'bas'} pour interagir</span>
          </div>
        )}
      </div>

      {showMenu && (
        <InteractionMenu
          x={menuPosition.x}
          y={menuPosition.y}
          onClose={() => setShowMenu(false)}
          onAction={handleAction}
          targetType="social"
          targetName={prisoner.username}
        />
      )}
    </div>
  );
};
