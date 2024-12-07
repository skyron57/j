import React from 'react';
import { GameEntity } from '../types/entities';
import { getHealthStatus } from '../utils/health';
import { HEALTH_STATUS_COLORS } from '../utils/health';

interface EntityCardProps {
  entity: GameEntity;
}

export const EntityCard: React.FC<EntityCardProps> = ({ entity }) => {
  const healthStatus = getHealthStatus(entity.health);
  const healthColor = HEALTH_STATUS_COLORS[healthStatus];

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">{entity.username}</h3>
        <div className="flex gap-2">
          <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
            Niveau {entity.level}
          </span>
          <span className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded">
            {entity.type}
          </span>
        </div>
      </div>
      
      <div className={`font-medium ${healthColor}`}>
        État: {healthStatus}
      </div>

      {entity.behavior && (
        <div className="mt-2 text-sm text-gray-600">
          Comportement: {entity.behavior}
        </div>
      )}
    </div>
  );
};
