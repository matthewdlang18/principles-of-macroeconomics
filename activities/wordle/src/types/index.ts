export type GameType = 'concept' | 'term' | 'policy' | 'variable';

export type GameState = 'idle' | 'playing' | 'paused';

export interface PuzzleData {
  id: string;
  type: GameType;
  answer: string;
  hint: string;
  explanation: string;
  params?: Record<string, any>;
  difficulty: 1 | 2 | 3; // 1=easy, 2=medium, 3=hard
  date: string; // ISO date string
}

export interface GameStats {
  played: number;
  won: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: Record<number, number>; // key: number of guesses, value: frequency
  lastPlayed: string | null; // ISO date string
}

export interface TypingRule {
  pattern: RegExp;
  maxLength: number;
  validChars: string;
}