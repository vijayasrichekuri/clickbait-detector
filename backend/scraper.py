"""
Real-time news headlines via NewsAPI (top headlines for the US).
"""

import os

import requests

# NEWS_API_KEY must be set in the environment — add NEWS_API_KEY=your_key to a .env file
# and load it before starting the app (e.g. python-dotenv in app entrypoint), or export it in the shell.


def fetch_news_api():
    """
    Call NewsAPI top-headlines (country=us, pageSize=30).
    Returns list of { "title": str, "source": str, "url": str }.
    On failure or missing key, returns [] and prints an error for debugging.
    """
    api_key = (os.environ.get("NEWS_API_KEY") or "").strip()
    if not api_key:
        print("NewsAPI: NEWS_API_KEY is missing; add it to a .env file or the environment.")
        return []

    url = "https://newsapi.org/v2/top-headlines"
    params = {"country": "us", "pageSize": 30, "apiKey": api_key}

    try:
        resp = requests.get(url, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as e:
        print(f"NewsAPI request failed: {e}")
        return []
    except ValueError as e:
        print(f"NewsAPI response JSON error: {e}")
        return []

    if data.get("status") != "ok":
        print(f"NewsAPI error: {data.get('message', data)}")
        return []

    out = []
    for article in data.get("articles") or []:
        title = (article.get("title") or "").strip()
        if not title:
            continue
        src = article.get("source") or {}
        if isinstance(src, dict):
            source_name = (src.get("name") or "").strip() or "Unknown"
        else:
            source_name = str(src) if src else "Unknown"
        link = (article.get("url") or "").strip()
        out.append({"title": title, "source": source_name, "url": link})

    return out


def fetch_all_headlines(max_total=30):
    """
    Fetch headlines from NewsAPI.
    Returns list of { "title": str, "source": str, "url": str }
    """
    items = fetch_news_api()
    return items[:max_total]
