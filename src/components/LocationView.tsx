import React from 'react';
import { Loader, AlertCircle } from 'lucide-react';
import { useGameState } from '../contexts/GameStateContext';
import { LOCATIONS } from '../data/locations';
import { useEntitySync } from '../hooks/useEntitySync';
import { useGuardSync } from '../hooks/useGuardSync';
import { EntityDisplay } from './EntityDisplay';
import { TrainingPanel } from './TrainingPanel';
import { WorkshopPanel } from './WorkshopPanel';
import { NursePanel } from './NursePanel';
import { CraftingPanel } from './CraftingPanel';
import { ErrorBoundary } from './ErrorBoundary';
import { GUARD_BEHAVIORS } from '../types/guardBehavior';

export const LocationView: React.FC<{ location: string }> = ({ location }) => {
  const { state, dispatch } = useGameState();
  const { entities, loading, error } = useEntitySync(location, state.stats.level);
  const { guards } = useGuardSync(location);

  const locationInfo = LOCATIONS[location];
  if (!locationInfo) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto mb-2" size={24} />
        Location introuvable
      </div>
    );
  }

  function renderLocationContent() {
    switch (location) {
      case 'kitchen':
        return <CraftingPanel />;
      case 'workshop':
        return <WorkshopPanel />;
      case 'gym':
        return <TrainingPanel />;
      case 'infirmary':
        return <NursePanel />;
      default:
        return null;
    }
  }

  // Combine and deduplicate entities and guards
  const allEntities = React.useMemo(() => {
    const combinedEntities = [...entities, ...guards];
    const uniqueEntities = new Map();
    
    combinedEntities.forEach(entity => {
      // Use a combination of id and timestamp to ensure uniqueness
      const uniqueKey = `${entity.id}-${entity.position?.lastMove || Date.now()}`;
      uniqueEntities.set(uniqueKey, entity);
    });
    
    return Array.from(uniqueEntities.values());
  }, [entities, guards]);

  return (
    <ErrorBoundary
      fallback={
        <div className="text-center text-red-400 py-12">
          Une erreur est survenue lors du chargement de la zone
        </div>
      }
    >
      <div className="space-y-6">
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div 
            className="h-48 bg-cover bg-center"
            style={{ backgroundImage: `url(${locationInfo.image})` }}
          />
          
          <div className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{locationInfo.emoji}</span>
              <h2 className="text-2xl prison-font">{locationInfo.title}</h2>
            </div>

            <p className="text-gray-400 mb-6">{locationInfo.description}</p>

            {error && (
              <div className="mb-4 bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded flex items-center gap-2">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            {renderLocationContent()}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="animate-spin text-blue-500" size={32} />
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        ) : (
          <>
            {allEntities.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg prison-font mb-4">Présents dans la zone</h3>
                <div className="space-y-4">
                  {allEntities.map(entity => (
                    <EntityDisplay
                      key={`${entity.id}-${entity.position?.lastMove || Date.now()}`}
                      entity={entity}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ErrorBoundary>
  );
};
