import { db } from '../firebase';
import { ref, get, update } from 'firebase/database';
import { WORKSHOP_TASKS, TaskProgress } from '../types/workshop';

export class WorkshopError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'WorkshopError';
  }
}

export const WorkshopService = {
  async performTask(userId: string, taskId: string): Promise<{
    reward: number;
    newTaskUnlocked?: string;
    experienceGained?: number;
    progress: number;
  }> {
    if (!userId) {
      throw new WorkshopError('User ID is required');
    }

    try {
      const userRef = ref(db, `users/${userId}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        throw new WorkshopError('User not found');
      }

      const userData = snapshot.val();
      const taskProgress = userData.taskProgress || {};
      const currentAP = userData.actionPoints || 0;
      
      // Get the current task
      const task = WORKSHOP_TASKS.find(t => t.id === taskId);
      if (!task) {
        throw new WorkshopError('Invalid task');
      }

      // Check if user has enough AP
      if (currentAP < 3) {
        throw new WorkshopError('Points d\'action insuffisants (3 PA requis)');
      }

      // Check if task is unlocked
      const isUnlocked = await this.isTaskUnlocked(userId, taskId);
      if (!isUnlocked) {
        throw new WorkshopError('Task not unlocked yet');
      }

      // Generate random reward
      const reward = Math.floor(
        Math.random() * (task.maxReward - task.minReward + 1) + task.minReward
      );

      // Calculate XP gained
      const experienceGained = Math.floor(task.requiredClicks / 10);

      // Update progress
      const currentProgress = taskProgress[taskId] || { clicks: 0, completed: false };
      const newClicks = currentProgress.clicks + 1;
      const progress = (newClicks / task.requiredClicks) * 100;

      // Prepare updates
      const updates: Record<string, any> = {
        money: (userData.money || 0) + reward,
        actionPoints: currentAP - 3, // Déduire 3 PA
        taskProgress: {
          ...taskProgress,
          [taskId]: {
            clicks: newClicks,
            completed: progress >= 100,
            lastUpdate: new Date().toISOString()
          }
        },
        'stats/experience': (userData.stats?.experience || 0) + experienceGained,
        lastUpdate: new Date().toISOString()
      };

      // Add to action history
      const history = userData.history || [];
      history.unshift({
        type: 'work',
        description: `${task.icon} Travail "${task.name}" : +${reward}€ (${Math.round(progress)}%)`,
        timestamp: new Date().toISOString()
      });
      updates.history = history.slice(0, 50);

      // Check if this unlocks the next task
      let newTaskUnlocked = null;
      if (progress >= 100) {
        const currentTaskIndex = WORKSHOP_TASKS.findIndex(t => t.id === taskId);
        const nextTask = WORKSHOP_TASKS[currentTaskIndex + 1];

        if (nextTask) {
          updates.taskProgress[nextTask.id] = {
            clicks: 0,
            completed: false,
            lastUpdate: new Date().toISOString()
          };
          newTaskUnlocked = nextTask.id;

          // Add unlock notification to history
          history.unshift({
            type: 'unlock',
            description: `🔓 Nouveau travail débloqué : ${nextTask.name}`,
            timestamp: new Date().toISOString()
          });
          updates.history = history;
        }
      }

      // Update all data atomically
      await update(userRef, updates);

      return {
        reward,
        newTaskUnlocked,
        experienceGained,
        progress
      };
    } catch (error: any) {
      console.error('Error performing workshop task:', error);
      throw new WorkshopError(
        error.message || 'Failed to perform workshop task',
        error.code
      );
    }
  },

  async isTaskUnlocked(userId: string, taskId: string): Promise<boolean> {
    if (!userId) return false;

    try {
      const userRef = ref(db, 'users/' + userId);
      const snapshot = await get(userRef);
      
      if (!snapshot.exists()) return false;

      const task = WORKSHOP_TASKS.find(t => t.id === taskId);
      if (!task) return false;

      // First task is always unlocked
      if (task.unlockedByDefault) return true;

      const userData = snapshot.val();
      const taskProgress = userData.taskProgress || {};

      // Find the previous task
      const taskIndex = WORKSHOP_TASKS.findIndex(t => t.id === taskId);
      if (taskIndex <= 0) return true;

      const previousTask = WORKSHOP_TASKS[taskIndex - 1];
      const previousProgress = taskProgress[previousTask.id];

      if (!previousProgress) return false;

      const progress = (previousProgress.clicks / previousTask.requiredClicks) * 100;
      return progress >= 100;
    } catch (error) {
      console.error('Error checking task unlock status:', error);
      return false;
    }
  },

  async getTaskProgress(userId: string): Promise<Record<string, TaskProgress>> {
    if (!userId) {
      throw new WorkshopError('User ID is required');
    }

    try {
      const userRef = ref(db, 'users/' + userId);
      const snapshot = await get(userRef);
      
      if (!snapshot.exists()) {
        throw new WorkshopError('User not found');
      }

      const userData = snapshot.val();
      const taskProgress = userData.taskProgress || {};

      // Calculate progress percentage for each task
      const progressWithPercentage = Object.entries(taskProgress).reduce((acc, [taskId, progress]) => {
        const task = WORKSHOP_TASKS.find(t => t.id === taskId);
        if (task) {
          const percentage = (progress.clicks / task.requiredClicks) * 100;
          acc[taskId] = {
            ...progress,
            percentage: Math.min(100, percentage)
          };
        }
        return acc;
      }, {} as Record<string, TaskProgress & { percentage: number }>);

      return progressWithPercentage;
    } catch (error: any) {
      console.error('Error getting task progress:', error);
      throw new WorkshopError(
        'Failed to get task progress',
        error.code
      );
    }
  }
};
