import {
  AIDifficulty,
  AIHint,
  BoardSize,
  CellState,
  Point,
  StoneColor,
} from '../types/go';
import {
  formatCoordinate,
  getAllGroups,
  getGroupAt,
  getOpponent,
  getOrthogonalNeighbors,
  getStarPoints,
  validateMove,
} from './goEngine';
import { estimateTerritoryAndScore } from './territory';

/**
 * Checks whether an empty intersection is a "true eye" of `color`
 * (so the AI and Coach never tell players to fill in their own eyes!)
 */
function isOwnTrueEye(board: CellState[][], point: Point, color: StoneColor): boolean {
  const size = board.length;
  const neighbors = getOrthogonalNeighbors(point, size);
  for (const n of neighbors) {
    if (board[n.row][n.col] !== color) return false;
    const grp = getGroupAt(board, n);
    if (grp && grp.liberties.length <= 1) return false;
  }

  // Also check diagonals to ensure the eye isn't falsified
  const { row, col } = point;
  const diags: Point[] = [];
  if (row > 0 && col > 0) diags.push({ row: row - 1, col: col - 1 });
  if (row > 0 && col < size - 1) diags.push({ row: row - 1, col: col + 1 });
  if (row < size - 1 && col > 0) diags.push({ row: row + 1, col: col - 1 });
  if (row < size - 1 && col < size - 1) diags.push({ row: row + 1, col: col + 1 });

  const opp = getOpponent(color);
  let oppDiagCount = 0;
  for (const d of diags) {
    if (board[d.row][d.col] === opp) oppDiagCount++;
  }
  const onEdge = diags.length < 4;
  if (onEdge && oppDiagCount >= 1) return false;
  if (!onEdge && oppDiagCount >= 2) return false;

  return true;
}

/**
 * Evaluates all legal moves on the board for `color` and returns ranked candidates
 * with clear pedagogical explanations in beginner-friendly language.
 */
export function evaluateCandidateMoves(
  board: CellState[][],
  color: StoneColor,
  previousBoardHashes: Set<string>
): AIHint[] {
  const size = board.length as BoardSize;
  const opponent = getOpponent(color);
  const currentGroups = getAllGroups(board);
  const starPoints = getStarPoints(size);
  const baseTerritory = estimateTerritoryAndScore(board);

  const myAtariGroups = currentGroups.filter(
    (g) => g.color === color && g.liberties.length === 1
  );
  const myLowLibGroups = currentGroups.filter(
    (g) => g.color === color && g.liberties.length === 2
  );

  const candidates: AIHint[] = [];

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (board[row][col] !== null) continue;
      const pt = { row, col };

      // Avoid filling our own true eye unless it captures stones
      const validation = validateMove(board, pt, color, previousBoardHashes);
      if (!validation.valid || !validation.resultingBoard) continue;

      const capturedCount = validation.capturedStones?.length || 0;
      if (capturedCount === 0 && isOwnTrueEye(board, pt, color)) {
        continue;
      }

      // Never play a move that walks directly into Atari unless it captures a big group
      if (validation.putsSelfInAtari && capturedCount <= 1) {
        continue;
      }

      const nextBoard = validation.resultingBoard;
      const coord = formatCoordinate(pt, size);
      let score = 10;
      let category: AIHint['category'] = 'territory';
      let title = `Play at ${coord}`;
      let explanation = `Expands your presence near ${coord}.`;

      // 1. Capturing opponent stones!
      if (capturedCount > 0) {
        score += 95 + capturedCount * 35;
        category = 'capture';
        title = `Capture ${capturedCount} stone${capturedCount > 1 ? 's' : ''} at ${coord}!`;
        explanation = `Playing at ${coord} removes the last breath (liberty) of ${capturedCount} opponent stone${
          capturedCount > 1 ? 's' : ''
        } and captures them immediately.`;
      }

      // 2. Saving our own group currently in Atari (1 liberty left)
      for (const endangered of myAtariGroups) {
        const sampleStone = endangered.stones[0];
        const newGroup = getGroupAt(nextBoard, sampleStone);
        if (newGroup && newGroup.liberties.length >= 2) {
          const savedCount = endangered.stones.length;
          const saveBonus = 85 + savedCount * 28 + (newGroup.liberties.length - 1) * 8;
          if (saveBonus > score) {
            score = saveBonus;
            category = 'save_atari';
            title = `Rescue your stones at ${coord}!`;
            explanation = `Your group of ${savedCount} stone${
              savedCount > 1 ? 's' : ''
            } was in ATARI (only 1 breath left). Extending at ${coord} connects and increases its liberties to ${
              newGroup.liberties.length
            }!`;
          } else {
            score += 40;
          }
        }
      }

      // 3. Putting an opponent group into Atari (1 liberty left)
      const nextGroups = getAllGroups(nextBoard);
      for (const nGrp of nextGroups) {
        if (nGrp.color === opponent && nGrp.liberties.length === 1) {
          // Was it already in atari before?
          const prevGrp = getGroupAt(board, nGrp.stones[0]);
          if (prevGrp && prevGrp.liberties.length > 1) {
            const atariBonus = 55 + nGrp.stones.length * 16;
            score += atariBonus;
            if (category === 'territory') {
              category = 'atari_attack';
              title = `Attack! Put opponent in Atari at ${coord}`;
              explanation = `Playing at ${coord} reduces the opponent's ${
                nGrp.stones.length > 1 ? `${nGrp.stones.length}-stone group` : 'stone'
              } to just 1 breath (Atari!), threatening to capture next turn.`;
            }
          }
        }
      }

      // 4. Strengthening our own weak group with 2 liberties
      for (const weak of myLowLibGroups) {
        const sampleStone = weak.stones[0];
        const newGroup = getGroupAt(nextBoard, sampleStone);
        if (newGroup && newGroup.liberties.length >= 3) {
          const boost = 30 + weak.stones.length * 8 + (newGroup.liberties.length - 2) * 5;
          score += boost;
          if (category === 'territory') {
            category = 'defend';
            title = `Strengthen your group at ${coord}`;
            explanation = `Your nearby group only had 2 liberties. Playing at ${coord} gives it ${newGroup.liberties.length} healthy breaths so it cannot be easily attacked.`;
          }
        }
      }

      // 5. Positional & Territory value (3rd/4th line, Star Points, Territory gain)
      const nextTerritory = estimateTerritoryAndScore(nextBoard);
      const myPrevArea =
        color === 'B' ? baseTerritory.blackTotalArea : baseTerritory.whiteTotalArea;
      const myNextArea =
        color === 'B' ? nextTerritory.blackTotalArea : nextTerritory.whiteTotalArea;
      const territoryDelta = myNextArea - myPrevArea;
      score += territoryDelta * 4.5;

      // Prefer star points & 3rd line in opening/middle game
      const distFromEdge = Math.min(row, col, size - 1 - row, size - 1 - col);
      if (distFromEdge === 2) {
        score += 14; // 3rd line is great for territory
      } else if (distFromEdge === 1 && size <= 9) {
        score += 8;
      } else if (distFromEdge === 0) {
        score -= 10; // 1st line ("line of defeat") is bad early on
      }

      const isStar = starPoints.some((sp) => sp.row === row && sp.col === col);
      if (isStar) {
        score += 12;
        if (category === 'territory') {
          title = `Claim Key Star Point (${coord})`;
          explanation = `Star points (${coord}) are balanced high-ground intersections that control both the corner and the sides early in the game.`;
        }
      } else if (category === 'territory' && territoryDelta > 1.5) {
        title = `Stake out territory at ${coord}`;
        explanation = `Playing at ${coord} fences off open space and expands your controlled territory by ~${Math.round(
          territoryDelta
        )} points.`;
      }

      candidates.push({
        point: pt,
        title,
        explanation,
        category,
        score,
      });
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  if (candidates.length === 0 || candidates[0].score < 12) {
    return [
      {
        point: null,
        title: 'Pass your turn',
        explanation:
          'All boundaries and territories are settled—there are no remaining productive moves left on the board.',
        category: 'pass',
        score: 0,
      },
    ];
  }

  return candidates;
}

/**
 * Picks a move for the AI based on the chosen difficulty tier.
 */
export function chooseAIMove(
  board: CellState[][],
  aiColor: StoneColor,
  difficulty: AIDifficulty,
  previousBoardHashes: Set<string>,
  moveNumber: number
): AIHint {
  const candidates = evaluateCandidateMoves(board, aiColor, previousBoardHashes);

  if (candidates.length === 0 || candidates[0].point === null) {
    return (
      candidates[0] || {
        point: null,
        title: 'Pass',
        explanation: 'AI passes because all territories appear settled.',
        category: 'pass',
        score: 0,
      }
    );
  }

  // Late game pass detection when board is mostly filled and top move barely gains territory
  const size = board.length;
  const minMovesForPass = size === 7 ? 24 : size === 9 ? 42 : size === 13 ? 85 : 160;
  if (
    moveNumber > minMovesForPass &&
    candidates[0].category === 'territory' &&
    candidates[0].score < 19
  ) {
    return {
      point: null,
      title: 'Pass',
      explanation: 'All territories are enclosed, so the AI passes to move toward scoring.',
      category: 'pass',
      score: 0,
    };
  }

  if (difficulty === 'challenger') {
    return candidates[0];
  }

  if (difficulty === 'intermediate') {
    // Always take urgent captures or saves, otherwise slight variety among top 2
    if (candidates[0].category === 'capture' || candidates[0].category === 'save_atari') {
      return candidates[0];
    }
    const pool = candidates.slice(0, Math.min(2, candidates.length));
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // Beginner ('Sensei Bot'): Friendly and forgiving—picks among top 3 natural moves
  if (candidates[0].category === 'capture') {
    return candidates[0];
  }
  const pool = candidates.slice(0, Math.min(3, candidates.length));
  return pool[Math.floor(Math.random() * pool.length)];
}
