"""
Crawler Layer - Data Collection Module
Responsible for scraping events from multiple sources
"""

from .core.base_source import BaseSource, SourceRegistry, registry
from .core.logger import setup_logging

__version__ = "1.0.0"
__all__ = ["BaseSource", "SourceRegistry", "registry", "setup_logging"]
