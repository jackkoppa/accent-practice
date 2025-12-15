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
            <Square className="w-10 h-10" />
            <span className="text-lg font-black">STOP</span>
          </>
        );
      case 'processing':
        return (
          <>
            <Loader2 className="w-10 h-10 animate-spin" />
            <span className="text-lg font-black">ANALYZING...</span>
          </>
        );
      default:
        return (
          <>
            <Mic className="w-10 h-10" />
            <span className="text-lg font-black">RECORD</span>
          </>
        );
    }
  };

  const getButtonStyles = () => {
    const base = "flex flex-col items-center justify-center gap-2 w-40 h-40 font-black transition-all duration-150 border-3 border-black";
    
    if (disabled || recordingState === 'processing') {
      return `${base} bg-gray-300 text-gray-500 cursor-not-allowed`;
    }
    
    if (recordingState === 'recording') {
      return `${base} bg-neo-error text-white recording-pulse shadow-neo`;
    }
    
    return `${base} bg-neo-main text-black shadow-neo hover:shadow-neo-lg hover:-translate-x-[2px] hover:-translate-y-[2px] active:shadow-neo-pressed active:translate-x-[3px] active:translate-y-[3px]`;
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
        <p className="text-neo-error font-black animate-pulse flex items-center gap-2">
          <span className="w-3 h-3 bg-neo-error rounded-full animate-pulse" />
          Recording... Click to stop
        </p>
      )}
      
      {recordingState === 'idle' && (
        <p className="text-gray-600 font-medium">
          Click to start recording
        </p>
      )}
    </div>
  );
};
