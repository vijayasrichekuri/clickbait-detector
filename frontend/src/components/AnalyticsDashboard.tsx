/**
 * Analytics dashboard: charts for clickbait vs real, average score, trigger words.
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
  PointElement,
  LineElement,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";
import { getAnalytics } from "../api";
import type { AnalyticsData } from "../types";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
  PointElement,
  LineElement
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: "#94a3b8" } },
  },
  scales: {
    x: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(255,255,255,0.05)" } },
    y: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(255,255,255,0.05)" } },
  },
};

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalytics()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <motion.div
        className="glass card-glow rounded-2xl p-6"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2 className="text-xl sm:text-2xl font-semibold text-white mb-5 flex items-center gap-3">
          <span className="text-2xl sm:text-3xl">📊</span> Analytics
        </h2>
        <div className="h-64 flex items-center justify-center">
          <span className="w-9 h-9 border-2 border-purple-500/30 border-t-purple-400 rounded-full animate-spin" />
        </div>
      </motion.div>
    );
  }

  if (!data || data.total === 0) {
    return (
      <motion.div
        className="glass card-glow rounded-2xl p-6"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2 className="text-xl sm:text-2xl font-semibold text-white mb-5 flex items-center gap-3">
          <span className="text-2xl sm:text-3xl">📊</span> Analytics
        </h2>
        <p className="text-slate-400 text-sm">Analyze some headlines to see analytics.</p>
      </motion.div>
    );
  }

  const doughnutData = {
    labels: ["Clickbait", "Not clickbait"],
    datasets: [
      {
        data: [data.clickbait_count, data.not_clickbait_count],
        backgroundColor: ["#f43f5e", "#10b981"],
        borderColor: ["#f43f5e", "#10b981"],
        borderWidth: 1,
      },
    ],
  };

  const triggerData = {
    labels: data.trigger_counts.slice(0, 8).map((t) => t.phrase),
    datasets: [
      {
        label: "Count",
        data: data.trigger_counts.slice(0, 8).map((t) => t.count),
        backgroundColor: "rgba(124, 58, 237, 0.6)",
        borderColor: "rgba(124, 58, 237, 1)",
        borderWidth: 1,
      },
    ],
  };

    return (
      <motion.div
        className="glass card-glow rounded-2xl p-6"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2 className="text-xl sm:text-2xl font-semibold text-white mb-6 flex items-center gap-3">
          <span className="text-2xl sm:text-3xl">📊</span> Analytics dashboard
        </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <p className="section-label mb-3">Clickbait vs real headlines</p>
          <div className="h-48 rounded-xl overflow-hidden">
            <Doughnut data={doughnutData} options={chartOptions} />
          </div>
        </div>
        <div>
          <p className="section-label mb-3">Most common trigger phrases</p>
          <div className="h-48 rounded-xl overflow-hidden">
            <Bar
              data={triggerData}
              options={{
                ...chartOptions,
                indexAxis: "y" as const,
              }}
            />
          </div>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <div className="px-5 py-3 rounded-xl bg-white/[0.06] border border-white/10 shadow-soft">
          <span className="text-slate-500 font-medium">Total analyzed: </span>
          <span className="text-white font-mono font-semibold tabular-nums">{data.total}</span>
        </div>
        <div className="px-5 py-3 rounded-xl bg-white/[0.06] border border-white/10 shadow-soft">
          <span className="text-slate-500 font-medium">Average clickbait score: </span>
          <span className="text-cyan-400 font-mono font-semibold tabular-nums">{Math.round(data.average_probability * 100)}%</span>
        </div>
      </div>
    </motion.div>
  );
}
