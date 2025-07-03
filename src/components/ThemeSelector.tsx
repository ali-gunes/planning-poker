'use client';

import React, { useState, useEffect } from 'react';
import { useTheme, ThemeType } from '@/contexts/ThemeContext';
import { AudioPlayer } from '@/components/AudioPlayer';

interface ThemeOption {
  id: ThemeType;
  name: string;
  icon: string;
  description: string;
  audioDescription: string;
}

const themeOptions: ThemeOption[] = [
  {
    id: 'default',
    name: 'Modern',
    icon: '🌑',
    description: 'Modern koyu tema',
    audioDescription: 'Chopin Nocturne Op. 9 No. 2'
  },
  {
    id: 'synthwave',
    name: 'Synthwave',
    icon: '🌃',
    description: '80\'lerin neon retro-futuristik teması',
    audioDescription: 'Chill Synthwave'
  },
  {
    id: 'retro90s',
    name: 'Retro 90s',
    icon: '🌈',
    description: '90\'ların nostaljik teknoloji teması',
    audioDescription: 'Midnight Run'
  },
  /*{
    id: 'nordic',
    name: 'Nordic',
    icon: '❄️',
    description: 'Minimal İskandinav tasarımı',
    audioDescription: 'Minimal ambient müzik'
  },*/
];

export function ThemeSelector() {
  const { theme, setTheme, audioEnabled } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  
  // Debug current theme
  useEffect(() => {
    console.log('Current theme:', theme);
    console.log('Body classes:', document.body.classList.toString());
  }, [theme]);
  
  const toggleDropdown = () => setIsOpen(!isOpen);
  
  const handleThemeChange = (newTheme: ThemeType) => {
    console.log('Changing theme to:', newTheme);
    setTheme(newTheme);
    setIsOpen(false);
    
    // Debug after theme change
    setTimeout(() => {
      console.log('Body classes after change:', document.body.classList.toString());
    }, 100);
  };
  
  // Find current theme details
  const currentTheme = themeOptions.find(option => option.id === theme) || themeOptions[0];
  
  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="theme-selector-btn flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
      >
        <span className="text-xl">{currentTheme.icon}</span>
        <span className="hidden sm:inline">{currentTheme.name}</span>
      </button>
      
      {isOpen && (
        <div className="theme-selector-dropdown absolute right-0 top-full mt-2 w-64 rounded-lg shadow-xl z-50">
          <div className="p-2 space-y-1">
            {themeOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleThemeChange(option.id)}
                className={`theme-selector-option w-full text-left px-3 py-2 rounded-md flex items-center gap-3 transition-colors ${
                  theme === option.id ? 'theme-selector-option-active' : ''
                }`}
              >
                <span className="text-2xl">{option.icon}</span>
                <div>
                  <div className="font-medium">{option.name}</div>
                  <div className="text-xs opacity-80">{option.description}</div>
                  <div className="text-xs mt-1 opacity-70">
                    {audioEnabled ? '🔊' : '🔇'} {option.audioDescription}
                  </div>
                </div>
              </button>
            ))}
            
            {/* Audio Player inside dropdown - visual only */}
            <div className="mt-2 pt-2 border-t border-gray-600">
              <AudioPlayer isMainPlayer={false} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 