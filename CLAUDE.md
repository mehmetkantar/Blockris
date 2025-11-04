# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Web Development
npm install          # Install dependencies
npm run dev          # Start dev server at http://localhost:3000
npm run build        # TypeScript check + production build
npm run preview      # Preview production build locally

# Mobile Development (Capacitor)
npm run build:mobile # Build web + sync to both platforms
npm run build:android # Build + sync + open Android Studio
npm run build:ios    # Build + sync + open Xcode (macOS only)
npm run sync         # Sync web assets to native projects (after code changes)
npm run sync:android # Sync to Android only
npm run sync:ios     # Sync to iOS only

# The build process runs TypeScript strict mode checks before Vite build
# Any TS errors will fail the build
```

## Architecture Overview

### Application Structure

Blockris is a multi-screen mobile game with screen-based navigation:

```
App.tsx (Navigation Wrapper)
  ├─> StartScreen (home menu, settings, daily rewards)
  ├─> GameScreen (actual game with auto-save)
  ├─> LeaderboardScreen (global & country rankings)
  └─> ShopScreen (coin purchases)
```

**Navigation Flow:**
- `App.tsx` manages `currentScreen` state ('start' | 'game' | 'leaderboard' | 'shop')
- Each screen receives callbacks to trigger navigation (e.g., `onStartGame`, `onBack`)
- User data and game state are managed at App level
- Settings changes in StartScreen apply immediately to GameScreen

### Game State Flow (within GameScreen)

GameScreen uses a centralized state pattern with unidirectional data flow:

```
GameScreen.tsx (GameState)
  ├─> GameBoard (renders grid, handles drag & drop)
  ├─> PieceBar (displays 3 pieces)
  └─> RotateSlot (holds rotated piece)
```

**Critical State Management:**
- `GameScreen.tsx` owns ALL game state (grid, pieces, rotateSlot, score, combo, completedRounds, currentRoundHadClear)
- Additional state: `currentDragInfo` for preview system
- Child components are stateless except for local UI state (drag indicators)
- State updates flow: User action → GameBoard → GameScreen callback → State update → Re-render
- **Auto-save**: Every state change triggers localStorage save via useEffect

### Data Persistence Layer

**StorageManager** (`utils/storage.ts`) - Singleton managing all localStorage operations:

```typescript
// User profile data
loadUserData(): UserData
saveUserData(userData: UserData): void
updateHighScore(score: number): boolean

// Game state (resume functionality)
saveGameState(gameState: GameState): void
loadGameState(): GameState | null
clearGameState(): void

// Daily rewards
checkDailyLogin(): { isNewDay: boolean; reward?: {...}; consecutiveDays: number }

// Currency management
addCoins(weekly, monthly): void
deductCoins(weekly, monthly): boolean

// Settings
updateSettings(settings): void
updateCountry(country): void
```

**Storage Keys:**
- `blockris_user_data` - User profile, coins, high score, settings
- `blockris_game_state` - Current game state (grid, pieces, score)
- `blockris_leaderboard` - Mock leaderboard entries (production: Firebase)

### User Data System

**UserData interface** (`types/user.ts`):
- `username`, `country`, `shareLocation`
- `weeklyCoins`, `monthlyCoins` (two currency types)
- `highScore`
- `lastLoginDate`, `consecutiveDays` (for daily rewards)
- `settings`: `soundEnabled`, `hapticsEnabled`

**Daily Login Rewards:**
- 7-day progression (10→15→20→25→30→40→50 weekly coins)
- Consecutive days reset if user misses a day
- Modal auto-shows on StartScreen when new day detected
- Managed by `storageManager.checkDailyLogin()`

### Leaderboard System

**LeaderboardManager** (`utils/leaderboard.ts`) - Currently mock localStorage, production-ready for Firebase:

```typescript
submitScore(username, country, score): { rank: number; isNewHighScore: boolean }
getGlobalLeaderboard(limit): LeaderboardEntry[]
getCountryLeaderboard(country, limit): LeaderboardEntry[]
```

**Features:**
- Global leaderboard (all countries)
- Country-specific leaderboard (user's selected country)
- Top 3 get special medals (👑, 🥈, 🥉)
- User's current rank highlighted
- Auto-submits on game over

**Migration path:** See `BACKEND_PLAN.md` for Firebase integration guide

### Shop System

**ShopScreen** (`screens/ShopScreen.tsx`) - In-app purchase interface:

```typescript
const SHOP_ITEMS: ShopItem[] = [
  { id: 'weekly_small', weeklyCoins: 100, price: 99, currency: 'TRY' },
  { id: 'weekly_medium', weeklyCoins: 300, price: 249, currency: 'TRY' },
  // ... 6 items total
];
```

**Current implementation:** Simulates purchases (no real payment)
**Production:** Integrate `@capacitor-community/in-app-purchases` for real IAP

### Unique Rotate Slot Mechanism

The rotate slot is NOT just a visual element - it's a core game mechanic:

1. User drags piece from PieceBar to RotateSlot (via HTML5 Drag API)
2. `handlePieceToRotateSlot` in GameScreen.tsx:
   - Takes the piece from currentPieces[index]
   - Calls `rotatePiece()` which returns a NEW piece with 90° rotated shape
   - Updates dimensions (width/height swap)
   - Stores in `rotateSlot` state
3. RotateSlot becomes empty when:
   - Piece is placed on grid
   - New 3-piece set arrives (cleared in `useEffect`)

**Important:** Rotation happens at DROP time, not during drag. The piece in rotateSlot is already rotated.

### Drag & Drop Implementation

Uses native HTML5 Drag API (NOT React DnD library):

**Data Transfer Pattern:**
```typescript
// Source sets data
e.dataTransfer.setData('text/piece-index', '0')
e.dataTransfer.setData('text/source-type', 'piece-bar')

// Target reads data
const index = e.dataTransfer.getData('text/piece-index')
const source = e.dataTransfer.getData('text/source-type')
```

**Three drag zones:**
1. PieceBar → GameBoard (place piece)
2. PieceBar → RotateSlot (rotate piece)
3. RotateSlot → GameBoard (place rotated piece)

**Offset-based drag & drop (IMPORTANT):**
- When dragging starts, calculate which cell of the piece was clicked
- Offset is stored: `clickedCol` and `clickedRow` within the piece's shape
- On drop, the clicked cell goes to the mouse position on grid
- Formula: `targetPosition = mouseGridPosition - offset`
- This creates precise placement where user expects

**Preview rendering:**
- `GameScreen.tsx` tracks `currentDragInfo` with piece and offset
- Passed as prop to `GameBoard`
- `GameBoard` tracks only `gridPosition` in local state
- Preview ONLY shows for valid placements (no red overlay for invalid)
- Uses translucent piece color (40% opacity) for preview
- Canvas re-renders on every state change (via useEffect dependency)

### Scoring System with Round-Based Combo Mechanics

**Formula (see `scoreSystem.ts`):**
```
Base Score = (blocks × 1) + (first line × 10) + (additional lines × 5)
Final Score = Base Score × Combo Multiplier
Combo Multiplier = 1 + (combo × 0.25)
```

**Round-based combo rules (NEW SYSTEM):**
- A "round" = one set of 3 pieces
- First 2 completed rounds: combo stays at 0 (warm-up phase)
- From round 3 onwards:
  - If ANY piece in the round clears lines → `currentRoundHadClear = true`
  - When round completes (all 3 pieces placed):
    - If `currentRoundHadClear = true`: combo continues/increments
    - If `currentRoundHadClear = false`: combo resets to 0
- Combo only increases when lines are actually cleared (not just having clear potential)

**State tracking:**
- `completedRounds`: number of finished rounds
- `currentRoundHadClear`: boolean flag for current round
- Both tracked in `GameState` interface

**Important:** Combo only applies to scoring if `completedRounds >= 2`

### Canvas Rendering Pattern

`GameBoard.tsx` uses a single `<canvas>` with manual rendering:

**Rendering loop:**
1. useEffect triggers on [grid, draggedPiece, gridPosition, paletteIndex]
2. Clears entire canvas
3. Draws gradient background
4. Draws grid lines
5. Draws filled cells from `grid` state
6. Draws preview overlay if dragging

**Performance notes:**
- Each cell is drawn individually (not sprites)
- Uses `roundRect()` helper for rounded corners
- Gradient computed per cell for filled blocks
- 60fps maintained by React's batching + canvas optimization

**Palette switching:**
When entire grid is cleared (bonus condition), `paletteIndex` increments, changing the gradient colors. This is purely cosmetic but gives visual feedback.

### Sound System (Web Audio API)

`sounds.ts` exports a singleton `soundManager`:

**Architecture:**
- Uses Web Audio API's OscillatorNode (not audio files)
- Generates tones programmatically (sine/square/triangle waves)
- Each sound is a sequence of frequencies (e.g., playClear = [523Hz, 659Hz, 784Hz])
- Respects `isMuted` state from App

**Timing:**
Sounds are played in `GameScreen.tsx` callbacks AFTER state updates but BEFORE re-render completes. This ensures sounds play even if the action causes a game over.

**Settings integration:**
- `soundManager.setMuted()` called when user toggles sound in StartScreen
- `soundManager.startBackgroundMusic()` called when GameScreen mounts (if enabled)
- `soundManager.stopBackgroundMusic()` called on game over or exit

### Grid & Piece Validation

**Key functions in `gameEngine.ts`:**

`canPlacePiece(grid, piece, position)`:
- Checks bounds (piece must fit within 8x8 grid)
- Checks collisions (piece cells can't overlap filled grid cells)
- Returns boolean immediately (used for preview)

`processPiecePlacement(grid, piece, position, currentCombo)`:
- Places piece on grid
- Finds completed rows/columns (full rows AND full columns checked separately)
- Calculates score with combo
- Returns result object (does NOT mutate grid)

**Critical:** `processPiecePlacement` returns metadata only. The actual grid update happens in `GameBoard.tsx` by:
1. Placing the piece
2. Clearing the lines (from result.clearedLines)
3. Calling `setGrid(newGrid)`

This separation allows the game engine to be pure/testable.

### Mobile & Haptic Feedback System

**Capacitor integration** (see `capacitor.config.ts`):
- Native mobile wrapper for Android & iOS
- App ID: `com.blockris.game`
- HTTPS-only for Android security
- Splash screen configured (2s duration, #667eea background)

**Haptic feedback** (see `utils/haptics.ts`):
- Singleton `hapticsManager` initialized in App.tsx
- Can be enabled/disabled via `hapticsManager.setEnabled(boolean)`
- Feedback types:
  - `light()`: Block placement
  - `medium()`: Combo trigger
  - `heavy()`: Line clearing
  - `success()`: Full grid clear (uses NotificationType.Success)
  - `error()`: Game over (uses NotificationType.Error)
- Haptics work even when sound is muted
- Gracefully degrades on unsupported devices (web browser)

**Settings integration:**
- `hapticsManager.setEnabled()` called when user toggles haptics in StartScreen
- Setting applies immediately to GameScreen

**Mobile-specific optimizations:**
- Grid size 8x8 (optimized for mobile screens)
- Touch-friendly drag & drop
- Offset-based placement for precise control
- Preview only shows valid moves (reduces visual noise)

### PWA Configuration

**Files:**
- `public/manifest.json` - App metadata, icons, theme color
- `public/sw.js` - Service worker for offline caching
- `index.html` - Registers SW, includes meta tags

**Note:** Icon files (`icon-192.png`, `icon-512.png`) are referenced but not included. Add actual icon files to `public/` folder or update manifest.json paths.

**Service Worker strategy:**
- Cache-first for static assets
- Network-first for dynamic content
- Cleans old caches on activation

## Key Patterns & Conventions

### TypeScript Patterns

**State interfaces are centralized in `types/game.ts`:**
- All game types imported from single source
- Strict null checks enabled
- No `any` types used

**Unused parameters:**
If a callback receives params it doesn't use, either:
1. Prefix with underscore: `_piece`
2. Omit from signature if not needed
3. Update the interface to remove it

### Component Patterns

**Props vs State:**
- If data flows from parent: props
- If data is UI-only (hover, drag indicators): local useState
- Game logic state: ONLY in GameScreen.tsx
- User/navigation state: ONLY in App.tsx

**Event handlers:**
- Named `handle*` in parent components
- Named `on*` in props interfaces
- Example: `handlePiecePlaced` (App) → `onPiecePlaced` (GameBoard props)

### Import Organization

Standard order:
1. React imports
2. Component imports
3. Type imports
4. Game logic imports
5. Constants/utils
6. Styles (if any)

## Important Implementation Details

### Game Over Detection & Flow

Happens in `GameScreen.tsx` useEffect when pieces change:
```typescript
const piecesToCheck = [...currentPieces, rotateSlot].filter(p => p)
const canPlace = canPlaceAnyPiece(grid, piecesToCheck)
if (!canPlace) → Game Over
```

**Note:** Checks ALL rotations of ALL pieces. If ANY piece can fit at ANY rotation at ANY position, game continues.

**Game Over Flow:**
1. GameScreen detects game over → shows modal
2. User clicks "Ana Sayfa" → calls `onGameOver(finalScore)`
3. App.tsx receives callback:
   - Updates high score via `storageManager.updateHighScore()`
   - Submits to leaderboard via `leaderboardManager.submitScore()`
   - Clears saved game state via `storageManager.clearGameState()`
   - Navigates to StartScreen
   - Shows "Yeni Rekor!" alert if new high score
4. Player can start new game or view leaderboard

### New Piece Set Generation

Triggered when `currentPieces.every(p => p === null)`:
- Generates 3 new random pieces
- Clears rotate slot (important: prevents orphaned pieces)
- Each piece gets random shape + random color

### Grid State Mutation

**Never mutate grid directly:**
```typescript
// ❌ Wrong
grid[row][col] = 1

// ✅ Correct
const newGrid = grid.map(row => [...row])
newGrid[row][col] = 1
setGrid(newGrid)
```

React won't detect mutations to nested arrays without creating new references.

### Combo Display Timing

The `ScoreDisplay` component shows combo as "×1.25" when combo=1. This is intentional - it shows the CURRENT multiplier being applied, not the next one.

### Game State Persistence (Auto-Save/Resume)

**Auto-save mechanism:**
```typescript
// In GameScreen.tsx
useEffect(() => {
  if (!gameState.isGameOver) {
    storageManager.saveGameState(gameState);
  }
}, [gameState]);
```

**Resume flow:**
1. User opens app → App.tsx loads `savedGameState = storageManager.loadGameState()`
2. If savedGameState exists → StartScreen shows "Devam Et" option
3. User clicks "Oyna" → GameScreen initializes with savedGameState
4. GameScreen continues from exact state (grid, pieces, score, combo)
5. On game over or exit → saved state is cleared

**Important:** Save happens on EVERY state change, ensuring no progress is lost if app closes unexpectedly.

## Screen Components

### StartScreen (`screens/StartScreen.tsx`)
**Purpose:** Main menu and game hub

**Features:**
- Coins display (weekly/monthly) in header
- High score display
- "Oyna" button (starts game or resumes if saved state exists)
- "Lider Tablosu" button
- "Dükkan" button
- Settings panel (sound/haptics toggles)
- Country selector dropdown (15 countries)
- Daily reward modal (auto-shows on new day)

**Props:** `userData`, navigation callbacks, update callbacks

### GameScreen (`screens/GameScreen.tsx`)
**Purpose:** Main game interface

**Features:**
- Full game logic (grid, pieces, scoring, combo)
- Exit button in header (returns to StartScreen)
- Auto-save on every state change
- Initializes with savedGameState if available
- Applies user settings on mount (sound/haptics)
- Game over modal with final score
- Background music during gameplay

**Props:** `userData`, `savedGameState`, `onGameOver`, `onExitGame`

### LeaderboardScreen (`screens/LeaderboardScreen.tsx`)
**Purpose:** Display rankings

**Features:**
- Two tabs: "Global" and user's country
- Top 3 get medals (👑, 🥈, 🥉)
- User's current rank highlighted in cyan
- Shows rank, username, country flag, score
- Up to 100 entries per tab
- Back button to StartScreen

**Props:** `userData`, `onBack`

### ShopScreen (`screens/ShopScreen.tsx`)
**Purpose:** Coin purchase interface

**Features:**
- 6 shop items (3 weekly, 3 monthly packages)
- Price in TRY (Turkish Lira)
- Shows current coin balance
- "Satın Al" button (currently simulates purchase)
- Success/error notifications
- Back button to StartScreen

**Props:** `userData`, `onBack`, `onPurchase`

**IAP integration ready:** Replace simulated purchases with `@capacitor-community/in-app-purchases`

## Testing & Debugging

### Testing the Complete Flow

1. **First launch:** Should show daily reward modal
2. **Start game:** Click "Oyna" → should load GameScreen
3. **Play game:** Place pieces, trigger combos
4. **Exit mid-game:** Click "← Çıkış" → return to StartScreen
5. **Resume game:** Click "Oyna" again → should continue from exact state
6. **Game over:** Exhaust all pieces → modal appears
7. **Check leaderboard:** Score should appear in rankings
8. **Check high score:** Should update on StartScreen if new high
9. **Test settings:** Toggle sound/haptics → should apply in next game
10. **Test shop:** Purchase coins (simulated) → balance should update

### Common Issues

1. **Drag & drop not working:** Check browser DevTools console for DataTransfer errors. Some browsers restrict drag data access.

2. **Grid not updating:** Verify you're creating NEW grid arrays, not mutating existing ones.

3. **Sounds not playing:** Sounds require user interaction to initialize AudioContext (browser security). Click anywhere first.

4. **Build fails:** Run `npm run build` to see TypeScript errors. Fix all strict type errors before proceeding.

5. **Auto-save not working:** Check localStorage in DevTools → Application → Local Storage → should see `blockris_game_state` key

6. **Leaderboard not updating:** Currently uses localStorage mock. Check `blockris_leaderboard` key. For production, migrate to Firebase (see `BACKEND_PLAN.md`)

7. **Daily rewards not showing:** Check `lastLoginDate` in localStorage. Modal only shows once per day. To test, manually change date or use `storageManager.clearAllData()`

**Dev server auto-reload:**
Vite HMR preserves React state during edits. To fully reset all data (user data, game state, leaderboard), open DevTools console and run:
```javascript
localStorage.clear()
location.reload()
```
