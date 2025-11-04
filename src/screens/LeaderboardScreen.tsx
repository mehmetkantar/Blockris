import { useState, useEffect } from 'react';
import { LeaderboardEntry, UserData } from '../types/user';
import { leaderboardManager, COUNTRIES } from '../utils/leaderboard';

interface LeaderboardScreenProps {
  userData: UserData;
  onBack: () => void;
}

function LeaderboardScreen({ userData, onBack }: LeaderboardScreenProps) {
  const [tab, setTab] = useState<'global' | 'country'>('global');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (tab === 'global') {
      setLeaderboard(leaderboardManager.getGlobalLeaderboard(100));
    } else {
      setLeaderboard(leaderboardManager.getCountryLeaderboard(userData.country, 100));
    }
  }, [tab, userData.country]);

  const selectedCountry = COUNTRIES.find(c => c.code === userData.country);
  const userRank = leaderboardManager.getUserRank(userData.username, userData.country);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800 flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg font-medium hover:bg-white/30 transition-all"
        >
          ← Geri
        </button>
        <h1 className="text-3xl font-bold text-white">🏆 Lider Tablosu</h1>
        <div className="w-20"></div> {/* Spacer */}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('global')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${
            tab === 'global'
              ? 'bg-white text-purple-600 shadow-lg'
              : 'bg-white/20 text-white hover:bg-white/30'
          }`}
        >
          🌍 Genel
        </button>
        <button
          onClick={() => setTab('country')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
            tab === 'country'
              ? 'bg-white text-purple-600 shadow-lg'
              : 'bg-white/20 text-white hover:bg-white/30'
          }`}
        >
          <span className="text-xl">{selectedCountry?.flag}</span>
          {selectedCountry?.name}
        </button>
      </div>

      {/* User's Rank Card */}
      {userRank > 0 && (
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-4 mb-4 shadow-lg">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold">#{userRank}</div>
              <div>
                <div className="font-bold">{userData.username}</div>
                <div className="text-sm text-white/80">{tab === 'country' ? 'Ülke Sıralaması' : 'Global Sıralama'}</div>
              </div>
            </div>
            <div className="text-2xl font-bold">{userData.highScore.toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Leaderboard List */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border-2 border-white/20 overflow-hidden flex-1">
        <div className="max-h-full overflow-y-auto">
          {leaderboard.length === 0 ? (
            <div className="text-center text-white/70 py-12">
              <div className="text-4xl mb-2">🏁</div>
              <div>Henüz skor yok</div>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {leaderboard.map((entry, index) => (
                <div
                  key={`${entry.username}-${entry.timestamp}`}
                  className={`flex items-center justify-between p-4 ${
                    entry.username === userData.username && entry.country === userData.country
                      ? 'bg-white/20'
                      : 'hover:bg-white/5'
                  } transition-colors`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    {/* Rank */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-yellow-400 text-yellow-900' :
                      index === 1 ? 'bg-gray-300 text-gray-800' :
                      index === 2 ? 'bg-orange-400 text-orange-900' :
                      'bg-white/20 text-white'
                    }`}>
                      {index < 3 ? ['👑', '🥈', '🥉'][index] : entry.rank}
                    </div>

                    {/* User Info */}
                    <div className="flex-1">
                      <div className="text-white font-bold">{entry.username}</div>
                      <div className="text-white/60 text-sm flex items-center gap-1">
                        <span>{COUNTRIES.find(c => c.code === entry.country)?.flag}</span>
                        <span>{COUNTRIES.find(c => c.code === entry.country)?.name}</span>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <div className="text-white font-bold text-xl">{entry.score.toLocaleString()}</div>
                      <div className="text-white/60 text-xs">puan</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LeaderboardScreen;
