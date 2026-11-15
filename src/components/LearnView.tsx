import React, { useEffect, useMemo, useState } from 'react';
import { LESSONS } from '../data/lessons';
import { CellState, Point, VisualizerSettings } from '../types/go';
import { createEmptyBoard, pointsEqual, validateMove } from '../engine/goEngine';
import { estimateTerritoryAndScore } from '../engine/territory';
import { soundFX } from '../engine/sound';
import { Goban } from './Goban';
import { VisualizerControls } from './VisualizerControls';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
} from 'lucide-react';

interface LearnViewProps {
  completedLessonIds: string[];
  onCompleteLesson: (lessonId: string) => void;
  visualizer: VisualizerSettings;
  onChangeVisualizer: (next: VisualizerSettings) => void;
  onSwitchToPlay: () => void;
}

export const LearnView: React.FC<LearnViewProps> = ({
  completedLessonIds,
  onCompleteLesson,
  visualizer,
  onChangeVisualizer,
  onSwitchToPlay,
}) => {
  const [activeLessonIdx, setActiveLessonIdx] = useState<number>(0);
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);

  const currentLesson = LESSONS[activeLessonIdx];
  const currentStep = currentLesson.steps[activeStepIdx];

  const [board, setBoard] = useState<CellState[][]>(() =>
    createEmptyBoard(currentStep.boardSize)
  );
  const [lastMove, setLastMove] = useState<Point | null>(null);
  const [stepCompleted, setStepCompleted] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'hint' | 'error';
    message: string;
  } | null>(null);

  // Initialize board whenever lesson or step changes
  useEffect(() => {
    const fresh = createEmptyBoard(currentStep.boardSize);
    for (const s of currentStep.initialStones) {
      fresh[s.row][s.col] = s.color;
    }
    setBoard(fresh);
    setLastMove(null);
    setStepCompleted(false);
    setFeedback(null);

    // Automatically turn on territory map on Lesson 7 & 8 so newcomers see the territory light up
    if (currentLesson.number >= 7 && !visualizer.showTerritoryMap) {
      onChangeVisualizer({ ...visualizer, showTerritoryMap: true });
    }
  }, [activeLessonIdx, activeStepIdx]);

  const territoryEstimate = useMemo(() => estimateTerritoryAndScore(board), [board]);

  const resetStep = () => {
    const fresh = createEmptyBoard(currentStep.boardSize);
    for (const s of currentStep.initialStones) {
      fresh[s.row][s.col] = s.color;
    }
    setBoard(fresh);
    setLastMove(null);
    setStepCompleted(false);
    setFeedback(null);
  };

  const handlePlaceStone = (pt: Point) => {
    if (stepCompleted) return;

    const validation = validateMove(board, pt, currentStep.playerColor);
    if (!validation.valid || !validation.resultingBoard) {
      soundFX.playInvalid();
      setFeedback({
        type: 'error',
        message: validation.reason || 'That move is not allowed.',
      });
      return;
    }

    // Check if this move satisfies the step's pedagogical goal
    let isGoalMet = false;
    if (currentStep.goalType === 'place_anywhere') {
      isGoalMet = true;
    } else if (currentStep.goalType === 'place_specific') {
      isGoalMet =
        currentStep.targetPoints?.some((target) => pointsEqual(target, pt)) ?? false;
    } else if (currentStep.goalType === 'capture_any') {
      const captured = validation.capturedStones?.length || 0;
      const matchesTarget =
        !currentStep.targetPoints ||
        currentStep.targetPoints.some((target) => pointsEqual(target, pt));
      isGoalMet = captured > 0 && matchesTarget;
    }

    if (!isGoalMet) {
      soundFX.playInvalid();
      setFeedback({
        type: 'hint',
        message: currentStep.wrongMoveHint,
      });
      return;
    }

    // Apply the winning move!
    setBoard(validation.resultingBoard);
    setLastMove(pt);
    setStepCompleted(true);
    if (validation.capturedStones && validation.capturedStones.length > 0) {
      soundFX.playCapture(validation.capturedStones.length);
    } else {
      soundFX.playStoneClack(currentStep.playerColor === 'W');
    }
    setTimeout(() => soundFX.playSuccess(), 120);

    setFeedback({
      type: 'success',
      message: currentStep.successMessage,
    });

    // If this was the final step in the lesson, mark the lesson completed
    if (activeStepIdx === currentLesson.steps.length - 1) {
      onCompleteLesson(currentLesson.id);
    }
  };

  const goToNext = () => {
    if (activeStepIdx < currentLesson.steps.length - 1) {
      setActiveStepIdx(activeStepIdx + 1);
    } else if (activeLessonIdx < LESSONS.length - 1) {
      setActiveLessonIdx(activeLessonIdx + 1);
      setActiveStepIdx(0);
    } else {
      onSwitchToPlay();
    }
  };

  const goToPrev = () => {
    if (activeStepIdx > 0) {
      setActiveStepIdx(activeStepIdx - 1);
    } else if (activeLessonIdx > 0) {
      const prevLesson = LESSONS[activeLessonIdx - 1];
      setActiveLessonIdx(activeLessonIdx - 1);
      setActiveStepIdx(prevLesson.steps.length - 1);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
      {/* Horizontal Scrollable Lesson Selector Pill Bar (Great on both mobile & desktop) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 no-scrollbar">
        {LESSONS.map((lesson, idx) => {
          const isCompleted = completedLessonIds.includes(lesson.id);
          const isActive = idx === activeLessonIdx;
          return (
            <button
              key={lesson.id}
              type="button"
              onClick={() => {
                setActiveLessonIdx(idx);
                setActiveStepIdx(0);
              }}
              className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition ${
                isActive
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                  : isCompleted
                  ? 'bg-emerald-950/50 text-emerald-200 border-emerald-700/50 hover:bg-emerald-900/50'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  isActive
                    ? 'bg-slate-950 text-amber-400'
                    : isCompleted
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {isCompleted ? '✓' : lesson.number}
              </span>
              <span className="whitespace-nowrap">{lesson.title}</span>
            </button>
          );
        })}
      </div>

      {/* Main Responsive Split Grid: Board on Left/Top, Interactive Guide on Right/Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">
        {/* Interactive Board Column */}
        <div className="lg:col-span-7 flex flex-col items-center gap-3 order-1">
          <VisualizerControls settings={visualizer} onChange={onChangeVisualizer} />

          <Goban
            board={board}
            playerColor={currentStep.playerColor}
            onPlaceStone={handlePlaceStone}
            visualizer={visualizer}
            lastMove={lastMove}
            annotations={stepCompleted ? [] : currentStep.annotations}
            territoryEstimate={territoryEstimate}
            disabled={stepCompleted}
          />
        </div>

        {/* Lesson Guide & Interactive Task Card Column */}
        <div className="lg:col-span-5 flex flex-col gap-4 order-2">
          <div className="rounded-2xl bg-slate-900/95 border border-slate-800 p-4 sm:p-6 shadow-xl">
            {/* Lesson Header Badge */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                Lesson {currentLesson.number} of {LESSONS.length} • {currentLesson.badge}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                Step {activeStepIdx + 1} / {currentLesson.steps.length}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white">
              {currentLesson.title}
            </h1>
            <p className="text-xs sm:text-sm text-amber-200/90 mt-1 font-medium">
              {currentLesson.conceptSummary}
            </p>

            <div className="my-4 border-t border-slate-800/90" />

            {/* Current Interactive Challenge Box */}
            <div className="rounded-xl bg-slate-950/90 border border-slate-800 p-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Your Turn on the Board
                </span>
                <button
                  type="button"
                  onClick={resetStep}
                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition"
                  title="Reset board for this step"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Step</span>
                </button>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {currentStep.title}
              </h2>
              <p className="text-sm text-slate-200 mt-1.5 leading-relaxed">
                {currentStep.instruction}
              </p>

              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-start gap-2 text-xs text-slate-400">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-300">Why this matters:</strong>{' '}
                  {currentStep.whyItMatters}
                </span>
              </div>
            </div>

            {/* Dynamic Feedback Banner */}
            {feedback && (
              <div
                className={`mt-4 p-4 rounded-xl border animate-fade-in ${
                  feedback.type === 'success'
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-100'
                    : feedback.type === 'hint'
                    ? 'bg-amber-950/60 border-amber-500/50 text-amber-100'
                    : 'bg-red-950/60 border-red-500/50 text-red-100'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div className="text-sm leading-relaxed">
                    <p className="font-semibold">
                      {feedback.type === 'success'
                        ? 'Well Played!'
                        : feedback.type === 'hint'
                        ? 'Coach Hint'
                        : 'Illegal Move'}
                    </p>
                    <p className="mt-0.5 text-xs sm:text-sm opacity-95">
                      {feedback.message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step Navigation Footer */}
            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={goToPrev}
                disabled={activeLessonIdx === 0 && activeStepIdx === 0}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs sm:text-sm font-semibold transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              {activeLessonIdx === LESSONS.length - 1 &&
              activeStepIdx === currentLesson.steps.length - 1 &&
              stepCompleted ? (
                <button
                  type="button"
                  onClick={onSwitchToPlay}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg transition"
                >
                  <Trophy className="w-4 h-4" />
                  <span>Start Your First AI Match!</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goToNext}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition ${
                    stepCompleted
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg ring-2 ring-amber-300/50'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <span>
                    {stepCompleted
                      ? activeStepIdx < currentLesson.steps.length - 1
                        ? 'Next Challenge'
                        : 'Next Lesson'
                      : 'Skip Step'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Ready to jump into a live match card */}
          <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border border-slate-800 p-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white">
                Want to test your skills on a real board right now?
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Play 7×7, 9×9, 13×13, or 19×19 with the AI Coach & Liberty Visualizer.
              </p>
            </div>
            <button
              type="button"
              onClick={onSwitchToPlay}
              className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Play vs AI</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
