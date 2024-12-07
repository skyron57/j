import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase';
import { collection, query, getDocs, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import { Swords, Shield, Target, Activity, Settings, AlertCircle } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export const CombatManagement: React.FC = () => {
  const [combatLogs, setCombatLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('24h');
  const chartRef = useRef<ChartJS | null>(null);
  const [balanceSettings, setBalanceSettings] = useState({
    baseAttackMultiplier: 1,
    baseDefenseMultiplier: 1,
    criticalHitChance: 0.1,
    criticalHitMultiplier: 1.5,
    dodgeBaseChance: 0.05,
    weaponDurabilityLoss: 1
  });

  useEffect(() => {
    loadCombatLogs();
    loadBalanceSettings();

    // Cleanup chart on unmount
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [timeframe]);

  // Rest of your existing code...

  const chartData = {
    labels: combatLogs.map(log => new Date(log.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Dégâts infligés',
        data: combatLogs.map(log => log.damage || 0),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#9ca3af'
        }
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#9ca3af'
        }
      }
    },
    plugins: {
      legend: {
        display: false
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Your existing stats overview code... */}

      {/* Chart */}
      <div className="bg-gray-700 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Activité des combats</h3>
          <div className="flex gap-2">
            {(['24h', '7d', '30d'] as const).map(period => (
              <button
                key={period}
                onClick={() => setTimeframe(period)}
                className={`px-3 py-1 rounded text-sm ${
                  timeframe === period
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-gray-600 text-gray-400 hover:bg-gray-500/50'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
        <div className="h-64">
          <Line
            ref={chartRef}
            data={chartData}
            options={chartOptions}
          />
        </div>
      </div>

      {/* Rest of your existing code... */}
    </div>
  );
};
