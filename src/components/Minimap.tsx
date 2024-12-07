import React, { useState } from 'react';
import { useGameState } from '../contexts/GameStateContext';
import { motion, AnimatePresence } from 'framer-motion';

interface Location {
  id: string;
  emoji: string;
  x: number;
  y: number;
  connections: string[];
  name: string; // Nom pour les infobulles
  color: string; // Couleur pour le thème
}

const PRISON_MAP: Location[] = [
  {
    id: 'cell',
    emoji: '🔒',
    x: 50,
    y: 50,
    connections: ['yard', 'showers', 'gym', 'kitchen'],
    name: 'Prison Cell',
    color: '#FF6B6B',
  },
  {
    id: 'yard',
    emoji: '🏃',
    x: 50,
    y: 15,
    connections: ['cell', 'guard', 'director'],
    name: 'Exercise Yard',
    color: '#4ECDC4',
  },
  {
    id: 'gym',
    emoji: '💪',
    x: 85,
    y: 50,
    connections: ['cell', 'infirmary', 'guard'],
    name: 'Gymnasium',
    color: '#45B7D1',
  },
  {
    id: 'infirmary',
    emoji: '🏥',
    x: 85,
    y: 85,
    connections: ['gym', 'kitchen'],
    name: 'Medical Wing',
    color: '#96CEB4',
  },
  {
    id: 'showers',
    emoji: '🚿',
    x: 15,
    y: 50,
    connections: ['cell', 'director', 'workshop'],
    name: 'Shower Block',
    color: '#4A90E2',
  },
  {
    id: 'kitchen',
    emoji: '🍽️',
    x: 50,
    y: 85,
    connections: ['cell', 'workshop', 'infirmary'],
    name: 'Kitchen',
    color: '#F7D794',
  },
  {
    id: 'workshop',
    emoji: '🛠️',
    x: 15,
    y: 85,
    connections: ['kitchen', 'showers'],
    name: 'Workshop',
    color: '#786FA6',
  },
  {
    id: 'guard',
    emoji: '👮',
    x: 85,
    y: 15,
    connections: ['yard', 'director', 'gym'],
    name: 'Guard Post',
    color: '#E056FD',
  },
  {
    id: 'director',
    emoji: '🧑‍💼',
    x: 15,
    y: 15,
    connections: ['yard', 'guard', 'showers'],
    name: 'Director\'s Office',
    color: '#F8C291',
  },
];

export const Minimap: React.FC = () => {
  const { state, dispatch } = useGameState();
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string[]>([]);

  const canMoveTo = (locationId: string): boolean => {
    const currentLocation = PRISON_MAP.find(l => l.id === state.location);
    return currentLocation?.connections.includes(locationId) ?? false;
  };

  const handleLocationClick = async (locationId: string) => {
    if (!canMoveTo(locationId)) return;
    setSelectedPath([state.location, locationId]);

    dispatch({ type: 'UPDATE_MOVEMENT_POINTS', payload: -1 });
    await new Promise(resolve => setTimeout(resolve, 600));
    dispatch({ type: 'CHANGE_LOCATION', payload: locationId });
    setSelectedPath([]);
  };

  return (
    <div className="relative w-full aspect-square bg-gray-800 rounded-lg p-4 overflow-hidden border-2 border-yellow-500 shadow-2xl">
      {/* Current Location Highlight */}
      {PRISON_MAP.map(location => (
        <div
          key={`highlight-${location.id}`}
          className={`absolute rounded-full transition-all duration-300 ${
            location.id === state.location
              ? 'bg-yellow-500/30 animate-pulse'
              : 'bg-transparent'
          }`}
          style={{
            left: `${location.x - 10}%`,
            top: `${location.y - 10}%`,
            width: '20%',
            height: '20%',
            transform: 'translate(-50%, -50%)',
            zIndex: location.id === state.location ? 1 : 0
          }}
        />
      ))}

      {/* Grid Background */}
      <div className="absolute inset-0 rounded-md bg-grid-gray-900/30" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), 
                          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
        backgroundSize: '20px 20px'
      }} />

      {/* Connection Lines */}
      <svg className="absolute inset-0 w-full h-full">
        {/* Route Highlights */}
        {PRISON_MAP.map(location =>
          location.connections.map(connectionId => {
            const connection = PRISON_MAP.find(l => l.id === connectionId);
            if (!connection) return null;
            
            const isMainRoute = (
              (location.id === 'yard' && (connectionId === 'guard' || connectionId === 'director')) ||
              (location.id === 'cell' && connectionId === 'yard')
            );
            
            return (
              <motion.line
                key={`route-${location.id}-${connectionId}`}
                x1={`${location.x}%`}
                y1={`${location.y}%`}
                x2={`${connection.x}%`}
                y2={`${connection.y}%`}
                stroke={isMainRoute ? "#FFFFFF" : "#FFD70066"}
                strokeWidth={isMainRoute ? "4" : "2"}
                strokeDasharray={isMainRoute ? "none" : "5,5"}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ 
                  pathLength: 1,
                  opacity: isMainRoute ? 0.8 : 0.4
                }}
                transition={{ duration: 1 }}
              />
            );
          })
        )}
        {/* Cell connections highlight */}
        {state.location === 'cell' && PRISON_MAP.find(l => l.id === 'cell')?.connections.map(connectionId => {
          const connection = PRISON_MAP.find(l => l.id === connectionId);
          return connection && (
            <motion.line
              key={`cell-${connectionId}`}
              x1="50%" y1="50%"
              x2={`${connection.x}%`} y2={`${connection.y}%`}
              stroke="#FFD700"
              strokeWidth="3"
              strokeDasharray="5,5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1 }}
            />
          );
        })}
        {PRISON_MAP.map(location =>
          location.connections.map(connectionId => {
            const connection = PRISON_MAP.find(l => l.id === connectionId);
            return connection ? (
              <motion.line
                key={`${location.id}-${connectionId}`}
                x1={`${location.x}%`} y1={`${location.y}%`}
                x2={`${connection.x}%`} y2={`${connection.y}%`}
                stroke={state.location === location.id ? "#FFD700" : "#FFD70066"}
                strokeWidth={state.location === location.id ? "3" : "1.5"}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8 }}
              />
            ) : null;
          })
        )}
      </svg>

      {/* Location Nodes */}
      <AnimatePresence>
        {PRISON_MAP.map(location => (
          <motion.button
            key={location.id}
            onClick={() => handleLocationClick(location.id)}
            onMouseEnter={() => setHoveredLocation(location.id)}
            onMouseLeave={() => setHoveredLocation(null)}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-300 ${
              location.id === state.location 
                ? 'ring-4 ring-blue-500 ring-opacity-50 scale-110 shadow-lg shadow-blue-500/50'
                : ''
            }`}
            style={{
              left: `${location.x}%`,
              top: `${location.y}%`,
              backgroundColor: location.id === state.location ? '#3B82F6' : location.color,
              width: '3.5rem',
              height: '3.5rem'
            }}
          >
            <span className={`text-2xl ${
              location.id === state.location ? 'animate-bounce' : ''
            }`}>{location.emoji}</span>
            {hoveredLocation === location.id && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`absolute -bottom-8 text-white text-xs px-2 py-1 rounded-lg ${
                  location.id === state.location 
                    ? 'bg-blue-500'
                    : 'bg-black/80'
                }`}
              >
                {location.name}
              </motion.div>
            )}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
};
