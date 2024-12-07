import { PRISON_ITEMS } from '../types/inventory';

export const SHOP_ITEMS = {
  revive: {
    ...PRISON_ITEMS.revive,
    price: 1000,
    type: 'consumable',
  },
  anabolic: {
    ...PRISON_ITEMS.anabolic,
    price: 1500,
    type: 'anabolic',
  },
  healthBoost: {
    ...PRISON_ITEMS.syringe,
    price: 500,
    type: 'consumable',
  },
  energyDrink: {
    ...PRISON_ITEMS.energyDrink,
    price: 300,
    type: 'consumable',
  }
};
