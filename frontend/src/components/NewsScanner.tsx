/**
 * Real-time news scanner: fetch headlines and show clickbait scores.
 */

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { fetchNews, analyzeNewsHeadlines } from "../api";
import type { NewsWithScore } from "../types";
import { useToast } from "../context/ToastContext";
import { SkeletonList } from "./Skeleton";

export default function NewsScanner() {
  const [headlines, setHeadlines] = useState<NewsWithScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadAndAnalyze = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { headlines: raw } = await fetchNews(25);
      setHeadlines([]);
      setAnalyzing(true);
      const { results } = await analyzeNewsHeadlines(raw);
      setHeadlines(results);
      toast(`Loaded ${results.length} headlines with scores`, "success");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load news";
      setError(msg);
      toast(msg, "error");
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAndAnalyze();
  }, []);

  return (
    <motion.div
      className="glass card-glow rounded-2xl p-6"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <h2 className="text-xl sm:text-2xl font-semibold text-white flex items-center gap-3">
          <span className="text-2xl sm:text-3xl">📡</span> Real-time news scanner
        </h2>
        <button
          onClick={loadAndAnalyze}
          disabled={loading || analyzing}
          className="glow-btn px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:ring-offset-2 focus:ring-offset-bg"
        >
          {loading ? "Loading…" : analyzing ? "Analyzing…" : "Refresh"}
        </button>
      </div>
      {error && <p className="text-red-400 text-sm font-medium mb-4">{error}</p>}
      <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
        {loading && headlines.length === 0 && <SkeletonList rows={10} />}
        {headlines.length === 0 && !loading && !error && (
          <p className="text-slate-400 text-sm py-6">No headlines. Click Refresh.</p>
        )}
        {headlines.map((item, i) => (
          <motion.div
            key={`${item.title}-${i}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.02, duration: 0.25 }}
            className="flex flex-col sm:flex-row sm:items-center gap-2 py-3.5 px-2 rounded-lg border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex-1 min-w-0">
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-200 hover:text-cyan-300 text-sm line-clamp-2"
                >
                  {item.title}
                </a>
              ) : (
                <span className="text-slate-200 text-sm line-clamp-2">{item.title}</span>
              )}
              {item.source && (
                <span className="text-xs text-slate-500 mt-0.5 block">{item.source}</span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`text-sm font-mono font-medium ${
                  item.probability >= 0.5 ? "text-red-400" : "text-emerald-400"
                }`}
              >
                {Math.round(item.probability * 100)}%
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded ${
                  item.classification === "clickbait"
                    ? "bg-red-500/20 text-red-300"
                    : "bg-emerald-500/20 text-emerald-300"
                }`}
              >
                {item.classification === "clickbait" ? "Clickbait" : "Real"}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
