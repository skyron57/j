import { useState, useEffect } from 'react';
import { GameEntity } from '../types/prisoner';
import entityManager from '../services/entities/EntityManager';

interface EntitySyncState {
  entities: GameEntity[];
  loading: boolean;
  error: string | null;
}

export const useEntitySync = (location: string, playerLevel: number) => {
  const [state, setState] = useState<EntitySyncState>({
    entities: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    const loadEntities = async () => {
      try {
        const entities = await entityManager.getEntitiesInLocation(location, playerLevel);
        setState({
          entities,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error syncing entities:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Error syncing with database'
        }));
      }
    };

    loadEntities();
  }, [location, playerLevel]);

  return state;
};
