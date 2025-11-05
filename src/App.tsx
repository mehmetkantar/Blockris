import { useState, useEffect } from 'react';
import StartScreen from './screens/StartScreen';
import GameScreen from './screens/GameScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import ShopScreen from './screens/ShopScreen';
import { ScreenType, UserData } from './types/user';
import { storageManager } from './utils/storage';
import { leaderboardManager } from './utils/leaderboard';
import { soundManager } from './utils/sounds';
import { hapticsManager } from './utils/haptics';

function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('start');
  const [userData, setUserData] = useState<UserData>(storageManager.loadUserData());
  const [savedGameState, setSavedGameState] = useState(storageManager.loadGameState());
  const [showUsernameModal, setShowUsernameModal] = useState(!userData.username);
  const [usernameInput, setUsernameInput] = useState('');

  useEffect(() => {
    soundManager.init();
    hapticsManager.init();
  }, []);

  const handleStartGame = () => {
    // Apply user settings
    soundManager.setMuted(!userData.settings.soundEnabled);
    hapticsManager.setEnabled(userData.settings.hapticsEnabled);
    setCurrentScreen('game');
  };

  const handleGameOver = async (finalScore: number) => {
    // Update high score
    const isNewHigh = storageManager.updateHighScore(finalScore);

    // Submit to leaderboard (Firebase + localStorage)
    await leaderboardManager.submitScore(
      userData.username,
      finalScore
    );

    // Clear saved game state
    storageManager.clearGameState();
    setSavedGameState(null);

    // Return to start screen
    setCurrentScreen('start');

    // Reload user data (high score updated)
    setUserData(storageManager.loadUserData());

    // Show new high score message if applicable
    if (isNewHigh) {
      setTimeout(() => {
        alert(`🎉 Yeni Rekor! ${finalScore} puan`);
      }, 500);
    }
  };

  const handleExitGame = () => {
    // Game state is auto-saved, just return to start
    setCurrentScreen('start');
    setSavedGameState(storageManager.loadGameState());
  };

  const handleUpdateSettings = (settings: Partial<UserData['settings']>) => {
    storageManager.updateSettings(settings);
    setUserData(storageManager.loadUserData());
    // Apply settings immediately
    soundManager.setMuted(!settings.soundEnabled);
    hapticsManager.setEnabled(!!settings.hapticsEnabled);
  };

  const handleUpdateUsername = (username: string) => {
    storageManager.updateUsername(username);
    setUserData(storageManager.loadUserData());
  };

  const handleUsernameModalSubmit = () => {
    if (usernameInput.trim()) {
      handleUpdateUsername(usernameInput.trim());
      setShowUsernameModal(false);
    }
  };

  const handlePurchase = () => {
    // Refresh user data after purchase
    setUserData(storageManager.loadUserData());
  };

  return (
    <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800 min-h-screen">
      {currentScreen === 'start' && (
        <StartScreen
          userData={userData}
          onStartGame={handleStartGame}
          onOpenLeaderboard={() => setCurrentScreen('leaderboard')}
          onOpenShop={() => setCurrentScreen('shop')}
          onUpdateSettings={handleUpdateSettings}
          onUpdateUsername={handleUpdateUsername}
        />
      )}

      {currentScreen === 'game' && (
        <GameScreen
          userData={userData}
          savedGameState={savedGameState}
          onGameOver={handleGameOver}
          onExitGame={handleExitGame}
        />
      )}

      {currentScreen === 'leaderboard' && (
        <LeaderboardScreen
          userData={userData}
          onBack={() => setCurrentScreen('start')}
        />
      )}

      {currentScreen === 'shop' && (
        <ShopScreen
          userData={userData}
          onBack={() => setCurrentScreen('start')}
          onPurchase={handlePurchase}
        />
      )}

      {/* Username Modal - First Launch */}
      {showUsernameModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border-4 border-white/20">
            <h2 className="text-4xl font-bold text-white mb-2">🎮 Hoş Geldin!</h2>
            <p className="text-white/90 mb-6 text-lg">Oyuna başlamadan önce bir kullanıcı adı seç</p>

            <div className="mb-6">
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUsernameModalSubmit()}
                maxLength={15}
                placeholder="Kullanıcı adınız..."
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-white/90 text-purple-900 placeholder-purple-400 text-lg font-medium border-2 border-white/50 focus:border-yellow-400 outline-none"
              />
              <p className="text-white/70 text-sm mt-2">Maksimum 15 karakter</p>
            </div>

            <button
              onClick={handleUsernameModalSubmit}
              disabled={!usernameInput.trim()}
              className="w-full bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold py-4 px-6 rounded-xl text-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              Başla! 🚀
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
