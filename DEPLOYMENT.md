# Blockris - Mobile Deployment Guide

## App Store & Play Store Deployment

### Prerequisites

#### For Android (Play Store):
- Install [Android Studio](https://developer.android.com/studio)
- Java Development Kit (JDK) 17 or higher
- Android SDK (installed with Android Studio)

#### For iOS (App Store):
- macOS computer
- Install [Xcode](https://developer.apple.com/xcode/) (from Mac App Store)
- Apple Developer Account ($99/year)

---

## 1. Generate App Icons & Splash Screens

### Required Icon Sizes:

**Android:**
- 512x512 px (Play Store listing)
- 192x192 px (hdpi)
- 144x144 px (xhdpi)
- 96x96 px (mdpi)
- 72x72 px (ldpi)

**iOS:**
- 1024x1024 px (App Store)
- 180x180 px (iPhone)
- 167x167 px (iPad Pro)
- 152x152 px (iPad)
- 120x120 px (iPhone)

### Easy Way - Use Icon Generator Tool:

1. Create a 1024x1024 px icon (PNG with transparent background)
2. Use online tool: https://icon.kitchen/ or https://www.appicon.co/
3. Upload your icon and download the generated assets
4. Replace files in:
   - Android: `android/app/src/main/res/` folders
   - iOS: `ios/App/App/Assets.xcassets/AppIcon.appasset/`

### Manual Icon Placement:

**Android:**
Place icons in:
```
android/app/src/main/res/
├── mipmap-hdpi/ic_launcher.png (72x72)
├── mipmap-mdpi/ic_launcher.png (48x48)
├── mipmap-xhdpi/ic_launcher.png (96x96)
├── mipmap-xxhdpi/ic_launcher.png (144x144)
└── mipmap-xxxhdpi/ic_launcher.png (192x192)
```

**iOS:**
Use Xcode to add icons to Assets catalog:
1. Open project: `npm run build:ios`
2. In Xcode, go to `App > Assets.xcassets > AppIcon`
3. Drag and drop icon images to appropriate slots

---

## 2. Configure Splash Screen

### Create Splash Screen Image:
- 2732x2732 px PNG
- Centered logo/design
- Background color: `#667eea` (or your brand color)

### Place Splash Screen:

**Android:**
```
android/app/src/main/res/
├── drawable/splash.png
├── drawable-land/splash.png
├── drawable-hdpi/splash.png
├── drawable-xhdpi/splash.png
├── drawable-xxhdpi/splash.png
└── drawable-xxxhdpi/splash.png
```

**iOS:**
Place in: `ios/App/App/Assets.xcassets/Splash.imageset/`

---

## 3. Build for Production

### Build Web Assets:
```bash
npm run build
```

### Sync to Native Projects:
```bash
npm run sync
```

---

## 4. Android Build & Release

### Step 1: Generate Signing Key
```bash
keytool -genkey -v -keystore blockris-release-key.keystore -alias blockris -keyalg RSA -keysize 2048 -validity 10000
```

Save this file securely and remember the passwords!

### Step 2: Configure Gradle

Create file: `android/key.properties`
```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=blockris
storeFile=../blockris-release-key.keystore
```

Edit `android/app/build.gradle`:
```gradle
// Add above android { }
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    ...
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
            storePassword keystoreProperties['storePassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Step 3: Build APK/AAB
```bash
cd android
./gradlew assembleRelease  # For APK
./gradlew bundleRelease    # For AAB (recommended for Play Store)
```

Output files:
- APK: `android/app/build/outputs/apk/release/app-release.apk`
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`

### Step 4: Upload to Play Store

1. Go to [Google Play Console](https://play.google.com/console)
2. Create a new app
3. Fill in app details:
   - Title: Blockris
   - Short description: Modern puzzle game inspired by classic block games
   - Full description: (Write engaging description highlighting features)
   - Category: Games > Puzzle
   - Content rating: Everyone
4. Upload screenshots (phone & tablet)
5. Upload feature graphic (1024x500 px)
6. Upload AAB file
7. Set pricing (Free recommended for puzzle games)
8. Submit for review

---

## 5. iOS Build & Release

### Step 1: Configure in Xcode
```bash
npm run build:ios
```

This opens Xcode. Configure:

1. **General Tab:**
   - Display Name: Blockris
   - Bundle Identifier: com.blockris.game
   - Version: 1.0.0
   - Build: 1

2. **Signing & Capabilities:**
   - Team: Select your Apple Developer team
   - Enable "Automatically manage signing"

3. **Info Tab:**
   - Set supported orientations (Portrait only recommended)

### Step 2: Build Archive
1. In Xcode menu: Product > Archive
2. Wait for archive to complete
3. Click "Distribute App"
4. Select "App Store Connect"
5. Follow prompts to upload

### Step 3: App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Create new app
3. Fill in metadata:
   - Name: Blockris
   - Subtitle: Modern Puzzle Challenge
   - Category: Games > Puzzle
   - Age Rating: 4+
4. Upload screenshots (6.5" & 5.5" iPhone)
5. Upload app preview video (optional but recommended)
6. Add privacy policy URL
7. Submit for review

---

## 6. Production Optimization Checklist

### Performance:
- ✅ Code splitting enabled (Vite default)
- ✅ Assets minified
- ✅ Service Worker for offline support
- ✅ Lazy loading for components
- ✅ Image optimization

### Security:
- ✅ HTTPS only (android scheme set)
- ✅ Mixed content disabled
- ✅ Input sanitization
- ✅ Secure storage for sensitive data

### Analytics (Optional):
Consider adding:
- Google Analytics for Firebase
- Crashlytics for crash reporting
- User behavior tracking

```bash
npm install @capacitor/google-analytics
```

### Monetization (Optional):
- AdMob for ads: `@capacitor-community/admob`
- In-app purchases: `@capacitor-community/in-app-purchases`

---

## 7. Testing Before Release

### Android:
1. Test on physical device:
   ```bash
   npm run build:android
   ```
2. In Android Studio, click Run
3. Test all features thoroughly

### iOS:
1. Test on simulator:
   ```bash
   npm run build:ios
   ```
2. In Xcode, select simulator and click Run
3. Test on real device via Xcode

### Test Checklist:
- [ ] Game mechanics work correctly
- [ ] Haptic feedback works on device
- [ ] Sounds play correctly
- [ ] Rotations work properly
- [ ] Combo system calculates correctly
- [ ] Game over detection works
- [ ] Restart works
- [ ] Performance is smooth (60fps)
- [ ] App installs correctly
- [ ] App icon displays correctly
- [ ] Splash screen shows
- [ ] Offline mode works (PWA)

---

## 8. Post-Launch

### Monitor:
- Crash reports
- User reviews
- Download statistics
- User retention

### Update Process:
1. Make code changes
2. Update version in:
   - `package.json`
   - `android/app/build.gradle` (versionCode & versionName)
   - Xcode project settings
3. Build and test
4. Submit update to stores

---

## Quick Reference Commands

```bash
# Development
npm run dev                 # Web development server
npm run build               # Build web assets
npm run build:mobile        # Build and sync to mobile
npm run build:android       # Build and open Android Studio
npm run build:ios           # Build and open Xcode

# Sync changes
npm run sync                # Sync to both platforms
npm run sync:android        # Sync to Android only
npm run sync:ios            # Sync to iOS only
```

---

## Support & Resources

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Android Publishing Guide](https://developer.android.com/studio/publish)
- [iOS Publishing Guide](https://developer.apple.com/app-store/submissions/)
- [Play Store Console](https://play.google.com/console)
- [App Store Connect](https://appstoreconnect.apple.com)

---

## Notes

- First-time Play Store submission review: 1-7 days
- First-time App Store submission review: 1-3 days
- Updates usually reviewed faster
- Keep signing keys secure and backed up
- Update privacy policy if collecting data
- Comply with store guidelines for content/monetization
