/**
 * Batch analysis: paste multiple headlines (one per line), analyze all at once.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { analyzeBatch } from "../api";
import type { AnalysisResult } from "../types";
import { useToast } from "../context/ToastContext";

export default function BatchAnalysis({ onAnalyzed }: { onAnalyzed?: () => void }) {
  const [text, setText] = useState("");
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const headlines = text
    .split(/\n/)
    .map((h) => h.trim())
    .filter(Boolean);

  const runBatch = async () => {
    if (headlines.length === 0) {
      toast("Enter at least one headline (one per line)", "error");
      return;
    }
    if (headlines.length > 20) {
      toast("Max 20 headlines per batch. First 20 will be used.", "info");
    }
    setLoading(true);
    setResults([]);
    try {
      const { results: res } = await analyzeBatch(headlines.slice(0, 20));
      setResults(res);
      onAnalyzed?.();
      toast(`Analyzed ${res.length} headline(s)`, "success");
    } catch {
      toast("Batch analysis failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="glass card-glow rounded-2xl p-6"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
    >
      <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2 flex items-center gap-3">
        <span className="text-2xl sm:text-3xl">📋</span> Batch analysis
      </h2>
      <p className="text-slate-400 text-sm mb-5">Paste multiple headlines (one per line), up to 20.</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Headline one&#10;Headline two&#10;..."
        rows={4}
        className="input-base resize-none"
      />
      <button
        onClick={runBatch}
        disabled={loading || headlines.length === 0}
        className="mt-4 glow-btn px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Analyzing {headlines.length}…
          </span>
        ) : (
          `Analyze all (${Math.min(headlines.length, 20)})`
        )}
      </button>
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.35 }}
            className="mt-6 space-y-2 max-h-64 overflow-y-auto pr-1"
          >
            {results.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03, duration: 0.25 }}
                className="flex items-center justify-between gap-2 py-2.5 px-4 rounded-xl bg-slate-800/50 border border-white/[0.06]"
              >
                <span className="text-slate-200 text-sm truncate flex-1" title={r.headline}>
                  {r.headline.length > 45 ? r.headline.slice(0, 45) + "…" : r.headline}
                </span>
                <span
                  className={`shrink-0 text-sm font-mono font-medium ${
                    r.probability >= 0.5 ? "text-red-400" : "text-emerald-400"
                  }`}
                >
                  {Math.round(r.probability * 100)}%
                </span>
                <span
                  className={`shrink-0 text-xs px-2 py-0.5 rounded ${
                    r.classification === "clickbait" ? "bg-red-500/20 text-red-300" : "bg-emerald-500/20 text-emerald-300"
                  }`}
                >
                  {r.classification === "clickbait" ? "Clickbait" : "Real"}
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
