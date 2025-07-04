'use client';

import React, { useState, useEffect } from 'react';
import { useTheme, ThemeType } from '@/contexts/ThemeContext';

type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
  position?: ToastPosition;
}

export function Toast({ 
  message, 
  type = 'success', 
  isVisible, 
  onClose, 
  duration = 3000,
  position = 'top-right'
}: ToastProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    if (isVisible) {
      // Start close animation after duration
      const timer = setTimeout(() => {
        setIsAnimating(true);
        // Wait for animation to complete before calling onClose
        setTimeout(() => {
          onClose();
          setIsAnimating(false);
        }, 300);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  // Get theme-specific styles
  const themeStyles = getThemeStyles(theme, type);

  // Define styles based on type
  const styles = {
    success: {
      bg: `${themeStyles.bg} border-l-4 border-green-500`,
      icon: '✅',
      iconClass: themeStyles.successIconClass
    },
    error: {
      bg: `${themeStyles.bg} border-l-4 border-red-500`,
      icon: '❌',
      iconClass: themeStyles.errorIconClass
    },
    info: {
      bg: `${themeStyles.bg} border-l-4 border-blue-500`,
      icon: 'ℹ️',
      iconClass: themeStyles.infoIconClass
    }
  }[type];

  // Define position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  }[position];

  // Define animation based on position
  const animationClasses = {
    'top-right': isAnimating ? 'opacity-0 translate-y-[-20px]' : 'opacity-100 translate-y-0',
    'top-left': isAnimating ? 'opacity-0 translate-y-[-20px]' : 'opacity-100 translate-y-0',
    'bottom-right': isAnimating ? 'opacity-0 translate-y-[20px]' : 'opacity-100 translate-y-0',
    'bottom-left': isAnimating ? 'opacity-0 translate-y-[20px]' : 'opacity-100 translate-y-0',
    'top-center': isAnimating ? 'opacity-0 translate-y-[-20px]' : 'opacity-100 translate-y-0',
    'bottom-center': isAnimating ? 'opacity-0 translate-y-[20px]' : 'opacity-100 translate-y-0'
  }[position];

  return (
    <div className={`fixed ${positionClasses} z-50 flex items-center justify-center`}>
      <div 
        className={`${styles.bg} text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 transform transition-all duration-300 ${animationClasses}`}
        style={{
          boxShadow: themeStyles.boxShadow
        }}
      >
        <span className={`text-lg ${styles.iconClass}`}>{styles.icon}</span>
        <p className={`font-medium ${themeStyles.textClass}`}>{message}</p>
        <button 
          onClick={() => {
            setIsAnimating(true);
            setTimeout(() => {
              onClose();
              setIsAnimating(false);
            }, 300);
          }}
          className={`ml-3 ${themeStyles.closeButtonClass}`}
          aria-label="Close"
        >
          {themeStyles.closeIcon}
        </button>
      </div>
    </div>
  );
}

function getThemeStyles(theme: ThemeType, type: string) {
  const baseStyles = {
    bg: 'bg-gray-800',
    textClass: 'text-gray-100',
    successIconClass: 'text-green-500',
    errorIconClass: 'text-red-500',
    infoIconClass: 'text-blue-500',
    closeButtonClass: 'text-gray-400 hover:text-white transition-colors',
    closeIcon: '✕',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
  };

  switch (theme) {
    case 'retro90s':
      return {
        ...baseStyles,
        bg: 'bg-blue-900',
        textClass: 'text-white font-bold',
        successIconClass: 'text-yellow-300',
        errorIconClass: 'text-red-300',
        infoIconClass: 'text-cyan-300',
        closeButtonClass: 'text-pink-300 hover:text-white transition-colors',
        closeIcon: '×',
        boxShadow: '0 0 10px #00ffff, 0 0 20px rgba(0, 255, 255, 0.5)'
      };
    case 'nordic':
      return {
        ...baseStyles,
        bg: 'bg-slate-700',
        textClass: 'text-slate-100',
        successIconClass: 'text-emerald-400',
        errorIconClass: 'text-red-400',
        infoIconClass: 'text-sky-400',
        closeButtonClass: 'text-slate-400 hover:text-white transition-colors',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
      };
    case 'synthwave':
      return {
        ...baseStyles,
        bg: 'bg-purple-900/80',
        textClass: 'text-pink-100',
        successIconClass: 'text-green-400',
        errorIconClass: 'text-red-400',
        infoIconClass: 'text-blue-400',
        closeButtonClass: 'text-pink-400 hover:text-white transition-colors',
        boxShadow: '0 0 15px rgba(255, 0, 255, 0.5), 0 0 30px rgba(255, 0, 255, 0.3)'
      };
    default:
      return baseStyles;
  }
} 