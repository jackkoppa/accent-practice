import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { WordDetail } from '../types';

interface AudioPlaybackProps {
  audioUrl: string;
  wordDetails?: WordDetail[];
  referenceText: string;
  onWordHighlight?: (wordIndex: number) => void;
}

export const AudioPlayback: React.FC<AudioPlaybackProps> = ({
  audioUrl,
  wordDetails,
  referenceText: _referenceText, // For future use
  onWordHighlight,
}) => {
  void _referenceText; // Silence unused variable warning
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const animationFrameRef = useRef<number>();

  // Convert Azure timing (100-nanosecond units) to seconds
  const ticksToSeconds = (ticks: number | undefined): number => {
    if (!ticks) return 0;
    return ticks / 10000000; // 10 million ticks per second
  };

  // Find which word is currently being spoken based on audio time
  const findCurrentWord = useCallback((time: number) => {
    if (!wordDetails || wordDetails.length === 0) return -1;
    
    for (let i = 0; i < wordDetails.length; i++) {
      const word = wordDetails[i];
      const startTime = ticksToSeconds(word.offset);
      const endTime = startTime + ticksToSeconds(word.duration);
      
      if (time >= startTime && time <= endTime) {
        return i;
      }
    }
    
    // If between words, return the last word that was spoken
    for (let i = wordDetails.length - 1; i >= 0; i--) {
      const word = wordDetails[i];
      const endTime = ticksToSeconds(word.offset) + ticksToSeconds(word.duration);
      if (time >= endTime) {
        return i;
      }
    }
    
    return -1;
  }, [wordDetails]);

  // Update current word during playback
  const updatePlayback = useCallback(() => {
    if (audioRef.current && isPlaying) {
      const time = audioRef.current.currentTime;
      setCurrentTime(time);
      
      const wordIdx = findCurrentWord(time);
      if (wordIdx !== currentWordIndex) {
        setCurrentWordIndex(wordIdx);
        onWordHighlight?.(wordIdx);
      }
      
      animationFrameRef.current = requestAnimationFrame(updatePlayback);
    }
  }, [isPlaying, findCurrentWord, currentWordIndex, onWordHighlight]);

  useEffect(() => {
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updatePlayback);
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, updatePlayback]);

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
      setCurrentWordIndex(-1);
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentWordIndex(-1);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Check if we have timing data
  const hasTimingData = wordDetails?.some(w => w.offset !== undefined && w.offset !== null);

  return (
    <div className="neo-card">
      <audio
        ref={audioRef}
        src={audioUrl}
        onEnded={handleEnded}
        onLoadedMetadata={handleLoadedMetadata}
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
      {!hasTimingData && (
        <p className="text-xs text-gray-500 mt-2">
          Word-by-word timing not available for this recording
        </p>
      )}
      
      {/* Current word indicator */}
      {hasTimingData && currentWordIndex >= 0 && wordDetails && wordDetails[currentWordIndex] && (
        <p className="text-xs text-gray-600 mt-2">
          Current word: <span className="font-bold">{wordDetails[currentWordIndex].word}</span>
        </p>
      )}
    </div>
  );
};
