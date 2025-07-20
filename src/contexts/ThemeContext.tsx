'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define theme types
export type ThemeType = 'default' | 'retro90s' | 'nordic' | 'synthwave' | 'macos';

// Define the context shape
interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  audioEnabled: boolean;
  toggleAudio: () => void;
  volume: number;
  setVolume: (volume: number) => void;
}

// Create context with default values (macOS is new default)
const ThemeContext = createContext<ThemeContextType>({
  theme: 'macos',
  setTheme: () => {},
  audioEnabled: false,
  toggleAudio: () => {},
  volume: 0.3,
  setVolume: () => {},
});

// Hook for using the theme context
export const useTheme = () => useContext(ThemeContext);

// Theme provider component
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // Initialize theme from localStorage if available, otherwise use default
  const [theme, setThemeState] = useState<ThemeType>('macos');
  const [audioEnabled, setAudioEnabled] = useState(false); // Always start with audio disabled
  const [volume, setVolumeState] = useState(0.3); // Default volume
  const [isInitialized, setIsInitialized] = useState(false);
  
  const pastelPool = ['#E3F2FD','#F0FFF0','#F5F3FF','#FFF1E6','#F5FFFA','#FFF5F7','#FAFAFA','#FFF5EE','#F0F8FF','#FDEFF2','#FDFDFC'];
  const randomPastel = () => pastelPool[Math.floor(Math.random()*pastelPool.length)];
  
  // Load theme and audio settings from localStorage on initial render
  useEffect(() => {
    try {
      // Check if we're in a browser environment
      if (typeof window !== 'undefined') {
        const savedTheme = localStorage.getItem('planning-poker-theme') as ThemeType;
        //console.log('Loading theme from localStorage:', savedTheme);
        
        // We intentionally don't load audio preference here
        // Audio will always start disabled for better user experience
        
        if (savedTheme && (savedTheme === 'default' || savedTheme === 'retro90s' || savedTheme === 'nordic' || savedTheme === 'synthwave' || savedTheme === 'macos')) {
          setThemeState(savedTheme);
          
          // Apply theme class to document body
          document.body.classList.remove('theme-retro90s', 'theme-nordic', 'nordic-text-fix', 'theme-synthwave', 'theme-macos');
          if (savedTheme === 'retro90s') {
            //console.log('Applying retro90s theme from localStorage');
            document.body.classList.add('theme-retro90s');
            document.documentElement.style.setProperty('--theme-background', 'linear-gradient(135deg, #000066, #330066)');
          } else if (savedTheme === 'nordic') {
            //console.log('Applying nordic theme from localStorage');
            document.body.classList.add('theme-nordic', 'nordic-text-fix');
            document.documentElement.style.removeProperty('--theme-background');
          } else if (savedTheme === 'synthwave') {
            //console.log('Applying synthwave theme from localStorage');
            document.body.classList.add('theme-synthwave');
            document.documentElement.style.setProperty('--theme-background', 'linear-gradient(135deg, #121212, #1a0033)');
          } else if (savedTheme === 'macos') {
            document.body.classList.add('theme-macos');
            document.documentElement.style.removeProperty('--theme-background');
            document.documentElement.style.setProperty('--macos-bg', randomPastel());
          } else {
            document.documentElement.style.removeProperty('--theme-background');
          }
        } else {
          // No saved theme – apply macOS default
          document.body.classList.add('theme-macos');
          document.documentElement.style.setProperty('--macos-bg', randomPastel());
        }
        
        // Load saved volume
        const savedVolume = localStorage.getItem('planning-poker-audio-volume');
        if (savedVolume !== null) {
          setVolumeState(parseFloat(savedVolume));
        }
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
    }
    
    setIsInitialized(true);
  }, []);
  
  // Toggle audio enabled/disabled
  const toggleAudio = () => {
    const newAudioEnabled = !audioEnabled;
    setAudioEnabled(newAudioEnabled);
    
    try {
      localStorage.setItem('planning-poker-audio-enabled', String(newAudioEnabled));
    } catch (error) {
      console.error('Error writing audio preference to localStorage:', error);
    }
  };
  
  // Set volume and save to localStorage
  const setVolume = (newVolume: number) => {
    setVolumeState(newVolume);
    
    try {
      localStorage.setItem('planning-poker-audio-volume', String(newVolume));
    } catch (error) {
      console.error('Error writing volume to localStorage:', error);
    }
  };
  
  // Save theme to localStorage when it changes
  const setTheme = (newTheme: ThemeType) => {
    //console.log('Setting theme to:', newTheme);
    setThemeState(newTheme);
    
    try {
      localStorage.setItem('planning-poker-theme', newTheme);
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
    
    // Apply theme class to document body
    document.body.classList.remove('theme-retro90s', 'theme-nordic', 'nordic-text-fix', 'theme-synthwave', 'theme-macos');
    
    if (newTheme === 'retro90s') {
      //console.log('Adding theme-retro90s class to body');
      document.body.classList.add('theme-retro90s');
      document.documentElement.style.setProperty('--theme-background', 'linear-gradient(135deg, #000066, #330066)');
    } else if (newTheme === 'nordic') {
      //console.log('Adding theme-nordic class to body');
      document.body.classList.add('theme-nordic', 'nordic-text-fix');
      document.documentElement.style.removeProperty('--theme-background');
    } else if (newTheme === 'synthwave') {
      //console.log('Adding theme-synthwave class to body');
      document.body.classList.add('theme-synthwave');
      document.documentElement.style.setProperty('--theme-background', 'linear-gradient(135deg, #121212, #1a0033)');
    } else if (newTheme === 'macos') {
      document.body.classList.add('theme-macos');
      document.documentElement.style.removeProperty('--theme-background');
      document.documentElement.style.setProperty('--macos-bg', randomPastel());
    } else {
      //console.log('Removing theme classes from body');
      document.documentElement.style.removeProperty('--theme-background');
    }
  };
  
  if (!isInitialized) {
    return <>{children}</>;
  }
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme, audioEnabled, toggleAudio, volume, setVolume }}>
      {children}
    </ThemeContext.Provider>
  );
}; 