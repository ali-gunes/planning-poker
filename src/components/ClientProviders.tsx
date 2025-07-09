'use client';

import React, { ReactNode } from 'react';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { QuoteProvider } from '@/contexts/QuoteContext';
import { FeedbackButton } from '@/components/FeedbackButton';

// Wrapper component to access theme context
const FeedbackButtonWithTheme = () => {
  const { theme } = useTheme();
  return <FeedbackButton theme={theme} />;
};

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <QuoteProvider>
          {children}
          <FeedbackButtonWithTheme />
        </QuoteProvider>
      </ToastProvider>
    </ThemeProvider>
  );
} 