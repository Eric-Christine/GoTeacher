import React, { useEffect, useState } from 'react';
import { VisualizerSettings } from './types/go';
import { LESSONS } from './data/lessons';
import { soundFX } from './engine/sound';
import { Navbar } from './components/Navbar';
import { LearnView } from './components/LearnView';
import { PlayView } from './components/PlayView';
import { RulesModal } from './components/RulesModal';

const STORAGE_KEY_COMPLETED = 'goteacher_completed_lessons_v1';

export function App() {
  const [activeTab, setActiveTab] = useState<'learn' | 'play'>('learn');
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COMPLETED);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState<boolean>(false);

  const [visualizer, setVisualizer] = useState<VisualizerSettings>({
    showLibertyDots: true,
    showGroupConnections: true,
    showAtariWarnings: true,
    showTerritoryMap: false,
    showMovePreview: true,
    touchConfirmMode: false,
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY_COMPLETED,
        JSON.stringify(completedLessonIds)
      );
    } catch {
      // Ignore storage errors
    }
  }, [completedLessonIds]);

  const handleCompleteLesson = (lessonId: string) => {
    setCompletedLessonIds((prev) =>
      prev.includes(lessonId) ? prev : [...prev, lessonId]
    );
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundFX.enabled = next;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        completedLessonsCount={completedLessonIds.length}
        totalLessonsCount={LESSONS.length}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenRulesModal={() => setIsRulesModalOpen(true)}
      />

      <main className="flex-1 pb-10">
        {activeTab === 'learn' ? (
          <LearnView
            completedLessonIds={completedLessonIds}
            onCompleteLesson={handleCompleteLesson}
            visualizer={visualizer}
            onChangeVisualizer={setVisualizer}
            onSwitchToPlay={() => setActiveTab('play')}
          />
        ) : (
          <PlayView
            visualizer={visualizer}
            onChangeVisualizer={setVisualizer}
          />
        )}
      </main>

      <RulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />
    </div>
  );
}

export default App;
