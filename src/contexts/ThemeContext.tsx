'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define theme types
export type ThemeType = 'default' | 'retro90s' | 'nordic' | 'synthwave';

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
        
        if (savedTheme && (savedTheme === 'default' || savedTheme === 'retro90s' || savedTheme === 'nordic' || savedTheme === 'synthwave')) {
          setThemeState(savedTheme);
          
          // Apply theme class to document body
          document.body.classList.remove('theme-retro90s', 'theme-nordic', 'nordic-text-fix', 'theme-synthwave');
          if (savedTheme === 'retro90s') {
            console.log('Applying retro90s theme from localStorage');
            document.body.classList.add('theme-retro90s');
            document.documentElement.style.setProperty('--theme-background', 'linear-gradient(135deg, #000066, #330066)');
          } else if (savedTheme === 'nordic') {
            console.log('Applying nordic theme from localStorage');
            document.body.classList.add('theme-nordic', 'nordic-text-fix');
            document.documentElement.style.removeProperty('--theme-background');
          } else if (savedTheme === 'synthwave') {
            console.log('Applying synthwave theme from localStorage');
            document.body.classList.add('theme-synthwave');
            document.documentElement.style.setProperty('--theme-background', 'linear-gradient(135deg, #121212, #1a0033)');
          } else {
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
    document.body.classList.remove('theme-retro90s', 'theme-nordic', 'nordic-text-fix', 'theme-synthwave');
    
    if (newTheme === 'retro90s') {
      console.log('Adding theme-retro90s class to body');
      document.body.classList.add('theme-retro90s');
      document.documentElement.style.setProperty('--theme-background', 'linear-gradient(135deg, #000066, #330066)');
    } else if (newTheme === 'nordic') {
      console.log('Adding theme-nordic class to body');
      document.body.classList.add('theme-nordic', 'nordic-text-fix');
      document.documentElement.style.removeProperty('--theme-background');
    } else if (newTheme === 'synthwave') {
      console.log('Adding theme-synthwave class to body');
      document.body.classList.add('theme-synthwave');
      document.documentElement.style.setProperty('--theme-background', 'linear-gradient(135deg, #121212, #1a0033)');
    } else {
      console.log('Removing theme classes from body');
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