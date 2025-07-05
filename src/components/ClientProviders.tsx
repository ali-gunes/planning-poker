'use client';

import React, { ReactNode } from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { QuoteProvider } from '@/contexts/QuoteContext';

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <QuoteProvider>
          {children}
        </QuoteProvider>
      </ToastProvider>
    </ThemeProvider>
  );
} 