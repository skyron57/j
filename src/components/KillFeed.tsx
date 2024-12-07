import React from 'react';
import { Skull } from 'lucide-react';

interface KillEvent {
  killer: string;
  victim: string;
  timestamp: Date;
  method: string;
}

export const KillFeed: React.FC = () => {
  // Exemple de données, à remplacer par les vraies données de Firebase
  const kills: KillEvent[] = [
    {
      killer: "Détenu #A23B4",
      victim: "Détenu #C789D",
      timestamp: new Date(),
      method: "Coup de couteau"
    }
  ];

  return (
    <div className="space-y-4">
      <h3 className="prison-font text-xl flex items-center gap-2">
        <Skull className="text-red-500" />
        REGISTRE DES DÉCÈS
      </h3>
      
      <div className="space-y-2">
        {kills.map((kill, index) => (
          <div key={index} className="bg-gray-900/50 p-3 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-red-400 prison-font">{kill.killer}</span>
              <span className="text-gray-500">
                {kill.timestamp.toLocaleDateString()}
              </span>
            </div>
            <div className="mt-1 text-sm text-gray-400">
              a tué <span className="text-gray-300">{kill.victim}</span>
            </div>
            <div className="mt-1 text-xs text-gray-500 italic">
              {kill.method}
            </div>
          </div>
        ))}

        {kills.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            Aucun décès enregistré
          </div>
        )}
      </div>
    </div>
  );
};
