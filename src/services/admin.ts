import { db } from '../firebase';
import { doc, updateDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { LoggingService } from './logging';

export class AdminService {
  static async updateGameSettings(settings: any): Promise<void> {
    try {
      const settingsRef = doc(db, 'gameSettings', 'global');
      await updateDoc(settingsRef, settings);

      await LoggingService.logAdminAction({
        type: 'settings_update',
        description: 'Game settings updated',
        adminId: 'admin', // Replace with actual admin ID
        details: settings,
        ip: 'localhost' // Replace with actual IP
      });
    } catch (error) {
      console.error('Error updating game settings:', error);
      throw error;
    }
  }

  static async getGameSettings(): Promise<any> {
    try {
      const settingsRef = doc(db, 'gameSettings', 'global');
      const settingsDoc = await getDoc(settingsRef);
      return settingsDoc.exists() ? settingsDoc.data() : null;
    } catch (error) {
      console.error('Error getting game settings:', error);
      throw error;
    }
  }

  static async updateNPC(npcId: string, data: any): Promise<void> {
    try {
      const npcRef = doc(db, 'npcs', npcId);
      await updateDoc(npcRef, data);

      await LoggingService.logAdminAction({
        type: 'npc_update',
        description: `NPC ${npcId} updated`,
        adminId: 'admin',
        targetId: npcId,
        details: data,
        ip: 'localhost'
      });
    } catch (error) {
      console.error('Error updating NPC:', error);
      throw error;
    }
  }

  static async banPlayer(playerId: string, reason: string): Promise<void> {
    try {
      const playerRef = doc(db, 'users', playerId);
      await updateDoc(playerRef, {
        banned: true,
        banReason: reason,
        banDate: new Date().toISOString()
      });

      await LoggingService.logAdminAction({
        type: 'player_ban',
        description: `Player ${playerId} banned`,
        adminId: 'admin',
        targetId: playerId,
        details: { reason },
        ip: 'localhost'
      });
    } catch (error) {
      console.error('Error banning player:', error);
      throw error;
    }
  }

  static async unbanPlayer(playerId: string): Promise<void> {
    try {
      const playerRef = doc(db, 'users', playerId);
      await updateDoc(playerRef, {
        banned: false,
        banReason: null,
        banDate: null
      });

      await LoggingService.logAdminAction({
        type: 'player_unban',
        description: `Player ${playerId} unbanned`,
        adminId: 'admin',
        targetId: playerId,
        ip: 'localhost'
      });
    } catch (error) {
      console.error('Error unbanning player:', error);
      throw error;
    }
  }

  static async getSystemStats(): Promise<any> {
    try {
      const usersRef = collection(db, 'users');
      const npcsRef = collection(db, 'npcs');
      const reportsRef = collection(db, 'reports');

      const [usersSnapshot, npcsSnapshot, reportsSnapshot] = await Promise.all([
        getDocs(usersRef),
        getDocs(npcsRef),
        getDocs(reportsRef)
      ]);

      return {
        totalUsers: usersSnapshot.size,
        totalNPCs: npcsSnapshot.size,
        totalReports: reportsSnapshot.size,
        activeUsers: usersSnapshot.docs.filter(doc => {
          const lastActive = doc.data().lastActive;
          if (!lastActive) return false;
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return new Date(lastActive) > dayAgo;
        }).length
      };
    } catch (error) {
      console.error('Error getting system stats:', error);
      throw error;
    }
  }

  static async resetPlayerStats(playerId: string): Promise<void> {
    try {
      const playerRef = doc(db, 'users', playerId);
      await updateDoc(playerRef, {
        'stats.level': 0,
        'stats.strength': 5,
        'stats.defense': 5,
        'stats.agility': 5,
        'stats.dodge': 5,
        'stats.damageDealt': 0,
        'stats.damageTaken': 0,
        'stats.missedAttacks': 0,
        'stats.dodgedAttacks': 0
      });

      await LoggingService.logAdminAction({
        type: 'stats_reset',
        description: `Player ${playerId} stats reset`,
        adminId: 'admin',
        targetId: playerId,
        ip: 'localhost'
      });
    } catch (error) {
      console.error('Error resetting player stats:', error);
      throw error;
    }
  }

  static async clearPlayerInventory(playerId: string): Promise<void> {
    try {
      const playerRef = doc(db, 'users', playerId);
      await updateDoc(playerRef, {
        inventory: [],
        quickInventory: []
      });

      await LoggingService.logAdminAction({
        type: 'inventory_clear',
        description: `Player ${playerId} inventory cleared`,
        adminId: 'admin',
        targetId: playerId,
        ip: 'localhost'
      });
    } catch (error) {
      console.error('Error clearing player inventory:', error);
      throw error;
    }
  }
}
