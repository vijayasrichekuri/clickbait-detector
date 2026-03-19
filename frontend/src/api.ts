/**
 * API client for Clickbait Detector backend.
 * All requests go to same origin; Vite proxies /api to Flask.
 */

import type { AnalysisResult, HistoryEntry, NewsHeadline, NewsWithScore, AnalyticsData } from "./types";

const BASE = import.meta.env.VITE_API_URL;
console.log("API URL:", BASE);

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || res.statusText);
  }
  return res.json();
}

/** Analyze a single headline */
export async function analyzeHeadline(headline: string): Promise<AnalysisResult> {
  return request<AnalysisResult>("/api/analyze", {
    method: "POST",
    body: JSON.stringify({ headline: headline.trim() }),
  });
}

/** Analyze multiple headlines (batch, max 20) */
export async function analyzeBatch(headlines: string[]): Promise<{ results: AnalysisResult[] }> {
  const list = headlines.map((h) => h.trim()).filter(Boolean).slice(0, 20);
  return request<{ results: AnalysisResult[] }>("/api/analyze/batch", {
    method: "POST",
    body: JSON.stringify({ headlines: list }),
  });
}

/** Fetch real-time news headlines */
export async function fetchNews(limit = 30): Promise<{ headlines: NewsHeadline[] }> {
  return request<{ headlines: NewsHeadline[] }>(`/api/news?limit=${limit}`);
}

/** Analyze multiple headlines (e.g. from news scanner) */
export async function analyzeNewsHeadlines(
  headlines: NewsHeadline[]
): Promise<{ results: NewsWithScore[] }> {
  return request<{ results: NewsWithScore[] }>("/api/news/analyze", {
    method: "POST",
    body: JSON.stringify({ headlines }),
  });
}

/** Get analysis history */
export async function getHistory(limit = 100): Promise<{ history: HistoryEntry[] }> {
  return request<{ history: HistoryEntry[] }>(`/api/history?limit=${limit}`);
}

/** Get analytics summary */
export async function getAnalytics(): Promise<AnalyticsData> {
  return request<AnalyticsData>("/api/analytics");
}

/** Get trigger phrases list */
export async function getTriggers(): Promise<{ triggers: string[] }> {
  return request<{ triggers: string[] }>("/api/triggers");
}

/** Export report as JSON (returns same as analyze) */
export async function exportJson(headline: string): Promise<AnalysisResult> {
  return request<AnalysisResult>("/api/export/json", {
    method: "POST",
    body: JSON.stringify({ headline }),
  });
}

/** Download PDF report; returns blob URL */
export async function exportPdf(headline: string): Promise<string> {
  const res = await fetch(`${BASE}/api/export/pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ headline }),
  });
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
