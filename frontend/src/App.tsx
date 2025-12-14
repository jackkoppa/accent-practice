import { useState, useEffect } from 'react';
import { Mic, Volume2, Github } from 'lucide-react';
import { AudioRecorder } from './components/AudioRecorder';
import { SentenceCard } from './components/SentenceCard';
import { ResultsPanel } from './components/ResultsPanel';
import { Sentence, AnalysisResult, RecordingState } from './types';

const DEFAULT_SENTENCES: Sentence[] = [
  {
    id: 1,
    text: "The quick brown fox jumps over the lazy dog.",
    difficulty: "easy",
    focus: "General pronunciation"
  },
  {
    id: 2,
    text: "She sells seashells by the seashore.",
    difficulty: "medium",
    focus: "S and SH sounds"
  },
  {
    id: 3,
    text: "Peter Piper picked a peck of pickled peppers.",
    difficulty: "medium",
    focus: "P sounds and rhythm"
  },
];

function App() {
  const [sentences, setSentences] = useState<Sentence[]>(DEFAULT_SENTENCES);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch sentences from backend
  useEffect(() => {
    fetch('/api/sentences')
      .then(res => res.json())
      .then(data => {
        if (data.sentences) {
          setSentences(data.sentences);
        }
      })
      .catch(() => {
        // Use default sentences if backend is not available
        console.log('Using default sentences (backend not available)');
      });
  }, []);

  const currentSentence = sentences[currentSentenceIndex];

  const handleRecordingStart = () => {
    setRecordingState('recording');
    setResult(null);
    setError(null);
  };

  const handleRecordingStop = () => {
    setRecordingState('processing');
  };

  const handleRecordingComplete = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      formData.append('reference_text', currentSentence.text);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Analysis failed');
      }

      const data: AnalysisResult = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setRecordingState('idle');
    }
  };

  const handleTryAgain = () => {
    setResult(null);
    setError(null);
  };

  const handleNextSentence = () => {
    if (currentSentenceIndex < sentences.length - 1) {
      setCurrentSentenceIndex(prev => prev + 1);
      setResult(null);
      setError(null);
    }
  };

  const handlePrevSentence = () => {
    if (currentSentenceIndex > 0) {
      setCurrentSentenceIndex(prev => prev - 1);
      setResult(null);
      setError(null);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">AI Accent Coach</h1>
              <p className="text-xs text-gray-500">Perfect your pronunciation</p>
            </div>
          </div>
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Github className="w-5 h-5 text-gray-600" />
          </a>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Intro section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-3">
            Improve Your English Pronunciation
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Read the sentence below out loud, and our AI will analyze your pronunciation,
            fluency, and provide personalized coaching tips.
          </p>
        </div>

        {/* Sentence card */}
        <div className="mb-8">
          <SentenceCard
            sentence={currentSentence}
            onNext={handleNextSentence}
            onPrev={handlePrevSentence}
            currentIndex={currentSentenceIndex}
            totalCount={sentences.length}
          />
        </div>

        {/* Recording section or Results */}
        {!result ? (
          <div className="flex flex-col items-center py-8">
            <AudioRecorder
              recordingState={recordingState}
              onRecordingComplete={handleRecordingComplete}
              onRecordingStart={handleRecordingStart}
              onRecordingStop={handleRecordingStop}
            />
            
            {error && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 max-w-md">
                <p className="text-red-700 text-center">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-2 w-full py-2 text-red-600 hover:text-red-700 font-medium"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Tips */}
            <div className="mt-8 bg-indigo-50 rounded-xl p-6 max-w-md">
              <h3 className="font-semibold text-indigo-800 mb-3 flex items-center gap-2">
                <Volume2 className="w-5 h-5" />
                Tips for Best Results
              </h3>
              <ul className="text-sm text-indigo-700 space-y-2">
                <li>• Find a quiet environment</li>
                <li>• Speak clearly at a natural pace</li>
                <li>• Hold your device 6-12 inches away</li>
                <li>• Read the entire sentence</li>
              </ul>
            </div>
          </div>
        ) : (
          <ResultsPanel result={result} onTryAgain={handleTryAgain} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          <p>
            Powered by Azure AI Speech &amp; OpenAI GPT-4
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
