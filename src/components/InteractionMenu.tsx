import React, { useEffect, useRef } from 'react';
import { MessageSquare, Flag, User } from 'lucide-react';

interface InteractionMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onAction: (action: string) => void;
  targetName: string;
}

export const InteractionMenu: React.FC<InteractionMenuProps> = ({ 
  x, 
  y, 
  onClose, 
  onAction,
  targetName 
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      if (rect.right > viewportWidth) {
        menuRef.current.style.left = `${viewportWidth - rect.width - 10}px`;
      }
      if (rect.bottom > viewportHeight) {
        menuRef.current.style.top = `${y - rect.height - 10}px`;
      }
    }
  }, [x, y]);

  const actions = [
    { id: 'message', icon: <MessageSquare size={16} />, label: 'Envoyer un MP' },
    { id: 'report', icon: <Flag size={16} />, label: 'Signaler' },
    { id: 'profile', icon: <User size={16} />, label: 'Voir le casier' }
  ];

  return (
    <div 
      ref={menuRef}
      className="fixed bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-2 z-50"
      style={{
        left: x,
        top: y
      }}
    >
      {actions.map(action => (
        <button
          key={action.id}
          onClick={() => {
            onAction(action.id);
            onClose();
          }}
          className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-700 transition-colors"
        >
          <span className="text-gray-400">{action.icon}</span>
          <span className="text-sm">{action.label}</span>
        </button>
      ))}
    </div>
  );
};
