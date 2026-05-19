import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { getSessionId } from '../session';
import SwipeCard, { VoteButtons } from './SwipeCard';

// Preload images for upcoming cards so they're ready when needed
const preloadedUrls = new Set();
function preloadImages(items, startIdx, count = 3) {
  for (let i = startIdx; i < Math.min(startIdx + count, items.length); i++) {
    const url = items[i]?.image_url;
    if (url && !preloadedUrls.has(url)) {
      preloadedUrls.add(url);
      const img = new Image();
      img.referrerPolicy = 'no-referrer';
      img.src = url;
    }
  }
}

export default function SwipeView({ onDeckEmpty, onProgressChange }) {
  const sessionId = getSessionId();
  const [queue, setQueue] = useState([]);
  const [votedCount, setVotedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [voteError, setVoteError] = useState(null);
  const [cardKey, setCardKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const voteLock = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await api.getItems(sessionId);
      const voted = new Set(data.votedIds);
      const remaining = data.items.filter((i) => !voted.has(i.id));
      setQueue(remaining);
      setVotedCount(data.votedIds.length);
      // Preload first 4 images immediately on load
      preloadImages(remaining, 0, 4);
      if (remaining.length === 0) onDeckEmpty?.();
    } catch (e) {
      setLoadError(e.message);
    } finally {
      setLoading(false);
    }
  }, [sessionId, onDeckEmpty]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!onProgressChange) return;
    if (loading || loadError) {
      onProgressChange(null);
      return;
    }
    const total = votedCount + queue.length;
    onProgressChange(total > 0 ? { current: votedCount, total } : null);
  }, [votedCount, queue.length, loading, loadError, onProgressChange]);

  const submitVote = useCallback(
    async (choice, item) => {
      if (voteLock.current) {
        throw new Error('Vote in progress');
      }
      voteLock.current = true;
      setBusy(true);
      setVoteError(null);
      try {
        await api.vote({ itemId: item.id, choice, sessionId });
        setVotedCount((c) => c + 1);
        setQueue((q) => {
          const next = q.slice(1);
          // Preload the next few upcoming images
          preloadImages(next, 1, 3);
          if (next.length === 0) onDeckEmpty?.();
          return next;
        });
        setCardKey((k) => k + 1);
      } catch (e) {
        setVoteError(e.message || 'Vote failed');
        throw e;
      } finally {
        voteLock.current = false;
        setBusy(false);
      }
    },
    [sessionId, onDeckEmpty]
  );

  const handleUndo = async () => {
    if (voteLock.current) return;
    voteLock.current = true;
    setBusy(true);
    setVoteError(null);
    try {
      await api.undoVote(sessionId);
      await load();
      setCardKey((k) => k + 1);
    } catch (e) {
      if (!e.message?.includes('No votes')) setVoteError(e.message);
    } finally {
      voteLock.current = false;
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-400">
        Loading dishes…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-red-400">{loadError}</p>
        <button type="button" onClick={load} className="text-amber-400 underline">
          Retry
        </button>
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <p className="text-3xl">🍽️</p>
        <h2 className="text-xl font-bold mt-4">You voted on everything!</h2>
        <p className="text-zinc-400 mt-2">See how others voted in Results.</p>
      </div>
    );
  }

  const current = queue[0];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 pb-4 min-h-0">
      {voteError && (
        <p className="text-red-400 text-sm mb-2 text-center px-2">{voteError}</p>
      )}
      <div className="flex-1 flex items-center justify-center w-full min-h-0 overflow-hidden px-1">
        <div className="relative w-full max-w-[340px] max-h-full aspect-[3/4] shrink-0 overflow-hidden">
          <SwipeCard
            key={`${current.id}-${cardKey}`}
            item={current}
            cardKey={cardKey}
            disabled={busy}
            onVote={submitVote}
          />
        </div>
      </div>
      <VoteButtons
        disabled={busy}
        onVote={(choice) => {
          submitVote(choice, current).catch(() => {});
        }}
      />
      <button
        type="button"
        disabled={busy || votedCount === 0}
        onClick={handleUndo}
        className="mt-4 text-sm text-zinc-500 underline disabled:opacity-30"
      >
        Undo last swipe
      </button>
    </div>
  );
}
