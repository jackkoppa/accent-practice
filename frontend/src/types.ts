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

export interface PhonemeDetail {
  phoneme: string;
  accuracy_score: number;
}

export interface WordDetail {
  word: string;
  accuracy_score: number;
  error_type: string;
  phonemes: PhonemeDetail[];
}

export interface AzureDebugData {
  recognized_text: string;
  words: WordDetail[];
  overall_metrics: {
    accuracy_score: number;
    fluency_score: number;
    completeness_score: number;
    pronunciation_score: number;
  };
  error?: string;
}

export interface AnalysisResult {
  scores: Scores;
  coaching: string;
  mock_mode: boolean;
  mock_details: string | null;
  azure_debug?: AzureDebugData | null;
  strictness_level?: number;
}

export type RecordingState = 'idle' | 'recording' | 'processing';

export type APIErrorType = 'rate_limit' | 'quota_exceeded' | 'auth_error' | 'service_error' | 'generic';

export interface APIErrorDetail {
  message: string;
  error_type: APIErrorType;
  service: 'azure_speech' | 'openai';
}

export interface AppError {
  message: string;
  type: APIErrorType;
  service?: string;
}
