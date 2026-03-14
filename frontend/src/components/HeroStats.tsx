/**
 * Live stats in hero: total analyzed, average clickbait score.
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getAnalytics } from "../api";

export default function HeroStats() {
  const [stats, setStats] = useState<{ total: number; avg: number } | null>(null);

  useEffect(() => {
    getAnalytics()
      .then((d) => setStats({ total: d.total, avg: d.average_probability }))
      .catch(() => setStats(null));
  }, []);

  if (!stats || stats.total === 0) return null;

  return (
    <motion.div
      className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45, duration: 0.4 }}
    >
      <div className="px-5 py-3 rounded-xl bg-white/[0.06] border border-white/10 flex items-center gap-3 shadow-soft">
        <span className="text-slate-500 text-sm font-medium">Headlines analyzed</span>
        <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 font-mono tabular-nums">
          {stats.total.toLocaleString()}
        </span>
      </div>
      <div className="px-5 py-3 rounded-xl bg-white/[0.06] border border-white/10 flex items-center gap-3 shadow-soft">
        <span className="text-slate-500 text-sm font-medium">Avg clickbait score</span>
        <span className="text-2xl font-bold font-mono text-cyan-400 tabular-nums">
          {Math.round(stats.avg * 100)}%
        </span>
      </div>
    </motion.div>
  );
}
