import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  where,
  updateDoc,
  doc,
  serverTimestamp,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../config/firebase';
import { LeaderboardEntry } from '../types/user';

class FirebaseLeaderboardManager {
  private isInitialized = false;
  private isOnline = true;
  private userId: string | null = null;
  private unsubscribeLeaderboard: (() => void) | null = null;
  private cachedLeaderboard: LeaderboardEntry[] = [];

  constructor() {
    this.initializeAuth();
  }

  // Initialize anonymous authentication
  private async initializeAuth(): Promise<void> {
    try {
      // Listen for auth state changes
      onAuthStateChanged(auth, (user) => {
        if (user) {
          this.userId = user.uid;
          this.isInitialized = true;
          console.log('Firebase Auth: User signed in anonymously', user.uid);
        } else {
          // Sign in anonymously if not signed in
          signInAnonymously(auth).catch((error) => {
            console.error('Firebase Auth Error:', error);
            this.isOnline = false;
          });
        }
      });
    } catch (error) {
      console.error('Firebase initialization error:', error);
      this.isOnline = false;
    }
  }

  // Submit score to Firestore
  async submitScore(
    username: string,
    score: number
  ): Promise<{ rank: number; isNewHighScore: boolean }> {
    if (!this.isOnline || !this.userId) {
      console.warn('Firebase offline, skipping score submission');
      return { rank: 999, isNewHighScore: false };
    }

    try {
      // Check if user already has a score
      const leaderboardRef = collection(db, 'leaderboard');
      const userQuery = query(
        leaderboardRef,
        where('userId', '==', this.userId)
      );
      const userSnapshot = await getDocs(userQuery);

      let isNewHighScore = false;

      if (!userSnapshot.empty) {
        // User exists, update if new score is higher
        const userDoc = userSnapshot.docs[0];
        const existingScore = userDoc.data().score;

        if (score > existingScore) {
          await updateDoc(doc(db, 'leaderboard', userDoc.id), {
            score,
            username,
            timestamp: serverTimestamp(),
          });
          isNewHighScore = true;
        }
      } else {
        // New user, add to leaderboard
        await addDoc(leaderboardRef, {
          userId: this.userId,
          username,
          score,
          timestamp: serverTimestamp(),
        });
        isNewHighScore = true;
      }

      // Get user's rank
      const rank = await this.getUserRank(username);

      return { rank, isNewHighScore };
    } catch (error) {
      console.error('Error submitting score:', error);
      this.isOnline = false;
      return { rank: 999, isNewHighScore: false };
    }
  }

  // Get global leaderboard (top N entries)
  async getGlobalLeaderboard(limitCount: number = 100): Promise<LeaderboardEntry[]> {
    if (!this.isOnline) {
      console.warn('Firebase offline, returning cached leaderboard');
      return this.cachedLeaderboard;
    }

    try {
      const leaderboardRef = collection(db, 'leaderboard');
      const topQuery = query(
        leaderboardRef,
        orderBy('score', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(topQuery);
      const leaderboard: LeaderboardEntry[] = [];

      let index = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        leaderboard.push({
          rank: index + 1,
          username: data.username,
          score: data.score,
          timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
        });
        index++;
      });

      this.cachedLeaderboard = leaderboard;
      return leaderboard;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      this.isOnline = false;
      return this.cachedLeaderboard;
    }
  }

  // Get user's rank
  async getUserRank(username: string): Promise<number> {
    if (!this.isOnline) {
      return 0;
    }

    try {
      const leaderboardRef = collection(db, 'leaderboard');
      const allQuery = query(leaderboardRef, orderBy('score', 'desc'));
      const snapshot = await getDocs(allQuery);

      let rank = 0;
      let index = 0;
      snapshot.forEach((doc) => {
        if (doc.data().username === username) {
          rank = index + 1;
        }
        index++;
      });

      return rank;
    } catch (error) {
      console.error('Error getting user rank:', error);
      return 0;
    }
  }

  // Subscribe to real-time leaderboard updates
  subscribeToLeaderboard(
    limitCount: number = 100,
    callback: (leaderboard: LeaderboardEntry[]) => void
  ): () => void {
    if (!this.isOnline) {
      console.warn('Firebase offline, cannot subscribe to leaderboard');
      callback(this.cachedLeaderboard);
      return () => {};
    }

    try {
      const leaderboardRef = collection(db, 'leaderboard');
      const topQuery = query(
        leaderboardRef,
        orderBy('score', 'desc'),
        limit(limitCount)
      );

      this.unsubscribeLeaderboard = onSnapshot(topQuery, (snapshot: QuerySnapshot<DocumentData>) => {
        const leaderboard: LeaderboardEntry[] = [];

        let index = 0;
        snapshot.forEach((doc) => {
          const data = doc.data();
          leaderboard.push({
            rank: index + 1,
            username: data.username,
            score: data.score,
            timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
          });
          index++;
        });

        this.cachedLeaderboard = leaderboard;
        callback(leaderboard);
      });

      return this.unsubscribeLeaderboard;
    } catch (error) {
      console.error('Error subscribing to leaderboard:', error);
      this.isOnline = false;
      callback(this.cachedLeaderboard);
      return () => {};
    }
  }

  // Unsubscribe from leaderboard updates
  unsubscribe(): void {
    if (this.unsubscribeLeaderboard) {
      this.unsubscribeLeaderboard();
      this.unsubscribeLeaderboard = null;
    }
  }

  // Check if Firebase is online
  isFirebaseOnline(): boolean {
    return this.isOnline && this.isInitialized;
  }
}

export const firebaseLeaderboardManager = new FirebaseLeaderboardManager();
