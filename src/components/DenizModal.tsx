"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface DenizModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const denizQuotes = [
  "Arkadaşlar test eforunu ayrı alacağız",
  "Hayret... Ezgi eforlara itiraz etmedi!",
  "2'şer saat yazıyorum o zaman...",
  "Arkadaşlar biliyorsunuz ben ırkçı değilim, ama...",
  "Arkadaşlar biliyorsunuz ben cinsiyetçi değilim, ama...",
  "İlhan bana bi şey demedi arkadaşlar.",
  "Ben itiraz edersiniz sandım."
];

export function DenizModal({ isOpen, onClose }: DenizModalProps) {
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
      const randomQuote = denizQuotes[Math.floor(Math.random() * denizQuotes.length)];
      setCurrentQuote(randomQuote);
      setIsVisible(true);
      
      // Auto close after 4 seconds - DISABLED for now
      // const timer = setTimeout(() => {
      //   handleClose();
      // }, 4000);
      
      // return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className={`bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-8 max-w-md w-full shadow-2xl transform transition-all duration-300 ${
        isVisible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
      }`}>
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Image 
              src="/gifs/attack.gif" 
              alt="Deniz Attack" 
              width={200}
              height={150}
              className="rounded-lg shadow-lg"
              unoptimized={true}
            />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Deniz Diyor Ki:</h2>
          <div className="bg-white/90 rounded-lg p-4 mb-6">
            <p className="text-gray-800 text-lg font-medium italic">
              &quot;{currentQuote}&quot;
            </p>
          </div>
          <div className="text-yellow-200 font-bold text-sm animate-pulse">
            Titre ve özüne dön C&I! 🚨
          </div>
          <button
            onClick={handleClose}
            className="mt-4 px-6 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
          >
            Tamam, haklısın...
          </button>
        </div>
      </div>
    </div>
  );
} 