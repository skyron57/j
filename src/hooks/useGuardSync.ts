import { useState, useEffect } from 'react';
import { ref, onValue, get } from 'firebase/database';
import { db } from '../firebase';
import { Guard } from '../types/guard';
import { GuardManager } from '../services/guard/GuardManager';

interface GuardSyncState {
  guards: Guard[];
  loading: boolean;
  error: string | null;
}

export const useGuardSync = (area: string) => {
  const [state, setState] = useState<GuardSyncState>({
    guards: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    const guardsRef = ref(db, 'guards');
    let unsubscribe: (() => void) | null = null;

    const initializeGuardSync = async () => {
      try {
        // First, get initial data
        const snapshot = await get(guardsRef);
        if (!snapshot.exists()) {
          // If no guards exist, initialize them
          await GuardManager.getInstance().initializeGuards();
        }

        // Set up real-time listener
        unsubscribe = onValue(guardsRef, (snapshot) => {
          if (snapshot.exists()) {
            const guardsData = snapshot.val();
            const activeGuards = Object.values(guardsData)
              .filter((guard: Guard) => 
                guard.active && 
                !guard.inComa && 
                guard.position?.area === area
              );
            
            setState({
              guards: activeGuards,
              loading: false,
              error: null
            });
          } else {
            setState({
              guards: [],
              loading: false,
              error: null
            });
          }
        }, (error) => {
          console.error('Error syncing guards:', error);
          setState(prev => ({
            ...prev,
            loading: false,
            error: 'Error syncing with database'
          }));
        });

      } catch (error) {
        console.error('Error initializing guard sync:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Error initializing guards'
        }));
      }
    };

    initializeGuardSync();

    // Cleanup
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [area]);

  return state;
};
