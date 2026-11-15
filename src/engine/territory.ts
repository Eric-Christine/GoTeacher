import { CellState, Point, StoneColor, TerritoryEstimate } from '../types/go';
import { getOrthogonalNeighbors, pointKey } from './goEngine';

/**
 * Calculates both exact enclosed regions and radial stone influence
 * so newcomers can visually see which empty intersections belong to Black or White,
 * and computes Chinese/Area scoring (Stones on board + Controlled Empty Territory + Komi).
 */
export function estimateTerritoryAndScore(
  board: CellState[][],
  blackCaptures: number = 0,
  whiteCaptures: number = 0,
  komi: number = 5.5
): TerritoryEstimate {
  const size = board.length;
  const ownerMap: ('B' | 'W' | 'neutral' | null)[][] = Array.from({ length: size }, () =>
    Array(size).fill(null)
  );
  const influenceMap: number[][] = Array.from({ length: size }, () => Array(size).fill(0));

  let blackStones = 0;
  let whiteStones = 0;

  const stonePoints: { row: number; col: number; color: StoneColor }[] = [];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cell = board[r][c];
      if (cell === 'B') {
        blackStones++;
        stonePoints.push({ row: r, col: c, color: 'B' });
      } else if (cell === 'W') {
        whiteStones++;
        stonePoints.push({ row: r, col: c, color: 'W' });
      }
    }
  }

  // 1. Compute radial influence for each intersection
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      let inf = 0;
      for (const s of stonePoints) {
        const dist = Math.abs(r - s.row) + Math.abs(c - s.col);
        const weight = 1 / Math.pow(2, dist * 0.85);
        inf += s.color === 'B' ? weight : -weight;
      }
      // Clamp to [-1, 1]
      influenceMap[r][c] = Math.max(-1, Math.min(1, inf));
    }
  }

  // 2. Flood-fill contiguous empty regions to check if they are strictly enclosed
  // or strongly dominated by one color's influence
  const visitedEmpty = new Set<string>();
  let blackTerritory = 0;
  let whiteTerritory = 0;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] !== null || visitedEmpty.has(`${r},${c}`)) continue;

      const region: Point[] = [];
      const queue: Point[] = [{ row: r, col: c }];
      visitedEmpty.add(`${r},${c}`);

      let touchesBlack = false;
      let touchesWhite = false;

      while (queue.length > 0) {
        const curr = queue.shift()!;
        region.push(curr);

        for (const n of getOrthogonalNeighbors(curr, size)) {
          const cell = board[n.row][n.col];
          if (cell === 'B') {
            touchesBlack = true;
          } else if (cell === 'W') {
            touchesWhite = true;
          } else {
            const k = pointKey(n);
            if (!visitedEmpty.has(k)) {
              visitedEmpty.add(k);
              queue.push(n);
            }
          }
        }
      }

      // If no stones on board at all, everything is neutral
      if (!touchesBlack && !touchesWhite) {
        for (const pt of region) ownerMap[pt.row][pt.col] = 'neutral';
        continue;
      }

      // Strictly enclosed by only Black
      if (touchesBlack && !touchesWhite) {
        for (const pt of region) {
          ownerMap[pt.row][pt.col] = 'B';
          blackTerritory++;
        }
      } else if (touchesWhite && !touchesBlack) {
        // Strictly enclosed by only White
        for (const pt of region) {
          ownerMap[pt.row][pt.col] = 'W';
          whiteTerritory++;
        }
      } else {
        // Mixed border region: use local influence threshold for each point
        for (const pt of region) {
          const inf = influenceMap[pt.row][pt.col];
          if (inf > 0.36) {
            ownerMap[pt.row][pt.col] = 'B';
            blackTerritory++;
          } else if (inf < -0.36) {
            ownerMap[pt.row][pt.col] = 'W';
            whiteTerritory++;
          } else {
            ownerMap[pt.row][pt.col] = 'neutral';
          }
        }
      }
    }
  }

  const blackTotalArea = blackStones + blackTerritory;
  const whiteTotalArea = whiteStones + whiteTerritory + komi;

  return {
    ownerMap,
    influenceMap,
    blackTerritory,
    whiteTerritory,
    blackStones,
    whiteStones,
    blackCaptures,
    whiteCaptures,
    komi,
    blackTotalArea,
    whiteTotalArea,
  };
}
