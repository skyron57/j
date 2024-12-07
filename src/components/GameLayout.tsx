import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Building2, Skull, Trophy, Package, ShoppingCart, MessageSquare, Coins } from 'lucide-react';
import { PlayerPanel } from './PlayerPanel';
import { ActionHistory } from './ActionHistory';
import { APDisplay } from './APDisplay';
import { MovementDisplay } from './MovementDisplay';
import { useAuth } from '../contexts/AuthContext';
import { useGameState } from '../contexts/GameStateContext';
import { ComaOverlay } from './ComaOverlay';
import { SecurityService } from '../services/security';

export const GameLayout: React.FC = () => {
  const { logout } = useAuth();
  const { state } = useGameState();
  const navigate = useNavigate();
  const securityService = SecurityService.getInstance();
  const userIP = securityService.getUserIP();

  const navLinkClass = ({ isActive }: { isActive: boolean }) => `
    flex items-center gap-2 px-4 py-3 text-sm prison-font tracking-wider transition-colors
    ${isActive ? 'bg-red-900/30 text-red-400' : 'hover:bg-gray-700/50 text-gray-400'}
  `;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    }
  };

  const handleAdminPanel = () => {
    navigate('/admin');
  };

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Superposition pour améliorer la lisibilité */}
      <div className="absolute inset-0 bg-black/50"></div>

      <ComaOverlay />

      <nav className="fixed top-0 left-0 right-0 bg-gray-800/70 border-b border-gray-700 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex">
            <NavLink to="/game" className={navLinkClass}>
              <Building2 size={20} />
              PRISON
            </NavLink>
            <NavLink to="/game/murders" className={navLinkClass}>
              <Skull size={20} />
              MEURTRES
            </NavLink>
            <NavLink to="/game/rankings" className={navLinkClass}>
              <Trophy size={20} />
              CLASSEMENT
            </NavLink>
            <NavLink to="/game/inventory" className={navLinkClass}>
              <Package size={20} />
              INVENTAIRE
            </NavLink>
            <NavLink to="/game/shop" className={navLinkClass}>
              <ShoppingCart size={20} />
              BOUTIQUE
            </NavLink>
            <NavLink to="/game/messages" className={navLinkClass}>
              <MessageSquare size={20} />
              MESSAGES
            </NavLink>
          </div>
          <div className="flex items-center gap-6 px-6 py-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 rounded-full">
                <Coins className="text-yellow-500" size={16} />
                <span className="text-yellow-500 font-bold">{state.money}€</span>
              </div>
              <APDisplay />
              <MovementDisplay />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAdminPanel}
                className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 rounded-lg text-yellow-400 hover:bg-yellow-500/20 transition-colors"
                title="Administration"
              >
                ⚙️
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-1 bg-red-500/10 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                title="Déconnexion"
              >
                🚪
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative pt-14 flex min-h-screen">
        <div className="flex-1 p-4">
          <Outlet />
        </div>
        <div className="w-96 flex flex-col border-l border-gray-800 bg-gray-900/80">
          <div className="p-4">
            <PlayerPanel />
          </div>
          <div className="p-4 border-t border-gray-800">
            <ActionHistory />
          </div>
        </div>
      </div>
    </div>
  );
};
