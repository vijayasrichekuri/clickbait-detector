/**
 * Word-level heatmap: each word colored by its contribution to clickbait score.
 * HIGH = more clickbait, MEDIUM = moderate, LOW = low contribution.
 */

import { motion } from "framer-motion";

interface WordItem {
  word: string;
  contribution: number;
  level: "high" | "medium" | "low";
}

interface WordHeatmapProps {
  headline: string;
  word_heatmap: WordItem[];
  className?: string;
}

const levelColors = {
  high: "bg-red-500/40 text-red-200 border-red-400/50",
  medium: "bg-amber-500/30 text-amber-200 border-amber-400/40",
  low: "bg-slate-600/30 text-slate-300 border-slate-500/30",
};

export default function WordHeatmap({ headline, word_heatmap, className = "" }: WordHeatmapProps) {
  if (!word_heatmap?.length) {
    return (
      <div className={`result-section ${className}`}>
        <p className="section-label">Word contribution</p>
        <p className="text-slate-400 text-sm">No word-level data</p>
      </div>
    );
  }

  const wordMap = new Map(word_heatmap.map((w) => [w.word.toLowerCase(), w]));
  const words = headline.split(/(\s+)/); // keep spaces

  return (
    <div className={`result-section ${className}`}>
      <p className="section-label">Word heatmap (contribution to score)</p>
      <div className="flex flex-wrap gap-1.5 items-center">
        {words.map((token, i) => {
          const isSpace = /^\s+$/.test(token);
          if (isSpace) return <span key={i}>{token}</span>;
          const w = wordMap.get(token.toLowerCase().replace(/’/g, "'"));
          const level = w?.level ?? "low";
          return (
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.02, duration: 0.2 }}
              className={`inline-block px-2 py-1 rounded-md border text-sm font-medium ${levelColors[level]}`}
            >
              {token}
            </motion.span>
          );
        })}
      </div>
      <div className="flex gap-5 mt-4 text-xs text-slate-500 font-medium">
        <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-500/50" /> High</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-500/50" /> Medium</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-slate-500/50" /> Low</span>
      </div>
    </div>
  );
}
