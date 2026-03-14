# AI Clickbait Detector with Real-Time News Scanner

A full-stack AI web application that detects whether a news headline is clickbait or genuine using Machine Learning (TF-IDF + Logistic Regression) and NLP pattern detection.

![Stack](https://img.shields.io/badge/React-18-61dafb) ![Stack](https://img.shields.io/badge/Flask-3.0-green) ![Stack](https://img.shields.io/badge/scikit--learn-ML-orange) ![Stack](https://img.shields.io/badge/Tailwind-3-38bdf8)

## Features

- **Headline Clickbait Detection** – Enter a headline; get probability, classification (Clickbait / Not Clickbait), and confidence.
- **Clickbait Word Highlighting** – Suspicious phrases (e.g. "you won't believe", "shocking", "secret") are highlighted.
- **AI Explanation Panel** – Short reasoning for why the headline was classified as clickbait or not.
- **Probability Gauge** – Visual meter for clickbait probability (0–100%).
- **Word Heatmap (Explainable AI)** – Per-word contribution (high / medium / low) to the score.
- **Real-Time News Scanner** – Fetches headlines from BBC, CNN, NPR, Reuters, Al Jazeera (RSS) and shows clickbait scores.
- **Headline History** – All analyzed headlines stored locally with scores.
- **Analytics Dashboard** – Charts: clickbait vs real, average score, most common trigger words.
- **Export AI Report** – Download analysis as **PDF** or **JSON** (headline, prediction, probability, explanation, highlighted words).

## Tech Stack

| Layer        | Technologies                                      |
|-------------|----------------------------------------------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Chart.js, tsParticles |
| **Backend**  | Python 3, Flask, Flask-CORS                        |
| **ML**       | scikit-learn (TF-IDF, Logistic Regression), keyword pattern detection |
| **Scraping** | BeautifulSoup, requests, feedparser               |
| **Export**   | ReportLab (PDF)                                    |

## Project Structure

```
clickbait-detectorr/
├── backend/
│   ├── app.py          # Flask API (analyze, news, history, analytics, export)
│   ├── model.py        # ML model (TF-IDF + Logistic Regression, triggers, heatmap)
│   ├── scraper.py      # RSS/news headline fetcher
│   ├── requirements.txt
│   └── data/           # history.json (created at runtime)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Detector.tsx         # Main input + results
│   │   │   ├── ProbabilityMeter.tsx
│   │   │   ├── WordHeatmap.tsx
│   │   │   ├── HistoryPanel.tsx
│   │   │   ├── NewsScanner.tsx
│   │   │   ├── AnalyticsDashboard.tsx
│   │   │   └── ParticlesBackground.tsx
│   │   ├── App.tsx
│   │   ├── api.ts
│   │   ├── types.ts
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
└── README.md
```

## Setup

### 1. Backend (Python 3.8+)

On Windows, use `py` instead of `python` if `python` is not in your PATH.

```bash
cd backend
py -m venv venv
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Windows (CMD): venv\Scripts\activate.bat
# macOS/Linux: source venv/bin/activate
python -m pip install -r requirements.txt
py app.py
```

Backend runs at **http://127.0.0.1:5000**. The first request will train and cache the model (no dataset download required).

### 2. Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:3000**. Vite proxies `/api` to the Flask server.

### 3. Use the app

1. Open **http://localhost:3000** in a browser.
2. Enter a headline (or use a suggested one) and click **Analyze headline**.
3. View probability, classification, highlighted triggers, explanation, and word heatmap.
4. Use **Real-time news scanner** to load and score live headlines.
5. Check **History** and **Analytics dashboard**.
6. Export a report via **Export PDF** or **Export JSON**.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/api/analyze` | Body: `{ "headline": "..." }` → full analysis |
| GET    | `/api/news`    | Query: `?limit=30` → list of headlines |
| POST   | `/api/news/analyze` | Body: `{ "headlines": [{ "title", "source", "url" }] }` → scores |
| GET    | `/api/history`  | Query: `?limit=100` → analysis history |
| GET    | `/api/triggers` | List of clickbait trigger phrases |
| GET    | `/api/analytics` | Aggregated stats and trigger counts |
| POST   | `/api/export/json` | Body: `{ "headline": "..." }` → JSON report |
| POST   | `/api/export/pdf` | Body: `{ "headline": "..." }` → PDF download |

## UI Design

- **Theme**: Dark AI SaaS style (#020617 background, purple/cyan/blue accents).
- **Effects**: Glassmorphism cards, neon-style buttons, particle background (tsParticles), Framer Motion animations.
- **Responsive**: Single-column on mobile; grid layout on desktop.

## License

MIT.
