import React, { useEffect, useState } from 'react';
import { ArrowLeft, Trophy } from 'lucide-react';
import { HistoryEntry } from '../types';
import { getHistoryEntry } from '../storage';
import { ScoreRing } from './ScoreRing';
import { AnimatedWords } from './AnimatedWords';

interface HistoryDetailProps {
  entryId: string;
  onBack: () => void;
}

export const HistoryDetail: React.FC<HistoryDetailProps> = ({ entryId, onBack }) => {
  const [entry, setEntry] = useState<HistoryEntry | null>(null);

  useEffect(() => {
    const data = getHistoryEntry(entryId);
    setEntry(data);
  }, [entryId]);

  if (!entry) {
    return (
      <div className="min-h-screen bg-neo-bg flex items-center justify-center">
        <div className="neo-card text-center">
          <p className="font-bold">Entry not found</p>
          <button onClick={onBack} className="neo-btn-primary mt-4">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const getOverallFeedback = () => {
    const score = entry.overallScore;
    if (score >= 90) return { text: "Excellent!", emoji: "🌟", color: "text-neo-success" };
    if (score >= 80) return { text: "Great job!", emoji: "👏", color: "text-neo-success" };
    if (score >= 70) return { text: "Good progress!", emoji: "💪", color: "text-neo-warning" };
    if (score >= 60) return { text: "Keep practicing!", emoji: "📚", color: "text-neo-warning" };
    return { text: "Let's improve!", emoji: "🎯", color: "text-neo-error" };
  };

  const feedback = getOverallFeedback();

  return (
    <div className="min-h-screen bg-neo-bg">
      {/* Header */}
      <header className="bg-white border-b-3 border-black sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 border-3 border-black bg-white shadow-neo-sm hover:shadow-neo-pressed 
                       hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black">Session Details</h1>
            <p className="text-xs text-gray-600">
              {new Date(entry.timestamp).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Phrase with word scores */}
        <div className="neo-card">
          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Practice Sentence</p>
          <AnimatedWords
            referenceText={entry.referenceText}
            wordDetails={entry.wordDetails}
            animate={false}
          />
        </div>

        {/* Overall score banner */}
        <div className="neo-card bg-neo-main">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-6 h-6" />
                <span className="text-lg font-bold">Overall Score</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black">{entry.overallScore}</span>
                <span className="text-2xl opacity-75">/100</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-4xl">{feedback.emoji}</span>
              <p className="text-lg font-bold mt-1">{feedback.text}</p>
            </div>
          </div>
        </div>

        {/* Individual scores */}
        <div className="neo-card">
          <h3 className="text-lg font-black mb-6">Detailed Scores</h3>
          <div className="flex justify-around flex-wrap gap-4">
            <ScoreRing 
              score={entry.scores.pronunciation} 
              label="Pronunciation" 
              color="#88aaee"
            />
            <ScoreRing 
              score={entry.scores.fluency} 
              label="Fluency" 
              color="#a388ee"
            />
            <ScoreRing 
              score={entry.scores.completeness} 
              label="Completeness" 
              color="#44cc77"
            />
          </div>
        </div>

        {/* Coaching feedback */}
        {entry.coaching && (
          <div className="neo-card">
            <h3 className="text-lg font-black mb-4">🎯 Coach's Feedback</h3>
            <div 
              className="text-gray-700 leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ 
                __html: entry.coaching
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/^- /gm, '• ')
                  .replace(/\n/g, '<br/>')
              }} 
            />
          </div>
        )}
      </main>
    </div>
  );
};
