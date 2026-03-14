/**
 * AI Clickbait Detector – main app layout.
 * Sticky header, hero + stats, detector, batch, compare, news, history, analytics, footer.
 */

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ToastProvider } from "./context/ToastContext";
import ParticlesBackground from "./components/ParticlesBackground";
import HeroStats from "./components/HeroStats";
import Detector from "./components/Detector";
import BatchAnalysis from "./components/BatchAnalysis";
import CompareMode from "./components/CompareMode";
import HistoryPanel from "./components/HistoryPanel";
import NewsScanner from "./components/NewsScanner";
import AnalyticsDashboard from "./components/AnalyticsDashboard";

function StickyHeader() {
  return (
    <motion.header
      className="sticky top-0 z-50 border-b border-white/[0.08] bg-bg/85 backdrop-blur-xl shadow-[0_1px_0_0_rgba(255,255,255,0.03)]"
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2.5 text-white font-semibold transition-opacity hover:opacity-90">
          <span className="text-2xl">🛡️</span>
          <span className="text-lg bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Clickbait Detector
          </span>
        </a>
        <nav className="flex gap-6 text-sm font-medium">
          <a href="#detector" className="text-slate-400 hover:text-white transition-colors duration-200 py-1">Detect</a>
          <a href="#news" className="text-slate-400 hover:text-white transition-colors duration-200 py-1">News</a>
          <a href="#analytics" className="text-slate-400 hover:text-white transition-colors duration-200 py-1">Analytics</a>
        </nav>
      </div>
    </motion.header>
  );
}

function Hero() {
  return (
    <motion.section
      className="text-center pt-14 sm:pt-18 pb-16 sm:pb-20 px-4"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-5 tracking-tight leading-[1.1]">
        <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
          AI Clickbait Detector
        </span>
      </h1>
      <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mb-3 leading-relaxed">
        Detect clickbait in news headlines with ML and NLP. Real-time news scanner and explainable AI.
      </p>
      <p className="text-slate-500 text-sm sm:text-base">
        TF-IDF + Logistic Regression • Trigger highlighting • Word heatmap • Export reports
      </p>
      <HeroStats />
    </motion.section>
  );
}

function Footer() {
  return (
    <motion.footer
      className="mt-24 py-10 border-t border-white/[0.08] text-center text-slate-500 text-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6, duration: 0.5 }}
    >
      <p className="font-medium">Built with React, Tailwind, Framer Motion, Flask, scikit-learn</p>
      <p className="mt-2 text-slate-600">© AI Clickbait Detector</p>
    </motion.footer>
  );
}

export default function App() {
  const [historyKey, setHistoryKey] = useState(0);
  const [prefillHeadline, setPrefillHeadline] = useState("");

  const onAnalyzed = useCallback(() => setHistoryKey((k) => k + 1), []);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-bg text-slate-200 relative">
        <ParticlesBackground />
        <StickyHeader />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pb-24">
          <Hero />
          <div className="space-y-10 sm:space-y-12" id="detector">
            <Detector prefillHeadline={prefillHeadline} onAnalyzed={onAnalyzed} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <BatchAnalysis onAnalyzed={onAnalyzed} />
              <CompareMode />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="news">
              <div className="lg:col-span-2">
                <NewsScanner />
              </div>
              <div>
                <HistoryPanel
                  refreshKey={historyKey}
                  onSelectHeadline={(h) => {
                    setPrefillHeadline(h);
                    document.getElementById("detector")?.scrollIntoView({ behavior: "smooth" });
                  }}
                />
              </div>
            </div>
            <div id="analytics">
              <AnalyticsDashboard />
            </div>
          </div>
          <Footer />
        </div>
      </div>
    </ToastProvider>
  );
}
