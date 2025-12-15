import React, { useEffect, useState } from 'react';
import { WordDetail } from '../types';

interface AnimatedWordsProps {
  referenceText: string;
  wordDetails?: WordDetail[];
  animate?: boolean;
  onAnimationComplete?: () => void;
  highlightedWordIndex?: number; // For audio playback highlighting
}

// Map reference words to their scored counterparts
function mapWordsToScores(
  referenceText: string,
  wordDetails?: WordDetail[]
): { word: string; score: number | null; errorType: string | null }[] {
  const refWords = referenceText.split(/\s+/).filter(w => w.length > 0);
  
  if (!wordDetails || wordDetails.length === 0) {
    return refWords.map(word => ({ word, score: null, errorType: null }));
  }

  // Clean reference words of punctuation for matching
  const cleanWord = (w: string) => w.replace(/[.,!?;:'"]/g, '').toLowerCase();
  
  const result: { word: string; score: number | null; errorType: string | null }[] = [];
  let detailIdx = 0;
  
  for (const refWord of refWords) {
    const cleanRef = cleanWord(refWord);
    
    // Try to find a matching word in details
    if (detailIdx < wordDetails.length) {
      const detail = wordDetails[detailIdx];
      const cleanDetail = cleanWord(detail.word);
      
      if (cleanRef === cleanDetail || cleanRef.includes(cleanDetail) || cleanDetail.includes(cleanRef)) {
        result.push({
          word: refWord,
          score: detail.accuracy_score,
          errorType: detail.error_type !== 'None' ? detail.error_type : null,
        });
        detailIdx++;
      } else if (detail.error_type === 'Omission') {
        // Word was missed - show as error
        result.push({
          word: refWord,
          score: 0,
          errorType: 'Omission',
        });
      } else {
        // No match found, move to next detail word
        result.push({
          word: refWord,
          score: null,
          errorType: null,
        });
      }
    } else {
      // Ran out of detail words
      result.push({
        word: refWord,
        score: null,
        errorType: null,
      });
    }
  }
  
  return result;
}

function getWordColor(score: number | null): string {
  if (score === null) return 'text-gray-600';
  if (score >= 80) return 'text-neo-success';
  if (score >= 60) return 'text-neo-warning';
  return 'text-neo-error';
}

function getWordBgColor(score: number | null): string {
  if (score === null) return '';
  if (score >= 80) return 'bg-green-100';
  if (score >= 60) return 'bg-yellow-100';
  return 'bg-red-100';
}

export const AnimatedWords: React.FC<AnimatedWordsProps> = ({
  referenceText,
  wordDetails,
  animate = true,
  onAnimationComplete,
  highlightedWordIndex = -1,
}) => {
  const [revealedCount, setRevealedCount] = useState(animate ? 0 : Infinity);
  const mappedWords = mapWordsToScores(referenceText, wordDetails);
  
  useEffect(() => {
    if (!animate || !wordDetails || wordDetails.length === 0) {
      setRevealedCount(Infinity);
      return;
    }
    
    setRevealedCount(0);
    
    const totalWords = mappedWords.length;
    const interval = setInterval(() => {
      setRevealedCount(prev => {
        if (prev >= totalWords) {
          clearInterval(interval);
          onAnimationComplete?.();
          return prev;
        }
        return prev + 1;
      });
    }, 200); // 200ms delay between each word
    
    return () => clearInterval(interval);
  }, [referenceText, wordDetails, animate]);

  return (
    <div className="text-xl md:text-2xl font-bold leading-relaxed">
      {mappedWords.map((item, idx) => {
        const isRevealed = idx < revealedCount;
        const hasScore = item.score !== null;
        const isHighlighted = idx === highlightedWordIndex;
        
        return (
          <span
            key={idx}
            className={`
              inline-block mr-2 px-1 transition-all duration-300
              ${isRevealed && hasScore ? getWordColor(item.score) : 'text-gray-800'}
              ${isRevealed && hasScore ? getWordBgColor(item.score) : ''}
              ${isRevealed && item.errorType === 'Omission' ? 'line-through' : ''}
              ${isRevealed && hasScore ? 'word-animate' : ''}
              ${isHighlighted ? 'ring-4 ring-neo-accent ring-offset-2 scale-110' : ''}
            `}
            style={{
              opacity: animate && !isRevealed && hasScore ? 0.5 : 1,
            }}
          >
            {item.word}
            {item.errorType === 'Insertion' && (
              <span className="text-xs align-super text-neo-error ml-0.5">+</span>
            )}
          </span>
        );
      })}
    </div>
  );
};
