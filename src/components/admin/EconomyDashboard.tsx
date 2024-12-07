import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase';
import { collection, query, getDocs, orderBy, limit, where } from 'firebase/firestore';
import { DollarSign, TrendingUp, TrendingDown, Activity } from 'lucide-react';
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

interface Transaction {
  id: string;
  userId: string;
  username: string;
  type: 'earn' | 'spend' | 'transfer';
  amount: number;
  description: string;
  timestamp: string;
}

export const EconomyDashboard: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('24h');
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalVolume: 0,
    averageTransaction: 0,
    activeUsers: 0
  });
  const chartRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    loadTransactions();

    // Cleanup chart on unmount
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [timeframe]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const transactionsRef = collection(db, 'transactions');
      
      // Calculate date range based on timeframe
      const now = new Date();
      let startDate = new Date();
      switch (timeframe) {
        case '24h':
          startDate.setHours(startDate.getHours() - 24);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
      }

      const transactionsQuery = query(
        transactionsRef,
        where('timestamp', '>=', startDate.toISOString()),
        orderBy('timestamp', 'desc'),
        limit(1000)
      );

      const snapshot = await getDocs(transactionsQuery);
      const transactionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];

      // Calculate stats
      const uniqueUsers = new Set(transactionsData.map(t => t.userId));
      const totalVolume = transactionsData.reduce((sum, t) => sum + t.amount, 0);
      
      setStats({
        totalTransactions: transactionsData.length,
        totalVolume,
        averageTransaction: totalVolume / (transactionsData.length || 1),
        activeUsers: uniqueUsers.size
      });

      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: transactions.map(t => new Date(t.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Volume de transactions',
        data: transactions.map(t => t.amount),
        borderColor: '#fbbf24',
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
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
      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="text-sm text-gray-400">Transactions</div>
          <div className="text-2xl font-bold text-white">{stats.totalTransactions}</div>
        </div>
        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="text-sm text-gray-400">Volume Total</div>
          <div className="text-2xl font-bold text-yellow-400">{stats.totalVolume}€</div>
        </div>
        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="text-sm text-gray-400">Moyenne/Transaction</div>
          <div className="text-2xl font-bold text-green-400">{Math.round(stats.averageTransaction)}€</div>
        </div>
        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="text-sm text-gray-400">Utilisateurs Actifs</div>
          <div className="text-2xl font-bold text-blue-400">{stats.activeUsers}</div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-gray-700 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Activité économique</h3>
          <div className="flex gap-2">
            {(['24h', '7d', '30d'] as const).map(period => (
              <button
                key={period}
                onClick={() => setTimeframe(period)}
                className={`px-3 py-1 rounded text-sm ${
                  timeframe === period
                    ? 'bg-yellow-500/20 text-yellow-400'
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

      {/* Transactions List */}
      <div className="bg-gray-700 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-600">
          <h3 className="text-lg font-medium">Transactions récentes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-600">
                <th className="px-4 py-3 text-gray-400">Utilisateur</th>
                <th className="px-4 py-3 text-gray-400">Type</th>
                <th className="px-4 py-3 text-gray-400">Montant</th>
                <th className="px-4 py-3 text-gray-400">Description</th>
                <th className="px-4 py-3 text-gray-400">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(transaction => (
                <tr key={transaction.id} className="border-b border-gray-600/50">
                  <td className="px-4 py-3 text-gray-300">{transaction.username}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      transaction.type === 'earn'
                        ? 'bg-green-500/10 text-green-400'
                        : transaction.type === 'spend'
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      {transaction.type === 'earn' ? 'Gain' :
                       transaction.type === 'spend' ? 'Dépense' : 'Transfert'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={transaction.type === 'earn' ? 'text-green-400' : 'text-red-400'}>
                      {transaction.type === 'spend' ? '-' : '+'}{transaction.amount}€
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{transaction.description}</td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(transaction.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
