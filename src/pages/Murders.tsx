import React, { useState, useEffect } from 'react';
import { Skull, Trash } from 'lucide-react'; // Ajout de l'icône Trash
import { db } from '../firebase';
import { ref, onValue, remove } from 'firebase/database';

interface KillEvent {
  id: string;
  killerId: string;
  killerName: string;
  victimId: string;
  victimName: string;
  method: string;
  deathMessage: string;
  deathMessage: string;
  location: string;
  timestamp: string;
}

export const Murders: React.FC = () => {
  const [murders, setMurders] = useState<KillEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const murdersRef = ref(db, 'murders');
    const unsubscribe = onValue(murdersRef, (snapshot) => {
      if (snapshot.exists()) {
        const murdersData = Object.values(snapshot.val()) as KillEvent[];
        setMurders(murdersData.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ));
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = (id: string) => {
    const murderRef = ref(db, `murders/${id}`);
    remove(murderRef)
      .then(() => {
        setMurders(murders.filter((murder) => murder.id !== id)); // Mettre à jour l'état après suppression
      })
      .catch((error) => {
        console.error("Erreur lors de la suppression du meurtre:", error);
      });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Skull className="text-red-500" size={32} />
        <h1 className="text-3xl prison-font text-white">REGISTRE DES MEURTRES</h1>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center text-gray-500 py-12">
            Chargement du registre...
          </div>
        ) : murders.length > 0 ? (
          murders.map((murder) => (
            <div key={murder.id} className="bg-gray-800 rounded-lg p-6 border border-red-900/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <Skull className="text-red-500" size={24} />
                  <div>
                    <h3 className="text-xl prison-font text-red-400">{murder.killerName}</h3>
                    <p className="text-lg text-gray-300">
                      {murder.deathMessage || `${murder.killerName} a tué ${murder.victimName}!`}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-sm text-gray-500">
                    {new Date(murder.timestamp).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">{murder.location}</div>
                  <button 
                    onClick={() => handleDelete(murder.id)} 
                    className="text-red-500 hover:text-red-700 transition-colors"
                    aria-label="Supprimer cet enregistrement"
                  >
                    <Trash size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-12">
            <Skull size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-xl prison-font">Aucun meurtre enregistré</p>
          </div>
        )}
      </div>
    </div>
  );
};
