import { useState, useRef, useCallback } from 'react';
import SwipeView from './components/SwipeView';
import ResultsView from './components/ResultsView';
import MatchesView from './components/MatchesView';

const TABS = [
  { id: 'swipe', label: 'Swipe', icon: '🃏' },
  { id: 'results', label: 'Results', icon: '📊' },
  { id: 'matches', label: 'Matches', icon: '✨' },
];

function DeckProgressBar({ current, total }) {
  const pct = total > 0 ? Math.min(100, (current / total) * 100) : 0;
  return (
    <div
      className="mt-2.5"
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={`${current} of ${total} dishes rated`}
    >
      <div className="flex items-baseline justify-between text-[11px] tabular-nums mb-1.5">
        <span className="font-semibold text-zinc-300">{current}</span>
        <span className="text-zinc-600">of {total}</span>
      </div>
      <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState('swipe');
  const [deckProgress, setDeckProgress] = useState(null);
  const pullStart = useRef(null);

  const onPullStart = (y) => {
    pullStart.current = y;
  };

  const onPullMove = useCallback((clientY) => {
    if (pullStart.current == null || tab !== 'swipe') return;
    const delta = clientY - pullStart.current;
    if (delta > 80) {
      setTab('results');
      pullStart.current = null;
    }
  }, [tab]);

  const onPullEnd = () => {
    pullStart.current = null;
  };

  return (
    <div
      className="h-full max-w-[390px] mx-auto flex flex-col bg-[#0f0f12]"
      style={{ maxHeight: '100dvh' }}
      onTouchStart={(e) => {
        if (e.touches[0].clientY < 60) onPullStart(e.touches[0].clientY);
      }}
      onTouchMove={(e) => {
        if (tab !== 'swipe') return;
        onPullMove(e.touches[0].clientY);
      }}
      onTouchEnd={onPullEnd}
    >
      <header className="shrink-0 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
        <h1 className="text-lg font-bold tracking-tight">
          <span className="text-amber-400">Would You Eat This?</span>
        </h1>
        {tab === 'swipe' && deckProgress && (
          <DeckProgressBar current={deckProgress.current} total={deckProgress.total} />
        )}
      </header>

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {tab === 'swipe' && (
          <SwipeView onDeckEmpty={() => {}} onProgressChange={setDeckProgress} />
        )}
        {tab === 'results' && <ResultsView />}
        {tab === 'matches' && <MatchesView />}
      </main>

      <nav className="shrink-0 flex border-t border-zinc-800 bg-zinc-950/90 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 py-3 text-xs font-medium transition-colors ${
              tab === t.id ? 'text-amber-400' : 'text-zinc-500'
            }`}
          >
            <span className="block text-lg">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
