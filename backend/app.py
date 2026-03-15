"""
Flask API for AI Clickbait Detector.
Endpoints: analyze headline, news scanner, export report, history, analytics.
"""

import json
import os
from datetime import datetime
from io import BytesIO
from pathlib import Path

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

from model import predict, get_clickbait_triggers
from scraper import fetch_all_headlines

app = Flask(__name__)
CORS(app, origins=["https://clickbait-detector-j4t7.vercel.app", "http://localhost:3000", "http://127.0.0.1:3000"])

# In-memory history (use JSON file for persistence across restarts)
DATA_DIR = Path(__file__).parent / "data"
HISTORY_FILE = DATA_DIR / "history.json"


def ensure_data_dir():
    DATA_DIR.mkdir(exist_ok=True)


def load_history():
    ensure_data_dir()
    if not HISTORY_FILE.exists():
        return []
    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


def save_history(history):
    ensure_data_dir()
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history[-500:], f, indent=2)  # Keep last 500


# ✅ HOME ROUTE (ADDED)
@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "AI Clickbait Detector API is running 🚀",
        "available_endpoints": [
            "/api/health",
            "/api/analyze",
            "/api/analyze/batch",
            "/api/news",
            "/api/news/analyze",
            "/api/history",
            "/api/triggers",
            "/api/analytics",
            "/api/export/json",
            "/api/export/pdf"
        ]
    })


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "clickbait-detector"})


@app.route("/api/analyze", methods=["POST"])
def analyze():
    """Analyze a headline; return probability, classification, triggers, heatmap, explanation."""
    data = request.get_json() or {}
    headline = (data.get("headline") or "").strip()
    if not headline:
        return jsonify({"error": "Missing headline"}), 400

    result = predict(headline)

    # Append to history
    history = load_history()
    history.append({
        "headline": headline,
        "probability": result["probability"],
        "classification": result["classification"],
        "timestamp": datetime.utcnow().isoformat() + "Z",
    })
    save_history(history)

    return jsonify(result)


@app.route("/api/analyze/batch", methods=["POST"])
def analyze_batch():
    """Analyze multiple headlines. Body: { "headlines": ["...", "..."] }. Max 20."""
    data = request.get_json() or {}
    headlines = data.get("headlines") or []
    if not headlines:
        return jsonify({"error": "Missing headlines"}), 400
    headlines = [str(h).strip() for h in headlines if str(h).strip()][:20]
    results = []
    for h in headlines:
        result = predict(h)
        results.append(result)
        history = load_history()
        history.append({
            "headline": h,
            "probability": result["probability"],
            "classification": result["classification"],
            "timestamp": datetime.utcnow().isoformat() + "Z",
        })
        save_history(history)
    return jsonify({"results": results})


@app.route("/api/news", methods=["GET"])
def news():
    """Fetch real-time news headlines (from RSS/scraping)."""
    limit = request.args.get("limit", 30, type=int)
    limit = min(max(limit, 5), 50)
    headlines = fetch_all_headlines(max_total=limit)
    return jsonify({"headlines": headlines})


@app.route("/api/news/analyze", methods=["POST"])
def news_analyze():
    """Analyze a list of headlines."""
    data = request.get_json() or {}
    headlines = data.get("headlines") or []
    if not headlines:
        return jsonify({"error": "Missing headlines"}), 400

    results = []
    for item in headlines:
        title = item.get("title") or item.get("headline") or ""
        if not title:
            continue
        analysis = predict(title)
        results.append({
            "title": title,
            "source": item.get("source", ""),
            "url": item.get("url", ""),
            "probability": analysis["probability"],
            "classification": analysis["classification"],
        })

    return jsonify({"results": results})


@app.route("/api/history", methods=["GET"])
def history():
    """Return analysis history (latest first)."""
    h = load_history()
    limit = request.args.get("limit", 100, type=int)
    return jsonify({"history": list(reversed(h[-limit:]))})


@app.route("/api/triggers", methods=["GET"])
def triggers():
    """Return list of clickbait trigger phrases."""
    return jsonify({"triggers": get_clickbait_triggers()})


@app.route("/api/analytics", methods=["GET"])
def analytics():
    """Aggregate stats from history."""
    from collections import Counter
    h = load_history()
    if not h:
        return jsonify({
            "total": 0,
            "clickbait_count": 0,
            "not_clickbait_count": 0,
            "average_probability": 0,
            "trigger_counts": [],
        })

    total = len(h)
    clickbait_count = sum(1 for x in h if x.get("classification") == "clickbait")
    not_clickbait_count = total - clickbait_count
    probs = [x.get("probability", 0) for x in h if isinstance(x.get("probability"), (int, float))]
    avg_prob = sum(probs) / len(probs) if probs else 0

    trigger_counts = Counter()
    for entry in h[-200:]:
        hl = entry.get("headline", "")
        if not hl:
            continue
        res = predict(hl)
        for t in res.get("triggers", []):
            trigger_counts[t["phrase"]] += 1

    return jsonify({
        "total": total,
        "clickbait_count": clickbait_count,
        "not_clickbait_count": not_clickbait_count,
        "average_probability": round(avg_prob, 4),
        "trigger_counts": [{"phrase": k, "count": v} for k, v in trigger_counts.most_common(15)],
    })


@app.route("/api/export/json", methods=["POST"])
def export_json():
    data = request.get_json() or {}
    if data.get("headline"):
        result = predict(data["headline"])
    else:
        result = data
    return jsonify(result)


@app.route("/api/export/pdf", methods=["POST"])
def export_pdf():
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    except ImportError:
        return jsonify({"error": "reportlab not installed"}), 500

    data = request.get_json() or {}
    headline = (data.get("headline") or "").strip()
    if not headline:
        return jsonify({"error": "Missing headline"}), 400

    result = predict(headline)

    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter)

    styles = getSampleStyleSheet()
    story = [
        Paragraph("Clickbait Detection Report", styles["Heading1"]),
        Spacer(1, 20),
        Paragraph(f"<b>Headline:</b> {headline}", styles["Normal"]),
        Paragraph(f"<b>Prediction:</b> {result['classification']}", styles["Normal"]),
        Paragraph(f"<b>Probability:</b> {result['probability']:.0%}", styles["Normal"]),
    ]

    doc.build(story)
    buf.seek(0)

    return send_file(
        buf,
        mimetype="application/pdf",
        as_attachment=True,
        download_name="clickbait-report.pdf",
    )


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)