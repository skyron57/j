import React from 'react';
import { Heart } from 'lucide-react';
import { getHealthStatus, HEALTH_STATUS_COLORS } from '../types/health';

interface HealthStatusIndicatorProps {
  health: number;
  compact?: boolean;
}

export const HealthStatusIndicator: React.FC<HealthStatusIndicatorProps> = ({ health, compact = false }) => {
  const healthStatus = getHealthStatus(health);
  const statusColor = HEALTH_STATUS_COLORS[healthStatus];

  if (compact) {
    return (
      <Heart 
        className={`${statusColor} transition-colors`} 
        size={14}
        fill="currentColor"
      />
    );
  }

  return (
    <div className={`text-sm ${statusColor}`}>
      {health}/100 ({healthStatus})
    </div>
  );
};
