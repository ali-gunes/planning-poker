import React, { useState, useEffect } from 'react';

// Define the changelog entries
const changelogEntries = [
    {
      version: "v1.4.0",
      title: "Dinamik Alıntı Sistemi 💬",
      description: "Genel tur başlangıcı ve oylama sonuçlarına göre durum bağlı alıntılar eklendi. C&I Hatırası veya özel JSON yükleme desteğiyle ekip anıları oylama ekranına geliyor.",
      date: "5 Temmuz 2025",
      type: "feature"
    },
    {
      version: "v1.3.2",
      title: "Bildirim Pozisyonları 📍",
      description: "Özel bildirimlerin konumları artık özelleştirilebilir (6 farklı pozisyon).",
      date: "4 Temmuz 2025",
      type: "improvement"
    },
    {
      version: "v1.3.1",
      title: "Özel Bildirimler 🔔",
      description: "Tarayıcı uyarıları yerine özel, tema uyumlu bildirimler eklendi.",
      date: "4 Temmuz 2025",
      type: "improvement"
    },
    {
      version: "v1.3.0",
      title: "Katılımcı Rolleri 👥👁️",
      description: "Artık kullanıcılar 'Katılımcı' veya 'Gözlemci' rolü seçebilir. Gözlemciler oy kullanamaz ve ortalama hesaplamalarına dahil edilmez.",
      date: "4 Temmuz 2025",
      type: "feature"
    },
    {
      version: "v1.2.7",
      title: "Katılımcı Listesi İyileştirmeleri",
      description: "Rol simgeleri ve oy durumu göstergeleri daha doğru şekilde görüntüleniyor.",
      date: "3 Temmuz 2025",
      type: "improvement"
    },
    {
      version: "v1.2.6",
      title: "Oda Oluşturma Hatası Düzeltildi",
      description: "Oda oluşturan kullanıcıların 'bu isim zaten kullanılıyor' hatasıyla karşılaşması sorunu giderildi.",
      date: "3 Temmuz 2025",
      type: "bugfix"
    },
    {
      version: "v1.2.5",
      title: "Zamanlayıcı İyileştirmeleri ⏱️",
      description: "Zamanlayıcı seçeneklerine 'Süresiz' seçeneği eklendi ve otomatik gösterme ayarı basitleştirildi.",
      date: "3 Temmuz 2025",
      type: "improvement"
    },
    {
      version: "v1.2.0",
      title: "Tema Radyo 🎵",
      description: "Her temaya özel arka plan müziği eklendi",
      date: "3 Temmuz 2025",
      type: "feature"
    },
    {
      version: "v1.1.0",
      title: "Tema Sistemi 🎨",
      description: "Modern, Retro 90s, Nordic ve Synthwave temaları eklendi",
      date: "2 Temmuz 2025",
      type: "feature"
    },
    {
      version: "v1.0.0",
      title: "Kral Düştü! 👑",
      description: "Oda sahibi ayrılırsa, yeni bir kral seçilir!",
      date: "1 Temmuz 2025",
      type: "feature"
    },
    {
      version: "v0.5.0",
      title: "Redis TTL Eklendi",
      description: "Odalar 6 saat sonra otomatik silinir",
      date: "27 Haziran 2025",
      type: "improvement"
    },
    {
      version: "v0.4.0",
      title: "Çevrimdışı Kullanıcı Göstergeleri",
      description: "Aktif olmayan kullanıcılar artık görsel olarak belirtiliyor",
      date: "27 Haziran 2025",
      type: "feature"
    },
    {
      version: "v0.3.0",
      title: "Oy Çoğunluğu Tespiti",
      description: "Oyların çoğunluğu aynıysa özel animasyon gösterilir",
      date: "16 Haziran 2025",
      type: "feature"
    },
    {
      version: "v0.2.0",
      title: "Karakter Kartları",
      description: "Takım üyeleri için özel karakter kartları eklendi",
      date: "16 Haziran 2025",
      type: "feature"
    },
    {
      version: "v0.1.5",
      title: "Oda Ayarları",
      description: "Oda sahibi artık oylama sistemini değiştirebilir",
      date: "16 Haziran 2025",
      type: "improvement"
    },
    {
      version: "v0.1.0",
      title: "İlk Sürüm",
      description: "Planning Poker uygulaması yayınlandı!",
      date: "13 Haziran 2025",
      type: "release"
    }
  ];

export function Changelog() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Auto-rotate through entries
  useEffect(() => {
    if (!isExpanded) {
      const interval = setInterval(() => {
        setIsAnimating(true);
        setTimeout(() => {
          setActiveIndex((prevIndex) => (prevIndex + 1) % changelogEntries.length);
          setIsAnimating(false);
        }, 500);
      }, 7000);
      
      return () => clearInterval(interval);
    }
  }, [isExpanded]);
  
  // Get the badge color based on the type
  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'feature':
        return 'bg-blue-500/30 text-blue-300 border-blue-500';
      case 'improvement':
        return 'bg-green-500/30 text-green-300 border-green-500';
      case 'bugfix':
        return 'bg-red-500/30 text-red-300 border-red-500';
      case 'release':
        return 'bg-purple-500/30 text-purple-300 border-purple-500';
      default:
        return 'bg-gray-500/30 text-gray-300 border-gray-500';
    }
  };
  
  // Get the type label
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'feature':
        return '✨ Yeni Özellik';
      case 'improvement':
        return '🔧 İyileştirme';
      case 'bugfix':
        return '🐛 Hata Düzeltmesi';
      case 'release':
        return '🚀 Yeni Sürüm';
      default:
        return type;
    }
  };
  
  const activeEntry = changelogEntries[activeIndex];
  
  return (
    <div className="w-full max-w-4xl mx-auto mt-8 mb-4">
      <div className="bg-gray-800/50 rounded-lg p-4 shadow-lg border border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-white flex items-center">
            <span className="mr-2">📋</span> Güncellemeler
          </h3>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-md text-gray-300 transition-colors"
          >
            {isExpanded ? 'Küçült' : 'Tümünü Gör'}
          </button>
        </div>
        
        {!isExpanded ? (
          <div 
            className={`relative overflow-hidden transition-all duration-500 ${isAnimating ? 'opacity-0 transform -translate-y-4' : 'opacity-100 transform translate-y-0'}`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center">
                <span className={`text-xs font-semibold px-2 py-1 rounded border mr-2 whitespace-nowrap ${getBadgeColor(activeEntry.type)}`}>
                  {getTypeLabel(activeEntry.type)}
                </span>
                <span className="text-sm text-gray-400">{activeEntry.date}</span>
              </div>
              <span className="text-sm font-mono text-gray-500">{activeEntry.version}</span>
            </div>
            <h4 className="text-lg font-bold text-white">{activeEntry.title}</h4>
            <p className="text-gray-300">{activeEntry.description}</p>
            
            {/* Progress indicator */}
            <div className="mt-3 flex gap-1 justify-center">
              {changelogEntries.map((_, index) => (
                <div 
                  key={index} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === activeIndex 
                      ? 'w-6 bg-blue-500' 
                      : 'w-1.5 bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
            {changelogEntries.map((entry, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg ${
                  index === 0 ? 'bg-blue-900/20 border border-blue-900/50' : 'bg-gray-700/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center">
                    <span className={`text-xs font-semibold px-2 py-1 rounded border mr-2 whitespace-nowrap ${getBadgeColor(entry.type)}`}>
                      {getTypeLabel(entry.type)}
                    </span>
                    <span className="text-sm text-gray-400">{entry.date}</span>
                  </div>
                  <span className="text-sm font-mono text-gray-500">{entry.version}</span>
                </div>
                <h4 className="text-lg font-bold text-white">{entry.title}</h4>
                <p className="text-gray-300">{entry.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 