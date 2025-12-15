import React, { useState } from 'react';
import { Trophy, AlertCircle, Sparkles, ChevronDown, ChevronUp, Bug } from 'lucide-react';
import { ScoreRing } from './ScoreRing';
import { AnalysisResult } from '../types';

interface ResultsPanelProps {
  result: AnalysisResult;
  onTryAgain: () => void;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({ result, onTryAgain }) => {
  const { scores, coaching, mock_mode, mock_details, azure_debug, strictness_level } = result;
  const [debugExpanded, setDebugExpanded] = useState(false);
  
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

      {/* Debug section - Azure response details */}
      {azure_debug && !azure_debug.error && (
        <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
          <button
            onClick={() => setDebugExpanded(!debugExpanded)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Bug className="w-5 h-5 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-700">
                Technical Details (Azure Response)
              </h3>
              {strictness_level && (
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                  Strictness: {strictness_level}/5
                </span>
              )}
            </div>
            {debugExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>
          
          {debugExpanded && (
            <div className="px-6 pb-6 space-y-4">
              {/* Recognized text */}
              <div>
                <h4 className="text-xs font-semibold text-gray-600 uppercase mb-2">
                  Recognized Speech
                </h4>
                <p className="text-sm text-gray-800 bg-white p-3 rounded-lg border border-gray-200">
                  "{azure_debug.recognized_text}"
                </p>
              </div>

              {/* Overall metrics from Azure */}
              <div>
                <h4 className="text-xs font-semibold text-gray-600 uppercase mb-2">
                  Raw Azure Scores (before strictness adjustment)
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <div className="text-gray-500">Accuracy</div>
                    <div className="text-lg font-bold text-gray-800">
                      {azure_debug.overall_metrics.accuracy_score}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <div className="text-gray-500">Pronunciation</div>
                    <div className="text-lg font-bold text-gray-800">
                      {azure_debug.overall_metrics.pronunciation_score}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <div className="text-gray-500">Fluency</div>
                    <div className="text-lg font-bold text-gray-800">
                      {azure_debug.overall_metrics.fluency_score}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <div className="text-gray-500">Completeness</div>
                    <div className="text-lg font-bold text-gray-800">
                      {azure_debug.overall_metrics.completeness_score}
                    </div>
                  </div>
                </div>
              </div>

              {/* Word-level breakdown */}
              {azure_debug.words && azure_debug.words.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-600 uppercase mb-2">
                    Word-Level Analysis
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {azure_debug.words.map((word, idx) => (
                      <div 
                        key={idx} 
                        className="bg-white p-3 rounded-lg border border-gray-200 text-sm"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-800">
                            {word.word}
                          </span>
                          <div className="flex items-center gap-2">
                            <span 
                              className={`text-xs px-2 py-1 rounded ${
                                word.accuracy_score >= 80 
                                  ? 'bg-green-100 text-green-700'
                                  : word.accuracy_score >= 60
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {word.accuracy_score}%
                            </span>
                            {word.error_type !== 'None' && (
                              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                                {word.error_type}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Phonemes for this word */}
                        {word.phonemes && word.phonemes.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {word.phonemes.map((phoneme, pIdx) => (
                              <span
                                key={pIdx}
                                className={`text-xs px-2 py-1 rounded font-mono ${
                                  phoneme.accuracy_score >= 80
                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                    : phoneme.accuracy_score >= 60
                                    ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                                    : 'bg-red-50 text-red-700 border border-red-200'
                                }`}
                                title={`${phoneme.phoneme}: ${phoneme.accuracy_score}%`}
                              >
                                {phoneme.phoneme} ({phoneme.accuracy_score})
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

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
