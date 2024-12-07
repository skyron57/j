import React from 'react';
import { useGameState } from '../contexts/GameStateContext';
import { LocationView } from './LocationView';

export const GameArea: React.FC = () => {
  const { state } = useGameState();

  return (
    <div className="p-4">
      <div className="max-w-7xl mx-auto">
        <LocationView location={state.location} />
      </div>
    </div>
  );
};
