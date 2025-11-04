// User and App State Types

export type ScreenType = 'start' | 'game' | 'leaderboard' | 'shop';

export interface UserData {
  username: string;
  country: string; // ISO country code
  shareLocation: boolean;
  weeklyCoins: number;
  monthlyCoins: number;
  highScore: number;
  lastLoginDate: string; // ISO date string
  consecutiveDays: number;
  settings: UserSettings;
}

export interface UserSettings {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  country: string;
  score: number;
  timestamp: string;
}

export interface DailyReward {
  day: number;
  weeklyCoins: number;
  monthlyCoins: number;
  claimed: boolean;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  weeklyCoins?: number;
  monthlyCoins?: number;
  price: number; // In real money (cents)
  currency: 'USD' | 'EUR' | 'TRY';
}

export const DEFAULT_USER_DATA: UserData = {
  username: 'Player',
  country: 'TR', // Default Turkey
  shareLocation: false,
  weeklyCoins: 100, // Starting coins
  monthlyCoins: 50,
  highScore: 0,
  lastLoginDate: '',
  consecutiveDays: 0,
  settings: {
    soundEnabled: true,
    hapticsEnabled: true,
  },
};

// Daily login rewards progression
export const DAILY_REWARDS: DailyReward[] = [
  { day: 1, weeklyCoins: 10, monthlyCoins: 5, claimed: false },
  { day: 2, weeklyCoins: 15, monthlyCoins: 5, claimed: false },
  { day: 3, weeklyCoins: 20, monthlyCoins: 10, claimed: false },
  { day: 4, weeklyCoins: 25, monthlyCoins: 10, claimed: false },
  { day: 5, weeklyCoins: 30, monthlyCoins: 15, claimed: false },
  { day: 6, weeklyCoins: 40, monthlyCoins: 20, claimed: false },
  { day: 7, weeklyCoins: 50, monthlyCoins: 25, claimed: false },
];
