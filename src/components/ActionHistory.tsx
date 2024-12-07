import React from 'react';
import { Clock, Sword, Shield, Heart, XCircle, ShoppingBag, Move, AlertTriangle, PlusCircle, MinusCircle } from 'lucide-react';
import { useGameState } from '../contexts/GameStateContext';

interface Action {
  type: 'attack' | 'counter' | 'dodge' | 'miss' | 'heal' | 'steal' | 'use_item' | 'movement' | 'error' | 'equip' | 'unequip';
  description: string;
  timestamp: Date;
  damage?: number;
  weapon?: string;
  color?: string;
}

const actionIcons = {
  attack: <Sword className="text-red-500" />,
  counter: <Shield className="text-orange-500" />,
  dodge: <Move className="text-green-500" />,
  miss: <XCircle className="text-yellow-500" />,
  heal: <Heart className="text-green-500" />,
  steal: <ShoppingBag className="text-purple-500" />,
  use_item: <PlusCircle className="text-blue-500" />,
  movement: <Move className="text-gray-500" />,
  error: <AlertTriangle className="text-red-500" />,
  equip: <PlusCircle className="text-green-500" />,
  unequip: <MinusCircle className="text-red-500" />,
};

export const ActionHistory: React.FC = () => {
  const { state } = useGameState();

  const getActionStyle = (type: Action['type']) => {
    switch (type) {
      case 'attack':
        return 'border-l-4 border-red-500 bg-red-500/10';
      case 'counter':
        return 'border-l-4 border-orange-500 bg-orange-500/10';
      case 'dodge':
        return 'border-l-4 border-green-500 bg-green-500/10';
      case 'miss':
        return 'border-l-4 border-yellow-500 bg-yellow-500/10';
      case 'heal':
        return 'border-l-4 border-green-500 bg-green-500/10';
      case 'steal':
        return 'border-l-4 border-purple-500 bg-purple-500/10';
      case 'use_item':
        return 'border-l-4 border-blue-500 bg-blue-500/10';
      case 'movement':
        return 'border-l-4 border-gray-500 bg-gray-500/10';
      case 'error':
        return 'border-l-4 border-red-500 bg-red-500/10';
      case 'equip':
        return 'border-l-4 border-green-500 bg-green-500/10';
      case 'unequip':
        return 'border-l-4 border-red-500 bg-red-500/10';
      default:
        return 'border-l-4 border-gray-500 bg-gray-500/10';
    }
  };

  return (
    <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="text-yellow-500" size={20} />
        <h3 className="text-lg prison-font">Journal d'actions</h3>
      </div>
      
      <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
        {state.history.map((action, index) => (
          <div 
            key={index}
            className={`p-2 rounded-lg text-sm border-l-2 flex items-center gap-2 ${getActionStyle(action.type)} ${action.color || ''}`}
          >
            {actionIcons[action.type]}
            <div className="flex-1">
              <div className="text-gray-300">
                {action.description}
                {action.damage > 0 && action.type === 'attack' && (
                  <span className="text-red-400 font-bold"> (-{action.damage} PV)</span>
                )}
                {action.damage > 0 && action.type === 'counter' && (
                  <span className="text-orange-400 font-bold"> (-{action.damage} PV)</span>
                )}
                {action.weapon && (
                  <span className="text-gray-400"> avec {action.weapon}</span>
                )}
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {new Date(action.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}

        {(!state.history || state.history.length === 0) && (
          <div className="text-center text-gray-500 py-4">
            Aucune action récente
          </div>
        )}
      </div>
    </div>
  );
};
