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
  "Bu uygulamayı bi refactor edelim bence.",
  "Aklımdayken bi izin gireyim ben...",
  "Ya benim başıma Metropol'de de benzer bi olay gelmişti... durun anlatayım.",
  "Arkadaşlar evlilik çok güzel bir şey, herkes evlensin, hemen evlenin!"
];

// Track used quotes across all instances
let usedOnurQuotes: string[] = [];

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
      // Smart quote selection - avoid recently used quotes
      const availableQuotes = onurQuotes.filter(quote => !usedOnurQuotes.includes(quote));
      
      // If all quotes have been used, reset the used quotes array
      if (availableQuotes.length === 0) {
        usedOnurQuotes = [];
        availableQuotes.push(...onurQuotes);
      }
      
      const randomQuote = availableQuotes[Math.floor(Math.random() * availableQuotes.length)];
      setCurrentQuote(randomQuote);
      
      // Add to used quotes
      usedOnurQuotes.push(randomQuote);
      
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
              src="/gifs/cool-spongebob.gif" 
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
            Haklısın Onur...
          </button>
        </div>
      </div>
    </div>
  );
} 