import React, { useState } from 'react';
import { BookOpen, ChevronRight, ChevronLeft, Edit3, Check, X } from 'lucide-react';
import { Sentence, WordDetail } from '../types';
import { AnimatedWords } from './AnimatedWords';

interface SentenceCardProps {
  sentence: Sentence;
  onNext: () => void;
  onPrev: () => void;
  currentIndex: number;
  totalCount: number;
  customText?: string;
  onCustomTextChange?: (text: string) => void;
  isCustomMode?: boolean;
  onToggleCustomMode?: () => void;
  wordDetails?: WordDetail[];
  showWordScores?: boolean;
}

export const SentenceCard: React.FC<SentenceCardProps> = ({
  sentence,
  onNext,
  onPrev,
  currentIndex,
  totalCount,
  customText,
  onCustomTextChange,
  isCustomMode = false,
  onToggleCustomMode,
  wordDetails,
  showWordScores = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(customText || '');

  const getDifficultyColor = () => {
    switch (sentence.difficulty) {
      case 'easy':
        return 'bg-neo-success border-black';
      case 'medium':
        return 'bg-neo-warning border-black';
      case 'hard':
        return 'bg-neo-error border-black';
    }
  };

  const handleSaveCustom = () => {
    if (editValue.trim() && onCustomTextChange) {
      onCustomTextChange(editValue.trim());
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditValue(customText || '');
    setIsEditing(false);
  };

  const displayText = isCustomMode && customText ? customText : sentence.text;

  return (
    <div className="neo-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-neo-main border-3 border-black flex items-center justify-center">
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold">
            {isCustomMode ? 'Custom Sentence' : 'Practice Sentence'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!isCustomMode && (
            <span className={`px-3 py-1 border-3 text-xs font-black uppercase ${getDifficultyColor()}`}>
              {sentence.difficulty}
            </span>
          )}
          {onToggleCustomMode && (
            <button
              onClick={onToggleCustomMode}
              className={`p-2 border-3 border-black transition-all ${
                isCustomMode 
                  ? 'bg-neo-accent shadow-neo-pressed translate-x-[2px] translate-y-[2px]' 
                  : 'bg-white shadow-neo-sm hover:shadow-neo-pressed hover:translate-x-[1px] hover:translate-y-[1px]'
              }`}
              title={isCustomMode ? 'Use preset sentences' : 'Write your own sentence'}
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      {/* Sentence display or edit mode */}
      {isCustomMode && isEditing ? (
        <div className="mb-4">
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value.slice(0, 280))}
            className="neo-input min-h-[100px] resize-none text-lg"
            placeholder="Type or paste your sentence here..."
            autoFocus
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">{editValue.length}/280 characters</span>
            <div className="flex gap-2">
              <button
                onClick={handleCancelEdit}
                className="p-2 border-3 border-black bg-white shadow-neo-sm hover:shadow-neo-pressed 
                           hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={handleSaveCustom}
                disabled={!editValue.trim()}
                className="p-2 border-3 border-black bg-neo-success shadow-neo-sm hover:shadow-neo-pressed 
                           hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-[80px] mb-4">
          {showWordScores && wordDetails ? (
            <AnimatedWords
              referenceText={displayText}
              wordDetails={wordDetails}
              animate={true}
            />
          ) : (
            <blockquote 
              className="text-xl md:text-2xl font-black leading-relaxed cursor-pointer"
              onClick={() => {
                if (isCustomMode) {
                  setEditValue(customText || '');
                  setIsEditing(true);
                }
              }}
            >
              "{displayText}"
            </blockquote>
          )}
          {isCustomMode && !showWordScores && (
            <button
              onClick={() => {
                setEditValue(customText || '');
                setIsEditing(true);
              }}
              className="text-sm text-gray-500 hover:text-gray-700 mt-2 flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" />
              Click to edit
            </button>
          )}
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {isCustomMode ? (
            <span className="font-bold">Focus:</span>
          ) : (
            <>
              <span className="font-bold">Focus:</span> {sentence.focus}
            </>
          )}
          {isCustomMode && <span> Your custom practice</span>}
        </p>
        
        {!isCustomMode && (
          <div className="flex items-center gap-2">
            <button
              onClick={onPrev}
              className="p-2 border-3 border-black bg-white shadow-neo-sm hover:shadow-neo-pressed 
                         hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-50"
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-bold px-2">
              {currentIndex + 1} / {totalCount}
            </span>
            <button
              onClick={onNext}
              className="p-2 border-3 border-black bg-white shadow-neo-sm hover:shadow-neo-pressed 
                         hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-50"
              disabled={currentIndex === totalCount - 1}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
