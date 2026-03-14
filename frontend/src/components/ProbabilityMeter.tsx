/**
 * Visual probability gauge for clickbait score.
 * Uses a custom bar/gauge style (react-gauge-chart has different API; we use CSS for consistency).
 */

import { motion } from "framer-motion";

interface ProbabilityMeterProps {
  probability: number; // 0–1
  label?: string;
  className?: string;
}

export default function ProbabilityMeter({ probability, label = "Clickbait Probability", className = "" }: ProbabilityMeterProps) {
  const pct = Math.round(probability * 100);
  // Color: green (low) -> yellow -> red (high)
  const hue = 120 - pct * 1.2; // 120 (green) to 0 (red)
  const color = `hsl(${hue}, 70%, 55%)`;

  return (
    <div className={`${className}`}>
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">{label}</span>
        <span className="text-xl font-bold font-mono tabular-nums" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-3.5 rounded-full bg-slate-800/80 overflow-hidden border border-white/[0.04] shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]">
        <motion.div
          className="h-full rounded-full transition-shadow duration-300"
          style={{ background: color, boxShadow: `0 0 16px ${color}50` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}
