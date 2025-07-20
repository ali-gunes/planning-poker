/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { QuoteSystem, QuoteSystemType, QuoteType } from '@/types/quotes';
import { validateQuoteSystem } from '@/utils/quoteValidator';
import { useToast } from './ToastContext';

interface QuoteContextType {
  quoteSystemType: QuoteSystemType;
  setQuoteSystemType: (type: QuoteSystemType) => void;
  quoteSystem: QuoteSystem | null;
  uploadCustomQuotes: (jsonData: string) => Promise<boolean>;
  showQuoteForType: (quoteType: QuoteType) => void;
  showManualQuote: () => void;
  currentQuote: {
    quote: string;
    name: string;
    role: string;
    phrase?: string;
    animation: string;
    color: string;
  } | null;
  lastQuoteType: QuoteType | null;
}

const QuoteContext = createContext<QuoteContextType | undefined>(undefined);

// Track used quotes for each category to avoid repetition
interface UsedQuotesTracker {
  general: string[];
  medianLow: string[];
  medianHigh: string[];
  consensus: string[];
  hugeDifference: string[];
}

// Initialize the used quotes tracker
const usedQuotes: UsedQuotesTracker = {
  general: [],
  medianLow: [],
  medianHigh: [],
  consensus: [],
  hugeDifference: [],
};

// Add a type definition for Quote
interface Quote {
  id?: string;
  name: string;
  role: string;
  quote: string;
  phrase?: string;
  animation: string;
  color: string;
}

export function QuoteProvider({ children }: { children: ReactNode }) {
  const [quoteSystemType, setQuoteSystemTypeState] = useState<QuoteSystemType>('none');
  const [quoteSystem, setQuoteSystem] = useState<QuoteSystem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentQuote, setCurrentQuote] = useState<{
    quote: string;
    name: string;
    role: string;
    phrase?: string;
    animation: string;
    color: string;
  } | null>(null);
  const [lastQuoteType, setLastQuoteType] = useState<QuoteType | null>(null);
  
  const { showToast } = useToast();

  const dismissTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load the selected quote system
  useEffect(() => {
    const loadQuoteSystem = async () => {
      try {
        if (quoteSystemType === 'none') {
          setQuoteSystem(null);
          return;
        }
        
        if (quoteSystemType === 'ci-team') {
          const response = await fetch('/quotes/ci-team.json');
          if (!response.ok) {
            throw new Error('Failed to load C&I team quotes');
          }
          const data = await response.json();
          setQuoteSystem(data);
          return;
        }
        
        // For custom quotes, check localStorage. If none exist yet, we'll keep the
        // quoteSystemType as "custom" so the UI can prompt the user to upload a pack.
        if (quoteSystemType === 'custom') {
          const customQuotesJson = localStorage.getItem('custom-quotes');
          if (!customQuotesJson) {
            setQuoteSystem(null);
            return;
          }

          try {
            const customQuotes = JSON.parse(customQuotesJson);
            setQuoteSystem(customQuotes);
          } catch (error) {
            console.error('Failed to parse custom quotes:', error);
            showToast('Özel takım yorumular yüklenemedi', 'error');
            setQuoteSystem(null);
          }
        }
      } catch (error) {
        console.error('Error loading quote system:', error);
        showToast('Takım Yorumu sistemi yüklenemedi', 'error');
        setQuoteSystemType('none');
      }
    };
    
    loadQuoteSystem();
  }, [quoteSystemType, showToast]);

  // Save the quote system type to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('quote-system-type', quoteSystemType);
    } catch (error) {
      console.error('Failed to save quote system type:', error);
    }
  }, [quoteSystemType]);

  // Load the quote system type from localStorage on initial render
  useEffect(() => {
    try {
      const savedType = localStorage.getItem('quote-system-type') as QuoteSystemType;
      if (savedType && ['none', 'ci-team', 'custom'].includes(savedType)) {
        setQuoteSystemTypeState(savedType);
      }
    } catch (error) {
      console.error('Failed to load quote system type:', error);
    }
  }, []);

  const setQuoteSystemType = (type: QuoteSystemType) => {
    setQuoteSystemTypeState(type);
  };

  const uploadCustomQuotes = async (jsonData: string): Promise<boolean> => {
    try {
      const parsedData = JSON.parse(jsonData);
      
      // Validate the JSON
      const validationResult = await validateQuoteSystem(parsedData);
      
      if (!validationResult.isValid) {
        showToast('Geçersiz takım yorumu formatı', 'error');
        console.error('Invalid quote format:', validationResult.errors);
        return false;
      }
      
      // Save to localStorage
      localStorage.setItem('custom-quotes', jsonData);
      
      // Set the quote system
      setQuoteSystem(parsedData);
      setQuoteSystemType('custom');
      
      showToast('Özel takım yorumular yüklendi', 'success');
      return true;
    } catch (error) {
      console.error('Failed to upload custom quotes:', error);
      showToast('Özel takım yorumular yüklenemedi', 'error');
      return false;
    }
  };

  // Helper function to get a quote that hasn't been used recently
  const getSmartRandomQuote = (quotes: Quote[], quoteType: QuoteType) => {
    // If no quotes available, return null
    if (!quotes || quotes.length === 0) return null;
    
    // Filter out recently used quotes
    const usedQuotesForType = usedQuotes[quoteType];
    let availableQuotes = quotes.filter(q => !usedQuotesForType.includes(q.quote));
    
    // If all quotes have been used or there are no available quotes, reset the used quotes array
    if (availableQuotes.length === 0) {
      usedQuotes[quoteType] = [];
      availableQuotes = quotes;
    }
    
    // Select a random quote from available quotes
    const randomIndex = Math.floor(Math.random() * availableQuotes.length);
    const selectedQuote = availableQuotes[randomIndex];
    
    // Add to used quotes (keep track of the last 50% of quotes to avoid repetition)
    const maxTrackedQuotes = Math.ceil(quotes.length * 0.5);
    usedQuotes[quoteType].push(selectedQuote.quote);
    
    // Trim the used quotes array if it gets too large
    if (usedQuotes[quoteType].length > maxTrackedQuotes) {
      usedQuotes[quoteType].shift(); // Remove the oldest quote
    }
    
    return selectedQuote;
  };

  const showQuoteForType = (quoteType: QuoteType) => {
    if (!quoteSystem || quoteSystemType === 'none') return;
    
    // Check if quotes should be shown for this type
    const { settings } = quoteSystem;
    let shouldShow = false;
    let quotes = [];
    
    // Simplified: single quotes array; show only during voting phase (general)
    if ('quotes' in quoteSystem && Array.isArray((quoteSystem as any).quotes)) {
      quotes = (quoteSystem as any).quotes;
      shouldShow = true;
    } else {
      // Fallback to legacy structure
      switch (quoteType) {
        case 'general':
          shouldShow = settings?.showOnGeneral ?? true;
          quotes = (quoteSystem as any).generalQuotes ?? [];
          break;
        default:
          shouldShow = false;
      }
    }
    
    // Check probability
    if (shouldShow && quotes.length > 0 && Math.random() <= settings.quoteProbability) {
      // Select a smart random quote
      const randomQuote = getSmartRandomQuote(quotes, quoteType);
      if (randomQuote) {
        setCurrentQuote({
          quote: randomQuote.quote,
          name: randomQuote.name,
          role: randomQuote.role,
          phrase: randomQuote.phrase,
          animation: randomQuote.animation,
          color: randomQuote.color
        });
        setLastQuoteType(quoteType);

        // We previously used a top overlay for general quotes; now we display them inline
        // below the voting cards, so no modal is needed. Ensure modal is closed.
        setIsModalOpen(false);
      }
    }
  };

  const showManualQuote = () => {
    if (!quoteSystem || quoteSystemType === 'none') return;
    const quotes: Quote[] = ('quotes' in quoteSystem && Array.isArray((quoteSystem as any).quotes))
      ? (quoteSystem as any).quotes
      : (quoteSystem as any).generalQuotes ?? [];
    if (quotes.length === 0) return;
    const selectedQuote = getSmartRandomQuote(quotes, 'general');
    if (!selectedQuote) return;
    setCurrentQuote({
      quote: selectedQuote.quote,
      name: selectedQuote.name,
      role: selectedQuote.role,
      phrase: selectedQuote.phrase,
      animation: selectedQuote.animation,
      color: selectedQuote.color,
    });
    setLastQuoteType('general');
    setIsModalOpen(false); // keep inline, no fullscreen modal
    // No auto-dismiss; user can click again for a new quote
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentQuote(null);
    if (dismissTimeoutRef.current) {
      clearTimeout(dismissTimeoutRef.current);
      dismissTimeoutRef.current = null;
    }
  };

  return (
    <QuoteContext.Provider value={{ 
      quoteSystemType, 
      setQuoteSystemType, 
      quoteSystem, 
      uploadCustomQuotes,
      showQuoteForType,
      showManualQuote,
      currentQuote,
      lastQuoteType
    }}>
      {children}
      
      {/* Quote Modal */}
      {isModalOpen && lastQuoteType === 'general' && (
        <div className="fixed inset-0 bg-black/75 z-40 pointer-events-none animate-fade-in"></div>
      )}
      {isModalOpen && currentQuote && lastQuoteType === 'general' && (
        <div className="fixed left-1/2 top-16 -translate-x-1/2 z-50 pointer-events-none">
          <div className={`pointer-events-auto bg-gradient-to-br ${currentQuote.color} rounded-xl p-6 max-w-md w-full shadow-2xl animate-fade-in-down`}>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={`/gifs/${currentQuote.animation}`} 
                  alt={`${currentQuote.name} Animation`} 
                  className="rounded-lg shadow-lg w-[200px] h-[150px] object-cover"
                />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">{currentQuote.name} Diyor Ki:</h2>
              {/*currentQuote.phrase && (
                <div className="text-sm text-yellow-100 mb-2 italic">{currentQuote.phrase}</div>
              )*/}
              <div className="bg-white/90 rounded-lg p-3 mb-4">
                <p className="text-gray-800 text-base font-medium italic">
                  &quot;{currentQuote.quote}&quot;
                </p>
              </div>
              <div className="text-yellow-200 font-bold text-xs animate-pulse">
                {currentQuote.phrase}
              </div>
            </div>
          </div>
        </div>
      )}
    </QuoteContext.Provider>
  );
}

export function useQuoteSystem() {
  const context = useContext(QuoteContext);
  if (context === undefined) {
    throw new Error('useQuoteSystem must be used within a QuoteProvider');
  }
  return context;
} 