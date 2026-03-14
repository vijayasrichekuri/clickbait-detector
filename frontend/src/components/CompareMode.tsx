/**
 * Compare two headlines side-by-side.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { analyzeHeadline } from "../api";
import type { AnalysisResult } from "../types";
import ProbabilityMeter from "./ProbabilityMeter";
import { useToast } from "../context/ToastContext";

export default function CompareMode() {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [resultLeft, setResultLeft] = useState<AnalysisResult | null>(null);
  const [resultRight, setResultRight] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const runCompare = async () => {
    const a = left.trim();
    const b = right.trim();
    if (!a || !b) {
      toast("Enter both headlines to compare", "error");
      return;
    }
    setLoading(true);
    setResultLeft(null);
    setResultRight(null);
    try {
      const [resA, resB] = await Promise.all([analyzeHeadline(a), analyzeHeadline(b)]);
      setResultLeft(resA);
      setResultRight(resB);
      toast("Comparison complete", "success");
    } catch {
      toast("Comparison failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="glass card-glow rounded-2xl p-6"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2 flex items-center gap-3">
        <span className="text-2xl sm:text-3xl">⚖️</span> Compare headlines
      </h2>
      <p className="text-slate-400 text-sm mb-5">See two headlines side-by-side.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          value={left}
          onChange={(e) => setLeft(e.target.value)}
          placeholder="First headline..."
          className="input-base"
        />
        <input
          type="text"
          value={right}
          onChange={(e) => setRight(e.target.value)}
          placeholder="Second headline..."
          className="input-base"
        />
      </div>
      <button
        onClick={runCompare}
        disabled={loading}
        className="mt-4 glow-btn px-5 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold disabled:opacity-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:ring-offset-2 focus:ring-offset-bg"
      >
        {loading ? "Comparing…" : "Compare"}
      </button>
      {(resultLeft || resultRight) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="result-section rounded-xl p-4"
          >
            {resultLeft && (
              <>
                <p className="text-slate-300 text-sm font-medium mb-2 truncate" title={resultLeft.headline}>
                  {resultLeft.headline}
                </p>
                <ProbabilityMeter probability={resultLeft.probability} />
                <p className="mt-2 text-xs text-slate-500 font-medium">
                  {resultLeft.classification === "clickbait" ? "Clickbait" : "Real"} · {resultLeft.confidence}
                </p>
              </>
            )}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="result-section rounded-xl p-4"
          >
            {resultRight && (
              <>
                <p className="text-slate-300 text-sm font-medium mb-2 truncate" title={resultRight.headline}>
                  {resultRight.headline}
                </p>
                <ProbabilityMeter probability={resultRight.probability} />
                <p className="mt-2 text-xs text-slate-500 font-medium">
                  {resultRight.classification === "clickbait" ? "Clickbait" : "Real"} · {resultRight.confidence}
                </p>
              </>
            )}
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
