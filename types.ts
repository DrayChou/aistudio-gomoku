export enum Player {
  None = 0,
  Black = 1, // Usually moves first
  White = 2,
}

export enum GameStatus {
  Idle = 'IDLE',
  Playing = 'PLAYING',
  Won = 'WON',
  Draw = 'DRAW',
}

export enum AIDifficulty {
  LocalEasy = 'LOCAL_EASY',
  LocalHard = 'LOCAL_HARD',
  GeminiPro = 'GEMINI_PRO', // Uses Gemini API
}

export interface Coordinate {
  x: number;
  y: number;
}

export interface Move extends Coordinate {
  player: Player;
  turnNumber: number;
}

export interface BoardState {
  grid: Player[][];
  moves: Move[];
  status: GameStatus;
  winner: Player | null;
  currentPlayer: Player;
}

export interface GeminiMoveResponse {
  x: number;
  y: number;
  reasoning: string;
}