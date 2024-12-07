import { db } from '../firebase';
import { ref, push, get, update } from 'firebase/database';

export interface Report {
  id?: string;
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

export class ReportService {
  static async createReport(report: Omit<Report, 'id'>): Promise<void> {
    try {
      const reportsRef = ref(db, 'reports');
      await push(reportsRef, {
        ...report,
        id: `report-${Date.now()}`
      });
    } catch (error) {
      console.error('Error creating report:', error);
      throw new Error('Erreur lors de la création du signalement');
    }
  }

  static async getReports(): Promise<Report[]> {
    try {
      const reportsRef = ref(db, 'reports');
      const snapshot = await get(reportsRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      return Object.values(snapshot.val());
    } catch (error) {
      console.error('Error getting reports:', error);
      throw new Error('Erreur lors de la récupération des signalements');
    }
  }

  static async resolveReport(reportId: string, resolution: string, adminId: string): Promise<void> {
    try {
      const reportRef = ref(db, `reports/${reportId}`);
      await update(reportRef, {
        status: 'resolved',
        resolvedAt: new Date().toISOString(),
        resolvedBy: adminId,
        resolution
      });
    } catch (error) {
      console.error('Error resolving report:', error);
      throw new Error('Erreur lors de la résolution du signalement');
    }
  }

  static async dismissReport(reportId: string, adminId: string): Promise<void> {
    try {
      const reportRef = ref(db, `reports/${reportId}`);
      await update(reportRef, {
        status: 'dismissed',
        resolvedAt: new Date().toISOString(),
        resolvedBy: adminId
      });
    } catch (error) {
      console.error('Error dismissing report:', error);
      throw new Error('Erreur lors du rejet du signalement');
    }
  }
}
