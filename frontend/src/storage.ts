// Local storage utility for history and settings
// TODO: This will eventually be moved to DynamoDB for cross-device sync

import { HistoryEntry, AppSettings } from './types';

const HISTORY_KEY = 'accent-coach-history';
const SETTINGS_KEY = 'accent-coach-settings';

// Generate a unique ID for history entries
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// History operations
export function getHistory(): HistoryEntry[] {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading history from localStorage:', error);
    return [];
  }
}

export function saveHistoryEntry(entry: HistoryEntry): void {
  try {
    const history = getHistory();
    history.unshift(entry); // Add to beginning
    // Keep only last 100 entries to prevent storage issues
    const trimmed = history.slice(0, 100);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Error saving history to localStorage:', error);
  }
}

export function getHistoryEntry(id: string): HistoryEntry | null {
  const history = getHistory();
  return history.find(entry => entry.id === id) || null;
}

export function deleteHistoryEntry(id: string): void {
  try {
    const history = getHistory();
    const filtered = history.filter(entry => entry.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting history entry:', error);
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error('Error clearing history:', error);
  }
}

// Settings operations
const DEFAULT_SETTINGS: AppSettings = {
  debugMode: false,
  strictness: 3,
};

export function getSettings(): AppSettings {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (!data) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch (error) {
    console.error('Error reading settings from localStorage:', error);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Partial<AppSettings>): void {
  try {
    const current = getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving settings to localStorage:', error);
  }
}
