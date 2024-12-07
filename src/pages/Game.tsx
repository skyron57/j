import React from 'react';
import { GameArea } from '../components/GameArea';
import { useAuth } from '../contexts/AuthContext';
import { useGameState } from '../contexts/GameStateContext';

export const Game: React.FC = () => {
  const { currentUser } = useAuth();
  const { state } = useGameState();

  return (
    <div className="min-h-screen bg-gray-900">
      <GameArea />
    </div>
  );
};
