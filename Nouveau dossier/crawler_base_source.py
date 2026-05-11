"""
BASE SOURCE - Abstract Interface for All Data Sources
Core module for creating pluggable source adapters
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
        """Convert to dictionary for storage"""
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
        """Duration in seconds"""
        return (self.completed_at - self.started_at).total_seconds()
    
    @property
    def success_rate(self) -> float:
        """Percentage of events successfully scraped"""
        if self.total_found == 0:
            return 0.0
        return (self.total_processed / self.total_found) * 100
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'source': self.source,
            'total_found': self.total_found,
            'total_processed': self.total_processed,
            'success_rate': self.success_rate,
            'duration_seconds': self.duration_seconds,
            'errors_count': len(self.errors),
            'warnings_count': len(self.warnings),
            'success': self.success
        }


class BaseSource(ABC):
    """
    Abstract base class for all data sources
    All source adapters must inherit from this class
    """
    
    def __init__(self, name: str, config: Dict[str, Any] = None):
        """
        Initialize source
        
        Args:
            name: Unique source identifier (e.g., 'eventbrite')
            config: Configuration dictionary for this source
        """
        self.name = name
        self.config = config or {}
        self.logger = logging.getLogger(f"source.{name}")
        self.events: List[RawEvent] = []
        self.errors: List[str] = []
        self.warnings: List[str] = []
    
    @abstractmethod
    async def scrape(self) -> ScrapeResult:
        """
        Main scraping method - must be implemented by subclasses
        
        Returns:
            ScrapeResult with events, errors, and metadata
        """
        pass
    
    @abstractmethod
    def validate_config(self) -> bool:
        """
        Validate configuration before scraping
        
        Returns:
            True if config is valid, False otherwise
        """
        pass
    
    def add_event(self, event: RawEvent) -> None:
        """Add event to collection"""
        self.events.append(event)
        self.logger.debug(f"Added event: {event.title}")
    
    def add_error(self, error: str) -> None:
        """Add error message"""
        self.errors.append(error)
        self.logger.error(error)
    
    def add_warning(self, warning: str) -> None:
        """Add warning message"""
        self.warnings.append(warning)
        self.logger.warning(warning)
    
    def reset(self) -> None:
        """Reset scraper state"""
        self.events = []
        self.errors = []
        self.warnings = []
    
    async def health_check(self) -> bool:
        """
        Check if source is accessible
        Implement custom health checks in subclasses
        
        Returns:
            True if source is accessible
        """
        try:
            self.logger.info(f"Health check for {self.name}")
            return True
        except Exception as e:
            self.logger.error(f"Health check failed: {e}")
            return False
    
    def get_result(self, started_at: datetime, completed_at: datetime) -> ScrapeResult:
        """Create ScrapeResult from current state"""
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
    
    def __repr__(self) -> str:
        return f"<{self.__class__.__name__}(name={self.name})>"


class SourceRegistry:
    """Registry for managing all sources"""
    
    def __init__(self):
        self.sources: Dict[str, BaseSource] = {}
    
    def register(self, source: BaseSource) -> None:
        """Register a new source"""
        if source.name in self.sources:
            raise ValueError(f"Source '{source.name}' already registered")
        self.sources[source.name] = source
        logger.info(f"Registered source: {source.name}")
    
    def get(self, name: str) -> Optional[BaseSource]:
        """Get a source by name"""
        return self.sources.get(name)
    
    def get_all(self) -> Dict[str, BaseSource]:
        """Get all registered sources"""
        return self.sources.copy()
    
    def list(self) -> List[str]:
        """List all registered source names"""
        return list(self.sources.keys())
    
    def __len__(self) -> int:
        return len(self.sources)
    
    def __repr__(self) -> str:
        return f"<SourceRegistry({len(self)} sources)>"


# Global registry
registry = SourceRegistry()


def register_source(source: BaseSource) -> None:
    """Convenience function to register a source"""
    registry.register(source)


def get_source(name: str) -> Optional[BaseSource]:
    """Convenience function to get a source"""
    return registry.get(name)
