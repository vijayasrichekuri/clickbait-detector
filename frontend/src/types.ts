/** API response from /api/analyze */
export interface AnalysisResult {
  headline: string;
  probability: number;
  classification: "clickbait" | "not_clickbait";
  confidence: string;
  triggers: { phrase: string; start: number; end: number; weight: string }[];
  word_heatmap: { word: string; contribution: number; level: "high" | "medium" | "low" }[];
  explanation: string;
  error?: string;
}

/** Single history entry */
export interface HistoryEntry {
  headline: string;
  probability: number;
  classification: string;
  timestamp: string;
}

/** News headline from scanner */
export interface NewsHeadline {
  title: string;
  source: string;
  url: string;
}

/** News item with analysis */
export interface NewsWithScore extends NewsHeadline {
  probability: number;
  classification: string;
}

/** Analytics payload */
export interface AnalyticsData {
  total: number;
  clickbait_count: number;
  not_clickbait_count: number;
  average_probability: number;
  trigger_counts: { phrase: string; count: number }[];
}
