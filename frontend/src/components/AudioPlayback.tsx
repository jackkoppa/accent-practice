import React, { useState, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { WordDetail } from '../types';

interface AudioPlaybackProps {
  audioUrl: string;
  wordDetails?: WordDetail[];
}

export const AudioPlayback: React.FC<AudioPlaybackProps> = ({
  audioUrl,
  wordDetails,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Check if we have timing data
  const hasTimingData = wordDetails?.some(w => w.offset !== undefined && w.offset !== null);

  const handlePlay = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="neo-card">
      <audio
        ref={audioRef}
        src={audioUrl}
        onEnded={handleEnded}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
      />
      
      <div className="flex items-center gap-3">
        {/* Play/Pause button */}
        <button
          onClick={isPlaying ? handlePause : handlePlay}
          className="w-12 h-12 bg-neo-main border-3 border-black shadow-neo-sm flex items-center justify-center
                     hover:shadow-neo-pressed hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>
        
        {/* Restart button */}
        <button
          onClick={handleRestart}
          className="w-10 h-10 bg-white border-3 border-black shadow-neo-sm flex items-center justify-center
                     hover:shadow-neo-pressed hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
          title="Restart"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        
        {/* Progress info */}
        <div className="flex-1">
          <div className="flex items-center justify-between text-sm font-bold mb-1">
            <span>Play Recording</span>
            <span className="text-gray-500">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="h-2 bg-gray-200 border-2 border-black">
            <div 
              className="h-full bg-neo-main transition-all duration-100"
              style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
            />
          </div>
        </div>
      </div>
      
      {/* Timing indicator */}
      {hasTimingData && (
        <p className="text-xs text-gray-500 mt-2">
          Word timing data available
        </p>
      )}
    </div>
  );
};
