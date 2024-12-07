import React, { useEffect, useState } from 'react';
import { Trophy, Target, Shield, Zap, User } from 'lucide-react';
import { db } from '../firebase'; 
import { ref, get, query, orderByChild } from 'firebase/database';

interface PlayerRanking {
  id: string;
  username: string;
  level: number;
  stats: {
    damageDealt: number;
    damageTaken: number;
    missedAttacks: number;
    dodgedAttacks: number;
    kills: number;
    deaths: number;
    points?: number;
  };
}

interface PlayerDetails {
  kills: Array<{
    victim: string;
    date: string;
    method: string;
  }>;
  deaths: Array<{
    killer: string;
    date: string;
    method: string;
  }>;
}

export const Rankings: React.FC = () => {
  const [rankings, setRankings] = useState<PlayerRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [playerDetails, setPlayerDetails] = useState<PlayerDetails | null>(null);

  useEffect(() => {
    loadRankings();
  }, []);

  const loadRankings = async () => {
    try {
      // Get only real players (exclude bots)
      const usersRef = ref(db, 'users');
      const snapshot = await get(usersRef);
      
      if (!snapshot.exists()) {
        setRankings([]);
        return;
      }
      
      const players = Object.entries(snapshot.val())
        .map(([id, data]: [string, any]) => ({
          id,
          username: data.username,
          level: data.stats?.level || 1,
          stats: {
            damageDealt: data.stats?.damageDealt || 0,
            damageTaken: data.stats?.damageTaken || 0,
            missedAttacks: data.stats?.missedAttacks || 0,
            dodgedAttacks: data.stats?.dodgedAttacks || 0,
            kills: data.stats?.kills || 0,
            deaths: data.stats?.deaths || 0,
            points: data.stats?.points || 0
          }
        }))
        .filter(player => 
          player.username && 
          player.username !== 'Le Taulier' && 
          player.username !== 'Infirmière Sarah'
        )
        .sort((a, b) => (b.stats.points || 0) - (a.stats.points || 0));

      setRankings(players);
    } catch (error) {
      console.error('Error loading rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPlayerDetails = async (playerId: string) => {
    try {
      const playerRef = ref(db, `users/${playerId}`);
      const snapshot = await get(playerRef);
      
      if (snapshot.exists()) {
        const playerData = snapshot.val();
        setPlayerDetails({
          kills: playerData.kills || [],
          deaths: playerData.deaths || []
        });
      }
      
      setSelectedPlayer(playerId);
    } catch (error) {
      console.error('Error loading player details:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="text-yellow-500" size={32} />
        <h1 className="text-3xl prison-font text-white">CLASSEMENT GÉNÉRAL</h1>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="grid grid-cols-8 gap-4 p-4 border-b border-gray-700 text-sm prison-font text-gray-400">
            <div>RANG</div>
            <div className="col-span-2">DÉTENU</div>
            <div className="text-right">POINTS</div>
            <div className="text-right">DÉGÂTS</div>
            <div className="text-right">REÇUS</div>
            <div className="text-right">MEURTRES</div>
            <div className="text-right">MORTS</div>
          </div>

          {rankings.map((player, index) => (
            <div 
              key={player.id} 
              className="grid grid-cols-8 gap-4 p-4 border-b border-gray-700 hover:bg-gray-700/30 transition-colors"
            >
              <div className="flex items-center">
                <span className="text-2xl prison-font text-yellow-500">#{index + 1}</span>
              </div>
              <div className="col-span-2">
                <button
                  onClick={() => loadPlayerDetails(player.id)}
                  className="flex items-center gap-2 hover:text-blue-400"
                >
                  <span className="prison-font">{player.username}</span>
                </button>
              </div>
              <div className="text-right text-yellow-400 prison-font">{player.stats.points || 0} points</div>
              <div className="text-right text-red-400">{player.stats.damageDealt}</div>
              <div className="text-right text-blue-400">{player.stats.damageTaken}</div>
              <div className="text-right text-red-500 prison-font">{player.stats.kills}</div>
              <div className="text-right text-gray-400">{player.stats.deaths}</div>
            </div>
          ))}

          {loading && (
            <div className="text-center text-gray-500 py-12">
              <Trophy size={48} className="mx-auto mb-4 opacity-20 animate-pulse" />
              <p className="text-xl prison-font">Chargement du classement...</p>
            </div>
          )}

          {!loading && rankings.length === 0 && (
            <div className="text-center text-gray-500 py-12">
              <Trophy size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-xl prison-font">Aucun joueur classé</p>
            </div>
          )}
        </div>

        {selectedPlayer && playerDetails && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl prison-font mb-6 flex items-center gap-2">
              <User className="text-blue-400" />
              Casier judiciaire
            </h2>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg prison-font mb-4 text-red-400">Meurtres</h3>
                <div className="space-y-3">
                  {playerDetails.kills.map((kill, index) => (
                    <div key={index} className="bg-gray-900/50 p-3 rounded-lg">
                      <div className="text-sm text-gray-300">{kill.victim}</div>
                      <div className="text-xs text-gray-500 mt-1">{kill.method}</div>
                      <div className="text-xs text-gray-600 mt-1">{new Date(kill.date).toLocaleDateString()}</div>
                    </div>
                  ))}
                  {playerDetails.kills.length === 0 && (
                    <div className="text-gray-500 text-sm">Aucun meurtre</div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg prison-font mb-4 text-gray-400">Décès</h3>
                <div className="space-y-3">
                  {playerDetails.deaths.map((death, index) => (
                    <div key={index} className="bg-gray-900/50 p-3 rounded-lg">
                      <div className="text-sm text-gray-300">Tué par {death.killer}</div>
                      <div className="text-xs text-gray-500 mt-1">{death.method}</div>
                      <div className="text-xs text-gray-600 mt-1">{new Date(death.date).toLocaleDateString()}</div>
                    </div>
                  ))}
                  {playerDetails.deaths.length === 0 && (
                    <div className="text-gray-500 text-sm">Aucun décès</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
