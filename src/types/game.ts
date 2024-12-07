// Ajouter cette nouvelle action au type GameAction
export type GameAction = 
  | { type: 'INIT_USER_DATA'; payload: any }
  | { type: 'UPDATE_HEALTH'; payload: number }
  | { type: 'UPDATE_ACTION_POINTS'; payload: number }
  | { type: 'UPDATE_MOVEMENT_POINTS'; payload: number }
  | { type: 'UPDATE_MONEY'; payload: number }
  | { type: 'CHANGE_LOCATION'; payload: string }
  | { type: 'UPDATE_AVATAR'; payload: string | null }
  | { type: 'UPDATE_STATS'; payload: Partial<GameState['stats']> }
  | { type: 'UPDATE_COMBAT_STATS'; payload: Partial<GameState['stats']> }
  | { type: 'UPDATE_INVENTORY'; payload: any[] }
  | { type: 'UPDATE_INVENTORY_AND_STATS'; payload: { inventory: any[]; stats: GameState['stats'] } }
  | { type: 'USE_ITEM'; payload: { itemId: string; effect: any } }
  | { type: 'ADD_ACTION'; payload: any }
  | { type: 'UPDATE_QUICK_INVENTORY'; payload: string[] };
