export interface BlackMarketItem {
  id: string;
  name: string;
  description: string;
  type: 'weapon' | 'tool' | 'material' | 'intel' | 'access';
  rarity: 1 | 2 | 3 | 4 | 5;
  price: number;
  sellerId: string;
  available: boolean;
  expiresAt: string;
  risk: number;
}

export interface Trade {
  id: string;
  itemId: string;
  sellerId: string;
  buyerId: string;
  price: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
}

export interface Guard {
  id: string;
  name: string;
  corruption: number;
  influence: number;
  prices: {
    intel: number;
    contraband: number;
    protection: number;
  };
  schedule: {
    start: number;
    end: number;
    area: string;
  }[];
}
