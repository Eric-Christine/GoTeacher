import {
  BoardSize,
  CellState,
  Group,
  MoveValidationResult,
  Point,
  StoneColor,
} from '../types/go';

export function createEmptyBoard(size: BoardSize): CellState[][] {
  return Array.from({ length: size }, () => Array<CellState>(size).fill(null));
}

export function cloneBoard(board: CellState[][]): CellState[][] {
  return board.map((row) => [...row]);
}

export function serializeBoard(board: CellState[][]): string {
  return board
    .map((row) => row.map((cell) => (cell === null ? '.' : cell)).join(''))
    .join('/');
}

export function getOpponent(color: StoneColor): StoneColor {
  return color === 'B' ? 'W' : 'B';
}

export function getOrthogonalNeighbors(point: Point, size: number): Point[] {
  const neighbors: Point[] = [];
  const { row, col } = point;
  if (row > 0) neighbors.push({ row: row - 1, col });
  if (row < size - 1) neighbors.push({ row: row + 1, col });
  if (col > 0) neighbors.push({ row, col: col - 1 });
  if (col < size - 1) neighbors.push({ row, col: col + 1 });
  return neighbors;
}

export function pointKey(p: Point): string {
  return `${p.row},${p.col}`;
}

export function pointsEqual(a: Point | null | undefined, b: Point | null | undefined): boolean {
  if (!a || !b) return false;
  return a.row === b.row && a.col === b.col;
}

/**
 * Formats a board point into standard Go coordinate notation (e.g., D4, skipping 'I')
 */
export function formatCoordinate(point: Point, size: number): string {
  const letters = 'ABCDEFGHJKLMNOPQRST';
  const colLetter = letters[point.col] || '?';
  const rowNumber = size - point.row;
  return `${colLetter}${rowNumber}`;
}

/**
 * Finds the connected group and its liberties starting from `start`
 */
export function getGroupAt(board: CellState[][], start: Point): Group | null {
  const size = board.length;
  const color = board[start.row]?.[start.col];
  if (!color) return null;

  const visitedStones = new Set<string>();
  const libertySet = new Set<string>();
  const stones: Point[] = [];
  const liberties: Point[] = [];

  const queue: Point[] = [start];
  visitedStones.add(pointKey(start));

  while (queue.length > 0) {
    const curr = queue.shift()!;
    stones.push(curr);

    for (const n of getOrthogonalNeighbors(curr, size)) {
      const neighborCell = board[n.row][n.col];
      const nKey = pointKey(n);

      if (neighborCell === null) {
        if (!libertySet.has(nKey)) {
          libertySet.add(nKey);
          liberties.push(n);
        }
      } else if (neighborCell === color && !visitedStones.has(nKey)) {
        visitedStones.add(nKey);
        queue.push(n);
      }
    }
  }

  // Sort stone keys deterministically for group ID
  const sortedKey = stones
    .map(pointKey)
    .sort()
    .join('|');

  return {
    id: `${color}:${sortedKey}`,
    color,
    stones,
    liberties,
  };
}

/**
 * Extracts all connected groups currently on the board
 */
export function getAllGroups(board: CellState[][]): Group[] {
  const size = board.length;
  const visited = new Set<string>();
  const groups: Group[] = [];

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (board[row][col] !== null && !visited.has(`${row},${col}`)) {
        const group = getGroupAt(board, { row, col });
        if (group) {
          groups.push(group);
          for (const s of group.stones) {
            visited.add(pointKey(s));
          }
        }
      }
    }
  }

  return groups;
}

/**
 * Validates and simulates placing a stone at `point` for `color`.
 * Handles:
 * 1. Occupied intersection check
 * 2. Capturing opponent groups with 0 remaining liberties
 * 3. Self-capture (Suicide) prohibition
 * 4. Ko rule (immediate board repetition prohibition)
 */
export function validateMove(
  board: CellState[][],
  point: Point,
  color: StoneColor,
  previousBoardHashes?: Set<string>
): MoveValidationResult {
  const size = board.length;
  const { row, col } = point;

  if (row < 0 || row >= size || col < 0 || col >= size) {
    return { valid: false, reason: 'Outside the board.' };
  }

  if (board[row][col] !== null) {
    return {
      valid: false,
      reason: 'There is already a stone on this intersection.',
      reasonType: 'occupied',
    };
  }

  const nextBoard = cloneBoard(board);
  nextBoard[row][col] = color;
  const opponent = getOpponent(color);

  // 1. Check if any adjacent opponent groups now have 0 liberties
  const capturedStones: Point[] = [];
  const checkedGroupIds = new Set<string>();

  for (const neighbor of getOrthogonalNeighbors(point, size)) {
    if (nextBoard[neighbor.row][neighbor.col] === opponent) {
      const oppGroup = getGroupAt(nextBoard, neighbor);
      if (oppGroup && !checkedGroupIds.has(oppGroup.id)) {
        checkedGroupIds.add(oppGroup.id);
        if (oppGroup.liberties.length === 0) {
          capturedStones.push(...oppGroup.stones);
        }
      }
    }
  }

  // Remove captured opponent stones first!
  for (const cap of capturedStones) {
    nextBoard[cap.row][cap.col] = null;
  }

  // 2. Check the liberties of the newly placed stone's own group
  const ownGroup = getGroupAt(nextBoard, point);
  const ownLiberties = ownGroup ? ownGroup.liberties.length : 0;

  if (ownLiberties === 0) {
    return {
      valid: false,
      reason:
        'Forbidden (Self-Capture / Suicide): This stone would have 0 liberties (breaths) and does not capture any enemy stones!',
      reasonType: 'suicide',
    };
  }

  // 3. Check Ko rule (cannot recreate a previous board state)
  const resultingHash = serializeBoard(nextBoard);
  if (previousBoardHashes && previousBoardHashes.has(resultingHash)) {
    return {
      valid: false,
      reason:
        'Forbidden (Ko Rule): You cannot immediately recapture to repeat the exact previous board position. Play elsewhere first!',
      reasonType: 'ko',
    };
  }

  return {
    valid: true,
    resultingBoard: nextBoard,
    capturedStones,
    resultingGroupLiberties: ownLiberties,
    putsSelfInAtari: ownLiberties === 1,
  };
}

/**
 * Returns star points (Hoshi) for a given board size
 */
export function getStarPoints(size: BoardSize): Point[] {
  if (size === 7) {
    return [
      { row: 2, col: 2 },
      { row: 2, col: 4 },
      { row: 3, col: 3 },
      { row: 4, col: 2 },
      { row: 4, col: 4 },
    ];
  }
  if (size === 9) {
    return [
      { row: 2, col: 2 },
      { row: 2, col: 6 },
      { row: 4, col: 4 },
      { row: 6, col: 2 },
      { row: 6, col: 6 },
    ];
  }
  if (size === 13) {
    return [
      { row: 3, col: 3 },
      { row: 3, col: 9 },
      { row: 6, col: 6 },
      { row: 9, col: 3 },
      { row: 9, col: 9 },
    ];
  }
  // 19x19
  const coords = [3, 9, 15];
  const pts: Point[] = [];
  for (const r of coords) {
    for (const c of coords) {
      pts.push({ row: r, col: c });
    }
  }
  return pts;
}
