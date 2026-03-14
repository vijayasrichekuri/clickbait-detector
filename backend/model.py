"""
Clickbait Detection ML Model
Uses TF-IDF vectorization + Logistic Regression with keyword pattern detection.
"""

import re
import pickle
import os
from pathlib import Path

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

# Known clickbait trigger phrases (case-insensitive)
CLICKBAIT_TRIGGERS = [
    r"you won't believe",
    r"you won't believe what",
    r"this is why",
    r"what happened next",
    r"doctors hate",
    r"one weird trick",
    r"secret that",
    r"shocking",
    r"unbelievable",
    r"mind.?blow",
    r"mind blowing",
    r"revealed",
    r"secret",
    r"this one trick",
    r"number \d+ will",
    r"the reason why",
    r"what they don't want you to know",
    r"going viral",
    r"everyone is talking about",
    r"can't believe",
    r"will shock you",
    r"experts are stunned",
    r"nobody expected",
    r"the truth about",
    r"what (?:no )?one (?:is )?telling you",
    r"before and after",
    r"you need to see",
    r"wait for it",
    r"finally revealed",
    r"broke the internet",
    r"went viral",
    r"celebrities? (?:are )?(?:reacting|shocked)",
    r"(\d+) things you didn't know",
    r"(\d+) ways to",
    r"(\d+) reasons why",
    r"(\d+) secrets",
    r"(\d+) tricks",
    r"you'll never guess",
    r"the (\w+) they don't want you to know",
]

# Sample training data (clickbait vs genuine headlines)
# In production, load from external dataset (e.g. Clickbait Challenge)
SAMPLE_CLICKBAIT = [
    "You Won't Believe What This Celebrity Did Yesterday!",
    "This One Trick Will Save You Thousands",
    "Doctors Hate This One Weird Trick",
    "What Happened Next Will Shock You",
    "The Secret That Big Pharma Doesn't Want You To Know",
    "10 Things You Didn't Know About Your Body",
    "Scientists Discover Shocking Truth About Coffee",
    "This Is Why Everyone Is Talking About This Video",
    "You'll Never Guess What She Found In Her Garden",
    "Mind Blowing Discovery Changes Everything",
    "The Reason Why Experts Are Stunned",
    "What No One Is Telling You About Diet",
    "Before And After: You Need To See This",
    "Number 7 Will Blow Your Mind",
    "Celebrities Are Reacting To This News",
    "This Went Viral In Minutes",
    "The Truth About What They Don't Want You To Know",
    "Unbelievable: What Happened Next",
    "Revealed: The Secret That Could Change Your Life",
    "5 Tricks That Will Transform Your Morning",
]

SAMPLE_GENUINE = [
    "Scientists Discover New Planet in Habitable Zone",
    "Federal Reserve Announces Interest Rate Decision",
    "Local Council Approves New Housing Development",
    "Study Finds Moderate Exercise Improves Longevity",
    "Economy Grows 2.3% in Third Quarter",
    "Researchers Publish Findings on Climate Patterns",
    "Government Releases Updated Employment Statistics",
    "New Policy Takes Effect Next Month",
    "Conference Addresses Renewable Energy Solutions",
    "Report Highlights Progress in Medical Research",
    "Committee Recommends Changes to Education Bill",
    "Market Closes With Modest Gains",
    "Experts Discuss Future of Electric Vehicles",
    "Survey Shows Shift in Consumer Preferences",
    "Team Completes First Phase of Infrastructure Project",
    "Board Announces Quarterly Results",
    "Scientists Discover New Element",
    "Study Links Diet to Heart Health",
    "New Regulations Affect Industry Standards",
    "Research Suggests Benefits of Sleep",
]

MODEL_PATH = Path(__file__).parent / "model.pkl"


def get_clickbait_triggers():
    """Return list of trigger phrases for highlighting."""
    return [
        "you won't believe", "this is why", "shocking", "unbelievable",
        "mind blowing", "secret", "revealed", "doctors hate", "one weird trick",
        "what happened next", "this one trick", "experts are stunned",
        "went viral", "the truth about", "you need to see", "finally revealed",
    ]


def find_trigger_phrases(text: str) -> list[dict]:
    """
    Find clickbait trigger phrases in text. Returns list of
    { "phrase": str, "start": int, "end": int, "weight": str }
    """
    text_lower = text.lower()
    results = []
    triggers = get_clickbait_triggers()

    for phrase in triggers:
        start = text_lower.find(phrase)
        while start != -1:
            end = start + len(phrase)
            # Classify weight: curiosity-gap phrases = HIGH, others = MEDIUM
            if any(x in phrase for x in ["won't believe", "what happened", "one trick", "secret"]):
                weight = "high"
            elif any(x in phrase for x in ["shocking", "unbelievable", "mind blowing", "revealed"]):
                weight = "high"
            else:
                weight = "medium"
            results.append({"phrase": phrase, "start": start, "end": end, "weight": weight})
            start = text_lower.find(phrase, end)

    return sorted(results, key=lambda x: x["start"])


def get_word_contributions(text: str, vectorizer, model) -> list[dict]:
    """
    Estimate contribution of each word to clickbait score (for heatmap).
    Returns list of { "word": str, "contribution": float, "level": "high"|"medium"|"low" }
    """
    words = re.findall(r"\b\w+(?:'\w+)?\b", text.lower())
    if not words:
        return []

    # Get feature names and coefficients (LogisticRegression)
    if hasattr(model, "named_steps"):
        coef = model.named_steps["clf"].coef_[0]
        vocab = model.named_steps["vec"].get_feature_names_out()
    else:
        coef = model.coef_[0]
        vocab = vectorizer.get_feature_names_out()

    word_to_idx = {w: i for i, w in enumerate(vocab)}
    contributions = []

    for word in words:
        idx = word_to_idx.get(word)
        if idx is not None:
            c = float(coef[idx])
            contributions.append({"word": word, "raw": c})
        else:
            contributions.append({"word": word, "raw": 0.0})

    if not contributions:
        return [{"word": w, "contribution": 0, "level": "low"} for w in words]

    raw_min = min(c["raw"] for c in contributions)
    raw_max = max(c["raw"] for c in contributions)
    span = raw_max - raw_min if raw_max != raw_min else 1

    out = []
    for c in contributions:
        # Normalize to 0-1 (higher = more clickbait)
        norm = (c["raw"] - raw_min) / span
        if norm >= 0.66:
            level = "high"
        elif norm >= 0.33:
            level = "medium"
        else:
            level = "low"
        out.append({"word": c["word"], "contribution": round(norm, 2), "level": level})

    return out


def train_model():
    """Train TF-IDF + Logistic Regression and save to disk."""
    X = SAMPLE_CLICKBAIT + SAMPLE_GENUINE
    y = [1] * len(SAMPLE_CLICKBAIT) + [0] * len(SAMPLE_GENUINE)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    pipe = Pipeline([
        ("vec", TfidfVectorizer(max_features=5000, ngram_range=(1, 2), stop_words="english")),
        ("clf", LogisticRegression(max_iter=500, random_state=42)),
    ])
    pipe.fit(X_train, y_train)
    score = pipe.score(X_test, y_test)

    with open(MODEL_PATH, "wb") as f:
        pickle.dump(pipe, f)

    return score


def load_model():
    """Load trained model from disk. Train if not present."""
    if not MODEL_PATH.exists():
        train_model()

    with open(MODEL_PATH, "rb") as f:
        pipe = pickle.load(f)

    return pipe


def predict(headline: str):
    """
    Run full analysis: probability, classification, triggers, word contributions, explanation.
    """
    headline = (headline or "").strip()
    if not headline:
        return {
            "error": "Empty headline",
            "probability": 0,
            "classification": "unknown",
            "confidence": "low",
            "triggers": [],
            "word_heatmap": [],
            "explanation": "",
        }

    pipe = load_model()
    proba = pipe.predict_proba([headline])[0]
    clickbait_prob = float(proba[1])
    is_clickbait = clickbait_prob >= 0.5

    if clickbait_prob >= 0.8 or clickbait_prob <= 0.2:
        confidence = "high"
    elif clickbait_prob >= 0.6 or clickbait_prob <= 0.4:
        confidence = "medium"
    else:
        confidence = "low"

    triggers = find_trigger_phrases(headline)
    vectorizer = pipe.named_steps["vec"] if hasattr(pipe, "named_steps") else None
    word_heatmap = get_word_contributions(headline, vectorizer, pipe)

    # Build explanation
    explanation_parts = []
    if triggers:
        phrases = list(dict.fromkeys([t["phrase"] for t in triggers]))
        explanation_parts.append(
            f"This headline uses curiosity-gap or emotional phrases such as \"{phrases[0]}\"."
        )
        if len(phrases) > 1:
            other_phrases = ", ".join(f'"{p}"' for p in phrases[1:3])
            explanation_parts.append(f"Other trigger phrases: {other_phrases}.")
        explanation_parts.append(
            "Such phrases are commonly used in clickbait content to trigger emotional reactions or curiosity."
        )
    else:
        explanation_parts.append("No strong clickbait trigger phrases were detected in this headline.")
    if is_clickbait:
        explanation_parts.append(
            f"The model assigns a clickbait probability of {clickbait_prob:.0%}, indicating likely clickbait."
        )
    else:
        explanation_parts.append(
            f"The model assigns a clickbait probability of {clickbait_prob:.0%}, suggesting a more factual headline."
        )
    explanation = " ".join(explanation_parts)

    return {
        "headline": headline,
        "probability": round(clickbait_prob, 4),
        "classification": "clickbait" if is_clickbait else "not_clickbait",
        "confidence": confidence,
        "triggers": triggers,
        "word_heatmap": word_heatmap,
        "explanation": explanation,
    }
