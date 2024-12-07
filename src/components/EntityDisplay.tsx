import React, { useState } from 'react';
import { Shield, Swords, Heart } from 'lucide-react';
import { useGameState } from '../contexts/GameStateContext';
import { GuardCombatService } from '../services/guard/GuardCombatService';
import { InteractionMenu } from './InteractionMenu';
import { HealthStatusIndicator } from './HealthStatusIndicator';
import { DealerDialog } from './DealerDialog';
import { GameEntity } from '../types/prisoner';

interface EntityDisplayProps {
  entity: GameEntity;
}

export const EntityDisplay: React.FC<EntityDisplayProps> = ({ entity }) => {
  const { state, dispatch } = useGameState();
  const [error, setError] = useState<string | null>(null);
  const [showDealerDialog, setShowDealerDialog] = useState(false);
  const [isActionInProgress, setIsActionInProgress] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const canInteract = true;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (entity.type !== 'dealer' && entity.type !== 'nurse') {
      setMenuPosition({ x: e.clientX, y: e.clientY });
      setShowMenu(true);
    }
  };

  const handleAction = async (action: string) => {
    switch (action) {
      case 'message':
        navigate(`/game/messages?recipient=${entity.id}&name=${entity.username}`);
        break;
      case 'report':
        try {
          await ReportService.createReport({
            reporterId: state.id,
            reporterName: state.username,
            targetId: entity.id,
            targetName: entity.username,
            reason: 'Signalement de comportement',
            description: `Signalement de ${entity.username}`,
            status: 'pending',
            createdAt: new Date().toISOString()
          });
          dispatch({
            type: 'ADD_ACTION',
            payload: {
              type: 'report',
              description: `🚨 Vous avez signalé ${entity.username}`,
              timestamp: new Date().toISOString()
            }
          });
        } catch (err: any) {
          setError(err.message);
        }
        break;
      case 'profile':
        // TODO: Implémenter la vue du profil
        break;
    }
  };

  const handleAttack = async () => {
    if (state.actionPoints < 5) {
      setError('Points d\'action insuffisants (5 PA requis)');
      return;
    }

    const equippedWeapon = state.inventory.find(
      item => (item.type === 'weapon' || item.type === 'crafted') && item.equipped
    );

    if (!equippedWeapon) {
      setError('Vous devez équiper une arme pour attaquer');
      return;
    }

    if (isActionInProgress) return;
    setIsActionInProgress(true);

    try {
      const result = await GuardCombatService.updateGuardHealth(
        entity.id, 
        state.stats.strength + (equippedWeapon.stats?.attack || 0),
        state.id,
        state.username,
        equippedWeapon
      );

      dispatch({
        type: 'UPDATE_ACTION_POINTS',
        payload: -5
      });

      if (result.isDead) {
        dispatch({
          type: 'ADD_ACTION',
          payload: {
            type: 'kill',
            description: equippedWeapon?.deathMessage
              ? equippedWeapon.deathMessage
                  .replace('[killer]', state.username)
                  .replace('[victim]', entity.name)
              : `${state.username} a mis ${entity.name} dans le coma!`,
            timestamp: new Date()
          }
        });
      } else {
        dispatch({
          type: 'ADD_ACTION',
          payload: {
            type: 'hit',
            description: `⚔️ Vous avez infligé ${result.newHealth} dégâts à ${entity.name}`,
            timestamp: new Date(),
            damage: result.newHealth,
            weapon: equippedWeapon.name
          }
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTimeout(() => {
        setIsActionInProgress(false);
      }, 100);
    }
  };

  // Rest of the component remains the same...
  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
      <div className="flex flex-col gap-2" onContextMenu={handleContextMenu}>
        <div 
          className={`flex items-center gap-2 ${entity.type === 'dealer' ? 'cursor-pointer hover:bg-gray-700/50 p-2 rounded-lg' : ''}`}
          onClick={() => entity.type === 'dealer' && entity.shopItems && setShowDealerDialog(true)}
        >
          <div className="text-2xl">{entity.emoji || '👤'}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="prison-font text-lg">{entity.username}</h3>
              <HealthStatusIndicator health={Math.min(100, entity.health)} compact />
            </div>
            <span className="text-sm text-gray-400">Niveau {entity.level}</span>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-400">
            {error}
          </div>
        )}

        {canInteract && !entity.inComa && (
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleAttack}
              disabled={isActionInProgress}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-900/20 text-red-400 rounded hover:bg-red-900/30 transition-colors"
            >
              <Swords size={16} />
              <span className="text-sm">Attaquer (5 PA)</span>
            </button>

            {entity.type !== 'guard' && (
              <button
                onClick={() => {/* handle steal */}}
                disabled={isActionInProgress}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-900/20 text-purple-400 rounded hover:bg-purple-900/30 transition-colors"
              >
                <Shield size={16} />
                <span className="text-sm">Voler (3 PA)</span>
              </button>
            )}

            <button
              onClick={() => {/* handle heal */}}
              disabled={isActionInProgress}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-900/20 text-green-400 rounded hover:bg-green-900/30 transition-colors"
            >
              <Heart size={16} />
              <span className="text-sm">Soigner (4 PA)</span>
            </button>
          </div>
        )}

        {entity.inComa && (
          <div className="text-sm text-red-400 flex items-center gap-1">
            <Shield size={12} />
            <span>Ce garde est dans le coma</span>
          </div>
        )}

        {!canInteract && !entity.inComa && (
          <div className="text-xs text-red-400 flex items-center gap-1">
            <Shield size={12} />
            <span>Niveau trop {entity.level > state.stats.level ? 'élevé' : 'bas'} pour interagir</span>
          </div>
        )}
      </div>

      {showDealerDialog && entity.type === 'dealer' && (
        <DealerDialog onClose={() => setShowDealerDialog(false)} />
      )}
      
      {showMenu && (
        <InteractionMenu
          x={menuPosition.x}
          y={menuPosition.y}
          onClose={() => setShowMenu(false)}
          onAction={handleAction}
          targetName={entity.username}
        />
      )}
    </div>
  );
};
