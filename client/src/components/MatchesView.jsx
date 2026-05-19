import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { getSessionId } from '../session';
import FoodImage from './FoodImage';

export default function MatchesView() {
  const sessionId = getSessionId();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMatches(sessionId);
      setMatches(data.matches);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <p className="px-4 py-3 text-sm text-zinc-400 border-b border-zinc-800 shrink-0">
        Foods you loved that others love too (60%+ yes globally)
      </p>
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {loading && <p className="text-zinc-500 text-center py-8">Loading matches…</p>}
        {error && <p className="text-red-400 text-center py-8">{error}</p>}
        {!loading && !error && matches.length === 0 && (
          <p className="text-zinc-500 text-center py-8">
            Vote yes on items, then check back when others agree!
          </p>
        )}
        <ul className="space-y-3 pb-4">
          {matches.map((m) => (
            <li
              key={m.id}
              className="flex gap-3 bg-zinc-900/80 rounded-xl p-3 border border-amber-900/40"
            >
              <FoodImage src={m.image_url} alt="" className="w-16 h-16 rounded-lg object-cover" />
              <div>
                <p className="font-semibold">{m.label}</p>
                <p className="text-amber-400 text-sm mt-1">
                  {Math.round(m.yes_rate * 100)}% global yes
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
