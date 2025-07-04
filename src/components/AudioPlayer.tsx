'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface AudioPlayerProps {
  initialVolume?: number; // Initial volume between 0 and 1
  isMainPlayer?: boolean; // Whether this is the main player that actually plays audio
}

// Define a type for the AudioContext constructor
interface AudioContextConstructor {
  new(): AudioContext;
}

// Define window with webkitAudioContext
interface WindowWithWebkitAudioContext extends Window {
  webkitAudioContext?: typeof AudioContext;
}

export function AudioPlayer({ isMainPlayer = false }: AudioPlayerProps) {
  const { theme, audioEnabled, toggleAudio, volume, setVolume } = useTheme();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [hasShownInitialHint, setHasShownInitialHint] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Map themes to audio files using useMemo to prevent recreation on every render
  const themeAudioMap = useMemo(() => ({
    default: '/sounds/chopin-nocturne-op-9-no-2.mp3',
    retro90s: '/sounds/midnight-run.mp3',
    nordic: '/sounds/nordic-ambient.mp3',
    synthwave: '/sounds/chill-synthwave.mp3',
  }), []);

  // Initialize audio context and analyzer
  useEffect(() => {
    if (typeof window === 'undefined' || !isMainPlayer) return;
    
    const initAudioAnalyzer = () => {
      if (!audioRef.current) return;
      
      try {
        // Create audio context with proper typing
        const AudioContext = (window.AudioContext || 
          (window as WindowWithWebkitAudioContext).webkitAudioContext) as AudioContextConstructor;
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
  }, [isMainPlayer]);

  // Update audio source when theme changes
  useEffect(() => {
    if (!audioRef.current || !isMainPlayer) return;
    
    const audioPath = themeAudioMap[theme];
    audioRef.current.src = audioPath;
    
    if (audioEnabled) {
      audioRef.current.play().catch(err => {
        console.error('Error playing audio:', err);
      });
      setIsPlaying(true);
      // Show visualizer when audio is enabled
      setShowVisualizer(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [theme, audioEnabled, themeAudioMap, isMainPlayer]);

  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current && isMainPlayer) {
      audioRef.current.volume = volume;
    }
  }, [volume, isMainPlayer]);

  // Show a hint to the user about audio on first render
  useEffect(() => {
    if (!hasShownInitialHint && !isMainPlayer) {
      setShowHint(true);
      setHasShownInitialHint(true);
      
      // Hide the hint after 6 seconds
      const timer = setTimeout(() => {
        setShowHint(false);
      }, 6000);
      
      return () => clearTimeout(timer);
    }
  }, [hasShownInitialHint, isMainPlayer]);

  // Draw visualizer animation
  useEffect(() => {
    if (!canvasRef.current || !analyserRef.current || !isPlaying || !showVisualizer || !isMainPlayer) {
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
  }, [isPlaying, showVisualizer, theme, isMainPlayer]);

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
  
  // Format volume as percentage
  const volumePercentage = Math.round(volume * 100);

  // For visual-only player in the dropdown, simulate the visualizer
  const drawDemoVisualizer = useCallback(() => {
    if (!canvasRef.current || !audioEnabled) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Create demo data for visualizer
    const bufferLength = 128;
    const dataArray = new Uint8Array(bufferLength);
    
    // Fill with demo data
    for (let i = 0; i < bufferLength; i++) {
      // Create a wave pattern
      dataArray[i] = 50 + Math.sin(i / 10) * 30 + Math.sin(Date.now() / 500 + i / 5) * 20;
    }
    
    // Draw based on theme
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
  }, [audioEnabled, theme, canvasRef]);
  
  // Animate demo visualizer for dropdown
  useEffect(() => {
    if (isMainPlayer || !audioEnabled) return;
    
    const animateDemoVisualizer = () => {
      drawDemoVisualizer();
      animationRef.current = requestAnimationFrame(animateDemoVisualizer);
    };
    
    animationRef.current = requestAnimationFrame(animateDemoVisualizer);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isMainPlayer, audioEnabled, theme, drawDemoVisualizer]);

  return (
    <div className="audio-player-container">
      {isMainPlayer && (
        <audio 
          ref={audioRef}
          loop
          preload="none" // Changed from 'auto' to 'none' to prevent any preloading
          muted={!audioEnabled} // Ensure audio is muted when not enabled
        />
      )}
      
      {/* Audio hint tooltip */}
      {showHint && (
        <div className="audio-hint">
          {audioEnabled ? 'Müzik çalıyor! 🎧' : 'Müziği çalmak için tıklayın 🎧'}
        </div>
      )}
      
      {/* Audio visualizer */}
      <div className={`audio-visualizer ${!audioEnabled ? 'audio-visualizer-hidden' : ''}`}>
        <canvas 
          ref={canvasRef}
          width={200}
          height={60}
          className="visualizer-canvas"
        />
      </div>
      
      {/* Audio controls */}
      <div className="audio-controls-row">
        <button 
          onClick={handleToggleAudio}
          className="audio-control-btn"
          aria-label={audioEnabled ? 'Müziği durdur' : 'Müziği çal'}
          title={audioEnabled ? 'Müziği durdur' : 'Müziği çal'}
        >
          {audioEnabled ? '⏸️' : '▶️'}
        </button>
        
        <div className="volume-control-container">
          <div className="volume-slider-row">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="volume-slider"
            />
            <div className="volume-percentage">{volumePercentage}%</div>
          </div>
        </div>
      </div>
    </div>
  );
} 