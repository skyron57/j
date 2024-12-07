import { ref, get, update, set, child } from 'firebase/database';
import { db } from '../firebase';
import { Dealer, WeaponStock, PRISON_WEAPONS } from '../types/dealer';
import { LOCATIONS } from '../data/locations';
import { v4 as uuidv4 } from 'uuid';

export class DealerError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'DealerError';
  }
}

export const DealerService = {
  async getCurrentLocation(): Promise<string> {
    try {
      const dealerRef = ref(db, 'dealers/prison-dealer');
      const dealerSnapshot = await get(dealerRef);
      
      if (dealerSnapshot.exists()) {
        return dealerSnapshot.val().currentLocation;
      }
      
      // If no dealer exists, create one
      const locations = Object.keys(LOCATIONS);
      const randomLocation = locations[Math.floor(Math.random() * locations.length)];
      
      await set(dealerRef, {
        id: 'prison-dealer',
        name: 'Le Taulier',
        currentLocation: randomLocation,
        lastMove: new Date().toISOString(),
        stock: []
      });

      return randomLocation;
    } catch (error) {
      console.error('Error getting dealer location:', error);
      throw new DealerError('Erreur lors de la récupération de la position du Taulier');
    }
  },

  async moveToNewLocation(): Promise<string> {
    try {
      const locations = Object.keys(LOCATIONS);
      const currentLocation = await this.getCurrentLocation();
      
      let newLocation;
      do {
        newLocation = locations[Math.floor(Math.random() * locations.length)];
      } while (newLocation === currentLocation);

      const dealerRef = ref(db, 'dealers/prison-dealer');
      await update(dealerRef, {
        currentLocation: newLocation,
        lastMove: new Date().toISOString()
      });

      return newLocation;
    } catch (error) {
      console.error('Error moving dealer:', error);
      throw new DealerError('Erreur lors du déplacement du Taulier');
    }
  },

  async refreshStock(): Promise<WeaponStock[]> {
    try {
      const weaponIds = Object.keys(PRISON_WEAPONS);
      const selectedWeapons: WeaponStock[] = [];

      for (let i = 0; i < 3; i++) {
        const randomIndex = Math.floor(Math.random() * weaponIds.length);
        const weaponId = weaponIds[randomIndex];
        const weapon = PRISON_WEAPONS[weaponId];

        const price = Math.floor(
          Math.random() * (weapon.price.max - weapon.price.min + 1) + weapon.price.min
        );

        selectedWeapons.push({
          id: uuidv4(),
          weaponId,
          quantity: weapon.maxQuantity,
          price,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });

        weaponIds.splice(randomIndex, 1);
      }

      const dealerRef = ref(db, 'dealers/prison-dealer');
      await update(dealerRef, {
        stock: selectedWeapons
      });

      return selectedWeapons;
    } catch (error) {
      console.error('Error refreshing stock:', error);
      throw new DealerError('Erreur lors du rafraîchissement du stock');
    }
  },

  async purchaseWeapon(userId: string, stockId: string): Promise<void> {
    try {
      const dealerRef = ref(db, 'dealers/prison-dealer');
      const dealerSnapshot = await get(dealerRef);
      
      if (!dealerSnapshot.exists()) {
        throw new DealerError('Taulier introuvable');
      }

      const dealer = dealerSnapshot.val() as Dealer;
      const stockItem = dealer.stock.find(item => item.id === stockId);
      
      if (!stockItem) {
        throw new DealerError('Article non disponible');
      }

      if (stockItem.quantity <= 0) {
        throw new DealerError('Stock épuisé');
      }

      const weapon = PRISON_WEAPONS[stockItem.weaponId];
      if (!weapon) {
        throw new DealerError('Arme invalide');
      }

      const userRef = ref(db, `users/${userId}`);
      const userSnapshot = await get(userRef);
      
      if (!userSnapshot.exists()) {
        throw new DealerError('Utilisateur introuvable');
      }

      const userData = userSnapshot.val();
      if (userData.money < stockItem.price) {
        throw new DealerError('Fonds insuffisants');
      }

      const weaponItem = {
        id: uuidv4(),
        name: weapon.name,
        description: weapon.description,
        emoji: weapon.emoji,
        type: 'weapon',
        stats: {
          attack: weapon.stats.attack,
          defense: weapon.stats.defense,
          agility: weapon.stats.skill,
          dodge: weapon.stats.dodge
        },
        durability: {
          current: 100,
          max: 100
        },
        equipped: false,
        deathMessage: weapon.deathMessage,
        quantity: 1,
        rarity: weapon.rarity || 1
      };

      const updatedStock = dealer.stock.map(item =>
        item.id === stockId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      );

      await update(dealerRef, {
        stock: updatedStock
      });

      const inventory = userData.inventory || [];
      const history = userData.history || [];

      await update(userRef, {
        money: userData.money - stockItem.price,
        inventory: [...inventory, weaponItem],
        history: [{
          type: 'purchase',
          description: `${weapon.emoji} Vous avez acheté ${weapon.name} pour ${stockItem.price}€`,
          timestamp: new Date().toISOString()
        }, ...history.slice(0, 49)],
        lastUpdate: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error purchasing weapon:', error);
      if (error instanceof DealerError) {
        throw error;
      }
      throw new DealerError('Erreur lors de l\'achat');
    }
  }
};
