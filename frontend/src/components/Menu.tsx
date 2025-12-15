import React from 'react';
import { X, User, LogOut, Github, HelpCircle, Bug, History, ChevronRight } from 'lucide-react';

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: { email: string } | null;
  onLogout: () => void;
  debugMode: boolean;
  onDebugModeChange: (enabled: boolean) => void;
  onViewHistory: () => void;
  authConfigured: boolean;
}

export const Menu: React.FC<MenuProps> = ({
  isOpen,
  onClose,
  user,
  onLogout,
  debugMode,
  onDebugModeChange,
  onViewHistory,
  authConfigured,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Menu panel */}
      <div className="fixed right-0 top-0 h-full w-80 max-w-[85vw] bg-neo-bg border-l-3 border-black z-50 overflow-y-auto">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 border-3 border-black bg-white shadow-neo-sm hover:shadow-neo-pressed 
                         hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User info */}
          {user && (
            <div className="neo-card mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-neo-main border-3 border-black flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{user.email}</p>
                  <p className="text-xs text-gray-600">Logged in</p>
                </div>
              </div>
              {authConfigured && (
                <button
                  onClick={onLogout}
                  className="mt-3 w-full neo-btn-error text-sm flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              )}
            </div>
          )}

          {/* History */}
          <button
            onClick={() => {
              onViewHistory();
              onClose();
            }}
            className="w-full neo-card mb-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <History className="w-5 h-5" />
              <span className="font-bold">Practice History</span>
            </div>
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Debug toggle */}
          <div className="neo-card mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bug className="w-5 h-5" />
                <span className="font-bold">Debug Mode</span>
              </div>
              <button
                onClick={() => onDebugModeChange(!debugMode)}
                className={`w-14 h-8 border-3 border-black transition-colors relative ${
                  debugMode ? 'bg-neo-success' : 'bg-gray-200'
                }`}
              >
                <div 
                  className={`absolute top-0.5 w-5 h-5 bg-white border-2 border-black transition-transform ${
                    debugMode ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Show detailed scoring breakdown and strictness controls
            </p>
          </div>

          {/* How to Use */}
          <div className="neo-card mb-4">
            <div className="flex items-center gap-3 mb-3">
              <HelpCircle className="w-5 h-5" />
              <span className="font-bold">How to Use</span>
            </div>
            <ol className="text-sm space-y-2 list-decimal list-inside">
              <li>Select a sentence to practice</li>
              <li>Click the record button</li>
              <li>Read the sentence aloud</li>
              <li>Click stop when finished</li>
              <li>Review your AI-powered feedback</li>
            </ol>
          </div>

          {/* Tips */}
          <div className="neo-card mb-4 bg-neo-warning">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-lg">💡</span>
              <span className="font-bold">Tips for Best Results</span>
            </div>
            <ul className="text-sm space-y-2">
              <li>• Find a quiet environment</li>
              <li>• Speak clearly at a natural pace</li>
              <li>• Hold device 6-12 inches away</li>
              <li>• Read the entire sentence</li>
              <li>• Don't rush - pauses are okay!</li>
            </ul>
          </div>

          {/* GitHub Link */}
          <a
            href="https://github.com/jackkoppa/accent-practice"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full neo-card flex items-center gap-3 hover:bg-gray-50"
          >
            <Github className="w-5 h-5" />
            <span className="font-bold">View on GitHub</span>
            <ChevronRight className="w-5 h-5 ml-auto" />
          </a>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t-2 border-black/20 text-center text-xs text-gray-500">
            <p>Powered by Azure AI Speech & OpenAI GPT-4</p>
          </div>
        </div>
      </div>
    </>
  );
};
