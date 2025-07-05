"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Changelog } from "@/components/Changelog";
import { ThemeSelector } from "@/components/ThemeSelector";
import { QuoteSystemSelector } from '@/components/QuoteSystemSelector';
import { useQuoteSystem } from '@/contexts/QuoteContext';

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
  const [role, setRole] = useState<'participant' | 'observer'>('participant');

  const { quoteSystemType } = useQuoteSystem();

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
          quoteSystemType,
          customQuotes: customQuotesString ? JSON.parse(customQuotesString) : null,
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

              <button
                  onClick={handleCreateRoom}
                  disabled={!name || isLoading}
                  className={`w-full mt-4 py-3 px-4 rounded-md font-medium transition-colors ${
                      !name || isLoading
                          ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
              >
                  {isLoading ? "Oda Oluşturuluyor..." : "Oda Oluştur"}
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
    </main>
  );
}
