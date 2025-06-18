"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [name, setName] = useState("");
  const [roomIdToJoin, setRoomIdToJoin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // New room settings state
  const [votingPreset, setVotingPreset] = useState("days");
  const [timerMinutes, setTimerMinutes] = useState(0);
  const [autoReveal, setAutoReveal] = useState(false);

  useEffect(() => {
    const storedName = sessionStorage.getItem("username");
    if (storedName) {
      setName(storedName);
    }
  }, []);

  const handleCreateRoom = async () => {
    if (!name.trim()) {
      alert("Lütfen adınızı girin.");
      return;
    }

    setIsLoading(true);
    sessionStorage.setItem("username", name.trim());

    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          // Pass new settings to the API
          votingPreset,
          timerDuration: timerMinutes * 60, // send as seconds
          autoReveal,
        }),
      });

      if (res.ok) {
        const { roomId } = await res.json();
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
      alert("Lütfen adınızı girin.");
      return;
    }
    if (!roomIdToJoin.trim()) {
      alert("Lütfen bir Oda ID'si girin.");
      return;
    }
    sessionStorage.setItem("username", name.trim());
    router.push(`/room/${roomIdToJoin.trim()}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <img 
              src="/planning-poker.svg" 
              alt="Planlama Pokeri Logo" 
              className="w-24 h-24 md:w-32 md:h-32" 
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
            C&I Planlama Pokeri
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-8">
            
            {/* Create Room */}
            <div className="p-6 bg-gray-900/50 border border-gray-700 rounded-lg flex flex-col gap-4 items-center w-full h-full">
              <h2 className="text-2xl font-semibold mb-4 text-white">Yeni Bir Oda Oluştur</h2>

              <div className="w-full">
                  <label htmlFor="voting-preset" className="block text-sm font-medium text-gray-400 mb-1">Oylama Sistemi</label>
                  <select id="voting-preset" value={votingPreset} onChange={e => setVotingPreset(e.target.value)} className="w-full px-4 py-2 rounded-md bg-gray-800 text-white border-gray-600 focus:ring-2 focus:ring-blue-500">
                      
                      <option value="days">Günler (1, 2, 3, 4...)</option>
                      <option value="hours">Saatler (4, 8, 12, 16...)</option>
                      <option value="fibonacci">Fibonacci (1, 2, 3, 5...)</option>
                  </select>
              </div>

              <div className="w-full">
                  <label htmlFor="timer" className="block text-sm font-medium text-gray-400 mb-1">Tur Zamanlayıcısı (dakika)</label>
                  <input type="number" id="timer" value={timerMinutes} onChange={e => setTimerMinutes(parseInt(e.target.value, 10))} min="0" className="w-full px-4 py-2 rounded-md bg-gray-800 text-white border-gray-600 focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="w-full flex items-center gap-2 mt-2">
                  <input type="checkbox" id="auto-reveal" checked={autoReveal} onChange={e => setAutoReveal(e.target.checked)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-600" />
                  <label htmlFor="auto-reveal" className="text-sm font-medium text-gray-300">Zamanlayıcı bittiğinde oyları otomatik göster</label>
              </div>

              <button
                onClick={handleCreateRoom}
                className="w-full px-4 py-3 mt-4 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 transition-all transform hover:scale-105 disabled:bg-blue-900/50 disabled:cursor-not-allowed"
                disabled={isLoading || !name.trim()}
              >
                {isLoading ? "Oluşturuluyor..." : "Oda Oluştur"}
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
                  onChange={(e) => setRoomIdToJoin(e.target.value)}
                  className="w-full px-4 py-3 rounded-md bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 text-center"
                />
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
      </div>
    </main>
  );
}
