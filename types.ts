export interface VoiceConfig {
  name: string;
  label: string;
  gender: 'Male' | 'Female';
}

export enum AppState {
  IDLE = 'IDLE', // Bookshelf view
  EXTRACTING = 'EXTRACTING',
  READER = 'READER',
  ERROR = 'ERROR'
}

export interface TextChunk {
  id: number;
  text: string;
  page: number; // Added page tracking
}

export interface Book {
  id: string;
  title: string;
  chunks: TextChunk[];
  totalChunks: number;
  lastReadChunkIndex: number;
  dateAdded: number;
  lastReadDate: number;
  totalPages: number;
}

export const AVAILABLE_VOICES: VoiceConfig[] = [
  { name: 'Puck', label: 'Puck (Male)', gender: 'Male' },
  { name: 'Kore', label: 'Kore (Female)', gender: 'Female' },
  { name: 'Fenrir', label: 'Fenrir (Male)', gender: 'Male' },
  { name: 'Charon', label: 'Charon (Male)', gender: 'Male' },
  { name: 'Aoede', label: 'Aoede (Female)', gender: 'Female' },
];