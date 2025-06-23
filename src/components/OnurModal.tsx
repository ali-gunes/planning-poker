"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface OnurModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const onurQuotes = [
  "Arkadaşlar bende her şeyin kaydı var sakin olun.",
  "Ya ben bi rapor alıp geleyim...",
  "Ayrı ayrı maddeler açalım abi böyle olmaz!",
  "Ah Rize'm canım Rize'm...",
  "Bu uygulamayı bi refactor edelim bence."
];

export function OnurModal({ isOpen, onClose }: OnurModalProps) {
  const [currentQuote, setCurrentQuote] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // Wait for animation to complete
  };

  useEffect(() => {
    if (isOpen) {
      const randomQuote = onurQuotes[Math.floor(Math.random() * onurQuotes.length)];
      setCurrentQuote(randomQuote);
      setIsVisible(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className={`bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-8 max-w-md w-full shadow-2xl transform transition-all duration-300 ${
        isVisible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
      }`}>
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Image 
              src="/gifs/mark-dancing.gif" 
              alt="Onur Dancing" 
              width={200}
              height={150}
              className="rounded-lg shadow-lg"
              unoptimized={true}
            />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Onur Diyor Ki:</h2>
          <div className="bg-white/90 rounded-lg p-4 mb-6">
            <p className="text-gray-800 text-lg font-medium italic">
              &quot;{currentQuote}&quot;
            </p>
          </div>
          <div className="text-yellow-200 font-bold text-sm animate-pulse">
            Developer gerçekleri! 💻
          </div>
          <button
            onClick={handleClose}
            className="mt-4 px-6 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
          >
            Doğru söylüyor...
          </button>
        </div>
      </div>
    </div>
  );
} 