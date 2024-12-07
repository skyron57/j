import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import { Guard } from '../types/guard';
import { useGuards } from '../../hooks/useGuards';

interface Guard {
  id: string;
  name: string;
  stats: {
    strength: number;
    defense: number;
    agility: number;
    dodge: number;
    points: number;
    counterAttackChance: number;
  };
  health: number;
  maxHealth: number;
  position: {
    area: string;
  };
  active?: boolean;
  inComa?: boolean;
}

export const useGuards = () => {
  const [guards, setGuards] = useState<Guard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const guardsRef = ref(db, 'guards');
    
    const unsubscribe = onValue(guardsRef, (snapshot: DataSnapshot) => {
      try {
        if (snapshot.exists()) {
          const guardsData = snapshot.val();
          const guardsArray = Object.entries(guardsData).map(([id, data]: [string, any]) => ({
            id,
            ...data
          }));
          setGuards(guardsArray);
        } else {
          setGuards([]);
        }
      } catch (err) {
        console.error('Error processing guards data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error('Database error:', error);
      setError(error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { guards, loading, error };
};
