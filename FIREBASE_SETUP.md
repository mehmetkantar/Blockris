# Firebase Setup Guide

Firebase entegrasyonu tamamlandı! Gerçek multiplayer leaderboard için aşağıdaki adımları takip edin.

## 1. Firebase Projesi Oluşturma

1. [Firebase Console](https://console.firebase.google.com/) adresine gidin
2. "Add project" butonuna tıklayın
3. Proje adı girin (örn: "Blockris")
4. Google Analytics'i enable/disable edin (isteğe bağlı)
5. "Create project" butonuna tıklayın

## 2. Web App Ekleme

1. Firebase Console'da projenizi açın
2. Sol menüden "Build" > "Firestore Database" seçin
3. "Create database" butonuna tıklayın
4. **Start in production mode** seçin (güvenlik kurallarını manuel ekleyeceğiz)
5. Lokasyon seçin (örn: "europe-west1")
6. Firebase project overview'a dönün
7. Web ikonu (</>)'na tıklayın
8. App nickname girin (örn: "Blockris Web")
9. "Register app" butonuna tıklayın
10. Config bilgilerini kopyalayın

## 3. Environment Variables Ayarlama

1. Projenizde `.env` dosyasını açın
2. Firebase config bilgilerinizi yapıştırın:

```env
VITE_FIREBASE_API_KEY=your-actual-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

3. Dosyayı kaydedin

## 4. Authentication Setup

1. Firebase Console'da "Build" > "Authentication" seçin
2. "Get started" butonuna tıklayın
3. "Sign-in method" tab'ına gidin
4. "Anonymous" provider'ı enable edin
5. "Save" butonuna tıklayın

## 5. Firestore Security Rules

1. Firebase Console'da "Build" > "Firestore Database" seçin
2. "Rules" tab'ına gidin
3. `firestore.rules` dosyasının içeriğini kopyalayın
4. Console'a yapıştırın
5. "Publish" butonuna tıklayın

**Alternatif:** Firebase CLI ile deploy:
```bash
npm install -g firebase-tools
firebase login
firebase init firestore
firebase deploy --only firestore:rules
```

## 6. Test Etme

1. Uygulamanızı çalıştırın: `npm run dev`
2. Browser console'u açın (F12)
3. "✅ Firebase connected - using cloud leaderboard" mesajını görmeli siniz
4. Oyunu oynayın ve skor gönderin
5. Firebase Console > Firestore Database'de "leaderboard" collection'ını kontrol edin

## 7. Offline Fallback

Eğer Firebase bağlanamıyorsa:
- Console'da "⚠️ Firebase offline - using local leaderboard" mesajı göreceksiniz
- Sistem otomatik olarak localStorage fallback kullanacak
- Her şey normal çalışmaya devam edecek (sadece lokal)

## Önemli Notlar

### Güvenlik
- ❌ `.env` dosyasını **asla** git'e commit etmeyin (`.gitignore`'da zaten var)
- ✅ `.env.example` dosyasını referans olarak kullanın
- ✅ Production'da environment variables'ları hosting provider'ınızda ayarlayın

### Firebase Quotas (Ücretsiz Plan)
- **Stored data:** 1 GB
- **Document reads:** 50,000/day
- **Document writes:** 20,000/day
- **Document deletes:** 20,000/day

Blockris için yeterli olacaktır. Eğer aşarsanız, Firebase Blaze plan'a (pay-as-you-go) geçebilirsiniz.

### Real-time Updates
Leaderboard her 10 saniyede bir otomatik yenilenir. Real-time subscription da mevcuttur ama şu an kullanılmıyor (battery/data tasarrufu için).

## Sorun Giderme

### "Permission denied" hatası
- Firestore security rules'u doğru yüklediniz mi?
- Anonymous authentication enable mi?

### "Firebase offline" uyarısı
- `.env` dosyasındaki config doğru mu?
- İnternet bağlantınız var mı?
- Firebase Console'da projeniz aktif mi?

### Leaderboard boş görünüyor
- En az bir skor gönderildi mi?
- Firestore Console'da "leaderboard" collection'ı var mı?
- Browser console'da hata var mı?

## Sonraki Adımlar

✅ **Tamamlandı:**
- Firebase Firestore entegrasyonu
- Anonymous authentication
- Hybrid system (Firebase + localStorage fallback)
- Security rules
- Real-time leaderboard

🔮 **İleride Eklenebilir:**
- Google/Facebook login
- Kullanıcı profilleri
- Avatar sistemi
- Arkadaş listesi
- Achievement sistemi
- Push notifications
