import { db } from '../firebase';
import { ref, get, update, set } from 'firebase/database';
import { Exercise, TrainingProgress } from '../types/training';

const INITIAL_CLICKS_REQUIRED = 150;
const MAX_XP_PER_CATEGORY = 5;

export class TrainingError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'TrainingError';
  }
}

export const TrainingService = {
  async initializeProgress(userId: string): Promise<void> {
    if (!userId) {
      throw new TrainingError('User ID is required');
    }

    try {
      const userRef = ref(db, 'users/' + userId);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        throw new TrainingError('User not found');
      }

      const initialProgress: TrainingProgress = {
        attack: {
          clicks: 0,
          xp: 0,
          clicksRequired: INITIAL_CLICKS_REQUIRED,
          limitReached: false,
          lastUpdated: new Date().toISOString()
        },
        defense: {
          clicks: 0,
          xp: 0,
          clicksRequired: INITIAL_CLICKS_REQUIRED,
          limitReached: false,
          lastUpdated: new Date().toISOString()
        },
        dodge: {
          clicks: 0,
          xp: 0,
          clicksRequired: INITIAL_CLICKS_REQUIRED,
          limitReached: false,
          lastUpdated: new Date().toISOString()
        },
        skill: {
          clicks: 0,
          xp: 0,
          clicksRequired: INITIAL_CLICKS_REQUIRED,
          limitReached: false,
          lastUpdated: new Date().toISOString()
        }
      };

      // Update user progress in the Realtime Database
      await update(userRef, {
        trainingProgress: initialProgress
      });

    } catch (error: any) {
      console.error('Error initializing training progress:', error);
      throw new TrainingError(
        'Failed to initialize training progress',
        error.code
      );
    }
  },

  async performExercise(
    userId: string,
    exercise: Exercise
  ): Promise<{
    xpGained: number;
    newLevel?: number;
    limitReached?: boolean;
    statsUpdated?: {
      [key in 'strength' | 'defense' | 'agility' | 'dodge']?: number;
    };
  }> {
    if (!userId) {
      throw new TrainingError('User ID is required');
    }

    try {
      const userRef = ref(db, `users/${userId}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        throw new TrainingError('User not found');
      }

      const userData = snapshot.val();
      let progress = userData.trainingProgress || {};
      let category = progress[exercise.category] || {
        clicks: 0,
        xp: 0,
        clicksRequired: INITIAL_CLICKS_REQUIRED,
        limitReached: false,
        lastUpdated: new Date().toISOString()
      };

      if (category.limitReached) {
        return { xpGained: 0, limitReached: true };
      }

      category.clicks++;
      category.lastUpdated = new Date().toISOString();

      let xpGained = 0;
      let statsUpdated = {};

      if (category.clicks >= category.clicksRequired) {
        xpGained = Math.floor(
          Math.random() * (exercise.maxXp - exercise.minXp + 1) + exercise.minXp
        );

        category.xp += xpGained;
        category.clicks = 0;
        category.clicksRequired *= 2;

        const stats = userData.stats || {};
        switch (exercise.category) {
          case 'attack':
            stats.strength = (stats.strength || 5) + 1;
            statsUpdated = { strength: stats.strength };
            break;
          case 'defense':
            stats.defense = (stats.defense || 5) + 1;
            statsUpdated = { defense: stats.defense };
            break;
          case 'dodge':
            stats.dodge = (stats.dodge || 5) + 1;
            statsUpdated = { dodge: stats.dodge };
            break;
          case 'skill':
            stats.agility = (stats.agility || 5) + 1;
            statsUpdated = { agility: stats.agility };
            break;
        }

        if (category.xp >= MAX_XP_PER_CATEGORY) {
          category.limitReached = true;
          category.xp = MAX_XP_PER_CATEGORY;
        }

        const history = userData.history || [];
        const statName = Object.keys(statsUpdated)[0];
        history.unshift({
          type: 'training',
          description: `💪 Entraînement ${exercise.name} : +${xpGained} XP${
            statName ? ` | ${statName.toUpperCase()} +1` : ''
          }`,
          timestamp: new Date().toISOString()
        });

        // Update all relevant data atomically
        const updates = {
          stats,
          trainingProgress: {
            ...progress,
            [exercise.category]: category
          },
          history: history.slice(0, 50) // Limit history size to 50 entries
        };

        await update(userRef, updates);
      } else {
        // Only update training progress
        await update(userRef, {
          trainingProgress: {
            ...progress,
            [exercise.category]: category
          }
        });
      }

      return {
        xpGained,
        newLevel: category.xp,
        limitReached: category.limitReached,
        statsUpdated
      };
    } catch (error: any) {
      console.error('Error performing exercise:', error);
      throw new TrainingError(
        'Failed to perform exercise',
        error.code
      );
    }
  },

  async getProgress(userId: string): Promise<TrainingProgress | null> {
    if (!userId) {
      throw new TrainingError('User ID is required');
    }

    try {
      const userRef = ref(db, 'users/' + userId);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        throw new TrainingError('User not found');
      }

      const userData = snapshot.val();
      return userData.trainingProgress || null;
    } catch (error: any) {
      console.error('Error getting training progress:', error);
      throw new TrainingError(
        'Failed to get training progress',
        error.code
      );
    }
  }
};
