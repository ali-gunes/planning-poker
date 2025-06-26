"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface EzgiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ezgiQuotes = [
  "Bu kadar az olamaz Deniz ya, minimum 3 gün!",
  "Deniz, sen gerçekçi değilsin!",
  "Test eforunu almayı unuttunuz.",
  "Ben Deniz'le aynı fikirde değilim",
  "Bence 2 katına çıkaralım eforları",
  "Documentation yazma süremiz yok mu?",
  "Bug fix süresini de eklememiz lazım",
  "İnsaf yani Deniz, bu kadar verilir mi?!",
  "Deniz biz bi de test dökümanı yazıyoruz yani."
];

// Track used quotes across all instances
let usedEzgiQuotes: string[] = [];

export function EzgiModal({ isOpen, onClose }: EzgiModalProps) {
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
      const availableQuotes = ezgiQuotes.filter(quote => !usedEzgiQuotes.includes(quote));
      
      // If all quotes have been used, reset the used quotes array
      if (availableQuotes.length === 0) {
        usedEzgiQuotes = [];
        availableQuotes.push(...ezgiQuotes);
      }
      
      const randomQuote = availableQuotes[Math.floor(Math.random() * availableQuotes.length)];
      setCurrentQuote(randomQuote);
      
      // Add to used quotes
      usedEzgiQuotes.push(randomQuote);
      
      setIsVisible(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className={`bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-8 max-w-md w-full shadow-2xl transform transition-all duration-300 ${
        isVisible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
      }`}>
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Image 
              src="/gifs/dodge.gif" 
              alt="Ezgi Dodge" 
              width={200}
              height={150}
              className="rounded-lg shadow-lg"
              unoptimized={true}
            />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Ezgi Diyor Ki:</h2>
          <div className="bg-white/90 rounded-lg p-4 mb-6">
            <p className="text-gray-800 text-lg font-medium italic">
              &quot;{currentQuote}&quot;
            </p>
          </div>
          <div className="text-yellow-200 font-bold text-sm animate-pulse">
            Kalite için yeterli zaman! 🛡️
          </div>
          <button
            onClick={handleClose}
            className="mt-4 px-6 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
          >
            Haklısın Ezgi...
          </button>
        </div>
      </div>
    </div>
  );
} 