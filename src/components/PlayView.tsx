import React, { useEffect, useMemo, useState } from 'react';
import {
  AIDifficulty,
  AIHint,
  BoardSize,
  CellState,
  MoveRecord,
  Point,
  StoneColor,
  VisualizerSettings,
} from '../types/go';
import {
  createEmptyBoard,
  formatCoordinate,
  getOpponent,
  serializeBoard,
  validateMove,
} from '../engine/goEngine';
import { estimateTerritoryAndScore } from '../engine/territory';
import { chooseAIMove, evaluateCandidateMoves } from '../engine/aiOpponent';
import { soundFX } from '../engine/sound';
import { Goban } from './Goban';
import { VisualizerControls } from './VisualizerControls';
import {
  Bot,
  Compass,
  Flag,
  Lightbulb,
  RotateCcw,
  SkipForward,
  Sparkles,
  Trophy,
  Undo2,
  User,
} from 'lucide-react';

interface PlayViewProps {
  visualizer: VisualizerSettings;
  onChangeVisualizer: (next: VisualizerSettings) => void;
}

interface GameHistorySnapshot {
  board: CellState[][];
  turn: StoneColor;
  blackCaptures: number;
  whiteCaptures: number;
  consecutivePasses: number;
  lastMove: Point | null;
  moveLog: MoveRecord[];
  boardHashes: string[];
}

export const PlayView: React.FC<PlayViewProps> = ({
  visualizer,
  onChangeVisualizer,
}) => {
  const [boardSize, setBoardSize] = useState<BoardSize>(7);
  const [difficulty, setDifficulty] = useState<AIDifficulty>('beginner');
  const [opponentMode, setOpponentMode] = useState<'ai' | 'pass_and_play'>('ai');
  const [humanColor, setHumanColor] = useState<StoneColor>('B');

  const [board, setBoard] = useState<CellState[][]>(() => createEmptyBoard(7));
  const [turn, setTurn] = useState<StoneColor>('B');
  const [blackCaptures, setBlackCaptures] = useState<number>(0);
  const [whiteCaptures, setWhiteCaptures] = useState<number>(0);
  const [consecutivePasses, setConsecutivePasses] = useState<number>(0);
  const [lastMove, setLastMove] = useState<Point | null>(null);
  const [moveLog, setMoveLog] = useState<MoveRecord[]>([]);
  const [boardHashes, setBoardHashes] = useState<string[]>([
    serializeBoard(createEmptyBoard(7)),
  ]);
  const [history, setHistory] = useState<GameHistorySnapshot[]>([]);

  const [coachHint, setCoachHint] = useState<AIHint | null>(null);
  const [lastAIExplanation, setLastAIExplanation] = useState<string | null>(
    'Place a Black stone on any intersection to start the match! Star points (dots) are great opening moves.'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAIThinking, setIsAIThinking] = useState<boolean>(false);

  const isGameOver = consecutivePasses >= 2;

  const previousHashSet = useMemo(() => new Set(boardHashes), [boardHashes]);

  const territoryEstimate = useMemo(
    () => estimateTerritoryAndScore(board, blackCaptures, whiteCaptures, 5.5),
    [board, blackCaptures, whiteCaptures]
  );

  const startNewGame = (
    newSize: BoardSize = boardSize,
    newDiff: AIDifficulty = difficulty,
    newMode: 'ai' | 'pass_and_play' = opponentMode,
    newHumanColor: StoneColor = humanColor
  ) => {
    const empty = createEmptyBoard(newSize);
    setBoardSize(newSize);
    setDifficulty(newDiff);
    setOpponentMode(newMode);
    setHumanColor(newHumanColor);
    setBoard(empty);
    setTurn('B');
    setBlackCaptures(0);
    setWhiteCaptures(0);
    setConsecutivePasses(0);
    setLastMove(null);
    setMoveLog([]);
    setBoardHashes([serializeBoard(empty)]);
    setHistory([]);
    setCoachHint(null);
    setErrorMessage(null);
    setLastAIExplanation(
      newMode === 'ai' && newHumanColor === 'W'
        ? 'AI plays Black and is making the opening move...'
        : 'New game started! Place a stone on a star point or Ask Coach for a recommendation.'
    );
  };

  // Trigger AI turn automatically when it's AI's turn
  useEffect(() => {
    if (isGameOver) return;
    if (opponentMode !== 'ai') return;
    const aiColor = getOpponent(humanColor);
    if (turn !== aiColor) return;

    setIsAIThinking(true);
    const timer = setTimeout(() => {
      const aiMove = chooseAIMove(
        board,
        aiColor,
        difficulty,
        previousHashSet,
        moveLog.length
      );

      if (!aiMove.point) {
        // AI Passes
        const nextPasses = consecutivePasses + 1;
        setConsecutivePasses(nextPasses);
        setTurn(getOpponent(aiColor));
        setLastMove(null);
        setMoveLog((prev) => [
          ...prev,
          {
            moveNumber: prev.length + 1,
            color: aiColor,
            point: null,
            capturedStones: [],
            boardHash: serializeBoard(board),
            explanation: aiMove.explanation,
          },
        ]);
        setLastAIExplanation(
          `AI Passed: ${aiMove.explanation} ${
            nextPasses === 1
              ? 'If you agree all territories are finished, click Pass to end & score the game!'
              : ''
          }`
        );
        setIsAIThinking(false);
        return;
      }

      const res = validateMove(board, aiMove.point, aiColor, previousHashSet);
      if (res.valid && res.resultingBoard) {
        const capCount = res.capturedStones?.length || 0;
        const nextHash = serializeBoard(res.resultingBoard);

        setBoard(res.resultingBoard);
        if (aiColor === 'B') {
          setBlackCaptures((c) => c + capCount);
        } else {
          setWhiteCaptures((c) => c + capCount);
        }
        setConsecutivePasses(0);
        setLastMove(aiMove.point);
        setBoardHashes((prev) => [...prev, nextHash]);
        setMoveLog((prev) => [
          ...prev,
          {
            moveNumber: prev.length + 1,
            color: aiColor,
            point: aiMove.point,
            capturedStones: res.capturedStones || [],
            boardHash: nextHash,
            explanation: aiMove.explanation,
          },
        ]);
        setLastAIExplanation(
          `AI played ${formatCoordinate(aiMove.point, boardSize)}: ${
            aiMove.explanation
          }`
        );
        setTurn(getOpponent(aiColor));

        if (capCount > 0) {
          soundFX.playCapture(capCount);
        } else {
          soundFX.playStoneClack(aiColor === 'W');
        }
      }
      setIsAIThinking(false);
    }, 380);

    return () => clearTimeout(timer);
  }, [turn, opponentMode, humanColor, isGameOver, board, difficulty]);

  // Turn on Territory Map automatically when game ends
  useEffect(() => {
    if (isGameOver && !visualizer.showTerritoryMap) {
      onChangeVisualizer({ ...visualizer, showTerritoryMap: true });
      soundFX.playSuccess();
    }
  }, [isGameOver]);

  const saveSnapshot = () => {
    setHistory((prev) => [
      ...prev,
      {
        board,
        turn,
        blackCaptures,
        whiteCaptures,
        consecutivePasses,
        lastMove,
        moveLog,
        boardHashes,
      },
    ]);
  };

  const handlePlaceStone = (pt: Point) => {
    if (isGameOver || isAIThinking) return;
    if (opponentMode === 'ai' && turn !== humanColor) return;

    const res = validateMove(board, pt, turn, previousHashSet);
    if (!res.valid || !res.resultingBoard) {
      soundFX.playInvalid();
      setErrorMessage(res.reason || 'Illegal move');
      return;
    }

    saveSnapshot();
    setErrorMessage(null);
    setCoachHint(null);

    const capCount = res.capturedStones?.length || 0;
    const nextHash = serializeBoard(res.resultingBoard);

    setBoard(res.resultingBoard);
    if (turn === 'B') {
      setBlackCaptures((c) => c + capCount);
    } else {
      setWhiteCaptures((c) => c + capCount);
    }
    setConsecutivePasses(0);
    setLastMove(pt);
    setBoardHashes((prev) => [...prev, nextHash]);
    setMoveLog((prev) => [
      ...prev,
      {
        moveNumber: prev.length + 1,
        color: turn,
        point: pt,
        capturedStones: res.capturedStones || [],
        boardHash: nextHash,
      },
    ]);
    setTurn(getOpponent(turn));

    if (capCount > 0) {
      soundFX.playCapture(capCount);
    } else {
      soundFX.playStoneClack(turn === 'W');
    }
  };

  const handlePass = () => {
    if (isGameOver || isAIThinking) return;
    saveSnapshot();
    setCoachHint(null);
    setErrorMessage(null);

    const nextPasses = consecutivePasses + 1;
    setConsecutivePasses(nextPasses);
    setLastMove(null);
    setMoveLog((prev) => [
      ...prev,
      {
        moveNumber: prev.length + 1,
        color: turn,
        point: null,
        capturedStones: [],
        boardHash: serializeBoard(board),
        explanation: 'Player passed',
      },
    ]);
    setTurn(getOpponent(turn));
  };

  const handleUndo = () => {
    if (history.length === 0 || isAIThinking) return;
    const lastSnap = history[history.length - 1];
    setBoard(lastSnap.board);
    setTurn(lastSnap.turn);
    setBlackCaptures(lastSnap.blackCaptures);
    setWhiteCaptures(lastSnap.whiteCaptures);
    setConsecutivePasses(lastSnap.consecutivePasses);
    setLastMove(lastSnap.lastMove);
    setMoveLog(lastSnap.moveLog);
    setBoardHashes(lastSnap.boardHashes);
    setHistory((prev) => prev.slice(0, -1));
    setCoachHint(null);
    setErrorMessage(null);
  };

  const handleAskCoach = () => {
    if (isGameOver || isAIThinking) return;
    const suggestions = evaluateCandidateMoves(board, turn, previousHashSet);
    if (suggestions.length > 0) {
      setCoachHint(suggestions[0]);
    }
  };

  const winner =
    territoryEstimate.blackTotalArea > territoryEstimate.whiteTotalArea
      ? 'Black'
      : 'White';
  const margin = Math.abs(
    territoryEstimate.blackTotalArea - territoryEstimate.whiteTotalArea
  ).toFixed(1);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
      {/* Top Match Setup Bar */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-3 sm:p-4 mb-5 flex flex-wrap items-center justify-between gap-3">
        {/* Board Size Selector */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1">
            Board:
          </span>
          {([7, 9, 13, 19] as BoardSize[]).map((sz) => (
            <button
              key={sz}
              type="button"
              onClick={() => startNewGame(sz, difficulty, opponentMode, humanColor)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                boardSize === sz
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {sz}×{sz}
              {sz === 7 ? ' (Quick)' : sz === 9 ? ' (Standard)' : ''}
            </button>
          ))}
        </div>

        {/* Opponent & AI Difficulty Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => startNewGame(boardSize, difficulty, 'ai', humanColor)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                opponentMode === 'ai'
                  ? 'bg-slate-800 text-amber-300'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>vs AI Coach</span>
            </button>
            <button
              type="button"
              onClick={() =>
                startNewGame(boardSize, difficulty, 'pass_and_play', humanColor)
              }
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                opponentMode === 'pass_and_play'
                  ? 'bg-slate-800 text-amber-300'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>2-Player Local</span>
            </button>
          </div>

          {opponentMode === 'ai' && (
            <select
              value={difficulty}
              onChange={(e) =>
                startNewGame(
                  boardSize,
                  e.target.value as AIDifficulty,
                  opponentMode,
                  humanColor
                )
              }
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500"
            >
              <option value="beginner">Sensei Bot (Friendly Newcomer AI)</option>
              <option value="intermediate">Club Player (Tactical AI)</option>
              <option value="challenger">Master Challenger (Strong AI)</option>
            </select>
          )}

          <button
            type="button"
            onClick={() =>
              startNewGame(boardSize, difficulty, opponentMode, humanColor)
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Game</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout: Board + Controls on Left, Live Score & Coach Panel on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">
        {/* Left/Top Column: Visualizer Controls + Interactive Goban + Action Bar */}
        <div className="lg:col-span-7 flex flex-col items-center gap-3">
          <VisualizerControls settings={visualizer} onChange={onChangeVisualizer} />

          <Goban
            board={board}
            playerColor={turn}
            onPlaceStone={handlePlaceStone}
            visualizer={visualizer}
            lastMove={lastMove}
            coachHintPoint={coachHint?.point}
            territoryEstimate={territoryEstimate}
            disabled={isGameOver || isAIThinking}
            previousBoardHashes={previousHashSet}
          />

          {/* Quick Action Buttons Below Board (Easy Thumb Reach on Mobile!) */}
          <div className="w-full max-w-[540px] grid grid-cols-3 gap-2 sm:gap-3 mt-1">
            <button
              type="button"
              onClick={handleAskCoach}
              disabled={isGameOver || isAIThinking}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition"
            >
              <Compass className="w-4 h-4 shrink-0" />
              <span>Ask Coach Hint</span>
            </button>

            <button
              type="button"
              onClick={handleUndo}
              disabled={history.length === 0 || isAIThinking}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-semibold text-xs sm:text-sm border border-slate-700 transition"
            >
              <Undo2 className="w-4 h-4 shrink-0" />
              <span>Undo Move</span>
            </button>

            <button
              type="button"
              onClick={handlePass}
              disabled={isGameOver || isAIThinking}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-semibold text-xs sm:text-sm border border-slate-700 transition"
            >
              <SkipForward className="w-4 h-4 shrink-0" />
              <span>Pass Turn</span>
            </button>
          </div>
        </div>

        {/* Right/Bottom Column: Turn Status, Live Scoreboard, Coach Hint & Move Explainer */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Game Over Trophy Card */}
          {isGameOver && (
            <div className="rounded-2xl bg-gradient-to-br from-emerald-950/90 via-slate-900 to-amber-950/60 border-2 border-amber-500/60 p-5 shadow-2xl animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300">
                  <Trophy className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Game Finished (Both Players Passed)
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    {winner} Wins by {margin} Points!
                  </h2>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">
                Look at the board: the Territory Map is now highlighted! Every stone on the
                board plus every surrounded empty square counts toward each player’s final
                Area Score.
              </p>
              <button
                type="button"
                onClick={() =>
                  startNewGame(boardSize, difficulty, opponentMode, humanColor)
                }
                className="mt-4 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition"
              >
                Play Another Match
              </button>
            </div>
          )}

          {/* Live Scoreboard & Territory Breakdown */}
          <div className="rounded-2xl bg-slate-900/95 border border-slate-800 p-4 sm:p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`w-3.5 h-3.5 rounded-full ${
                    turn === 'B'
                      ? 'bg-slate-950 border-2 border-amber-400'
                      : 'bg-white border-2 border-amber-400'
                  }`}
                />
                <span className="font-bold text-sm sm:text-base text-white">
                  {isGameOver
                    ? 'Final Score Breakdown'
                    : isAIThinking
                    ? 'Sensei AI is thinking...'
                    : `${turn === 'B' ? 'Black' : 'White'}’s Turn to Play`}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                Move #{moveLog.length}
              </span>
            </div>

            {consecutivePasses === 1 && !isGameOver && (
              <div className="mb-3 px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-xs text-amber-200 flex items-center gap-2">
                <Flag className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  {turn === 'B' ? 'White' : 'Black'} passed! Click{' '}
                  <strong>Pass Turn</strong> if you agree the game is finished, or keep playing.
                </span>
              </div>
            )}

            {/* Player Cards: Black vs White */}
            <div className="grid grid-cols-2 gap-3">
              {/* Black Card */}
              <div
                className={`p-3.5 rounded-xl border transition ${
                  turn === 'B' && !isGameOver
                    ? 'bg-slate-950 border-amber-500/60 ring-1 ring-amber-500/30'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-slate-950 border border-slate-400 inline-block" />
                    <span className="font-bold text-sm text-white">Black</span>
                  </div>
                  <span className="text-lg font-extrabold text-amber-400">
                    {territoryEstimate.blackTotalArea}
                  </span>
                </div>
                <div className="mt-2.5 space-y-1 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Stones on board:</span>
                    <span className="text-slate-200 font-semibold">
                      {territoryEstimate.blackStones}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Surrounded territory:</span>
                    <span className="text-slate-200 font-semibold">
                      +{territoryEstimate.blackTerritory}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Captured prisoners:</span>
                    <span className="text-emerald-400 font-semibold">
                      {blackCaptures}
                    </span>
                  </div>
                </div>
              </div>

              {/* White Card */}
              <div
                className={`p-3.5 rounded-xl border transition ${
                  turn === 'W' && !isGameOver
                    ? 'bg-slate-950 border-amber-500/60 ring-1 ring-amber-500/30'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-white border border-slate-300 inline-block" />
                    <span className="font-bold text-sm text-white">White</span>
                  </div>
                  <span className="text-lg font-extrabold text-amber-400">
                    {territoryEstimate.whiteTotalArea.toFixed(1)}
                  </span>
                </div>
                <div className="mt-2.5 space-y-1 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Stones + Territory:</span>
                    <span className="text-slate-200 font-semibold">
                      {territoryEstimate.whiteStones} + {territoryEstimate.whiteTerritory}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Komi (2nd-turn bonus):</span>
                    <span className="text-sky-300 font-semibold">
                      +{territoryEstimate.komi}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Captured prisoners:</span>
                    <span className="text-emerald-400 font-semibold">
                      {whiteCaptures}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Coach & Move Explanation Panel */}
          <div className="rounded-2xl bg-slate-900/95 border border-slate-800 p-4 sm:p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
                <Sparkles className="w-3.5 h-3.5" />
                Live Go Sensei Commentary
              </span>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/50 text-xs sm:text-sm text-red-100">
                {errorMessage}
              </div>
            )}

            {coachHint ? (
              <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/40 animate-fade-in">
                <div className="flex items-start gap-2.5">
                  <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-amber-200 text-sm sm:text-base">
                      Coach Suggestion: {coachHint.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-200 mt-1 leading-relaxed">
                      {coachHint.explanation}
                    </p>
                    {coachHint.point && (
                      <button
                        type="button"
                        onClick={() => handlePlaceStone(coachHint.point!)}
                        className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition"
                      >
                        Play at {formatCoordinate(coachHint.point, boardSize)}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed">
                {lastAIExplanation}
              </div>
            )}

            {/* Recent Move Log */}
            {moveLog.length > 0 && (
              <div className="pt-2">
                <div className="text-xs font-semibold text-slate-400 mb-1.5">
                  Recent Moves:
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {moveLog.slice(-6).map((m) => (
                    <span
                      key={m.moveNumber}
                      className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300"
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          m.color === 'B'
                            ? 'bg-slate-400'
                            : 'bg-white'
                        }`}
                      />
                      <span>
                        #{m.moveNumber}{' '}
                        {m.point ? formatCoordinate(m.point, boardSize) : 'Pass'}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
