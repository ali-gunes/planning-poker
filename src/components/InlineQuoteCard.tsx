'use client';

import React from 'react';
import { useQuoteSystem } from '@/contexts/QuoteContext';

interface InlineQuoteCardProps {
  variant: 'voting' | 'revealed';
}

export function InlineQuoteCard({ variant }: InlineQuoteCardProps) {
  const { currentQuote, lastQuoteType } = useQuoteSystem();

  if (!currentQuote) return null;

  // Show only general quotes during voting, and non-general during revealed
  if (variant === 'voting' && lastQuoteType !== 'general') return null;
  if (variant === 'revealed' && lastQuoteType === 'general') return null;

  return (
    <div className={`w-full max-w-md mx-auto bg-gradient-to-br ${currentQuote.color} rounded-lg p-3 shadow-lg animate-fade-in-down mt-6`}>
      <div className="flex flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/gifs/${currentQuote.animation}`}
          alt={currentQuote.name}
          className="rounded-lg shadow-md w-[240px] h-[180px] object-cover mb-2"
        />
        <h3 className="text-base font-bold text-white mb-1">{currentQuote.name} diyor ki</h3>
        {/* {currentQuote.phrase && (
          <div className="text-xs text-yellow-100 mb-1 italic">{currentQuote.phrase}</div>
        )} */}
        <p className="bg-white/90 text-gray-800 rounded-md px-2 py-1.5 text-xs md:text-sm font-medium italic mb-1.5">
          &ldquo;{currentQuote.quote}&rdquo;
        </p>
        {currentQuote.phrase && (
          <span className="text-yellow-200 text-xs font-semibold">{currentQuote.phrase}</span>
        )}
      </div>
    </div>
  );
} 