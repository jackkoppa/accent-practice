import React, { useMemo } from 'react';
import { ArrowLeft, Trophy, Trash2, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { HistoryEntry } from '../types';
import { getHistory, deleteHistoryEntry } from '../storage';

interface HistoryViewProps {
  onBack: () => void;
  onSelectEntry: (id: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onBack, onSelectEntry }) => {
  const [history, setHistory] = React.useState<HistoryEntry[]>([]);
  
  React.useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this entry?')) {
      deleteHistoryEntry(id);
      setHistory(getHistory());
    }
  };

  // Prepare chart data - reverse to show chronological order (oldest to newest)
  const chartData = useMemo(() => {
    return history
      .slice(0, 30) // Last 30 entries
      .reverse()
      .map(entry => ({
        date: new Date(entry.timestamp).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        score: entry.overallScore,
        timestamp: entry.timestamp,
      }));
  }, [history]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-neo-success';
    if (score >= 60) return 'bg-neo-warning';
    return 'bg-neo-error';
  };

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
            <h1 className="text-xl font-black">Practice History</h1>
            <p className="text-xs text-gray-600">{history.length} sessions recorded</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Progress Chart */}
        {chartData.length >= 2 && (
          <div className="neo-card">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5" />
              <h2 className="text-lg font-black">Progress Over Time</h2>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fontWeight: 'bold' }}
                    stroke="#000"
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    tick={{ fontSize: 12, fontWeight: 'bold' }}
                    stroke="#000"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '3px solid #000',
                      borderRadius: 0,
                      fontWeight: 'bold',
                    }}
                    formatter={(value) => [`${value}/100`, 'Score']}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#88aaee"
                    strokeWidth={3}
                    dot={{ fill: '#88aaee', strokeWidth: 2, r: 4, stroke: '#000' }}
                    activeDot={{ r: 6, fill: '#a388ee', stroke: '#000', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* History List */}
        {history.length === 0 ? (
          <div className="neo-card text-center py-12">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="font-black text-lg mb-2">No History Yet</h3>
            <p className="text-gray-600">Complete a practice session to see your history here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map(entry => (
              <button
                key={entry.id}
                onClick={() => onSelectEntry(entry.id)}
                className="w-full neo-card hover:bg-gray-50 transition-colors text-left flex items-center gap-4"
              >
                {/* Score badge */}
                <div className={`w-14 h-14 ${getScoreColor(entry.overallScore)} border-3 border-black 
                                 flex items-center justify-center flex-shrink-0`}>
                  <span className="text-xl font-black">{entry.overallScore}</span>
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{entry.referenceText}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {new Date(entry.timestamp).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => handleDelete(e, entry.id)}
                  className="p-2 hover:bg-red-100 rounded transition-colors"
                  title="Delete entry"
                >
                  <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-500" />
                </button>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
