import React from 'react';
import { GameEntity } from '../types/entities';
import { EntityCard } from './EntityCard';

interface EntityListProps {
  entities: GameEntity[];
}

export const EntityList: React.FC<EntityListProps> = ({ entities }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {entities.map((entity) => (
        <EntityCard key={entity.id} entity={entity} />
      ))}
    </div>
  );
};
