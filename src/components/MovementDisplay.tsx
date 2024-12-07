import React, { useEffect } from 'react';
import { Move } from 'lucide-react';
import { useGameState } from '../contexts/GameStateContext';

export const MovementDisplay: React.FC = () => {
  const { state, dispatch } = useGameState();

  useEffect(() => {
    // Set up MP regeneration interval
    const interval = setInterval(() => {
      if (state.movementPoints < 10) {
        dispatch({
          type: 'UPDATE_MOVEMENT_POINTS',
          payload: 2 // Regenerate 2 MP per minute
        });
      }
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [state.movementPoints, dispatch]);

  return (
    <div className="flex items-center gap-2">
      <Move className="text-green-400" size={20} />
      <div className="flex items-center gap-1">
        <span className="font-bold text-green-400">
          {state.movementPoints}/10 PM
        </span>
        {state.movementPoints < 10 && (
          <span className="text-xs text-gray-400">
            (+2/min)
          </span>
        )}
      </div>
    </div>
  );
};
