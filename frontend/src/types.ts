export interface Sentence {
  id: number;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  focus: string;
}

export interface Scores {
  pronunciation: number;
  fluency: number;
  completeness: number;
}

export interface AnalysisResult {
  scores: Scores;
  coaching: string;
  mock_mode: boolean;
  mock_details: string | null;
}

export type RecordingState = 'idle' | 'recording' | 'processing';
