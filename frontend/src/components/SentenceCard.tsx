import React from 'react';
import { BookOpen, ChevronRight, ChevronLeft } from 'lucide-react';
import { Sentence } from '../types';

interface SentenceCardProps {
  sentence: Sentence;
  onNext: () => void;
  onPrev: () => void;
  currentIndex: number;
  totalCount: number;
}

export const SentenceCard: React.FC<SentenceCardProps> = ({
  sentence,
  onNext,
  onPrev,
  currentIndex,
  totalCount,
}) => {
  const getDifficultyColor = () => {
    switch (sentence.difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'hard':
        return 'bg-red-100 text-red-700';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-500" />
          <span className="text-sm font-medium text-gray-500">Practice Sentence</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor()}`}>
            {sentence.difficulty}
          </span>
        </div>
      </div>
      
      <blockquote className="text-xl md:text-2xl font-medium text-gray-800 leading-relaxed mb-4 min-h-[80px]">
        "{sentence.text}"
      </blockquote>
      
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          <span className="font-medium">Focus:</span> {sentence.focus}
        </p>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onPrev}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="text-sm text-gray-500">
            {currentIndex + 1} / {totalCount}
          </span>
          <button
            onClick={onNext}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
            disabled={currentIndex === totalCount - 1}
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
};
