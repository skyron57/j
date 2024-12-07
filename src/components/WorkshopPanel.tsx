import React, { useState, useEffect } from 'react';
import { Wrench, AlertCircle } from 'lucide-react';
import { useGameState } from '../contexts/GameStateContext';
import { WORKSHOP_TASKS } from '../types/workshop';
import { WorkshopService } from '../services/workshop';

export const WorkshopPanel: React.FC = () => {
  const { state, dispatch } = useGameState();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [unlockedTasks, setUnlockedTasks] = useState<string[]>([]);
  const [taskProgress, setTaskProgress] = useState<Record<string, any>>({});

  useEffect(() => {
    loadUnlockedTasks();
    loadTaskProgress();
  }, [state.id]);

  const loadUnlockedTasks = async () => {
    try {
      const unlocked = await Promise.all(
        WORKSHOP_TASKS.map(task => 
          WorkshopService.isTaskUnlocked(state.id, task.id)
        )
      );
      setUnlockedTasks(
        WORKSHOP_TASKS
          .filter((_, index) => unlocked[index])
          .map(task => task.id)
      );
    } catch (err) {
      console.error('Error loading unlocked tasks:', err);
    }
  };

  const loadTaskProgress = async () => {
    try {
      const progress = await WorkshopService.getTaskProgress(state.id);
      setTaskProgress(progress);
    } catch (err) {
      console.error('Error loading task progress:', err);
    }
  };

  const handleTaskClick = async (taskId: string) => {
    if (state.actionPoints < 3) {
      setError('Il vous faut 3 PA pour travailler');
      return;
    }

    const task = WORKSHOP_TASKS.find(t => t.id === taskId);
    if (!task) {
      setError('Tâche invalide');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await WorkshopService.performTask(state.id, taskId);
      
      // Mettre à jour l'historique des actions
      dispatch({
        type: 'ADD_ACTION',
        payload: {
          type: 'work',
          description: `${task.icon} Travail "${task.name}" : +${result.reward}€`,
          timestamp: new Date().toISOString()
        }
      });

      // Recharger le progrès après l'action
      await loadTaskProgress();
      await loadUnlockedTasks();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4">
        {WORKSHOP_TASKS.map((task) => {
          const isUnlocked = unlockedTasks.includes(task.id);
          const progress = taskProgress[task.id] || { clicks: 0, completed: false, percentage: 0 };
          const nextTask = WORKSHOP_TASKS[WORKSHOP_TASKS.findIndex(t => t.id === task.id) + 1];

          return (
            <div
              key={task.id}
              className={`p-4 rounded-lg border transition-all ${
                isUnlocked
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-gray-900/50 border-gray-800 opacity-50'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{task.icon}</span>
                <div className="flex-1">
                  <h3 className="font-bold">{task.name}</h3>
                  <p className="text-sm text-gray-400">{task.description}</p>
                </div>
                <div className="text-sm text-green-400">
                  +{task.minReward} à {task.maxReward}€
                </div>
              </div>

              {isUnlocked ? (
                <>
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Progression</span>
                      <span className="text-blue-400">
                        {Math.round(progress.percentage)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{
                          width: `${progress.percentage}%`
                        }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleTaskClick(task.id)}
                    disabled={loading || state.actionPoints < 3}
                    className={`w-full py-2 rounded transition-colors ${
                      state.actionPoints >= 3
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Travailler (3 PA)
                  </button>
                </>
              ) : (
                <div className="text-sm text-red-400 mt-2">
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
