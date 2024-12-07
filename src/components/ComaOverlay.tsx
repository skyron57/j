import React, { useEffect, useState } from 'react';
import { useGameState } from '../contexts/GameStateContext';
import { SecurityService } from '../services/security';

export const ComaOverlay: React.FC = () => {
  const { state } = useGameState();
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [showFlash, setShowFlash] = useState(false);
  const [isPrivilegedUser, setIsPrivilegedUser] = useState(false);

  useEffect(() => {
    // Check if user is privileged
    const userIP = localStorage.getItem('userIP') || '';
    const securityService = SecurityService.getInstance();
    setIsPrivilegedUser(state.role === 'admin' || securityService.isPrivilegedIP(userIP));
  }, [state.role]);

  useEffect(() => {
    if (state.inComa && state.comaStartTime) {
      // Animation flash when entering coma
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 1000);

      // Update countdown
      const interval = setInterval(() => {
        const comaStart = new Date(state.comaStartTime!).getTime();
        const now = Date.now();
        const elapsed = now - comaStart;
        const comaDuration = state.hasRevive ? 30 * 60 * 1000 : 2 * 60 * 60 * 1000;
        const remaining = comaDuration - elapsed;

        if (remaining <= 0) {
          setTimeLeft('');
          clearInterval(interval);
        } else {
          const minutes = Math.floor(remaining / (60 * 1000));
          const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
          setTimeLeft(`${minutes}m ${seconds}s`);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [state.inComa, state.comaStartTime, state.hasRevive]);

  if (!state.inComa) return null;

  // Don't show overlay for privileged users
  if (isPrivilegedUser) return null;

  return (
    <>
      {/* Flash animation */}
      <div 
        className={`fixed inset-0 bg-white transition-opacity duration-1000 pointer-events-none z-50 ${
          showFlash ? 'opacity-50' : 'opacity-0'
        }`} 
      />

      {/* Coma overlay */}
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-40">
        <div className="text-center space-y-4">
          <h2 className="text-3xl prison-font text-red-500">COMA</h2>
          <p className="text-gray-400">Vous êtes inconscient à l'infirmerie</p>
          <div className="text-xl prison-font text-yellow-500">
            Réveil dans {timeLeft}
          </div>
          {state.hasRevive && (
            <div className="text-sm text-green-400">
              Réveil accéléré activé
            </div>
          )}
        </div>
      </div>
    </>
  );
};
