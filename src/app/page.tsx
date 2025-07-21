"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Changelog } from "@/components/Changelog";
import { ThemeSelector } from "@/components/ThemeSelector";
import { QuoteSystemSelector } from '@/components/QuoteSystemSelector';
import { useQuoteSystem } from '@/contexts/QuoteContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function Home() {
  const [name, setName] = useState("");
  const [roomIdToJoin, setRoomIdToJoin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [joinError, setJoinError] = useState("");
  const router = useRouter();

  // New room settings state
  const [votingPreset, setVotingPreset] = useState("hours");
  const [timerMinutes, setTimerMinutes] = useState(0);
  const [autoReveal, setAutoReveal] = useState(false);
  const [auctionEnabled, setAuctionEnabled] = useState(false);
  const [role, setRole] = useState<'participant' | 'observer'>('participant');
  const [showAuctionInfo, setShowAuctionInfo] = useState(false);

  const { quoteSystemType, quoteSystem } = useQuoteSystem();
  const { theme } = useTheme();
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // When timer is selected, automatically set autoReveal to true
  // When timer is set to 0 (no timer), set autoReveal to false
  const handleTimerSelect = (minutes: number) => {
    setTimerMinutes(minutes);
    setAutoReveal(minutes > 0);
  };

  useEffect(() => {
    const storedName = sessionStorage.getItem("username");
    if (storedName) {
      setName(storedName);
    }
    
    // Check for error message in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const errorMessage = urlParams.get('error');
    if (errorMessage) {
      setJoinError(decodeURIComponent(errorMessage));
      // Clean the URL
      window.history.replaceState({}, '', '/');
    }
  }, []);

  // Ensure auction is off for Yes/No preset
  useEffect(() => {
    if (votingPreset === 'yesno' && auctionEnabled) {
      setAuctionEnabled(false);
    }
  }, [votingPreset, auctionEnabled]);

  const handleCreateRoom = async () => {
    if (!name.trim()) {
      alert("Lütfen adınızı girin.");
      return;
    }

    setIsLoading(true);
    sessionStorage.setItem("username", name.trim());
    sessionStorage.setItem("userRole", role);

    const customQuotesString = quoteSystemType === 'custom' ? localStorage.getItem('custom-quotes') : null;

    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          role,
          votingPreset,
          timerDuration: timerMinutes * 60,
          autoReveal,
          auctionEnabled,
          quoteSystemType,
          customQuotes: customQuotesString ? JSON.parse(customQuotesString) : null,
          theme,
        }),
      });

      if (res.ok) {
        const { roomId, ownerToken } = await res.json();
        // Store the owner token in sessionStorage
        if (ownerToken) {
          sessionStorage.setItem(`owner_token_${roomId}`, ownerToken);
        }
        router.push(`/room/${roomId}`);
      } else {
        const error = await res.json();
        alert(`Oda oluşturulurken hata: ${error.error}`);
      }
    } catch (error) {
      console.error(error);
      alert("Beklenmedik bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = () => {
    if (!name.trim()) {
      setJoinError("Lütfen adınızı girin.");
      return;
    }
    if (!roomIdToJoin.trim()) {
      setJoinError("Lütfen bir Oda ID'si girin.");
      return;
    }
    setJoinError("");
    sessionStorage.setItem("username", name.trim());
    sessionStorage.setItem("userRole", role);
    router.push(`/room/${roomIdToJoin.trim()}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
      <div className="absolute top-4 right-4 md:top-8 md:right-8 z-10">
        <ThemeSelector />
      </div>
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-1">
            <Image
              src="/planning-poker.svg" 
              alt="Planlama Pokeri Logo" 
              width={128}
              height={128}
              className="w-24 h-24 md:w-32 md:h-32" 
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
            Planlama Pokeri
          </h1>
          <p className="text-lg text-gray-400 mt-4 max-w-2xl mx-auto">
            Bir oda oluşturun ve ekibinizi görevleri gerçek zamanlı olarak tahmin etmeye davet edin.
          </p>
          
          {/* Privacy Badge */}
          <div className="flex justify-center mt-6">
            <button
              onClick={() => setShowPrivacyModal(true)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm transition-all hover:scale-105 ${
                theme === 'macos' 
                  ? 'bg-green-100/80 border border-green-300 text-green-700 hover:bg-green-200/80' 
                  : 'bg-green-900/30 border border-green-500/50 text-green-300 hover:bg-green-800/40'
              }`}
            >
              <div className="flex items-center gap-1">
                <span className={theme === 'macos' ? 'text-green-600' : 'text-green-400'}>🔒</span>
                <span>Çerez Yok</span>
                <span className={theme === 'macos' ? 'text-green-600' : 'text-green-400'}>•</span>
                <span>Takip Yok</span>
                <span className={theme === 'macos' ? 'text-green-600' : 'text-green-400'}>•</span>
                <span>Saçmalık Yok</span>
              </div>
            </button>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-6 md:p-8 shadow-2xl">
          <div className="w-full max-w-sm mx-auto mb-8">
            <label htmlFor="name" className="block text-lg font-medium text-gray-300 mb-2 text-center">Adınız</label>
            <input
              id="name"
              type="text"
              placeholder="Başlamak için adınızı girin..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-md bg-gray-900/70 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
              disabled={isLoading}
            />
            
            <div className="mt-4">
              <label className="block text-lg font-medium text-gray-300 mb-2 text-center">Rolünüz</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('participant')}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    role === 'participant'
                      ? "border-blue-500 bg-blue-500/20 text-blue-300"
                      : "border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500"
                  }`}
                >
                  {/*<div className="font-bold">👥</div>*/}
                  <div className="text-md font-bold">Katılımcı</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('observer')}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    role === 'observer'
                      ? "border-blue-500 bg-blue-500/20 text-blue-300"
                      : "border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500"
                  }`}
                >
                  {/* <div className="font-bold">👁️</div> */}
                  <div className="text-md font-bold">Gözlemci</div>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-8">
            
            {/* Create Room */}
            <div className="p-6 bg-gray-900/50 border border-gray-700 rounded-lg flex flex-col gap-4 items-center w-full h-full">
              <h2 className="text-2xl font-semibold mb-4 text-white">Yeni Bir Oda Oluştur</h2>

              <div className="w-full">
                  <label className="block text-sm font-medium text-gray-400 mb-3 text-center">Oylama Sistemi</label>
                  <div className="grid grid-cols-2 gap-3">
                  <button
                          type="button"
                          onClick={() => setVotingPreset("hours")}
                          className={`p-4 rounded-lg border-2 transition-all text-center ${
                              votingPreset === "hours"
                                  ? "border-blue-500 bg-blue-500/20 text-blue-300"
                                  : "border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500"
                          }`}
                      >
                          <div className="font-bold text-lg">⏰</div>
                          <div className="text-sm font-medium">Saatler</div>
                          <div className="text-xs text-gray-400">4, 8, 12, 16...</div>
                      </button>
                      <button
                          type="button"
                          onClick={() => setVotingPreset("days")}
                          className={`p-4 rounded-lg border-2 transition-all text-center ${
                              votingPreset === "days"
                                  ? "border-blue-500 bg-blue-500/20 text-blue-300"
                                  : "border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500"
                          }`}
                      >
                          <div className="font-bold text-lg">📅</div>
                          <div className="text-sm font-medium">Günler</div>
                          <div className="text-xs text-gray-400">1, 2, 3, 4...</div>
                      </button>
                      
                      <button
                          type="button"
                          onClick={() => setVotingPreset("fibonacci")}
                          className={`p-4 rounded-lg border-2 transition-all text-center ${
                              votingPreset === "fibonacci"
                                  ? "border-blue-500 bg-blue-500/20 text-blue-300"
                                  : "border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500"
                          }`}
                      >
                          <div className="font-bold text-lg">🔢</div>
                          <div className="text-sm font-medium">Fibonacci</div>
                          <div className="text-xs text-gray-400">1, 2, 3, 5...</div>
                      </button>
                      <button
                          type="button"
                          onClick={() => setVotingPreset("yesno")}
                          className={`p-4 rounded-lg border-2 transition-all text-center ${
                              votingPreset === "yesno"
                                  ? "border-blue-500 bg-blue-500/20 text-blue-300"
                                  : "border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500"
                          }`}
                      >
                          <div className="font-bold text-lg">✅</div>
                          <div className="text-sm font-medium">Evet/Hayır</div>
                          <div className="text-xs text-gray-400">Karar oylaması</div>
                      </button>
                  </div>
              </div>

              <div className="w-full">
                  <label className="block text-sm font-medium text-gray-400 mb-3 text-center">Tur Zamanlayıcısı</label>
                  <button
                      type="button"
                      onClick={() => handleTimerSelect(0)}
                      className={`p-3 rounded-lg border-2 transition-all text-center w-full mb-2 ${
                          timerMinutes === 0
                              ? "border-blue-500 bg-blue-500/20 text-blue-300"
                              : "border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500"
                      }`}
        >
                      <div className="text-xs font-medium">Süresiz</div>
                  </button>
                  <div className="grid grid-cols-4 gap-2">
                      <button
                          type="button"
                          onClick={() => handleTimerSelect(0.5)}
                          className={`p-3 rounded-lg border-2 transition-all text-center ${
                              timerMinutes === 0.5
                                  ? "border-blue-500 bg-blue-500/20 text-blue-300"
                                  : "border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500"
                          }`}
                      >
                          <div className="text-xs font-medium">30 sn</div>
                      </button>
                      <button
                          type="button"
                          onClick={() => handleTimerSelect(1)}
                          className={`p-3 rounded-lg border-2 transition-all text-center ${
                              timerMinutes === 1
                                  ? "border-blue-500 bg-blue-500/20 text-blue-300"
                                  : "border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500"
                          }`}
                      >
                          <div className="text-xs font-medium">1 dk</div>
                      </button>
                      <button
                          type="button"
                          onClick={() => handleTimerSelect(2)}
                          className={`p-3 rounded-lg border-2 transition-all text-center ${
                              timerMinutes === 2
                                  ? "border-blue-500 bg-blue-500/20 text-blue-300"
                                  : "border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500"
                          }`}
                      >
                          <div className="text-xs font-medium">2 dk</div>
                      </button>
                      <button
                          type="button"
                          onClick={() => handleTimerSelect(3)}
                          className={`p-3 rounded-lg border-2 transition-all text-center ${
                              timerMinutes === 3
                                  ? "border-blue-500 bg-blue-500/20 text-blue-300"
                                  : "border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500"
                          }`}
                      >
                          <div className="text-xs font-medium">3 dk</div>
                      </button>
                  </div>
                  <div className="text-center mt-2 text-xs text-gray-400">
                      {timerMinutes > 0 ? 
                          "Zamanlayıcı bittiğinde oylar otomatik gösterilecek" : 
                          "Zamanlayıcı kullanılmayacak"}
                  </div>
              </div>

              {/* Quote System Selector */}
              <div className="w-full mt-2">
                <QuoteSystemSelector />
              </div>

              {/* Confidence Auction Toggle */}
              <div className="w-full mt-6">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={()=>setShowAuctionInfo(!showAuctionInfo)}
                    className="text-gray-300 text-sm flex items-center gap-1 focus:outline-none"
                  >
                    <span className="underline">Güven Bahsi</span>
                    <span className="text-blue-400">{showAuctionInfo? '▲':'▼'}</span>
                  </button>
                  <label className="relative inline-flex items-center cursor-pointer select-none group">
                    <input
                      type="checkbox"
                      checked={auctionEnabled}
                      disabled={votingPreset === 'yesno'}
                      onChange={()=>setAuctionEnabled(!auctionEnabled)}
                      className="sr-only peer"
                    />
                    <div
                      className={`w-11 h-6 rounded-full peer-focus:outline-none transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${auctionEnabled ? 'bg-green-500 peer-checked:after:translate-x-full' : 'bg-gray-600'} ${votingPreset === 'yesno' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    ></div>
                  </label>
                </div>
                {showAuctionInfo && (
                  <p className="mt-2 text-xs text-gray-400 leading-relaxed">
                    {votingPreset === 'yesno' && <><br/><span className="text-red-400">Evet/Hayır oy sisteminde Güven Bahsi devre dışıdır.</span><br /></>}
                    Efor tahminine güveniyor musun? <br/> Güven Bahsi modu, kart seçiminin yanında 0-3 çip arası bir bahis oynamanı sağlar.
                    Tur sonunda verilen oyların kırpılmış ortalamasına göre:<br/><br/>
                    • Tam isabet ⇒ bahsin 2 katı ödül 🎉<br/>
                    • 1 kart mesafe ⇒ bahsin kadar ödül 👍<br/>
                    • 2 kart mesafe ⇒ ne kazanır ne kaybedersin 😐<br/>
                    • Daha uzakta / soru kartı ⇒ bahsini kaybedersin 💸<br/>
                    • Her oyuncu en fazla 10 çip borçlanabilir. <br/><br />
                    Özelliği dilediğin gibi açıp kapatabilirsin.
                    
                  </p>
                )}
              </div>

              <button
                  onClick={handleCreateRoom}
                  disabled={!name || isLoading || (quoteSystemType === 'custom' && !quoteSystem)}
                  className={`w-full mt-4 py-3 px-4 rounded-md font-medium transition-colors ${
                      !name || isLoading || (quoteSystemType === 'custom' && !quoteSystem)
                          ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
              >
                  {quoteSystemType === 'custom' && !quoteSystem ? 'JSON Yüklemelisiniz' : (isLoading ? 'Oda Oluşturuluyor...' : 'Oda Oluştur')}
              </button>
            </div>

            {/* Join Room */}
            <div className="p-6 bg-gray-900/50 border border-gray-700 rounded-lg flex flex-col gap-4 items-center w-full h-full">
              <h2 className="text-2xl font-semibold mb-4 text-white">Mevcut Bir Odaya Katıl</h2>
              <div className="w-full h-full flex flex-col justify-center items-center gap-4">
                <input
                  type="text"
                  placeholder="Oda ID'sini Girin"
                  value={roomIdToJoin}
                  onChange={(e) => {
                    setRoomIdToJoin(e.target.value);
                    setJoinError("");
                  }}
                  className="w-full px-4 py-3 rounded-md bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 text-center"
                />
                {joinError && (
                  <div className="w-full p-3 bg-red-500/20 border border-red-500 rounded-md text-red-200 text-sm text-center">
                    {joinError}
                  </div>
                )}
                <button
                  onClick={handleJoinRoom}
                  className="w-full px-4 py-3 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 transition-all transform hover:scale-105 disabled:bg-green-900/50 disabled:cursor-not-allowed"
                  disabled={!roomIdToJoin.trim() || !name.trim()}
                >
                  Odaya Katıl
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Add the Changelog component */}
        <Changelog />
      </div>
      
      {/* Privacy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl ${
            theme === 'macos' 
              ? 'bg-white text-gray-800' 
              : 'bg-gray-800 text-white'
          }`}>
            {/* Header */}
            <div className={`p-6 border-b ${
              theme === 'macos' ? 'border-gray-200' : 'border-gray-700'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Image
                    src={theme === 'macos' ? '/standard_nocookies_nobs.png' : '/cyberpunk_nocookiesnobs.png'}
                    alt="No Cookies Badge"
                    width={60}
                    height={30}
                  />
                  <h2 className="text-xl font-bold">Gizlilik Politikamız</h2>
                </div>
                <button
                  onClick={() => setShowPrivacyModal(false)}
                  className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${
                    theme === 'macos' ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-green-600">🛡️ Kullanıcı Gizliliğinizi Önemsiyoruz</h3>
                <p className="text-sm leading-relaxed">
                  Planlama Pokeri uygulamasında kullanıcı gizliliği en önemli önceliğimizdir. 
                  Modern web standartlarını takip ederek, kişisel verilerinizi korumak için 
                  geleneksel çerez sistemlerini kullanmıyoruz.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3 text-blue-600">🍪 Çerez Kullanmıyoruz</h3>
                <p className="text-sm leading-relaxed mb-3">
                  Uygulamamızda hiçbir çerez kullanılmamaktadır. Bu sayede:
                </p>
                <ul className="text-sm space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Tarayıcınızda takip edilmezsiniz</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Çerez onayı istememize gerek yok</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Gizlilik ayarlarınızı değiştirmenize gerek yok</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3 text-purple-600">💾 Ne Saklıyoruz?</h3>
                <p className="text-sm leading-relaxed mb-3">
                  Sadece uygulamanın çalışması için gerekli minimum veriyi saklıyoruz:
                </p>
                <ul className="text-sm space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span><strong>localStorage:</strong> Tema tercihleri, ses ayarları, oyun skorları</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span><strong>sessionStorage:</strong> Oturum süresince kullanıcı adı ve rol</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span><strong>Redis:</strong> Oda verileri (6 saat sonra otomatik silinir)</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3 text-orange-600">📊 İstatistikler</h3>
                <p className="text-sm leading-relaxed">
                  Anonim istatistikler sadece uygulama geliştirmek için kullanılır. 
                  Kişisel verileriniz asla toplanmaz veya üçüncü taraflarla paylaşılmaz.
                </p>
              </div>
              
              <div className={`p-4 rounded-lg ${
                theme === 'macos' 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-green-900/20 border border-green-500/30'
              }`}>
                <p className={`text-sm font-medium ${
                  theme === 'macos' ? 'text-green-800' : 'text-green-300'
                }`}>
                  💚 Bu yaklaşımımız sayesinde, kullanıcılarımız güvenle ve endişe duymadan 
                  uygulamamızı kullanabilirler. Gizliliğiniz bizim için kutsaldır.
                </p>
              </div>
            </div>
            
            {/* Footer */}
            <div className={`p-6 border-t ${
              theme === 'macos' ? 'border-gray-200' : 'border-gray-700'
            }`}>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                  theme === 'macos'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                Anladım, Teşekkürler
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
