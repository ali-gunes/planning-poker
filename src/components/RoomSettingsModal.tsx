"use client";

import { useState, useEffect } from "react";
import { QuoteSystemSelector } from "./QuoteSystemSelector";

interface RoomSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: RoomSettingsUpdate) => void;
  currentSettings: {
    votingPreset: string;
    timerDuration: number;
    autoReveal: boolean;
  };
}

export interface RoomSettingsUpdate {
  votingPreset: 'fibonacci' | 'days' | 'hours' | 'yesno';
  timerDuration: number;
  autoReveal: boolean;
}

export function RoomSettingsModal({ isOpen, onClose, onSave, currentSettings }: RoomSettingsModalProps) {
  const [votingPreset, setVotingPreset] = useState(currentSettings.votingPreset);
  const [timerMinutes, setTimerMinutes] = useState(Math.floor(currentSettings.timerDuration / 60));
  const [autoReveal, setAutoReveal] = useState(currentSettings.autoReveal);

  // Update internal state when currentSettings change
  useEffect(() => {
    setVotingPreset(currentSettings.votingPreset);
    setTimerMinutes(Math.floor(currentSettings.timerDuration / 60));
    setAutoReveal(currentSettings.autoReveal);
  }, [currentSettings]);

  // When timer is selected, automatically set autoReveal to true
  // When timer is set to 0 (no timer), set autoReveal to false
  const handleTimerSelect = (minutes: number) => {
    setTimerMinutes(minutes);
    setAutoReveal(minutes > 0);
  };

  const handleSave = () => {
    const newSettings = {
      votingPreset: votingPreset as 'fibonacci' | 'days' | 'hours' | 'yesno',
      timerDuration: timerMinutes * 60,
      autoReveal,
    };
    //console.log("💾 Settings modal - saving settings:", newSettings);
    onSave(newSettings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white">Oda Ayarları</h2>
          <p className="text-gray-400 mt-2">Sadece oda sahibi değiştirebilir</p>
        </div>

        <div className="space-y-6">
          {/* Voting System Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-3 text-center">Oylama Sistemi</label>
            <div className="grid grid-cols-2 gap-3">
            <button
                type="button"
                onClick={() => setVotingPreset("hours")}
                className={`p-3 rounded-lg border-2 transition-all text-center ${
                  votingPreset === "hours"
                    ? "border-blue-500 bg-blue-500/20 text-blue-300"
                    : "border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500"
                }`}
              >
                <div className="font-bold">⏰</div>
                <div className="text-xs font-medium">Saatler</div>
              </button>
              <button
                type="button"
                onClick={() => setVotingPreset("days")}
                className={`p-3 rounded-lg border-2 transition-all text-center ${
                  votingPreset === "days"
                    ? "border-blue-500 bg-blue-500/20 text-blue-300"
                    : "border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500"
                }`}
              >
                <div className="font-bold">📅</div>
                <div className="text-xs font-medium">Günler</div>
              </button>
              
              <button
                type="button"
                onClick={() => setVotingPreset("fibonacci")}
                className={`p-3 rounded-lg border-2 transition-all text-center ${
                  votingPreset === "fibonacci"
                    ? "border-blue-500 bg-blue-500/20 text-blue-300"
                    : "border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500"
                }`}
              >
                <div className="font-bold">🔢</div>
                <div className="text-xs font-medium">Fibonacci</div>
              </button>
              <button
                type="button"
                onClick={() => setVotingPreset("yesno")}
                className={`p-3 rounded-lg border-2 transition-all text-center ${
                  votingPreset === "yesno"
                    ? "border-blue-500 bg-blue-500/20 text-blue-300"
                    : "border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500"
                }`}
              >
                <div className="font-bold">✅</div>
                <div className="text-xs font-medium">Evet/Hayır</div>
              </button>
            </div>
          </div>

          {/* Timer Settings */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-3 text-center">
              Tur Zamanlayıcısı
            </label>
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
          {/*<QuoteSystemSelector />*/}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
} 