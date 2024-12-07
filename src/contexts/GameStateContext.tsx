import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useAuth } from './AuthContext';
import { ErrorFallback } from '../components/ErrorFallback';
import { GameState } from '../types/game';
import { db } from '../firebase'; // Import de la base de données Firebase
import { ref, onValue, update } from 'firebase/database'; // Fonctionnalités Firebase Realtime Database

const initialState: GameState = {
  id: '',
  username: '',
  role: 'user',
  avatar: null,
  health: 100,
  actionPoints: 20,
  movementPoints: 10,
  money: 500,
  location: 'cell',
  inventory: [],
  quickInventory: [],
  stats: {
    level: 0,
    strength: 5,
    defense: 5,
    agility: 5,
    dodge: 5,
    damageDealt: 0,
    damageTaken: 0,
    missedAttacks: 0,
    dodgedAttacks: 0,
  },
  trainingProgress: null,
  taskProgress: {},
  activeAnabolic: {
    endTime: null,
    bonusAP: 0,
  },
  inComa: false,
  comaStartTime: null,
  comaEndTime: null,
  hasRevive: false,
  history: [],
  morale: 100,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'INIT_USER_DATA':
      return { ...state, ...action.payload };

    case 'UPDATE_HEALTH':
      return { ...state, health: Math.max(0, Math.min(100, state.health + action.payload)) };

    case 'UPDATE_ACTION_POINTS': {
      const maxAP = state.activeAnabolic.endTime ? 30 : 20;
      return { 
        ...state, 
        actionPoints: Math.max(0, Math.min(state.actionPoints + action.payload, maxAP)) 
      };
    }

    case 'UPDATE_MOVEMENT_POINTS':
      return { 
        ...state, 
        movementPoints: Math.max(0, Math.min(state.movementPoints + action.payload, 10)) 
      };

    case 'UPDATE_MONEY':
      return { ...state, money: state.money + action.payload };

    case 'CHANGE_LOCATION':
      return {
        ...state,
        location: action.payload,
        movementPoints: state.movementPoints - 1,
      };

    case 'UPDATE_AVATAR':
      return { ...state, avatar: action.payload };

    case 'UPDATE_STATS':
      return {
        ...state,
        stats: { ...state.stats, ...action.payload },
      };

    case 'UPDATE_COMBAT_STATS': {
      const equippedWeapon = state.inventory.find(
        item => (item.type === 'weapon' || item.type === 'crafted') && item.equipped
      );
      
      // Calculate base stats first
      const baseStats = {
        strength: state.stats.strength,
        defense: state.stats.defense,
        agility: state.stats.agility,
        dodge: state.stats.dodge
      };
      
      // Add weapon bonuses if equipped
      if (equippedWeapon && equippedWeapon.stats) {
        baseStats.strength += equippedWeapon.stats.attack || 0;
        baseStats.defense += equippedWeapon.stats.defense || 0;
        baseStats.agility += equippedWeapon.stats.agility || 0;
        baseStats.dodge += equippedWeapon.stats.dodge || 0;
      }
      
      return {
        ...state,
        stats: baseStats
      };
    }

    case 'UPDATE_INVENTORY':
      return {
        ...state,
        inventory: action.payload
      };

    case 'UPDATE_INVENTORY_AND_STATS':
      return {
        ...state,
        inventory: action.payload.inventory,
        stats: {
          ...state.stats,
          ...action.payload.stats
        },
        lastUpdate: new Date().toISOString()
      };

    case 'USE_ITEM': {
      const { itemId, effect } = action.payload;
      const updatedInventory = state.inventory
        .map(item => item.id === itemId
          ? { ...item, quantity: item.quantity > 1 ? item.quantity - 1 : 0 }
          : item
        )
        .filter(item => item.quantity > 0);

      let updatedState = { ...state, inventory: updatedInventory };

      switch (effect.type) {
        case 'health':
          updatedState.health = Math.min(100, state.health + effect.value);
          break;
        case 'actionPoints':
          updatedState.actionPoints = Math.min(
            state.activeAnabolic.endTime ? 30 : 20,
            state.actionPoints + effect.value
          );
          break;
        case 'anabolic':
          updatedState.activeAnabolic = {
            endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            bonusAP: 20,
          };
          break;
        case 'revive':
          updatedState.hasRevive = true;
          break;
      }
      return updatedState;
    }

    case 'ADD_ACTION':
      return {
        ...state,
        history: [action.payload, ...state.history].slice(0, 50),
      };

    default:
      return state;
  }
}

const GameStateContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
} | null>(null);

export const useGameState = () => {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
};

export function GameStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const { currentUser } = useAuth();

  useEffect(() => {
    async function loadUserState() {
      if (!currentUser?.uid) return;

      try {
        const userRef = ref(db, 'users/' + currentUser.uid);
        onValue(userRef, (snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.val();
            dispatch({ type: 'INIT_USER_DATA', payload: userData });
          }
        });
      } catch (error) {
        console.error('Error loading user state:', error);
      }
    }

    loadUserState();
  }, [currentUser?.uid]);

  useEffect(() => {
    if (!currentUser?.uid || !state.id) return;

    const saveTimeout = setTimeout(() => {
      const userRef = ref(db, 'users/' + currentUser.uid);
      update(userRef, state).catch(error => {
        console.error('Error saving state:', error);
      });
    }, 1000);

    return () => clearTimeout(saveTimeout);
  }, [state, currentUser]);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <GameStateContext.Provider value={{ state, dispatch }}>
        {children}
      </GameStateContext.Provider>
    </ErrorBoundary>
  );
}
