"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface KubilayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const kubilayQuotes = [
  "Bu hata 2 senedir geliyor, refinementta bi konuşalım.",
  "Ben onun bilgisini gruptan yazmıştım.",
  "PR'lar complete edilmemiş daha...",
  "Bu config'leri appSettings'e taşımamız lazım.",
  "Benim efor belli zaten, yaz 12 saat.",
  "Benim tarifem hep aynı...",
  "Preprod ortamında test ettiniz mi bunu?",
  "2015'ten kalan bi Workflow var zaten bu işi yapan."
];

export function KubilayModal({ isOpen, onClose }: KubilayModalProps) {
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
      const randomQuote = kubilayQuotes[Math.floor(Math.random() * kubilayQuotes.length)];
      setCurrentQuote(randomQuote);
      setIsVisible(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className={`bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl p-8 max-w-md w-full shadow-2xl transform transition-all duration-300 ${
        isVisible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
      }`}>
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Image 
              src="/gifs/gandalf.gif" 
              alt="Kubilay Clapping" 
              width={200}
              height={150}
              className="rounded-lg shadow-lg"
              unoptimized={true}
            />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Kubilay Diyor Ki:</h2>
          <div className="bg-white/90 rounded-lg p-4 mb-6">
            <p className="text-gray-800 text-lg font-medium italic">
              &quot;{currentQuote}&quot;
            </p>
          </div>
          <div className="text-yellow-200 font-bold text-sm animate-pulse">
            DevOps tecrübesi! 🚀
          </div>
          <button
            onClick={handleClose}
            className="mt-4 px-6 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
          >
            Haklısın Kubilay...
          </button>
        </div>
      </div>
    </div>
  );
} 