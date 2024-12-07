import React, { useState, useEffect } from 'react';
import { Dumbbell, Shield, Move, Target, AlertCircle } from 'lucide-react';
import { useGameState } from '../contexts/GameStateContext';
import { TrainingService, TrainingError } from '../services/training';
import { TRAINING_EXERCISES, TrainingCategory, Exercise } from '../types/training';

export const TrainingPanel: React.FC = () => {
  const { state, dispatch } = useGameState();
  const [selectedCategory, setSelectedCategory] = useState<TrainingCategory>('attack');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      setError(null);
      const currentProgress = await TrainingService.getProgress(state.id);
      if (currentProgress) {
        dispatch({
          type: 'UPDATE_TRAINING_PROGRESS',
          payload: currentProgress
        });
      }
    } catch (err) {
      if (err instanceof TrainingError) {
        setError(err.message);
      } else {
        setError('Une erreur est survenue lors du chargement de la progression');
      }
    }
  };

  const handleExercise = async (exercise: Exercise) => {
    if (state.actionPoints < exercise.actionPoints) {
      setError(`Points d'action insuffisants (${exercise.actionPoints} PA requis)`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await TrainingService.performExercise(state.id, exercise);
      
      // Update action points
      dispatch({
        type: 'UPDATE_ACTION_POINTS',
        payload: -exercise.actionPoints
      });

      // Add to action history
      dispatch({
        type: 'ADD_ACTION',
        payload: {
          type: 'training',
          description: `${exercise.emoji} Vous vous entraînez : ${exercise.name}${
            result.xpGained ? ` (+${result.xpGained} XP)` : ''
          }`,
          timestamp: new Date()
        }
      });

      // Update stats if they changed
      if (result.statsUpdated) {
        dispatch({
          type: 'UPDATE_STATS',
          payload: result.statsUpdated
        });

        const statName = Object.keys(result.statsUpdated)[0];
        const newValue = result.statsUpdated[statName];
        
        dispatch({
          type: 'ADD_ACTION',
          payload: {
            type: 'stat_increase',
            description: `Votre ${statName} augmente à ${newValue}!`,
            timestamp: new Date()
          }
        });
      }

      if (result.limitReached) {
        dispatch({
          type: 'ADD_ACTION',
          payload: {
            type: 'warning',
            description: `Limite d'XP atteinte pour ${exercise.category}`,
            timestamp: new Date()
          }
        });
      }

      await loadProgress();
    } catch (err) {
      if (err instanceof TrainingError) {
        setError(err.message);
      } else {
        setError('Une erreur est survenue lors de l\'entraînement');
      }
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'attack', icon: <Dumbbell />, label: 'Force' },
    { id: 'defense', icon: <Shield />, label: 'Défense' },
    { id: 'dodge', icon: <Move />, label: 'Esquive' },
    { id: 'skill', icon: <Target />, label: 'Technique' }
  ];

  const exercises = TRAINING_EXERCISES.filter(ex => ex.category === selectedCategory);

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Category Selection */}
      <div className="flex gap-2">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id as TrainingCategory)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
              selectedCategory === category.id
                ? 'bg-blue-900/30 text-blue-400 border border-blue-700'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {category.icon}
            <span className="prison-font">{category.label}</span>
          </button>
        ))}
      </div>

      {/* Progress Display */}
      {state.trainingProgress && state.trainingProgress[selectedCategory] && (
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Progression</span>
            <span className="text-sm font-bold text-blue-400">
              {state.trainingProgress[selectedCategory].xp}/{5} XP
            </span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{
                width: `${(state.trainingProgress[selectedCategory].clicks / state.trainingProgress[selectedCategory].clicksRequired) * 100}%`
              }}
            />
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {state.trainingProgress[selectedCategory].clicks}/{state.trainingProgress[selectedCategory].clicksRequired} clics
          </div>
        </div>
      )}

      {/* Exercise List */}
      <div className="grid grid-cols-1 gap-4">
        {exercises.map(exercise => {
          const categoryProgress = state.trainingProgress?.[exercise.category];
          const isLocked = categoryProgress?.limitReached;

          return (
            <button
              key={exercise.id}
              onClick={() => handleExercise(exercise)}
              disabled={loading || isLocked || state.actionPoints < exercise.actionPoints}
              className={`p-4 rounded-lg text-left transition-all ${
                isLocked
                  ? 'bg-gray-800/50 border border-gray-700 opacity-50 cursor-not-allowed'
                  : state.actionPoints >= exercise.actionPoints
                  ? 'bg-gray-800 border border-gray-700 hover:bg-gray-700'
                  : 'bg-gray-800/50 border border-gray-700 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{exercise.emoji}</span>
                <div className="flex-1">
                  <h3 className="font-bold">{exercise.name}</h3>
                  <p className="text-sm text-gray-400">{exercise.description}</p>
                </div>
                <div className="text-sm text-blue-400">
                  {exercise.actionPoints} PA
                </div>
              </div>

              {isLocked && (
                <div className="mt-2 text-xs text-red-400">
                  Niveau maximum atteint
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
