"""
Crawler Main Entry Point
Orchestrates crawling from all data sources
"""

import asyncio
import logging
from datetime import datetime
from typing import List

from .core.base_source import BaseSource, registry
from .core.logger import setup_logging
from .sources.eventbrite import EventbriteSource

setup_logging()
logger = logging.getLogger(__name__)

class CrawlerOrchestrator:
    """Orchestrate crawling from multiple sources"""

    def __init__(self):
        self.sources: List[BaseSource] = []
        self.results = []

    def register_sources(self):
        """Register all data sources"""
        self.sources = [
            EventbriteSource(),
            # TODO: Add more sources
        ]

        for source in self.sources:
            registry.register(source)
            logger.info(f"Registered source: {source.name}")

    async def run_all_sources(self):
        """Run scraping for all sources"""
        logger.info(f"Starting crawler for {len^(self.sources^)} sources")

        tasks = [source.scrape() for source in self.sources]
        results = await asyncio.gather(*tasks)

        self.results = results

        # Log summary
        total_events = sum(r.total_processed for r in results)
        logger.info(f"Crawling complete: {total_events} events collected")

        return results

async def main():
    """Main crawler entry point"""
    crawler = CrawlerOrchestrator()
    crawler.register_sources()
    results = await crawler.run_all_sources()

    for result in results:
        print(f"{result.source}: {result.total_processed} events")

if __name__ == "__main__":
    asyncio.run(main())
