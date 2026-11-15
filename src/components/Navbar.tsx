import React from 'react';
import { BookOpen, GraduationCap, HelpCircle, Swords, Volume2, VolumeX } from 'lucide-react';

interface NavbarProps {
  activeTab: 'learn' | 'play';
  onSelectTab: (tab: 'learn' | 'play') => void;
  completedLessonsCount: number;
  totalLessonsCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenRulesModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  completedLessonsCount,
  totalLessonsCount,
  soundEnabled,
  onToggleSound,
  onOpenRulesModal,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-md bg-slate-950/85 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-md flex items-center justify-center">
            <div className="w-3.5 h-3.5 rounded-full bg-slate-950 shadow-sm -mr-1 -mt-1" />
            <div className="w-3.5 h-3.5 rounded-full bg-white shadow-sm -ml-0.5 mt-1" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg tracking-tight text-white">
                GoTeacher
              </span>
              <span className="hidden md:inline-block text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Visual Newcomer Guide
              </span>
            </div>
            <p className="hidden sm:block text-xs text-slate-400">
              Learn Weiqi / Baduk in 10 minutes with live visualizers
            </p>
          </div>
        </div>

        {/* Mode Switcher */}
        <nav className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => onSelectTab('learn')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
              activeTab === 'learn'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Learn Path</span>
            <span
              className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[11px] ${
                activeTab === 'learn'
                  ? 'bg-slate-950/20 text-slate-950 font-bold'
                  : 'bg-slate-800 text-amber-300'
              }`}
            >
              {completedLessonsCount}/{totalLessonsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('play')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
              activeTab === 'play'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Swords className="w-4 h-4" />
            <span>Play vs AI</span>
          </button>
        </nav>

        {/* Utility Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenRulesModal}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs sm:text-sm font-medium transition"
            title="Quick 1-Page Rules Cheat Sheet"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Quick Rules</span>
          </button>

          <button
            type="button"
            onClick={onToggleSound}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
            title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            aria-label="Toggle sound effects"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
