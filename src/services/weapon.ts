import { db } from '../firebase';
import { ref, get, update } from 'firebase/database';
import { Weapon } from '../types/weapon';

export const WeaponService = {
  /**
   * Équipe une arme pour un utilisateur spécifique.
   * @param userId ID de l'utilisateur
   * @param weaponId ID de l'arme à équiper
   */
  async equipWeapon(userId: string, weaponId: string): Promise<void> {
    try {
      const userRef = ref(db, `users/${userId}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        throw new Error('Utilisateur non trouvé.');
      }

      const userData = snapshot.val();
      const inventory = userData.inventory || [];

      // Trouver l'arme à équiper
      const weaponToEquip = inventory.find(item => item.id === weaponId);
      if (!weaponToEquip) {
        throw new Error('Arme non trouvée dans l’inventaire.');
      }

      // Vérifier si l'arme est cassée
      if (weaponToEquip.durability?.current <= 0) {
        throw new Error('Cette arme est cassée et ne peut plus être utilisée.');
      }

      // Déséquiper toutes les armes actuellement équipées
      const updatedInventory = inventory.map(item => ({
        ...item,
        equipped: false
      }));

      // Équiper l'arme sélectionnée
      const finalInventory = updatedInventory.map(item =>
        item.id === weaponId ? { ...item, equipped: true } : item
      );

      await update(userRef, {
        inventory: finalInventory,
        lastUpdate: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erreur lors de l’équipement de l’arme:', error);
      throw error;
    }
  },

  /**
   * Inflige des dégâts à une arme et vérifie si elle se casse.
   * @param userId ID de l'utilisateur
   * @param weaponId ID de l'arme à endommager
   * @returns Objet indiquant si l'arme est cassée
   */
  async damageWeapon(userId: string, weaponId: string): Promise<{ broken: boolean }> {
    try {
      const userRef = ref(db, `users/${userId}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        throw new Error('Utilisateur non trouvé.');
      }

      const userData = snapshot.val();
      const inventory = userData.inventory || [];
      const weapon = inventory.find(item => item.id === weaponId);

      if (!weapon) {
        throw new Error('Arme non trouvée.');
      }

      // Calculer les dégâts (1 à 3 points)
      const damageAmount = Math.floor(Math.random() * 3) + 1;

      // Vérifier la probabilité de casse si la durabilité est faible
      const durabilityPercentage = (weapon.durability.current / weapon.durability.max) * 100;
      const shouldBreak = durabilityPercentage <= 40 && Math.random() < 0.15; // 15% de chance de casse si <= 40%

      const newDurability = shouldBreak ? 0 : Math.max(0, weapon.durability.current - damageAmount);
      const broken = newDurability === 0;

      // Mettre à jour l'inventaire avec la nouvelle durabilité
      const updatedInventory = inventory.map(item =>
        item.id === weaponId
          ? {
              ...item,
              durability: { ...item.durability, current: newDurability },
              equipped: !broken && item.equipped // Déséquiper si cassée
            }
          : item
      );

      await update(userRef, {
        inventory: updatedInventory,
        lastUpdate: new Date().toISOString()
      });

      if (broken) {
        // Ajouter à l'historique si l'arme se casse
        const history = userData.history || [];
        await update(userRef, {
          history: [
            {
              type: 'weapon_break',
              description: `🔨 Votre ${weapon.name} s'est cassé !`,
              timestamp: new Date().toISOString()
            },
            ...history.slice(0, 49) // Garder les 50 dernières entrées
          ]
        });
      }

      return { broken };
    } catch (error) {
      console.error('Erreur lors de l’endommagement de l’arme:', error);
      throw error;
    }
  },

  /**
   * Supprime une arme de l'inventaire d'un utilisateur.
   * @param userId ID de l'utilisateur
   * @param weaponId ID de l'arme à jeter
   */
  async discardWeapon(userId: string, weaponId: string): Promise<void> {
    try {
      const userRef = ref(db, `users/${userId}`);
      const userSnapshot = await get(userRef);

      if (!userSnapshot.exists()) {
        throw new Error('Utilisateur non trouvé.');
      }

      const userData = userSnapshot.val();
      const inventory = userData.inventory || [];
      const weaponIndex = inventory.findIndex(item => item.id === weaponId);

      if (weaponIndex === -1) {
        throw new Error('Arme non trouvée.');
      }

      const weapon = inventory[weaponIndex];

      // Supprimer l'arme de l'inventaire
      inventory.splice(weaponIndex, 1);

      // Supprimer également de l'inventaire rapide si présent
      const quickInventory = userData.quickInventory || [];
      const updatedQuickInventory = quickInventory.filter(id => id !== weaponId);

      // Mettre à jour les données utilisateur
      await update(userRef, {
        inventory,
        quickInventory: updatedQuickInventory,
        history: [
          {
            type: 'weapon_discard',
            description: `🗑️ Vous avez jeté votre ${weapon.name}.`,
            timestamp: new Date().toISOString()
          }, ...(userData.history || []).slice(0, 49)],
        lastUpdate: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erreur lors du rejet de l’arme:', error);
      throw error;
    }
  }
};
