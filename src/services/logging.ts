import { db } from '../firebase'; // Assurez-vous que la configuration de Realtime Database est correcte
import { ref, push, set } from 'firebase/database';

export class LoggingService {
  static async logAdminAction(action: {
    type: string;
    description: string;
    adminId: string;
    targetId?: string;
    ip: string;
    details?: any;
  }): Promise<void> {
    try {
      const adminLogsRef = ref(db, 'adminLogs');
      const newLogRef = push(adminLogsRef);
      
      await set(newLogRef, {
        ...action,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  }

  static async logSecurityEvent(event: {
    type: string;
    description: string;
    ip: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    details?: any;
  }): Promise<void> {
    try {
      const securityLogsRef = ref(db, 'securityLogs');
      const newEventRef = push(securityLogsRef);
      
      await set(newEventRef, {
        ...event,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }
}
