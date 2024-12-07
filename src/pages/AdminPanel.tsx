import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGameState } from '../contexts/GameStateContext';
import { SecurityService } from '../services/security';
import {
  Users,
  Settings,
  DollarSign,
  AlertCircle,
  Search,
  Package,
  Cog,
  Swords,
} from 'lucide-react';
import { db } from '../firebase';
import { ref, get } from 'firebase/database';
import { PlayerManagement } from '../components/admin/PlayerManagement';
import { EconomyDashboard } from '../components/admin/EconomyDashboard';
import { CombatManagement } from '../components/admin/CombatManagement';
import { NPCManagement } from '../components/admin/NPCManagement';
import { ConfigurationPanel } from '../components/admin/ConfigurationPanel';
import { ReportsPanel } from '../components/admin/ReportsPanel';
import { WeaponsManagement } from '../components/admin/WeaponsManagement';

type AdminTab = 'players' | 'economy' | 'combat' | 'config' | 'weapons' | 'npcs' | 'reports';

interface TabConfig {
  id: AdminTab;
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  totalTransactions: number;
  totalCombats: number;
  totalReports: number;
}

export const AdminPanel: React.FC = () => {
  const { currentUser } = useAuth();
  const securityService = SecurityService.getInstance();
  const { state } = useGameState();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<AdminTab>('players');
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);

  // Vérification des droits d'accès utilisateur
  useEffect(() => {
    const userIP = securityService.getUserIP();
    if (!currentUser?.uid || !securityService.isPrivilegedIP(userIP)) {
      navigate('/login');
    }
  }, [currentUser, navigate, securityService]);

  // Chargement des statistiques administratives
  useEffect(() => {
    const loadAdminStats = async () => {
      try {
        const statsRef = ref(db, 'adminStats');
        const snapshot = await get(statsRef);
        if (snapshot.exists()) {
          setAdminStats(snapshot.val());
        }
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques :', error);
        setError('Impossible de charger les statistiques.');
      }
    };
    loadAdminStats();
  }, []);

  const tabs: TabConfig[] = [
    {
      id: 'players',
      label: 'Joueurs',
      icon: <Users size={20} />,
      component: <PlayerManagement searchQuery={searchQuery} />,
    },
    {
      id: 'reports',
      label: 'Signalements',
      icon: <AlertCircle size={20} />,
      component: <ReportsPanel />,
    },
    {
      id: 'economy',
      label: 'Économie',
      icon: <DollarSign size={20} />,
      component: <EconomyDashboard />,
    },
    {
      id: 'combat',
      label: 'Combats',
      icon: <Swords size={20} />,
      component: <CombatManagement />,
    },
    {
      id: 'weapons',
      label: 'Armes',
      icon: <Package size={20} />,
      component: <WeaponsManagement />,
    },
    {
      id: 'npcs',
      label: 'NPCs',
      icon: <Users size={20} />,
      component: <NPCManagement />,
    },
    {
      id: 'config',
      label: 'Configuration',
      icon: <Cog size={20} />,
      component: <ConfigurationPanel />,
    },
  ];

  const activeComponent = tabs.find((tab) => tab.id === activeTab)?.component;

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-48 bg-gray-800 border-r border-gray-700">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="text-yellow-500" size={32} />
              <h1 className="text-xl prison-font text-white">ADMIN</h1>
            </div>

            <div className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'bg-yellow-900/30 text-yellow-400'
                      : 'text-gray-400 hover:bg-gray-700/50'
                  }`}
                >
                  {tab.icon}
                  <span className="prison-font">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl prison-font text-white">
                {tabs.find((tab) => tab.id === activeTab)?.label}
              </h2>

              {/* Search Bar */}
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500"
                />
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded flex items-center gap-2">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            {/* Active Component */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              {activeComponent}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
