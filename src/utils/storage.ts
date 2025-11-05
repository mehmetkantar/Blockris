import { UserData, DEFAULT_USER_DATA } from '../types/user';
import { GameState } from '../types/game';

const STORAGE_KEYS = {
  USER_DATA: 'blockris_user_data',
  HIGH_SCORES: 'blockris_high_scores',
  GAME_STATE: 'blockris_game_state',
};

class StorageManager {
  // Load user data from localStorage
  loadUserData(): UserData {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
    return { ...DEFAULT_USER_DATA };
  }

  // Save user data to localStorage
  saveUserData(userData: UserData): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }

  // Update high score if current score is higher
  updateHighScore(score: number): boolean {
    const userData = this.loadUserData();
    if (score > userData.highScore) {
      userData.highScore = score;
      this.saveUserData(userData);
      return true; // New high score!
    }
    return false;
  }

  // Check and claim daily login reward
  checkDailyLogin(): { isNewDay: boolean; reward?: { weeklyCoins: number; monthlyCoins: number }; consecutiveDays: number } {
    const userData = this.loadUserData();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const lastLogin = userData.lastLoginDate;

    if (lastLogin === today) {
      // Already logged in today
      return { isNewDay: false, consecutiveDays: userData.consecutiveDays };
    }

    // Check if it's consecutive day
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let consecutiveDays = 1;
    if (lastLogin === yesterdayStr) {
      // Consecutive login
      consecutiveDays = Math.min(userData.consecutiveDays + 1, 7);
    }

    // Calculate reward (day 1-7 cycle)
    const dayInCycle = consecutiveDays;
    const rewards = [
      { weeklyCoins: 10, monthlyCoins: 5 },   // Day 1
      { weeklyCoins: 15, monthlyCoins: 5 },   // Day 2
      { weeklyCoins: 20, monthlyCoins: 10 },  // Day 3
      { weeklyCoins: 25, monthlyCoins: 10 },  // Day 4
      { weeklyCoins: 30, monthlyCoins: 15 },  // Day 5
      { weeklyCoins: 40, monthlyCoins: 20 },  // Day 6
      { weeklyCoins: 50, monthlyCoins: 25 },  // Day 7
    ];

    const reward = rewards[dayInCycle - 1];

    // Update user data
    userData.lastLoginDate = today;
    userData.consecutiveDays = consecutiveDays;
    userData.weeklyCoins += reward.weeklyCoins;
    userData.monthlyCoins += reward.monthlyCoins;
    this.saveUserData(userData);

    return { isNewDay: true, reward, consecutiveDays };
  }

  // Deduct coins (for shop purchases, etc.)
  deductCoins(weeklyAmount: number = 0, monthlyAmount: number = 0): boolean {
    const userData = this.loadUserData();

    if (userData.weeklyCoins >= weeklyAmount && userData.monthlyCoins >= monthlyAmount) {
      userData.weeklyCoins -= weeklyAmount;
      userData.monthlyCoins -= monthlyAmount;
      this.saveUserData(userData);
      return true;
    }

    return false; // Not enough coins
  }

  // Add coins (for purchases)
  addCoins(weeklyAmount: number = 0, monthlyAmount: number = 0): void {
    const userData = this.loadUserData();
    userData.weeklyCoins += weeklyAmount;
    userData.monthlyCoins += monthlyAmount;
    this.saveUserData(userData);
  }

  // Update user settings
  updateSettings(settings: Partial<UserData['settings']>): void {
    const userData = this.loadUserData();
    userData.settings = { ...userData.settings, ...settings };
    this.saveUserData(userData);
  }

  // Update username
  updateUsername(username: string): void {
    const userData = this.loadUserData();
    userData.username = username;
    this.saveUserData(userData);
  }

  // Save game state
  saveGameState(gameState: GameState): void {
    try {
      localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(gameState));
    } catch (error) {
      console.error('Error saving game state:', error);
    }
  }

  // Load game state
  loadGameState(): GameState | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.GAME_STATE);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading game state:', error);
    }
    return null;
  }

  // Clear saved game state
  clearGameState(): void {
    localStorage.removeItem(STORAGE_KEYS.GAME_STATE);
  }

  // Clear all data (for testing/reset)
  clearAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    localStorage.removeItem(STORAGE_KEYS.HIGH_SCORES);
    localStorage.removeItem(STORAGE_KEYS.GAME_STATE);
  }
}

export const storageManager = new StorageManager();
