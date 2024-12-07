import { db } from '../firebase';
import { ref, push, set, update, get, child, remove } from 'firebase/database';
import { Message, MessageReaction } from '../types/message';
import { v4 as uuidv4 } from 'uuid';

const INTERCEPTION_CHANCE = 0.1; // 10% chance d'interception
const DELIVERY_DELAY = 5000; // 5 secondes de délai de livraison

export class MessageError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'MessageError';
  }
}

export const MessageService = {
  async sendMessage(
    senderId: string,
    senderName: string,
    recipientId: string | null,
    recipientName: string | null,
    content: string,
    type: Message['type'] = 'private',
    gangId?: string,
    hiddenItem?: Message['hiddenItemData']
  ): Promise<Message> {
    if (!senderId) {
      throw new MessageError('ID de l\'expéditeur requis');
    }

    try {
      // Vérifier si l'expéditeur est surveillé
      const senderRef = ref(db, 'users/' + senderId);
      const snapshot = await get(senderRef);
      const isWatched = snapshot.exists() ? snapshot.val().isWatched : false;

      // Calculer la chance d'interception
      const isIntercepted = isWatched || Math.random() < INTERCEPTION_CHANCE;

      const message: Message = {
        id: uuidv4(),
        senderId,
        senderName,
        recipientId,
        recipientName,
        gangId,
        content,
        type: isIntercepted ? 'intercepted' : type,
        status: isIntercepted ? 'intercepted' : 'sent',
        hasHiddenItem: !!hiddenItem,
        hiddenItemData: hiddenItem,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 heures
      };

      // Simuler un délai de livraison
      if (!isIntercepted) {
        setTimeout(async () => {
          const messageRef = ref(db, 'messages/' + message.id);
          await update(messageRef, {
            status: 'delivered',
            deliveredAt: new Date().toISOString()
          });
        }, DELIVERY_DELAY);
      }

      const messagesRef = ref(db, 'messages');
      await push(messagesRef, message);

      // Si le message est intercepté, notifier les gardiens
      if (isIntercepted) {
        const interceptedMessagesRef = ref(db, 'interceptedMessages');
        await push(interceptedMessagesRef, {
          messageId: message.id,
          interceptedAt: new Date().toISOString(),
          reason: isWatched ? 'Détenu surveillé' : 'Contrôle aléatoire'
        });
      }

      return message;
    } catch (error: any) {
      console.error('Error sending message:', error);
      throw new MessageError(
        'Erreur lors de l\'envoi du message',
        error.code
      );
    }
  },

  async getMessages(userId: string): Promise<Message[]> {
    if (!userId) {
      throw new MessageError('ID utilisateur requis');
    }

    try {
      const messagesRef = ref(db, 'messages');
      const snapshot = await get(messagesRef);
      if (!snapshot.exists()) {
        return [];
      }

      const messages = Object.values(snapshot.val()).filter((msg: Message) => msg.recipientId === userId);

      // Filtrer les messages expirés
      const now = new Date().toISOString();
      return messages.filter(msg => msg.expiresAt > now);
    } catch (error: any) {
      console.error('Error getting messages:', error);
      throw new MessageError(
        'Erreur lors de la récupération des messages',
        error.code
      );
    }
  },

  async markAsRead(messageId: string): Promise<void> {
    try {
      const messageRef = ref(db, 'messages/' + messageId);
      await update(messageRef, {
        status: 'read',
        readAt: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Error marking message as read:', error);
      throw new MessageError(
        'Erreur lors du marquage du message comme lu',
        error.code
      );
    }
  },

  async addReaction(
    messageId: string,
    userId: string,
    username: string,
    type: MessageReaction['type']
  ): Promise<MessageReaction> {
    try {
      const reaction: MessageReaction = {
        id: uuidv4(),
        messageId,
        userId,
        username,
        type,
        createdAt: new Date().toISOString()
      };

      const messageReactionsRef = ref(db, 'messageReactions');
      await push(messageReactionsRef, reaction);
      return reaction;
    } catch (error: any) {
      console.error('Error adding reaction:', error);
      throw new MessageError(
        'Erreur lors de l\'ajout de la réaction',
        error.code
      );
    }
  },

  async getReactions(messageId: string): Promise<MessageReaction[]> {
    try {
      const reactionsRef = ref(db, 'messageReactions');
      const snapshot = await get(reactionsRef);
      if (!snapshot.exists()) {
        return [];
      }

      return Object.values(snapshot.val()).filter((reaction: MessageReaction) => reaction.messageId === messageId);
    } catch (error: any) {
      console.error('Error getting reactions:', error);
      throw new MessageError(
        'Erreur lors de la récupération des réactions',
        error.code
      );
    }
  },

  async deleteExpiredMessages(): Promise<void> {
    try {
      const now = new Date().toISOString();
      const messagesRef = ref(db, 'messages');
      const snapshot = await get(messagesRef);
      if (!snapshot.exists()) {
        return;
      }

      const expiredMessages = Object.keys(snapshot.val()).filter((messageId: string) => {
        const message = snapshot.val()[messageId];
        return message.expiresAt <= now;
      });

      const batch = expiredMessages.map((messageId) => remove(ref(db, 'messages/' + messageId)));
      await Promise.all(batch);
    } catch (error: any) {
      console.error('Error deleting expired messages:', error);
      throw new MessageError(
        'Erreur lors de la suppression des messages expirés',
        error.code
      );
    }
  }
};
