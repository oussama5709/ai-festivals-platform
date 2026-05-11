@echo off
SETLOCAL EnableDelayedExpansion

:: ============================================================================
:: AI EVENTS RESEARCH INFRASTRUCTURE - AUTOMATIC SETUP (WINDOWS)
:: This script creates the complete project structure and initializes all files
:: ============================================================================

:: Configuration
set PROJECT_NAME=ai-events-research
set PROJECT_DIR=%CD%\%PROJECT_NAME%
:: Generate locale-independent timestamp
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value ^| find "="') do set datetime=%%I
set TIMESTAMP=%datetime:~0,14%
set LOG_FILE=%PROJECT_DIR%\setup_%TIMESTAMP%.log

:: Colors (simulated with ANSI if supported, otherwise simple text)
:: Note: Windows 10+ supports ANSI in command prompt.
set RED=[31m
set GREEN=[32m
set YELLOW=[33m
set BLUE=[34m
set NC=[0m

echo.
echo %BLUE%================================================================%NC%
echo %BLUE%AI EVENTS RESEARCH INFRASTRUCTURE - SETUP%NC%
echo %BLUE%================================================================%NC%
echo.

:: STEP 1: CREATE ROOT DIRECTORY
echo [%date% %time%] Creating root project directory: %PROJECT_DIR%
if exist "%PROJECT_DIR%" (
    echo %YELLOW%WARNING: Directory %PROJECT_DIR% already exists!%NC%
    set /p "CONTINUE=Do you want to continue? (y/n): "
    if /i "!CONTINUE!" NEQ "y" (
        echo %RED%Setup cancelled%NC%
        exit /b 1
    )
) else (
    mkdir "%PROJECT_DIR%"
    echo %GREEN%Created %PROJECT_DIR%%NC%
)

:: Create log file
echo Initializing setup log > "%LOG_FILE%"

:: STEP 2: CREATE DIRECTORY STRUCTURE
echo [%date% %time%] Creating directory structure... >> "%LOG_FILE%"
echo Creating directory structure...

set DIRS=OLD_PROJECT src src\crawler src\crawler\core src\crawler\sources src\crawler\models src\crawler\tests src\intelligence src\intelligence\database src\intelligence\pipeline src\intelligence\ai_modules src\intelligence\tests src\backend src\backend\api src\backend\api\v1 src\backend\api\graphql src\backend\models src\backend\services src\backend\middleware src\backend\admin src\backend\tests src\frontend src\frontend\app src\frontend\app\events src\frontend\app\submit src\frontend\app\api src\frontend\components src\frontend\lib src\frontend\styles src\frontend\public database database\migrations database\seeds docker docker\nginx docker\monitoring kubernetes terraform monitoring monitoring\prometheus monitoring\grafana monitoring\alerting docs docs\architecture docs\api docs\crawler docs\intelligence docs\research docs\deployment docs\diagrams scripts notebooks logs logs\crawler logs\intelligence logs\api exports exports\dataset exports\historical tests tests\integration tests\e2e tests\performance .github .github\workflows .github\ISSUE_TEMPLATE

for %%d in (%DIRS%) do (
    if not exist "%PROJECT_DIR%\%%d" mkdir "%PROJECT_DIR%\%%d"
)
echo %GREEN%Created all directories%NC%

:: STEP 3: CREATE PYTHON FILES - CRAWLER LAYER
echo [%date% %time%] Creating Crawler Layer files... >> "%LOG_FILE%"
echo Creating Crawler Layer files...

:: src\crawler\__init__.py
(
echo """
echo Crawler Layer - Data Collection Module
echo Responsible for scraping events from multiple sources
echo """
echo.
echo from .core.base_source import BaseSource, SourceRegistry, registry
echo from .core.logger import setup_logging
echo.
echo __version__ = "1.0.0"
echo __all__ = ["BaseSource", "SourceRegistry", "registry", "setup_logging"]
) > "%PROJECT_DIR%\src\crawler\__init__.py"

:: src\crawler\main.py
(
echo """
echo Crawler Main Entry Point
echo Orchestrates crawling from all data sources
echo """
echo.
echo import asyncio
echo import logging
echo from datetime import datetime
echo from typing import List
echo.
echo from .core.base_source import BaseSource, registry
echo from .core.logger import setup_logging
echo from .sources.eventbrite import EventbriteSource
echo.
echo setup_logging^(^)
echo logger = logging.getLogger^(__name__^)
echo.
echo class CrawlerOrchestrator:
echo     """Orchestrate crawling from multiple sources"""
echo.
echo     def __init__^(self^):
echo         self.sources: List[BaseSource] = []
echo         self.results = []
echo.
echo     def register_sources^(self^):
echo         """Register all data sources"""
echo         self.sources = [
echo             EventbriteSource^(^),
echo             # TODO: Add more sources
echo         ]
echo.
echo         for source in self.sources:
echo             registry.register^(source^)
echo             logger.info^(f"Registered source: {source.name}"^)
echo.
echo     async def run_all_sources^(self^):
echo         """Run scraping for all sources"""
echo         logger.info^(f"Starting crawler for {len^(self.sources^)} sources"^)
echo.
echo         tasks = [source.scrape^(^) for source in self.sources]
echo         results = await asyncio.gather^(*tasks^)
echo.
echo         self.results = results
echo.
echo         # Log summary
echo         total_events = sum^(r.total_processed for r in results^)
echo         logger.info^(f"Crawling complete: {total_events} events collected"^)
echo.
echo         return results
echo.
echo async def main^(^):
echo     """Main crawler entry point"""
echo     crawler = CrawlerOrchestrator^(^)
echo     crawler.register_sources^(^)
echo     results = await crawler.run_all_sources^(^)
echo.
echo     for result in results:
echo         print^(f"{result.source}: {result.total_processed} events"^)
echo.
echo if __name__ == "__main__":
echo     asyncio.run^(main^(^)^)
) > "%PROJECT_DIR%\src\crawler\main.py"

:: src\crawler\config.py
(
echo """
echo Crawler Configuration
echo """
echo.
echo import os
echo from dotenv import load_dotenv
echo.
echo load_dotenv^(^)
echo.
echo # Crawler settings
echo CRAWLER_TIMEOUT_MS = int^(os.getenv^("CRAWLER_TIMEOUT_MS", "30000"^)^)
echo MAX_WORKERS = int^(os.getenv^("MAX_WORKERS", "5"^)^)
echo HEADLESS_MODE = os.getenv^("HEADLESS_MODE", "true"^).lower^(^) == "true"
echo USE_PROXY = os.getenv^("USE_PROXY", "false"^).lower^(^) == "true"
echo.
echo # Proxy settings
echo PROXY_LIST = os.getenv^("PROXY_LIST", ""^).split^(","^) if os.getenv^("PROXY_LIST"^) else []
echo.
echo # Rate limiting
echo RATE_LIMIT_PER_MINUTE = int^(os.getenv^("RATE_LIMIT_PER_MINUTE", "60"^)^)
echo.
echo # Logging
echo LOG_LEVEL = os.getenv^("LOG_LEVEL", "INFO"^)
echo LOG_FORMAT = "json"  # or "text"
) > "%PROJECT_DIR%\src\crawler\config.py"

:: STEP 4: CREATE CORE FILES
echo Creating Core files...
:: src\crawler\core\base_source.py (Porting logic)
:: Using a separate heredoc-like block to handle complex Python content
(
echo """
echo BASE SOURCE - Abstract Interface for All Data Sources
echo """
echo.
echo from abc import ABC, abstractmethod
echo from dataclasses import dataclass
echo from typing import List, Dict, Any, Optional
echo from datetime import datetime
echo from enum import Enum
echo import logging
echo.
echo logger = logging.getLogger^(__name__^)
echo.
echo class EventType^(Enum^):
echo     """Standardized event types"""
echo     CONFERENCE = "conference"
echo     WORKSHOP = "workshop"
echo     WEBINAR = "webinar"
echo     MEETUP = "meetup"
echo     HACKATHON = "hackathon"
echo     SUMMIT = "summit"
echo     COURSE = "course"
echo     SEMINAR = "seminar"
echo.
echo @dataclass
echo class RawEvent:
echo     """Raw event data from any source"""
echo     source: str
echo     title: str
echo     description: Optional[str] = None
echo     start_date: Optional[str] = None
echo     end_date: Optional[str] = None
echo     location_raw: Optional[str] = None
echo     location_city: Optional[str] = None
echo     location_country: Optional[str] = None
echo     url: Optional[str] = None
echo     event_type: Optional[str] = None
echo     is_online: bool = False
echo     is_free: Optional[bool] = None
echo     price: Optional[float] = None
echo     currency: Optional[str] = None
echo     has_cfp: bool = False
echo     submission_deadline: Optional[str] = None
echo     submission_fee: Optional[float] = None
echo     keywords: List[str] = None
echo     metadata: Dict[str, Any] = None
echo     raw_html: Optional[str] = None
echo     scraped_at: datetime = None
echo.
echo     def __post_init__^(self^):
echo         if self.keywords is None:
echo             self.keywords = []
echo         if self.metadata is None:
echo             self.metadata = {}
echo         if self.scraped_at is None:
echo             self.scraped_at = datetime.utcnow^(^)
echo.
echo     def to_dict^(self^) -^> Dict[str, Any]:
echo         return {
echo             'source': self.source,
echo             'title': self.title,
echo             'description': self.description,
echo             'start_date': self.start_date,
echo             'end_date': self.end_date,
echo             'location_raw': self.location_raw,
echo             'location_city': self.location_city,
echo             'location_country': self.location_country,
echo             'url': self.url,
echo             'event_type': self.event_type,
echo             'is_online': self.is_online,
echo             'is_free': self.is_free,
echo             'price': self.price,
echo             'currency': self.currency,
echo             'has_cfp': self.has_cfp,
echo             'submission_deadline': self.submission_deadline,
echo             'submission_fee': self.submission_fee,
echo             'keywords': self.keywords,
echo             'metadata': self.metadata,
echo             'scraped_at': self.scraped_at.isoformat^(^)
echo         }
echo.
echo @dataclass
echo class ScrapeResult:
echo     """Result of a scraping operation"""
echo     source: str
echo     events: List[RawEvent]
echo     total_found: int
echo     total_processed: int
echo     errors: List[str]
echo     warnings: List[str]
echo     started_at: datetime
echo     completed_at: datetime
echo     success: bool = True
echo.
echo     @property
echo     def duration_seconds^(self^) -^> float:
echo         return ^(self.completed_at - self.started_at^).total_seconds^(^)
echo.
echo     @property
echo     def success_rate^(self^) -^> float:
echo         if self.total_found == 0:
echo             return 0.0
echo         return ^(self.total_processed / self.total_found^) * 100
echo.
echo class BaseSource^(ABC^):
echo     """Abstract base class for all data sources"""
echo.
echo     def __init__^(self, name: str, config: Dict[str, Any] = None^):
echo         self.name = name
echo         self.config = config or {}
echo         self.logger = logging.getLogger^(f"source.{name}"^)
echo         self.events: List[RawEvent] = []
echo         self.errors: List[str] = []
echo         self.warnings: List[str] = []
echo.
echo     @abstractmethod
echo     async def scrape^(self^) -^> ScrapeResult:
echo         """Main scraping method - must be implemented by subclasses"""
echo         pass
echo.
echo     @abstractmethod
echo     def validate_config^(self^) -^> bool:
echo         """Validate configuration before scraping"""
echo         pass
echo.
echo     def add_event^(self, event: RawEvent^) -^> None:
echo         self.events.append^(event^)
echo         self.logger.debug^(f"Added event: {event.title}"^)
echo.
echo     def add_error^(self, error: str^) -^> None:
echo         self.errors.append^(error^)
echo         self.logger.error^(error^)
echo.
echo     def add_warning^(self, warning: str^) -^> None:
echo         self.warnings.append^(warning^)
echo         self.logger.warning^(warning^)
echo.
echo     def reset^(self^) -^> None:
echo         self.events = []
echo         self.errors = []
echo         self.warnings = []
echo.
echo     async def health_check^(self^) -^> bool:
echo         try:
echo             self.logger.info^(f"Health check for {self.name}"^)
echo             return True
echo         except Exception as e:
echo             self.logger.error^(f"Health check failed: {e}"^)
echo             return False
echo.
echo     def get_result^(self, started_at: datetime, completed_at: datetime^) -^> ScrapeResult:
echo         return ScrapeResult^(
echo             source=self.name,
echo             events=self.events,
echo             total_found=len^(self.events^),
echo             total_processed=len^(self.events^),
echo             errors=self.errors,
echo             warnings=self.warnings,
echo             started_at=started_at,
echo             completed_at=completed_at,
echo             success=len^(self.errors^) == 0
echo         ^)
echo.
echo class SourceRegistry:
echo     """Registry for managing all sources"""
echo.
echo     def __init__^(self^):
echo         self.sources: Dict[str, BaseSource] = {}
echo.
echo     def register^(self, source: BaseSource^) -^> None:
echo         if source.name in self.sources:
echo             raise ValueError^(f"Source '{source.name}' already registered"^)
echo         self.sources[source.name] = source
echo         logger.info^(f"Registered source: {source.name}"^)
echo.
echo     def get^(self, name: str^) -^> Optional[BaseSource]:
echo         return self.sources.get^(name^)
echo.
echo     def get_all^(self^) -^> Dict[str, BaseSource]:
echo         return self.sources.copy^(^)
echo.
echo     def list^(self^) -^> List[str]:
echo         return list^(self.sources.keys^(^)^)
echo.
echo registry = SourceRegistry^(^)
) > "%PROJECT_DIR%\src\crawler\core\base_source.py"

:: src\crawler\core\logger.py
(
echo """
echo Logger Setup - Structured Logging
echo """
echo.
echo import logging
echo import json
echo from datetime import datetime
echo.
echo class JsonFormatter^(logging.Formatter^):
echo     """Format logs as JSON"""
echo.
echo     def format^(self, record: logging.LogRecord^) -^> str:
echo         log_obj = {
echo             'timestamp': datetime.utcnow^(^).isoformat^(^),
echo             'level': record.levelname,
echo             'logger': record.name,
echo             'message': record.getMessage^(^),
echo             'module': record.module,
echo             'function': record.funcName,
echo             'line': record.lineno,
echo         }
echo.
echo         if record.exc_info:
echo             log_obj['exception'] = self.formatException^(record.exc_info^)
echo.
echo         return json.dumps^(log_obj^)
echo.
echo def setup_logging^(level=logging.INFO^):
echo     """Setup structured logging"""
echo     root_logger = logging.getLogger^(^)
echo     root_logger.setLevel^(level^)
echo.
echo     # Console handler
echo     handler = logging.StreamHandler^(^)
echo     handler.setFormatter^(JsonFormatter^(^)^)
echo     root_logger.addHandler^(handler^)
echo.
echo     return root_logger
) > "%PROJECT_DIR%\src\crawler\core\logger.py"

:: ... continues for other layers (simplified for readability in this sample)

:: requirements.txt
(
echo PLAYWRIGHT==1.40.0
echo AIOHTTP==3.9.0
echo BEAUTIFULSOUP4==4.12.0
echo FASTAPI==0.104.0
echo UVICORN==0.24.0
echo SQLALCHEMY==2.0.0
echo PSYCHOPG2-BINARY==2.9.9
echo PANDAS==2.1.0
echo NUMPY==1.24.0
echo PYTHON-DOTENV==1.0.0
echo PYDANTIC==2.5.0
echo REQUESTS==2.31.0
echo PYTEST==7.4.0
echo PYTEST-ASYNCIO==0.21.0
echo BLACK==23.11.0
echo FLAKE8==6.1.0
echo ISORT==5.12.0
) > "%PROJECT_DIR%\requirements.txt"

:: .env.example
(
echo # Database
echo DATABASE_URL=postgresql://user:password@localhost/ai_events_research
echo REDIS_URL=redis://localhost:6379
echo.
echo # Crawler
echo CRAWLER_TIMEOUT_MS=30000
echo MAX_WORKERS=5
echo HEADLESS_MODE=true
echo RATE_LIMIT_PER_MINUTE=60
echo.
echo # API
echo API_PORT=8000
echo API_HOST=0.0.0.0
echo.
echo # Logging
echo LOG_LEVEL=INFO
echo.
echo # External APIs
echo EVENTBRITE_API_KEY=your_key_here
echo OPENAI_API_KEY=your_key_here
) > "%PROJECT_DIR%\.env.example"

:: README.md
(
echo # AI Events Research Infrastructure
echo.
echo Production-grade platform for aggregating, analyzing, and publishing AI-related events worldwide.
echo.
echo ## 📋 Overview
echo.
echo This is a **3-layer research infrastructure** for building a comprehensive, public dataset of AI events:
echo.
echo 1. **Data Collection Layer** - Multi-source crawler with anti-detection
echo 2. **Research Intelligence Layer** - Data cleaning, deduplication, and AI relevance scoring
echo 3. **Community Hub Layer** - Public API and web interface for the research community
echo.
echo ## 🚀 Quick Start
echo.
echo ### Prerequisites
echo - Python 3.10+
echo - PostgreSQL 13+
echo - Docker ^& Docker Compose ^(optional^)
echo - Node.js 18+ ^(for frontend^)
echo.
echo ### Installation
echo.
echo ```bash
echo git clone https://github.com/yourusername/ai-events-research.git
echo cd ai-events-research
echo.
echo # Create virtual environment
echo python -m venv venv
echo venv\Scripts\activate
echo.
echo # Install dependencies
echo pip install -r requirements.txt
echo.
echo # Setup database
echo createdb ai_events_research
echo psql ai_events_research ^< database/schema.sql
echo.
echo # Copy environment file
echo copy .env.example .env
echo ```
) > "%PROJECT_DIR%\README.md"

:: FINAL SUMMARY
echo.
echo %GREEN%================================================================%NC%
echo %GREEN%✓ PROJECT SETUP COMPLETE!%NC%
echo %GREEN%================================================================%NC%
echo.
echo Project Location: %PROJECT_DIR%
echo.
echo Next Steps:
echo 1. cd %PROJECT_NAME%
echo 2. python -m venv venv ^&^& venv\Scripts\activate
echo 3. pip install -r requirements.txt
echo 4. copy .env.example .env
echo.
echo Happy coding! 🚀

pause
