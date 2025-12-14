import React, { useRef, useCallback } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { RecordingState } from '../types';

interface AudioRecorderProps {
  recordingState: RecordingState;
  onRecordingComplete: (audioBlob: Blob) => void;
  onRecordingStart: () => void;
  onRecordingStop: () => void;
  disabled?: boolean;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  recordingState,
  onRecordingComplete,
  onRecordingStart,
  onRecordingStop,
  disabled = false,
}) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
        onRecordingComplete(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      onRecordingStart();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please ensure you have granted permission.');
    }
  }, [onRecordingComplete, onRecordingStart]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      onRecordingStop();
    }
  }, [onRecordingStop]);

  const handleClick = () => {
    if (recordingState === 'idle') {
      startRecording();
    } else if (recordingState === 'recording') {
      stopRecording();
    }
  };

  const getButtonContent = () => {
    switch (recordingState) {
      case 'recording':
        return (
          <>
            <Square className="w-8 h-8" />
            <span>Stop Recording</span>
          </>
        );
      case 'processing':
        return (
          <>
            <Loader2 className="w-8 h-8 animate-spin" />
            <span>Analyzing...</span>
          </>
        );
      default:
        return (
          <>
            <Mic className="w-8 h-8" />
            <span>Start Recording</span>
          </>
        );
    }
  };

  const getButtonStyles = () => {
    const base = "flex flex-col items-center justify-center gap-2 w-40 h-40 rounded-full font-semibold transition-all duration-300 shadow-lg";
    
    if (disabled || recordingState === 'processing') {
      return `${base} bg-gray-300 text-gray-500 cursor-not-allowed`;
    }
    
    if (recordingState === 'recording') {
      return `${base} bg-red-500 hover:bg-red-600 text-white recording-pulse shadow-red-300`;
    }
    
    return `${base} bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white hover:scale-105 shadow-indigo-300`;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={handleClick}
        disabled={disabled || recordingState === 'processing'}
        className={getButtonStyles()}
      >
        {getButtonContent()}
      </button>
      
      {recordingState === 'recording' && (
        <p className="text-red-500 font-medium animate-pulse">
          🔴 Recording... Click to stop
        </p>
      )}
      
      {recordingState === 'idle' && (
        <p className="text-gray-500 text-sm">
          Click to start recording your voice
        </p>
      )}
    </div>
  );
};
