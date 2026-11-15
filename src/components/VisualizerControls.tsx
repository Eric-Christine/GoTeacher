import React from 'react';
import { VisualizerSettings } from '../types/go';
import { Activity, AlertCircle, Grid, Link2, Smartphone } from 'lucide-react';

interface VisualizerControlsProps {
  settings: VisualizerSettings;
  onChange: (next: VisualizerSettings) => void;
}

export const VisualizerControls: React.FC<VisualizerControlsProps> = ({
  settings,
  onChange,
}) => {
  const toggle = (key: keyof VisualizerSettings) => {
    onChange({ ...settings, [key]: !settings[key] });
  };

  return (
    <div className="w-full max-w-[540px] flex flex-wrap items-center justify-center sm:justify-between gap-1.5 sm:gap-2 p-2 rounded-xl bg-slate-900/90 border border-slate-800/90 shadow-sm">
      <button
        type="button"
        onClick={() => toggle('showLibertyDots')}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
          settings.showLibertyDots
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 border border-transparent'
        }`}
        title="Show glowing breathing dots & liberty count badges for all groups"
      >
        <Activity className="w-3.5 h-3.5" />
        <span>Liberties</span>
      </button>

      <button
        type="button"
        onClick={() => toggle('showGroupConnections')}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
          settings.showGroupConnections
            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
            : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 border border-transparent'
        }`}
        title="Draw visual bridges between orthogonally connected stones"
      >
        <Link2 className="w-3.5 h-3.5" />
        <span>Group Links</span>
      </button>

      <button
        type="button"
        onClick={() => toggle('showAtariWarnings')}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
          settings.showAtariWarnings
            ? 'bg-red-500/20 text-red-300 border border-red-500/40'
            : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 border border-transparent'
        }`}
        title="Pulse stones in red when they have only 1 liberty left (Atari!)"
      >
        <AlertCircle className="w-3.5 h-3.5" />
        <span>Atari Alert</span>
      </button>

      <button
        type="button"
        onClick={() => toggle('showTerritoryMap')}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
          settings.showTerritoryMap
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 border border-transparent'
        }`}
        title="Show controlled Black & White territory squares on empty intersections"
      >
        <Grid className="w-3.5 h-3.5" />
        <span>Territory Map</span>
      </button>

      <button
        type="button"
        onClick={() => toggle('touchConfirmMode')}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
          settings.touchConfirmMode
            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
            : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 border border-transparent'
        }`}
        title="2-Tap Confirm mode for smaller mobile screens"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span>2-Tap Confirm</span>
      </button>
    </div>
  );
};
