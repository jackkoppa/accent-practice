import React, { useState } from 'react';
import { Trophy, AlertCircle, Sparkles, ChevronDown, ChevronUp, Bug, Settings } from 'lucide-react';
import { ScoreRing } from './ScoreRing';
import { AnalysisResult } from '../types';
import { AudioPlayback } from './AudioPlayback';

interface ResultsPanelProps {
  result: AnalysisResult;
  onTryAgain: () => void;
  debugMode?: boolean;
  strictness?: number;
  onStrictnessChange?: (value: number) => void;
  lastRecordingUrl?: string | null;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({ 
  result, 
  onTryAgain,
  debugMode = false,
  strictness = 3,
  onStrictnessChange,
  lastRecordingUrl,
}) => {
  const { scores, coaching, mock_mode, mock_details, azure_debug, strictness_level } = result;
  const [debugExpanded, setDebugExpanded] = useState(false);
  
  const overallScore = Math.round(
    (scores.pronunciation + scores.fluency + scores.completeness) / 3
  );

  const getOverallFeedback = () => {
    if (overallScore >= 90) return { text: "Excellent!", emoji: "🌟", color: "text-neo-success" };
    if (overallScore >= 80) return { text: "Great job!", emoji: "👏", color: "text-neo-success" };
    if (overallScore >= 70) return { text: "Good progress!", emoji: "💪", color: "text-neo-warning" };
    if (overallScore >= 60) return { text: "Keep practicing!", emoji: "📚", color: "text-neo-warning" };
    return { text: "Let's improve!", emoji: "🎯", color: "text-neo-error" };
  };

  const feedback = getOverallFeedback();

  return (
    <div className="space-y-6">
      {/* Mock mode banner */}
      {mock_mode && (
        <div className="neo-card bg-neo-warning flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-black">Demo Mode</p>
            <p className="text-sm">{mock_details || "Using sample scores. Add API keys for real analysis."}</p>
          </div>
        </div>
      )}

      {/* Audio Playback */}
      {lastRecordingUrl && (
        <AudioPlayback
          audioUrl={lastRecordingUrl}
          wordDetails={azure_debug?.words}
        />
      )}

      {/* Overall score banner */}
      <div className="neo-card bg-neo-main">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-6 h-6" />
              <span className="text-lg font-bold">Overall Score</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black">{overallScore}</span>
              <span className="text-2xl opacity-75">/100</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-4xl">{feedback.emoji}</span>
            <p className="text-lg font-black mt-1">{feedback.text}</p>
          </div>
        </div>
      </div>

      {/* Individual scores */}
      <div className="neo-card">
        <h3 className="text-lg font-black mb-6 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Detailed Scores
        </h3>
        <div className="flex justify-around flex-wrap gap-4">
          <ScoreRing 
            score={scores.pronunciation} 
            label="Pronunciation" 
            color="#88aaee"
          />
          <ScoreRing 
            score={scores.fluency} 
            label="Fluency" 
            color="#a388ee"
          />
          <ScoreRing 
            score={scores.completeness} 
            label="Completeness" 
            color="#44cc77"
          />
        </div>
      </div>

      {/* Coaching feedback */}
      <div className="neo-card">
        <h3 className="text-lg font-black mb-4 flex items-center gap-2">
          🎯 Coach's Feedback
        </h3>
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

      {/* Debug section - only show when debugMode is ON */}
      {debugMode && azure_debug && !azure_debug.error && (
        <div className="neo-card bg-gray-100">
          <button
            onClick={() => setDebugExpanded(!debugExpanded)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Bug className="w-5 h-5" />
              <h3 className="text-sm font-black">
                Technical Details (Azure Response)
              </h3>
              {strictness_level && (
                <span className="text-xs bg-neo-main border-2 border-black px-2 py-1 font-bold">
                  Strictness: {strictness_level}/5
                </span>
              )}
            </div>
            {debugExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
          
          {debugExpanded && (
            <div className="mt-4 space-y-4">
              {/* Recognized text */}
              <div>
                <h4 className="text-xs font-black text-gray-600 uppercase mb-2">
                  Recognized Speech
                </h4>
                <p className="text-sm bg-white p-3 border-2 border-black">
                  "{azure_debug.recognized_text}"
                </p>
              </div>

              {/* Overall metrics from Azure */}
              <div>
                <h4 className="text-xs font-black text-gray-600 uppercase mb-2">
                  Raw Azure Scores (before strictness adjustment)
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-3 border-2 border-black">
                    <div className="text-gray-500 font-bold">Accuracy</div>
                    <div className="text-lg font-black">
                      {azure_debug.overall_metrics.accuracy_score}
                    </div>
                  </div>
                  <div className="bg-white p-3 border-2 border-black">
                    <div className="text-gray-500 font-bold">Pronunciation</div>
                    <div className="text-lg font-black">
                      {azure_debug.overall_metrics.pronunciation_score}
                    </div>
                  </div>
                  <div className="bg-white p-3 border-2 border-black">
                    <div className="text-gray-500 font-bold">Fluency</div>
                    <div className="text-lg font-black">
                      {azure_debug.overall_metrics.fluency_score}
                    </div>
                  </div>
                  <div className="bg-white p-3 border-2 border-black">
                    <div className="text-gray-500 font-bold">Completeness</div>
                    <div className="text-lg font-black">
                      {azure_debug.overall_metrics.completeness_score}
                    </div>
                  </div>
                </div>
              </div>

              {/* Word-level breakdown */}
              {azure_debug.words && azure_debug.words.length > 0 && (
                <div>
                  <h4 className="text-xs font-black text-gray-600 uppercase mb-2">
                    Word-Level Analysis
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {azure_debug.words.map((word, idx) => (
                      <div 
                        key={idx} 
                        className="bg-white p-3 border-2 border-black text-sm"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-black">
                            {word.word}
                          </span>
                          <div className="flex items-center gap-2">
                            <span 
                              className={`text-xs px-2 py-1 border-2 border-black font-bold ${
                                word.accuracy_score >= 80 
                                  ? 'bg-neo-success'
                                  : word.accuracy_score >= 60
                                  ? 'bg-neo-warning'
                                  : 'bg-neo-error'
                              }`}
                            >
                              {word.accuracy_score}%
                            </span>
                            {word.error_type !== 'None' && (
                              <span className="text-xs bg-neo-warning border-2 border-black px-2 py-1 font-bold">
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
                                className={`text-xs px-2 py-1 font-mono font-bold border-2 border-black ${
                                  phoneme.accuracy_score >= 80
                                    ? 'bg-green-100'
                                    : phoneme.accuracy_score >= 60
                                    ? 'bg-yellow-100'
                                    : 'bg-red-100'
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

      {/* Strictness control - only in debug mode */}
      {debugMode && onStrictnessChange && (
        <div className="neo-card">
          <div className="flex items-center gap-2 mb-3">
            <Settings className="w-4 h-4" />
            <label className="text-sm font-black">
              Grading Strictness (for next attempt)
            </label>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="5"
              value={strictness}
              onChange={(e) => onStrictnessChange(Number(e.target.value))}
              className="flex-1"
            />
            <div className="flex flex-col items-center min-w-[80px]">
              <span className="text-2xl font-black">{strictness}</span>
              <span className="text-xs text-gray-500 font-bold">
                {strictness === 1 ? 'Very Lenient' : 
                 strictness === 2 ? 'Lenient' :
                 strictness === 3 ? 'Balanced' :
                 strictness === 4 ? 'Strict' : 'Very Strict'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Try again button */}
      <button
        onClick={onTryAgain}
        className="w-full neo-btn-primary text-lg py-4"
      >
        Try Again
      </button>
    </div>
  );
};
