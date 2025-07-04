'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Toast } from '../components/Toast';

type ToastType = 'success' | 'error' | 'info';
type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number, position?: ToastPosition) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('success');
  const [duration, setDuration] = useState(3000);
  const [position, setPosition] = useState<ToastPosition>('top-right');

  const showToast = (
    message: string, 
    type: ToastType = 'success', 
    duration: number = 3000,
    position: ToastPosition = 'top-right'
  ) => {
    setMessage(message);
    setType(type);
    setDuration(duration);
    setPosition(position);
    setIsVisible(true);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast 
        message={message} 
        type={type} 
        isVisible={isVisible} 
        onClose={handleClose} 
        duration={duration}
        position={position}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
} 