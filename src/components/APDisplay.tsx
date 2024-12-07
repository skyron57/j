import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Activity, Timer } from 'lucide-react';
import { useGameState } from '../contexts/GameStateContext';

export const APDisplay: React.FC = () => {
  const { state, dispatch } = useGameState();
  const [countdown, setCountdown] = useState(60);
  const maxAP = state.activeAnabolic.endTime ? 30 : 20; // Max PA dépendant de l'état Anabolic
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef(Date.now());

  const updateActionPoints = useCallback(() => {
    // Si les PA ne sont pas au max et le joueur n'est pas en cellule
    if (state.actionPoints < maxAP && state.location !== 'cell') {
      dispatch({
        type: 'UPDATE_ACTION_POINTS',
        payload: 1, // Recharge de 1 PA par minute
      });
    }
  }, [state.actionPoints, maxAP, state.location, dispatch]);

  useEffect(() => {
    if (state.actionPoints < maxAP && state.location !== 'cell') {
      const startTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
          const now = Date.now();
          const elapsed = now - lastUpdateRef.current;

          if (elapsed >= 60000) {
            // 1 minute écoulée : on recharge 1 PA
            updateActionPoints();
            lastUpdateRef.current = now; // Met à jour la référence
            setCountdown(60); // Réinitialise le compteur
          } else {
            // Met à jour le compteur restant
            setCountdown(Math.max(1, Math.ceil((60000 - elapsed) / 1000)));
          }
        }, 1000); // Mise à jour chaque seconde
      };

      startTimer();

      // Nettoyage de l'intervalle lorsque le composant se démonte
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [state.actionPoints, maxAP, state.location, updateActionPoints]);

  // Ajout de l'effet pour réinitialiser les PA à 20 lorsque l'effet Anabolic se termine
  useEffect(() => {
    if (state.activeAnabolic.endTime) {
      const anabolicTimeout = setTimeout(() => {
        if (Date.now() >= new Date(state.activeAnabolic.endTime).getTime()) {
          dispatch({
            type: 'RESET_ACTION_POINTS',
            payload: 20,
          });
        }
      }, new Date(state.activeAnabolic.endTime).getTime() - Date.now());

      // Nettoyage du timeout lorsque le composant se démonte
      return () => clearTimeout(anabolicTimeout);
    }
  }, [state.activeAnabolic.endTime, dispatch]);

  // Calcul du temps restant pour l'effet "Anabolic"
  const anabolicTimeRemaining = state.activeAnabolic.endTime
    ? Math.max(0, new Date(state.activeAnabolic.endTime).getTime() - Date.now())
    : 0;

  const minutes = Math.floor(anabolicTimeRemaining / 60000);
  const seconds = Math.floor((anabolicTimeRemaining % 60000) / 1000);

  return (
    <div className="flex items-center gap-4">
      {/* Affichage des PA */}
      <div className="flex items-center gap-2">
        <Activity
          className={state.activeAnabolic.endTime ? 'text-yellow-400' : 'text-blue-400'}
          size={20}
        />
        <span
          className={`font-bold ${
            state.activeAnabolic.endTime ? 'text-yellow-400' : 'text-blue-400'
          }`}
        >
          {state.actionPoints}/{maxAP} PA
        </span>
      </div>

      {/* Timer pour la prochaine recharge de PA */}
      {state.actionPoints < maxAP && (
        <div className="flex items-center gap-2 text-sm">
          <Timer size={16} className="text-gray-400" />
          <span className="text-gray-400">
            {countdown}s avant +1 PA
          </span>
        </div>
      )}

      {/* Temps restant pour l'effet Anabolic */}
      {state.activeAnabolic.endTime && (
        <div className="text-xs text-yellow-400">
          Anabo: {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
      )}
    </div>
  );
};
