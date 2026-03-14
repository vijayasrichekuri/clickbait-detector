/**
 * Main headline input and analysis card.
 * Shows results: probability meter, classification, triggers, explanation, heatmap, export.
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { analyzeHeadline, exportPdf, exportJson } from "../api";
import type { AnalysisResult } from "../types";
import ProbabilityMeter from "./ProbabilityMeter";
import WordHeatmap from "./WordHeatmap";
import { useToast } from "../context/ToastContext";

const PLACEHOLDER = "Enter news headline...";
const SUGGESTIONS = [
  "You Won't Believe What This Celebrity Did Yesterday!",
  "Scientists Discover New Planet in Habitable Zone",
  "This One Trick Will Save You Thousands",
  "Doctors Hate This One Weird Trick",
  "What Happened Next Will Shock You",
  "Study Finds Moderate Exercise Improves Longevity",
  "The Secret That Big Pharma Doesn't Want You To Know",
  "Federal Reserve Announces Interest Rate Decision",
];

function HighlightedHeadline({ headline, triggers }: { headline: string; triggers: AnalysisResult["triggers"] }) {
  if (!triggers.length) return <>{headline}</>;
  const parts: { text: string; highlight: boolean }[] = [];
  let last = 0;
  triggers.forEach((t) => {
    if (t.start > last) parts.push({ text: headline.slice(last, t.start), highlight: false });
    parts.push({ text: headline.slice(t.start, t.end), highlight: true });
    last = t.end;
  });
  if (last < headline.length) parts.push({ text: headline.slice(last), highlight: false });

  return (
    <>
      {parts.map((p, i) =>
        p.highlight ? (
          <mark key={i} className="bg-amber-500/35 text-amber-100 rounded-md px-1 py-0.5 font-medium">
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </>
  );
}

interface DetectorProps {
  onAnalyzed?: (result: AnalysisResult) => void;
  prefillHeadline?: string;
}

export default function Detector({ onAnalyzed, prefillHeadline = "" }: DetectorProps) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<"pdf" | "json" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (prefillHeadline) setInput(prefillHeadline);
  }, [prefillHeadline]);

  const runAnalysis = async (text: string) => {
    const headline = text.trim();
    if (!headline) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await analyzeHeadline(headline);
      setResult(data);
      onAnalyzed?.(data);
      toast("Analysis complete", "success");
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Analysis failed";
      setError(msg);
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        runAnalysis(input);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [input]);

  const handleExportPdf = async () => {
    if (!result?.headline) return;
    setExporting("pdf");
    try {
      const url = await exportPdf(result.headline);
      const a = document.createElement("a");
      a.href = url;
      a.download = "clickbait-report.pdf";
      a.click();
      URL.revokeObjectURL(url);
      toast("PDF downloaded", "success");
    } catch {
      setError("PDF export failed");
      toast("PDF export failed", "error");
    } finally {
      setExporting(null);
    }
  };

  const handleExportJson = async () => {
    if (!result?.headline) return;
    setExporting("json");
    try {
      const data = await exportJson(result.headline);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "clickbait-report.json";
      a.click();
      URL.revokeObjectURL(url);
      toast("JSON downloaded", "success");
    } catch {
      setError("JSON export failed");
      toast("JSON export failed", "error");
    } finally {
      setExporting(null);
    }
  };

  return (
    <motion.div
      className="glass card-glow rounded-2xl p-6 sm:p-8"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <h2 className="text-xl sm:text-2xl font-semibold text-white mb-1 flex items-center gap-3">
        <span className="text-2xl sm:text-3xl">🔍</span> Headline detector
      </h2>
      <p className="text-slate-400 text-sm mb-5">Press <kbd className="px-2 py-0.5 rounded-md bg-slate-700/80 text-xs font-mono border border-white/5">Ctrl</kbd>+<kbd className="px-2 py-0.5 rounded-md bg-slate-700/80 text-xs font-mono border border-white/5 ml-0.5">Enter</kbd> to analyze</p>
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.ctrlKey && !e.metaKey && runAnalysis(input)}
          placeholder={PLACEHOLDER}
          className="input-base flex-1 min-w-0"
        />
        <button
          onClick={() => runAnalysis(input)}
          disabled={loading}
          className="glow-btn px-6 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed shrink-0 transition-colors duration-200"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:300ms]" />
              </span>
              AI analyzing…
            </span>
          ) : (
            "Analyze headline"
          )}
        </button>
      </div>

      {/* Suggested headlines */}
      <div className="mt-4 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s, i) => (
          <motion.button
            key={s}
            onClick={() => setInput(s)}
            className="text-xs px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/5 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/30"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
          >
            {s.length > 35 ? s.slice(0, 35) + "…" : s}
          </motion.button>
        ))}
      </div>

      {error && (
        <p className="mt-4 text-red-400 text-sm font-medium">{error}</p>
      )}

      <AnimatePresence>
        {result && !result.error && (
          <motion.div
            ref={resultsRef}
            className="mt-8 pt-6 border-t border-white/[0.06] space-y-7"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div className="result-section" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <p className="section-label">Headline (trigger phrases highlighted)</p>
              <p className="text-slate-200 text-base leading-relaxed">
                <HighlightedHeadline headline={result.headline} triggers={result.triggers} />
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <ProbabilityMeter probability={result.probability} />
            </motion.div>

            <motion.div className="flex flex-wrap gap-3 items-center" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <span className="text-slate-500 text-sm font-medium">Prediction:</span>
              <span
                className={`px-3.5 py-1.5 rounded-lg font-semibold text-sm ${
                  result.classification === "clickbait"
                    ? "bg-red-500/20 text-red-300 border border-red-400/40 shadow-[0_0_12px_-2px_rgba(248,113,113,0.2)]"
                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-[0_0_12px_-2px_rgba(52,211,153,0.2)]"
                }`}
              >
                {result.classification === "clickbait" ? "Clickbait" : "Not clickbait"}
              </span>
              <span className="text-slate-500 text-sm">Confidence: <span className="text-slate-300 font-medium">{result.confidence}</span></span>
            </motion.div>

            <motion.div className="result-section" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <p className="section-label">AI explanation</p>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">{result.explanation}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <WordHeatmap headline={result.headline} word_heatmap={result.word_heatmap} />
            </motion.div>

            <motion.div className="flex flex-wrap gap-3" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <button
                onClick={handleExportPdf}
                disabled={!!exporting}
                className="px-5 py-2.5 rounded-xl bg-cyan-600/90 hover:bg-cyan-500 text-white text-sm font-semibold disabled:opacity-50 transition-all duration-200 hover:shadow-glow-cyan focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:ring-offset-2 focus:ring-offset-bg"
              >
                {exporting === "pdf" ? "Exporting…" : "Export PDF"}
              </button>
              <button
                onClick={handleExportJson}
                disabled={!!exporting}
                className="px-5 py-2.5 rounded-xl bg-blue-600/90 hover:bg-blue-500 text-white text-sm font-semibold disabled:opacity-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:ring-offset-2 focus:ring-offset-bg"
              >
                {exporting === "json" ? "Exporting…" : "Export JSON"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
