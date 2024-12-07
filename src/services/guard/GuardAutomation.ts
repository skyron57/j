import { ref, get, update, runTransaction } from 'firebase/database';
import { db } from '../../firebase';
import { Guard } from '../../types/guard';

export class GuardAutomation {
  private static instance: GuardAutomation | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly UPDATE_FREQUENCY = 60000;

  private constructor() {}

  public static getInstance(): GuardAutomation {
    if (!GuardAutomation.instance) {
      GuardAutomation.instance = new GuardAutomation();
    }
    return GuardAutomation.instance;
  }

  public startAutomation(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(() => {
      this.updateAndDamageGuards();
    }, this.UPDATE_FREQUENCY);

    this.updateAndDamageGuards();
  }

  public stopAutomation(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  private async updateAndDamageGuards(): Promise<void> {
    try {
      const guardsRef = ref(db, 'guards');
      const snapshot = await get(guardsRef);
      if (!snapshot.exists()) return;

      const guards = snapshot.val();
      const updates: Record<string, any> = {};

      Object.entries(guards).forEach(([guardId, guard]: [string, Guard]) => {
        if (!guard.active) return;

        // Example logic to damage guards over time
        const damage = Math.floor(Math.random() * 10) + 1;
        guard.health = Math.max(0, guard.health - damage);

        if (guard.health === 0) {
          guard.inComa = true;
          guard.active = false;
          guard.comaStartTime = Date.now();
        }

        updates[guardId] = guard;
      });

      await update(guardsRef, updates);
      console.log('Guards updated successfully');
    } catch (error) {
      console.error('Error updating guards:', error);
    }
  }
}
