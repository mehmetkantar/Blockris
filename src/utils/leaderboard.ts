import { LeaderboardEntry } from '../types/user';
import { firebaseLeaderboardManager } from './firebaseLeaderboard';

// Mock leaderboard data (fallback when offline)
const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, username: 'TetrisKing', score: 15420, timestamp: new Date().toISOString() },
  { rank: 2, username: 'PuzzleMaster', score: 14850, timestamp: new Date().toISOString() },
  { rank: 3, username: 'BlockBuster', score: 13920, timestamp: new Date().toISOString() },
  { rank: 4, username: 'GamerPro', score: 12750, timestamp: new Date().toISOString() },
  { rank: 5, username: 'ComboQueen', score: 12100, timestamp: new Date().toISOString() },
  { rank: 6, username: 'GridMaster', score: 11500, timestamp: new Date().toISOString() },
  { rank: 7, username: 'ScoreHunter', score: 10890, timestamp: new Date().toISOString() },
  { rank: 8, username: 'PiecePlayer', score: 9420, timestamp: new Date().toISOString() },
  { rank: 9, username: 'HighScorer', score: 8750, timestamp: new Date().toISOString() },
  { rank: 10, username: 'TopGamer', score: 8100, timestamp: new Date().toISOString() },
];

class LeaderboardManager {
  private leaderboardData: LeaderboardEntry[] = [];
  private useFirebase = true;

  constructor() {
    this.loadLeaderboard();
    // Try to use Firebase, fallback to localStorage if offline
    this.checkFirebaseConnection();
  }

  // Check if Firebase is available
  private async checkFirebaseConnection(): Promise<void> {
    try {
      // Wait a bit for Firebase to initialize
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.useFirebase = firebaseLeaderboardManager.isFirebaseOnline();
      if (this.useFirebase) {
        console.log('✅ Firebase connected - using cloud leaderboard');
      } else {
        console.log('⚠️ Firebase offline - using local leaderboard');
      }
    } catch (error) {
      console.error('Firebase connection check failed:', error);
      this.useFirebase = false;
    }
  }

  // Load leaderboard from localStorage (or mock data)
  private loadLeaderboard(): void {
    try {
      const stored = localStorage.getItem('blockris_leaderboard');
      if (stored) {
        this.leaderboardData = JSON.parse(stored);
      } else {
        // First time, use mock data
        this.leaderboardData = [...MOCK_LEADERBOARD];
        this.saveLeaderboard();
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      this.leaderboardData = [...MOCK_LEADERBOARD];
    }
  }

  // Save leaderboard to localStorage
  private saveLeaderboard(): void {
    try {
      localStorage.setItem('blockris_leaderboard', JSON.stringify(this.leaderboardData));
    } catch (error) {
      console.error('Error saving leaderboard:', error);
    }
  }

  // Get global leaderboard (top N entries)
  async getGlobalLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
    if (this.useFirebase) {
      try {
        const firebaseLeaderboard = await firebaseLeaderboardManager.getGlobalLeaderboard(limit);
        // Update local cache
        this.leaderboardData = firebaseLeaderboard;
        this.saveLeaderboard();
        return firebaseLeaderboard;
      } catch (error) {
        console.error('Firebase error, falling back to localStorage:', error);
        this.useFirebase = false;
      }
    }

    // Fallback to localStorage
    return this.leaderboardData
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  }

  // Submit score to leaderboard
  async submitScore(username: string, score: number): Promise<{ rank: number; isNewHighScore: boolean }> {
    // Always save to localStorage first (fallback)
    const localResult = this.submitScoreLocal(username, score);

    // Try Firebase
    if (this.useFirebase) {
      try {
        const firebaseResult = await firebaseLeaderboardManager.submitScore(username, score);
        return firebaseResult;
      } catch (error) {
        console.error('Firebase submit error, using local result:', error);
        this.useFirebase = false;
        return localResult;
      }
    }

    return localResult;
  }

  // Submit score to localStorage (fallback)
  private submitScoreLocal(username: string, score: number): { rank: number; isNewHighScore: boolean } {
    const existingIndex = this.leaderboardData.findIndex(
      entry => entry.username === username
    );

    let isNewHighScore = false;

    if (existingIndex >= 0) {
      if (score > this.leaderboardData[existingIndex].score) {
        this.leaderboardData[existingIndex].score = score;
        this.leaderboardData[existingIndex].timestamp = new Date().toISOString();
        isNewHighScore = true;
      }
    } else {
      this.leaderboardData.push({
        rank: 0,
        username,
        score,
        timestamp: new Date().toISOString(),
      });
      isNewHighScore = true;
    }

    this.leaderboardData.sort((a, b) => b.score - a.score);
    this.leaderboardData.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    this.saveLeaderboard();

    const userEntry = this.leaderboardData.find(
      entry => entry.username === username
    );

    return {
      rank: userEntry?.rank || 999,
      isNewHighScore,
    };
  }

  // Get user's rank
  async getUserRank(username: string): Promise<number> {
    if (this.useFirebase) {
      try {
        return await firebaseLeaderboardManager.getUserRank(username);
      } catch (error) {
        console.error('Firebase error getting rank:', error);
        this.useFirebase = false;
      }
    }

    const entry = this.leaderboardData.find(
      entry => entry.username === username
    );
    return entry?.rank || 0;
  }

  // Clear leaderboard (for testing)
  clearLeaderboard(): void {
    this.leaderboardData = [...MOCK_LEADERBOARD];
    this.saveLeaderboard();
  }
}

export const leaderboardManager = new LeaderboardManager();
