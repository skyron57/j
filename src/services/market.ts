import { db } from '../firebase';
import { doc, collection, addDoc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { BlackMarketItem, Trade, Guard } from '../types/market';
import { v4 as uuidv4 } from 'uuid';

export const MarketService = {
  async listItem(
    sellerId: string,
    item: Omit<BlackMarketItem, 'id' | 'sellerId' | 'available' | 'expiresAt'>
  ): Promise<BlackMarketItem> {
    const marketItem: BlackMarketItem = {
      id: uuidv4(),
      ...item,
      sellerId,
      available: true,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };

    await addDoc(collection(db, 'market'), marketItem);
    return marketItem;
  },

  async createTrade(itemId: string, buyerId: string): Promise<Trade> {
    const item = (await getDocs(query(
      collection(db, 'market'),
      where('id', '==', itemId)
    ))).docs[0].data() as BlackMarketItem;

    if (!item.available) {
      throw new Error('Item no longer available');
    }

    const trade: Trade = {
      id: uuidv4(),
      itemId,
      sellerId: item.sellerId,
      buyerId,
      price: item.price,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    await addDoc(collection(db, 'trades'), trade);
    return trade;
  },

  async completeTrade(tradeId: string): Promise<void> {
    const tradeRef = doc(db, 'trades', tradeId);
    const trade = (await getDocs(query(
      collection(db, 'trades'),
      where('id', '==', tradeId)
    ))).docs[0].data() as Trade;

    // Update item availability
    const itemRef = doc(db, 'market', trade.itemId);
    await updateDoc(itemRef, { available: false });

    // Complete trade
    await updateDoc(tradeRef, { status: 'completed' });
  },

  async bribeGuard(guardId: string, amount: number, service: keyof Guard['prices']): Promise<boolean> {
    const guard = (await getDocs(query(
      collection(db, 'guards'),
      where('id', '==', guardId)
    ))).docs[0].data() as Guard;

    const success = Math.random() < (guard.corruption / 100);
    if (success) {
      // Process successful bribe
      await updateDoc(doc(db, 'guards', guardId), {
        influence: guard.influence + 1
      });
    }

    return success;
  }
};
