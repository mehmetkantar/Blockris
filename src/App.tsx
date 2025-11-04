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

  const handleGameOver = (finalScore: number) => {
    // Update high score
    const isNewHigh = storageManager.updateHighScore(finalScore);

    // Submit to leaderboard
    leaderboardManager.submitScore(
      userData.username,
      userData.country,
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

  const handleUpdateCountry = (country: string) => {
    storageManager.updateCountry(country);
    setUserData(storageManager.loadUserData());
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
          onUpdateCountry={handleUpdateCountry}
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
    </div>
  );
}

export default App;
