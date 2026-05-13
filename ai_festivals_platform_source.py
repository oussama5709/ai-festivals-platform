"""
AiFestivalsPlatformSource
─────────────────────────
Drop-in data source for the ai-events-research crawler.
Pulls events from the live AI Festivals Platform API and converts
them to RawEvent objects that integrate seamlessly with the pipeline.

Usage
─────
    # In your sources registry / main.py:
    from sources.ai_festivals_platform_source import AiFestivalsPlatformSource

    sources = [
        AiFestivalsPlatformSource(),                                  # worldwide, quality ≥ 0.5
        AiFestivalsPlatformSource(region="middle-east", min_quality=0.7),
        AiFestivalsPlatformSource(region="africa",      min_quality=0.5),
        AiFestivalsPlatformSource(region="europe",      min_quality=0.6),
    ]

Install
───────
    pip install aiohttp --break-system-packages
    # (aiohttp is already in ai-events-research requirements.txt)
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

import aiohttp

# ── Adjust this import to match your project structure ──────────────────────
# Common paths:
#   from src.crawler.core.base_source import BaseSource, RawEvent, ScrapeResult
#   from crawler.core.base_source import BaseSource, RawEvent, ScrapeResult
#   from .base_source import BaseSource, RawEvent, ScrapeResult
try:
    from src.crawler.core.base_source import BaseSource, RawEvent, ScrapeResult
except ImportError:
    from crawler.core.base_source import BaseSource, RawEvent, ScrapeResult

logger = logging.getLogger(__name__)

# ── Constants ────────────────────────────────────────────────────────────────

API_BASE_URL = "https://ai-festivals-platform.onrender.com"
PAGE_SIZE    = 100          # max events per API page
MAX_PAGES    = 10           # safety cap → 1000 events max per source instance
REQUEST_TIMEOUT_SECS = 30

VALID_REGIONS = {
    "worldwide", "middle-east", "africa", "europe", "asia", "americas",
}

VALID_TYPES = {
    "conference", "workshop", "webinar", "meetup", "summit", "hackathon", "course",
}


# ── Source class ─────────────────────────────────────────────────────────────

class AiFestivalsPlatformSource(BaseSource):
    """
    Fetches events from the AI Festivals Platform API
    (https://ai-festivals-platform.onrender.com/api/events).

    Each instance represents one (region, event_type, min_quality) slice,
    so you can run multiple instances in parallel for different regions.

    Parameters
    ──────────
    region : str
        One of: worldwide, middle-east, africa, europe, asia, americas.
        Defaults to "worldwide" (fetches all regions).
    event_type : str | None
        Filter to a single event type (conference, workshop, …).
        None = all types.
    min_quality : float
        Minimum quality score to include (0.0–1.0). Default 0.5.
    max_results : int
        Hard cap on events returned. Default 500.
    """

    def __init__(
        self,
        region:      str   = "worldwide",
        event_type:  Optional[str] = None,
        min_quality: float = 0.5,
        max_results: int   = 500,
    ) -> None:
        if region not in VALID_REGIONS:
            raise ValueError(f"Invalid region '{region}'. Must be one of: {VALID_REGIONS}")
        if event_type and event_type not in VALID_TYPES:
            raise ValueError(f"Invalid event_type '{event_type}'. Must be one of: {VALID_TYPES}")
        if not 0.0 <= min_quality <= 1.0:
            raise ValueError("min_quality must be between 0.0 and 1.0")

        # Source name encodes all params → stable dedup key across runs
        name_parts = ["ai-festivals-platform", region]
        if event_type:
            name_parts.append(event_type)
        name_parts.append(f"q{min_quality:.1f}")
        super().__init__(name="-".join(name_parts))

        self.region      = region
        self.event_type  = event_type
        self.min_quality = min_quality
        self.max_results = max_results

    # ── BaseSource interface ─────────────────────────────────────────────────

    def validate_config(self) -> bool:
        """No API key required — the platform is public."""
        return True

    async def scrape(self) -> ScrapeResult:
        started_at = datetime.utcnow()
        self.reset()

        self.logger.info(
            f"Starting scrape | region={self.region} type={self.event_type} "
            f"min_quality={self.min_quality} max_results={self.max_results}"
        )

        try:
            await self._fetch_all_pages()
        except Exception as exc:
            self.add_error(f"Scrape failed: {exc}")
            self.logger.exception("Unhandled error during scrape")

        completed_at = datetime.utcnow()
        result = self.get_result(started_at, completed_at)

        self.logger.info(
            f"Finished | events={result.total_processed} "
            f"errors={len(result.errors)} duration={result.duration_seconds:.1f}s"
        )
        return result

    # ── Pagination ───────────────────────────────────────────────────────────

    async def _fetch_all_pages(self) -> None:
        """Paginate through all API pages until max_results is reached."""
        timeout = aiohttp.ClientTimeout(total=REQUEST_TIMEOUT_SECS)

        async with aiohttp.ClientSession(timeout=timeout) as session:
            page = 1
            while page <= MAX_PAGES:
                remaining = self.max_results - len(self.events)
                if remaining <= 0:
                    break

                page_limit = min(PAGE_SIZE, remaining)
                raw_events = await self._fetch_page(session, page, page_limit)

                if not raw_events:
                    break  # no more pages

                for raw in raw_events:
                    event = self._map_to_raw_event(raw)
                    if event:
                        self.add_event(event)

                self.logger.debug(f"Page {page}: got {len(raw_events)} events")

                # Stop if API returned fewer items than requested (last page)
                if len(raw_events) < page_limit:
                    break

                page += 1

    async def _fetch_page(
        self,
        session: aiohttp.ClientSession,
        page:    int,
        limit:   int,
    ) -> List[Dict[str, Any]]:
        """Fetch a single page from /api/events. Returns list of raw dicts."""
        params: Dict[str, Any] = {
            "page":       page,
            "limit":      limit,
            "minQuality": self.min_quality,
            "sort":       "date",
        }
        if self.region != "worldwide":
            params["region"] = self.region
        if self.event_type:
            params["type"] = self.event_type

        url = f"{API_BASE_URL}/api/events"

        try:
            async with session.get(url, params=params) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return data.get("events", [])

                elif resp.status == 503:
                    # Render API waking up — wait and retry once
                    self.add_warning(f"API sleeping (503) on page {page} — skipping")
                    return []

                else:
                    self.add_error(f"HTTP {resp.status} on page {page}: {url}")
                    return []

        except aiohttp.ServerTimeoutError:
            self.add_warning(f"Timeout on page {page} — API may be sleeping")
            return []
        except aiohttp.ClientError as exc:
            self.add_error(f"Network error on page {page}: {exc}")
            return []

    # ── Mapping ──────────────────────────────────────────────────────────────

    def _map_to_raw_event(self, raw: Dict[str, Any]) -> Optional[RawEvent]:
        """
        Convert an API response dict to a RawEvent.

        API shape:
            {
                "id":           "clxyz...",
                "title":        "NeurIPS 2025",
                "description":  "...",
                "date":         "2025-12-09",
                "endDate":      "2025-12-15",
                "location":     "New Orleans, USA",
                "isOnline":     false,
                "url":          "https://nips.cc",
                "source":       "official-website",
                "region":       "worldwide",
                "regionArabic": "عالمي",
                "category":     "conference",
                "qualityScore": 0.95,
                "scrapedAt":    "2025-06-01T10:30:00.000Z"
            }
        """
        title = raw.get("title", "").strip()
        if not title:
            return None  # skip records with no title

        return RawEvent(
            # Stable ID so downstream dedup works across runs
            source=self.name,

            title=title,
            description=raw.get("description"),

            start_date=raw.get("date"),
            end_date=raw.get("endDate"),

            location_raw=raw.get("location"),
            location_city=self._extract_city(raw.get("location", "")),
            location_country=self._extract_country(raw.get("location", "")),

            url=raw.get("url"),

            event_type=raw.get("category", "other"),
            is_online=raw.get("isOnline", False),

            # Preserve quality score as metadata
            metadata={
                "source_id":       f"aifp_{raw.get('id', '')}",
                "quality_score":   raw.get("qualityScore", 0.0),
                "original_source": raw.get("source", "unknown"),
                "region":          raw.get("region", self.region),
                "region_arabic":   raw.get("regionArabic", ""),
                "scraped_at":      raw.get("scrapedAt", ""),
            },
        )

    @staticmethod
    def _extract_city(location: str) -> Optional[str]:
        """'New Orleans, USA' → 'New Orleans'"""
        if not location or location.lower() in ("online", "tbd", "virtual", "remote"):
            return None
        parts = location.split(",")
        return parts[0].strip() if parts else None

    @staticmethod
    def _extract_country(location: str) -> Optional[str]:
        """'New Orleans, USA' → 'USA'"""
        if not location:
            return None
        parts = location.split(",")
        return parts[-1].strip() if len(parts) >= 2 else None


# ── Convenience factory ──────────────────────────────────────────────────────

def all_regions_sources(min_quality: float = 0.5) -> List[AiFestivalsPlatformSource]:
    """
    Returns one source instance per region.
    Register all of them in your pipeline for maximum coverage.

    Example:
        from sources.ai_festivals_platform_source import all_regions_sources
        sources = all_regions_sources(min_quality=0.6)
    """
    return [
        AiFestivalsPlatformSource(region=r, min_quality=min_quality)
        for r in ["worldwide", "middle-east", "africa", "europe", "asia", "americas"]
    ]
