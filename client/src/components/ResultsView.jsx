import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import FoodImage from './FoodImage';

const SORT_OPTIONS = [
  { value: 'most-loved', label: 'Most loved' },
  { value: 'most-hated', label: 'Most hated' },
  { value: 'most-controversial', label: 'Most controversial' },
  { value: 'most-votes', label: 'Most votes' },
];

export default function ResultsView() {
  const [results, setResults] = useState([]);
  const [sort, setSort] = useState('most-loved');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getResults(sort);
      setResults(data.results);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [sort]);

  useEffect(() => {
    load();
    const id = setInterval(load, 8000);
    return () => clearInterval(id);
  }, [load]);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 shrink-0">
        <label className="text-xs text-zinc-500 uppercase tracking-wide">Sort by</label>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="mt-1 w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3">
        {loading && <p className="text-zinc-500 text-center py-8">Loading results…</p>}
        {error && (
          <p className="text-red-400 text-center py-8">
            {error}
            <button type="button" onClick={load} className="block mx-auto mt-2 underline">
              Retry
            </button>
          </p>
        )}
        {!loading && !error && (
          <ul className="space-y-3 pb-4">
            {results.map((r, i) => {
              const pct = Math.round((r.yes_rate ?? 0) * 100);
              return (
                <li
                  key={r.id}
                  className="flex gap-3 bg-zinc-900/80 rounded-xl p-3 border border-zinc-800"
                >
                  <span className="text-zinc-600 font-mono text-sm w-6 shrink-0 pt-1">
                    #{i + 1}
                  </span>
                  <FoodImage
                    src={r.image_url}
                    alt=""
                    className="w-14 h-14 rounded-lg object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{r.label}</p>
                    <div className="mt-2 h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      {pct}% yes · {r.yes_count} yes / {r.no_count} no ({r.total_votes} votes)
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
