import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface OwnerGraceCountdownProps {
  ownerName: string;
  graceEndTime: number;
}

export function OwnerGraceCountdown({ ownerName, graceEndTime }: OwnerGraceCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  
  //console.log("🔴 OwnerGraceCountdown rendered with:", { ownerName, graceEndTime });
  
  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = graceEndTime - Date.now();
      return Math.max(0, Math.floor(difference / 1000));
    };
    
    setTimeLeft(calculateTimeLeft());
    
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      
      if (newTimeLeft <= 0) {
        clearInterval(timer);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [graceEndTime]);
  
  // Format time as MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto my-8 animate-pulse">
      <div className="text-4xl md:text-5xl font-bold text-red-500 mb-4">👑 KRALIN DÜŞÜŞÜ!</div>
      
      <div className="relative w-full max-w-md mb-6">
        <Image 
          src="/gifs/no-power.gif" 
          alt="No Power" 
          width={500}
          height={300}
          className="rounded-lg shadow-2xl border-4 border-red-700"
          unoptimized={true}
        />
      </div>
      
      <div className="bg-red-900/70 p-6 rounded-lg text-center w-full max-w-md">
        <p className="text-yellow-300 text-xl mb-4">
          {ownerName} odadan ayrıldı. Yeni kral seçimi için:
        </p>
        
        <div className="text-5xl font-mono font-bold text-white bg-red-800 py-3 px-6 rounded-lg inline-block">
          {formattedTime}
        </div>
        
        <p className="text-gray-300 mt-4">
          Eğer {ownerName} bu süre içinde geri dönerse, krallık devam edecek.
          <br />Dönmezse, yeni bir kral seçilecek!
        </p>
      </div>
    </div>
  );
} 