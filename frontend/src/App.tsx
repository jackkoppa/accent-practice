import { useState, useEffect } from 'react';
import { Mic, Volume2, Github, Settings, AlertTriangle, Clock, CreditCard, ShieldAlert, LogOut, LogIn, Loader2 } from 'lucide-react';
import { AudioRecorder } from './components/AudioRecorder';
import { SentenceCard } from './components/SentenceCard';
import { ResultsPanel } from './components/ResultsPanel';
import { Sentence, AnalysisResult, RecordingState, AppError, APIErrorDetail } from './types';
import { useAuth } from './auth';

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
  const { isAuthenticated, isLoading, user, login, logout, getAccessToken, authConfigured } = useAuth();
  const [sentences, setSentences] = useState<Sentence[]>(DEFAULT_SENTENCES);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const [strictness, setStrictness] = useState<number>(3); // Default to 3 (stricter)

  // Fetch sentences from backend
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchSentences = async () => {
      const headers: HeadersInit = {};
      const token = getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      try {
        const res = await fetch('/api/sentences', { headers });
        const data = await res.json();
        if (data.sentences) {
          setSentences(data.sentences);
        }
      } catch {
        // Use default sentences if backend is not available
        console.log('Using default sentences (backend not available)');
      }
    };
    
    fetchSentences();
  }, [isAuthenticated, getAccessToken]);

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
      formData.append('strictness', strictness.toString());

      const headers: HeadersInit = {};
      const token = getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Check if it's a structured API error
        if (errorData.detail && typeof errorData.detail === 'object') {
          const detail = errorData.detail as APIErrorDetail;
          setError({
            message: detail.message,
            type: detail.error_type,
            service: detail.service
          });
        } else {
          // Generic error
          setError({
            message: typeof errorData.detail === 'string' ? errorData.detail : 'Analysis failed',
            type: 'generic'
          });
        }
        return;
      }

      const data: AnalysisResult = await response.json();
      setResult(data);
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'An error occurred',
        type: 'generic'
      });
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

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated && authConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Mic className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">AI Accent Coach</h1>
            <p className="text-gray-600 mb-8">
              Improve your English pronunciation with AI-powered feedback
            </p>
            <button
              onClick={login}
              className="w-full py-3 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              Sign In to Continue
            </button>
            <p className="text-xs text-gray-500 mt-6">
              Access is limited to authorized users only.
            </p>
          </div>
        </div>
      </div>
    );
  }

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
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-sm text-gray-600 hidden sm:inline">
                {user.email}
              </span>
            )}
            {authConfigured && (
              <button
                onClick={logout}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 text-gray-600"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Github className="w-5 h-5 text-gray-600" />
            </a>
          </div>
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

        {/* Strictness control */}
        {!result && (
          <div className="mb-6 bg-white rounded-xl shadow-md p-4 border border-gray-100 max-w-md mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="w-4 h-4 text-indigo-500" />
              <label className="text-sm font-semibold text-gray-700">
                Grading Strictness
              </label>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="5"
                value={strictness}
                onChange={(e) => setStrictness(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex flex-col items-center min-w-[80px]">
                <span className="text-2xl font-bold text-indigo-600">{strictness}</span>
                <span className="text-xs text-gray-500">
                  {strictness === 1 ? 'Very Lenient' : 
                   strictness === 2 ? 'Lenient' :
                   strictness === 3 ? 'Balanced' :
                   strictness === 4 ? 'Strict' : 'Very Strict'}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Higher strictness = more challenging grading
            </p>
          </div>
        )}

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
              <div className={`mt-6 rounded-xl p-4 max-w-md border ${
                error.type === 'rate_limit' 
                  ? 'bg-amber-50 border-amber-200' 
                  : error.type === 'quota_exceeded'
                  ? 'bg-orange-50 border-orange-200'
                  : error.type === 'auth_error'
                  ? 'bg-purple-50 border-purple-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start gap-3">
                  {error.type === 'rate_limit' ? (
                    <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  ) : error.type === 'quota_exceeded' ? (
                    <CreditCard className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  ) : error.type === 'auth_error' ? (
                    <ShieldAlert className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={`font-medium ${
                      error.type === 'rate_limit' 
                        ? 'text-amber-800' 
                        : error.type === 'quota_exceeded'
                        ? 'text-orange-800'
                        : error.type === 'auth_error'
                        ? 'text-purple-800'
                        : 'text-red-800'
                    }`}>
                      {error.type === 'rate_limit' 
                        ? 'Rate Limit Reached' 
                        : error.type === 'quota_exceeded'
                        ? 'API Quota Exceeded'
                        : error.type === 'auth_error'
                        ? 'Authentication Error'
                        : 'Error'}
                    </p>
                    <p className={`text-sm mt-1 ${
                      error.type === 'rate_limit' 
                        ? 'text-amber-700' 
                        : error.type === 'quota_exceeded'
                        ? 'text-orange-700'
                        : error.type === 'auth_error'
                        ? 'text-purple-700'
                        : 'text-red-700'
                    }`}>
                      {error.message}
                    </p>
                    {error.service && (
                      <p className="text-xs mt-2 opacity-75">
                        Service: {error.service === 'azure_speech' ? 'Azure Speech' : 'OpenAI'}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setError(null)}
                  className={`mt-3 w-full py-2 font-medium rounded-lg ${
                    error.type === 'rate_limit' 
                      ? 'text-amber-600 hover:bg-amber-100' 
                      : error.type === 'quota_exceeded'
                      ? 'text-orange-600 hover:bg-orange-100'
                      : error.type === 'auth_error'
                      ? 'text-purple-600 hover:bg-purple-100'
                      : 'text-red-600 hover:bg-red-100'
                  }`}
                >
                  {error.type === 'rate_limit' ? 'Wait & Try Again' : 'Dismiss'}
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
