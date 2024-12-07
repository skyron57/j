import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, AlertCircle } from 'lucide-react';
import { Message, MessageReaction, PrisonEmoji } from '../types/message';
import { MessageService } from '../services/message';
import { useAuth } from '../contexts/AuthContext';

interface MessageThreadProps {
  threadId: string;
  messages: Message[];
  onSendMessage: (content: string, hiddenItem?: Message['hiddenItemData']) => Promise<void>;
}

const PRISON_EMOJIS: PrisonEmoji[] = ['🔒', '⛓️', '🔪', '📝', '👊', '🚨', '💪', '🤫', '👀', '🕵️'];

export const MessageThread: React.FC<MessageThreadProps> = ({
  threadId,
  messages,
  onSendMessage
}) => {
  const { currentUser } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [reactions, setReactions] = useState<Record<string, MessageReaction[]>>({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadReactions();
    scrollToBottom();
  }, [messages]);

  const loadReactions = async () => {
    try {
      const allReactions: Record<string, MessageReaction[]> = {};
      await Promise.all(
        messages.map(async (message) => {
          const messageReactions = await MessageService.getReactions(message.id);
          allReactions[message.id] = messageReactions;
        })
      );
      setReactions(allReactions);
    } catch (error) {
      console.error('Error loading reactions:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setError(null);
      await onSendMessage(newMessage);
      setNewMessage('');
      scrollToBottom();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleReaction = async (messageId: string, type: PrisonEmoji) => {
    if (!currentUser) return;

    try {
      await MessageService.addReaction(
        messageId,
        currentUser.uid,
        currentUser.displayName || 'Unknown',
        type
      );
      await loadReactions();
      setShowEmojiPicker(false);
      setSelectedMessageId(null);
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex flex-col ${
              message.senderId === currentUser?.uid ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-lg ${
                message.type === 'intercepted'
                  ? 'bg-red-900/20 border border-red-500'
                  : message.senderId === currentUser?.uid
                  ? 'bg-blue-600'
                  : 'bg-gray-700'
              } ${message.type === 'urgent' ? 'animate-pulse' : ''}`}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <div className="text-sm font-medium mb-1">
                    {message.senderName}
                  </div>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  {message.hasHiddenItem && (
                    <div className="mt-2 text-sm text-yellow-400">
                      🎁 Contient un objet caché
                    </div>
                  )}
                </div>
                <div className="text-xs opacity-75">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </div>
              </div>

              {/* Message Status */}
              <div className="mt-2 flex items-center justify-between text-xs">
                <div className="opacity-75">
                  {message.status === 'intercepted' && '🚫 Intercepté'}
                  {message.status === 'sent' && '📤 Envoyé'}
                  {message.status === 'delivered' && '📥 Reçu'}
                  {message.status === 'read' && '👁️ Lu'}
                </div>
                <button
                  onClick={() => {
                    setSelectedMessageId(message.id);
                    setShowEmojiPicker(true);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  😀
                </button>
              </div>

              {/* Reactions */}
              {reactions[message.id]?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {reactions[message.id].map((reaction) => (
                    <span
                      key={reaction.id}
                      className="px-2 py-1 bg-gray-800 rounded-full text-sm"
                      title={reaction.username}
                    >
                      {reaction.type}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Emoji Picker */}
            {showEmojiPicker && selectedMessageId === message.id && (
              <div className="mt-2 p-2 bg-gray-800 rounded-lg shadow-lg">
                <div className="flex gap-2">
                  {PRISON_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(message.id, emoji)}
                      className="p-2 hover:bg-gray-700 rounded transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Votre message..."
          className="flex-1 bg-gray-700 border border-gray-600 rounded px-4 py-2 focus:outline-none focus:border-blue-500"
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <button
          onClick={handleSendMessage}
          disabled={!newMessage.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};
