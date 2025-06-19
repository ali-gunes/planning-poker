"use client";

import { useState, useEffect } from "react";

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

  const handleSave = () => {
    onSave({
      votingPreset: votingPreset as 'fibonacci' | 'days' | 'hours' | 'yesno',
      timerDuration: timerMinutes * 60,
      autoReveal,
    });
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
            <label htmlFor="timer" className="block text-sm font-medium text-gray-400 mb-2">
              Tur Zamanlayıcısı (dakika)
            </label>
            <input 
              type="number" 
              id="timer" 
              value={timerMinutes} 
              onChange={e => setTimerMinutes(parseInt(e.target.value, 10) || 0)} 
              min="0" 
              className="w-full px-4 py-2 rounded-md bg-gray-700 text-white border-gray-600 focus:ring-2 focus:ring-blue-500" 
            />
          </div>

          {/* Auto Reveal Settings */}
          <div className="flex items-center gap-3">
            <input 
              type="checkbox" 
              id="auto-reveal-modal" 
              checked={autoReveal} 
              onChange={e => setAutoReveal(e.target.checked)} 
              className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-600" 
            />
            <label htmlFor="auto-reveal-modal" className="text-sm font-medium text-gray-300">
              Zamanlayıcı bittiğinde oyları otomatik göster
            </label>
          </div>
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