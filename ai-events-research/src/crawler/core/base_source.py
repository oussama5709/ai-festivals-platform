"""
BASE SOURCE - Abstract Interface for All Data Sources
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum
import logging

logger = logging.getLogger(__name__)

class EventType(Enum):
    """Standardized event types"""
    CONFERENCE = "conference"
    WORKSHOP = "workshop"
    WEBINAR = "webinar"
    MEETUP = "meetup"
    HACKATHON = "hackathon"
    SUMMIT = "summit"
    COURSE = "course"
    SEMINAR = "seminar"

@dataclass
class RawEvent:
    """Raw event data from any source"""
    source: str
    title: str
    description: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    location_raw: Optional[str] = None
    location_city: Optional[str] = None
    location_country: Optional[str] = None
    url: Optional[str] = None
    event_type: Optional[str] = None
    is_online: bool = False
    is_free: Optional[bool] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    has_cfp: bool = False
    submission_deadline: Optional[str] = None
    submission_fee: Optional[float] = None
    keywords: List[str] = None
    metadata: Dict[str, Any] = None
    raw_html: Optional[str] = None
    scraped_at: datetime = None

    def __post_init__(self):
        if self.keywords is None:
            self.keywords = []
        if self.metadata is None:
            self.metadata = {}
        if self.scraped_at is None:
            self.scraped_at = datetime.utcnow()

    def to_dict(self) -> Dict[str, Any]:
        return {
            'source': self.source,
            'title': self.title,
            'description': self.description,
            'start_date': self.start_date,
            'end_date': self.end_date,
            'location_raw': self.location_raw,
            'location_city': self.location_city,
            'location_country': self.location_country,
            'url': self.url,
            'event_type': self.event_type,
            'is_online': self.is_online,
            'is_free': self.is_free,
            'price': self.price,
            'currency': self.currency,
            'has_cfp': self.has_cfp,
            'submission_deadline': self.submission_deadline,
            'submission_fee': self.submission_fee,
            'keywords': self.keywords,
            'metadata': self.metadata,
            'scraped_at': self.scraped_at.isoformat()
        }

@dataclass
class ScrapeResult:
    """Result of a scraping operation"""
    source: str
    events: List[RawEvent]
    total_found: int
    total_processed: int
    errors: List[str]
    warnings: List[str]
    started_at: datetime
    completed_at: datetime
    success: bool = True

    @property
    def duration_seconds(self) -> float:
        return (self.completed_at - self.started_at).total_seconds()

    @property
    def success_rate(self) -> float:
        if self.total_found == 0:
            return 0.0
        return (self.total_processed / self.total_found) * 100

class BaseSource(ABC):
    """Abstract base class for all data sources"""

    def __init__(self, name: str, config: Dict[str, Any] = None):
        self.name = name
        self.config = config or {}
        self.logger = logging.getLogger(f"source.{name}")
        self.events: List[RawEvent] = []
        self.errors: List[str] = []
        self.warnings: List[str] = []

    @abstractmethod
    async def scrape(self) -> ScrapeResult:
        """Main scraping method - must be implemented by subclasses"""
        pass

    @abstractmethod
    def validate_config(self) -> bool:
        """Validate configuration before scraping"""
        pass

    def add_event(self, event: RawEvent) -> None:
        self.events.append(event)
        self.logger.debug(f"Added event: {event.title}")

    def add_error(self, error: str) -> None:
        self.errors.append(error)
        self.logger.error(error)

    def add_warning(self, warning: str) -> None:
        self.warnings.append(warning)
        self.logger.warning(warning)

    def reset(self) -> None:
        self.events = []
        self.errors = []
        self.warnings = []

    async def health_check(self) -> bool:
        try:
            self.logger.info(f"Health check for {self.name}")
            return True
        except Exception as e:
            self.logger.error(f"Health check failed: {e}")
            return False

    def get_result(self, started_at: datetime, completed_at: datetime) -> ScrapeResult:
        return ScrapeResult(
            source=self.name,
            events=self.events,
            total_found=len(self.events),
            total_processed=len(self.events),
            errors=self.errors,
            warnings=self.warnings,
            started_at=started_at,
            completed_at=completed_at,
            success=len(self.errors) == 0
        )

class SourceRegistry:
    """Registry for managing all sources"""

    def __init__(self):
        self.sources: Dict[str, BaseSource] = {}

    def register(self, source: BaseSource) -> None:
        if source.name in self.sources:
            raise ValueError(f"Source '{source.name}' already registered")
        self.sources[source.name] = source
        logger.info(f"Registered source: {source.name}")

    def get(self, name: str) -> Optional[BaseSource]:
        return self.sources.get(name)

    def get_all(self) -> Dict[str, BaseSource]:
        return self.sources.copy()

    def list(self) -> List[str]:
        return list(self.sources.keys())

registry = SourceRegistry()
