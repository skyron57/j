export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string | null;
  recipientName: string | null;
  gangId?: string;
  content: string;
  type: 'private' | 'gang' | 'urgent' | 'intercepted';
  status: 'sent' | 'delivered' | 'read' | 'intercepted';
  hasHiddenItem?: boolean;
  hiddenItemData?: {
    itemId: string;
    itemName: string;
    quantity: number;
  };
  createdAt: string;
  deliveredAt?: string;
  readAt?: string;
  expiresAt: string;
  style?: {
    font?: string;
    color?: string;
    signature?: string;
  };
}

export interface MessageThread {
  id: string;
  type: 'private' | 'gang';
  participants: {
    id: string;
    username: string;
    signature?: string;
  }[];
  lastMessage: Message;
  unreadCount: number;
  isWatched?: boolean;
  watchedBy?: string[];
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  username: string;
  type: PrisonEmoji;
  createdAt: string;
}

export type PrisonEmoji = 
  | '🔒' // barreaux
  | '⛓️' // chaînes
  | '🔪' // couteau
  | '📝' // note
  | '👊' // poing
  | '🚨' // alarme
  | '💪' // force
  | '🤫' // chut
  | '👀' // surveillance
  | '🕵️' // espion;
