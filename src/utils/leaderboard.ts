import { LeaderboardEntry } from '../types/user';

// Mock leaderboard data (in production, this would be from a backend API)
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

  constructor() {
    this.loadLeaderboard();
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
  getGlobalLeaderboard(limit: number = 100): LeaderboardEntry[] {
    return this.leaderboardData
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  }

  // Submit score to leaderboard
  submitScore(username: string, score: number): { rank: number; isNewHighScore: boolean } {
    // Find if user already has a score
    const existingIndex = this.leaderboardData.findIndex(
      entry => entry.username === username
    );

    let isNewHighScore = false;

    if (existingIndex >= 0) {
      // Update if new score is higher
      if (score > this.leaderboardData[existingIndex].score) {
        this.leaderboardData[existingIndex].score = score;
        this.leaderboardData[existingIndex].timestamp = new Date().toISOString();
        isNewHighScore = true;
      }
    } else {
      // New entry
      this.leaderboardData.push({
        rank: 0, // Will be recalculated
        username,
        score,
        timestamp: new Date().toISOString(),
      });
      isNewHighScore = true;
    }

    // Sort and update ranks
    this.leaderboardData.sort((a, b) => b.score - a.score);
    this.leaderboardData.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    this.saveLeaderboard();

    // Find user's rank
    const userEntry = this.leaderboardData.find(
      entry => entry.username === username
    );

    return {
      rank: userEntry?.rank || 999,
      isNewHighScore,
    };
  }

  // Get user's rank
  getUserRank(username: string): number {
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
