import { useState, useEffect } from 'react';
import { Mic, Menu as MenuIcon, LogIn, Loader2, AlertTriangle, Clock, CreditCard, ShieldAlert, Settings } from 'lucide-react';
import { AudioRecorder } from './components/AudioRecorder';
import { SentenceCard } from './components/SentenceCard';
import { ResultsPanel } from './components/ResultsPanel';
import { Menu } from './components/Menu';
import { HistoryView } from './components/HistoryView';
import { HistoryDetail } from './components/HistoryDetail';
import { Sentence, AnalysisResult, RecordingState, AppError, APIErrorDetail, HistoryEntry } from './types';
import { useAuth } from './auth';
import { getSettings, saveSettings, saveHistoryEntry, generateId } from './storage';

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
  {
    id: 4,
    text: "How much wood would a woodchuck chuck if a woodchuck could chuck wood?",
    difficulty: "hard",
    focus: "W sounds and tongue twisters"
  },
  {
    id: 5,
    text: "I thought I thought of thinking of thanking you.",
    difficulty: "hard",
    focus: "TH sounds"
  },
  {
    id: 6,
    text: "The weather was warm and pleasant yesterday.",
    difficulty: "easy",
    focus: "W and soft consonants"
  },
  {
    id: 7,
    text: "Red lorry, yellow lorry, red lorry, yellow lorry.",
    difficulty: "hard",
    focus: "R and L distinction"
  },
  {
    id: 8,
    text: "Eleven benevolent elephants enjoyed eating eggs.",
    difficulty: "medium",
    focus: "E vowel sounds"
  },
  {
    id: 9,
    text: "Around the rugged rocks the ragged rascal ran.",
    difficulty: "hard",
    focus: "R sounds and alliteration"
  },
  {
    id: 10,
    text: "A proper cup of coffee in a proper copper coffee pot.",
    difficulty: "medium",
    focus: "P and soft O sounds"
  },
];

type ViewState = 'main' | 'history' | 'history-detail';

function App() {
  const { isAuthenticated, isLoading, user, login, logout, getAccessToken, authConfigured } = useAuth();
  const [sentences, setSentences] = useState<Sentence[]>(DEFAULT_SENTENCES);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  
  // Settings state
  const [debugMode, setDebugMode] = useState(false);
  const [strictness, setStrictness] = useState(3);
  
  // Menu state
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Custom sentence state
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customText, setCustomText] = useState('');
  
  // Audio playback state (for ResultsPanel)
  const [lastRecordingUrl, setLastRecordingUrl] = useState<string | null>(null);
  
  // View state (for history)
  const [viewState, setViewState] = useState<ViewState>('main');
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

  // Load settings on mount
  useEffect(() => {
    const settings = getSettings();
    setDebugMode(settings.debugMode);
    setStrictness(settings.strictness);
  }, []);

  // Save settings when they change
  useEffect(() => {
    saveSettings({ debugMode, strictness });
  }, [debugMode, strictness]);

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
  const activeText = isCustomMode && customText ? customText : currentSentence.text;

  const handleRecordingStart = () => {
    setRecordingState('recording');
    setResult(null);
    setError(null);
    // Clean up previous recording URL
    if (lastRecordingUrl) {
      URL.revokeObjectURL(lastRecordingUrl);
      setLastRecordingUrl(null);
    }
  };

  const handleRecordingStop = () => {
    setRecordingState('processing');
  };

  const handleRecordingComplete = async (audioBlob: Blob) => {
    // Store the audio blob URL for playback
    const audioUrl = URL.createObjectURL(audioBlob);
    setLastRecordingUrl(audioUrl);
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      formData.append('reference_text', activeText);
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
      
      // Save to history
      const overallScore = Math.round(
        (data.scores.pronunciation + data.scores.fluency + data.scores.completeness) / 3
      );
      
      const historyEntry: HistoryEntry = {
        id: generateId(),
        timestamp: Date.now(),
        referenceText: activeText,
        scores: data.scores,
        overallScore,
        coaching: data.coaching,
        wordDetails: data.azure_debug?.words,
        strictnessLevel: data.strictness_level,
      };
      
      saveHistoryEntry(historyEntry);
      
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
      <div className="min-h-screen flex items-center justify-center bg-neo-bg">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="font-bold">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated && authConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neo-bg p-4">
        <div className="neo-card max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-neo-main border-3 border-black flex items-center justify-center mx-auto mb-6">
              <Mic className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black mb-2">AI Accent Coach</h1>
            <p className="text-gray-600 mb-8">
              Improve your English pronunciation with AI-powered feedback
            </p>
            <button
              onClick={login}
              className="w-full neo-btn-primary flex items-center justify-center gap-2"
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

  // History views
  if (viewState === 'history') {
    return (
      <HistoryView 
        onBack={() => setViewState('main')}
        onSelectEntry={(id) => {
          setSelectedHistoryId(id);
          setViewState('history-detail');
        }}
      />
    );
  }

  if (viewState === 'history-detail' && selectedHistoryId) {
    return (
      <HistoryDetail
        entryId={selectedHistoryId}
        onBack={() => setViewState('history')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-neo-bg">
      {/* Menu */}
      <Menu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        user={user}
        onLogout={logout}
        debugMode={debugMode}
        onDebugModeChange={setDebugMode}
        onViewHistory={() => setViewState('history')}
        authConfigured={authConfigured}
      />

      {/* Header */}
      <header className="bg-white border-b-3 border-black sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neo-main border-3 border-black flex items-center justify-center">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black">AI Accent Coach</h1>
              <p className="text-xs text-gray-600">Perfect your pronunciation</p>
            </div>
          </div>
          <button
            onClick={() => setMenuOpen(true)}
            className="p-2 border-3 border-black bg-white shadow-neo-sm hover:shadow-neo-pressed 
                       hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
          >
            <MenuIcon className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Intro section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black mb-3">
            Improve Your Pronunciation
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Read the sentence aloud. Our AI will analyze your pronunciation and provide feedback.
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
            customText={customText}
            onCustomTextChange={setCustomText}
            isCustomMode={isCustomMode}
            onToggleCustomMode={() => {
              setIsCustomMode(!isCustomMode);
              setResult(null);
            }}
            wordDetails={result?.azure_debug?.words}
            showWordScores={!!result}
          />
        </div>

        {/* Strictness control - only in debug mode and when not showing results */}
        {debugMode && !result && (
          <div className="mb-6 neo-card max-w-md mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="w-4 h-4" />
              <label className="text-sm font-black">
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
              <div className={`mt-6 neo-card max-w-md ${
                error.type === 'rate_limit' 
                  ? 'bg-neo-warning' 
                  : error.type === 'quota_exceeded'
                  ? 'bg-orange-200'
                  : error.type === 'auth_error'
                  ? 'bg-purple-200'
                  : 'bg-neo-error'
              }`}>
                <div className="flex items-start gap-3">
                  {error.type === 'rate_limit' ? (
                    <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  ) : error.type === 'quota_exceeded' ? (
                    <CreditCard className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  ) : error.type === 'auth_error' ? (
                    <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-black">
                      {error.type === 'rate_limit' 
                        ? 'Rate Limit Reached' 
                        : error.type === 'quota_exceeded'
                        ? 'API Quota Exceeded'
                        : error.type === 'auth_error'
                        ? 'Authentication Error'
                        : 'Error'}
                    </p>
                    <p className="text-sm mt-1">
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
                  className="mt-3 w-full py-2 font-bold border-t-2 border-black/20 hover:bg-black/10"
                >
                  {error.type === 'rate_limit' ? 'Wait & Try Again' : 'Dismiss'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <ResultsPanel 
            result={result} 
            onTryAgain={handleTryAgain}
            debugMode={debugMode}
            strictness={strictness}
            onStrictnessChange={setStrictness}
            referenceText={activeText}
            lastRecordingUrl={lastRecordingUrl}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t-3 border-black mt-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-gray-600 text-sm font-bold">
          <p>
            Powered by Azure AI Speech & OpenAI GPT-4
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
