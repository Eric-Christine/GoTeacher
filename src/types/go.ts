export type StoneColor = 'B' | 'W';
export type CellState = StoneColor | null;
export type BoardSize = 7 | 9 | 13 | 19;

export interface Point {
  row: number;
  col: number;
}

export interface Group {
  id: string;
  color: StoneColor;
  stones: Point[];
  liberties: Point[];
}

export interface MoveRecord {
  moveNumber: number;
  color: StoneColor;
  point: Point | null; // null = Pass
  capturedStones: Point[];
  boardHash: string;
  explanation?: string;
}

export interface MoveValidationResult {
  valid: boolean;
  reason?: string;
  reasonType?: 'occupied' | 'suicide' | 'ko';
  resultingBoard?: CellState[][];
  capturedStones?: Point[];
  resultingGroupLiberties?: number;
  putsSelfInAtari?: boolean;
}

export interface TerritoryEstimate {
  ownerMap: ('B' | 'W' | 'neutral' | null)[][]; // null on stones, B/W/neutral on empty points
  influenceMap: number[][]; // -1.0 (White) to +1.0 (Black)
  blackTerritory: number;
  whiteTerritory: number;
  blackStones: number;
  whiteStones: number;
  blackCaptures: number;
  whiteCaptures: number;
  komi: number;
  blackTotalArea: number;
  whiteTotalArea: number;
}

export interface VisualizerSettings {
  showLibertyDots: boolean;
  showGroupConnections: boolean;
  showAtariWarnings: boolean;
  showTerritoryMap: boolean;
  showMovePreview: boolean;
  touchConfirmMode: boolean; // Auto-enabled or toggleable for mobile precision
}

export type AIDifficulty = 'beginner' | 'intermediate' | 'challenger';

export interface AIHint {
  point: Point | null;
  title: string;
  explanation: string;
  category: 'save_atari' | 'capture' | 'atari_attack' | 'defend' | 'territory' | 'eyes' | 'pass';
  score: number;
}

export interface BoardAnnotation {
  point: Point;
  label?: string;
  type: 'target' | 'danger' | 'eye' | 'info' | 'forbidden';
}

export interface LessonStep {
  id: string;
  title: string;
  instruction: string;
  whyItMatters: string;
  boardSize: BoardSize;
  initialStones: { row: number; col: number; color: StoneColor }[];
  playerColor: StoneColor;
  annotations?: BoardAnnotation[];
  // How the user completes this step:
  goalType:
    | 'place_anywhere'
    | 'place_specific'
    | 'capture_any'
    | 'increase_liberties'
    | 'try_forbidden_then_valid';
  targetPoints?: Point[]; // Valid winning spots for 'place_specific'
  forbiddenPoints?: Point[]; // Spots to demonstrate illegal move or trap
  minLibertiesRequired?: number;
  autoReply?: {
    fromPoint?: Point;
    replyPoint: Point;
    message: string;
  };
  successMessage: string;
  wrongMoveHint: string;
}

export interface LessonModule {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  duration: string;
  badge: string;
  conceptSummary: string;
  steps: LessonStep[];
}
