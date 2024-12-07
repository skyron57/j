import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, getDocs, orderBy, limit, where } from 'firebase/firestore';
import { Database, Search, Filter } from 'lucide-react';

interface LogsViewerProps {
  searchQuery: string;
}

interface Log {
  id: string;
  type: string;
  description: string;
  userId?: string;
  username?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  details?: any;
}

export const LogsViewer: React.FC<LogsViewerProps> = ({ searchQuery }) => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<Log['severity'] | 'all'>('all');

  useEffect(() => {
    loadLogs();
  }, [selectedType, selectedSeverity]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const logsRef = collection(db, 'logs');
      let baseQuery = query(logsRef, orderBy('timestamp', 'desc'), limit(100));

      if (selectedType !== 'all') {
        baseQuery = query(baseQuery, where('type', '==', selectedType));
      }

      if (selectedSeverity !== 'all') {
        baseQuery = query(baseQuery, where('severity', '==', selectedSeverity));
      }

      const snapshot = await getDocs(baseQuery);
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Log[];

      setLogs(logsData);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      log.description.toLowerCase().includes(searchLower) ||
      log.type.toLowerCase().includes(searchLower) ||
      log.username?.toLowerCase().includes(searchLower)
    );
  });

  const logTypes = Array.from(new Set(logs.map(log => log.type)));

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="text-sm text-gray-400">Total Logs</div>
          <div className="text-2xl font-bold text-white">{logs.length}</div>
        </div>
        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="text-sm text-gray-400">Critiques</div>
          <div className="text-2xl font-bold text-red-400">
            {logs.filter(log => log.severity === 'critical').length}
          </div>
        </div>
        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="text-sm text-gray-400">Élevés</div>
          <div className="text-2xl font-bold text-orange-400">
            {logs.filter(log => log.severity === 'high').length}
          </div>
        </div>
        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="text-sm text-gray-400">Moyens</div>
          <div className="text-2xl font-bold text-yellow-400">
            {logs.filter(log => log.severity === 'medium').length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="text-sm text-gray-400 mb-1 block">Type</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
          >
            <option value="all">Tous les types</option>
            {logTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-sm text-gray-400 mb-1 block">Sévérité</label>
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value as Log['severity'] | 'all')}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
          >
            <option value="all">Toutes les sévérités</option>
            <option value="critical">Critique</option>
            <option value="high">Élevée</option>
            <option value="medium">Moyenne</option>
            <option value="low">Basse</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-gray-700 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-600">
          <h3 className="text-lg font-medium">Logs système</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-600">
                <th className="px-4 py-3 text-gray-400">Date</th>
                <th className="px-4 py-3 text-gray-400">Type</th>
                <th className="px-4 py-3 text-gray-400">Description</th>
                <th className="px-4 py-3 text-gray-400">Utilisateur</th>
                <th className="px-4 py-3 text-gray-400">Sévérité</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id} className="border-b border-gray-600/50">
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs bg-gray-600 text-gray-300 rounded-full">
                      {log.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{log.description}</td>
                  <td className="px-4 py-3 text-gray-400">{log.username || 'Système'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      log.severity === 'critical'
                        ? 'bg-red-500/10 text-red-400'
                        : log.severity === 'high'
                        ? 'bg-orange-500/10 text-orange-400'
                        : log.severity === 'medium'
                        ? 'bg-yellow-500/10 text-yellow-400'
                        : 'bg-green-500/10 text-green-400'
                    }`}>
                      {log.severity}
                    </span>
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
