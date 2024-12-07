import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, getDocs, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import { Flag, AlertCircle, CheckCircle2, XCircle, MessageSquare } from 'lucide-react';

interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  targetId: string;
  targetName: string;
  reason: string;
  description: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: string;
}

export const ReportsPanel: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [resolution, setResolution] = useState('');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const reportsRef = collection(db, 'reports');
      const snapshot = await getDocs(
        query(reportsRef, orderBy('createdAt', 'desc'), limit(100))
      );
      const reportsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Report[];
      setReports(reportsData);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveReport = async (reportId: string, status: 'resolved' | 'dismissed') => {
    try {
      const reportRef = doc(db, 'reports', reportId);
      await updateDoc(reportRef, {
        status,
        resolvedAt: new Date().toISOString(),
        resolvedBy: 'admin', // Replace with actual admin ID
        resolution: resolution || undefined
      });
      await loadReports();
      setSelectedReport(null);
      setResolution('');
    } catch (error) {
      console.error('Error resolving report:', error);
    }
  };

  const pendingReports = reports.filter(r => r.status === 'pending');
  const resolvedReports = reports.filter(r => r.status === 'resolved');
  const dismissedReports = reports.filter(r => r.status === 'dismissed');

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <AlertCircle size={16} />
            <span>En attente</span>
          </div>
          <div className="text-2xl font-bold text-yellow-400">{pendingReports.length}</div>
        </div>
        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <CheckCircle2 size={16} />
            <span>Résolus</span>
          </div>
          <div className="text-2xl font-bold text-green-400">{resolvedReports.length}</div>
        </div>
        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <XCircle size={16} />
            <span>Rejetés</span>
          </div>
          <div className="text-2xl font-bold text-red-400">{dismissedReports.length}</div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-gray-700 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-600">
          <h3 className="text-lg font-medium">Signalements récents</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-600">
                <th className="px-4 py-3 text-gray-400">Date</th>
                <th className="px-4 py-3 text-gray-400">Signalé par</th>
                <th className="px-4 py-3 text-gray-400">Joueur signalé</th>
                <th className="px-4 py-3 text-gray-400">Raison</th>
                <th className="px-4 py-3 text-gray-400">Status</th>
                <th className="px-4 py-3 text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(report => (
                <tr key={report.id} className="border-b border-gray-600/50">
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(report.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-300">{report.reporterName}</td>
                  <td className="px-4 py-3 text-gray-300">{report.targetName}</td>
                  <td className="px-4 py-3 text-gray-300">{report.reason}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      report.status === 'pending'
                        ? 'bg-yellow-500/10 text-yellow-400'
                        : report.status === 'resolved'
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      {report.status === 'pending' ? 'En attente' :
                       report.status === 'resolved' ? 'Résolu' : 'Rejeté'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                      >
                        <MessageSquare size={18} />
                      </button>
                      {report.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleResolveReport(report.id, 'resolved')}
                            className="p-1 text-gray-400 hover:text-green-400 transition-colors"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                          <button
                            onClick={() => handleResolveReport(report.id, 'dismissed')}
                            className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-medium">Détails du signalement</h3>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-gray-400 hover:text-white"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-400">Description</div>
                <div className="mt-1 text-gray-200">{selectedReport.description}</div>
              </div>

              {selectedReport.status === 'pending' && (
                <div>
                  <div className="text-sm text-gray-400 mb-2">Résolution</div>
                  <textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white resize-none focus:outline-none focus:border-yellow-500"
                    rows={4}
                    placeholder="Entrez les détails de la résolution..."
                  />
                </div>
              )}

              {selectedReport.status === 'pending' ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleResolveReport(selectedReport.id, 'resolved')}
                    className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Résoudre
                  </button>
                  <button
                    onClick={() => handleResolveReport(selectedReport.id, 'dismissed')}
                    className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Rejeter
                  </button>
                </div>
              ) : (
                <div>
                  <div className="text-sm text-gray-400">Résolution</div>
                  <div className="mt-1 text-gray-200">{selectedReport.resolution}</div>
                  <div className="mt-2 text-sm text-gray-400">
                    Résolu par {selectedReport.resolvedBy} le{' '}
                    {new Date(selectedReport.resolvedAt!).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
