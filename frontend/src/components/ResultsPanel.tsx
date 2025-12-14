import React from 'react';
import { Trophy, AlertCircle, Sparkles } from 'lucide-react';
import { ScoreRing } from './ScoreRing';
import { AnalysisResult } from '../types';

interface ResultsPanelProps {
  result: AnalysisResult;
  onTryAgain: () => void;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({ result, onTryAgain }) => {
  const { scores, coaching, mock_mode, mock_details } = result;
  
  const overallScore = Math.round(
    (scores.pronunciation + scores.fluency + scores.completeness) / 3
  );

  const getOverallFeedback = () => {
    if (overallScore >= 90) return { text: "Excellent!", emoji: "🌟", color: "text-green-600" };
    if (overallScore >= 80) return { text: "Great job!", emoji: "👏", color: "text-green-500" };
    if (overallScore >= 70) return { text: "Good progress!", emoji: "💪", color: "text-yellow-600" };
    if (overallScore >= 60) return { text: "Keep practicing!", emoji: "📚", color: "text-yellow-500" };
    return { text: "Let's improve!", emoji: "🎯", color: "text-orange-500" };
  };

  const feedback = getOverallFeedback();

  return (
    <div className="space-y-6">
      {/* Mock mode banner */}
      {mock_mode && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-800 font-medium">Demo Mode</p>
            <p className="text-amber-700 text-sm">{mock_details || "Using sample scores. Add API keys for real analysis."}</p>
          </div>
        </div>
      )}

      {/* Overall score banner */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-6 h-6" />
              <span className="text-lg font-medium opacity-90">Overall Score</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold">{overallScore}</span>
              <span className="text-2xl opacity-75">/100</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-4xl">{feedback.emoji}</span>
            <p className="text-lg font-medium mt-1">{feedback.text}</p>
          </div>
        </div>
      </div>

      {/* Individual scores */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          Detailed Scores
        </h3>
        <div className="flex justify-around flex-wrap gap-4">
          <ScoreRing 
            score={scores.pronunciation} 
            label="Pronunciation" 
            color="#6366f1"
          />
          <ScoreRing 
            score={scores.fluency} 
            label="Fluency" 
            color="#8b5cf6"
          />
          <ScoreRing 
            score={scores.completeness} 
            label="Completeness" 
            color="#a855f7"
          />
        </div>
      </div>

      {/* Coaching feedback */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          🎯 Coach's Feedback
        </h3>
        <div className="prose prose-indigo max-w-none">
          <div 
            className="text-gray-700 leading-relaxed whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ 
              __html: coaching
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/^- /gm, '• ')
                .replace(/\n/g, '<br/>')
            }} 
          />
        </div>
      </div>

      {/* Try again button */}
      <button
        onClick={onTryAgain}
        className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
      >
        Try Again
      </button>
    </div>
  );
};
