import { UserData, ShopItem } from '../types/user';
import { storageManager } from '../utils/storage';
import { useState } from 'react';

interface ShopScreenProps {
  userData: UserData;
  onBack: () => void;
  onPurchase: () => void;
}

const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'weekly_small',
    name: '100 Haftalık Coin',
    description: 'Küçük paket',
    weeklyCoins: 100,
    price: 99,
    currency: 'TRY',
  },
  {
    id: 'weekly_medium',
    name: '300 Haftalık Coin',
    description: 'Orta paket - %20 bonus!',
    weeklyCoins: 300,
    price: 249,
    currency: 'TRY',
  },
  {
    id: 'weekly_large',
    name: '1000 Haftalık Coin',
    description: 'Büyük paket - %50 bonus!',
    weeklyCoins: 1000,
    price: 699,
    currency: 'TRY',
  },
  {
    id: 'monthly_small',
    name: '50 Aylık Coin',
    description: 'Küçük paket',
    monthlyCoins: 50,
    price: 149,
    currency: 'TRY',
  },
  {
    id: 'monthly_medium',
    name: '150 Aylık Coin',
    description: 'Orta paket - %25 bonus!',
    monthlyCoins: 150,
    price: 399,
    currency: 'TRY',
  },
  {
    id: 'monthly_large',
    name: '500 Aylık Coin',
    description: 'Büyük paket - %60 bonus!',
    monthlyCoins: 500,
    price: 999,
    currency: 'TRY',
  },
];

function ShopScreen({ userData, onBack, onPurchase }: ShopScreenProps) {
  const [purchasingItem, setPurchasingItem] = useState<ShopItem | null>(null);

  const handlePurchase = (item: ShopItem) => {
    setPurchasingItem(item);
  };

  const confirmPurchase = () => {
    if (purchasingItem) {
      // In production, this would integrate with Capacitor In-App Purchases
      // For now, simulate purchase
      storageManager.addCoins(purchasingItem.weeklyCoins || 0, purchasingItem.monthlyCoins || 0);
      onPurchase();
      setPurchasingItem(null);
      alert('Satın alma simüle edildi! (Gerçek uygulamada IAP entegrasyonu olacak)');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800 flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg font-medium hover:bg-white/30 transition-all"
        >
          ← Geri
        </button>
        <h1 className="text-3xl font-bold text-white">🛒 Dükkan</h1>
        <div className="w-20"></div>
      </div>

      {/* Current Balance */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 mb-4 border-2 border-white/20">
        <div className="text-white/80 text-sm mb-2 text-center">Mevcut Bakiye</div>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-yellow-300 text-3xl font-bold">{userData.weeklyCoins}</div>
            <div className="text-white/60 text-sm">Haftalık</div>
          </div>
          <div className="text-center">
            <div className="text-blue-300 text-3xl font-bold">{userData.monthlyCoins}</div>
            <div className="text-white/60 text-sm">Aylık</div>
          </div>
        </div>
      </div>

      {/* Shop Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto pb-4">
        {SHOP_ITEMS.map((item) => (
          <div
            key={item.id}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border-2 border-white/20 flex flex-col hover:bg-white/15 transition-all"
          >
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg mb-1">{item.name}</h3>
              <p className="text-white/70 text-sm mb-3">{item.description}</p>

              {item.weeklyCoins && (
                <div className="bg-yellow-500/20 rounded-lg p-2 mb-2">
                  <div className="text-yellow-300 font-bold">+{item.weeklyCoins} Haftalık Coin</div>
                </div>
              )}

              {item.monthlyCoins && (
                <div className="bg-blue-500/20 rounded-lg p-2 mb-2">
                  <div className="text-blue-300 font-bold">+{item.monthlyCoins} Aylık Coin</div>
                </div>
              )}
            </div>

            <button
              onClick={() => handlePurchase(item)}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-xl font-bold hover:scale-105 transition-all active:scale-95 mt-2"
            >
              {item.price / 100} {item.currency} - Satın Al
            </button>
          </div>
        ))}
      </div>

      {/* Purchase Confirmation Modal */}
      {purchasingItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Satın Alma Onayı</h2>
            <p className="text-gray-600 mb-4">{purchasingItem.name}</p>

            <div className="bg-purple-100 rounded-xl p-4 mb-4">
              {purchasingItem.weeklyCoins && (
                <div className="text-yellow-600 font-bold mb-1">+{purchasingItem.weeklyCoins} Haftalık Coin</div>
              )}
              {purchasingItem.monthlyCoins && (
                <div className="text-blue-600 font-bold">+{purchasingItem.monthlyCoins} Aylık Coin</div>
              )}
            </div>

            <div className="text-3xl font-bold text-gray-800 text-center mb-4">
              {purchasingItem.price / 100} {purchasingItem.currency}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setPurchasingItem(null)}
                className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-xl font-bold hover:bg-gray-300 transition-all"
              >
                İptal
              </button>
              <button
                onClick={confirmPurchase}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-xl font-bold hover:scale-105 transition-all active:scale-95"
              >
                Onayla
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-3 text-center">
              Demo mod: Gerçek ödeme yapılmayacak
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShopScreen;
