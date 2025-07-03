'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface AudioPlayerProps {
  initialVolume?: number; // Initial volume between 0 and 1
}

export function AudioPlayer({ initialVolume = 0.3 }: AudioPlayerProps) {
  const { theme, audioEnabled, toggleAudio } = useTheme();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(initialVolume);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const volumeControlTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const visualizerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Map themes to audio files
  const themeAudioMap = {
    default: '/sounds/chopin-nocturne-op-9-no-2.mp3',
    retro90s: '/sounds/midnight-run.mp3',
    nordic: '/sounds/nordic-ambient.mp3',
    synthwave: '/sounds/chill-synthwave.mp3',
  };

  // Initialize audio context and analyzer
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const initAudioAnalyzer = () => {
      if (!audioRef.current) return;
      
      try {
        // Create audio context
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContext();
        
        // Create analyzer
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        
        // Connect audio to analyzer
        const source = audioContextRef.current.createMediaElementSource(audioRef.current);
        source.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
      } catch (error) {
        console.error('Error initializing audio analyzer:', error);
      }
    };
    
    // Initialize on first user interaction
    const handleFirstInteraction = () => {
      if (!audioContextRef.current && audioRef.current) {
        initAudioAnalyzer();
      }
      document.removeEventListener('click', handleFirstInteraction);
    };
    
    document.addEventListener('click', handleFirstInteraction);
    
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Update audio source when theme changes
  useEffect(() => {
    if (!audioRef.current) return;
    
    const audioPath = themeAudioMap[theme];
    audioRef.current.src = audioPath;
    
    if (audioEnabled) {
      audioRef.current.play().catch(err => {
        console.error('Error playing audio:', err);
      });
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [theme, audioEnabled]);

  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    
    // Save volume preference to localStorage
    try {
      localStorage.setItem('planning-poker-audio-volume', String(volume));
    } catch (error) {
      console.error('Error saving volume to localStorage:', error);
    }
  }, [volume]);
  
  // Load saved volume from localStorage on initial render
  useEffect(() => {
    try {
      const savedVolume = localStorage.getItem('planning-poker-audio-volume');
      if (savedVolume !== null) {
        setVolume(parseFloat(savedVolume));
      }
    } catch (error) {
      console.error('Error loading volume from localStorage:', error);
    }
  }, []);

  // Draw visualizer animation
  useEffect(() => {
    if (!canvasRef.current || !analyserRef.current || !isPlaying || !showVisualizer) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      if (!canvas || !ctx || !analyser) return;
      
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Different visualizer styles based on theme
      switch (theme) {
        case 'retro90s':
          drawRetro90sVisualizer(ctx, canvas, dataArray, bufferLength);
          break;
        case 'nordic':
          drawNordicVisualizer(ctx, canvas, dataArray, bufferLength);
          break;
        case 'synthwave':
          drawSynthwaveVisualizer(ctx, canvas, dataArray, bufferLength);
          break;
        default:
          drawDefaultVisualizer(ctx, canvas, dataArray, bufferLength);
      }
    };
    
    draw();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isPlaying, showVisualizer, theme]);

  // Visualizer drawing functions
  const drawDefaultVisualizer = (
    ctx: CanvasRenderingContext2D, 
    canvas: HTMLCanvasElement, 
    dataArray: Uint8Array, 
    bufferLength: number
  ) => {
    const barWidth = (canvas.width / bufferLength) * 2.5;
    let x = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = dataArray[i] / 2;
      
      ctx.fillStyle = `rgba(63, 114, 175, ${barHeight / 100})`;
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
      
      x += barWidth + 1;
    }
  };
  
  const drawRetro90sVisualizer = (
    ctx: CanvasRenderingContext2D, 
    canvas: HTMLCanvasElement, 
    dataArray: Uint8Array, 
    bufferLength: number
  ) => {
    const barWidth = (canvas.width / bufferLength) * 2.5;
    let x = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = dataArray[i] / 2;
      
      // Create gradient from cyan to magenta
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
      gradient.addColorStop(0, '#00ffff');
      gradient.addColorStop(1, '#ff00ff');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
      
      // Add pixelated effect
      if (barHeight > 5) {
        ctx.fillStyle = '#ffffff';
        for (let j = 0; j < barHeight; j += 5) {
          ctx.fillRect(x, canvas.height - j - 1, barWidth, 1);
        }
      }
      
      x += barWidth + 1;
    }
  };
  
  const drawNordicVisualizer = (
    ctx: CanvasRenderingContext2D, 
    canvas: HTMLCanvasElement, 
    dataArray: Uint8Array, 
    bufferLength: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    
    const sliceWidth = canvas.width / bufferLength;
    let x = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = canvas.height - (v * canvas.height / 2);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      x += sliceWidth;
    }
    
    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(63, 114, 175, 0.5)');
    gradient.addColorStop(1, 'rgba(219, 226, 239, 0.1)');
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Add line on top
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    x = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = canvas.height - (v * canvas.height / 2);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      x += sliceWidth;
    }
    
    ctx.strokeStyle = '#3F72AF';
    ctx.lineWidth = 2;
    ctx.stroke();
  };
  
  const drawSynthwaveVisualizer = (
    ctx: CanvasRenderingContext2D, 
    canvas: HTMLCanvasElement, 
    dataArray: Uint8Array, 
    bufferLength: number
  ) => {
    // Draw grid
    ctx.strokeStyle = 'rgba(153, 0, 255, 0.2)';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i < canvas.height; i += 10) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }
    
    // Vertical bars
    const barWidth = (canvas.width / bufferLength) * 2.5;
    let x = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = dataArray[i] / 2;
      
      // Create gradient
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
      gradient.addColorStop(0, '#FF00FF'); // Pink
      gradient.addColorStop(0.5, '#9900FF'); // Purple
      gradient.addColorStop(1, '#00FFFF'); // Cyan
      
      ctx.fillStyle = gradient;
      
      // Draw with glow effect
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#FF00FF';
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
      ctx.shadowBlur = 0;
      
      x += barWidth + 1;
    }
    
    // Add sun effect
    const centerX = canvas.width / 2;
    const centerY = canvas.height + 50;
    const radius = 100;
    
    const sunGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    sunGradient.addColorStop(0, 'rgba(255, 0, 255, 0.8)');
    sunGradient.addColorStop(0.5, 'rgba(255, 0, 255, 0.3)');
    sunGradient.addColorStop(1, 'rgba(255, 0, 255, 0)');
    
    ctx.fillStyle = sunGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleToggleAudio = () => {
    toggleAudio();
  };
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };
  
  const handleMouseEnter = () => {
    if (volumeControlTimeoutRef.current) {
      clearTimeout(volumeControlTimeoutRef.current);
      volumeControlTimeoutRef.current = null;
    }
    setShowVolumeControl(true);
  };
  
  const handleMouseLeave = () => {
    volumeControlTimeoutRef.current = setTimeout(() => {
      setShowVolumeControl(false);
    }, 2000);
  };
  
  const handleToggleVisualizer = () => {
    setShowVisualizer(prev => !prev);
  };
  
  // Format volume as percentage
  const volumePercentage = Math.round(volume * 100);

  return (
    <div 
      className={`audio-player ${showVisualizer ? 'audio-player-expanded' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <audio 
        ref={audioRef}
        loop
        preload="auto"
      />
      
      {/* Audio visualizer */}
      {showVisualizer && isPlaying && (
        <div className="audio-visualizer">
          <canvas 
            ref={canvasRef}
            width={200}
            height={80}
            className="visualizer-canvas"
          />
        </div>
      )}
      
      {/* Volume slider - appears when hovering */}
      <div className={`volume-control ${showVolumeControl ? 'volume-control-visible' : ''}`}>
        <div className="volume-display">{volumePercentage}%</div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          className="volume-slider"
        />
      </div>
      
      <div className="audio-controls">
        <button 
          onClick={handleToggleAudio}
          className="audio-control-btn"
          aria-label={isPlaying ? 'Mute music' : 'Play music'}
          title={isPlaying ? 'Mute music' : 'Play music'}
        >
          {isPlaying ? (
            volume > 0.7 ? '🔊' : volume > 0.3 ? '🔉' : volume > 0 ? '🔈' : '🔇'
          ) : '🔇'}
        </button>
        
        {isPlaying && (
          <button
            onClick={handleToggleVisualizer}
            className="visualizer-toggle-btn"
            aria-label={showVisualizer ? 'Hide visualizer' : 'Show visualizer'}
            title={showVisualizer ? 'Hide visualizer' : 'Show visualizer'}
          >
            {showVisualizer ? '📊' : '📈'}
          </button>
        )}
      </div>
    </div>
  );
} 