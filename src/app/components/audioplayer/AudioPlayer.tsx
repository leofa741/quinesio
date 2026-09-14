// components/AudioPlayer.tsx
'use client';

import { useState, useRef, useEffect } from 'react';

interface AudioPlayerProps {
  src: string;
  title?: string;
  description?: string;
  autoPlay?: boolean;
  showTranscript?: boolean;
  transcript?: string;
  className?: string;
}

export default function AudioPlayer({
  src,
  title = 'Reproducción de audio',
  description,
  autoPlay = true,
  showTranscript = true,
  transcript,
  className = '',
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showTranscriptPanel, setShowTranscriptPanel] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Formatear tiempo en mm:ss
  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Actualizar tiempo actual
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Cambiar volumen
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // Buscar en la barra de progreso
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !audioRef.current) return;

    const rect = progressRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pos * duration;
  };

  // Retroceder/avanzar 10 segundos
  const skip = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime += seconds;
  };

  // Atajos de teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case ' ':
      case 'k':
        e.preventDefault();
        togglePlayPause();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        skip(-10);
        break;
      case 'ArrowRight':
        e.preventDefault();
        skip(10);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setVolume((prev) => Math.min(1, prev + 0.1));
        if (audioRef.current) audioRef.current.volume = Math.min(1, volume + 0.1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        setVolume((prev) => Math.max(0, prev - 0.1));
        if (audioRef.current) audioRef.current.volume = Math.max(0, volume - 0.1);
        break;
    }
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`bg-gray-900 rounded-lg p-6 shadow-lg ${className}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label={title}
    >
      {/* Audio element oculto */}
      <audio
        ref={audioRef}
        src={src}
        autoPlay={autoPlay}
        aria-hidden="true"
      />

      {/* Título y descripción accesibles */}
      <div className="mb-4">
        <h3 className="text-white text-lg font-semibold mb-1">{title}</h3>
        {description && (
          <p className="text-gray-400 text-sm">{description}</p>
        )}
      </div>

      {/* Barra de progreso */}
      <div className="mb-4">
        <div
          ref={progressRef}
          className="w-full h-2 bg-gray-700 rounded-full cursor-pointer relative overflow-hidden"
          onClick={handleProgressClick}
          role="slider"
          aria-label="Progreso del audio"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-valuetext={`${formatTime(currentTime)} de ${formatTime(duration)}`}
          tabIndex={0}
        >
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Tiempos */}
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span aria-live="polite">{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controles principales */}
      <div className="flex items-center justify-between mb-4">
        {/* Botones de control */}
        <div className="flex items-center gap-3">
          {/* Retroceder 10s */}
          <button
            onClick={() => skip(-10)}
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-800"
            aria-label="Retroceder 10 segundos"
            title="Retroceder 10 segundos"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
            </svg>
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlayPause}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full p-4 transition-all transform hover:scale-105 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            aria-label={isPlaying ? 'Pausar audio' : 'Reproducir audio'}
            aria-pressed={isPlaying}
          >
            {isPlaying ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Avanzar 10s */}
          <button
            onClick={() => skip(10)}
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-800"
            aria-label="Avanzar 10 segundos"
            title="Avanzar 10 segundos"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
            </svg>
          </button>
        </div>

        {/* Control de volumen */}
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-20 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            aria-label="Control de volumen"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={volume * 100}
          />
        </div>
      </div>

      {/* Botón de transcripción */}
      {showTranscript && transcript && (
        <div className="border-t border-gray-700 pt-4">
          <button
            onClick={() => setShowTranscriptPanel(!showTranscriptPanel)}
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium"
            aria-expanded={showTranscriptPanel}
            aria-controls="transcript-panel"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {showTranscriptPanel ? 'Ocultar transcripción' : 'Mostrar transcripción'}
          </button>

          {showTranscriptPanel && (
            <div
              id="transcript-panel"
              className="mt-3 p-4 bg-gray-800 rounded-lg text-gray-300 text-sm leading-relaxed max-h-48 overflow-y-auto"
              role="region"
              aria-label="Transcripción del audio"
            >
              {transcript}
            </div>
          )}
        </div>
      )}

      {/* Instrucciones de accesibilidad */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-xs text-gray-500">
          <strong>Atajos de teclado:</strong> Espacio/K (Play/Pausa) | ← → (Retroceder/Avanzar 10s) | ↑ ↓ (Volumen)
        </p>
      </div>
    </div>
  );
}