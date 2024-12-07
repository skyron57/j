import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGameState } from '../contexts/GameStateContext';
import { SecurityService } from '../services/security';

interface PrivateRouteProps extends React.PropsWithChildren {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, adminOnly = false }) => {
  const { currentUser, userData } = useAuth();
  const { state } = useGameState();
  const securityService = SecurityService.getInstance();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!userData || !state.id) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-xl prison-font text-gray-400">Initialisation du jeu...</div>
      </div>
    );
  }

  if (adminOnly && !securityService.isPrivilegedIP(securityService.getUserIP())) {
    return <Navigate to="/game" replace />;
  }

  return <>{children}</>;
}
