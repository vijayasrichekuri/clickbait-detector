/**
 * History panel: list of analyzed headlines with filter, search, and favorites.
 */

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { getHistory } from "../api";
import type { HistoryEntry } from "../types";
import { SkeletonList } from "./Skeleton";

const FAVORITES_KEY = "clickbait-favorites";

function loadFavorites(): Set<string> {
  try {
    const s = localStorage.getItem(FAVORITES_KEY);
    if (!s) return new Set();
    const arr = JSON.parse(s) as string[];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function saveFavorites(set: Set<string>) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...set]));
}

interface HistoryPanelProps {
  refreshKey?: number;
  onSelectHeadline?: (headline: string) => void;
}

export default function HistoryPanel({ refreshKey = 0, onSelectHeadline }: HistoryPanelProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "clickbait" | "real">("all");
  const [search, setSearch] = useState("");
  const [showFavorites, setShowFavorites] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(loadFavorites);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getHistory(200)
      .then((res) => {
        if (!cancelled) setHistory(res.history);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [refreshKey]);

  const favoriteList = useMemo(() => {
    return history.filter((e) => favorites.has(e.headline));
  }, [history, favorites]);

  const filtered = useMemo(() => {
    let list = showFavorites ? favoriteList : history;
    if (filter === "clickbait") list = list.filter((e) => e.classification === "clickbait");
    else if (filter === "real") list = list.filter((e) => e.classification !== "clickbait");
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((e) => e.headline.toLowerCase().includes(q));
    }
    return list;
  }, [history, favoriteList, showFavorites, filter, search]);

  const toggleFavorite = (headline: string) => {
    const next = new Set(favorites);
    if (next.has(headline)) next.delete(headline);
    else next.add(headline);
    setFavorites(next);
    saveFavorites(next);
  };

  return (
    <motion.div
      className="glass card-glow rounded-2xl p-6"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
    >
      <h2 className="text-xl sm:text-2xl font-semibold text-white mb-5 flex items-center gap-3">
        <span className="text-2xl sm:text-3xl">🕐</span> History
      </h2>
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setShowFavorites(false)}
          className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:ring-offset-2 focus:ring-offset-bg ${
            !showFavorites ? "bg-purple-600 text-white shadow-soft" : "btn-secondary"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setShowFavorites(true)}
          className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:ring-offset-2 focus:ring-offset-bg ${
            showFavorites ? "bg-amber-500/25 text-amber-200 border border-amber-400/30" : "btn-secondary"
          }`}
        >
          ♥ Favorites ({favorites.size})
        </button>
      </div>
      <div className="flex gap-2 mb-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as "all" | "clickbait" | "real")}
          className="rounded-xl bg-slate-800/70 border border-white/10 px-3.5 py-2.5 text-sm font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/40 transition-colors"
        >
          <option value="all">All</option>
          <option value="clickbait">Clickbait only</option>
          <option value="real">Real only</option>
        </select>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="input-base flex-1 min-w-0 py-2.5 text-sm"
        />
      </div>
      {loading ? (
        <SkeletonList rows={8} />
      ) : filtered.length === 0 ? (
        <p className="text-slate-400 text-sm py-4">
          {showFavorites ? "No favorites yet. Click ♥ on a headline." : "No analyzed headlines yet."}
        </p>
      ) : (
        <ul className="space-y-1 max-h-80 overflow-y-auto pr-1">
          {filtered.map((entry, i) => (
            <motion.li
              key={`${entry.headline}-${entry.timestamp}-${i}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02, duration: 0.25 }}
              className="flex items-start gap-2 py-2.5 px-2 rounded-lg border-b border-white/[0.04] last:border-0 group hover:bg-white/[0.03] transition-colors"
            >
              <button
                onClick={() => toggleFavorite(entry.headline)}
                className="shrink-0 text-base opacity-70 hover:opacity-100 transition-opacity focus:outline-none"
                title={favorites.has(entry.headline) ? "Remove from favorites" : "Add to favorites"}
              >
                {favorites.has(entry.headline) ? "♥" : "♡"}
              </button>
              <button
                onClick={() => onSelectHeadline?.(entry.headline)}
                className="flex-1 min-w-0 text-left"
              >
                <span
                  className={`text-sm truncate block group-hover:text-cyan-300 transition-colors duration-200 ${
                    onSelectHeadline ? "cursor-pointer text-slate-300" : "text-slate-300"
                  }`}
                  title={entry.headline}
                >
                  {entry.headline.length > 48 ? entry.headline.slice(0, 48) + "…" : entry.headline}
                </span>
              </button>
              <span
                className={`shrink-0 text-sm font-mono font-semibold tabular-nums ${
                  (entry.probability ?? 0) >= 0.5 ? "text-red-400" : "text-emerald-400"
                }`}
              >
                {Math.round((entry.probability ?? 0) * 100)}%
              </span>
            </motion.li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
