# Blockris - Kalan İşler

## Kritik (Oyun çalışması için gerekli)

### 1. App.tsx Navigation Wrapper
**Dosya:** `src/App.tsx` (yeniden oluşturulmalı)

```typescript
// Ana wrapper - ekran yönetimi yapacak
import { useState, useEffect } from 'react';
import StartScreen from './screens/StartScreen';
import GameScreen from './screens/GameScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import ShopScreen from './screens/ShopScreen';
import { ScreenType, UserData } from './types/user';
import { storageManager } from './utils/storage';

function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('start');
  const [userData, setUserData] = useState<UserData>(storageManager.loadUserData());

  // Render screens based on currentScreen state
  // ...
}
```

### 2. GameScreen.tsx Son Düzenlemeler
**Dosya:** `src/screens/GameScreen.tsx`

Eklenecekler:
- Game over durumunda `onGameOver(gameState.score)` callback çağır
- Her oyun hamlesi sonrası `storageManager.saveGameState(gameState)`
- Exit butonu ekle, `onExitGame()` callback
- `export default GameScreen;` ekle (şu an App olarak export ediliyor)

### 3. Game State Temizleme
Game over'da veya yeni oyun başladığında:
```typescript
storageManager.clearGameState();
```

### 4. Leaderboard Submit Integration
Game over modalinde:
```typescript
import { leaderboardManager } from '../utils/leaderboard';

// Game over olduğunda
leaderboardManager.submitScore(userData.username, userData.country, finalScore);
storageManager.updateHighScore(finalScore);
```

### 5. Settings Apply
User ayarlarını oyuna uygula:
```typescript
// Ses ayarı
soundManager.setMuted(!userData.settings.soundEnabled);

// Haptic ayarı (utils/haptics.ts'e ekle)
hapticsManager.setEnabled(userData.settings.hapticsEnabled);
```

---

## Orta Öncelik

### 6. Haptics Enable/Disable
**Dosya:** `src/utils/haptics.ts`

```typescript
class HapticsManager {
  private isEnabled: boolean = true;

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  async light() {
    if (!this.isSupported || !this.isEnabled) return;
    // ...
  }
}
```

### 7. Resume Game Özelliği
StartScreen'de kaydedilmiş oyun varsa:
```typescript
const savedGame = storageManager.loadGameState();
if (savedGame && !savedGame.isGameOver) {
  // "Devam Et" butonu göster
}
```

### 8. Backend Integration (Optional)
Firebase kullanmak için:
```bash
npm install firebase
```

Sonra `BACKEND_PLAN.md` dokümandaki adımları takip et.

---

## Düşük Öncelik (Nice to Have)

### 9. Animasyonlar
- Satır/sütun temizlenirken fade-out
- Coin kazanıldığında parti effect
- Combo artışında shake effect

### 10. Analytics
```bash
npm install @capacitor/google-analytics
```

### 11. In-App Purchases (Gerçek Para)
```bash
npm install @capacitor-community/in-app-purchases
```

ShopScreen'deki placeholder purchase fonksiyonunu gerçek IAP ile değiştir.

### 12. Admob Entegrasyonu
```bash
npm install @capacitor-community/admob
```

---

## Test Checklist

- [ ] Ana ekranda coin miktarları görünüyor
- [ ] Ayarlar çalışıyor (ses/haptic)
- [ ] Ülke seçimi çalışıyor
- [ ] Günlük giriş ödülü veriliyor (ikinci açılışta)
- [ ] Oyun başlatılıyor
- [ ] Oyun state kaydediliyor (çıkıp girildiğinde devam ediyor)
- [ ] Game over olunca high score günceleniyor
- [ ] Leaderboard'a skor gönderiliyor
- [ ] Leaderboard'da global ve ülke sıralaması görünüyor
- [ ] Dükkan açılıyor
- [ ] Coin satın alma simüle ediliyor

---

## Hızlı Başlangıç Kodları

### Ana App.tsx Template
```typescript
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
    // Ayarları uygula
    soundManager.setMuted(!userData.settings.soundEnabled);
    setCurrentScreen('game');
  };

  const handleGameOver = (finalScore: number) => {
    // High score güncelle
    const isNewHigh = storageManager.updateHighScore(finalScore);

    // Leaderboard'a submit et
    leaderboardManager.submitScore(
      userData.username,
      userData.country,
      finalScore
    );

    // Game state temizle
    storageManager.clearGameState();
    setSavedGameState(null);

    // Ana ekrana dön
    setCurrentScreen('start');

    // UserData'yı yeniden yükle (high score güncellenmiş olacak)
    setUserData(storageManager.loadUserData());
  };

  const handleExitGame = () => {
    // Oyun state'i zaten kaydedilmiş olmalı
    setCurrentScreen('start');
  };

  const handleUpdateSettings = (settings: Partial<UserData['settings']>) => {
    storageManager.updateSettings(settings);
    setUserData(storageManager.loadUserData());
  };

  const handleUpdateCountry = (country: string) => {
    storageManager.updateCountry(country);
    setUserData(storageManager.loadUserData());
  };

  const handlePurchase = () => {
    // Refresh userData after purchase
    setUserData(storageManager.loadUserData());
  };

  return (
    <>
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
    </>
  );
}

export default App;
```

Bu kodu `src/App.tsx` olarak kaydet ve önceki App.tsx silinmiş olmalı (şu an GameScreen.tsx olarak kopyalandı).
