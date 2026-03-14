"""
Real-time news headline scraper.
Fetches headlines from BBC, CNN, Reuters, and RSS feeds.
"""

import re
import feedparser
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

# RSS feeds (reliable, no scraping needed)
RSS_FEEDS = [
    ("BBC Top Stories", "http://feeds.bbci.co.uk/news/rss.xml"),
    ("BBC World", "http://feeds.bbci.co.uk/news/world/rss.xml"),
    ("CNN Top Stories", "http://rss.cnn.com/rss/cnn_topstories.rss"),
    ("NPR News", "https://feeds.npr.org/1001/rss.xml"),
    ("Al Jazeera", "https://www.aljazeera.com/xml/rss/all.xml"),
    ("Reuters", "https://feeds.reuters.com/reuters/topNews"),
]

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)


def fetch_rss_headlines(max_per_feed=5, max_total=30):
    """
    Fetch headlines from RSS feeds.
    Returns list of { "title": str, "source": str, "url": str }
    """
    headlines = []
    seen_titles = set()

    for source_name, url in RSS_FEEDS:
        try:
            resp = requests.get(url, timeout=10, headers={"User-Agent": USER_AGENT})
            resp.raise_for_status()
            feed = feedparser.parse(resp.content)
            count = 0
            for entry in feed.entries:
                if count >= max_per_feed:
                    break
                title = (entry.get("title") or "").strip()
                if not title or title in seen_titles:
                    continue
                seen_titles.add(title)
                link = entry.get("link") or ""
                headlines.append({"title": title, "source": source_name, "url": link})
                count += 1
        except Exception:
            continue

    return headlines[:max_total]


def fetch_bbc_headlines():
    """Scrape BBC News homepage for headline titles (fallback)."""
    url = "https://www.bbc.com/news"
    try:
        resp = requests.get(url, timeout=10, headers={"User-Agent": USER_AGENT})
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        headlines = []
        for tag in soup.select("[data-testid='card-headline'], .gs-c-promo-heading__title"):
            t = tag.get_text(strip=True)
            if t and len(t) > 10 and len(t) < 200:
                link = tag.find_parent("a")
                href = link.get("href", "") if link else ""
                if href and not href.startswith("http"):
                    href = urljoin("https://www.bbc.com", href)
                headlines.append({"title": t, "source": "BBC News", "url": href or url})
        return headlines[:15]
    except Exception:
        return []


def fetch_all_headlines(max_total=30):
    """
    Fetch headlines from RSS first; optionally supplement with BBC scrape.
    Returns list of { "title": str, "source": str, "url": str }
    """
    items = fetch_rss_headlines(max_per_feed=8, max_total=max_total)
    if len(items) < max_total:
        bbc = fetch_bbc_headlines()
        seen = {h["title"] for h in items}
        for h in bbc:
            if h["title"] not in seen and len(items) < max_total:
                seen.add(h["title"])
                items.append(h)
    return items
