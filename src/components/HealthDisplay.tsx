import React, { useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useGameState } from '../contexts/GameStateContext';
import { getHealthStatus, HEALTH_STATUS_COLORS } from '../types/health';

export const HealthDisplay: React.FC = () => {
  const { state, dispatch } = useGameState();
  const health = Math.max(0, Math.min(100, state.health));

  // Synchronize health status every second
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: 'SYNC_HEALTH' });
    }, 1000);

    return () => clearInterval(interval);
  }, [dispatch]);

  const healthStatus = getHealthStatus(health);
  const statusColor = HEALTH_STATUS_COLORS[healthStatus];

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <Heart className={statusColor} size={16} fill="currentColor" />
        <span className={`font-bold ${statusColor}`}>
          {health}/100
        </span>
      </div>
      <span className={`text-xs ${statusColor}`}>
        ({healthStatus})
      </span>
    </div>
  );
};
