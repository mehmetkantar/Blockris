# Backend API Plan for Blockris

## Overview

Production-ready backend for leaderboard, user data, and currency management.

## Technology Stack Options

### Option 1: Firebase (Recommended for MVP)
**Pros:**
- Free tier generous (100k daily reads)
- Real-time updates
- Built-in authentication
- No server management
- SDKs for web & mobile

**Cons:**
- Vendor lock-in
- Limited query capabilities

**Setup:**
```bash
npm install firebase
```

### Option 2: Supabase (PostgreSQL + REST)
**Pros:**
- Open source
- PostgreSQL (powerful queries)
- Real-time subscriptions
- Row-level security
- Free tier: 500MB DB

**Cons:**
- Learning curve
- Self-hosting complexity

### Option 3: Custom Backend (Node.js + MongoDB)
**Pros:**
- Full control
- Custom logic
- Any database

**Cons:**
- DevOps overhead
- Hosting costs
- Security responsibility

---

## Recommended: Firebase Implementation

### 1. Database Structure

```
users/
  {userId}/
    username: string
    country: string
    shareLocation: boolean
    weeklyCoins: number
    monthlyCoins: number
    highScore: number
    lastLoginDate: string
    consecutiveDays: number
    createdAt: timestamp

leaderboards/
  global/
    {userId}/
      username: string
      country: string
      score: number
      timestamp: timestamp

  countries/
    {countryCode}/
      {userId}/
        username: string
        score: number
        timestamp: timestamp

transactions/
  {userId}/
    {transactionId}/
      type: 'daily_login' | 'purchase' | 'deduct'
      weeklyCoins: number
      monthlyCoins: number
      timestamp: timestamp
```

### 2. Security Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can read/write their own data
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth.uid == userId;
    }

    // Leaderboard - read public, write authenticated
    match /leaderboards/{path=**} {
      allow read: if true;
      allow write: if request.auth != null
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.score is number
        && request.resource.data.score >= 0;
    }

    // Transactions - users can only read their own
    match /transactions/{userId}/{transactionId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId
        && request.auth != null;
    }
  }
}
```

### 3. API Functions

#### Setup Firebase
```typescript
// src/utils/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
```

#### Leaderboard Functions
```typescript
// src/utils/firebase-leaderboard.ts
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
  limit,
  where
} from 'firebase/firestore';
import { db } from './firebase';

export async function submitScore(
  userId: string,
  username: string,
  country: string,
  score: number
) {
  // Submit to global leaderboard
  await setDoc(doc(db, 'leaderboards/global', userId), {
    username,
    country,
    score,
    timestamp: new Date().toISOString(),
  });

  // Submit to country leaderboard
  await setDoc(doc(db, `leaderboards/countries/${country}`, userId), {
    username,
    score,
    timestamp: new Date().toISOString(),
  });
}

export async function getGlobalLeaderboard(limitCount = 100) {
  const q = query(
    collection(db, 'leaderboards/global'),
    orderBy('score', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc, index) => ({
    rank: index + 1,
    userId: doc.id,
    ...doc.data(),
  }));
}

export async function getCountryLeaderboard(country: string, limitCount = 100) {
  const q = query(
    collection(db, `leaderboards/countries/${country}`),
    orderBy('score', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc, index) => ({
    rank: index + 1,
    userId: doc.id,
    ...doc.data(),
  }));
}
```

#### User Data Functions
```typescript
// src/utils/firebase-user.ts
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function saveUserData(userId: string, userData: UserData) {
  await setDoc(doc(db, 'users', userId), userData);
}

export async function getUserData(userId: string): Promise<UserData | null> {
  const docSnap = await getDoc(doc(db, 'users', userId));
  return docSnap.exists() ? docSnap.data() as UserData : null;
}

export async function updateCoins(
  userId: string,
  weeklyCoins: number,
  monthlyCoins: number
) {
  await updateDoc(doc(db, 'users', userId), {
    weeklyCoins,
    monthlyCoins,
  });
}
```

### 4. Environment Variables

Create `.env`:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### 5. Authentication Strategy

**Anonymous Auth** (for quick start):
- No login required
- Device-specific user ID
- Simplest implementation

**Email/Password** (for full features):
- User accounts
- Multi-device sync
- Better security

**Social Login** (best UX):
- Google, Facebook, Apple
- One-tap signup
- Trusted providers

### 6. Migration Plan

1. **Phase 1 - Local Storage (Current)**
   - Works offline
   - No backend costs
   - Single device only

2. **Phase 2 - Firebase Integration**
   - Add Firebase SDK
   - Implement anonymous auth
   - Sync leaderboard to cloud
   - Keep localStorage as fallback

3. **Phase 3 - Full Sync**
   - Sync user data across devices
   - Real-time leaderboard updates
   - Cloud save games

### 7. Cost Estimation

**Firebase Free Tier:**
- 50k reads/day
- 20k writes/day
- 1GB storage
- **Sufficient for ~10k daily active users**

**Paid Tier (if needed):**
- $0.06 per 100k reads
- $0.18 per 100k writes
- ~$10-50/month for small game

---

## Implementation Steps

### Step 1: Create Firebase Project
```bash
# 1. Go to https://console.firebase.google.com
# 2. Create new project
# 3. Enable Firestore Database
# 4. Enable Authentication > Anonymous
# 5. Copy config to .env
```

### Step 2: Install Dependencies
```bash
npm install firebase
```

### Step 3: Implement Firebase Utils
- Create firebase.ts config
- Create firebase-leaderboard.ts
- Create firebase-user.ts

### Step 4: Update App Logic
- Add Firebase fallback to leaderboardManager
- Sync userData on login
- Submit score to cloud on game over

### Step 5: Test & Deploy
- Test with multiple devices
- Verify security rules
- Deploy to production

---

## Alternative: Quick Deploy with Vercel + MongoDB Atlas

If you prefer custom backend:

```typescript
// api/leaderboard.ts (Vercel Serverless)
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Submit score
    const { username, country, score } = req.body;
    await client.db().collection('leaderboard').insertOne({
      username,
      country,
      score,
      timestamp: new Date(),
    });
    res.json({ success: true });
  } else {
    // Get leaderboard
    const leaderboard = await client.db()
      .collection('leaderboard')
      .find()
      .sort({ score: -1 })
      .limit(100)
      .toArray();
    res.json(leaderboard);
  }
}
```

Deploy: `vercel --prod`

---

## Recommendation

**For Blockris**: Use **Firebase**
- Fastest to implement
- Scales automatically
- Free tier perfect for launch
- Easy mobile SDK integration
