import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, AlertCircle } from 'lucide-react';
import { useGameState } from '../contexts/GameStateContext';
import { MessageService } from '../services/message';
import { Message } from '../types/message';
import { useLocation, useNavigate } from 'react-router-dom';

export const MessageList: React.FC = () => {
  const { state } = useGameState();
  const location = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<string | null>(null);
  const [selectedRecipientName, setSelectedRecipientName] = useState<string | null>(null);

  useEffect(() => {
    // Récupérer le destinataire depuis l'URL si présent
    const params = new URLSearchParams(location.search);
    const recipientId = params.get('recipient');
    const recipientName = params.get('name');
    if (recipientId && recipientName) {
      setSelectedRecipient(recipientId);
      setSelectedRecipientName(recipientName);
      // Nettoyer l'URL
      navigate('/game/messages', { replace: true });
    }

    loadMessages();
    const interval = setInterval(loadMessages, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [state.id, location.search]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const msgs = await MessageService.getMessages(state.id);
      setMessages(msgs);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedRecipient || !newMessage.trim()) {
      setError('Veuillez sélectionner un destinataire et écrire un message');
      return;
    }

    try {
      await MessageService.sendMessage(
        state.id,
        state.username,
        selectedRecipient,
        'Destinataire',
        newMessage,
        'private'
      );
      setNewMessage('');
      await loadMessages();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="text-blue-500" size={32} />
        <h1 className="text-3xl prison-font text-white">MESSAGES</h1>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Liste des conversations */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-lg prison-font mb-4">Conversations</h2>
          <div className="space-y-2">
            {messages.map(msg => (
              <button
                key={msg.id}
                onClick={() => setSelectedRecipient(msg.senderId === state.id ? msg.recipientId : msg.senderId)}
                className="w-full p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg text-left transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {msg.senderId === state.id ? msg.recipientName : msg.senderName}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-gray-400 truncate mt-1">{msg.content}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Zone de messages */}
        <div className="col-span-2 bg-gray-800 rounded-lg p-4">
          <div className="flex flex-col h-[500px]">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages
                .filter(msg => 
                  msg.senderId === selectedRecipient || msg.recipientId === selectedRecipient
                )
                .map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderId === state.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        msg.senderId === state.id
                          ? 'bg-blue-600'
                          : 'bg-gray-700'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <span className="text-xs text-gray-400 mt-1">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
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
                disabled={!selectedRecipient || !newMessage.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
