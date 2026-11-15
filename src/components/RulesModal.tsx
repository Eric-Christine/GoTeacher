import React from 'react';
import { CheckCircle2, Eye, Flame, Grid, ShieldAlert, Sparkles, X } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              60-Second Reference
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-0.5">
              The 5 Essential Rules of Go
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4 text-sm text-slate-300">
          <div className="flex gap-3.5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <Grid className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-white text-base">
                1. Stones Go on the Intersections
              </h3>
              <p className="mt-1 text-slate-400 leading-relaxed">
                Black plays first, then White and Black alternate turns placing one stone on any empty
                intersection (including edges and corners). Once placed, stones never move!
              </p>
            </div>
          </div>

          <div className="flex gap-3.5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <Flame className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-white text-base">
                2. Liberties ("Breaths") & Connected Groups
              </h3>
              <p className="mt-1 text-slate-400 leading-relaxed">
                Empty spots directly adjacent (up, down, left, right) to a stone are its{' '}
                <strong className="text-emerald-300">Liberties</strong>. Stones of the same color touching
                along a line form a <strong className="text-sky-300">Connected Group</strong> and share all
                their liberties together. Diagonals do not connect!
              </p>
            </div>
          </div>

          <div className="flex gap-3.5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <ShieldAlert className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-white text-base">
                3. Atari & Capturing Stones
              </h3>
              <p className="mt-1 text-slate-400 leading-relaxed">
                When a stone or group is down to just <strong className="text-red-300">1 liberty</strong>,
                it is in <strong className="text-red-300">Atari</strong>. If the opponent plays on that last
                remaining liberty, the entire group is captured and removed from the board.
              </p>
            </div>
          </div>

          <div className="flex gap-3.5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <Eye className="w-6 h-6 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-white text-base">
                4. No Suicide, the Ko Rule & "Two Eyes"
              </h3>
              <p className="mt-1 text-slate-400 leading-relaxed">
                You cannot play a move that leaves your own group with 0 liberties—<em>unless</em> that move
                captures enemy stones first! Also, you cannot immediately repeat the previous full-board
                position (<strong className="text-amber-300">Ko Rule</strong>). Because of this, a group with{' '}
                <strong className="text-sky-300">Two Separate Internal Eyes</strong> can never be captured!
              </p>
            </div>
          </div>

          <div className="flex gap-3.5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <Sparkles className="w-6 h-6 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-white text-base">
                5. Winning the Game: Area / Territory Scoring
              </h3>
              <p className="mt-1 text-slate-400 leading-relaxed">
                When both players click <strong>Pass</strong> consecutively, the game ends. Your score is your{' '}
                <strong>Living Stones on the Board + Empty Territory Intersections you surrounded</strong>{' '}
                (White gets +5.5 <em>Komi</em> bonus points for going second). Highest total wins!
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            Got It, Let’s Play!
          </button>
        </div>
      </div>
    </div>
  );
};
