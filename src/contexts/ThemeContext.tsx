'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define theme types
export type ThemeType = 'default' | 'retro90s';

// Define the context shape
interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

// Create context with default values
const ThemeContext = createContext<ThemeContextType>({
  theme: 'default',
  setTheme: () => {},
});

// Hook for using the theme context
export const useTheme = () => useContext(ThemeContext);

// Theme provider component
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // Initialize theme from localStorage if available, otherwise use default
  const [theme, setThemeState] = useState<ThemeType>('default');
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Load theme from localStorage on initial render
  useEffect(() => {
    try {
      // Check if we're in a browser environment
      if (typeof window !== 'undefined') {
        const savedTheme = localStorage.getItem('planning-poker-theme') as ThemeType;
        console.log('Loading theme from localStorage:', savedTheme);
        
        if (savedTheme && (savedTheme === 'default' || savedTheme === 'retro90s')) {
          setThemeState(savedTheme);
          
          // Apply theme class to document body
          if (savedTheme === 'retro90s') {
            console.log('Applying retro90s theme from localStorage');
            document.body.classList.add('theme-retro90s');
            document.documentElement.style.setProperty('--theme-background', 'linear-gradient(135deg, #000066, #330066)');
          } else {
            document.body.classList.remove('theme-retro90s');
            document.documentElement.style.removeProperty('--theme-background');
          }
        }
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
    }
    
    setIsInitialized(true);
  }, []);
  
  // Save theme to localStorage when it changes
  const setTheme = (newTheme: ThemeType) => {
    console.log('Setting theme to:', newTheme);
    setThemeState(newTheme);
    
    try {
      localStorage.setItem('planning-poker-theme', newTheme);
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
    
    // Apply theme class to document body
    if (newTheme === 'retro90s') {
      console.log('Adding theme-retro90s class to body');
      document.body.classList.add('theme-retro90s');
      document.documentElement.style.setProperty('--theme-background', 'linear-gradient(135deg, #000066, #330066)');
    } else {
      console.log('Removing theme-retro90s class from body');
      document.body.classList.remove('theme-retro90s');
      document.documentElement.style.removeProperty('--theme-background');
    }
  };
  
  if (!isInitialized) {
    return <>{children}</>;
  }
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}; 