import { useState, useEffect } from 'react';
import { UserData } from '../types/user';
import { storageManager } from '../utils/storage';
import { COUNTRIES } from '../utils/leaderboard';

interface StartScreenProps {
  userData: UserData;
  onStartGame: () => void;
  onOpenLeaderboard: () => void;
  onOpenShop: () => void;
  onUpdateSettings: (settings: Partial<UserData['settings']>) => void;
  onUpdateCountry: (country: string) => void;
}

function StartScreen({
  userData,
  onStartGame,
  onOpenLeaderboard,
  onOpenShop,
  onUpdateSettings,
  onUpdateCountry,
}: StartScreenProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showCountrySelect, setShowCountrySelect] = useState(false);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [dailyReward, setDailyReward] = useState<{ weeklyCoins: number; monthlyCoins: number } | null>(null);
  const [consecutiveDays, setConsecutiveDays] = useState(0);

  // Check for daily login reward on mount
  useEffect(() => {
    const loginResult = storageManager.checkDailyLogin();
    if (loginResult.isNewDay && loginResult.reward) {
      setDailyReward(loginResult.reward);
      setConsecutiveDays(loginResult.consecutiveDays);
      setShowDailyReward(true);
    }
  }, []);

  const selectedCountry = COUNTRIES.find(c => c.code === userData.country) || COUNTRIES[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Logo / Title */}
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-2 drop-shadow-lg">
            Blockris
          </h1>
          <p className="text-white/80 text-lg">Modern Puzzle Challenge</p>
        </div>

        {/* Coins Display */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border-2 border-white/20">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-yellow-300 text-sm font-medium mb-1">Haftalık</div>
              <div className="text-3xl font-bold text-white">{userData.weeklyCoins}</div>
              <div className="text-white/60 text-xs">Coin</div>
            </div>
            <div className="text-center">
              <div className="text-blue-300 text-sm font-medium mb-1">Aylık</div>
              <div className="text-3xl font-bold text-white">{userData.monthlyCoins}</div>
              <div className="text-white/60 text-xs">Coin</div>
            </div>
          </div>
        </div>

        {/* High Score */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border-2 border-white/20 text-center">
          <div className="text-white/70 text-sm mb-1">En Yüksek Skor</div>
          <div className="text-4xl font-bold text-white">{userData.highScore.toLocaleString()}</div>
        </div>

        {/* Main Buttons */}
        <div className="space-y-3">
          <button
            onClick={onStartGame}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-6 rounded-xl font-bold text-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all active:scale-95"
          >
            🎮 Oyna
          </button>

          <button
            onClick={onOpenLeaderboard}
            className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 px-6 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all active:scale-95"
          >
            🏆 Lider Tablosu
          </button>

          <button
            onClick={onOpenShop}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 px-6 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all active:scale-95"
          >
            🛒 Dükkan
          </button>
        </div>

        {/* Bottom Row - Settings & Country */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex-1 bg-white/20 backdrop-blur-md text-white py-3 px-4 rounded-xl font-medium shadow-lg hover:bg-white/30 transition-all"
          >
            ⚙️ Ayarlar
          </button>

          <button
            onClick={() => setShowCountrySelect(!showCountrySelect)}
            className="flex-1 bg-white/20 backdrop-blur-md text-white py-3 px-4 rounded-xl font-medium shadow-lg hover:bg-white/30 transition-all flex items-center justify-center gap-2"
          >
            <span className="text-2xl">{selectedCountry.flag}</span>
            <span>{selectedCountry.code}</span>
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border-2 border-white/20 space-y-3 animate-in slide-in-from-top">
            <h3 className="text-white font-bold text-lg mb-3">Ayarlar</h3>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-white font-medium">🔊 Ses</span>
              <input
                type="checkbox"
                checked={userData.settings.soundEnabled}
                onChange={(e) => onUpdateSettings({ soundEnabled: e.target.checked })}
                className="w-12 h-6 rounded-full appearance-none bg-white/30 checked:bg-green-500 relative cursor-pointer transition-colors
                         before:content-[''] before:absolute before:w-5 before:h-5 before:rounded-full before:bg-white before:top-0.5 before:left-0.5
                         before:transition-transform checked:before:translate-x-6"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-white font-medium">📳 Titreşim</span>
              <input
                type="checkbox"
                checked={userData.settings.hapticsEnabled}
                onChange={(e) => onUpdateSettings({ hapticsEnabled: e.target.checked })}
                className="w-12 h-6 rounded-full appearance-none bg-white/30 checked:bg-green-500 relative cursor-pointer transition-colors
                         before:content-[''] before:absolute before:w-5 before:h-5 before:rounded-full before:bg-white before:top-0.5 before:left-0.5
                         before:transition-transform checked:before:translate-x-6"
              />
            </label>
          </div>
        )}

        {/* Country Selection */}
        {showCountrySelect && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border-2 border-white/20 max-h-64 overflow-y-auto animate-in slide-in-from-top">
            <h3 className="text-white font-bold text-lg mb-3 sticky top-0 bg-purple-600/50 backdrop-blur-sm py-2">Ülke Seçin</h3>
            <div className="space-y-2">
              {COUNTRIES.map((country) => (
                <button
                  key={country.code}
                  onClick={() => {
                    onUpdateCountry(country.code);
                    setShowCountrySelect(false);
                  }}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                    country.code === userData.country
                      ? 'bg-white/30 text-white font-bold'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  <span className="text-2xl mr-3">{country.flag}</span>
                  {country.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Daily Reward Modal */}
        {showDailyReward && dailyReward && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl animate-in zoom-in">
              <h2 className="text-3xl font-bold text-white mb-2">Günlük Ödül!</h2>
              <p className="text-white/90 mb-4">Gün {consecutiveDays} 🎉</p>

              <div className="bg-white/20 rounded-2xl p-4 mb-4">
                <div className="text-yellow-200 text-lg font-bold mb-2">+{dailyReward.weeklyCoins} Haftalık Coin</div>
                <div className="text-blue-200 text-lg font-bold">+{dailyReward.monthlyCoins} Aylık Coin</div>
              </div>

              <button
                onClick={() => setShowDailyReward(false)}
                className="bg-white text-orange-600 font-bold py-3 px-8 rounded-xl hover:bg-white/90 transition-all"
              >
                Harika!
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StartScreen;
